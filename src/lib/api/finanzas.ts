import apiClient from './client'

export interface FinanzaResponse {
  idFinanza: number
  descripcion: string
  monto: number
  tipoTransaccion: string
  categoria: string
  fechaRegistro: string
  fechaActualizacion: string
}

export interface FinanzaRequest {
  descripcion: string
  monto: number
  tipoTransaccion: string
  categoria: string
}

export const finanzasApi = {
  listar: async (): Promise<FinanzaResponse[]> => {
    const res = await apiClient.get<FinanzaResponse[]>('/finanzas')
    return res.data
  },
  crear: async (data: FinanzaRequest): Promise<FinanzaResponse> => {
    const res = await apiClient.post<FinanzaResponse>('/finanzas', data)
    return res.data
  },
  actualizar: async (id: number, data: FinanzaRequest): Promise<FinanzaResponse> => {
    const res = await apiClient.put<FinanzaResponse>(`/finanzas/${id}`, data)
    return res.data
  },
  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`/finanzas/${id}`)
  },
  filtrarPorTipo: async (tipo: string): Promise<FinanzaResponse[]> => {
    const res = await apiClient.get<FinanzaResponse[]>(`/finanzas/tipo/${tipo}`)
    return res.data
  },
  filtrarPorCategoria: async (categoria: string): Promise<FinanzaResponse[]> => {
    const res = await apiClient.get<FinanzaResponse[]>(`/finanzas/categoria/${categoria}`)
    return res.data
  },
}
