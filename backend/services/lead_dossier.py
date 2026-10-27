"""Render a source-linked research dossier, never a legal complaint."""

from datetime import datetime, timezone
from html import escape
from io import BytesIO
import secrets

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether,
)


def build_dossier(package: dict, provenance: dict | None = None) -> tuple[bytes, str]:
    """Return PDF bytes and a unique per-export page identifier prefix."""
    now = datetime.now(timezone.utc)
    npi = package["billing_npi"]
    prefix = f"MF-{npi}-{now:%Y%m%d%H%M%S}-{secrets.token_hex(3).upper()}"
    is_demo = package.get("is_demo", False)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="MFTitle", parent=styles["Title"], fontSize=18, leading=22, textColor=colors.HexColor("#102b46")))
    styles.add(ParagraphStyle(name="MFSmall", parent=styles["Normal"], fontSize=8, leading=11))
    styles.add(ParagraphStyle(name="MFCell", parent=styles["Normal"], fontSize=7, leading=9))
    styles.add(ParagraphStyle(name="MFHeading", parent=styles["Heading2"], keepWithNext=True))
    styles.add(ParagraphStyle(name="MFWarning", parent=styles["Normal"], fontSize=10, leading=14,
                              textColor=colors.HexColor("#9b2c2c"), alignment=TA_CENTER))
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=(8.5 * inch, 11 * inch),
                                 leftMargin=0.62 * inch, rightMargin=0.62 * inch,
                                 topMargin=0.62 * inch, bottomMargin=0.70 * inch)
    story = []

    def para(value, style="Normal"):
        return Paragraph(escape(str(value)), styles[style])

    def section(title):
        story.append(Spacer(1, 12))
        story.append(para(title, "MFHeading"))
        story.append(Spacer(1, 4))

    story.append(para("Research verification dossier", "MFTitle"))
    story.append(para("Preliminary aggregate-spending analysis - not a finding of fraud or a legal filing", "MFWarning"))
    if is_demo:
        story.append(para("SYNTHETIC DEMO DATA - DO NOT USE FOR A REAL PROVIDER OR SUBPOENA", "MFWarning"))
    story.append(Spacer(1, 10))
    story.append(para(f"Provider: {package['provider_name']} | Billing NPI: {npi} | HCPCS: {package['hcpcs_code']}"))
    story.append(para(f"Generated UTC: {now:%Y-%m-%d %H:%M:%S} | Source label: {package.get('source_dataset') or 'Unknown'}", "MFSmall"))

    section("Source and provenance")
    if provenance:
        for label, key in (("Official release", "release_id"), ("Download URL", "source_url"),
                           ("File SHA-256", "source_sha256"), ("NYC NPI allowlist SHA-256", "npi_allowlist_sha256")):
            story.append(para(f"{label}: {provenance.get(key, 'Unknown')}", "MFSmall"))
    else:
        story.append(para("No official import manifest is attached. The rows below are unverified or demonstration data.", "MFWarning"))
    story.append(para("The HHS file contains no city or state field. NYC scope comes from a separate vetted NPI registry; inspect that registry before using a location claim.", "MFSmall"))

    section("Peer comparison")
    peer = package["peer_comparison"]
    measures = [
        ("Provider total", package["total_spending"]),
        ("Peer mean", peer["peer_mean"]),
        ("Peer median", peer["peer_median"]),
        ("Peer P90", peer["peer_p90"]),
        ("Peer P95", peer["peer_p95"]),
    ]
    chart = Drawing(490, 105)
    max_value = max((value for _, value in measures), default=1) or 1
    for index, (label, value) in enumerate(measures):
        y = 83 - 20 * index
        chart.add(String(0, y + 3, label, fontSize=8))
        chart.add(Rect(94, y, 280 * value / max_value, 10,
                       fillColor=colors.HexColor("#2563a6" if index == 0 else "#7ea4bc"), strokeColor=None))
        chart.add(String(385, y + 3, f"${value:,.0f}", fontSize=8))
    story.append(chart)
    story.append(para(f"Cohort: {peer['cohort_total_providers']} billing NPIs; percentile {peer['provider_percentile']:.1f}; z-score {peer['z_score']:.2f}. These are descriptive outlier statistics, not fraud probabilities.", "MFSmall"))

    section("Stored monthly aggregate rows")
    row_data = [[para(value, "MFCell") for value in ("Month", "Servicing NPI", "Paid", "Claims", "Beneficiaries", "DB row ID")]]
    for row in package["exact_source_rows"]:
        row_data.append([para(value, "MFCell") for value in (
            row["year_month"], row.get("servicing_npi") or "-", f"${row['total_paid_amount']:,.2f}",
            row["total_claims"] if row["total_claims"] is not None else "Not published",
            row["total_beneficiaries"] if row["total_beneficiaries"] is not None else "Not published",
            row["id"],
        )])
    table = Table(row_data, colWidths=[58, 89, 85, 70, 83, 70], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e6edf3")),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#c8d3dd")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(table)
    story.append(para("Each stored row is an aggregate. In the official HHS file, small cells are omitted. No patient, individual trip, or service date can be inferred from these rows.", "MFSmall"))

    section("Records to verify")
    for item in package["required_records_checklist"]:
        status_line = f"{item['record_title']}: {item['status']}"
        if item.get("document_hash"):
            status_line += f" [SHA-256: {item['document_hash'][:16]}...]"
        story.append(para(status_line, "MFSmall"))

    section("Assumptions and investigator review")
    for assumption in package["documented_assumptions"]:
        story.append(para(f"- {assumption}", "MFSmall"))
    review = package["verification_status"]
    story.append(Spacer(1, 5))
    role_str = f" ({review.get('reviewer_role')})" if review.get("reviewer_role") else ""
    story.append(para(
        f"Outcome: {review['outcome']} | Lead Utility: {review.get('lead_utility', 'Unclassified')} | "
        f"Reviewer: {review['reviewed_by'] or 'None'}{role_str} | Revision: v{review.get('revision_count', 1)} | "
        f"Review time: {review['review_time_seconds']}s",
        "MFSmall"
    ))
    if review.get("decision_signature_hash"):
        story.append(para(f"Forensic Decision Signature (SHA-256): {review['decision_signature_hash']}", "MFSmall"))
    if package.get("source_records_hash"):
        story.append(para(f"Source Rows Evaluation Hash (SHA-256): {package['source_records_hash']}", "MFSmall"))
    if review.get("document_hashes"):
        hashes_repr = "; ".join(f"{k}: {v[:12]}..." for k, v in review["document_hashes"].items())
        story.append(para(f"Verified Document Hashes: {hashes_repr}", "MFSmall"))
    if review["outcome_rationale"]:
        story.append(para(f"Rationale: {review['outcome_rationale']}", "MFSmall"))
    story.append(Spacer(1, 12))
    story.append(para("Independent primary records and qualified legal review are required before a provider-specific allegation or filing. This dossier is a research aid only.", "MFWarning"))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#40566b"))
        canvas.drawString(0.62 * inch, 0.4 * inch, "MediFraudy research - preliminary")
        canvas.drawRightString(7.88 * inch, 0.4 * inch, f"{prefix}-{doc.page:04d}")
        if is_demo:
            canvas.setFont("Helvetica-Bold", 42)
            canvas.setFillColor(colors.Color(0.8, 0.15, 0.15, alpha=0.12))
            canvas.translate(150, 300)
            canvas.rotate(35)
            canvas.drawString(0, 0, "SYNTHETIC DEMO")
        canvas.restoreState()

    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue(), prefix
