// Generador de reportes para descarga local
// Soporta PDF, XLS y CSV

export interface ReporteData {
  nombre: string
  tipo: string
  periodicidad: string
  fechaGeneracion: string
  filas: Record<string, unknown>[]
  columnas: string[]
}

// ── CSV ──────────────────────────────────────────────────────────────────────
export function descargarCSV(data: ReporteData) {
  const encabezado = data.columnas.join(',')
  const filas = data.filas.map(fila =>
    data.columnas.map(col => {
      const val = fila[col] ?? ''
      // Escapar comas y comillas
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') ? `"${str}"` : str
    }).join(',')
  )
  const contenido = [encabezado, ...filas].join('\n')
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' })
  descargar(blob, `${data.nombre}.csv`)
}

// ── XLS (formato HTML que Excel puede abrir) ─────────────────────────────────
export function descargarXLS(data: ReporteData) {
  const filaEncabezado = `<tr>${data.columnas.map(c => `<th style="background:#154212;color:white;padding:8px">${c}</th>`).join('')}</tr>`
  const filasData = data.filas.map(fila =>
    `<tr>${data.columnas.map(col => `<td style="padding:6px;border:1px solid #ccc">${fila[col] ?? ''}</td>`).join('')}</tr>`
  ).join('')

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="utf-8"/>
    <style>
      body { font-family: Arial, sans-serif; }
      h2 { color: #154212; }
      table { border-collapse: collapse; width: 100%; }
    </style>
    </head>
    <body>
      <h2>${data.nombre}</h2>
      <p>Tipo: ${data.tipo} | Periodicidad: ${data.periodicidad} | Generado: ${data.fechaGeneracion}</p>
      <table>
        <thead>${filaEncabezado}</thead>
        <tbody>${filasData}</tbody>
      </table>
    </body>
    </html>
  `
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  descargar(blob, `${data.nombre}.xls`)
}

// ── PDF (usando canvas nativo, sin librerías) ─────────────────────────────────
export function descargarPDF(data: ReporteData) {
  // Genera HTML y lo abre en nueva pestaña para imprimir/guardar como PDF
  const filaEncabezado = `<tr>${data.columnas.map(c =>
    `<th style="background:#154212;color:white;padding:10px 14px;text-align:left;font-size:13px">${c}</th>`
  ).join('')}</tr>`

  const filasData = data.filas.map((fila, i) =>
    `<tr style="background:${i % 2 === 0 ? '#f9fafb' : 'white'}">
      ${data.columnas.map(col =>
        `<td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;font-size:13px">${fila[col] ?? '—'}</td>`
      ).join('')}
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8"/>
    <title>${data.nombre}</title>
    <style>
      @page { margin: 20mm; }
      body { font-family: Arial, sans-serif; color: #111; }
      .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding-bottom:16px; border-bottom:3px solid #154212; }
      .logo { font-size:22px; font-weight:800; color:#154212; }
      .meta { font-size:12px; color:#666; text-align:right; }
      h1 { font-size:18px; color:#154212; margin:0 0 4px; }
      .badge { display:inline-block; background:#e8f5e9; color:#154212; padding:3px 10px; border-radius:9999px; font-size:11px; font-weight:700; margin-bottom:20px; }
      table { width:100%; border-collapse:collapse; margin-top:16px; }
      thead tr { background:#154212; }
      th { color:white; padding:10px 14px; text-align:left; font-size:13px; }
      td { padding:8px 14px; border-bottom:1px solid #e5e7eb; font-size:13px; }
      tr:nth-child(even) { background:#f9fafb; }
      .footer { margin-top:32px; text-align:center; font-size:11px; color:#999; border-top:1px solid #e5e7eb; padding-top:12px; }
      @media print { button { display:none; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="logo">🌱 AgroSmart</div>
        <div style="font-size:11px;color:#666;margin-top:2px">Plataforma Digital de Agricultura Inteligente</div>
      </div>
      <div class="meta">
        <div>Generado: ${data.fechaGeneracion}</div>
        <div>Periodicidad: ${data.periodicidad}</div>
      </div>
    </div>
    <h1>${data.nombre}</h1>
    <span class="badge">${data.tipo}</span>
    <table>
      <thead>${filaEncabezado}</thead>
      <tbody>${filasData}</tbody>
    </table>
    <div class="footer">AgroSmart © ${new Date().getFullYear()} — Reporte generado automáticamente</div>
    <br/>
    <div style="text-align:center">
      <button onclick="window.print()" style="background:#154212;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer">
        🖨️ Guardar como PDF
      </button>
    </div>
  </body>
  </html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  if (win) win.focus()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// ── Función helper para descargar ─────────────────────────────────────────────
function descargar(blob: Blob, nombreArchivo: string) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ── Función principal ─────────────────────────────────────────────────────────
export function generarReporte(data: ReporteData, formato: string) {
  const fmt = formato.toUpperCase()
  if (fmt === 'CSV') descargarCSV(data)
  else if (fmt === 'XLS') descargarXLS(data)
  else descargarPDF(data)
}