import apiClient from './client'

export interface RecomendacionResponse {
  idRecomendacion: number
  descripcion: string
  categoria: string
  prioridad: string
  estado: string
  fechaGeneracion: string
  idSiembra?: number
  idAnomalia?: number
  idClima?: number
}

export interface RecomendacionRequest {
  idSiembra: number
  descripcionSolicitud: string
  categoria: string
}

export const recomendacionesApi = {
  listar: async (): Promise<RecomendacionResponse[]> => {
    const res = await apiClient.get<RecomendacionResponse[]>('/recomendaciones')
    return res.data
  },
  solicitar: async (data: RecomendacionRequest): Promise<RecomendacionResponse> => {
    const res = await apiClient.post<RecomendacionResponse>('/recomendaciones/solicitar', data)
    return res.data
  },
  ignorar: async (id: number): Promise<RecomendacionResponse> => {
    const res = await apiClient.patch<RecomendacionResponse>(`/recomendaciones/${id}/ignorar`)
    return res.data
  },
  reaccionar: async (id: number, reaccion: string): Promise<RecomendacionResponse> => {
    const res = await apiClient.patch<RecomendacionResponse>(`/recomendaciones/${id}/reaccionar`, null, { params: { reaccion } })
    return res.data
  },
  listarPorSiembra: async (idSiembra: number): Promise<RecomendacionResponse[]> => {
    const res = await apiClient.get<RecomendacionResponse[]>(`/recomendaciones/siembra/${idSiembra}`)
    return res.data
  },
}