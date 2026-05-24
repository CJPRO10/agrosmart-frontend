'use client'

import { useState, useEffect, useCallback } from 'react'
import { notificacionesApi } from '@/lib/api/notificaciones'
import { useUIStore } from '@/store/uiStore'
import type {
  NotificacionResponse, TipoNotificacion,
  PrioridadNotificacion, EstadoNotificacion, PreferenciaRequest
} from '@/lib/api/notificaciones'

// ── Config visual ────────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<TipoNotificacion, { icon: string; color: string; bg: string; label: string }> = {
  ANOMALIA:      { icon:'bug_report',     color:'var(--color-error)',     bg:'var(--color-error-container)',   label:'Anomalía'       },
  RECOMENDACION: { icon:'lightbulb',      color:'var(--color-tertiary)',  bg:'var(--color-tertiary-fixed)',    label:'Recomendación'  },
  CLIMA:         { icon:'cloudy_snowing', color:'var(--color-secondary)', bg:'var(--color-secondary-fixed)',  label:'Clima'          },
  RECORDATORIO:  { icon:'alarm',          color:'var(--color-primary)',   bg:'var(--color-primary-fixed)',     label:'Recordatorio'   },
}

const PRIORIDAD_CONFIG: Record<PrioridadNotificacion, { color: string; bg: string; label: string }> = {
  ALTA:  { color:'var(--color-error)',     bg:'var(--color-error-container)',  label:'Alta'  },
  MEDIA: { color:'var(--color-tertiary)',  bg:'var(--color-tertiary-fixed)',   label:'Media' },
  BAJA:  { color:'var(--color-primary)',   bg:'var(--color-primary-fixed)',    label:'Baja'  },
}

function parseFecha(fecha: unknown): string {
  if (!fecha) return ''
  if (Array.isArray(fecha)) {
    const [y, m, d, h = 0, min = 0] = fecha as number[]
    return new Date(y, m - 1, d, h, min).toISOString()
  }
  return String(fecha)
}

export default function NotificacionesPage() {
  const { setNotificacionesCount } = useUIStore()

  const [notificaciones, setNotificaciones] = useState<NotificacionResponse[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [modalPreferencias, setModalPreferencias] = useState(false)

  // Filtros — RF49
  const [filtroTipo, setFiltroTipo]         = useState<TipoNotificacion | 'TODAS'>('TODAS')
  const [filtroPrioridad, setFiltroPrioridad] = useState<PrioridadNotificacion | 'TODAS'>('TODAS')
  const [filtroEstado, setFiltroEstado]     = useState<EstadoNotificacion | 'TODAS'>('TODAS')

  // Preferencias — RF52
  const [prefForm, setPrefForm] = useState<PreferenciaRequest>({
    tipoAlerta: 'ANOMALIA', activo: true, nivelMinimoPrioridad: 'BAJA'
  })
  const [guardandoPref, setGuardandoPref] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await notificacionesApi.listar()
      const arr = Array.isArray(data) ? data : []
      setNotificaciones(arr)
      // Actualizar badge en sidebar
      setNotificacionesCount(arr.filter(n => n.estado === 'NO_LEIDA').length)
    } catch {
      setError('No se pudieron cargar las notificaciones.')
    } finally {
      setLoading(false)
    }
  }, [setNotificacionesCount])

  useEffect(() => { cargar() }, [cargar])

  // Aplicar filtros localmente — RF49
  const filtradas = notificaciones.filter(n => {
    const matchTipo      = filtroTipo === 'TODAS'      || n.tipo === filtroTipo
    const matchPrioridad = filtroPrioridad === 'TODAS' || n.prioridad === filtroPrioridad
    const matchEstado    = filtroEstado === 'TODAS'    || n.estado === filtroEstado
    return matchTipo && matchPrioridad && matchEstado
  })

  const noLeidas = notificaciones.filter(n => n.estado === 'NO_LEIDA').length

  // RF50 — marcar como leída
  const handleMarcarLeida = async (n: NotificacionResponse) => {
    if (n.estado === 'LEIDA') return
    try {
      await notificacionesApi.marcarLeida(n.idNotificacion)
      await cargar()
    } catch { setError('Error al marcar como leída.') }
  }

  // Marcar todas leídas
  const handleMarcarTodas = async () => {
    try {
      await notificacionesApi.marcarTodasLeidas()
      await cargar()
    } catch { setError('Error al marcar todas como leídas.') }
  }

  // RF52 — guardar preferencias
  const handleGuardarPreferencias = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardandoPref(true)
    try {
      await notificacionesApi.configurarPreferencia(prefForm)
      setModalPreferencias(false)
    } catch { setError('Error al guardar preferencias.') }
    finally { setGuardandoPref(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>
            Alertas y Notificaciones
          </h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'} · {notificaciones.length} en total
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {noLeidas > 0 && (
            <button onClick={handleMarcarTodas} className="btn-secondary" style={{ minHeight:'40px' }}>
              <span className="material-symbols-outlined" style={{fontSize:'18px'}}>done_all</span>
              Marcar todas leídas
            </button>
          )}
          <button onClick={() => setModalPreferencias(true)} className="btn-secondary" style={{ minHeight:'40px' }}>
            <span className="material-symbols-outlined" style={{fontSize:'18px'}}>tune</span>
            Preferencias
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:'12px' }}>
        {[
          { label:'Sin leer', value: noLeidas,                                              color:'var(--color-error)'     },
          { label:'Total',    value: notificaciones.length,                                 color:'var(--color-primary)'   },
          { label:'Urgentes', value: notificaciones.filter(n=>n.prioridad==='ALTA').length, color:'var(--color-error)'     },
          { label:'Clima',    value: notificaciones.filter(n=>n.tipo==='CLIMA').length,     color:'var(--color-secondary)' },
          { label:'Anomalías',value: notificaciones.filter(n=>n.tipo==='ANOMALIA').length,  color:'var(--color-tertiary)'  },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'12px', textAlign:'center' }}>
            <p style={{ fontSize:'1.5rem', fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
            <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros — RF49 */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
        {/* Tipo */}
        <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
          <button onClick={() => setFiltroTipo('TODAS')}
            style={{ padding:'6px 14px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
              backgroundColor: filtroTipo === 'TODAS' ? 'var(--color-primary)' : 'var(--color-surface-container)',
              color: filtroTipo === 'TODAS' ? 'white' : 'var(--color-on-surface-variant)' }}>
            Todas
          </button>
          {(Object.keys(TIPO_CONFIG) as TipoNotificacion[]).map(tipo => {
            const cfg = TIPO_CONFIG[tipo]
            return (
              <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                style={{ padding:'6px 14px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:500, display:'flex', alignItems:'center', gap:'4px',
                  backgroundColor: filtroTipo === tipo ? cfg.color : 'var(--color-surface-container)',
                  color: filtroTipo === tipo ? 'white' : 'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{fontSize:'14px'}}>{cfg.icon}</span>
                {cfg.label}
              </button>
            )
          })}
        </div>

        <div style={{ width:'1px', height:'24px', backgroundColor:'var(--color-outline-variant)' }} />

        {/* Prioridad */}
        {(['TODAS','ALTA','MEDIA','BAJA'] as const).map(p => (
          <button key={p} onClick={() => setFiltroPrioridad(p)}
            style={{ padding:'6px 14px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
              backgroundColor: filtroPrioridad === p
                ? (p === 'TODAS' ? 'var(--color-primary)' : PRIORIDAD_CONFIG[p as PrioridadNotificacion]?.color ?? 'var(--color-primary)')
                : 'var(--color-surface-container)',
              color: filtroPrioridad === p ? 'white' : 'var(--color-on-surface-variant)' }}>
            {p === 'TODAS' ? 'Prioridad' : p}
          </button>
        ))}

        <div style={{ width:'1px', height:'24px', backgroundColor:'var(--color-outline-variant)' }} />

        {/* Estado */}
        {(['TODAS','NO_LEIDA','LEIDA'] as const).map(est => (
          <button key={est} onClick={() => setFiltroEstado(est)}
            style={{ padding:'6px 14px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
              backgroundColor: filtroEstado === est ? 'var(--color-primary)' : 'var(--color-surface-container)',
              color: filtroEstado === est ? 'white' : 'var(--color-on-surface-variant)' }}>
            {est === 'TODAS' ? 'Estado' : est === 'NO_LEIDA' ? 'Sin leer' : 'Leídas'}
          </button>
        ))}

        {/* Limpiar */}
        {(filtroTipo !== 'TODAS' || filtroPrioridad !== 'TODAS' || filtroEstado !== 'TODAS') && (
          <button onClick={() => { setFiltroTipo('TODAS'); setFiltroPrioridad('TODAS'); setFiltroEstado('TODAS') }}
            style={{ padding:'6px 14px', borderRadius:'9999px', border:'1px solid var(--color-outline-variant)', cursor:'pointer', fontSize:'0.8rem', backgroundColor:'transparent', color:'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{fontSize:'14px', verticalAlign:'middle'}}>close</span> Limpiar
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem' }}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
          <span style={{flex:1}}>{error}</span>
          <button onClick={() => setError(null)}><span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span></button>
        </div>
      )}

      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>progress_activity</span>
        </div>
      )}

      {/* Sin notificaciones */}
      {!loading && filtradas.length === 0 && !error && (
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'56px', color:'var(--color-primary-fixed)', marginBottom:'16px' }}>
            notifications_off
          </span>
          <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--color-on-surface)', marginBottom:'8px' }}>
            {filtroTipo !== 'TODAS' || filtroPrioridad !== 'TODAS' || filtroEstado !== 'TODAS'
              ? 'Sin notificaciones con ese filtro'
              : '¡Sin notificaciones pendientes!'
            }
          </h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)' }}>
            Las alertas de anomalías, clima y recomendaciones aparecerán aquí.
          </p>
        </div>
      )}

      {/* Lista de notificaciones — RF48 */}
      {!loading && filtradas.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {filtradas.map(n => {
            const tipoCfg = TIPO_CONFIG[n.tipo]     ?? TIPO_CONFIG['RECORDATORIO']
            const prioCfg = PRIORIDAD_CONFIG[n.prioridad] ?? PRIORIDAD_CONFIG['BAJA']
            const noLeida = n.estado === 'NO_LEIDA'
            const fecha   = parseFecha(n.fechaCreacion)

            return (
              <div
                key={n.idNotificacion}
                onClick={() => handleMarcarLeida(n)}
                className="card"
                style={{
                  display:'flex', gap:'16px', padding:'16px', cursor: noLeida ? 'pointer' : 'default',
                  borderLeft:`4px solid ${noLeida ? tipoCfg.color : 'var(--color-outline-variant)'}`,
                  backgroundColor: noLeida ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
                  opacity: noLeida ? 1 : 0.8, transition:'all 0.2s'
                }}
              >
                {/* Icono tipo */}
                <div style={{ width:'44px', height:'44px', borderRadius:'10px', flexShrink:0, backgroundColor:tipoCfg.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'22px', color:tipoCfg.color }}>{tipoCfg.icon}</span>
                </div>

                {/* Contenido */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' }}>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, color:tipoCfg.color, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {tipoCfg.label}
                    </span>
                    <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:700, backgroundColor:prioCfg.bg, color:prioCfg.color }}>
                      {prioCfg.label}
                    </span>
                    {noLeida && (
                      <span style={{ width:'8px', height:'8px', borderRadius:'9999px', backgroundColor:'var(--color-error)', flexShrink:0 }} />
                    )}
                  </div>
                  <p style={{ fontWeight: noLeida ? 700 : 600, color:'var(--color-on-surface)', margin:'0 0 4px', fontSize:'0.9375rem' }}>
                    {n.titulo}
                  </p>
                  <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:'0 0 6px', lineHeight:1.5 }}>
                    {n.mensaje}
                  </p>
                  <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                    {fecha && (
                      <span style={{ fontSize:'0.75rem', color:'var(--color-outline)', display:'flex', alignItems:'center', gap:'2px' }}>
                        <span className="material-symbols-outlined" style={{fontSize:'14px'}}>schedule</span>
                        {new Date(fecha).toLocaleDateString('es-CO', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    )}
                    {n.nombreUsuario && (
                      <span style={{ fontSize:'0.75rem', color:'var(--color-outline)', display:'flex', alignItems:'center', gap:'2px' }}>
                        <span className="material-symbols-outlined" style={{fontSize:'14px'}}>person</span>
                        {n.nombreUsuario}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acción marcar leída — RF50 */}
                {noLeida && (
                  <div style={{ flexShrink:0, display:'flex', alignItems:'center' }}>
                    <button
                      onClick={e => { e.stopPropagation(); handleMarcarLeida(n) }}
                      title="Marcar como leída"
                      style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-primary)' }}
                      onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-primary-fixed)')}
                      onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}
                    >
                      <span className="material-symbols-outlined" style={{fontSize:'20px'}}>mark_email_read</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Preferencias — RF52 */}
      {modalPreferencias && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'460px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>
                Preferencias de notificaciones
              </h2>
              <button onClick={() => setModalPreferencias(false)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGuardarPreferencias} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Tipo de alerta */}
              <div>
                <label className="input-label">Tipo de alerta *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  {(Object.keys(TIPO_CONFIG) as TipoNotificacion[]).map(tipo => {
                    const cfg = TIPO_CONFIG[tipo]
                    const activo = prefForm.tipoAlerta === tipo
                    return (
                      <button key={tipo} type="button" onClick={() => setPrefForm(p=>({...p, tipoAlerta:tipo}))}
                        style={{ padding:'10px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'8px',
                          border:`2px solid ${activo ? cfg.color : 'var(--color-outline-variant)'}`,
                          cursor:'pointer', fontSize:'0.8rem', fontWeight:600,
                          backgroundColor: activo ? cfg.bg : 'transparent',
                          color: activo ? cfg.color : 'var(--color-on-surface-variant)' }}>
                        <span className="material-symbols-outlined" style={{fontSize:'18px'}}>{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nivel mínimo de prioridad */}
              <div>
                <label className="input-label">Prioridad mínima para recibir</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {(['BAJA','MEDIA','ALTA'] as PrioridadNotificacion[]).map(p => {
                    const cfg = PRIORIDAD_CONFIG[p]
                    const activo = prefForm.nivelMinimoPrioridad === p
                    return (
                      <button key={p} type="button" onClick={() => setPrefForm(prev=>({...prev, nivelMinimoPrioridad:p}))}
                        style={{ flex:1, padding:'8px', borderRadius:'8px',
                          border:`2px solid ${activo ? cfg.color : 'var(--color-outline-variant)'}`,
                          cursor:'pointer', fontSize:'0.8rem', fontWeight:600,
                          backgroundColor: activo ? cfg.bg : 'transparent',
                          color: activo ? cfg.color : 'var(--color-on-surface-variant)' }}>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Activar/desactivar */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-surface-container-low)' }}>
                <div>
                  <p style={{ fontWeight:600, color:'var(--color-on-surface)', margin:0, fontSize:'0.875rem' }}>Activar notificaciones</p>
                  <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>
                    Recibir alertas de este tipo
                  </p>
                </div>
                <button type="button" onClick={() => setPrefForm(p=>({...p, activo:!p.activo}))}
                  style={{ width:'48px', height:'26px', borderRadius:'9999px', border:'none', cursor:'pointer', transition:'background 0.2s', position:'relative',
                    backgroundColor: prefForm.activo ? 'var(--color-primary)' : 'var(--color-outline-variant)' }}>
                  <span style={{ position:'absolute', top:'3px', left: prefForm.activo ? '26px' : '3px', width:'20px', height:'20px', borderRadius:'9999px', backgroundColor:'white', transition:'left 0.2s', display:'block' }} />
                </button>
              </div>

              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={() => setModalPreferencias(false)} className="btn-secondary" style={{flex:1}}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoPref} className="btn-primary" style={{flex:1}}>
                  {guardandoPref
                    ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</>
                    : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>save</span> Guardar</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
