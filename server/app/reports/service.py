"""
Service for generating safety metrics, analytical summaries, and PDF reports.
"""
import io
import os
import uuid
from datetime import UTC, datetime, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.models import ActivityEvent
from app.auth.models import Family, FamilyMember, User
from app.reports.schemas import CategoryCount, DailyTrend, ReportSummaryResponse

CATEGORY_ARABIC_MAP = {
    "SAFE": "محتوى آمن",
    "CYBERBULLYING": "تنمر إلكتروني",
    "SEXUAL": "محتوى غير لائق",
    "VIOLENCE": "عنف وتهديد",
    "HATE_SPEECH": "خطاب كراهية",
    "BLOCKED_APP": "تطبيق محظور",
    "BLACKLISTED_URL": "رابط محظور",
    "SCREEN_TIME": "تجاوز وقت الشاشة",
    "BEDTIME": "مخالفة وقت النوم",
}


def _register_arabic_font() -> str:
    """Register an Arabic-capable TrueType font for ReportLab PDF rendering."""
    font_name = "ArabicFont"
    if font_name in pdfmetrics.getRegisteredFontNames():
        return font_name

    candidate_paths = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]
    for path in candidate_paths:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(font_name, path))
                return font_name
            except Exception:
                continue
    return "Helvetica"


def _shape_arabic_text(text: str | None) -> str:
    """Reshape and apply BiDi ordering to Arabic text so ReportLab renders connected RTL glyphs."""
    if not text:
        return ""
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display

        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    except Exception:
        return text


async def get_report_summary(
    db: AsyncSession,
    parent_id: uuid.UUID,
    child_id: uuid.UUID | None = None,
    days: int = 7,
    is_admin: bool = False,
) -> ReportSummaryResponse:
    """Generate analytical summary over the past N days."""
    now = datetime.now(UTC)
    start_date = now - timedelta(days=days)

    events_query = select(ActivityEvent).where(ActivityEvent.timestamp >= start_date)

    if not is_admin:
        children_subquery = (
            select(FamilyMember.child_id)
            .join(Family, Family.id == FamilyMember.family_id)
            .where(Family.parent_id == parent_id)
        )
        if child_id:
            children_subquery = children_subquery.where(FamilyMember.child_id == child_id)
        events_query = events_query.where(ActivityEvent.child_id.in_(children_subquery))
    elif child_id:
        events_query = events_query.where(ActivityEvent.child_id == child_id)

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
    """Generate a complete Arabic RTL executive PDF report using ReportLab with Arabic Unicode shaping."""
    buffer = io.BytesIO()
    font_name = _register_arabic_font()
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
        fontName=font_name,
        fontSize=20,
        leading=26,
        textColor=colors.HexColor("#07365f"),
        alignment=1,  # Center
    )
    subtitle_style = ParagraphStyle(
        "SubTitle",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=11,
        leading=16,
        textColor=colors.HexColor("#387b94"),
        alignment=1,  # Center
    )
    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName=font_name,
        fontSize=14,
        leading=20,
        textColor=colors.HexColor("#07365f"),
        alignment=2,  # Right-aligned for Arabic RTL
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=11,
        leading=16,
        textColor=colors.HexColor("#1b2533"),
        alignment=2,  # Right-aligned for Arabic RTL
    )

    elements = []

    # ── العنوان الرئيسي والترويسة ─────────────────────────────────────
    elements.append(Paragraph(_shape_arabic_text("حارس الأطفال الآمن — التقرير التنفيذي لأمان المحتوى"), title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(_shape_arabic_text("منصة الرقابة الأبوية الذكية بالذكاء الاصطناعي "), subtitle_style))
    elements.append(Spacer(1, 18))

    # ── جدول بيانات التقرير الأساسية (RTL: القيمة يساراً والبيان يميناً) ──
    target_child_label = _shape_arabic_text(summary.child_name or "جميع الأطفال المرتبطين بالحساب")
    period_str = _shape_arabic_text(f"من {summary.start_date} إلى {summary.end_date}")
    issued_at_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")

    info_data = [
        [period_str, _shape_arabic_text("الفترة الزمنية للتقرير")],
        [target_child_label, _shape_arabic_text("حساب الطفل المستهدف")],
        [f"{summary.safety_score}%", _shape_arabic_text("مؤشر الأمان الرقمي العام")],
        [issued_at_str, _shape_arabic_text("تاريخ ووقت إصدار التقرير")],
    ]
    info_table = Table(info_data, colWidths=[370, 170])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#edf5f8")),
        ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#d9eef5")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#07365f")),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#b5d7e3")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b5d7e3")),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 18))

    # ── أولاً: مؤشرات الحماية والأمان الرئيسية (RTL) ───────────────────
    elements.append(Paragraph(_shape_arabic_text("أولاً: مؤشرات الحماية والأمان الرئيسية"), section_style))
    elements.append(Spacer(1, 8))

    metrics_data = [
        [
            _shape_arabic_text("مؤشر الأمان الرقمي"),
            _shape_arabic_text("التهديدات المحجوبة"),
            _shape_arabic_text("المحتوى السليم (مسموح)"),
            _shape_arabic_text("إجمالي الفحوصات"),
        ],
        [
            f"{summary.safety_score}%",
            str(summary.blocked_events),
            str(summary.allowed_events),
            str(summary.total_events),
        ],
    ]
    metrics_table = Table(metrics_data, colWidths=[135, 135, 135, 135])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#159cb7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTSIZE", (0, 1), (-1, 1), 12),
        ("TEXTCOLOR", (0, 1), (-1, 1), colors.HexColor("#07365f")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#b5d7e3")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b5d7e3")),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 20))

    # ── ثانياً: توزيع التهديدات المرصودة حسب الفئة (RTL) ────────────────
    elements.append(Paragraph(_shape_arabic_text("ثانياً: توزيع التهديدات والمخاطر المرصودة حسب الفئة"), section_style))
    elements.append(Spacer(1, 8))

    if summary.threat_breakdown:
        breakdown_data = [[
            _shape_arabic_text("النسبة المئوية من التهديدات"),
            _shape_arabic_text("عدد مرات الرصد والحظر"),
            _shape_arabic_text("فئة التهديد المرصود"),
        ]]
        total_threats = max(sum(c.count for c in summary.threat_breakdown), 1)
        for cat in summary.threat_breakdown:
            pct = round((cat.count / total_threats) * 100, 1)
            arabic_cat = CATEGORY_ARABIC_MAP.get(cat.category, cat.label_ar)
            breakdown_data.append([
                f"{pct}%",
                str(cat.count),
                _shape_arabic_text(arabic_cat),
            ])

        breakdown_table = Table(breakdown_data, colWidths=[150, 150, 240])
        breakdown_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#07365f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, -1), font_name),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (1, -1), "CENTER"),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
            ("RIGHTPADDING", (2, 0), (2, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#b5d7e3")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b5d7e3")),
        ]))
        elements.append(breakdown_table)
    else:
        elements.append(
            Paragraph(_shape_arabic_text("لم يتم رصد أي تهديدات أو محتوى ضار خلال هذه الفترة — التصفح آمن تماماً."), body_style)
        )

    elements.append(Spacer(1, 20))

    # ── ثالثاً: السجل اليومي لنشاط الفحص والحماية (RTL) ─────────────────
    if summary.daily_trends:
        elements.append(Paragraph(_shape_arabic_text("ثالثاً: السجل اليومي لنشاط الفحص والحماية"), section_style))
        elements.append(Spacer(1, 8))

        daily_data = [[
            _shape_arabic_text("التهديدات المحجوبة"),
            _shape_arabic_text("المحتوى السليم"),
            _shape_arabic_text("إجمالي الفحوصات"),
            _shape_arabic_text("التاريخ"),
        ]]
        for day in summary.daily_trends:
            daily_data.append([
                str(day.blocked),
                str(day.allowed),
                str(day.total),
                day.date,
            ])

        daily_table = Table(daily_data, colWidths=[135, 135, 135, 135])
        daily_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#159cb7")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, -1), font_name),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#b5d7e3")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b5d7e3")),
        ]))
        elements.append(daily_table)

    elements.append(Spacer(1, 24))
    elements.append(
        Paragraph(
            _shape_arabic_text("تم إصدار هذا التقرير آلياً بواسطة منصة حارس الأطفال الآمن (Safe Kids Guard)"),
            subtitle_style,
        )
    )

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
