"""
Service for generating safety metrics, analytical summaries, and PDF reports.
"""
import io
import uuid
from datetime import UTC, datetime, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.models import ActivityEvent
from app.auth.models import Family, FamilyMember, User
from app.reports.schemas import CategoryCount, DailyTrend, ReportSummaryResponse

CATEGORY_ARABIC_MAP = {
    "SAFE": "محتوى آمن (Safe)",
    "CYBERBULLYING": "تنمر إلكتروني (Cyberbullying)",
    "SEXUAL": "محتوى غير لائق (Sexual)",
    "VIOLENCE": "عنف وتهديد (Violence)",
    "HATE_SPEECH": "خطاب كراهية (Hate Speech)",
}


async def get_report_summary(
    db: AsyncSession,
    parent_id: uuid.UUID,
    child_id: uuid.UUID | None = None,
    days: int = 7,
) -> ReportSummaryResponse:
    """Generate analytical summary over the past N days."""
    now = datetime.now(UTC)
    start_date = now - timedelta(days=days)

    # Subquery for child IDs belonging to parent
    children_subquery = (
        select(FamilyMember.child_id)
        .join(Family, Family.id == FamilyMember.family_id)
        .where(Family.parent_id == parent_id)
    )
    if child_id:
        children_subquery = children_subquery.where(FamilyMember.child_id == child_id)

    # Base query for period
    events_query = (
        select(ActivityEvent)
        .where(
            ActivityEvent.child_id.in_(children_subquery),
            ActivityEvent.timestamp >= start_date,
        )
    )
    res = await db.execute(events_query)
    events = res.scalars().all()

    total = len(events)
    blocked = sum(1 for e in events if e.verdict == "BLOCKED")
    allowed = total - blocked
    safety_score = round(((allowed / total) * 100), 1) if total > 0 else 100.0

    # Threat breakdown
    category_counts: dict[str, int] = {}
    for e in events:
        if e.category != "SAFE":
            category_counts[e.category] = category_counts.get(e.category, 0) + 1

    threat_breakdown = [
        CategoryCount(
            category=cat,
            count=count,
            label_ar=CATEGORY_ARABIC_MAP.get(cat, cat),
        )
        for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Daily breakdown
    daily_stats: dict[str, dict[str, int]] = {}
    for i in range(days):
        d = (start_date + timedelta(days=i + 1)).strftime("%Y-%m-%d")
        daily_stats[d] = {"total": 0, "blocked": 0, "allowed": 0}

    for e in events:
        d = e.timestamp.strftime("%Y-%m-%d")
        if d in daily_stats:
            daily_stats[d]["total"] += 1
            if e.verdict == "BLOCKED":
                daily_stats[d]["blocked"] += 1
            else:
                daily_stats[d]["allowed"] += 1

    daily_trends = [
        DailyTrend(
            date=d,
            total=stats["total"],
            blocked=stats["blocked"],
            allowed=stats["allowed"],
        )
        for d, stats in daily_stats.items()
    ]

    # Child name lookup if specific child requested
    child_name = None
    if child_id:
        c_user = await db.get(User, child_id)
        if c_user:
            child_name = c_user.full_name

    return ReportSummaryResponse(
        child_id=str(child_id) if child_id else None,
        child_name=child_name,
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=now.strftime("%Y-%m-%d"),
        total_events=total,
        blocked_events=blocked,
        allowed_events=allowed,
        safety_score=safety_score,
        threat_breakdown=threat_breakdown,
        daily_trends=daily_trends,
    )


def generate_pdf_bytes(summary: ReportSummaryResponse) -> bytes:
    """Generate an executive PDF report using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#07365f"),
        alignment=1,  # Center
    )
    subtitle_style = ParagraphStyle(
        "SubTitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#387b94"),
        alignment=1,
    )
    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#07365f"),
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1b2533"),
    )

    elements = []

    # Title & Header
    elements.append(Paragraph("Safe Kids Guard - Parental Safety Report", title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("تقرير أمان محتوى الأطفال - جامعة جدة", subtitle_style))
    elements.append(Spacer(1, 16))

    # Period Info Table
    info_data = [
        ["Report Period", f"{summary.start_date} to {summary.end_date}"],
        ["Target Child", summary.child_name or "All Linked Children (الكل)"],
        ["Safety Score", f"{summary.safety_score}%"],
    ]
    info_table = Table(info_data, colWidths=[150, 390])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#edf5f8")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#07365f")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#b5d7e3")),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 16))

    # Key Metrics Table
    elements.append(Paragraph("Key Protection Metrics (مؤشرات الحماية)", section_style))
    elements.append(Spacer(1, 8))

    metrics_data = [
        ["Total Screen Checks", "Allowed Interactions", "Blocked Threats", "Safety Index"],
        [
            str(summary.total_events),
            str(summary.allowed_events),
            str(summary.blocked_events),
            f"{summary.safety_score}%",
        ],
    ]
    metrics_table = Table(metrics_data, colWidths=[135, 135, 135, 135])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#159cb7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#b5d7e3")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b5d7e3")),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 20))

    # Threat Breakdown Section
    elements.append(Paragraph("Threat Breakdown by Category (تفاصيل التهديدات)", section_style))
    elements.append(Spacer(1, 8))

    if summary.threat_breakdown:
        breakdown_data = [["Threat Category", "Occurrences", "Percentage of Threats"]]
        total_threats = max(summary.blocked_events, 1)
        for cat in summary.threat_breakdown:
            pct = round((cat.count / total_threats) * 100, 1)
            breakdown_data.append([cat.label_ar, str(cat.count), f"{pct}%"])

        breakdown_table = Table(breakdown_data, colWidths=[240, 150, 150])
        breakdown_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#07365f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b5d7e3")),
        ]))
        elements.append(breakdown_table)
    else:
        elements.append(
            Paragraph("No harmful threats detected during this period. Safe browsing maintained.", body_style)
        )

    elements.append(Spacer(1, 30))
    elements.append(
        Paragraph("Generated automatically by Safe Kids Guard Platform (حارس الأطفال الآمن) - University of Jeddah", subtitle_style)
    )

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
