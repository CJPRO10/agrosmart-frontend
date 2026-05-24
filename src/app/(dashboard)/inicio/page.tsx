'use client'

import { useAuthStore } from '@/store/authStore'

export default function InicioPage() {
  const { user } = useAuthStore()

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = user?.nombreCompleto?.split(' ')[0] ?? ''

  const cards = [
    { label: 'Mis Cultivos',    value: '--', icon: 'potted_plant', color: 'var(--color-primary)'   },
    { label: 'Tareas',          value: '--', icon: 'assignment',   color: 'var(--color-secondary)' },
    { label: 'Problemas',       value: '--', icon: 'bug_report',   color: 'var(--color-error)'     },
    { label: 'Recomendaciones', value: '--', icon: 'lightbulb',    color: 'var(--color-tertiary)'  },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div>
        <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:0 }}>
          {saludo}, {nombre}
        </p>
        <h1 style={{ fontSize:'2rem', fontWeight:700, color:'var(--color-primary)', margin:'4px 0 0' }}>
          Resumen de hoy
        </h1>
        <p style={{ fontSize:'0.75rem', color:'var(--color-outline)', marginTop:'4px' }}>
          {new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* Cards resumen */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem' }}>
        {cards.map(card => (
          <div key={card.label} className="card" style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'28px', color:card.color }}>
                {card.icon}
              </span>
              <span style={{ fontSize:'1.75rem', fontWeight:700, color:card.color }}>{card.value}</span>
            </div>
            <p style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-on-surface)', margin:0 }}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Bienvenida */}
      <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize:'56px', color:'var(--color-primary-fixed)', marginBottom:'16px' }}>
          agriculture
        </span>
        <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--color-on-surface)', marginBottom:'8px' }}>
          ¡Bienvenido a AgroMagdalena!
        </h2>
        <p style={{ fontSize:'1rem', color:'var(--color-on-surface-variant)', maxWidth:'420px' }}>
          Tu panel está listo. Conecta el backend para ver tus cultivos, tareas y reportes en tiempo real.
        </p>
      </div>
    </div>
  )
}
