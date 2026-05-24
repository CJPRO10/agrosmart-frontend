import apiClient from './client'

export interface ClimaResponse {
  idClima: number
  condicion: string
  temperatura: number
  precipitacion: number
  fechaMedicion: string
  nombreUbicacion: string
  idUbicacion: number
  alerta?: string
}

export interface DiaPronostico {
  fecha: string
  temperaturaMaxima: number
  temperaturaMinima: number
  precipitacion: number
  condicion: string
  alerta?: string
}

export interface PronosticoResponse {
  nombreUbicacion: string
  idUbicacion: number
  dias: DiaPronostico[]
}

export const climaApi = {
  actual: async (idUbicacion: number): Promise<ClimaResponse> => {
    const res = await apiClient.get<ClimaResponse>(`/clima/actual/${idUbicacion}`)
    return res.data
  },
  pronostico: async (idUbicacion: number, dias = 7): Promise<PronosticoResponse> => {
    const res = await apiClient.get<PronosticoResponse>(`/clima/pronostico/${idUbicacion}`, { params: { dias } })
    return res.data
  },
  historial: async (idUbicacion: number): Promise<ClimaResponse[]> => {
    const res = await apiClient.get<ClimaResponse[]>(`/clima/historial/${idUbicacion}`)
    return res.data
  },
  actualizar: async (idUbicacion: number): Promise<ClimaResponse> => {
    const res = await apiClient.post<ClimaResponse>(`/clima/actualizar/${idUbicacion}`)
    return res.data
  },
}