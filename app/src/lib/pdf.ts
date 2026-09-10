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

export type PdfKpis = {
  total: number
  pagos: number
  pendentes: number
  valorRecebido: number
  valorAReceber: number
  cartelas: number
  pontosAtribuidos: number
}

const C = {
  night: [14, 30, 58] as [number, number, number],
  night2: [10, 20, 40] as [number, number, number],
  accent: [217, 142, 46] as [number, number, number],
  accentSoft: [255, 220, 180] as [number, number, number],
  bg: [247, 242, 230] as [number, number, number],
  surface: [255, 255, 255] as [number, number, number],
  fg: [14, 30, 58] as [number, number, number],
  muted: [142, 132, 120] as [number, number, number],
  border: [233, 221, 199] as [number, number, number],
  leaf: [45, 120, 70] as [number, number, number],
}

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function exportVendasPdf(rows: PdfRow[], opts: { edition: string; userName: string; kpis: PdfKpis }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const now = new Date()
  const ts = now.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })
  const fileTs = `${now.toISOString().slice(0, 10)}-${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`

  // --- Header night ---
  const headerH = 86
  doc.setFillColor(...C.night)
  doc.rect(0, 0, W, headerH, 'F')
  // subtle accent line
  doc.setFillColor(...C.accent)
  doc.rect(0, headerH - 3, W, 3, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('RIFA BORROMEU 2026', 36, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.accentSoft)
  doc.text('PWA  •  SISTEMA DE GESTÃO  •  POT', 36, 36)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text(opts.edition, 36, 54)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(200, 210, 230)
  doc.text(`Exportado em ${ts}  •  por ${opts.userName}`, 36, 66)
  doc.text(`${rows.length} vendas  •  ${opts.kpis.pagos} pagas  •  ${opts.kpis.pendentes} pendentes`, 36, 76)

  // badge edition
  const badgeW = 86
  const badgeX = W - badgeW - 36
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...C.border)
  doc.roundedRect(badgeX, 18, badgeW, 36, 6, 6, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C.muted)
  doc.text('GERADO EM', badgeX + 10, 30)
  doc.setFontSize(9)
  doc.setTextColor(...C.night)
  doc.text(now.toLocaleDateString('pt-BR'), badgeX + 10, 42)

  // --- KPIs row (4 cards) ---
  const cardY = headerH + 14
  const gap = 8
  const cardW = (W - 72 - gap * 3) / 4
  const cardH = 52
  const kpis = [
    { label: 'TOTAL VENDIDO', value: String(opts.kpis.total), sub: `${opts.kpis.total} pontos` },
    { label: 'VALOR RECEBIDO', value: brl(opts.kpis.valorRecebido), sub: `${opts.kpis.pagos} pagos`, accent: true },
    { label: 'A RECEBER', value: brl(opts.kpis.valorAReceber), sub: `${opts.kpis.pendentes} pendentes` },
    { label: 'CARTELAS', value: String(opts.kpis.cartelas), sub: `${opts.kpis.pontosAtribuidos} pts` },
  ] as const

  kpis.forEach((k, i) => {
    const x = 36 + i * (cardW + gap)
    const isAccent = (k as { accent?: boolean }).accent
    if (isAccent) {
      doc.setFillColor(...C.accent)
      doc.roundedRect(x, cardY, cardW, cardH, 6, 6, 'F')
      doc.setDrawColor(217, 142, 46)
    } else {
      doc.setFillColor(...C.surface)
      doc.setDrawColor(...C.border)
      doc.roundedRect(x, cardY, cardW, cardH, 6, 6, 'FD')
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(isAccent ? 255 : C.muted[0], isAccent ? 255 : C.muted[1], isAccent ? 255 : C.muted[2])
    // emulate muted white for accent
    if (isAccent) doc.setTextColor(255, 240, 210)
    doc.text(k.label, x + 10, cardY + 14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(isAccent ? 255 : C.fg[0], isAccent ? 255 : C.fg[1], isAccent ? 255 : C.fg[2])
    if (isAccent) doc.setTextColor(255, 255, 255)
    doc.text(k.value, x + 10, cardY + 30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(isAccent ? 255 : C.muted[0], isAccent ? 240 : C.muted[1], isAccent ? 210 : C.muted[2])
    if (!isAccent) doc.setTextColor(...C.muted)
    doc.text(k.sub, x + 10, cardY + 42)
  })

  // --- Table ---
  const startY = cardY + cardH + 16

  // title above table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.fg)
  doc.text('Detalhamento por venda', 36, startY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.muted)
  doc.text(`Ordenado por data  •  filtro aplicado no Dashboard`, 36, startY + 10)

  autoTable(doc, {
    startY: startY + 16,
    head: [['#', 'Comprador', 'Cell', 'Vendedor', 'Status', 'Vendido em']],
    body: rows.map((r) => [String(r.numero), r.comprador, r.cell, r.vendedor, r.status.toUpperCase(), r.vendidoEm]),
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      textColor: C.fg as unknown as string,
      lineColor: C.border as unknown as string,
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: C.night as unknown as string,
      textColor: [255, 255, 255] as unknown as string,
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'left',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 36, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 52 },
      5: { halign: 'center', cellWidth: 64 },
    },
    alternateRowStyles: { fillColor: [252, 248, 240] as unknown as string },
    bodyStyles: { fillColor: C.surface as unknown as string },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 4) {
        const v = String(data.cell.raw).toLowerCase()
        if (v === 'pago') {
          data.cell.styles.fillColor = [232, 245, 233] as unknown as string
          data.cell.styles.textColor = C.leaf as unknown as string
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.fillColor = [255, 240, 220] as unknown as string
          data.cell.styles.textColor = C.accent as unknown as string
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    margin: { left: 36, right: 36, bottom: 36 },
  })

  // --- Footer on each page ---
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    // footer line
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.6)
    doc.line(36, H - 26, W - 36, H - 26)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...C.muted)
    doc.text(`Rifa Borromeu 2026  •  POT  •  Página ${i}/${pageCount}`, 36, H - 16)
    doc.text(`Gerado ${ts}  •  ${opts.userName}  •  ${opts.edition}`, W - 36, H - 16, { align: 'right' })
  }

  doc.save(`rifa-borromeu-${opts.edition.toLowerCase().replace(/\s+/g, '-')}-${fileTs}.pdf`)
}
