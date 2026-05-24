import apiClient from './client'

export interface UsuarioResponse {
  idUsuario: number
  nombre: string
  apellido: string
  correo: string
  telefono: string
  fechaNacimiento: unknown  // viene como array del backend
  rol: string
  activo: boolean
}

export interface UsuarioRequest {
  nombre: string
  apellido: string
  correo: string
  contrasena: string
  telefono: string
  fechaNacimiento: string
  rol: string
}

export interface UsuarioUpdateRequest {
  nombre?: string
  apellido?: string
  correo?: string
  contrasena?: string
  telefono?: string
  rol?: string
}

export const usuariosApi = {
  listar: async (): Promise<UsuarioResponse[]> => {
    const res = await apiClient.get<UsuarioResponse[]>('/usuarios')
    return res.data
  },

  buscarPorNombre: async (nombre: string): Promise<UsuarioResponse[]> => {
    const res = await apiClient.get<UsuarioResponse[]>(`/usuarios/nombre/${nombre}`)
    return res.data
  },

  buscarPorCorreo: async (correo: string): Promise<UsuarioResponse[]> => {
    const res = await apiClient.get<UsuarioResponse[]>(`/usuarios/correo/${correo}`)
    return res.data
  },

  buscarPorRol: async (rol: string): Promise<UsuarioResponse[]> => {
    const res = await apiClient.get<UsuarioResponse[]>(`/usuarios/rol/${rol}`)
    return res.data
  },

  crear: async (data: UsuarioRequest): Promise<UsuarioResponse> => {
    const res = await apiClient.post<UsuarioResponse>('/usuarios', data)
    return res.data
  },

  actualizar: async (idUsuario: number, data: UsuarioUpdateRequest): Promise<UsuarioResponse> => {
    const res = await apiClient.put<UsuarioResponse>(`/usuarios/${idUsuario}`, data)
    return res.data
  },

  eliminar: async (idUsuario: number): Promise<void> => {
    await apiClient.delete(`/usuarios/${idUsuario}`)
  },

  desactivar: async (idUsuario: number): Promise<UsuarioResponse> => {
    const res = await apiClient.patch<UsuarioResponse>(`/usuarios/${idUsuario}/desactivar`)
    return res.data
  },
}