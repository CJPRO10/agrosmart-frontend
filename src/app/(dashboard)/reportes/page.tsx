'use client'

import { useState } from 'react'

type Periodicidad = 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'
type Formato      = 'PDF' | 'XLS' | 'CSV'
type TipoReporte  = 'PRODUCCION' | 'ANOMALIAS' | 'FINANZAS' | 'CLIMA' | 'TAREAS'

interface Reporte {
  id: number
  nombre: string
  tipo: TipoReporte
  periodicidad: Periodicidad
  formato: Formato
  fechaCreacion: string
}

const DEMO_REPORTES: Reporte[] = [
  { id:1, nombre:'Producción Mensual — Mayo', tipo:'PRODUCCION', periodicidad:'MENSUAL', formato:'PDF', fechaCreacion:'2025-06-01' },
  { id:2, nombre:'Inventario de Insumos Q1',   tipo:'FINANZAS',   periodicidad:'SEMANAL', formato:'XLS', fechaCreacion:'2025-05-28' },
  { id:3, nombre:'Análisis de Suelos — Lote A',tipo:'ANOMALIAS',  periodicidad:'MENSUAL', formato:'CSV', fechaCreacion:'2025-05-15' },
]

const FORMATO_ICON: Record<Formato, string>    = { PDF:'picture_as_pdf', XLS:'table_chart', CSV:'description' }
const FORMATO_COLOR: Record<Formato, string>   = { PDF:'var(--color-error)', XLS:'var(--color-primary)', CSV:'var(--color-secondary)' }
const TIPO_LABELS: Record<TipoReporte, string> = { PRODUCCION:'Producción', ANOMALIAS:'Anomalías', FINANZAS:'Finanzas', CLIMA:'Clima', TAREAS:'Tareas' }

const FORM_INICIAL = { nombre:'', tipo:'PRODUCCION' as TipoReporte, periodicidad:'MENSUAL' as Periodicidad, formato:'PDF' as Formato }

export default function ReportesPage() {
  const [reportes, setReportes]   = useState<Reporte[]>(DEMO_REPORTES)
  const [form, setForm]           = useState(FORM_INICIAL)
  const [generando, setGenerando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [filtro, setFiltro]       = useState<TipoReporte | 'TODOS'>('TODOS')
  const [busqueda, setBusqueda]   = useState('')

  const filtrados = reportes.filter(r => {
    const matchTipo     = filtro === 'TODOS' || r.tipo === filtro
    const matchBusqueda = !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchBusqueda
  })

  const handleGenerar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre) return
    setGenerando(true)
    await new Promise(r => setTimeout(r, 1500)) // Simular generación
    const nuevo: Reporte = {
      id: Date.now(), nombre: form.nombre, tipo: form.tipo,
      periodicidad: form.periodicidad, formato: form.formato,
      fechaCreacion: new Date().toISOString().slice(0,10),
    }
    setReportes(prev => [nuevo, ...prev])
    setForm(FORM_INICIAL)
    setGenerando(false)
  }

  const handleEliminar = (id: number) => {
    setReportes(prev => prev.filter(r => r.id !== id))
    setConfirmDelete(null)
  }

  const stats = [
    { label:'Total reportes',  value: reportes.length,                               icon:'bar_chart',     color:'var(--color-primary)'   },
    { label:'Reportes PDF',    value: reportes.filter(r=>r.formato==='PDF').length,   icon:'picture_as_pdf',color:'var(--color-error)'     },
    { label:'Este mes',        value: reportes.filter(r=>r.fechaCreacion?.startsWith(new Date().toISOString().slice(0,7))).length, icon:'calendar_today', color:'var(--color-secondary)' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Centro de Reportes</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            Gestiona y descarga los informes de rendimiento de tu finca
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:'12px' }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ display:'flex', alignItems:'center', gap:'12px', padding:'16px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'10px', flexShrink:0, backgroundColor:'var(--color-surface-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'20px', color:s.color }}>{s.icon}</span>
            </div>
            <div>
              <p style={{ fontSize:'1.5rem', fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido: tabla + formulario */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1rem', alignItems:'start' }}>

        {/* Historial de reportes */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-outline-variant)', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
            <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)', flex:1 }}>Historial de reportes</h3>
            <div style={{ position:'relative' }}>
              <span className="material-symbols-outlined" style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'18px', color:'var(--color-outline)' }}>search</span>
              <input type="text" value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar..." style={{ paddingLeft:'34px', padding:'6px 12px 6px 34px', borderRadius:'8px', border:'1px solid var(--color-outline-variant)', fontSize:'0.875rem', outline:'none' }} />
            </div>
            <select value={filtro} onChange={e=>setFiltro(e.target.value as TipoReporte|'TODOS')} style={{ padding:'6px 10px', borderRadius:'8px', border:'1px solid var(--color-outline-variant)', fontSize:'0.875rem', outline:'none' }}>
              <option value="TODOS">Todos</option>
              {(Object.keys(TIPO_LABELS) as TipoReporte[]).map(t=><option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
            </select>
          </div>

          {filtrados.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 24px', textAlign:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'48px', color:'var(--color-primary-fixed)', marginBottom:'12px' }}>bar_chart</span>
              <p style={{ color:'var(--color-on-surface-variant)', margin:0 }}>Sin reportes. Genera uno nuevo.</p>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor:'var(--color-surface-container-low)' }}>
                  {['Nombre del Reporte','Fecha','Formato','Periodicidad','Acciones'].map(col=>(
                    <th key={col} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.75rem', fontWeight:700, color:'var(--color-on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(r => (
                  <tr key={r.id} style={{ borderBottom:'1px solid var(--color-outline-variant)' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize:'18px', color:FORMATO_COLOR[r.formato] }}>{FORMATO_ICON[r.formato]}</span>
                        <div>
                          <p style={{ margin:0, fontWeight:600, color:'var(--color-on-surface)' }}>{r.nombre}</p>
                          <p style={{ margin:0, fontSize:'0.75rem', color:'var(--color-on-surface-variant)' }}>{TIPO_LABELS[r.tipo]}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', color:'var(--color-on-surface-variant)', whiteSpace:'nowrap' }}>
                      {new Date(r.fechaCreacion).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:700, backgroundColor:FORMATO_COLOR[r.formato]+'22', color:FORMATO_COLOR[r.formato] }}>
                        {r.formato}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px', color:'var(--color-on-surface-variant)' }}>{r.periodicidad}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:'4px' }}>
                        <button style={{ padding:'6px 12px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, backgroundColor:'var(--color-primary-fixed)', color:'var(--color-primary)', display:'flex', alignItems:'center', gap:'4px' }}>
                          <span className="material-symbols-outlined" style={{fontSize:'16px'}}>download</span> Descargar
                        </button>
                        <button onClick={()=>setConfirmDelete(r.id)} style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{fontSize:'18px'}}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulario generar */}
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)' }}>Generar Nuevo Reporte</h3>
          <form onSubmit={handleGenerar} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div>
              <label className="input-label">Nombre del reporte *</label>
              <input type="text" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Producción Junio 2025" className="input-field" required />
            </div>
            <div>
              <label className="input-label">Tipo de reporte</label>
              <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value as TipoReporte}))} className="input-field">
                {(Object.keys(TIPO_LABELS) as TipoReporte[]).map(t=><option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Periodicidad</label>
              <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                {(['DIARIO','SEMANAL','MENSUAL','ANUAL'] as Periodicidad[]).map(p=>(
                  <button key={p} type="button" onClick={()=>setForm(prev=>({...prev,periodicidad:p}))}
                    style={{ flex:1, padding:'8px 4px', borderRadius:'8px', border:`1.5px solid ${form.periodicidad===p?'var(--color-primary)':'var(--color-outline-variant)'}`,
                      cursor:'pointer', fontSize:'0.75rem', fontWeight:600,
                      backgroundColor: form.periodicidad===p ? 'var(--color-primary-fixed)' : 'transparent',
                      color: form.periodicidad===p ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                    {p === 'DIARIO' ? 'Diario' : p === 'SEMANAL' ? 'Semanal' : p === 'MENSUAL' ? 'Mensual' : 'Anual'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Formato de salida</label>
              <div style={{ display:'flex', gap:'8px' }}>
                {(['PDF','XLS','CSV'] as Formato[]).map(f=>(
                  <button key={f} type="button" onClick={()=>setForm(p=>({...p,formato:f}))}
                    style={{ flex:1, padding:'10px', borderRadius:'8px', border:`1.5px solid ${form.formato===f?FORMATO_COLOR[f]:'var(--color-outline-variant)'}`,
                      cursor:'pointer', fontSize:'0.8rem', fontWeight:700,
                      backgroundColor: form.formato===f ? FORMATO_COLOR[f]+'22' : 'transparent',
                      color: form.formato===f ? FORMATO_COLOR[f] : 'var(--color-on-surface-variant)' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={generando} className="btn-primary" style={{ marginTop:'4px' }}>
              {generando
                ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Generando...</>
                : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>auto_awesome</span> Generar Informe</>
              }
            </button>
          </form>
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete !== null && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'360px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'9999px', margin:'0 auto 16px', backgroundColor:'var(--color-error-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-error)' }}>delete</span>
            </div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'8px' }}>¿Eliminar reporte?</h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=>setConfirmDelete(null)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
              <button onClick={()=>handleEliminar(confirmDelete)} className="btn-danger" style={{flex:1}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
