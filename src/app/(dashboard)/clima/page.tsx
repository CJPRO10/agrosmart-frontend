'use client'

import { useState, useEffect } from 'react'
import { climaApi } from '@/lib/api/clima'
import { fincasApi } from '@/lib/api/fincas'
import { recomendacionesApi } from '@/lib/api/recomendaciones'
import type { ClimaResponse, DiaPronostico, PronosticoResponse } from '@/lib/api/clima'
import type { Finca } from '@/types'

const CONDICION_ICON: Record<string, string> = {
  'despejado':   'wb_sunny',
  'nublado':     'cloud',
  'lluvia':      'rainy',
  'tormenta':    'thunderstorm',
  'llovizna':    'grain',
  'niebla':      'foggy',
  'default':     'partly_cloudy_day',
}

function getIconClima(condicion?: string): string {
  if (!condicion) return CONDICION_ICON['default']
  const lower = condicion.toLowerCase()
  for (const key of Object.keys(CONDICION_ICON)) {
    if (lower.includes(key)) return CONDICION_ICON[key]
  }
  return CONDICION_ICON['default']
}

const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function ClimaPage() {
  const [fincas, setFincas]           = useState<Finca[]>([])
  const [fincaId, setFincaId]         = useState<number>(0)
  const [ubicacionId, setUbicacionId] = useState<number>(1)
  const [climaActual, setClimaActual] = useState<ClimaResponse | null>(null)
  const [pronostico, setPronostico]   = useState<PronosticoResponse | null>(null)
  const [historial, setHistorial]     = useState<ClimaResponse[]>([])
  const [loading, setLoading]         = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [tab, setTab]                 = useState<'actual' | 'pronostico' | 'historial'>('actual')
  const [generandoRec, setGenerandoRec] = useState(false)
  const [recGenerada, setRecGenerada]   = useState<string | null>(null)

  // Cargar fincas primero
  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      try {
        const f = await fincasApi.listar()
        if (!cancelado && f.length > 0) {
          setFincas(f)
          setFincaId(f[0].idFinca)
          setUbicacionId(f[0].idUbicacion)
        }
      } catch { /* sin fincas, usar ubicación default */ }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  // Cargar clima cuando cambia la ubicación
  useEffect(() => {
    if (!ubicacionId) return
    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      setError(null)
      try {
        const [actual, pron, hist] = await Promise.all([
          climaApi.actual(ubicacionId),
          climaApi.pronostico(ubicacionId, 7),
          climaApi.historial(ubicacionId),
        ])
        if (!cancelado) {
          setClimaActual(actual)
          setPronostico(pron)
          setHistorial(hist)
        }
      } catch {
        if (!cancelado) setError('No se pudo obtener la información climática.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [ubicacionId])

  const handleActualizar = async () => {
    setActualizando(true)
    try {
      const nuevo = await climaApi.actualizar(ubicacionId)
      setClimaActual(nuevo)
    } catch {
      setError('Error al actualizar el clima.')
    } finally {
      setActualizando(false)
    }
  }

  const handleFincaChange = (idFinca: number) => {
    setFincaId(idFinca)
    const finca = fincas.find(f => f.idFinca === idFinca)
    if (finca) setUbicacionId(finca.idUbicacion)
  }

  const handleGenerarRecomendacion = async () => {
    if (!climaActual) return
    setGenerandoRec(true)
    setRecGenerada(null)
    try {
      // Solicitar recomendación basada en las condiciones climáticas actuales
      const rec = await recomendacionesApi.solicitar({
        idSiembra: 0,
        descripcionSolicitud: `Condiciones actuales: ${climaActual.condicion}, ${climaActual.temperatura}°C, precipitación ${climaActual.precipitacion}mm en ${climaActual.nombreUbicacion}. ¿Qué acciones debo tomar?`,
        categoria: 'CLIMA',
      })
      setRecGenerada(rec.descripcion ?? 'Recomendación generada exitosamente.')
    } catch {
      setError('Error al generar la recomendación climática.')
    } finally {
      setGenerandoRec(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Monitor de Clima</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            Seguimiento agroclimático para {climaActual?.nombreUbicacion ?? 'tu zona'}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
          {fincas.length > 0 && (
            <select value={fincaId} onChange={e => handleFincaChange(Number(e.target.value))}
              className="input-field" style={{ minHeight:'40px', padding:'8px 12px', width:'auto' }}>
              {fincas.map(f => <option key={f.idFinca} value={f.idFinca}>{f.nombreFinca}</option>)}
            </select>
          )}
          <button onClick={handleGenerarRecomendacion} disabled={generandoRec || !climaActual} className="btn-primary" style={{ whiteSpace:'nowrap', minHeight:'40px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'18px', ...(generandoRec ? {animation:'spin 1s linear infinite'} : {}) }}>lightbulb</span>
            {generandoRec ? 'Generando...' : 'Generar recomendación'}
          </button>
          <button onClick={handleActualizar} disabled={actualizando} className="btn-secondary" style={{ whiteSpace:'nowrap', minHeight:'40px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'18px', ...(actualizando ? {animation:'spin 1s linear infinite'} : {}) }}>refresh</span>
            {actualizando ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Recomendación generada — RF44 */}
      {recGenerada && (
        <div className="animate-fade-in" style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'16px', borderRadius:'12px', backgroundColor:'var(--color-primary-fixed)', border:'1px solid var(--color-primary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'var(--color-primary)', flexShrink:0 }}>lightbulb</span>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:600, color:'var(--color-primary)', margin:'0 0 4px', fontSize:'0.875rem' }}>Recomendación basada en el clima</p>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface)', margin:0 }}>{recGenerada}</p>
          </div>
          <button onClick={() => setRecGenerada(null)} style={{ padding:'4px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-primary)' }}>
            <span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span>
          </button>
        </div>
      )}

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

      {!loading && (
        <>
          {/* Clima actual + pronóstico 24h */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:'1rem' }}>

            {/* Card clima actual */}
            <div style={{ borderRadius:'16px', padding:'24px', background:'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)', color:'white', position:'relative', overflow:'hidden', minWidth:0 }}>
              <div style={{ position:'absolute', top:'-20px', right:'-20px', opacity:0.15 }}>
                <span className="material-symbols-outlined" style={{ fontSize:'140px' }}>{getIconClima(climaActual?.condicion)}</span>
              </div>
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <span style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', opacity:0.8 }}>Estado actual</span>
                  {climaActual?.fechaMedicion && (
                    <span style={{ fontSize:'0.7rem', opacity:0.7 }}>· {new Date(climaActual.fechaMedicion).toLocaleDateString('es-CO')}</span>
                  )}
                </div>
                <p style={{ fontSize:'3.5rem', fontWeight:800, margin:'0 0 4px', lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {climaActual?.temperatura ?? '--'}°<span style={{ fontSize:'1.75rem' }}>C</span>
                </p>
                <p style={{ fontSize:'1rem', opacity:0.9, margin:'0 0 20px' }}>{climaActual?.condicion ?? 'Sin datos'}</p>
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                  {[
                    { icon:'water_drop', label:'Precipitación', value:`${climaActual?.precipitacion ?? '--'} mm` },
                    { icon:'humidity_percentage', label:'Condición', value: climaActual?.condicion ?? '--' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <p style={{ fontSize:'0.7rem', opacity:0.7, margin:0, display:'flex', alignItems:'center', gap:'2px' }}>
                        <span className="material-symbols-outlined" style={{fontSize:'14px'}}>{stat.icon}</span>{stat.label}
                      </p>
                      <p style={{ fontSize:'0.9rem', fontWeight:600, margin:0 }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                {climaActual?.alerta && (
                  <div style={{ marginTop:'16px', padding:'8px 12px', borderRadius:'8px', backgroundColor:'rgba(255,255,255,0.2)', fontSize:'0.8rem' }}>
                    <span className="material-symbols-outlined" style={{fontSize:'16px', verticalAlign:'middle', marginRight:'4px'}}>warning</span>
                    {climaActual.alerta}
                  </div>
                )}
              </div>
            </div>

            {/* Pronóstico próximos días */}
            <div className="card" style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <h3 style={{ fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)', margin:0 }}>
                Pronóstico {pronostico?.dias?.length ?? 0} días
              </h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', flex:1, overflowY:'auto' }}>
                {(pronostico?.dias ?? []).slice(0, 5).map((dia: DiaPronostico, i: number) => {
                  const fecha = new Date(dia.fecha)
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'8px', borderRadius:'8px', backgroundColor:'var(--color-surface-container-low)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'var(--color-secondary)', flexShrink:0 }}>{getIconClima(dia.condicion)}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-on-surface)', margin:0 }}>
                          {i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_SEMANA[fecha.getDay()]}
                        </p>
                        <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{dia.condicion}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>{dia.temperaturaMaxima}°</p>
                        <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{dia.temperaturaMinima}°</p>
                      </div>
                      {dia.precipitacion > 0 && (
                        <div style={{ fontSize:'0.7rem', color:'var(--color-secondary)', fontWeight:600, textAlign:'right' }}>
                          {dia.precipitacion}mm
                        </div>
                      )}
                    </div>
                  )
                })}
                {(!pronostico?.dias || pronostico.dias.length === 0) && (
                  <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', textAlign:'center', padding:'20px 0' }}>Sin pronóstico disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'4px', borderBottom:'2px solid var(--color-outline-variant)', paddingBottom:'0' }}>
            {([
              { key:'actual',     label:'Condición actual' },
              { key:'pronostico', label:'Pronóstico completo' },
              { key:'historial',  label:'Historial' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding:'10px 20px', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600, borderRadius:'8px 8px 0 0', transition:'all 0.2s', backgroundColor:'transparent',
                  color: tab === t.key ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                  borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                  marginBottom:'-2px'
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Historial */}
          {tab === 'historial' && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-outline-variant)' }}>
                <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)' }}>Historial de mediciones</h3>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor:'var(--color-surface-container-low)' }}>
                      {['Fecha','Temperatura','Precipitación','Condición','Alerta'].map(col => (
                        <th key={col} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.75rem', fontWeight:700, color:'var(--color-on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding:'40px', textAlign:'center', color:'var(--color-on-surface-variant)' }}>Sin historial disponible</td></tr>
                    ) : historial.map((h, i) => (
                      <tr key={h.idClima ?? i} style={{ borderBottom:'1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding:'12px 16px', color:'var(--color-on-surface)' }}>{h.fechaMedicion ? new Date(h.fechaMedicion).toLocaleDateString('es-CO') : '--'}</td>
                        <td style={{ padding:'12px 16px', fontWeight:600, color:'var(--color-primary)' }}>{h.temperatura}°C</td>
                        <td style={{ padding:'12px 16px', color:'var(--color-on-surface)' }}>{h.precipitacion} mm</td>
                        <td style={{ padding:'12px 16px', color:'var(--color-on-surface)' }}>{h.condicion}</td>
                        <td style={{ padding:'12px 16px' }}>
                          {h.alerta
                            ? <span style={{ padding:'2px 8px', borderRadius:'9999px', fontSize:'11px', fontWeight:600, backgroundColor:'var(--color-error-container)', color:'var(--color-error)' }}>{h.alerta}</span>
                            : <span style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)' }}>—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Pronóstico completo */}
          {tab === 'pronostico' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:'12px' }}>
              {(pronostico?.dias ?? []).map((dia: DiaPronostico, i: number) => {
                const fecha = new Date(dia.fecha)
                return (
                  <div key={i} className="card" style={{ textAlign:'center', padding:'16px' }}>
                    <p style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--color-on-surface-variant)', margin:'0 0 8px', textTransform:'uppercase' }}>
                      {i === 0 ? 'Hoy' : DIAS_SEMANA[fecha.getDay()]}
                    </p>
                    <span className="material-symbols-outlined" style={{ fontSize:'32px', color:'var(--color-secondary)' }}>{getIconClima(dia.condicion)}</span>
                    <p style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-primary)', margin:'8px 0 2px' }}>{dia.temperaturaMaxima}°</p>
                    <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:0 }}>{dia.temperaturaMinima}°</p>
                    <p style={{ fontSize:'0.7rem', color:'var(--color-on-surface-variant)', margin:'6px 0 0' }}>{dia.condicion}</p>
                    {dia.precipitacion > 0 && (
                      <p style={{ fontSize:'0.7rem', color:'var(--color-secondary)', fontWeight:600, margin:'4px 0 0' }}>{dia.precipitacion}mm</p>
                    )}
                    {dia.alerta && (
                      <p style={{ fontSize:'0.65rem', color:'var(--color-error)', margin:'4px 0 0' }}>{dia.alerta}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Tab: Condición actual detalle */}
          {tab === 'actual' && climaActual && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'12px' }}>
              {[
                { icon:'thermostat',           label:'Temperatura',   value:`${climaActual.temperatura}°C`,      color:'var(--color-error)'     },
                { icon:'water_drop',           label:'Precipitación', value:`${climaActual.precipitacion} mm`,   color:'var(--color-secondary)' },
                { icon:'location_on',          label:'Ubicación',     value: climaActual.nombreUbicacion,        color:'var(--color-primary)'   },
                { icon: getIconClima(climaActual.condicion), label:'Condición', value: climaActual.condicion,   color:'var(--color-tertiary)'  },
              ].map(stat => (
                <div key={stat.label} className="card" style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'10px', flexShrink:0, backgroundColor:'var(--color-surface-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:'22px', color:stat.color }}>{stat.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{stat.label}</p>
                    <p style={{ fontSize:'1rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
