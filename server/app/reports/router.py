"""
Reports router: analytics summary and PDF export.
"""
import io
import uuid
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.reports.schemas import ReportSummaryResponse
from app.reports.service import generate_pdf_bytes, get_report_summary

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/summary", response_model=ReportSummaryResponse)
async def get_summary_endpoint(
    child_id: uuid.UUID | None = Query(None, description="Filter summary by child ID"),
    days: int = Query(7, ge=1, le=90, description="Period in days (default 7)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated protection metrics, category breakdowns, and daily trends.
    """
    return await get_report_summary(
        db=db,
        parent_id=current_user.id,
        child_id=child_id,
        days=days,
    )


@router.get("/export-pdf")
async def export_pdf_endpoint(
    child_id: uuid.UUID | None = Query(None, description="Filter summary by child ID"),
    days: int = Query(7, ge=1, le=90, description="Period in days"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export the analytical report as a downloadable PDF document.
    """
    summary = await get_report_summary(
        db=db,
        parent_id=current_user.id,
        child_id=child_id,
        days=days,
    )
    pdf_bytes = generate_pdf_bytes(summary)

    filename = f"SafeKids_Report_{summary.start_date}_to_{summary.end_date}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
