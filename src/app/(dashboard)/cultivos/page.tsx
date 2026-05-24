'use client'

import { useState, useEffect } from 'react'
import { siembrasApi, cultivosApi, estadosCultivoApi } from '@/lib/api/siembras'
import { fincasApi } from '@/lib/api/fincas'
import type { SiembraResponse, SiembraRequest, CultivoResponse, EstadoCultivo } from '@/lib/api/siembras'
import type { Finca } from '@/types'

const ESTADO_COLORES: Record<string, string> = {
  'SIEMBRA':        'var(--color-secondary-fixed)',
  'CRECIMIENTO':    'var(--color-primary-fixed)',
  'FLORACION':      '#fff3cd',
  'COSECHA':        'var(--color-tertiary-fixed)',
  'COSECHA ACTIVA': 'var(--color-primary-fixed)',
  'PENDIENTE':      'var(--color-surface-container-high)',
}
const ESTADO_TEXT: Record<string, string> = {
  'SIEMBRA':        'var(--color-secondary)',
  'CRECIMIENTO':    'var(--color-primary)',
  'FLORACION':      '#856404',
  'COSECHA':        'var(--color-tertiary)',
  'COSECHA ACTIVA': 'var(--color-primary)',
  'PENDIENTE':      'var(--color-on-surface-variant)',
}

type ModalMode = 'crear' | 'editar' | null

const FORM_INICIAL: SiembraRequest = {
  idFinca: 0, idCultivo: 0, idEstadoCultivo: 1,
  fechaEstado: new Date().toISOString().slice(0, 16), numLote: 1,
}

export default function CultivosPage() {
  const [siembras, setSiembras]           = useState<SiembraResponse[]>([])
  const [cultivos, setCultivos]           = useState<CultivoResponse[]>([])
  const [estados, setEstados]             = useState<EstadoCultivo[]>([])
  const [fincas, setFincas]               = useState<Finca[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [modalMode, setModalMode]         = useState<ModalMode>(null)
  const [siembraActiva, setSiembraActiva] = useState<SiembraResponse | null>(null)
  const [saving, setSaving]               = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<SiembraResponse | null>(null)
  const [filtroFinca, setFiltroFinca]     = useState<number>(0)
  const [form, setForm]                   = useState<SiembraRequest>(FORM_INICIAL)

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      try {
        const [s, c, e, f] = await Promise.all([
          siembrasApi.listar(),
          cultivosApi.listar(),
          estadosCultivoApi.listar(),
          fincasApi.listar(),
        ])
        if (!cancelado) { setSiembras(s); setCultivos(c); setEstados(e); setFincas(f) }
      } catch {
        if (!cancelado) setError('No se pudieron cargar los cultivos.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const recargar = async () => {
    try {
      const data = await siembrasApi.listar()
      setSiembras(data)
    } catch { setError('Error al recargar.') }
  }

  const siembrasFiltradas = filtroFinca
    ? siembras.filter(s => s.nombreFinca === fincas.find(f => f.idFinca === filtroFinca)?.nombreFinca)
    : siembras

  const abrirCrear = () => {
    setForm({ ...FORM_INICIAL, idFinca: fincas[0]?.idFinca ?? 0, idCultivo: cultivos[0]?.idCultivo ?? 0, idEstadoCultivo: estados[0]?.idEstadoCultivo ?? 1 })
    setSiembraActiva(null)
    setModalMode('crear')
  }

  const cerrarModal = () => { setModalMode(null); setSiembraActiva(null) }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (modalMode === 'crear') {
        await siembrasApi.crear(form)
      } else if (modalMode === 'editar' && siembraActiva) {
        await siembrasApi.actualizar(siembraActiva.idSiembra, form)
      }
      cerrarModal()
      await recargar()
    } catch {
      setError('Error al guardar el cultivo.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (s: SiembraResponse) => {
    try {
      await siembrasApi.eliminar(s.idSiembra)
      setConfirmDelete(null)
      await recargar()
    } catch { setError('Error al eliminar.') }
  }

  const getEstadoColor  = (e: string) => ESTADO_COLORES[e?.toUpperCase()] ?? 'var(--color-surface-container)'
  const getEstadoText   = (e: string) => ESTADO_TEXT[e?.toUpperCase()]    ?? 'var(--color-on-surface-variant)'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Mis Cultivos</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            {siembras.length} siembra{siembras.length !== 1 ? 's' : ''} registrada{siembras.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {/* Filtro por finca */}
          <select
            value={filtroFinca}
            onChange={e => setFiltroFinca(Number(e.target.value))}
            className="input-field"
            style={{ minHeight:'40px', padding:'8px 12px', width:'auto' }}
          >
            <option value={0}>Todas las fincas</option>
            {fincas.map(f => <option key={f.idFinca} value={f.idFinca}>{f.nombreFinca}</option>)}
          </select>
          <button onClick={abrirCrear} className="btn-primary" style={{ whiteSpace:'nowrap' }}>
            <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span>
            Nuevo Cultivo
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-fade-in" style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem' }}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
          <span style={{flex:1}}>{error}</span>
          <button onClick={() => setError(null)}><span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span></button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>progress_activity</span>
        </div>
      )}

      {/* Sin cultivos */}
      {!loading && siembrasFiltradas.length === 0 && !error && (
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'56px', color:'var(--color-primary-fixed)', marginBottom:'16px' }}>potted_plant</span>
          <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--color-on-surface)', marginBottom:'8px' }}>No hay cultivos registrados</h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', maxWidth:'360px', marginBottom:'24px' }}>
            Registra tu primer cultivo para empezar a gestionar tus siembras y hacer seguimiento.
          </p>
          <button onClick={abrirCrear} className="btn-primary">
            <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span>
            Registrar primer cultivo
          </button>
        </div>
      )}

      {/* Grid cultivos */}
      {!loading && siembrasFiltradas.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1rem' }}>
          {siembrasFiltradas.map(s => (
            <div key={s.idSiembra} className="card" style={{ display:'flex', flexDirection:'column', gap:'1rem', position:'relative', overflow:'hidden' }}>

              {/* Badge estado */}
              <div style={{ position:'absolute', top:'16px', right:'16px' }}>
                <span style={{
                  padding:'3px 10px', borderRadius:'9999px', fontSize:'11px', fontWeight:700,
                  backgroundColor: getEstadoColor(s.nombreEstado),
                  color: getEstadoText(s.nombreEstado),
                  textTransform:'uppercase', letterSpacing:'0.05em'
                }}>{s.nombreEstado}</span>
              </div>

              {/* Icono + nombre */}
              <div style={{ display:'flex', alignItems:'center', gap:'12px', paddingRight:'80px' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'10px', flexShrink:0, backgroundColor:'var(--color-primary-fixed)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'var(--color-primary)' }}>potted_plant</span>
                </div>
                <div>
                  <h3 style={{ fontWeight:700, color:'var(--color-on-surface)', margin:0, fontSize:'1rem' }}>{s.nombreCultivo}</h3>
                  <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>
                    {s.nombreFinca} · Lote {s.numLote}
                  </p>
                </div>
              </div>

              {/* Fechas */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div style={{ backgroundColor:'var(--color-surface-container-low)', borderRadius:'8px', padding:'10px' }}>
                  <p style={{ fontSize:'0.7rem', color:'var(--color-on-surface-variant)', margin:'0 0 2px' }}>Siembra</p>
                  <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--color-on-surface)', margin:0 }}>
                    {s.fechaSiembra ? new Date(s.fechaSiembra).toLocaleDateString('es-CO') : '--'}
                  </p>
                </div>
                <div style={{ backgroundColor:'var(--color-surface-container-low)', borderRadius:'8px', padding:'10px' }}>
                  <p style={{ fontSize:'0.7rem', color:'var(--color-on-surface-variant)', margin:'0 0 2px' }}>Último estado</p>
                  <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--color-on-surface)', margin:0 }}>
                    {s.fechaEstado ? new Date(s.fechaEstado).toLocaleDateString('es-CO') : '--'}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display:'flex', gap:'8px', paddingTop:'8px', borderTop:'1px solid var(--color-outline-variant)' }}>
                <button
                  onClick={() => { setForm({ idFinca: fincas.find(f=>f.nombreFinca===s.nombreFinca)?.idFinca ?? 0, idCultivo: cultivos.find(c=>c.nombre===s.nombreCultivo)?.idCultivo ?? 0, idEstadoCultivo: estados.find(e=>e.nombre===s.nombreEstado)?.idEstadoCultivo ?? 1, fechaEstado: s.fechaEstado?.slice(0,16) ?? '', numLote: s.numLote }); setSiembraActiva(s); setModalMode('editar') }}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'8px', borderRadius:'8px', fontSize:'0.875rem', fontWeight:500, border:'none', cursor:'pointer', color:'var(--color-secondary)', backgroundColor:'transparent', transition:'background 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-secondary-fixed)')}
                  onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}
                >
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>edit</span> Editar
                </button>
                <button
                  onClick={() => setConfirmDelete(s)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'8px', borderRadius:'8px', fontSize:'0.875rem', fontWeight:500, border:'none', cursor:'pointer', color:'var(--color-error)', backgroundColor:'transparent', transition:'background 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-error-container)')}
                  onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}
                >
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>delete</span> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalMode && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'480px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>
                {modalMode === 'crear' ? 'Nuevo Cultivo' : 'Editar Cultivo'}
              </h2>
              <button onClick={cerrarModal} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Finca */}
              <div>
                <label className="input-label">Finca</label>
                <select value={form.idFinca} onChange={e=>setForm(p=>({...p, idFinca:Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona una finca...</option>
                  {fincas.map(f=><option key={f.idFinca} value={f.idFinca}>{f.nombreFinca}</option>)}
                </select>
              </div>

              {/* Tipo de cultivo */}
              <div>
                <label className="input-label">Tipo de cultivo</label>
                <select value={form.idCultivo} onChange={e=>setForm(p=>({...p, idCultivo:Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona un cultivo...</option>
                  {cultivos.map(c=><option key={c.idCultivo} value={c.idCultivo}>{c.nombre} — {c.nombreTipoCultivo}</option>)}
                </select>
              </div>

              {/* Estado y lote */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Estado</label>
                  <select value={form.idEstadoCultivo} onChange={e=>setForm(p=>({...p, idEstadoCultivo:Number(e.target.value)}))} className="input-field">
                    {estados.map(e=><option key={e.idEstadoCultivo} value={e.idEstadoCultivo}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">N° Lote</label>
                  <input type="number" min="1" value={form.numLote} onChange={e=>setForm(p=>({...p, numLote:Number(e.target.value)}))} className="input-field" required />
                </div>
              </div>

              {/* Fecha estado */}
              <div>
                <label className="input-label">Fecha del estado</label>
                <input type="datetime-local" value={form.fechaEstado} onChange={e=>setForm(p=>({...p, fechaEstado:e.target.value}))} className="input-field" required />
              </div>

              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={cerrarModal} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</> : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>save</span> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'360px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'9999px', margin:'0 auto 16px', backgroundColor:'var(--color-error-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-error)' }}>delete</span>
            </div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', marginBottom:'8px' }}>¿Eliminar cultivo?</h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>
              Se eliminará <strong>{confirmDelete.nombreCultivo}</strong> en <strong>{confirmDelete.nombreFinca}</strong>. Esta acción no se puede deshacer.
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
