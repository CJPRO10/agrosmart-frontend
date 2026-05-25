'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [hidratado, setHidratado] = useState(false)

  useEffect(() => { setHidratado(true) }, [])

  useEffect(() => {
    if (hidratado && isAuthenticated) router.push('/inicio')
  }, [hidratado, isAuthenticated, router])

  if (!hidratado) return null

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#0a1f0a', color:'white', fontFamily:'Arial, sans-serif', overflowX:'hidden' }}>

      {/* Navbar */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', backgroundColor:'rgba(10,31,10,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.08)', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          <span style={{ fontSize:'24px' }}>🌱</span>
          <span style={{ fontSize:'1.1rem', fontWeight:800, color:'#7EC850', letterSpacing:'-0.5px' }}>AgroSmart</span>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <Link href="/login" style={{ padding:'8px 16px', borderRadius:'8px', color:'rgba(255,255,255,0.85)', textDecoration:'none', fontSize:'0.85rem', fontWeight:500, border:'1px solid rgba(255,255,255,0.2)', whiteSpace:'nowrap' }}>
            Iniciar Sesión
          </Link>
          <Link href="/registro" style={{ padding:'8px 16px', borderRadius:'8px', backgroundColor:'#4CAF50', color:'white', textDecoration:'none', fontSize:'0.85rem', fontWeight:700, whiteSpace:'nowrap' }}>
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'120px 48px 80px', position:'relative', overflow:'hidden' }}>
        {/* Fondo decorativo */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'url("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80")', backgroundSize:'cover', backgroundPosition:'center', opacity:0.15 }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(10,31,10,0.98) 0%, rgba(10,31,10,0.7) 50%, rgba(10,31,10,0.5) 100%)' }} />

        <div style={{ position:'relative', zIndex:1, maxWidth:'700px' }}>
          <span style={{ display:'inline-block', padding:'6px 16px', borderRadius:'9999px', backgroundColor:'rgba(76,175,80,0.2)', border:'1px solid rgba(76,175,80,0.4)', color:'#7EC850', fontSize:'0.8rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'24px' }}>
            Innovación Rural en el Magdalena
          </span>
          <h1 style={{ fontSize:'clamp(2.5rem, 6vw, 4rem)', fontWeight:900, lineHeight:1.1, margin:'0 0 24px', letterSpacing:'-1px' }}>
            Impulsa tu campo<br/>
            <span style={{ color:'#7EC850' }}>con tecnología</span>
          </h1>
          <p style={{ fontSize:'1.15rem', color:'rgba(255,255,255,0.75)', lineHeight:1.7, margin:'0 0 40px', maxWidth:'540px' }}>
            AgroSmart conecta la tradición agrícola del Magdalena con herramientas digitales inteligentes. Gestiona tus cultivos, monitorea el clima y maximiza tu producción desde cualquier lugar.
          </p>
          <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
            <Link href="/registro" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 32px', borderRadius:'10px', backgroundColor:'#4CAF50', color:'white', textDecoration:'none', fontSize:'1rem', fontWeight:700, transition:'all 0.2s', boxShadow:'0 4px 24px rgba(76,175,80,0.3)' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='#388E3C'; (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='#4CAF50'; (e.currentTarget as HTMLElement).style.transform='translateY(0)'}}>
              Empezar Gratis →
            </Link>
            <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 32px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.25)', color:'rgba(255,255,255,0.85)', textDecoration:'none', fontSize:'1rem', fontWeight:500, transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='rgba(255,255,255,0.08)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='transparent'}}>
              Iniciar Sesión
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:'40px', marginTop:'60px', flexWrap:'wrap' }}>
            {[
              { valor:'1,200+', label:'Productores activos' },
              { valor:'85%',    label:'Reducción de pérdidas' },
              { valor:'10k',    label:'Hectáreas monitoreadas' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize:'1.75rem', fontWeight:800, color:'#7EC850', margin:'0 0 4px' }}>{s.valor}</p>
                <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.55)', margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:'100px 48px', backgroundColor:'#0d240d' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'64px' }}>
            <span style={{ color:'#7EC850', fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>Funcionalidades</span>
            <h2 style={{ fontSize:'clamp(2rem,4vw,2.75rem)', fontWeight:800, margin:'12px 0 16px', letterSpacing:'-0.5px' }}>
              Todo lo que necesitas<br/>en un solo lugar
            </h2>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'1rem', maxWidth:'500px', margin:'0 auto' }}>
              Diseñado para productores rurales con conectividad limitada. Funciona incluso sin internet.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'24px' }}>
            {[
              { icon:'🌾', titulo:'Gestión de Cultivos',    desc:'Registra siembras, monitorea estados y recibe alertas de plagas en tiempo real.' },
              { icon:'🌦️', titulo:'Monitor Climático',       desc:'Datos meteorológicos precisos para la región del Magdalena. Pronóstico de 7 días.' },
              { icon:'📋', titulo:'Gestión de Tareas',       desc:'Organiza las labores de tu equipo con asignaciones y seguimiento en tiempo real.' },
              { icon:'💡', titulo:'Recomendaciones IA',      desc:'Consejos personalizados impulsados por Gemini AI basados en tus cultivos y clima.' },
              { icon:'💰', titulo:'Control Financiero',      desc:'Registra ingresos y egresos, genera reportes y analiza tu rentabilidad.' },
              { icon:'📶', titulo:'Modo Offline',            desc:'Funciona sin conexión a internet. Tus datos se sincronizan cuando vuelve la red.' },
            ].map(f => (
              <div key={f.titulo} style={{ padding:'28px', borderRadius:'16px', backgroundColor:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', transition:'all 0.2s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='rgba(76,175,80,0.08)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(76,175,80,0.3)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'}}>
                <div style={{ fontSize:'2rem', marginBottom:'16px' }}>{f.icon}</div>
                <h3 style={{ fontSize:'1.1rem', fontWeight:700, margin:'0 0 10px', color:'white' }}>{f.titulo}</h3>
                <p style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.6)', margin:0, lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ padding:'100px 48px', backgroundColor:'#0a1f0a' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', textAlign:'center' }}>
          <span style={{ color:'#7EC850', fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>Proceso de modernización</span>
          <h2 style={{ fontSize:'clamp(2rem,4vw,2.75rem)', fontWeight:800, margin:'12px 0 16px' }}>
            Comienza en 3 simples pasos
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'32px', marginTop:'56px' }}>
            {[
              { num:'01', titulo:'Regístrate',        desc:'Crea tu perfil en minutos. Solo necesitas tus datos básicos y los de tu finca.' },
              { num:'02', titulo:'Agrega tu finca',   desc:'Geolocaliza tus predios y define el tipo de cultivo. Carga automática de datos climáticos.' },
              { num:'03', titulo:'Monitorea y actúa', desc:'Recibe alertas en tiempo real sobre plagas, riego y clima. Toma decisiones basadas en datos.' },
            ].map((p, i) => (
              <div key={p.num} style={{ position:'relative', padding:'32px 24px', borderRadius:'16px', backgroundColor:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
                {i < 2 && <div style={{ position:'absolute', top:'50%', right:'-16px', width:'32px', height:'2px', backgroundColor:'rgba(76,175,80,0.4)', display:'none' }} />}
                <div style={{ fontSize:'3rem', fontWeight:900, color:'rgba(76,175,80,0.3)', lineHeight:1, marginBottom:'16px' }}>{p.num}</div>
                <h3 style={{ fontSize:'1.1rem', fontWeight:700, margin:'0 0 10px' }}>{p.titulo}</h3>
                <p style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.6)', margin:0, lineHeight:1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding:'100px 48px', background:'linear-gradient(135deg, #1a3d1a 0%, #0d240d 100%)' }}>
        <div style={{ maxWidth:'700px', margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(2rem,4vw,2.75rem)', fontWeight:900, margin:'0 0 20px', letterSpacing:'-0.5px' }}>
            ¿Listo para transformar<br/>
            <span style={{ color:'#7EC850' }}>tu cultivo?</span>
          </h2>
          <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.65)', margin:'0 0 40px', lineHeight:1.7 }}>
            Únete a cientos de productores del Magdalena que ya están optimizando su producción con AgroSmart.
          </p>
          <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/registro" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'16px 40px', borderRadius:'10px', backgroundColor:'#4CAF50', color:'white', textDecoration:'none', fontSize:'1.05rem', fontWeight:700, boxShadow:'0 4px 24px rgba(76,175,80,0.4)', transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='#388E3C'; (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='#4CAF50'; (e.currentTarget as HTMLElement).style.transform='translateY(0)'}}>
              Empezar Ahora
            </Link>
            <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'16px 40px', borderRadius:'10px', border:'2px solid rgba(255,255,255,0.25)', color:'rgba(255,255,255,0.85)', textDecoration:'none', fontSize:'1.05rem', fontWeight:500, transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='rgba(255,255,255,0.08)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='transparent'}}>
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding:'40px 48px', backgroundColor:'#071407', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'20px' }}>🌱</span>
            <span style={{ fontWeight:800, color:'#7EC850' }}>AgroSmart</span>
            <span style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem', marginLeft:'8px' }}>© {new Date().getFullYear()} — Impulsando el campo colombiano</span>
          </div>
          <div style={{ display:'flex', gap:'24px' }}>
            {[
              { label:'Privacidad', href:'#' },
              { label:'Términos de Uso', href:'#' },
              { label:'Soporte', href:'#' },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{ color:'rgba(255,255,255,0.4)', textDecoration:'none', fontSize:'0.8rem', transition:'color 0.2s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#7EC850'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.4)'}}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
