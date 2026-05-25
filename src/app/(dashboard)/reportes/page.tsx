'use client'

import { useState, useEffect, useCallback } from 'react'
import { reportesApi } from '@/lib/api/reportes'
import type { ReporteResponse, ReporteRequest } from '@/lib/api/reportes'
import { generarReporte } from '@/lib/utils/reportGenerator'
import { siembrasApi } from '@/lib/api/siembras'
import { finanzasApi } from '@/lib/api/finanzas'
import { parseFecha } from '@/lib/utils/fecha'

type Formato      = 'PDF' | 'XLS' | 'CSV'
type Periodicidad = 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'

const FORMATO_CONFIG: Record<Formato, { icon: string; color: string; bg: string }> = {
  PDF: { icon:'picture_as_pdf', color:'var(--color-error)',     bg:'var(--color-error-container)'  },
  XLS: { icon:'table_chart',    color:'var(--color-primary)',   bg:'var(--color-primary-fixed)'    },
  CSV: { icon:'description',    color:'var(--color-secondary)', bg:'var(--color-secondary-fixed)'  },
}

const FORM_INICIAL: ReporteRequest = {
  nombreReporte: '', formato: 'PDF', tipoPeriodicidad: 'MENSUAL',
}

export default function ReportesPage() {
  const [reportes, setReportes]         = useState<ReporteResponse[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [generando, setGenerando]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ReporteResponse | null>(null)
  const [form, setForm]                 = useState<ReporteRequest>(FORM_INICIAL)

  // Filtros
  const [busqueda, setBusqueda]         = useState('')
  const [filtroFormato, setFiltroFormato]       = useState('')
  const [filtroPeriodicidad, setFiltroPeriodicidad] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportesApi.listar()
      setReportes(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar los reportes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Filtrado local
  const filtrados = reportes.filter(r => {
    const matchBusqueda     = !busqueda          || r.nombreReporte?.toLowerCase().includes(busqueda.toLowerCase())
    const matchFormato      = !filtroFormato      || r.formato === filtroFormato
    const matchPeriodicidad = !filtroPeriodicidad || r.tipoPeriodicidad === filtroPeriodicidad
    return matchBusqueda && matchFormato && matchPeriodicidad
  })

  const handleGenerar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombreReporte) return
    setGenerando(true)
    try {
      await reportesApi.crear(form)
      setForm(FORM_INICIAL)
      await cargar()
    } catch {
      setError('Error al generar el reporte.')
    } finally {
      setGenerando(false)
    }
  }

  const handleEliminar = async (r: ReporteResponse) => {
    try {
      await reportesApi.eliminar(r.idReporte)
      setConfirmDelete(null)
      await cargar()
    } catch {
      setError('Error al eliminar el reporte.')
    }
  }

  const stats = [
    { label:'Total',    value: reportes.length,                              color:'var(--color-primary)'   },
    { label:'PDF',      value: reportes.filter(r=>r.formato==='PDF').length, color:'var(--color-error)'     },
    { label:'Excel',    value: reportes.filter(r=>r.formato==='XLS').length, color:'var(--color-primary)'   },
    { label:'Mensuales',value: reportes.filter(r=>r.tipoPeriodicidad==='MENSUAL').length, color:'var(--color-secondary)' },
  ]

  const handleDescargar = async (r: ReporteResponse) => {
    try {
      // Cargar datos según el tipo de reporte
      let filas: Record<string, unknown>[] = []
      let columnas: string[] = []

      if (r.nombreReporte.toLowerCase().includes('finanz') || r.nombreReporte.toLowerCase().includes('ingreso') || r.nombreReporte.toLowerCase().includes('egreso')) {
        const data = await finanzasApi.listar()
        columnas = ['Fecha','Tipo','Categoría','Monto','Descripción']
        filas = data.map(f => ({
          'Fecha':       f.fechaRegistro ? new Date(f.fechaRegistro).toLocaleDateString('es-CO') : '--',
          'Tipo':        f.tipoTransaccion,
          'Categoría':   f.categoria,
          'Monto':       new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(f.monto),
          'Descripción': f.descripcion,
        }))
      } else {
        // Por defecto: reporte de cultivos/siembras
        const data = await siembrasApi.listar()
        columnas = ['Cultivo','Finca','Lote','Estado','Fecha Siembra','Último Estado']
        filas = data.map(s => ({
          'Cultivo':       s.nombreCultivo,
          'Finca':         s.nombreFinca,
          'Lote':          s.numLote,
          'Estado':        s.nombreEstado,
          'Fecha Siembra': (() => { const f = parseFecha(s.fechaSiembra); return f ? new Date(f).toLocaleDateString('es-CO') : '--' })(),
          'Último Estado': (() => { const f = parseFecha(s.fechaEstado);  return f ? new Date(f).toLocaleDateString('es-CO') : '--' })(),
        }))
      }

      generarReporte({
        nombre:          r.nombreReporte,
        tipo:            r.nombreReporte,
        periodicidad:    r.tipoPeriodicidad,
        fechaGeneracion: new Date().toLocaleDateString('es-CO'),
        filas,
        columnas,
      }, r.formato)
    } catch {
      setError('Error al generar el archivo de descarga.')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div>
        <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Centro de Reportes</h1>
        <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
          Gestiona y descarga los informes de rendimiento de tu finca
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px,1fr))', gap:'12px' }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding:'12px', textAlign:'center' }}>
            <p style={{ fontSize:'1.5rem', fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
            <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Layout dos columnas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px,1fr))', gap:'1rem', alignItems:'start' }}>

        {/* ── Historial ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Búsqueda y filtros */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
              <span className="material-symbols-outlined" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)' }}>search</span>
              <input type="text" value={busqueda} onChange={e=>setBusqueda(e.target.value)}
                placeholder="Buscar reporte..." className="input-field" style={{ paddingLeft:'40px', minHeight:'40px' }} />
            </div>
            <select value={filtroFormato} onChange={e=>setFiltroFormato(e.target.value)}
              className="input-field" style={{ minHeight:'40px', width:'auto' }}>
              <option value="">Formato</option>
              {(['PDF','XLS','CSV'] as Formato[]).map(f=><option key={f} value={f}>{f}</option>)}
            </select>
            <select value={filtroPeriodicidad} onChange={e=>setFiltroPeriodicidad(e.target.value)}
              className="input-field" style={{ minHeight:'40px', width:'auto' }}>
              <option value="">Periodicidad</option>
              {(['DIARIO','SEMANAL','MENSUAL','ANUAL'] as Periodicidad[]).map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            {(busqueda || filtroFormato || filtroPeriodicidad) && (
              <button onClick={()=>{setBusqueda('');setFiltroFormato('');setFiltroPeriodicidad('')}}
                style={{ padding:'8px 12px', borderRadius:'9999px', border:'1px solid var(--color-outline-variant)', cursor:'pointer', fontSize:'0.8rem', backgroundColor:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{fontSize:'14px',verticalAlign:'middle'}}>filter_alt_off</span> Limpiar
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem' }}>
              <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
              <span style={{flex:1}}>{error}</span>
              <button onClick={()=>setError(null)}><span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span></button>
            </div>
          )}

          {loading && <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}><span className="material-symbols-outlined animate-spin" style={{ fontSize:'40px', color:'var(--color-primary)' }}>progress_activity</span></div>}

          {/* Tabla */}
          {!loading && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-outline-variant)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)' }}>
                  Historial — {filtrados.length} reporte{filtrados.length !== 1 ? 's' : ''}
                </h3>
                <button onClick={cargar} style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{fontSize:'20px'}}>refresh</span>
                </button>
              </div>

              {filtrados.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 24px', textAlign:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'48px', color:'var(--color-primary-fixed)', marginBottom:'12px' }}>bar_chart</span>
                  <p style={{ color:'var(--color-on-surface-variant)', margin:0 }}>
                    {busqueda || filtroFormato || filtroPeriodicidad ? 'Sin resultados con ese filtro.' : 'Genera tu primer reporte.'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor:'var(--color-surface-container-low)' }}>
                        {['Nombre','Fecha','Formato','Periodicidad','Acciones'].map(col => (
                          <th key={col} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.75rem', fontWeight:700, color:'var(--color-on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map(r => {
                        const fmt = FORMATO_CONFIG[r.formato as Formato] ?? FORMATO_CONFIG['PDF']
                        return (
                          <tr key={r.idReporte} style={{ borderBottom:'1px solid var(--color-outline-variant)' }}>
                            <td style={{ padding:'12px 16px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize:'18px', color:fmt.color }}>{fmt.icon}</span>
                                <span style={{ fontWeight:600, color:'var(--color-on-surface)' }}>{r.nombreReporte}</span>
                              </div>
                            </td>
                            <td style={{ padding:'12px 16px', color:'var(--color-on-surface-variant)', whiteSpace:'nowrap' }}>
                              {r.fechaCreacion ? new Date(r.fechaCreacion).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' }) : '--'}
                            </td>
                            <td style={{ padding:'12px 16px' }}>
                              <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:700, backgroundColor:fmt.bg, color:fmt.color }}>
                                {r.formato}
                              </span>
                            </td>
                            <td style={{ padding:'12px 16px', color:'var(--color-on-surface-variant)', fontSize:'0.8rem' }}>
                              {r.tipoPeriodicidad}
                            </td>
                            <td style={{ padding:'12px 16px' }}>
                              <div style={{ display:'flex', gap:'4px' }}>
                                <button
                                  onClick={() => handleDescargar(r)}
                                  title="Descargar"
                                  style={{ padding:'6px 10px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, backgroundColor:'var(--color-primary-fixed)', color:'var(--color-primary)', display:'flex', alignItems:'center', gap:'4px' }}>
                                  <span className="material-symbols-outlined" style={{fontSize:'16px'}}>download</span> Descargar
                                </button>
                                <button onClick={()=>setConfirmDelete(r)}
                                  style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-error)' }}
                                  onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-error-container)')}
                                  onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Formulario generar ── */}
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)' }}>
            Generar Nuevo Reporte
          </h3>
          <form onSubmit={handleGenerar} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label className="input-label">Nombre del reporte *</label>
              <input type="text" value={form.nombreReporte} onChange={e=>setForm(p=>({...p,nombreReporte:e.target.value}))}
                placeholder="Ej: Producción Junio 2026" className="input-field" required />
            </div>

            <div>
              <label className="input-label">Periodicidad</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {(['DIARIO','SEMANAL','MENSUAL','ANUAL'] as Periodicidad[]).map(p => (
                  <button key={p} type="button" onClick={()=>setForm(prev=>({...prev,tipoPeriodicidad:p}))}
                    style={{ flex:1, minWidth:'70px', padding:'8px 4px', borderRadius:'8px', border:`1.5px solid ${form.tipoPeriodicidad===p?'var(--color-primary)':'var(--color-outline-variant)'}`,
                      cursor:'pointer', fontSize:'0.7rem', fontWeight:600,
                      backgroundColor: form.tipoPeriodicidad===p ? 'var(--color-primary-fixed)' : 'transparent',
                      color: form.tipoPeriodicidad===p ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                    {p === 'DIARIO' ? 'Diario' : p === 'SEMANAL' ? 'Semanal' : p === 'MENSUAL' ? 'Mensual' : 'Anual'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">Formato de salida</label>
              <div style={{ display:'flex', gap:'8px' }}>
                {(['PDF','XLS','CSV'] as Formato[]).map(f => {
                  const cfg = FORMATO_CONFIG[f]
                  return (
                    <button key={f} type="button" onClick={()=>setForm(p=>({...p,formato:f}))}
                      style={{ flex:1, padding:'10px', borderRadius:'8px',
                        border:`1.5px solid ${form.formato===f ? cfg.color : 'var(--color-outline-variant)'}`,
                        cursor:'pointer', fontSize:'0.8rem', fontWeight:700,
                        backgroundColor: form.formato===f ? cfg.bg : 'transparent',
                        color: form.formato===f ? cfg.color : 'var(--color-on-surface-variant)' }}>
                      {f}
                    </button>
                  )
                })}
              </div>
            </div>

            <button type="submit" disabled={generando} className="btn-primary" style={{ marginTop:'4px' }}>
              {generando
                ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Generando...</>
                : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>auto_awesome</span> Generar Reporte</>
              }
            </button>
          </form>
        </div>
      </div>

      {/* Modal confirmar eliminar */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'360px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'9999px', margin:'0 auto 16px', backgroundColor:'var(--color-error-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-error)' }}>delete</span>
            </div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'8px' }}>¿Eliminar reporte?</h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>
              Se eliminará <strong>{confirmDelete.nombreReporte}</strong>. Esta acción no se puede deshacer.
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
