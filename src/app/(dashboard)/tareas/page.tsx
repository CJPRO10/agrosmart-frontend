'use client'

import { useState, useEffect } from 'react'
import { getCachedData, cacheData } from '@/lib/offline/db'
import { useOfflineStatus } from '@/hooks/useOfflineStatus'
import { tareasApi } from '@/lib/api/tareas'
import { siembrasApi, tiposTareaApi } from '@/lib/api/siembras'
import { usuariosApi } from '@/lib/api/usuarios'
import type { Tarea, TareaRequest, EstadoTarea } from '@/types'
import type { SiembraResponse, TipoTarea } from '@/lib/api/siembras'
import type { UsuarioResponse } from '@/lib/api/usuarios'

const ESTADOS: { key: EstadoTarea | 'TODAS'; label: string }[] = [
  { key: 'TODAS',       label: 'Todas'      },
  { key: 'PENDIENTE',   label: 'Pendiente'  },
  { key: 'EN_PROGRESO', label: 'En proceso' },
  { key: 'COMPLETADA',  label: 'Completada' },
]

const ESTADO_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  PENDIENTE:   { bg: 'var(--color-tertiary-fixed)',  color: 'var(--color-tertiary)',  label: 'Pendiente'  },
  EN_PROGRESO: { bg: 'var(--color-secondary-fixed)', color: 'var(--color-secondary)', label: 'En proceso' },
  COMPLETADA:  { bg: 'var(--color-primary-fixed)',   color: 'var(--color-primary)',   label: 'Completada' },
}

const FORM_INICIAL = { descripcion: '', fechaLimite: '', idSiembra: 0, idTipoTarea: 0 }

function getEstadoTarea(tarea: Tarea): EstadoTarea {
  return tarea.asignaciones?.[0]?.estado ?? tarea.estado ?? 'PENDIENTE'
}

function parseFecha(fecha: unknown): string {
  if (!fecha) return ''
  if (Array.isArray(fecha)) {
    const [y, m, d, h = 0, min = 0, s = 0] = fecha as number[]
    return new Date(y, m - 1, d, h, min, s).toISOString()
  }
  return String(fecha)
}

export default function TareasPage() {
  const [tareas, setTareas]         = useState<Tarea[]>([])
  const [siembras, setSiembras]     = useState<SiembraResponse[]>([])
  const [tiposTarea, setTiposTarea] = useState<TipoTarea[]>([])
  const [personal, setPersonal]     = useState<UsuarioResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [filtro, setFiltro]         = useState<EstadoTarea | 'TODAS'>('TODAS')
  const [busqueda, setBusqueda]     = useState('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [asignarModal, setAsignarModal] = useState<Tarea | null>(null)
  const [asignando, setAsignando]       = useState(false)
  const [idAsignado, setIdAsignado]     = useState<number>(0)
  const [tipoAsignado, setTipoAsignado] = useState<'OPERARIO' | 'AUXILIAR'>('OPERARIO')
  const [form, setForm] = useState<{
    descripcion: string; fechaLimite: string; idSiembra: number; idTipoTarea: number
  }>(FORM_INICIAL)

  const isOnline = useOfflineStatus()

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      try {
        if (isOnline) {
          const [t, s, tt] = await Promise.all([
            tareasApi.listar(),
            siembrasApi.listar(),
            tiposTareaApi.listar(),
          ])
          if (!cancelado) {
            setTareas(Array.isArray(t) ? t : [])
            setSiembras(Array.isArray(s) ? s : [])
            setTiposTarea(Array.isArray(tt) ? tt : [])
            await cacheData('tareas', Array.isArray(t) ? t : [])
            await cacheData('siembras', Array.isArray(s) ? s : [])
          }
          try {
            const p = await usuariosApi.listar()
            if (!cancelado) setPersonal(Array.isArray(p) ? p.filter(u => u.rol === 'OPERARIO' || u.rol === 'AUXILIAR') : [])
          } catch { /* sin personal */ }
        } else {
          const [t, s] = await Promise.all([
            getCachedData('tareas'),
            getCachedData('siembras'),
          ])
          if (!cancelado) {
            setTareas(t as never[])
            setSiembras(s as never[])
          }
        }
      } catch {
        const t = await getCachedData('tareas')
        if (!cancelado && t.length > 0) setTareas(t as never[])
        else if (!cancelado) setError('No se pudieron cargar las tareas.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [isOnline])

  const recargar = async () => {
    try { const t = await tareasApi.listar(); setTareas(Array.isArray(t) ? t : []) }
    catch { setError('Error al recargar.') }
  }

  const tareasFiltradas = tareas.filter(t => {
    const estadoActual  = getEstadoTarea(t)
    const matchFiltro   = filtro === 'TODAS' || estadoActual === filtro
    const matchBusqueda = !busqueda ||
      t.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.tipoTarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.nombreSiembra?.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  const completadas = tareas.filter(t => getEstadoTarea(t) === 'COMPLETADA').length
  const progreso    = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.idSiembra || !form.idTipoTarea || !form.fechaLimite) {
      setError('Completa todos los campos requeridos.')
      return
    }
    setSaving(true)
    try {
      const req: TareaRequest = {
        descripcion:  form.descripcion,
        fechaLimite:  new Date(form.fechaLimite).toISOString(),
        idSiembra:    form.idSiembra,
        idTipoTarea:  form.idTipoTarea,
      }
      await tareasApi.crear(req)
      setModalOpen(false)
      setForm(FORM_INICIAL)
      await recargar()
    } catch {
      setError('Error al crear la tarea.')
    } finally {
      setSaving(false)
    }
  }

  const handleAsignar = async () => {
    if (!asignarModal || !idAsignado) {
      setError('Selecciona una persona para asignar.')
      return
    }
    setAsignando(true)
    try {
      const body = tipoAsignado === 'OPERARIO'
        ? { idOperario: idAsignado }
        : { idAuxiliar: idAsignado }
      await tareasApi.asignar(asignarModal.idTarea, body)
      setAsignarModal(null)
      await recargar()
    } catch {
      setError('Error al asignar la tarea.')
    } finally {
      setAsignando(false)
    }
  }

  const cambiarEstado = async (tarea: Tarea, nuevoEstado: EstadoTarea) => {
    const asignacion = tarea.asignaciones?.[0]
    if (!asignacion?.idEjecucion) {
      setError('No se puede cambiar el estado: la tarea no tiene asignación.')
      return
    }
    try {
      await tareasApi.actualizarEstado(asignacion.idEjecucion, { estado: nuevoEstado })
      await recargar()
    } catch {
      setError('Error al actualizar el estado.')
    }
  }

  const personalFiltrado = personal.filter(p => p.rol === tipoAsignado && p.activo)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Mis Tareas</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            Organiza las actividades de tu finca
          </p>
        </div>
        <button onClick={() => { setForm(FORM_INICIAL); setModalOpen(true) }} className="btn-primary">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span>
          Nueva Tarea
        </button>
      </div>

      {/* Progreso */}
      {tareas.length > 0 && (
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-on-surface)' }}>Progreso general</span>
            <span style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--color-primary)' }}>{progreso}% Completado</span>
          </div>
          <div style={{ height:'8px', backgroundColor:'var(--color-surface-container-high)', borderRadius:'9999px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progreso}%`, backgroundColor:'var(--color-primary)', borderRadius:'9999px', transition:'width 0.5s' }} />
          </div>
          <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
            {(['PENDIENTE','EN_PROGRESO','COMPLETADA'] as EstadoTarea[]).map(e => (
              <span key={e} style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)' }}>
                <span style={{ fontWeight:700, color: ESTADO_CONFIG[e].color }}>
                  {tareas.filter(t => getEstadoTarea(t) === e).length}
                </span>{' '}{ESTADO_CONFIG[e].label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <span className="material-symbols-outlined" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)' }}>search</span>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar tarea..." className="input-field" style={{ paddingLeft:'40px', minHeight:'40px' }} />
        </div>
        <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
          {ESTADOS.map(est => (
            <button key={est.key} onClick={() => setFiltro(est.key)}
              style={{ padding:'8px 16px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:500,
                backgroundColor: filtro === est.key ? 'var(--color-primary)' : 'var(--color-surface-container)',
                color: filtro === est.key ? 'white' : 'var(--color-on-surface-variant)' }}>
              {est.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem' }}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
          <span style={{flex:1}}>{error}</span>
          <button onClick={() => setError(null)}><span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span></button>
        </div>
      )}

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>progress_activity</span></div>}

      {!loading && tareasFiltradas.length === 0 && !error && (
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'56px', color:'var(--color-primary-fixed)', marginBottom:'16px' }}>assignment</span>
          <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--color-on-surface)', marginBottom:'8px' }}>
            {busqueda || filtro !== 'TODAS' ? 'No hay tareas con ese filtro' : 'No hay tareas registradas'}
          </h2>
          {!busqueda && filtro === 'TODAS' && (
            <button onClick={() => { setForm(FORM_INICIAL); setModalOpen(true) }} className="btn-primary" style={{ marginTop:'16px' }}>
              <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span> Crear primera tarea
            </button>
          )}
        </div>
      )}

      {/* Lista tareas */}
      {!loading && tareasFiltradas.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {tareasFiltradas.map(tarea => {
            const estadoActual = getEstadoTarea(tarea)
            const cfg = ESTADO_CONFIG[estadoActual] ?? ESTADO_CONFIG['PENDIENTE']
            const vencida = tarea.fechaLimite && new Date(parseFecha(tarea.fechaLimite)) < new Date() && estadoActual !== 'COMPLETADA'
            const asignacion = tarea.asignaciones?.[0]
            const asignado   = asignacion?.operarioAsignado ?? asignacion?.auxiliarAsignado

            return (
              <div key={tarea.idTarea} className="card" style={{ display:'flex', alignItems:'flex-start', gap:'16px', padding:'16px', borderLeft:`4px solid ${cfg.color}` }}>

                {/* Checkbox */}
                <div onClick={() => cambiarEstado(tarea, estadoActual === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA')}
                  style={{ width:'24px', height:'24px', borderRadius:'6px', flexShrink:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    border:`2px solid ${cfg.color}`, backgroundColor: estadoActual === 'COMPLETADA' ? cfg.color : 'transparent', transition:'all 0.2s', marginTop:'2px' }}>
                  {estadoActual === 'COMPLETADA' && <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'white' }}>check</span>}
                </div>

                {/* Contenido */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--color-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {tarea.tipoTarea ?? 'Tarea'}
                    </span>
                    <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:600, backgroundColor:cfg.bg, color:cfg.color }}>
                      {cfg.label}
                    </span>
                    {vencida && <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:600, backgroundColor:'var(--color-error-container)', color:'var(--color-error)' }}>Vencida</span>}
                  </div>
                  <p style={{ fontWeight:600, margin:'4px 0', fontSize:'0.9375rem',
                    color: estadoActual === 'COMPLETADA' ? 'var(--color-on-surface-variant)' : 'var(--color-on-surface)',
                    textDecoration: estadoActual === 'COMPLETADA' ? 'line-through' : 'none' }}>
                    {tarea.descripcion || tarea.tipoTarea || 'Sin descripción'}
                  </p>
                  <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                    {tarea.nombreSiembra && (
                      <span style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:'2px' }}>
                        <span className="material-symbols-outlined" style={{fontSize:'14px'}}>potted_plant</span>{tarea.nombreSiembra}
                      </span>
                    )}
                    {tarea.fechaLimite && (
                      <span style={{ fontSize:'0.75rem', color: vencida ? 'var(--color-error)' : 'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:'2px' }}>
                        <span className="material-symbols-outlined" style={{fontSize:'14px'}}>calendar_today</span>
                        {new Date(parseFecha(tarea.fechaLimite)).toLocaleDateString('es-CO')}
                      </span>
                    )}
                    {asignado && (
                      <span style={{ fontSize:'0.75rem', color:'var(--color-primary)', display:'flex', alignItems:'center', gap:'2px' }}>
                        <span className="material-symbols-outlined" style={{fontSize:'14px'}}>person</span>{asignado}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px', flexShrink:0 }}>
                  {/* Asignar */}
                  <button onClick={() => { setAsignarModal(tarea); setIdAsignado(0) }}
                    style={{ padding:'6px 10px', borderRadius:'8px', border:'1px solid var(--color-outline-variant)', cursor:'pointer', fontSize:'0.75rem', fontWeight:600,
                      backgroundColor:'var(--color-surface-container-low)', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:'4px' }}>
                    <span className="material-symbols-outlined" style={{fontSize:'16px'}}>person_add</span>
                    {asignado ? 'Reasignar' : 'Asignar'}
                  </button>
                  {/* Cambiar estado */}
                  <select value={estadoActual} onChange={e => cambiarEstado(tarea, e.target.value as EstadoTarea)}
                    style={{ padding:'4px 8px', borderRadius:'8px', border:'1px solid var(--color-outline-variant)', fontSize:'0.75rem',
                      color:'var(--color-on-surface)', backgroundColor:'var(--color-surface-container-low)', cursor:'pointer' }}>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PROGRESO">En proceso</option>
                    <option value="COMPLETADA">Completada</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal crear tarea */}
      {modalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'480px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Nueva Tarea</h2>
              <button onClick={() => setModalOpen(false)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label className="input-label">Tipo de tarea *</label>
                <select value={form.idTipoTarea} onChange={e => setForm(p => ({...p, idTipoTarea: Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona el tipo...</option>
                  {tiposTarea.map(t => <option key={t.idTipoTarea} value={t.idTipoTarea}>{t.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Cultivo (siembra) *</label>
                <select value={form.idSiembra} onChange={e => setForm(p => ({...p, idSiembra: Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona un cultivo...</option>
                  {siembras.map(s => <option key={s.idSiembra} value={s.idSiembra}>{s.nombreCultivo} — {s.nombreFinca} L{s.numLote}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Descripción</label>
                <input type="text" value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))}
                  placeholder="Describe la actividad..." className="input-field" />
              </div>
              <div>
                <label className="input-label">Fecha límite *</label>
                <input type="datetime-local" value={form.fechaLimite} onChange={e => setForm(p => ({...p, fechaLimite: e.target.value}))} className="input-field" required />
              </div>
              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</> : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>save</span> Crear Tarea</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal asignar tarea */}
      {asignarModal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'440px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Asignar Tarea</h2>
              <button onClick={() => setAsignarModal(null)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'16px' }}>
              Tarea: <strong>{asignarModal.descripcion || asignarModal.tipoTarea}</strong>
            </p>

            {/* Tipo de persona */}
            <div style={{ marginBottom:'12px' }}>
              <label className="input-label">Tipo</label>
              <div style={{ display:'flex', gap:'8px' }}>
                {(['OPERARIO','AUXILIAR'] as const).map(tipo => (
                  <button key={tipo} type="button" onClick={() => { setTipoAsignado(tipo); setIdAsignado(0) }}
                    style={{ flex:1, padding:'10px', borderRadius:'8px', border:`2px solid ${tipoAsignado === tipo ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                      cursor:'pointer', fontSize:'0.875rem', fontWeight:600,
                      backgroundColor: tipoAsignado === tipo ? 'var(--color-primary-fixed)' : 'transparent',
                      color: tipoAsignado === tipo ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Seleccionar persona */}
            <div style={{ marginBottom:'16px' }}>
              <label className="input-label">Persona *</label>
              {personalFiltrado.length === 0 ? (
                <div style={{ padding:'12px', borderRadius:'8px', backgroundColor:'var(--color-surface-container)', fontSize:'0.875rem', color:'var(--color-on-surface-variant)' }}>
                  No hay {tipoAsignado.toLowerCase()}s registrados. Ve a Mi Finca → Personal para agregar.
                </div>
              ) : (
                <select value={idAsignado} onChange={e => setIdAsignado(Number(e.target.value))} className="input-field">
                  <option value={0}>Selecciona una persona...</option>
                  {personalFiltrado.map(p => (
                    <option key={p.idUsuario} value={p.idUsuario}>{p.nombre} {p.apellido} — {p.correo}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setAsignarModal(null)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
              <button onClick={handleAsignar} disabled={asignando || !idAsignado} className="btn-primary" style={{flex:1}}>
                {asignando ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Asignando...</> : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>person_add</span> Asignar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
