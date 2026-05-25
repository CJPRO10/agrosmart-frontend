'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import type { LoginRequest } from '@/types'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const [form, setForm]           = useState<LoginRequest>({ correo: '', contrasena: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(form)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'mensaje' in err
        ? (err as { mensaje: string }).mensaje
        : 'Correo o contraseña incorrectos'
      setError(msg)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'var(--color-background)' }}>
      <div style={{ width:'100%', maxWidth: isMobile ? '480px' : '1000px', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', borderRadius:'20px', overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.12)', minHeight: isMobile ? 'auto' : '600px' }}>

        {/* Panel izquierdo — oculto en móvil */}
        {!isMobile && <div style={{ position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px', background:'linear-gradient(160deg, #1a4d1a 0%, #0d2e0d 100%)', overflow:'hidden' }}>
          {/* Imagen fondo */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'url("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80")', backgroundSize:'cover', backgroundPosition:'center', opacity:0.2 }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, rgba(21,66,18,0.95) 0%, rgba(13,46,13,0.85) 100%)' }} />

          {/* Contenido */}
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'48px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'32px', color:'#7EC850' }}>potted_plant</span>
              <span style={{ fontSize:'1.25rem', fontWeight:800, color:'white', letterSpacing:'-0.5px' }}>AgroSmart</span>
            </div>
            <h2 style={{ fontSize:'2rem', fontWeight:800, color:'white', lineHeight:1.2, margin:'0 0 16px', letterSpacing:'-0.5px' }}>
              Gestión agrícola<br/>
              <span style={{ color:'#7EC850' }}>inteligente.</span>
            </h2>
            <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.7)', lineHeight:1.6, maxWidth:'280px' }}>
              Potencia tu producción con herramientas diseñadas para el campo colombiano.
            </p>
          </div>

          {/* Features */}
          <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:'16px' }}>
            {[
              { icon:'potted_plant', text:'Gestión de cultivos en tiempo real' },
              { icon:'cloudy_snowing', text:'Monitor climático del Magdalena'  },
              { icon:'lightbulb',    text:'Recomendaciones con IA'             },
            ].map(f => (
              <div key={f.text} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'8px', backgroundColor:'rgba(126,200,80,0.15)', border:'1px solid rgba(126,200,80,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'18px', color:'#7EC850' }}>{f.icon}</span>
                </div>
                <span style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.75)' }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:'12px', marginTop:'32px' }}>
            <div style={{ width:'32px', height:'2px', backgroundColor:'rgba(255,255,255,0.3)', borderRadius:'9999px' }} />
            <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Progreso Regional</span>
          </div>
        </div>

        }

        {/* Panel derecho — formulario */}
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px', backgroundColor:'var(--color-surface-container-lowest)' }}>
          <div style={{ maxWidth:'360px', width:'100%', margin:'0 auto' }}>

            {/* Encabezado */}
            <div style={{ marginBottom:'36px' }}>
              <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--color-on-surface)', margin:'0 0 8px', letterSpacing:'-0.5px' }}>
                Bienvenido
              </h1>
              <p style={{ fontSize:'0.9rem', color:'var(--color-on-surface-variant)', margin:0 }}>
                Inicia sesión para continuar
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'10px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem', marginBottom:'24px' }}>
                <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

              {/* Correo */}
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, color:'var(--color-on-surface-variant)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Correo electrónico
                </label>
                <div style={{ position:'relative' }}>
                  <span className="material-symbols-outlined" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)', pointerEvents:'none' }}>mail</span>
                  <input
                    id="correo" name="correo" type="email"
                    value={form.correo} onChange={handleChange}
                    placeholder="usuario@agro.co"
                    required
                    style={{ width:'100%', height:'52px', paddingLeft:'46px', paddingRight:'16px', borderRadius:'12px', border:'1.5px solid var(--color-outline-variant)', backgroundColor:'var(--color-surface-container-low)', fontSize:'0.9375rem', color:'var(--color-on-surface)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                    onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                    onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, color:'var(--color-on-surface-variant)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Contraseña
                </label>
                <div style={{ position:'relative' }}>
                  <span className="material-symbols-outlined" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)', pointerEvents:'none' }}>lock</span>
                  <input
                    id="contrasena" name="contrasena"
                    type={showPassword ? 'text' : 'password'}
                    value={form.contrasena} onChange={handleChange}
                    placeholder="••••••••"
                    required
                    style={{ width:'100%', height:'52px', paddingLeft:'46px', paddingRight:'48px', borderRadius:'12px', border:'1.5px solid var(--color-outline-variant)', backgroundColor:'var(--color-surface-container-low)', fontSize:'0.9375rem', color:'var(--color-on-surface)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                    onFocus={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
                    onBlur={e=>(e.currentTarget.style.borderColor='var(--color-outline-variant)')}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', border:'none', background:'transparent', cursor:'pointer', color:'var(--color-outline)', display:'flex', alignItems:'center' }}>
                    <span className="material-symbols-outlined" style={{fontSize:'20px'}}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Botón submit */}
              <button type="submit" disabled={isLoading}
                style={{ height:'52px', borderRadius:'12px', border:'none', cursor:'pointer', fontSize:'1rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'8px', transition:'all 0.2s',
                  backgroundColor: isLoading ? 'var(--color-primary-container)' : 'var(--color-primary)',
                  color: isLoading ? 'var(--color-primary)' : 'white' }}>
                {isLoading ? (
                  <><span className="material-symbols-outlined animate-spin" style={{fontSize:'20px'}}>progress_activity</span> Ingresando...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{fontSize:'20px'}}>login</span> Acceder</>
                )}
              </button>
            </form>

            {/* Registro */}
            <p style={{ marginTop:'28px', textAlign:'center', fontSize:'0.875rem', color:'var(--color-on-surface-variant)' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/registro" style={{ color:'var(--color-primary)', fontWeight:700, textDecoration:'none' }}>
                Regístrate gratis
              </Link>
            </p>

            {/* Volver */}
            <div style={{ marginTop:'16px', textAlign:'center' }}>
              <Link href="/" style={{ fontSize:'0.8rem', color:'var(--color-outline)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                <span className="material-symbols-outlined" style={{fontSize:'16px'}}>arrow_back</span>
                Volver al inicio
              </Link>
            </div>

            {/* Footer */}
            <div style={{ marginTop:'36px', paddingTop:'24px', borderTop:'1px solid var(--color-outline-variant)', display:'flex', justifyContent:'center', gap:'20px', flexWrap:'wrap' }}>
              {['Términos','Privacidad','Soporte'].map(l => (
                <a key={l} href="#" style={{ fontSize:'0.75rem', color:'var(--color-outline)', textDecoration:'none' }}>{l}</a>
              ))}
              <span style={{ fontSize:'0.75rem', color:'var(--color-outline)' }}>© 2025 AgroSmart</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
