import apiClient from './client'

export interface UbicacionResponse {
  idUbicacion: number
  nombre: string
  latitud: number
  longitud: number
}

export interface UbicacionRequest {
  nombre: string
  latitud: number
  longitud: number
}

export const ubicacionesApi = {
  listar: async (): Promise<UbicacionResponse[]> => {
    const res = await apiClient.get<UbicacionResponse[]>('/ubicaciones')
    return res.data
  },
  crear: async (data: UbicacionRequest): Promise<UbicacionResponse> => {
    const res = await apiClient.post<UbicacionResponse>('/ubicaciones', data)
    return res.data
  },
}