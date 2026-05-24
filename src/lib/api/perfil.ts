import apiClient from './client'

export interface UsuarioResponse {
  idUsuario: number
  nombre: string
  apellido: string
  correo: string
  telefono: string
  fechaNacimiento: string
  rol: string
  activo: boolean
}

export interface EditarPerfilRequest {
  nombre?: string
  apellido?: string
  correo?: string
  telefono?: string
  contrasena?: string
}

export const perfilApi = {
  ver: async (): Promise<UsuarioResponse> => {
    const res = await apiClient.get<UsuarioResponse>('/perfil')
    return res.data
  },
  editar: async (data: EditarPerfilRequest): Promise<UsuarioResponse> => {
    const res = await apiClient.put<UsuarioResponse>('/perfil', data)
    return res.data
  },
  eliminar: async (): Promise<void> => {
    await apiClient.delete('/perfil')
  },
}