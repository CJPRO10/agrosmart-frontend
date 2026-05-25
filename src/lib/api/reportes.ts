import apiClient from './client'

export interface ReporteResponse {
  idReporte: number
  nombreReporte: string
  formato: string
  tipoPeriodicidad: string
  fechaCreacion: string
  nombreProductor?: string
}

export interface ReporteRequest {
  nombreReporte: string
  formato: string
  tipoPeriodicidad: string
}

export const reportesApi = {
  listar: async (): Promise<ReporteResponse[]> => {
    const res = await apiClient.get<ReporteResponse[]>('/reportes')
    return res.data
  },
  crear: async (data: ReporteRequest): Promise<ReporteResponse> => {
    const res = await apiClient.post<ReporteResponse>('/reportes', data)
    return res.data
  },
  buscarPorNombre: async (nombre: string): Promise<ReporteResponse[]> => {
    const res = await apiClient.get<ReporteResponse[]>('/reportes/buscar', { params: { nombre } })
    return res.data
  },
  filtrarPorFormato: async (formato: string): Promise<ReporteResponse[]> => {
    const res = await apiClient.get<ReporteResponse[]>(`/reportes/formato/${formato}`)
    return res.data
  },
  filtrarPorPeriodicidad: async (periodicidad: string): Promise<ReporteResponse[]> => {
    const res = await apiClient.get<ReporteResponse[]>(`/reportes/periodicidad/${periodicidad}`)
    return res.data
  },
  eliminar: async (idReporte: number): Promise<void> => {
    await apiClient.delete(`/reportes/${idReporte}`)
  },
}
