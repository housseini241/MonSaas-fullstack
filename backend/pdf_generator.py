"""
Génération PDF pour devis et factures avec ReportLab.
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER


def format_currency(amount: float) -> str:
    """Format an amount as French currency: 1 234,56 €"""
    formatted = f"{amount:,.2f}".replace(",", " ").replace(".", ",")
    return f"{formatted} €"


def format_date(date_str: str) -> str:
    """Convert YYYY-MM-DD to DD/MM/YYYY"""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        return d.strftime("%d/%m/%Y")
    except Exception:
        return date_str


PRIMARY_COLOR = colors.HexColor("#F95A2C")
DARK_COLOR = colors.HexColor("#09090B")
LIGHT_GRAY = colors.HexColor("#F4F4F5")
TEXT_GRAY = colors.HexColor("#52525B")


def _build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="DocTitle",
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=32,
        textColor=DARK_COLOR,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="DocNumber",
        fontName="Helvetica",
        fontSize=10,
        textColor=PRIMARY_COLOR,
        leading=12,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="Small",
        fontName="Helvetica",
        fontSize=9,
        textColor=TEXT_GRAY,
        leading=12,
    ))
    styles.add(ParagraphStyle(
        name="SectionLabel",
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=PRIMARY_COLOR,
        leading=11,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="ClientBlock",
        fontName="Helvetica",
        fontSize=10,
        textColor=DARK_COLOR,
        leading=14,
    ))
    return styles


def generate_devis_or_facture_pdf(doc_type: str, doc_data: dict, client: dict, artisan: dict) -> bytes:
    """
    Generate a PDF for a devis or facture.
    doc_type: 'devis' or 'facture'
    Returns PDF bytes.
    """
    buffer = BytesIO()
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"{doc_type.title()} {doc_data.get('numero', '')}",
    )

    styles = _build_styles()
    story = []

    is_devis = doc_type == "devis"
    title_label = "DEVIS" if is_devis else "FACTURE"

    # Header table: artisan info (left) + doc title (right)
    artisan_name = artisan.get("full_name") or artisan.get("email", "")
    artisan_email = artisan.get("email", "")
    artisan_block = f"""
    <b>{artisan_name}</b><br/>
    {artisan_email}<br/>
    """

    header_data = [[
        Paragraph(artisan_block, styles["ClientBlock"]),
        Paragraph(
            f'<para align="right"><font color="#F95A2C" size="10">// {title_label.lower()}</font><br/>'
            f'<font size="24" color="#09090B"><b>{title_label}</b></font><br/>'
            f'<font size="11" color="#09090B">{doc_data.get("numero", "")}</font></para>',
            styles["ClientBlock"],
        ),
    ]]
    header_table = Table(header_data, colWidths=[90 * mm, 84 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(header_table)

    # Orange separator
    sep = Table([[""]], colWidths=[174 * mm], rowHeights=[2])
    sep.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PRIMARY_COLOR)]))
    story.append(sep)
    story.append(Spacer(1, 14))

    # Client block + dates
    client_name = f"{client.get('prenom', '') or ''} {client.get('nom', '')}".strip()
    client_lines = [f"<b>{client_name}</b>"]
    if client.get("email"):
        client_lines.append(client["email"])
    if client.get("telephone"):
        client_lines.append(client["telephone"])
    addr_parts = []
    if client.get("adresse"):
        addr_parts.append(client["adresse"])
    cp_ville = " ".join(filter(None, [client.get("code_postal"), client.get("ville")]))
    if cp_ville:
        addr_parts.append(cp_ville)
    for p in addr_parts:
        client_lines.append(p)
    client_block = "<br/>".join(client_lines)

    info_right = f"<b>Date :</b> {format_date(doc_data.get('date', ''))}<br/>"
    if is_devis:
        validite = doc_data.get("validite_jours", 30)
        info_right += f"<b>Validité :</b> {validite} jours"
    else:
        statut = doc_data.get("statut", "impayee")
        info_right += f"<b>Statut :</b> {statut.upper()}"
        if doc_data.get("date_paiement"):
            info_right += f"<br/><b>Payée le :</b> {format_date(doc_data['date_paiement'])}"

    client_table = Table(
        [[
            Paragraph('<font color="#F95A2C"><b>FACTURÉ À</b></font>', styles["SectionLabel"]),
            Paragraph('<font color="#F95A2C"><b>INFORMATIONS</b></font>', styles["SectionLabel"]),
        ], [
            Paragraph(client_block, styles["ClientBlock"]),
            Paragraph(info_right, styles["ClientBlock"]),
        ]],
        colWidths=[90 * mm, 84 * mm],
    )
    client_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 16))

    # Items table
    table_data = [["DESCRIPTION", "QTÉ", "PRIX UNIT.", "MONTANT HT"]]
    for item in doc_data.get("items", []):
        table_data.append([
            Paragraph(item.get("description", ""), styles["ClientBlock"]),
            f"{item.get('quantite', 0):g}",
            format_currency(item.get("prix_unitaire", 0)),
            format_currency(item.get("montant", 0)),
        ])

    items_table = Table(
        table_data,
        colWidths=[90 * mm, 18 * mm, 32 * mm, 34 * mm],
        repeatRows=1,
    )
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 12))

    # Totals
    montant_ht = doc_data.get("montant_ht", 0)
    montant_tva = doc_data.get("montant_tva", 0)
    montant_ttc = doc_data.get("montant_ttc", 0)
    tva_pct = doc_data.get("tva_pourcent", 20)

    totals_data = [
        ["Montant HT", format_currency(montant_ht)],
        [f"TVA ({tva_pct:g}%)", format_currency(montant_tva)],
        ["TOTAL TTC", format_currency(montant_ttc)],
    ]
    totals_table = Table(totals_data, colWidths=[44 * mm, 40 * mm], hAlign="RIGHT")
    totals_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 1), "Helvetica"),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 1), 10),
        ("FONTSIZE", (0, 2), (-1, 2), 13),
        ("TEXTCOLOR", (0, 0), (-1, 1), TEXT_GRAY),
        ("TEXTCOLOR", (0, 2), (-1, 2), DARK_COLOR),
        ("BACKGROUND", (0, 2), (-1, 2), PRIMARY_COLOR),
        ("TEXTCOLOR", (0, 2), (-1, 2), colors.white),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 20))

    # Notes
    notes = doc_data.get("notes")
    if notes:
        story.append(Paragraph('<font color="#F95A2C"><b>NOTES</b></font>', styles["SectionLabel"]))
        story.append(Paragraph(notes.replace("\n", "<br/>"), styles["ClientBlock"]))
        story.append(Spacer(1, 16))

    # Footer
    if is_devis:
        footer_text = (
            "Bon pour accord — date et signature précédée de la mention "
            '« Bon pour accord »'
        )
    else:
        footer_text = (
            "TVA acquittée sur les encaissements. "
            "En cas de retard de paiement, indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 Code de commerce)."
        )
    story.append(Spacer(1, 30))
    story.append(Paragraph(f'<font size="8" color="#71717A">{footer_text}</font>', styles["Small"]))

    pdf.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
