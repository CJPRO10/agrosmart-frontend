import apiClient from './client'

export type TipoNotificacion     = 'ANOMALIA' | 'RECOMENDACION' | 'CLIMA' | 'RECORDATORIO'
export type PrioridadNotificacion = 'ALTA' | 'MEDIA' | 'BAJA'
export type EstadoNotificacion   = 'LEIDA' | 'NO_LEIDA'

export interface NotificacionResponse {
  idNotificacion: number
  titulo: string
  mensaje: string
  tipo: TipoNotificacion
  prioridad: PrioridadNotificacion
  estado: EstadoNotificacion
  fechaCreacion: unknown
  nombreUsuario: string
}

export interface PreferenciaRequest {
  tipoAlerta: TipoNotificacion
  activo: boolean
  nivelMinimoPrioridad?: PrioridadNotificacion
}

export const notificacionesApi = {
  listar: async (): Promise<NotificacionResponse[]> => {
    const res = await apiClient.get<NotificacionResponse[]>('/notificaciones')
    return res.data
  },
  filtrarPorTipo: async (tipo: TipoNotificacion): Promise<NotificacionResponse[]> => {
    const res = await apiClient.get<NotificacionResponse[]>(`/notificaciones/tipo/${tipo}`)
    return res.data
  },
  filtrarPorPrioridad: async (prioridad: PrioridadNotificacion): Promise<NotificacionResponse[]> => {
    const res = await apiClient.get<NotificacionResponse[]>(`/notificaciones/prioridad/${prioridad}`)
    return res.data
  },
  filtrarPorEstado: async (estado: EstadoNotificacion): Promise<NotificacionResponse[]> => {
    const res = await apiClient.get<NotificacionResponse[]>(`/notificaciones/estado/${estado}`)
    return res.data
  },
  marcarLeida: async (id: number): Promise<NotificacionResponse> => {
    const res = await apiClient.patch<NotificacionResponse>(`/notificaciones/${id}/leer`)
    return res.data
  },
  marcarTodasLeidas: async (): Promise<void> => {
    await apiClient.patch('/notificaciones/leer-todas')
  },
  configurarPreferencia: async (data: PreferenciaRequest): Promise<void> => {
    await apiClient.post('/notificaciones/preferencias', data)
  },
}
