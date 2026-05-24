'use client'

import { useState, useEffect } from 'react'
import { recomendacionesApi } from '@/lib/api/recomendaciones'
import { siembrasApi } from '@/lib/api/siembras'
import type { RecomendacionResponse, RecomendacionRequest } from '@/lib/api/recomendaciones'
import type { SiembraResponse } from '@/lib/api/siembras'

const PRIORIDAD_CONFIG: Record<string, { bg: string; color: string }> = {
  ALTA:   { bg:'var(--color-error-container)',   color:'var(--color-error)'     },
  MEDIA:  { bg:'var(--color-tertiary-fixed)',    color:'var(--color-tertiary)'  },
  BAJA:   { bg:'var(--color-primary-fixed)',     color:'var(--color-primary)'   },
}

const ESTADO_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  PENDIENTE: { bg:'var(--color-surface-container)', color:'var(--color-on-surface-variant)', label:'Pendiente' },
  APLICADA:  { bg:'var(--color-primary-fixed)',     color:'var(--color-primary)',            label:'Aplicada'  },
  IGNORADA:  { bg:'var(--color-surface-container)', color:'var(--color-outline)',            label:'Ignorada'  },
}

const FORM_INICIAL: RecomendacionRequest = { idSiembra: 0, descripcionSolicitud: '', categoria: 'RIEGO' }

const CATEGORIAS = ['RIEGO','FERTILIZACION','PLAGAS','ENFERMEDADES','COSECHA','SUELO','OTRO']

export default function RecomendacionesPage() {
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionResponse[]>([])
  const [siembras, setSiembras]               = useState<SiembraResponse[]>([])
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [modalOpen, setModalOpen]             = useState(false)
  const [saving, setSaving]                   = useState(false)
  const [filtroEstado, setFiltroEstado]       = useState<string>('TODAS')
  const [busqueda, setBusqueda]               = useState('')
  const [form, setForm]                       = useState<RecomendacionRequest>(FORM_INICIAL)

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      try {
        const [r, s] = await Promise.all([recomendacionesApi.listar(), siembrasApi.listar()])
        if (!cancelado) { setRecomendaciones(r); setSiembras(s) }
      } catch {
        if (!cancelado) setError('No se pudieron cargar las recomendaciones.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const recargar = async () => {
    try { const r = await recomendacionesApi.listar(); setRecomendaciones(r) }
    catch { setError('Error al recargar.') }
  }

  const filtradas = recomendaciones.filter(r => {
    const matchEstado   = filtroEstado === 'TODAS' || r.estado === filtroEstado
    const matchBusqueda = !busqueda || r.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) || r.categoria?.toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchBusqueda
  })

  const aplicadas  = recomendaciones.filter(r => r.estado === 'APLICADA').length
  const pendientes = recomendaciones.filter(r => r.estado === 'PENDIENTE').length
  const ignoradas  = recomendaciones.filter(r => r.estado === 'IGNORADA').length
  const efectividad = recomendaciones.length ? Math.round((aplicadas / recomendaciones.length) * 100) : 0

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.idSiembra) { setError('Selecciona un cultivo.'); return }
    setSaving(true)
    try {
      await recomendacionesApi.solicitar(form)
      setModalOpen(false)
      setForm(FORM_INICIAL)
      await recargar()
    } catch {
      setError('Error al solicitar la recomendación.')
    } finally {
      setSaving(false)
    }
  }

  const handleIgnorar = async (id: number) => {
    try { await recomendacionesApi.ignorar(id); await recargar() }
    catch { setError('Error al ignorar.') }
  }

  const handleReaccionar = async (id: number, reaccion: string) => {
    try { await recomendacionesApi.reaccionar(id, reaccion); await recargar() }
    catch { setError('Error al reaccionar.') }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* ------- Encabezado ------- */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Consejos y Recomendaciones</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            Estrategias personalizadas para mejorar tu producción
          </p>
        </div>
        <button onClick={() => { setForm(FORM_INICIAL); setModalOpen(true) }} className="btn-primary">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span>
          Solicitar recomendación
        </button>
      </div>

      {/* ------- Stats ------- */}
      {recomendaciones.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:'12px' }}>
          {[
            { label:'Aplicadas',   value:aplicadas,   icon:'check_circle', color:'var(--color-primary)'   },
            { label:'Pendientes',  value:pendientes,  icon:'pending',      color:'var(--color-secondary)'  },
            { label:'Efectividad', value:`${efectividad}%`, icon:'trending_up', color:'var(--color-tertiary)' },
            { label:'Ignoradas',   value:ignoradas,   icon:'do_not_disturb', color:'var(--color-outline)' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color:stat.color }}>{stat.icon}</span>
              <p style={{ fontSize:'1.5rem', fontWeight:700, color:stat.color, margin:0 }}>{stat.value}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ------- Filtros ------- */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <span className="material-symbols-outlined" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)' }}>search</span>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar recomendación..." className="input-field" style={{ paddingLeft:'40px', minHeight:'40px' }} />
        </div>
        {(['TODAS','PENDIENTE','APLICADA','IGNORADA']).map(est => (
          <button key={est} onClick={() => setFiltroEstado(est)}
            style={{ padding:'8px 14px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
              backgroundColor: filtroEstado === est ? 'var(--color-primary)' : 'var(--color-surface-container)',
              color: filtroEstado === est ? 'white' : 'var(--color-on-surface-variant)' }}>
            {est === 'TODAS' ? 'Todas' : ESTADO_CONFIG[est]?.label ?? est}
          </button>
        ))}
      </div>

      {/* ------- Error ------- */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem' }}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
          <span style={{flex:1}}>{error}</span>
          <button onClick={() => setError(null)}><span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span></button>
        </div>
      )}

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>progress_activity</span></div>}

      {!loading && filtradas.length === 0 && !error && (
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'56px', color:'var(--color-primary-fixed)', marginBottom:'16px' }}>lightbulb</span>
          <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--color-on-surface)', marginBottom:'8px' }}>
            {busqueda || filtroEstado !== 'TODAS' ? 'Sin resultados' : 'Sin recomendaciones aún'}
          </h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', maxWidth:'360px', marginBottom:'24px' }}>
            {!busqueda && filtroEstado === 'TODAS' && 'Solicita una recomendación personalizada basada en tus cultivos y condiciones climáticas.'}
          </p>
          {!busqueda && filtroEstado === 'TODAS' && (
            <button onClick={() => { setForm(FORM_INICIAL); setModalOpen(true) }} className="btn-primary">
              <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span> Solicitar primera recomendación
            </button>
          )}
        </div>
      )}

      {/* ------- Lista ------- */}
      {!loading && filtradas.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {filtradas.map(r => {
            const prio  = PRIORIDAD_CONFIG[r.prioridad]  ?? PRIORIDAD_CONFIG['BAJA']
            const est   = ESTADO_CONFIG[r.estado]        ?? ESTADO_CONFIG['PENDIENTE']
            return (
              <div key={r.idRecomendacion} className="card" style={{ display:'flex', gap:'16px', borderLeft:`4px solid ${prio.color}`, opacity: r.estado === 'IGNORADA' ? 0.6 : 1 }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'10px', flexShrink:0, backgroundColor:prio.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'22px', color:prio.color }}>lightbulb</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'6px' }}>
                    {r.categoria && (
                      <span style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--color-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{r.categoria}</span>
                    )}
                    {r.prioridad && (
                      <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:700, backgroundColor:prio.bg, color:prio.color }}>{r.prioridad}</span>
                    )}
                    <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:600, backgroundColor:est.bg, color:est.color }}>{est.label}</span>
                  </div>
                  <p style={{ fontSize:'0.9375rem', color:'var(--color-on-surface)', margin:'0 0 8px', lineHeight:1.5 }}>{r.descripcion}</p>
                  {r.fechaGeneracion && (
                    <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0, display:'flex', alignItems:'center', gap:'2px' }}>
                      <span className="material-symbols-outlined" style={{fontSize:'14px'}}>schedule</span>
                      {new Date(r.fechaGeneracion).toLocaleDateString('es-CO', { day:'numeric', month:'long' })}
                    </p>
                  )}
                </div>
                {r.estado === 'PENDIENTE' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'4px', alignItems:'flex-end', flexShrink:0 }}>
                    <button onClick={() => handleReaccionar(r.idRecomendacion, 'UTIL')}
                      style={{ padding:'6px 12px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, backgroundColor:'var(--color-primary-fixed)', color:'var(--color-primary)', whiteSpace:'nowrap' }}>
                      ✓ Aplicar
                    </button>
                    <button onClick={() => handleIgnorar(r.idRecomendacion)}
                      style={{ padding:'6px 12px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'0.8rem', color:'var(--color-on-surface-variant)', backgroundColor:'transparent' }}>
                      × Ignorar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ------- Modal solicitar ------- */}
      {modalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'480px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Solicitar Recomendación</h2>
              <button onClick={() => setModalOpen(false)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSolicitar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label className="input-label">Cultivo *</label>
                <select value={form.idSiembra} onChange={e => setForm(p => ({...p, idSiembra: Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona un cultivo...</option>
                  {siembras.map(s => <option key={s.idSiembra} value={s.idSiembra}>{s.nombreCultivo} — {s.nombreFinca} L{s.numLote}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Categoría</label>
                <select value={form.categoria} onChange={e => setForm(p => ({...p, categoria: e.target.value}))} className="input-field">
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Describe tu situación o consulta</label>
                <textarea value={form.descripcionSolicitud} onChange={e => setForm(p => ({...p, descripcionSolicitud: e.target.value}))}
                  placeholder="Ej: Mis plantas de maíz tienen manchas amarillas en las hojas, ¿qué debo hacer?"
                  className="input-field" style={{ minHeight:'100px', resize:'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving
                    ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Generando...</>
                    : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>lightbulb</span> Generar</>
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
