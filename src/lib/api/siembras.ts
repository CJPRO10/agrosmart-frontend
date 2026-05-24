import apiClient from './client'

export interface SiembraResponse {
  idSiembra: number
  nombreCultivo: string
  nombreFinca: string
  nombreEstado: string
  numLote: number
  fechaSiembra: string
  fechaEstado: string
}

export interface SiembraRequest {
  idFinca: number
  idCultivo: number
  idEstadoCultivo: number
  fechaEstado: string
  numLote: number
}

export interface CultivoResponse {
  idCultivo: number
  nombre: string
  nombreTipoCultivo: string
}

export interface EstadoCultivo {
  idEstadoCultivo: number
  nombre: string
}

export interface TipoTarea {
  idTipoTarea: number
  nombre: string
  descripcion?: string
}

export const siembrasApi = {
  listar: async (): Promise<SiembraResponse[]> => {
    const res = await apiClient.get<SiembraResponse[]>('/siembras')
    return res.data
  },
  listarPorFinca: async (idFinca: number): Promise<SiembraResponse[]> => {
    const res = await apiClient.get<SiembraResponse[]>(`/siembras/finca/${idFinca}`)
    return res.data
  },
  crear: async (data: SiembraRequest): Promise<SiembraResponse> => {
    const res = await apiClient.post<SiembraResponse>('/siembras', data)
    return res.data
  },
  actualizar: async (id: number, data: Partial<SiembraRequest>): Promise<SiembraResponse> => {
    const res = await apiClient.put<SiembraResponse>(`/siembras/${id}`, data)
    return res.data
  },
  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`/siembras/${id}`)
  },
}

export const cultivosApi = {
  listar: async (): Promise<CultivoResponse[]> => {
    const res = await apiClient.get<CultivoResponse[]>('/cultivos')
    return res.data
  },
}

export const estadosCultivoApi = {
  listar: async (): Promise<EstadoCultivo[]> => {
    const res = await apiClient.get<EstadoCultivo[]>('/estado-cultivo')
    return res.data
  },
}

export const tiposTareaApi = {
  listar: async (): Promise<TipoTarea[]> => {
    const res = await apiClient.get<TipoTarea[]>('/tipos-tarea')
    return res.data
  },
}