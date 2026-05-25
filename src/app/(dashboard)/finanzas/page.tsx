'use client'

import { useState, useEffect, useCallback } from 'react'
import { finanzasApi } from '@/lib/api/finanzas'
import { useAuthStore } from '@/store/authStore'
import type { FinanzaResponse, FinanzaRequest } from '@/lib/api/finanzas'

type TipoTransaccion = 'INGRESO' | 'EGRESO'

const CATEGORIAS_INGRESO = ['COSECHA','VENTA','SUBSIDIO','OTRO']
const CATEGORIAS_EGRESO  = ['INSUMOS','NOMINA','LOGISTICA','MAQUINARIA','SERVICIOS','OTRO']

const FORM_INICIAL: FinanzaRequest = {
  descripcion: '', monto: 0, tipoTransaccion: 'INGRESO', categoria: 'COSECHA',
}

function parseFecha(fecha: unknown): string {
  if (!fecha) return ''
  if (Array.isArray(fecha)) {
    const [y, m, d] = fecha as number[]
    return new Date(y, m - 1, d).toISOString()
  }
  return String(fecha)
}

export default function FinanzasPage() {
  const { user } = useAuthStore()
  const [finanzas, setFinanzas]         = useState<FinanzaResponse[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editando, setEditando]         = useState<FinanzaResponse | null>(null)
  const [saving, setSaving]             = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<FinanzaResponse | null>(null)
  const [form, setForm]                 = useState<FinanzaRequest>(FORM_INICIAL)

  // Filtros
  const [filtroTipo, setFiltroTipo]     = useState<TipoTransaccion | 'TODAS'>('TODAS')
  const [filtroCat, setFiltroCat]       = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await finanzasApi.listar()
      setFinanzas(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar las finanzas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtradas = finanzas.filter(f => {
    const matchTipo = filtroTipo === 'TODAS' || f.tipoTransaccion === filtroTipo
    const matchCat  = !filtroCat || f.categoria === filtroCat
    return matchTipo && matchCat
  })

  const ingresos   = finanzas.filter(f=>f.tipoTransaccion==='INGRESO').reduce((a,f)=>a+f.monto,0)
  const egresos    = finanzas.filter(f=>f.tipoTransaccion==='EGRESO').reduce((a,f)=>a+f.monto,0)
  const balance    = ingresos - egresos
  const eficiencia = ingresos ? Math.round((balance/ingresos)*100) : 0

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)

  const categoriasActuales = form.tipoTransaccion === 'INGRESO' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO

  const abrirCrear = () => {
    setForm(FORM_INICIAL)
    setEditando(null)
    setModalOpen(true)
  }

  const abrirEditar = (f: FinanzaResponse) => {
    setForm({
      descripcion: f.descripcion,
      monto: f.monto,
      tipoTransaccion: f.tipoTransaccion as TipoTransaccion,
      categoria: f.categoria,
    })
    setEditando(f)
    setModalOpen(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.descripcion || !form.monto) return
    setSaving(true)
    try {
      if (editando) {
        await finanzasApi.actualizar(editando.idFinanza, form)
      } else {
        await finanzasApi.crear(form)
      }
      setModalOpen(false)
      setEditando(null)
      await cargar()
    } catch {
      setError('Error al guardar el registro.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (f: FinanzaResponse) => {
    try {
      await finanzasApi.eliminar(f.idFinanza)
      setConfirmDelete(null)
      await cargar()
    } catch {
      setError('Error al eliminar el registro.')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Mis Finanzas</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            Control de ingresos y egresos de {user?.nombreCompleto?.split(' ')[0]}
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span>
          Registrar transacción
        </button>
      </div>

      {/* Cards resumen */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'1rem' }}>
        <div style={{ borderRadius:'16px', padding:'24px', background:'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)', color:'white' }}>
          <p style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', opacity:0.8, margin:'0 0 8px' }}>Balance Total</p>
          <p style={{ fontSize:'1.75rem', fontWeight:800, margin:'0 0 4px' }}>{formatCOP(balance)}</p>
          <p style={{ fontSize:'0.75rem', opacity:0.8, margin:0 }}>{eficiencia >= 0 ? `+${eficiencia}%` : `${eficiencia}%`} eficiencia</p>
        </div>
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'20px', color:'var(--color-primary)' }}>trending_up</span>
            <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--color-on-surface-variant)' }}>Total Ingresos</span>
          </div>
          <p style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>{formatCOP(ingresos)}</p>
        </div>
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'20px', color:'var(--color-error)' }}>trending_down</span>
            <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--color-on-surface-variant)' }}>Total Egresos</span>
          </div>
          <p style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--color-error)', margin:0 }}>{formatCOP(egresos)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
        {(['TODAS','INGRESO','EGRESO'] as const).map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            style={{ padding:'8px 16px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:500,
              backgroundColor: filtroTipo === t ? 'var(--color-primary)' : 'var(--color-surface-container)',
              color: filtroTipo === t ? 'white' : 'var(--color-on-surface-variant)' }}>
            {t === 'TODAS' ? 'Todos' : t === 'INGRESO' ? 'Ingresos' : 'Egresos'}
          </button>
        ))}
        <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
          className="input-field" style={{ minHeight:'38px', padding:'6px 12px', width:'auto' }}>
          <option value="">Todas las categorías</option>
          {[...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO]
            .filter((v,i,a) => a.indexOf(v) === i)
            .map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filtroTipo !== 'TODAS' || filtroCat) && (
          <button onClick={() => { setFiltroTipo('TODAS'); setFiltroCat('') }}
            style={{ padding:'8px 12px', borderRadius:'9999px', border:'1px solid var(--color-outline-variant)', cursor:'pointer', fontSize:'0.8rem', backgroundColor:'transparent', color:'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{fontSize:'14px', verticalAlign:'middle'}}>filter_alt_off</span> Limpiar
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

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>progress_activity</span></div>}

      {/* Tabla */}
      {!loading && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-outline-variant)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)' }}>Historial de transacciones</h3>
            <span style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)' }}>{filtradas.length} registros</span>
          </div>

          {filtradas.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 24px', textAlign:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'48px', color:'var(--color-primary-fixed)', marginBottom:'12px' }}>payments</span>
              <p style={{ color:'var(--color-on-surface-variant)', margin:'0 0 16px' }}>
                {filtroTipo !== 'TODAS' || filtroCat ? 'Sin registros con ese filtro.' : 'No hay transacciones registradas.'}
              </p>
              {filtroTipo === 'TODAS' && !filtroCat && (
                <button onClick={abrirCrear} className="btn-primary">
                  <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span> Registrar primera transacción
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor:'var(--color-surface-container-low)' }}>
                    {['Fecha','Categoría','Tipo','Monto','Descripción','Acciones'].map(col => (
                      <th key={col} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.75rem', fontWeight:700, color:'var(--color-on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(f => (
                    <tr key={f.idFinanza} style={{ borderBottom:'1px solid var(--color-outline-variant)' }}>
                      <td style={{ padding:'12px 16px', color:'var(--color-on-surface-variant)', whiteSpace:'nowrap' }}>
                        {f.fechaRegistro ? new Date(parseFecha(f.fechaRegistro)).toLocaleDateString('es-CO') : '--'}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:600, backgroundColor:'var(--color-surface-container)', color:'var(--color-on-surface-variant)' }}>
                          {f.categoria}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:'0.75rem', fontWeight:700, color: f.tipoTransaccion === 'INGRESO' ? 'var(--color-primary)' : 'var(--color-error)' }}>
                          {f.tipoTransaccion}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px', fontWeight:700, whiteSpace:'nowrap', color: f.tipoTransaccion === 'INGRESO' ? 'var(--color-primary)' : 'var(--color-error)' }}>
                        {f.tipoTransaccion === 'INGRESO' ? '+' : '-'}{formatCOP(f.monto)}
                      </td>
                      <td style={{ padding:'12px 16px', color:'var(--color-on-surface)', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {f.descripcion}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', gap:'4px' }}>
                          <button onClick={() => abrirEditar(f)}
                            style={{ padding:'4px', borderRadius:'6px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-secondary)' }}
                            onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-secondary-fixed)')}
                            onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                            <span className="material-symbols-outlined" style={{fontSize:'18px'}}>edit</span>
                          </button>
                          <button onClick={() => setConfirmDelete(f)}
                            style={{ padding:'4px', borderRadius:'6px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-error)' }}
                            onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-error-container)')}
                            onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                            <span className="material-symbols-outlined" style={{fontSize:'18px'}}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'480px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>
                {editando ? 'Editar transacción' : 'Registrar transacción'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {/* Tipo */}
              <div>
                <label className="input-label">Tipo *</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {(['INGRESO','EGRESO'] as TipoTransaccion[]).map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(p => ({...p, tipoTransaccion:t, categoria: t==='INGRESO'?'COSECHA':'INSUMOS'}))}
                      style={{ flex:1, padding:'10px', borderRadius:'8px',
                        border:`2px solid ${form.tipoTransaccion===t ? (t==='INGRESO'?'var(--color-primary)':'var(--color-error)') : 'var(--color-outline-variant)'}`,
                        cursor:'pointer', fontSize:'0.875rem', fontWeight:600,
                        backgroundColor: form.tipoTransaccion===t ? (t==='INGRESO'?'var(--color-primary-fixed)':'var(--color-error-container)') : 'transparent',
                        color: form.tipoTransaccion===t ? (t==='INGRESO'?'var(--color-primary)':'var(--color-error)') : 'var(--color-on-surface-variant)' }}>
                      {t === 'INGRESO' ? '↑ Ingreso' : '↓ Egreso'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Categoría */}
              <div>
                <label className="input-label">Categoría</label>
                <select value={form.categoria} onChange={e => setForm(p => ({...p, categoria:e.target.value}))} className="input-field">
                  {categoriasActuales.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Monto */}
              <div>
                <label className="input-label">Monto (COP) *</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--color-outline)', fontSize:'0.875rem' }}>$</span>
                  <input type="number" min="0" step="1000" value={form.monto || ''}
                    onChange={e => setForm(p => ({...p, monto: parseFloat(e.target.value)}))}
                    placeholder="0" className="input-field" style={{ paddingLeft:'28px' }} required />
                </div>
              </div>
              {/* Descripción */}
              <div>
                <label className="input-label">Descripción *</label>
                <input type="text" value={form.descripcion}
                  onChange={e => setForm(p => ({...p, descripcion:e.target.value}))}
                  placeholder="Ej: Venta de plátano — Lote A" className="input-field" required />
              </div>
              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving
                    ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</>
                    : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>save</span> {editando ? 'Actualizar' : 'Guardar'}</>
                  }
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
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'8px' }}>¿Eliminar registro?</h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>
              Se eliminará <strong>{confirmDelete.descripcion}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
              <button onClick={() => handleEliminar(confirmDelete)} className="btn-danger" style={{flex:1}}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
