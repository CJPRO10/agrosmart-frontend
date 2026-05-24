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

// Solo los campos que acepta SiembraUpdateRequestDTO
export interface SiembraUpdateRequest {
  idFinca: number
  idCultivo: number
  numLote: number
}

export interface SiembraEstadoRequest {
  idSiembra: number
  idEstadoCultivo: number
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

  // El endpoint real es /siembras/crear según Postman
  crear: async (data: SiembraRequest): Promise<SiembraResponse> => {
  const res = await apiClient.post<SiembraResponse>('/siembras', data)
  return res.data
  },
  // Solo envía los campos del SiembraUpdateRequestDTO
  actualizar: async (id: number, data: SiembraUpdateRequest): Promise<SiembraResponse> => {
    const res = await apiClient.put<SiembraResponse>(`/siembras/${id}`, data)
    return res.data
  },

  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`/siembras/${id}`)
  },

  // Cambiar estado de la siembra (endpoint separado)
  cambiarEstado: async (data: SiembraEstadoRequest): Promise<void> => {
    await apiClient.post('/siembras-estados', data)
  },

  // Obtener estado actual de una siembra
  estadoActual: async (idSiembra: number): Promise<EstadoCultivo> => {
    const res = await apiClient.get<EstadoCultivo>(`/siembras-estados/siembra/${idSiembra}/actual`)
    return res.data
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