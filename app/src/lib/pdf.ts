import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type PdfRow = {
  numero: number
  comprador: string
  cell: string
  vendedor: string
  status: string
  vendidoEm: string
}

export function exportVendasPdf(rows: PdfRow[], opts: { edition: string; userEmail: string }) {
  const doc = new jsPDF()
  const now = new Date()
  const ts = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })

  doc.setFontSize(14)
  doc.text(`Rifa Borromeu 2026 — ${opts.edition}`, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Exportado em ${ts} por ${opts.userEmail}`, 14, 22)
  doc.text(`Total: ${rows.length} vendas`, 14, 27)

  autoTable(doc, {
    startY: 32,
    head: [['Numero', 'Comprador', 'Cell', 'Vendedor', 'Status', 'Vendido em']],
    body: rows.map((r) => [String(r.numero), r.comprador, r.cell, r.vendedor, r.status, r.vendidoEm]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [122, 35, 48] },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(130)
    doc.text(`Pagina ${i}/${pageCount} — Rifa Borromeu 2026`, 14, 290)
  }

  doc.save(`rifa-borromeu-${now.toISOString().slice(0, 10)}-${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}.pdf`)
}
