'use client'

import { useState, useEffect } from 'react'
import { getCachedData, cacheData } from '@/lib/offline/db'
import { useOfflineStatus } from '@/hooks/useOfflineStatus'
import { fincasApi } from '@/lib/api/fincas'
import { ubicacionesApi } from '@/lib/api/ubicaciones'
import dynamic from 'next/dynamic'
import type { Finca, FincaRequest } from '@/types'

// Cargar el mapa solo en el cliente (evita SSR issues con Leaflet)
const MapaPicker = dynamic(() => import('@/components/MapaPicker'), { ssr: false })

const UBICACIONES = [
  { id: 1, nombre: 'Santa Marta' },
  { id: 2, nombre: 'Ciénaga' },
  { id: 3, nombre: 'Fundación' },
  { id: 4, nombre: 'Aracataca' },
  { id: 5, nombre: 'El Banco' },
  { id: 6, nombre: 'Plato' },
  { id: 7, nombre: 'Pivijay' },
  { id: 8, nombre: 'Zona Bananera' },
  { id: 9, nombre: 'Remolino' },
  { id: 10, nombre: 'Salamina' },
]

type ModalMode = 'crear' | 'editar' | null

const FORM_INICIAL: FincaRequest = { nombreFinca: '', hectareas: 0, numLotes: 1, idUbicacion: 1 }

export default function MiFincaPage() {
  const [fincas, setFincas]               = useState<Finca[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [modalMode, setModalMode]         = useState<ModalMode>(null)
  const [fincaActiva, setFincaActiva]     = useState<Finca | null>(null)
  const [saving, setSaving]               = useState(false)
  const [deletingId, setDeletingId]       = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Finca | null>(null)
  const [form, setForm]                   = useState<FincaRequest>(FORM_INICIAL)
  const [coordenadas, setCoordenadas]     = useState<{ lat: number; lng: number; nombre: string } | null>(null)

  // Carga inicial
  const isOnline = useOfflineStatus()

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      setError(null)
      try {
        if (isOnline) {
          const data = await fincasApi.listar()
          if (!cancelado) {
            setFincas(data)
            await cacheData('fincas', Array.isArray(data) ? data : [])
          }
        } else {
          const data = await getCachedData('fincas')
          if (!cancelado) setFincas(data as never[])
        }
      } catch {
        const cached = await getCachedData('fincas')
        if (!cancelado && cached.length > 0) setFincas(cached as never[])
        else if (!cancelado) setError('No se pudieron cargar las fincas.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [isOnline])

  // Recarga después de crear/editar/eliminar
  const cargarFincas = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fincasApi.listar()
      setFincas(data)
    } catch {
      setError('No se pudieron cargar las fincas.')
    } finally {
      setLoading(false)
    }
  }

  const abrirCrear = () => {
    setForm(FORM_INICIAL)
    setFincaActiva(null)
    setModalMode('crear')
  }

  const abrirEditar = (finca: Finca) => {
    setForm({
      nombreFinca:  finca.nombreFinca,
      hectareas:    finca.hectareas,
      numLotes:     finca.numLotes,
      idUbicacion:  finca.idUbicacion ?? 1,
    })
    setCoordenadas(null) // limpiar para que el usuario seleccione nueva ubicación
    setFincaActiva(finca)
    setModalMode('editar')
  }

  const cerrarModal = () => { setModalMode(null); setFincaActiva(null) }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (modalMode === 'crear' && !coordenadas) {
      setError('Selecciona la ubicación en el mapa.')
      return
    }
    setSaving(true)
    try {
      if (modalMode === 'crear') {
        // Crear o reusar ubicación con las coordenadas del mapa
        const ubicacion = await ubicacionesApi.crear({
          nombre:   coordenadas!.nombre,
          latitud:  coordenadas!.lat,
          longitud: coordenadas!.lng,
        })
        await fincasApi.crear({ ...form, idUbicacion: ubicacion.idUbicacion })
      } else if (modalMode === 'editar' && fincaActiva) {
        let idUbicacionFinal = form.idUbicacion
        if (coordenadas) {
          const nuevaUbicacion = await ubicacionesApi.crear({
            nombre:   coordenadas.nombre,
            latitud:  coordenadas.lat,
            longitud: coordenadas.lng,
          })
          idUbicacionFinal = nuevaUbicacion.idUbicacion
        }
        await fincasApi.actualizar(fincaActiva.idFinca, {
          ...form,
          idUbicacion: idUbicacionFinal,
        })
      }
      cerrarModal()
      await cargarFincas()
    } catch {
      setError('Error al guardar la finca. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (finca: Finca) => {
    setDeletingId(finca.idFinca)
    try {
      await fincasApi.eliminar(finca.idFinca)
      setConfirmDelete(null)
      await cargarFincas()
    } catch {
      setError('Error al eliminar la finca.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Mis Fincas</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            Administra las fincas registradas en tu cuenta
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span>
          Nueva Finca
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-fade-in" style={{
          display:'flex', alignItems:'center', gap:'8px',
          padding:'12px 16px', borderRadius:'8px',
          backgroundColor:'var(--color-error-container)',
          color:'var(--color-on-error-container)', fontSize:'0.875rem'
        }}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
          <span style={{flex:1}}>{error}</span>
          <button onClick={() => setError(null)}>
            <span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'80px 0' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>
            progress_activity
          </span>
        </div>
      )}

      {/* Sin fincas */}
      {!loading && fincas.length === 0 && !error && (
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'56px', color:'var(--color-primary-fixed)', marginBottom:'16px' }}>home</span>
          <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--color-on-surface)', marginBottom:'8px' }}>
            No tienes fincas registradas
          </h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', maxWidth:'360px', marginBottom:'24px' }}>
            Registra tu primera finca para empezar a gestionar tus cultivos y actividades agrícolas.
          </p>
          <button onClick={abrirCrear} className="btn-primary">
            <span className="material-symbols-outlined" style={{fontSize:'20px'}}>add</span>
            Registrar mi primera finca
          </button>
        </div>
      )}

      {/* Grid de fincas */}
      {!loading && fincas.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
          {fincas.map((finca) => (
            <div key={finca.idFinca} className="card" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* Header */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                <div style={{
                  width:'44px', height:'44px', borderRadius:'10px', flexShrink:0,
                  backgroundColor:'var(--color-primary-fixed)',
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'var(--color-primary)' }}>home</span>
                </div>
                <div style={{ minWidth:0 }}>
                  <h3 style={{ fontWeight:600, color:'var(--color-on-surface)', margin:0, fontSize:'1rem' }}>
                    {finca.nombreFinca}
                  </h3>
                  <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:'2px', margin:0 }}>
                    <span className="material-symbols-outlined" style={{fontSize:'14px'}}>location_on</span>
                    {finca.nombreUbicacion ?? 'Sin ubicación'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {[
                  { label: 'Hectáreas', value: finca.hectareas },
                  { label: 'Lotes',     value: finca.numLotes  },
                ].map(stat => (
                  <div key={stat.label} style={{
                    backgroundColor:'var(--color-surface-container-low)',
                    borderRadius:'8px', padding:'12px'
                  }}>
                    <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{stat.label}</p>
                    <p style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Fecha */}
              {finca.fechaRegistro && (
                <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:'4px', margin:0 }}>
                  <span className="material-symbols-outlined" style={{fontSize:'14px'}}>calendar_today</span>
                  Registrada: {new Date(finca.fechaRegistro).toLocaleDateString('es-CO')}
                </p>
              )}

              {/* Acciones */}
              <div style={{ display:'flex', gap:'8px', paddingTop:'12px', borderTop:'1px solid var(--color-outline-variant)' }}>
                <button onClick={() => abrirEditar(finca)} style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px',
                  padding:'8px', borderRadius:'8px', fontSize:'0.875rem', fontWeight:500, border:'none',
                  cursor:'pointer', color:'var(--color-secondary)', backgroundColor:'transparent', transition:'background 0.2s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-secondary-fixed)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>edit</span> Editar
                </button>
                <button onClick={() => setConfirmDelete(finca)} style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px',
                  padding:'8px', borderRadius:'8px', fontSize:'0.875rem', fontWeight:500, border:'none',
                  cursor:'pointer', color:'var(--color-error)', backgroundColor:'transparent', transition:'background 0.2s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-error-container)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>delete</span> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalMode && (
        <div style={{
          position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
          backgroundColor:'rgba(0,0,0,0.5)'
        }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'440px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>
                {modalMode === 'crear' ? 'Nueva Finca' : 'Editar Finca'}
              </h2>
              <button onClick={cerrarModal} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label className="input-label" htmlFor="nombreFinca">Nombre de la finca</label>
                <input id="nombreFinca" type="text" value={form.nombreFinca}
                  onChange={e => setForm(p => ({...p, nombreFinca: e.target.value}))}
                  placeholder="Ej: Finca El Paraíso" className="input-field" required />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label" htmlFor="hectareas">Hectáreas</label>
                  <input id="hectareas" type="number" step="0.01" min="0.01"
                    value={form.hectareas || ''}
                    onChange={e => setForm(p => ({...p, hectareas: parseFloat(e.target.value)}))}
                    placeholder="Ej: 2.5" className="input-field" required />
                </div>
                <div>
                  <label className="input-label" htmlFor="numLotes">N° Lotes</label>
                  <input id="numLotes" type="number" min="1"
                    value={form.numLotes || ''}
                    onChange={e => setForm(p => ({...p, numLotes: parseInt(e.target.value)}))}
                    placeholder="Ej: 3" className="input-field" required />
                </div>
              </div>

              <div>
                <label className="input-label">Ubicación de la finca</label>
                <MapaPicker
                  latitud={coordenadas?.lat}
                  longitud={coordenadas?.lng}
                  onChange={(lat, lng, nombre) => setCoordenadas({ lat, lng, nombre })}
                />
                {!coordenadas && (
                  <p style={{ fontSize:'0.75rem', color:'var(--color-error)', margin:'4px 0 0' }}>
                    Selecciona la ubicación en el mapa *
                  </p>
                )}
              </div>

              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={cerrarModal} className="btn-secondary" style={{flex:1}}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving
                    ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</>
                    : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>save</span> Guardar</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div style={{
          position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
          backgroundColor:'rgba(0,0,0,0.5)'
        }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'360px', textAlign:'center' }}>
            <div style={{
              width:'56px', height:'56px', borderRadius:'9999px', margin:'0 auto 16px',
              backgroundColor:'var(--color-error-container)',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-error)' }}>delete</span>
            </div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', marginBottom:'8px' }}>
              ¿Eliminar finca?
            </h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>
              Estás a punto de eliminar <strong>{confirmDelete.nombreFinca}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary" style={{flex:1}}>
                Cancelar
              </button>
              <button onClick={() => handleEliminar(confirmDelete)}
                disabled={deletingId === confirmDelete.idFinca}
                className="btn-danger" style={{flex:1}}>
                {deletingId === confirmDelete.idFinca
                  ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Eliminando...</>
                  : 'Sí, eliminar'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
