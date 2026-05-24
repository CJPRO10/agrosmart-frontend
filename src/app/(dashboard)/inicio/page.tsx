'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

export default function InicioPage() {
  const { user } = useAuthStore()

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = user?.nombreCompleto?.split(' ')[0] ?? ''
  const rol = user?.rol ?? ''

  // Accesos rápidos según rol
  const accesosRapidos: Record<string, { label: string; icon: string; href: string; color: string }[]> = {
    PRODUCTOR: [
      { label:'Mis Cultivos',   icon:'potted_plant',   href:'/cultivos',         color:'var(--color-primary)'   },
      { label:'Mis Tareas',     icon:'assignment',     href:'/tareas',           color:'var(--color-secondary)' },
      { label:'Problemas',      icon:'bug_report',     href:'/anomalias',        color:'var(--color-error)'     },
      { label:'Consejos',       icon:'lightbulb',      href:'/recomendaciones',  color:'var(--color-tertiary)'  },
      { label:'El Clima',       icon:'cloudy_snowing', href:'/clima',            color:'var(--color-secondary)' },
      { label:'Mis Finanzas',   icon:'payments',       href:'/finanzas',         color:'var(--color-primary)'   },
    ],
    OPERARIO: [
      { label:'Mis Cultivos',   icon:'potted_plant',   href:'/cultivos',         color:'var(--color-primary)'   },
      { label:'Mis Tareas',     icon:'assignment',     href:'/tareas',           color:'var(--color-secondary)' },
      { label:'Problemas',      icon:'bug_report',     href:'/anomalias',        color:'var(--color-error)'     },
      { label:'El Clima',       icon:'cloudy_snowing', href:'/clima',            color:'var(--color-secondary)' },
    ],
    AUXILIAR: [
      { label:'Mis Cultivos',   icon:'potted_plant',   href:'/cultivos',         color:'var(--color-primary)'   },
      { label:'Mis Tareas',     icon:'assignment',     href:'/tareas',           color:'var(--color-secondary)' },
      { label:'Problemas',      icon:'bug_report',     href:'/anomalias',        color:'var(--color-error)'     },
      { label:'Consejos',       icon:'lightbulb',      href:'/recomendaciones',  color:'var(--color-tertiary)'  },
    ],
    ADMINISTRADOR: [
      { label:'Usuarios',       icon:'manage_accounts', href:'/usuarios',        color:'var(--color-primary)'   },
    ],
  }

  const accesos = accesosRapidos[rol] ?? accesosRapidos['OPERARIO']

  const ROL_MSG: Record<string, string> = {
    PRODUCTOR:    'Aquí tienes el resumen de tu producción.',
    OPERARIO:     'Revisa tus tareas asignadas y reporta novedades.',
    AUXILIAR:     'Consulta los cultivos y recomendaciones disponibles.',
    ADMINISTRADOR:'Panel de administración del sistema.',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div className="card" style={{
        background:'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
        color:'white', padding:'28px'
      }}>
        <p style={{ fontSize:'0.875rem', opacity:0.8, margin:'0 0 4px' }}>{saludo},</p>
        <h1 style={{ fontSize:'1.75rem', fontWeight:700, margin:'0 0 8px' }}>{nombre}</h1>
        <p style={{ fontSize:'0.9rem', opacity:0.85, margin:0 }}>{ROL_MSG[rol]}</p>
        <p style={{ fontSize:'0.75rem', opacity:0.7, margin:'8px 0 0' }}>
          {new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 style={{ fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)', margin:'0 0 12px' }}>Accesos rápidos</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'12px' }}>
          {accesos.map(acc => (
            <Link key={acc.href} href={acc.href} style={{ textDecoration:'none' }}>
              <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'var(--color-surface-container)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'26px', color:acc.color }}>{acc.icon}</span>
                </div>
                <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-on-surface)' }}>{acc.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mensaje según rol */}
      {rol === 'PRODUCTOR' && (
        <div className="card" style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'32px', color:'var(--color-primary-fixed)', flexShrink:0 }}>tips_and_updates</span>
          <div>
            <p style={{ fontWeight:600, color:'var(--color-on-surface)', margin:'0 0 4px' }}>Tip del productor</p>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:0 }}>
              Registra tus cultivos y asigna tareas a tu equipo para llevar un control completo de tu producción.
            </p>
          </div>
        </div>
      )}

      {rol === 'OPERARIO' && (
        <div className="card" style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'32px', color:'var(--color-secondary-fixed)', flexShrink:0 }}>assignment_turned_in</span>
          <div>
            <p style={{ fontWeight:600, color:'var(--color-on-surface)', margin:'0 0 4px' }}>Recuerda</p>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:0 }}>
              Actualiza el estado de tus tareas y reporta cualquier anomalía que detectes en los cultivos.
            </p>
          </div>
        </div>
      )}

      {rol === 'AUXILIAR' && (
        <div className="card" style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'32px', color:'var(--color-tertiary-fixed)', flexShrink:0 }}>support_agent</span>
          <div>
            <p style={{ fontWeight:600, color:'var(--color-on-surface)', margin:'0 0 4px' }}>Tu rol</p>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:0 }}>
              Apoya al equipo consultando los cultivos y recomendaciones disponibles para tu finca.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
