/**
 * Extrae un mensaje legible de un error de API
 * El backend devuelve: { error: string, campos?: Record<string, string> }
 */
export function extraerMensajeError(err: unknown, mensajePorDefecto = 'Ha ocurrido un error inesperado'): string {
  if (!err || typeof err !== 'object') return mensajePorDefecto

  // Error de Axios con respuesta del backend
  const axiosErr = err as { response?: { data?: { error?: string; mensaje?: string; campos?: Record<string, string> } } }

  if (axiosErr.response?.data) {
    const data = axiosErr.response.data

    // Si hay errores de campos específicos
    if (data.campos && typeof data.campos === 'object') {
      const mensajes = Object.values(data.campos).filter(Boolean)
      if (mensajes.length > 0) return mensajes.join('. ')
    }

    // Mensaje de error principal
    if (data.error) return data.error
    if (data.mensaje) return data.mensaje
  }

  // Error sin respuesta (red caída, timeout)
  const networkErr = err as { message?: string; code?: string }
  if (networkErr.code === 'ECONNABORTED' || networkErr.message?.includes('timeout')) {
    return 'Tiempo de espera agotado. Verifica tu conexión.'
  }
  if (networkErr.message?.includes('Network Error') || networkErr.code === 'ERR_NETWORK') {
    return 'Sin conexión al servidor. Verifica tu internet.'
  }

  // Error con mensaje directo
  if (networkErr.message) return networkErr.message

  return mensajePorDefecto
}

/**
 * Mensajes amigables para errores comunes
 */
export const MENSAJES_ERROR = {
  CONEXION:       'No hay conexión. Verifica tu internet.',
  SESION:         'Tu sesión expiró. Por favor inicia sesión nuevamente.',
  PERMISO:        'No tienes permiso para realizar esta acción.',
  NO_ENCONTRADO:  'El recurso solicitado no existe.',
  SERVIDOR:       'Error en el servidor. Intenta nuevamente.',
  CAMPOS:         'Completa todos los campos requeridos correctamente.',
} as const