'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { ubicacionesApi } from '@/lib/api/ubicaciones'
import type { RegistroProductorRequest } from '@/types'

const MapaPicker = dynamic(() => import('@/components/MapaPicker'), { ssr: false })

type Step = 1 | 2

interface Step1Data {
  nombre: string; apellido: string; correo: string
  contrasena: string; confirmar: string; telefono: string; fechaNacimiento: string
}

const INITIAL_STEP1: Step1Data = {
  nombre:'', apellido:'', correo:'', contrasena:'', confirmar:'', telefono:'', fechaNacimiento:'',
}

export default function RegistroPage() {
  const { registrar, isLoading } = useAuth()
  const [step, setStep]         = useState<Step>(1)
  const [step1, setStep1]       = useState<Step1Data>(INITIAL_STEP1)
  const [nombreFinca, setNombreFinca] = useState('')
  const [hectareas, setHectareas]     = useState('')
  const [numLotes, setNumLotes]       = useState('')
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number; nombre: string } | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStep1(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const validateStep1 = () => {
    if (!step1.nombre || !step1.apellido || !step1.correo || !step1.telefono || !step1.fechaNacimiento) {
      setError('Todos los campos son obligatorios'); return false
    }
    if (step1.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return false
    }
    if (step1.contrasena !== step1.confirmar) {
      setError('Las contraseñas no coinciden'); return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nombreFinca || !hectareas || !numLotes) {
      setError('Todos los campos de la finca son obligatorios'); return
    }
    if (!coordenadas) {
      setError('Selecciona la ubicación de tu finca en el mapa'); return
    }
    try {
      // Crear o reusar la ubicación con coordenadas exactas
      const ubicacion = await ubicacionesApi.crear({
        nombre:   coordenadas.nombre,
        latitud:  coordenadas.lat,
        longitud: coordenadas.lng,
      })
      const data: RegistroProductorRequest = {
        nombre:          step1.nombre,
        apellido:        step1.apellido,
        correo:          step1.correo,
        contrasena:      step1.contrasena,
        telefono:        step1.telefono,
        fechaNacimiento: new Date(step1.fechaNacimiento).toISOString(),
        nombreFinca,
        hectareas:   parseFloat(hectareas),
        numLotes:    parseInt(numLotes),
        idUbicacion: ubicacion.idUbicacion,
      }
      await registrar(data)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'mensaje' in err
        ? (err as { mensaje: string }).mensaje
        : 'Error al registrar. Intenta nuevamente.'
      setError(msg)
    }
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', height:'52px', padding:'0 16px', borderRadius:'12px',
    border:'1.5px solid var(--color-outline-variant)',
    backgroundColor:'var(--color-surface-container-low)',
    fontSize:'0.9375rem', color:'var(--color-on-surface)',
    outline:'none', boxSizing:'border-box', transition:'border-color 0.2s',
  }
  const inputWithIconStyle: React.CSSProperties = { ...inputStyle, paddingLeft:'46px' }
  const labelStyle: React.CSSProperties = {
    display:'block', fontSize:'0.8rem', fontWeight:600,
    color:'var(--color-on-surface-variant)', marginBottom:'8px',
    textTransform:'uppercase', letterSpacing:'0.06em',
  }

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'var(--color-background)' }}>

      {/* Header */}
      <header style={{ position:'fixed', top:0, width:'100%', zIndex:50, backgroundColor:'white', borderBottom:'1px solid var(--color-outline-variant)', padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-primary)' }}>potted_plant</span>
          <span style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--color-primary)' }}>AgroSmart</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)' }}>¿Ya tienes cuenta?</span>
          <Link href="/login" className="btn-primary" style={{ padding:'8px 20px', fontSize:'0.875rem', minHeight:'36px' }}>
            Iniciar Sesión
          </Link>
        </div>
      </header>

      <main style={{ paddingTop:'80px', paddingBottom:'48px', display:'flex', justifyContent:'center', padding:'96px 16px 48px' }}>
        <div style={{ width:'100%', maxWidth:'680px' }}>

          {/* Indicador de pasos */}
          <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'32px' }}>
            {/* Paso 1 */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'9999px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0,
                backgroundColor: step >= 1 ? 'var(--color-primary)' : 'transparent',
                border: step >= 1 ? 'none' : '2px solid var(--color-outline)',
                color: step >= 1 ? 'white' : 'var(--color-outline)' }}>
                {step > 1 ? <span className="material-symbols-outlined" style={{fontSize:'20px'}}>check</span> : '1'}
              </div>
              <div>
                <p style={{ fontSize:'0.75rem', color:'var(--color-primary)', margin:0, fontWeight:600 }}>Paso 1</p>
                <p style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Datos personales</p>
              </div>
            </div>

            {/* Línea */}
            <div style={{ flex:1, height:'2px', backgroundColor: step === 2 ? 'var(--color-primary)' : 'var(--color-outline-variant)', borderRadius:'9999px' }} />

            {/* Paso 2 */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', opacity: step < 2 ? 0.4 : 1 }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'9999px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0,
                backgroundColor: step === 2 ? 'var(--color-primary)' : 'transparent',
                border: step === 2 ? 'none' : '2px solid var(--color-outline)',
                color: step === 2 ? 'white' : 'var(--color-outline)' }}>
                2
              </div>
              <div>
                <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>Paso 2</p>
                <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:0 }}>Tu finca</p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="card" style={{ padding:'40px 32px' }}>
            <div style={{ marginBottom:'28px' }}>
              <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--color-primary)', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
                {step === 1 ? 'Crea tu cuenta' : 'Registra tu finca'}
              </h1>
              <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:0 }}>
                ¿Ya estás registrado?{' '}
                <Link href="/login" style={{ color:'var(--color-primary)', fontWeight:700, textDecoration:'none' }}>Inicia sesión</Link>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'10px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem', marginBottom:'24px' }}>
                <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
                {error}
              </div>
            )}

            {/* ── PASO 1 ── */}
            {step === 1 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input name="nombre" type="text" value={step1.nombre} onChange={handleStep1Change}
                    placeholder="Juan" style={inputStyle} required
                    onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                    onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                </div>
                <div>
                  <label style={labelStyle}>Apellido *</label>
                  <input name="apellido" type="text" value={step1.apellido} onChange={handleStep1Change}
                    placeholder="Pérez" style={inputStyle} required
                    onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                    onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={labelStyle}>Correo electrónico *</label>
                  <div style={{ position:'relative' }}>
                    <span className="material-symbols-outlined" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)', pointerEvents:'none' }}>mail</span>
                    <input name="correo" type="email" value={step1.correo} onChange={handleStep1Change}
                      placeholder="usuario@agro.co" style={inputWithIconStyle} required
                      onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                      onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Teléfono *</label>
                  <div style={{ position:'relative' }}>
                    <span className="material-symbols-outlined" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)', pointerEvents:'none' }}>call</span>
                    <input name="telefono" type="tel" value={step1.telefono} onChange={handleStep1Change}
                      placeholder="+57 300 000 0000" style={inputWithIconStyle} required
                      onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                      onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Fecha de nacimiento *</label>
                  <input name="fechaNacimiento" type="date" value={step1.fechaNacimiento}
                    onChange={handleStep1Change} style={inputStyle} required
                    onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                    onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                </div>
                <div>
                  <label style={labelStyle}>Contraseña *</label>
                  <div style={{ position:'relative' }}>
                    <span className="material-symbols-outlined" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)', pointerEvents:'none' }}>lock</span>
                    <input name="contrasena" type={showPass ? 'text' : 'password'} value={step1.contrasena}
                      onChange={handleStep1Change} placeholder="Mín. 6 caracteres"
                      style={{ ...inputWithIconStyle, paddingRight:'48px' }} required
                      onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                      onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', border:'none', background:'transparent', cursor:'pointer', color:'var(--color-outline)' }}>
                      <span className="material-symbols-outlined" style={{fontSize:'20px'}}>{showPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirmar contraseña *</label>
                  <div style={{ position:'relative' }}>
                    <span className="material-symbols-outlined" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)', pointerEvents:'none' }}>lock</span>
                    <input name="confirmar" type={showPass ? 'text' : 'password'} value={step1.confirmar}
                      onChange={handleStep1Change} placeholder="Repite tu contraseña"
                      style={inputWithIconStyle} required
                      onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                      onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                  </div>
                </div>
                <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'center', paddingTop:'8px' }}>
                  <button type="button" onClick={() => { if(validateStep1()) { setError(null); setStep(2) } }}
                    className="btn-primary" style={{ minWidth:'200px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    Siguiente
                    <span className="material-symbols-outlined" style={{fontSize:'20px'}}>arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 2 ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label style={labelStyle}>Nombre de tu finca *</label>
                    <div style={{ position:'relative' }}>
                      <span className="material-symbols-outlined" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)', pointerEvents:'none' }}>home</span>
                      <input type="text" value={nombreFinca} onChange={e => { setNombreFinca(e.target.value); setError(null) }}
                        placeholder="Ej: Finca El Paraíso" style={inputWithIconStyle} required
                        onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                        onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Hectáreas *</label>
                    <input type="number" step="0.01" min="0.01" value={hectareas}
                      onChange={e => setHectareas(e.target.value)}
                      placeholder="Ej: 2.5" style={inputStyle} required
                      onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                      onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Número de lotes *</label>
                    <input type="number" min="1" value={numLotes}
                      onChange={e => setNumLotes(e.target.value)}
                      placeholder="Ej: 3" style={inputStyle} required
                      onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                      onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')} />
                  </div>
                </div>

                {/* Mapa */}
                <div>
                  <label style={labelStyle}>Ubicación exacta de tu finca *</label>
                  <p style={{ fontSize:'0.8rem', color:'var(--color-on-surface-variant)', margin:'0 0 8px' }}>
                    Haz click en el mapa para seleccionar la ubicación exacta
                  </p>
                  <MapaPicker onChange={(lat, lng, nombre) => { setCoordenadas({ lat, lng, nombre }); setError(null) }} />
                  {coordenadas ? (
                    <p style={{ fontSize:'0.8rem', color:'var(--color-primary)', margin:'8px 0 0', display:'flex', alignItems:'center', gap:'4px', fontWeight:600 }}>
                      <span className="material-symbols-outlined" style={{fontSize:'16px'}}>location_on</span>
                      {coordenadas.nombre} ({coordenadas.lat.toFixed(4)}, {coordenadas.lng.toFixed(4)})
                    </p>
                  ) : (
                    <p style={{ fontSize:'0.75rem', color:'var(--color-error)', margin:'6px 0 0' }}>
                      * Selecciona la ubicación en el mapa para continuar
                    </p>
                  )}
                </div>

                <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <span className="material-symbols-outlined" style={{fontSize:'20px'}}>arrow_back</span>
                    Anterior
                  </button>
                  <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    {isLoading
                      ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'20px'}}>progress_activity</span> Registrando...</>
                      : <><span className="material-symbols-outlined" style={{fontSize:'20px'}}>check_circle</span> Crear cuenta</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Trust cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:'16px', marginTop:'24px' }}>
            {[
              { icon:'verified_user', title:'Datos Protegidos', desc:'Tus datos están cifrados con los más altos estándares.' },
              { icon:'support_agent', title:'Soporte 24/7',     desc:'Nuestro equipo en el Magdalena está listo para apoyarte.' },
              { icon:'trending_up',   title:'Crece con nosotros', desc:'Únete a la comunidad que digitaliza el campo colombiano.' },
            ].map(item => (
              <div key={item.title} className="card" style={{ padding:'20px' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-secondary)', marginBottom:'8px', display:'block' }}>{item.icon}</span>
                <h3 style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--color-primary)', margin:'0 0 4px' }}>{item.title}</h3>
                <p style={{ fontSize:'0.8rem', color:'var(--color-on-surface-variant)', margin:0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
