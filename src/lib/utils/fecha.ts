/**
 * Convierte fechas del backend que pueden venir como:
 * - Array: [2026, 5, 24, 3, 30, 58, 127541000]
 * - String ISO: "2026-05-24T03:30:58"
 * - null/undefined
 */
export function parseFecha(fecha: unknown): string {
  if (!fecha) return ''
  if (Array.isArray(fecha)) {
    const [y, m, d, h = 0, min = 0, s = 0] = fecha as number[]
    return new Date(y, m - 1, d, h, min, s).toISOString()
  }
  return String(fecha)
}

export function formatFecha(fecha: unknown, opciones?: Intl.DateTimeFormatOptions): string {
  const iso = parseFecha(fecha)
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('es-CO', opciones ?? {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function formatFechaCorta(fecha: unknown): string {
  const iso = parseFecha(fecha)
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('es-CO')
}