'use client'

import { useState, useEffect } from 'react'
import { siembrasApi, cultivosApi, estadosCultivoApi } from '@/lib/api/siembras'
import { fincasApi } from '@/lib/api/fincas'
import type { SiembraResponse, SiembraRequest, SiembraUpdateRequest, CultivoResponse, EstadoCultivo } from '@/lib/api/siembras'
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

// Valores por defecto en caso de que el API falle
const ESTADOS_DEFAULT: EstadoCultivo[] = [
  { idEstadoCultivo: 1, nombre: 'Siembra' },
  { idEstadoCultivo: 2, nombre: 'Crecimiento' },
  { idEstadoCultivo: 3, nombre: 'Floración' },
  { idEstadoCultivo: 4, nombre: 'Cosecha' },
  { idEstadoCultivo: 5, nombre: 'Cosecha Activa' },
  { idEstadoCultivo: 6, nombre: 'Pendiente' },
]

type ModalMode = 'crear' | 'editar' | null

const FORM_CREAR_INICIAL: SiembraRequest = {
  idFinca: 0, idCultivo: 0, idEstadoCultivo: 1,
  fechaEstado: new Date().toISOString().slice(0, 16), numLote: 1,
}

const FORM_EDITAR_INICIAL: SiembraUpdateRequest = {
  idFinca: 0, idCultivo: 0, numLote: 1,
}

function parseFecha(fecha: unknown): string {
  if (!fecha) return ''
  if (Array.isArray(fecha)) {
    const [y, m, d, h = 0, min = 0, s = 0] = fecha as number[]
    // Construye string ISO — mes en JS es 0-indexed así que restamos 1
    const date = new Date(y, m - 1, d, h, min, s)
    return date.toISOString()
  }
  return String(fecha)
}

export default function CultivosPage() {
  const [siembras, setSiembras]           = useState<SiembraResponse[]>([])
  const [cultivos, setCultivos]           = useState<CultivoResponse[]>([])
  const [estados, setEstados]             = useState<EstadoCultivo[]>(ESTADOS_DEFAULT)
  const [fincas, setFincas]               = useState<Finca[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [modalMode, setModalMode]         = useState<ModalMode>(null)
  const [siembraActiva, setSiembraActiva] = useState<SiembraResponse | null>(null)
  const [saving, setSaving]               = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<SiembraResponse | null>(null)
  const [filtroFinca, setFiltroFinca]     = useState<number>(0)
  const [busqueda, setBusqueda]         = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('')
  const [fechaDesde, setFechaDesde]     = useState('')
  const [fechaHasta, setFechaHasta]     = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [cambiarEstadoModal, setCambiarEstadoModal] = useState<SiembraResponse | null>(null)
  const [nuevoEstadoId, setNuevoEstadoId]           = useState<number>(1)
  const [cambiandoEstado, setCambiandoEstado]       = useState(false)
  const [formCrear, setFormCrear] = useState<SiembraRequest>(FORM_CREAR_INICIAL)
  const [formEditar, setFormEditar] = useState<SiembraUpdateRequest>(FORM_EDITAR_INICIAL)

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setLoading(true)

      // Siembras — esencial
      try {
        const s = await siembrasApi.listar()
        if (!cancelado) setSiembras(Array.isArray(s) ? s : [])
      } catch {
        if (!cancelado) setError('No se pudieron cargar los cultivos.')
        if (!cancelado) setLoading(false)
        return
      }

      // Catálogo de cultivos — opcional
      try {
        const c = await cultivosApi.listar()
        if (!cancelado) setCultivos(Array.isArray(c) ? c : [])
      } catch { /* sin catálogo */ }

      // Fincas — solo PRODUCTOR tiene acceso, para OPERARIO/AUXILIAR simplemente no filtra
      try {
        const f = await fincasApi.listar()
        if (!cancelado) setFincas(Array.isArray(f) ? f : [])
      } catch { /* operario no tiene acceso a /api/fincas */ }

      // Estados de cultivo — usa default si falla
      try {
        const e = await estadosCultivoApi.listar()
        if (!cancelado && Array.isArray(e) && e.length > 0) setEstados(e)
      } catch { /* usa ESTADOS_DEFAULT */ }

      if (!cancelado) setLoading(false)
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const recargar = async () => {
    try { const data = await siembrasApi.listar(); setSiembras(Array.isArray(data) ? data : []) }
    catch { setError('Error al recargar.') }
  }

  const siembrasFiltradas = siembras.filter(s => {
    const matchFinca   = !filtroFinca || s.nombreFinca === fincas.find(f => f.idFinca === filtroFinca)?.nombreFinca
    const matchBusqueda = !busqueda ||
      s.nombreCultivo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.nombreFinca?.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado  = !filtroEstado || s.nombreEstado?.toUpperCase() === filtroEstado.toUpperCase()
    const matchTipo    = !filtroTipo   || cultivos.find(c => c.nombre === s.nombreCultivo)?.nombreTipoCultivo === filtroTipo
    const matchDesde   = !fechaDesde   || new Date(parseFecha(s.fechaSiembra)) >= new Date(fechaDesde)
    const matchHasta   = !fechaHasta   || new Date(parseFecha(s.fechaSiembra)) <= new Date(fechaHasta)
    return matchFinca && matchBusqueda && matchEstado && matchTipo && matchDesde && matchHasta
  })

  const abrirCrear = () => {
    setFormCrear({
      ...FORM_CREAR_INICIAL,
      idFinca:         fincas[0]?.idFinca          ?? 0,
      idCultivo:       cultivos[0]?.idCultivo       ?? 0,
      idEstadoCultivo: estados[0]?.idEstadoCultivo  ?? 1,
    })
    setSiembraActiva(null)
    setModalMode('crear')
  }

  const abrirEditar = (s: SiembraResponse) => {
    setFormEditar({
      idFinca:   fincas.find(f => f.nombreFinca === s.nombreFinca)?.idFinca    ?? 0,
      idCultivo: cultivos.find(c => c.nombre === s.nombreCultivo)?.idCultivo   ?? 0,
      numLote:   s.numLote,
    })
    setSiembraActiva(s)
    setModalMode('editar')
  }

  const abrirCambiarEstado = (s: SiembraResponse) => {
    const estadoActual = estados.find(e =>
      e.nombre.toUpperCase() === s.nombreEstado?.toUpperCase()
    )
    setNuevoEstadoId(estadoActual?.idEstadoCultivo ?? 1)
    setCambiarEstadoModal(s)
  }

  const cerrarModal = () => { setModalMode(null); setSiembraActiva(null) }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (modalMode === 'crear') {
        await siembrasApi.crear(formCrear)
      } else if (modalMode === 'editar' && siembraActiva) {
        await siembrasApi.actualizar(siembraActiva.idSiembra, formEditar)
      }
      cerrarModal()
      await recargar()
    } catch {
      setError('Error al guardar el cultivo.')
    } finally {
      setSaving(false)
    }
  }

  const handleCambiarEstado = async () => {
    if (!cambiarEstadoModal) return
    setCambiandoEstado(true)
    try {
      await siembrasApi.cambiarEstado({
        idSiembra:       cambiarEstadoModal.idSiembra,
        idEstadoCultivo: nuevoEstadoId,
      })
      setCambiarEstadoModal(null)
      await recargar()
    } catch {
      setError('Error al cambiar el estado.')
    } finally {
      setCambiandoEstado(false)
    }
  }

  const handleEliminar = async (s: SiembraResponse) => {
    try { await siembrasApi.eliminar(s.idSiembra); setConfirmDelete(null); await recargar() }
    catch { setError('Error al eliminar.') }
  }

  const getEstadoColor = (e: string) => ESTADO_COLORES[e?.toUpperCase()] ?? 'var(--color-surface-container)'
  const getEstadoText  = (e: string) => ESTADO_TEXT[e?.toUpperCase()]    ?? 'var(--color-on-surface-variant)'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Mis Cultivos</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            {siembrasFiltradas.length} de {siembras.length} siembra{siembras.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <button onClick={() => setMostrarFiltros(v => !v)} className="btn-secondary" style={{ minHeight:'40px' }}>
            <span className="material-symbols-outlined" style={{fontSize:'20px'}}>tune</span>
            Filtros {(filtroEstado || filtroTipo || filtroFinca || fechaDesde || fechaHasta) ? '●' : ''}
          </button>
          <button onClick={abrirCrear} className="btn-primary" style={{ whiteSpace:'nowrap' }}>
            <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span>
            Nuevo Cultivo
          </button>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {/* Barra de búsqueda */}
        <div style={{ position:'relative' }}>
          <span className="material-symbols-outlined" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)' }}>search</span>
          <input
            type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre de cultivo o finca..."
            className="input-field" style={{ paddingLeft:'40px' }}
          />
        </div>

        {/* Panel de filtros expandible */}
        {mostrarFiltros && (
          <div className="card animate-fade-in" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'12px', padding:'16px' }}>
            {/* Filtro por finca */}
            <div>
              <label className="input-label">Finca</label>
              <select value={filtroFinca} onChange={e => setFiltroFinca(Number(e.target.value))}
                className="input-field" style={{ minHeight:'40px' }}>
                <option value={0}>Todas las fincas</option>
                {fincas.map(f => <option key={f.idFinca} value={f.idFinca}>{f.nombreFinca}</option>)}
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="input-label">Estado</label>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className="input-field" style={{ minHeight:'40px' }}>
                <option value="">Todos los estados</option>
                {estados.map(e => <option key={e.idEstadoCultivo} value={e.nombre}>{e.nombre}</option>)}
              </select>
            </div>

            {/* Filtro por tipo de cultivo */}
            <div>
              <label className="input-label">Tipo de cultivo</label>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                className="input-field" style={{ minHeight:'40px' }}>
                <option value="">Todos los tipos</option>
                {[...new Set(cultivos.map(c => c.nombreTipoCultivo))].map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* Rango de fechas */}
            <div>
              <label className="input-label">Fecha siembra desde</label>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                className="input-field" style={{ minHeight:'40px' }} />
            </div>
            <div>
              <label className="input-label">Fecha siembra hasta</label>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                className="input-field" style={{ minHeight:'40px' }} />
            </div>

            {/* Limpiar filtros */}
            <div style={{ display:'flex', alignItems:'flex-end' }}>
              <button
                onClick={() => { setFiltroFinca(0); setFiltroEstado(''); setFiltroTipo(''); setFechaDesde(''); setFechaHasta(''); setBusqueda('') }}
                className="btn-secondary" style={{ width:'100%', minHeight:'40px' }}>
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>filter_alt_off</span>
                Limpiar
              </button>
            </div>
          </div>
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
            Registra tu primer cultivo para hacer seguimiento a tus siembras.
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
                <span style={{ padding:'3px 10px', borderRadius:'9999px', fontSize:'11px', fontWeight:700,
                  backgroundColor: getEstadoColor(s.nombreEstado),
                  color: getEstadoText(s.nombreEstado),
                  textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {s.nombreEstado}
                </span>
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
                {[
                  { label:'Siembra',       fecha: parseFecha(s.fechaSiembra) },
                  { label:'Último estado', fecha: parseFecha(s.fechaEstado)  },
                ].map(item => (
                  <div key={item.label} style={{ backgroundColor:'var(--color-surface-container-low)', borderRadius:'8px', padding:'10px' }}>
                    <p style={{ fontSize:'0.7rem', color:'var(--color-on-surface-variant)', margin:'0 0 2px' }}>{item.label}</p>
                    <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--color-on-surface)', margin:0 }}>
                      {item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : '--'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Acciones */}
              <div style={{ display:'flex', gap:'6px', paddingTop:'8px', borderTop:'1px solid var(--color-outline-variant)' }}>
                <button onClick={() => abrirEditar(s)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'7px 4px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:500, border:'none', cursor:'pointer', color:'var(--color-secondary)', backgroundColor:'transparent' }}
                  onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-secondary-fixed)')}
                  onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                  <span className="material-symbols-outlined" style={{fontSize:'17px'}}>edit</span> Editar
                </button>
                <button onClick={() => abrirCambiarEstado(s)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'7px 4px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:500, border:'none', cursor:'pointer', color:'var(--color-primary)', backgroundColor:'transparent' }}
                  onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-primary-fixed)')}
                  onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                  <span className="material-symbols-outlined" style={{fontSize:'17px'}}>sync</span> Estado
                </button>
                <button onClick={() => setConfirmDelete(s)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'7px 4px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:500, border:'none', cursor:'pointer', color:'var(--color-error)', backgroundColor:'transparent' }}
                  onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-error-container)')}
                  onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                  <span className="material-symbols-outlined" style={{fontSize:'17px'}}>delete</span> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal CREAR */}
      {modalMode === 'crear' && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'480px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Nuevo Cultivo</h2>
              <button onClick={cerrarModal} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label className="input-label">Finca *</label>
                <select value={formCrear.idFinca} onChange={e=>setFormCrear(p=>({...p,idFinca:Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona una finca...</option>
                  {fincas.map(f=><option key={f.idFinca} value={f.idFinca}>{f.nombreFinca}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Tipo de cultivo *</label>
                <select value={formCrear.idCultivo} onChange={e=>setFormCrear(p=>({...p,idCultivo:Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona un cultivo...</option>
                  {cultivos.map(c=><option key={c.idCultivo} value={c.idCultivo}>{c.nombre} — {c.nombreTipoCultivo}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Estado inicial</label>
                  <select value={formCrear.idEstadoCultivo} onChange={e=>setFormCrear(p=>({...p,idEstadoCultivo:Number(e.target.value)}))} className="input-field">
                    {estados.map(e=><option key={e.idEstadoCultivo} value={e.idEstadoCultivo}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">N° Lote *</label>
                  <input type="number" min="1" value={formCrear.numLote} onChange={e=>setFormCrear(p=>({...p,numLote:Number(e.target.value)}))} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="input-label">Fecha del estado</label>
                <input type="datetime-local" value={formCrear.fechaEstado} onChange={e=>setFormCrear(p=>({...p,fechaEstado:e.target.value}))} className="input-field" required />
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

      {/* Modal EDITAR */}
      {modalMode === 'editar' && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'480px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Editar Cultivo</h2>
              <button onClick={cerrarModal} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label className="input-label">Finca *</label>
                <select value={formEditar.idFinca} onChange={e=>setFormEditar(p=>({...p,idFinca:Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona una finca...</option>
                  {fincas.map(f=><option key={f.idFinca} value={f.idFinca}>{f.nombreFinca}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Tipo de cultivo *</label>
                <select value={formEditar.idCultivo} onChange={e=>setFormEditar(p=>({...p,idCultivo:Number(e.target.value)}))} className="input-field" required>
                  <option value={0}>Selecciona un cultivo...</option>
                  {cultivos.map(c=><option key={c.idCultivo} value={c.idCultivo}>{c.nombre} — {c.nombreTipoCultivo}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">N° Lote *</label>
                <input type="number" min="1" value={formEditar.numLote} onChange={e=>setFormEditar(p=>({...p,numLote:Number(e.target.value)}))} className="input-field" required />
              </div>
              <div style={{ padding:'12px', borderRadius:'8px', backgroundColor:'var(--color-secondary-fixed)', fontSize:'0.8rem', color:'var(--color-on-secondary-fixed)' }}>
                <span className="material-symbols-outlined" style={{fontSize:'16px', verticalAlign:'middle', marginRight:'4px'}}>info</span>
                Para cambiar el estado usa el botón Estado desde la card.
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

      {/* Modal cambiar estado */}
      {cambiarEstadoModal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'400px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Cambiar estado</h2>
              <button onClick={() => setCambiarEstadoModal(null)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'16px' }}>
              Cultivo: <strong>{cambiarEstadoModal.nombreCultivo}</strong> — Lote {cambiarEstadoModal.numLote}
            </p>
            <p style={{ fontSize:'0.8rem', color:'var(--color-on-surface-variant)', marginBottom:'16px' }}>
              Estado actual: <strong>{cambiarEstadoModal.nombreEstado}</strong>
            </p>
            <div style={{ marginBottom:'16px' }}>
              <label className="input-label">Nuevo estado</label>
              <select value={nuevoEstadoId} onChange={e => setNuevoEstadoId(Number(e.target.value))} className="input-field">
                {estados.map(e => (
                  <option key={e.idEstadoCultivo} value={e.idEstadoCultivo}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setCambiarEstadoModal(null)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
              <button disabled={cambiandoEstado} onClick={handleCambiarEstado} className="btn-primary" style={{flex:1}}>
                {cambiandoEstado
                  ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Cambiando...</>
                  : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>sync</span> Confirmar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}