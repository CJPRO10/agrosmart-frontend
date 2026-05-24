import apiClient from './client'
import type {
  Tarea,
  TareaRequest,
  AsignarTareaRequest,
  ActualizarEstadoTareaRequest,
} from '@/types'

export const tareasApi = {
  listar: async (): Promise<Tarea[]> => {
    const res = await apiClient.get<Tarea[]>('/tareas')
    return res.data
  },

  buscarPorId: async (id: number): Promise<Tarea> => {
    const res = await apiClient.get<Tarea>(`/tareas/${id}`)
    return res.data
  },

  listarPorSiembra: async (idSiembra: number): Promise<Tarea[]> => {
    const res = await apiClient.get<Tarea[]>(`/tareas/siembra/${idSiembra}`)
    return res.data
  },

  crear: async (data: TareaRequest): Promise<Tarea> => {
    const res = await apiClient.post<Tarea>('/tareas', data)
    return res.data
  },

  asignar: async (idTarea: number, data: AsignarTareaRequest): Promise<Tarea> => {
    const res = await apiClient.post<Tarea>(`/tareas/${idTarea}/asignar`, data)
    return res.data
  },

  actualizarEstado: async (
    idEjecucion: number,
    data: ActualizarEstadoTareaRequest
  ): Promise<unknown> => {
    const res = await apiClient.patch(`/tareas/ejecucion/${idEjecucion}/estado`, data)
    return res.data
  },
}