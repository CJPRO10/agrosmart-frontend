'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useOfflineStatus } from '@/hooks/useOfflineStatus'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import type { Rol } from '@/types'

// Navegación por rol
const NAV_BY_ROL: Record<Rol, { label: string; icon: string; href: string; sep?: boolean }[]> = {
  PRODUCTOR: [
    { label: 'Inicio',            icon: 'dashboard',      href: '/inicio'           },
    { label: 'Mi Finca',          icon: 'home',           href: '/mi-finca'         },
    { label: 'Personal',          icon: 'group',          href: '/personal'         },
    { label: 'Mis Cultivos',      icon: 'potted_plant',   href: '/cultivos'         },
    { label: 'Mis Tareas',        icon: 'assignment',     href: '/tareas'           },
    { label: 'Problemas',         icon: 'bug_report',     href: '/anomalias',   sep: true },
    { label: 'Consejos',          icon: 'lightbulb',      href: '/recomendaciones'  },
    { label: 'El Clima',          icon: 'cloudy_snowing', href: '/clima'            },
    { label: 'Mis Finanzas',      icon: 'payments',       href: '/finanzas'         },
    { label: 'Reportes',          icon: 'bar_chart',      href: '/reportes',    sep: true },
  ],
  OPERARIO: [
    { label: 'Inicio',            icon: 'dashboard',      href: '/inicio'           },
    { label: 'Mis Cultivos',      icon: 'potted_plant',   href: '/cultivos'         },
    { label: 'Mis Tareas',        icon: 'assignment',     href: '/tareas'           },
    { label: 'Problemas',         icon: 'bug_report',     href: '/anomalias',   sep: true },
    { label: 'Consejos',          icon: 'lightbulb',      href: '/recomendaciones'  },
    { label: 'El Clima',          icon: 'cloudy_snowing', href: '/clima'            },
  ],
  AUXILIAR: [
    { label: 'Inicio',            icon: 'dashboard',      href: '/inicio'           },
    { label: 'Mis Cultivos',      icon: 'potted_plant',   href: '/cultivos'         },
    { label: 'Mis Tareas',        icon: 'assignment',     href: '/tareas'           },
    { label: 'Problemas',         icon: 'bug_report',     href: '/anomalias',   sep: true },
    { label: 'Consejos',          icon: 'lightbulb',      href: '/recomendaciones'  },
  ],
  ADMINISTRADOR: [
    { label: 'Inicio',            icon: 'dashboard',      href: '/inicio'           },
    { label: 'Usuarios',          icon: 'manage_accounts', href: '/usuarios'        },
  ],
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { sidebarOpen, notificacionesCount, toggleSidebar } = useUIStore()
  const isOnline = useOfflineStatus()
  useRoleGuard(pathname)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) return null

  const rol = user.rol as Rol
  const navItems = NAV_BY_ROL[rol] ?? NAV_BY_ROL['OPERARIO']

  const initials = (
    (user.nombreCompleto?.split(' ')[0]?.[0] ?? '') +
    (user.nombreCompleto?.split(' ')[1]?.[0] ?? '')
  ).toUpperCase()

  const sidebarW = sidebarOpen ? '256px' : '64px'

  const ROL_LABEL: Record<string, string> = {
    PRODUCTOR:    'Productor Agrícola',
    OPERARIO:     'Operario',
    AUXILIAR:     'Auxiliar',
    ADMINISTRADOR:'Administrador',
  }

  const ROL_COLOR: Record<string, string> = {
    PRODUCTOR:    'var(--color-primary)',
    OPERARIO:     'var(--color-secondary)',
    AUXILIAR:     'var(--color-tertiary)',
    ADMINISTRADOR:'var(--color-error)',
  }

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'var(--color-background)', display:'flex' }}>

      {/* Sidebar */}
      <aside style={{
        position:'fixed', left:0, top:0, height:'100%', zIndex:50,
        width: sidebarW, transition:'width 0.3s',
        display:'flex', flexDirection:'column', padding:'24px 16px',
        backgroundColor:'var(--color-surface-container-lowest)',
        borderRight:`1px solid var(--color-outline-variant)`,
        boxShadow:'2px 0 8px rgba(0,0,0,0.05)'
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px', overflow:'hidden' }}>
          <span className="material-symbols-outlined" style={{ color:'var(--color-primary)', fontSize:'28px', flexShrink:0 }}>potted_plant</span>
          {sidebarOpen && (
            <span style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--color-primary)', whiteSpace:'nowrap' }}>AgroMagdalena</span>
          )}
        </div>

        {/* Usuario */}
        {sidebarOpen && (
          <div style={{
            display:'flex', alignItems:'center', gap:'12px',
            padding:'0 8px 20px', marginBottom:'16px',
            borderBottom:`1px solid var(--color-outline-variant)`
          }}>
            <div style={{
              width:'40px', height:'40px', borderRadius:'9999px', flexShrink:0,
              backgroundColor:'var(--color-primary-fixed)',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <span style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--color-primary)' }}>{initials}</span>
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--color-on-surface)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.nombreCompleto}
              </p>
              <span style={{ fontSize:'0.65rem', fontWeight:700, color: ROL_COLOR[rol] ?? 'var(--color-primary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {ROL_LABEL[rol] ?? rol}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:'2px', overflowY:'auto' }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <div key={item.href}>
                {item.sep && <div style={{ height:'1px', backgroundColor:'var(--color-outline-variant)', margin:'8px 0' }} />}
                <Link href={item.href} style={{
                  display:'flex', alignItems:'center', gap:'12px',
                  padding: sidebarOpen ? '10px 16px' : '10px',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius:'8px', textDecoration:'none', fontSize:'0.875rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                  backgroundColor: active ? 'var(--color-surface-container)' : 'transparent',
                  borderRight: active ? `3px solid var(--color-primary)` : '3px solid transparent',
                  transition:'all 0.15s'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'22px', flexShrink:0 }}>{item.icon}</span>
                  {sidebarOpen && <span style={{ whiteSpace:'nowrap' }}>{item.label}</span>}
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ paddingTop:'16px', borderTop:`1px solid var(--color-outline-variant)`, display:'flex', flexDirection:'column', gap:'2px' }}>
          <Link href="/perfil" style={{
            display:'flex', alignItems:'center', gap:'12px',
            padding: sidebarOpen ? '10px 16px' : '10px',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            borderRadius:'8px', textDecoration:'none', fontSize:'0.875rem',
            color:'var(--color-on-surface-variant)', transition:'all 0.15s'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize:'22px', flexShrink:0 }}>account_circle</span>
            {sidebarOpen && <span>Mi Perfil</span>}
          </Link>
          <button onClick={logout} style={{
            display:'flex', alignItems:'center', gap:'12px',
            padding: sidebarOpen ? '10px 16px' : '10px',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'0.875rem',
            color:'var(--color-error)', backgroundColor:'transparent', width:'100%', transition:'all 0.15s'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize:'22px', flexShrink:0 }}>logout</span>
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Área principal */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', marginLeft:sidebarW, transition:'margin-left 0.3s' }}>

        {/* Topbar */}
        <header style={{
          position:'sticky', top:0, zIndex:40, height:'64px',
          display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px',
          backgroundColor:'rgba(249,250,242,0.92)', backdropFilter:'blur(8px)',
          borderBottom:`1px solid var(--color-outline-variant)`
        }}>
          <button onClick={toggleSidebar} style={{
            padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer',
            backgroundColor:'transparent', color:'var(--color-on-surface-variant)', display:'flex'
          }}>
            <span className="material-symbols-outlined">{sidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {!isOnline && (
              <div style={{
                display:'flex', alignItems:'center', gap:'4px',
                padding:'4px 12px', borderRadius:'9999px',
                backgroundColor:'var(--color-tertiary-fixed)', color:'var(--color-tertiary)',
                fontSize:'0.75rem', fontWeight:600
              }}>
                <span className="material-symbols-outlined" style={{fontSize:'16px'}}>wifi_off</span>
                Sin conexión
              </div>
            )}
            <Link href="/notificaciones" style={{
              position:'relative', padding:'8px', borderRadius:'8px',
              color:'var(--color-on-surface-variant)', display:'flex'
            }}>
              <span className="material-symbols-outlined">notifications</span>
              {notificacionesCount > 0 && (
                <span style={{
                  position:'absolute', top:'6px', right:'6px',
                  width:'16px', height:'16px', borderRadius:'9999px',
                  backgroundColor:'var(--color-error)', color:'var(--color-on-error)',
                  fontSize:'10px', fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  {notificacionesCount > 9 ? '9+' : notificacionesCount}
                </span>
              )}
            </Link>

            {/* Badge rol en topbar */}
            <span style={{
              padding:'4px 10px', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:700,
              backgroundColor:'var(--color-surface-container)',
              color: ROL_COLOR[rol] ?? 'var(--color-primary)',
              border:`1px solid ${ROL_COLOR[rol] ?? 'var(--color-primary)'}`,
              display: sidebarOpen ? 'none' : 'inline-flex'
            }}>
              {ROL_LABEL[rol]?.split(' ')[0] ?? rol}
            </span>

            <Link href="/perfil" style={{
              width:'36px', height:'36px', borderRadius:'9999px',
              backgroundColor:'var(--color-primary-fixed)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontSize:'0.875rem', color:'var(--color-primary)',
              textDecoration:'none'
            }}>
              {initials}
            </Link>
          </div>
        </header>

        {/* Contenido */}
        <main style={{ flex:1, padding:'24px' }}>
          {children}
        </main>
      </div>

      {/* Banner offline */}
      {!isOnline && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:50,
          backgroundColor:'var(--color-tertiary-fixed)', color:'var(--color-tertiary)',
          textAlign:'center', fontSize:'0.875rem', fontWeight:600, padding:'8px 16px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize:'16px', verticalAlign:'middle', marginRight:'4px' }}>wifi_off</span>
          Sin conexión — los cambios se sincronizarán cuando vuelva la red
        </div>
      )}
    </div>
  )
}
