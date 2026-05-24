// ─── Tipos globales AgroMagdalena ─────────────────────────────────────────────
// Basados en los DTOs del backend Spring Boot (RAAR-18/AgroTech)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export type Rol = 'PRODUCTOR' | 'ADMINISTRADOR' | 'OPERARIO' | 'AUXILIAR'

export interface LoginRequest {
  correo: string
  contrasena: string
}

export interface LoginResponse {
  token: string
  correo: string
  nombreCompleto: string
  rol: Rol
}

export interface RegistroProductorRequest {
  nombre: string
  apellido: string
  correo: string
  contrasena: string
  telefono: string
  fechaNacimiento: string       // ISO string
  nombreFinca: string
  hectareas: number
  numLotes: number
  idUbicacion: number
}

// ─── Usuario / Perfil ─────────────────────────────────────────────────────────
export interface Usuario {
  id: number
  nombre: string
  apellido: string
  correo: string
  telefono: string
  rol: Rol
  activo: boolean
}

export interface EditarPerfilRequest {
  nombre?: string
  apellido?: string
  telefono?: string
}

// ─── Finca ────────────────────────────────────────────────────────────────────
export interface Finca {
  idFinca: number
  nombreFinca: string
  hectareas: number
  numLotes: number
  idUbicacion: number
  nombreUbicacion?: string
  fechaRegistro?: string
}

export interface FincaRequest {
  nombreFinca: string
  hectareas: number
  numLotes: number
  idUbicacion: number
}

// ─── Cultivo ──────────────────────────────────────────────────────────────────
export interface Cultivo {
  id: number
  nombre: string
  idTipoCultivo: number
  nombreTipoCultivo?: string
}

// ─── Siembra (cultivo activo en finca) ───────────────────────────────────────
export interface Siembra {
  idSiembra: number
  idFinca: number
  idCultivo: number
  nombreCultivo?: string
  fechaSiembra: string
  fechaCosechaEstimada?: string
  areaHectareas: number
  estadoActual?: string
}

export interface SiembraRequest {
  idFinca: number
  idCultivo: number
  fechaSiembra: string
  fechaCosechaEstimada?: string
  areaHectareas: number
  idUbicacion: number
}

// ─── Tarea ────────────────────────────────────────────────────────────────────
export type EstadoTarea = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA'

export interface EjecucionTarea {
  idEjecucion: number
  estado: EstadoTarea
}

export interface Tarea {
  idTarea: number
  tipoTarea: string
  descripcion: string
  fechaLimite?: string
  idSiembra?: number
  nombreSiembra?: string
  estado?: EstadoTarea
  asignaciones?: EjecucionTarea[]
}

export interface TareaRequest {
  idTipoTarea: number
  descripcion?: string
  fechaLimite: string
  idSiembra: number
}

export interface AsignarTareaRequest {
  correoAsignado: string
}

export interface ActualizarEstadoTareaRequest {
  estado: EstadoTarea
}

// ─── Anomalía ─────────────────────────────────────────────────────────────────
export type TipoAnomalia  = 'PLAGA' | 'ENFERMEDAD' | 'CLIMATICA' | 'OTRA'
export type EstadoAnomalia = 'ACTIVA' | 'EN_SEGUIMIENTO' | 'RESUELTA'
export type NivelSeveridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'

export interface Anomalia {
  idAnomalia: number
  descripcion: string
  tipoAnomalia: TipoAnomalia
  nivelSeveridad: NivelSeveridad
  estadoAnomalia: EstadoAnomalia
  fechaDeteccion: string
  idSiembra?: number
  nombreCultivo?: string
}

export interface AnomaliaRequest {
  descripcion: string
  tipoAnomalia: TipoAnomalia
  nivelSeveridad: NivelSeveridad
  idSiembra: number
}

// ─── Recomendación ────────────────────────────────────────────────────────────
export type EstadoRecomendacion  = 'PENDIENTE' | 'APLICADA' | 'IGNORADA'
export type PrioridadRecomendacion = 'BAJA' | 'MEDIA' | 'ALTA'

export interface Recomendacion {
  idRecomendacion: number
  titulo: string
  descripcion: string
  prioridad: PrioridadRecomendacion
  estado: EstadoRecomendacion
  fechaGeneracion: string
  categoria?: string
}

export interface RecomendacionRequest {
  descripcion: string
  idSiembra?: number
}

// ─── Clima ────────────────────────────────────────────────────────────────────
export interface ClimaActual {
  temperatura: number
  humedad: number
  precipitacion: number
  condicion: string
  fecha: string
  idUbicacion?: number
}

export interface PronosticoClima {
  fecha: string
  temperaturaMin: number
  temperaturaMax: number
  condicion: string
  probabilidadLluvia: number
}

// ─── Finanza ──────────────────────────────────────────────────────────────────
export type TipoTransaccion = 'INGRESO' | 'GASTO'

export interface Finanza {
  idFinanza: number
  tipoTransaccion: TipoTransaccion
  categoria: string
  monto: number
  fecha: string
  descripcion?: string
  idFinca?: number
}

export interface FinanzaRequest {
  tipoTransaccion: TipoTransaccion
  categoria: string
  monto: number
  fecha: string
  descripcion?: string
  idFinca: number
}

// ─── Notificación ─────────────────────────────────────────────────────────────
export type TipoNotificacion     = 'ANOMALIA' | 'CLIMA' | 'RECOMENDACION' | 'REPORTE' | 'RECORDATORIO'
export type EstadoNotificacion   = 'LEIDA' | 'NO_LEIDA'
export type PrioridadNotificacion = 'BAJA' | 'MEDIA' | 'ALTA'

export interface Notificacion {
  idNotificacion: number
  titulo: string
  mensaje: string
  tipo: TipoNotificacion
  estado: EstadoNotificacion
  prioridad: PrioridadNotificacion
  fechaCreacion: string
}

// ─── Reporte ──────────────────────────────────────────────────────────────────
export type PeriodoReporte = 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'
export type FormatoReporte = 'PDF' | 'EXCEL'

export interface Reporte {
  idReporte: number
  titulo: string
  periodo: PeriodoReporte
  formato: FormatoReporte
  fechaGeneracion: string
  urlDescarga?: string
}

// ─── Ubicación ────────────────────────────────────────────────────────────────
export interface Ubicacion {
  idUbicacion: number
  municipio: string
  departamento: string
}

// ─── Respuesta paginada genérica ──────────────────────────────────────────────
export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// ─── Error de API ─────────────────────────────────────────────────────────────
export interface ApiError {
  mensaje: string
  status: number
  timestamp: string
}