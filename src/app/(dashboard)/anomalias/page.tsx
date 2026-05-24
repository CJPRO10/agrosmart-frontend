'use client'

import { useState, useEffect } from 'react'
import { anomaliasApi } from '@/lib/api/anomalias'
import { siembrasApi } from '@/lib/api/siembras'
import type { SiembraResponse } from '@/lib/api/siembras'

type TipoAnomalia  = 'PLAGA' | 'ENFERMEDAD' | 'CLIMATICA' | 'OTRA'
type EstadoAnomalia = 'ACTIVA' | 'EN_SEGUIMIENTO' | 'RESUELTA'
type NivelSeveridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'

interface AnomaliaBackend {
  idAnomalia: number
  nombre: string
  tipo: TipoAnomalia
  estado: EstadoAnomalia
  descripcion: string
  nivelSeveridad: NivelSeveridad
  fechaDeteccion: string
  idSiembra: number
  nombreCultivo: string
  nombreFinca: string
  registradoPor?: string
}

const SEVERIDAD_CONFIG: Record<NivelSeveridad, { bg: string; color: string; label: string }> = {
  BAJA:    { bg:'var(--color-primary-fixed)',   color:'var(--color-primary)',   label:'Baja'    },
  MEDIA:   { bg:'var(--color-tertiary-fixed)',  color:'var(--color-tertiary)',  label:'Media'   },
  ALTA:    { bg:'#fff3cd',                      color:'#856404',               label:'Alta'    },
  CRITICA: { bg:'var(--color-error-container)', color:'var(--color-error)',     label:'Crítica' },
}

const TIPO_ICONS: Record<TipoAnomalia, string> = {
  PLAGA: 'pest_control', ENFERMEDAD: 'coronavirus', CLIMATICA: 'thunderstorm', OTRA: 'warning',
}

const ESTADO_LABELS: Record<EstadoAnomalia, string> = {
  ACTIVA: 'Activa', EN_SEGUIMIENTO: 'En seguimiento', RESUELTA: 'Resuelta',
}

interface FormData {
  nombre: string; tipo: TipoAnomalia; estado: EstadoAnomalia; descripcion: string
  nivelSeveridad: NivelSeveridad; idSiembra: number; fechaDeteccion: string
}

const FORM_INICIAL: FormData = {
  nombre:'', tipo:'PLAGA', estado:'ACTIVA', descripcion:'', nivelSeveridad:'MEDIA', idSiembra:0, fechaDeteccion: new Date().toISOString().slice(0,16)
}

export default function AnomaliasPage() {
  const [anomalias, setAnomalias] = useState<AnomaliaBackend[]>([])
  const [siembras, setSiembras]   = useState<SiembraResponse[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando]   = useState<AnomaliaBackend | null>(null)
  const [saving, setSaving]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AnomaliaBackend | null>(null)
  const [filtroEstado, setFiltroEstado]   = useState<EstadoAnomalia | 'TODAS'>('TODAS')
  const [busqueda, setBusqueda]           = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(FORM_INICIAL)

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      try {
        const [a, s] = await Promise.all([anomaliasApi.listar(), siembrasApi.listar()])
        if (!cancelado) { setAnomalias(a as unknown as AnomaliaBackend[]); setSiembras(s) }
      } catch {
        if (!cancelado) setError('No se pudieron cargar las anomalías.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const recargar = async () => {
    try { const a = await anomaliasApi.listar(); setAnomalias(a as unknown as AnomaliaBackend[]) }
    catch { setError('Error al recargar.') }
  }

  const anomaliasFiltradas = anomalias.filter(a => {
    const matchEstado   = filtroEstado === 'TODAS' || a.estado === filtroEstado
    const matchBusqueda = !busqueda || a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || a.nombreCultivo?.toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchBusqueda
  })

  const abrirCrear = () => { setForm(FORM_INICIAL); setEditando(null); setModalOpen(true) }
  const abrirEditar = (a: AnomaliaBackend) => {
    setForm({ nombre:a.nombre, tipo:a.tipo, estado:a.estado, descripcion:a.descripcion, nivelSeveridad:a.nivelSeveridad, idSiembra:a.idSiembra, fechaDeteccion:a.fechaDeteccion?.slice(0,16) ?? '' })
    setEditando(a); setModalOpen(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.idSiembra) { setError('Selecciona un cultivo.'); return }
    setSaving(true)
    try {
      if (editando) {
        await anomaliasApi.actualizar(editando.idAnomalia, form as never)
      } else {
        await anomaliasApi.crear(form as never)
      }
      setModalOpen(false)
      setEditando(null)
      await recargar()
      // RF33/34 — informar que se generó recomendación y alerta automáticamente
      setSuccess('Anomalía guardada. Se generó una recomendación y alerta automáticamente.')
      setTimeout(() => setSuccess(null), 5000)
    } catch {
      setError('Error al guardar la anomalía.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (a: AnomaliaBackend) => {
    try { await anomaliasApi.eliminar(a.idAnomalia); setConfirmDelete(null); await recargar() }
    catch { setError('Error al eliminar.') }
  }

  const activas   = anomalias.filter(a => a.estado === 'ACTIVA').length
  const criticas  = anomalias.filter(a => a.nivelSeveridad === 'CRITICA').length
  const resueltas = anomalias.filter(a => a.estado === 'RESUELTA').length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Problemas en mis cultivos</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>Monitoreo y seguimiento de anomalías detectadas en el campo</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span> Reportar Problema
        </button>
      </div>

      {/* Resumen */}
      {anomalias.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:'12px' }}>
          {[
            { label:'Reportes activos', value:activas,   icon:'warning',       color:'var(--color-error)'    },
            { label:'Casos críticos',   value:criticas,  icon:'crisis_alert',  color:'var(--color-tertiary)' },
            { label:'Resueltos',        value:resueltas, icon:'check_circle',  color:'var(--color-primary)'  },
            { label:'Total',            value:anomalias.length, icon:'summarize', color:'var(--color-secondary)' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color:stat.color }}>{stat.icon}</span>
              <p style={{ fontSize:'1.5rem', fontWeight:700, color:stat.color, margin:0 }}>{stat.value}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <span className="material-symbols-outlined" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)' }}>search</span>
          <input type="text" value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por cultivo o problema..." className="input-field" style={{ paddingLeft:'40px', minHeight:'40px' }} />
        </div>
        {(['TODAS','ACTIVA','EN_SEGUIMIENTO','RESUELTA'] as const).map(est => (
          <button key={est} onClick={()=>setFiltroEstado(est)}
            style={{ padding:'8px 14px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
              backgroundColor: filtroEstado === est ? 'var(--color-primary)' : 'var(--color-surface-container)',
              color: filtroEstado === est ? 'white' : 'var(--color-on-surface-variant)' }}>
            {est === 'TODAS' ? 'Todos' : ESTADO_LABELS[est as EstadoAnomalia]}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem' }}>
        <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
        <span style={{flex:1}}>{error}</span>
        <button onClick={()=>setError(null)}><span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span></button>
      </div>}

      {success && (
        <div className="animate-fade-in" style={{
          display:'flex', alignItems:'center', gap:'8px',
          padding:'12px 16px', borderRadius:'8px',
          backgroundColor:'var(--color-primary-fixed)',
          color:'var(--color-primary)', fontSize:'0.875rem'
        }}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>check_circle</span>
          <span style={{flex:1}}>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span>
          </button>
        </div>
      )}

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>progress_activity</span></div>}

      {!loading && anomaliasFiltradas.length === 0 && !error && (
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'56px', color:'var(--color-primary-fixed)', marginBottom:'16px' }}>bug_report</span>
          <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--color-on-surface)', marginBottom:'8px' }}>
            {busqueda || filtroEstado !== 'TODAS' ? 'Sin resultados para ese filtro' : '¡Sin problemas registrados!'}
          </h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', maxWidth:'360px', marginBottom:'16px' }}>
            {!busqueda && filtroEstado === 'TODAS' && 'Tus cultivos están bien. Reporta cualquier anomalía que detectes en el campo.'}
          </p>
          {!busqueda && filtroEstado === 'TODAS' && (
            <button onClick={abrirCrear} className="btn-primary">
              <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span> Reportar Problema
            </button>
          )}
        </div>
      )}

      {/* Lista anomalías */}
      {!loading && anomaliasFiltradas.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {anomaliasFiltradas.map(a => {
            const sev = SEVERIDAD_CONFIG[a.nivelSeveridad] ?? SEVERIDAD_CONFIG['MEDIA']
            return (
              <div key={a.idAnomalia} className="card" style={{ display:'flex', gap:'16px', padding:'16px', borderLeft:`4px solid ${sev.color}` }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'10px', flexShrink:0, backgroundColor:sev.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'22px', color:sev.color }}>{TIPO_ICONS[a.tipo]}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' }}>
                    <span style={{ fontWeight:600, color:'var(--color-on-surface)', fontSize:'0.9375rem' }}>{a.nombre}</span>
                    <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:700, backgroundColor:sev.bg, color:sev.color, textTransform:'uppercase' }}>{sev.label}</span>
                    <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:600, backgroundColor:'var(--color-surface-container)', color:'var(--color-on-surface-variant)' }}>{ESTADO_LABELS[a.estado]}</span>
                  </div>
                  {a.descripcion && <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:'0 0 6px' }}>{a.descripcion}</p>}
                  <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:'2px' }}>
                      <span className="material-symbols-outlined" style={{fontSize:'14px'}}>potted_plant</span>{a.nombreCultivo} — {a.nombreFinca}
                    </span>
                    <span style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:'2px' }}>
                      <span className="material-symbols-outlined" style={{fontSize:'14px'}}>calendar_today</span>
                      {a.fechaDeteccion ? new Date(a.fechaDeteccion).toLocaleDateString('es-CO') : '--'}
                    </span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'4px', alignItems:'flex-start' }}>
                  <button onClick={()=>abrirEditar(a)} style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-secondary)' }}>
                    <span className="material-symbols-outlined" style={{fontSize:'20px'}}>edit</span>
                  </button>
                  <button onClick={()=>setConfirmDelete(a)} style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-error)' }}>
                    <span className="material-symbols-outlined" style={{fontSize:'20px'}}>delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>{editando ? 'Editar Problema' : 'Reportar Problema'}</h2>
              <button onClick={()=>{setModalOpen(false);setEditando(null)}} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label className="input-label">Nombre del problema *</label>
                <input type="text" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Plaga en la yuca" className="input-field" required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Tipo</label>
                  <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value as TipoAnomalia}))} className="input-field">
                    <option value="PLAGA">Plaga</option>
                    <option value="ENFERMEDAD">Enfermedad</option>
                    <option value="CLIMATICA">Climática</option>
                    <option value="OTRA">Otra</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Severidad</label>
                  <select value={form.nivelSeveridad} onChange={e=>setForm(p=>({...p,nivelSeveridad:e.target.value as NivelSeveridad}))} className="input-field">
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Estado</label>
                  <select value={form.estado} onChange={e=>setForm(p=>({...p,estado:e.target.value as EstadoAnomalia}))} className="input-field">
                    <option value="ACTIVA">Activa</option>
                    <option value="EN_SEGUIMIENTO">En seguimiento</option>
                    <option value="RESUELTA">Resuelta</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Cultivo *</label>
                  <select value={form.idSiembra} onChange={e=>setForm(p=>({...p,idSiembra:Number(e.target.value)}))} className="input-field" required>
                    <option value={0}>Selecciona...</option>
                    {siembras.map(s=><option key={s.idSiembra} value={s.idSiembra}>{s.nombreCultivo} — L{s.numLote}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Descripción</label>
                <textarea value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))} placeholder="Describe el problema observado..." className="input-field" style={{ minHeight:'80px', resize:'vertical' }} />
              </div>
              <div>
                <label className="input-label">Fecha de detección</label>
                <input type="datetime-local" value={form.fechaDeteccion} onChange={e=>setForm(p=>({...p,fechaDeteccion:e.target.value}))} className="input-field" />
              </div>
              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={()=>{setModalOpen(false);setEditando(null)}} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</> : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>save</span> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'360px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'9999px', margin:'0 auto 16px', backgroundColor:'var(--color-error-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-error)' }}>delete</span>
            </div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'8px' }}>¿Eliminar anomalía?</h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>
              Se eliminará <strong>{confirmDelete.nombre}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=>setConfirmDelete(null)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
              <button onClick={()=>handleEliminar(confirmDelete)} className="btn-danger" style={{flex:1}}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
