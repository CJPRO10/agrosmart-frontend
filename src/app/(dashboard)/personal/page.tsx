'use client'

import { useState, useEffect } from 'react'
import { usuariosApi } from '@/lib/api/usuarios'
import type { UsuarioResponse, UsuarioRequest } from '@/lib/api/usuarios'

const ROL_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  OPERARIO: { color:'var(--color-secondary)',  bg:'var(--color-secondary-fixed)',  label:'Operario'  },
  AUXILIAR: { color:'var(--color-tertiary)',   bg:'var(--color-tertiary-fixed)',   label:'Auxiliar'  },
}

const FORM_INICIAL: UsuarioRequest = {
  nombre: '', apellido: '', correo: '', contrasena: '',
  telefono: '', fechaNacimiento: '', rol: 'OPERARIO',
}

export default function PersonalPage() {
  const [personal, setPersonal]   = useState<UsuarioResponse[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [filtroRol, setFiltroRol] = useState<'TODOS' | 'OPERARIO' | 'AUXILIAR'>('TODOS')
  const [busqueda, setBusqueda]   = useState('')
  const [form, setForm]           = useState<UsuarioRequest>(FORM_INICIAL)
  const [confirmDesactivar, setConfirmDesactivar] = useState<UsuarioResponse | null>(null)

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      try {
        const data = await usuariosApi.listar()
        if (!cancelado) {
          const filtrado = Array.isArray(data)
            ? data.filter(u => u.rol === 'OPERARIO' || u.rol === 'AUXILIAR')
            : []
          setPersonal(filtrado)
        }
      } catch {
        if (!cancelado) setError('No se pudo cargar el personal.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const recargar = async () => {
    try {
      const data = await usuariosApi.listar()
      setPersonal(Array.isArray(data) ? data.filter(u => u.rol === 'OPERARIO' || u.rol === 'AUXILIAR') : [])
    } catch { setError('Error al recargar.') }
  }

  const filtrado = personal.filter(p => {
    const matchRol      = filtroRol === 'TODOS' || p.rol === filtroRol
    const matchBusqueda = !busqueda ||
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.correo.toLowerCase().includes(busqueda.toLowerCase())
    return matchRol && matchBusqueda
  })

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.apellido || !form.correo || !form.contrasena || !form.fechaNacimiento) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    setSaving(true)
    try {
      await usuariosApi.crear({
        ...form,
        fechaNacimiento: new Date(form.fechaNacimiento).toISOString(),
      })
      setModalOpen(false)
      setForm(FORM_INICIAL)
      await recargar()
    } catch {
      setError('Error al registrar el personal. Verifica que el correo no esté en uso.')
    } finally {
      setSaving(false)
    }
  }

  const handleDesactivar = async (u: UsuarioResponse) => {
    try {
      await usuariosApi.desactivar(u.idUsuario)
      setConfirmDesactivar(null)
      await recargar()
    } catch {
      setError('Error al desactivar el usuario.')
    }
  }

  const operarios = personal.filter(p => p.rol === 'OPERARIO' && p.activo).length
  const auxiliares = personal.filter(p => p.rol === 'AUXILIAR' && p.activo).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Personal de mi Finca</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            Gestiona operarios y auxiliares asociados a tu producción
          </p>
        </div>
        <button onClick={() => { setForm(FORM_INICIAL); setModalOpen(true) }} className="btn-primary">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>person_add</span>
          Agregar Personal
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:'12px' }}>
        {[
          { label:'Total activos', value: operarios + auxiliares, icon:'group',            color:'var(--color-primary)'   },
          { label:'Operarios',     value: operarios,              icon:'engineering',       color:'var(--color-secondary)' },
          { label:'Auxiliares',    value: auxiliares,             icon:'support_agent',     color:'var(--color-tertiary)'  },
        ].map(s => (
          <div key={s.label} className="card" style={{ display:'flex', alignItems:'center', gap:'12px', padding:'16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'24px', color:s.color }}>{s.icon}</span>
            <div>
              <p style={{ fontSize:'1.5rem', fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <span className="material-symbols-outlined" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', color:'var(--color-outline)' }}>search</span>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo..." className="input-field" style={{ paddingLeft:'40px', minHeight:'40px' }} />
        </div>
        {(['TODOS','OPERARIO','AUXILIAR'] as const).map(r => (
          <button key={r} onClick={() => setFiltroRol(r)}
            style={{ padding:'8px 16px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:500,
              backgroundColor: filtroRol === r ? 'var(--color-primary)' : 'var(--color-surface-container)',
              color: filtroRol === r ? 'white' : 'var(--color-on-surface-variant)' }}>
            {r === 'TODOS' ? 'Todos' : r}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem' }}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
          <span style={{flex:1}}>{error}</span>
          <button onClick={() => setError(null)}><span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span></button>
        </div>
      )}

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>progress_activity</span></div>}

      {!loading && filtrado.length === 0 && !error && (
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'56px', color:'var(--color-primary-fixed)', marginBottom:'16px' }}>group</span>
          <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--color-on-surface)', marginBottom:'8px' }}>
            {busqueda || filtroRol !== 'TODOS' ? 'Sin resultados' : 'No hay personal registrado'}
          </h2>
          {!busqueda && filtroRol === 'TODOS' && (
            <button onClick={() => { setForm(FORM_INICIAL); setModalOpen(true) }} className="btn-primary" style={{ marginTop:'16px' }}>
              <span className="material-symbols-outlined" style={{fontSize:'20px'}}>person_add</span> Agregar primer miembro
            </button>
          )}
        </div>
      )}

      {/* Grid personal */}
      {!loading && filtrado.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1rem' }}>
          {filtrado.map(p => {
            const cfg = ROL_CONFIG[p.rol] ?? ROL_CONFIG['OPERARIO']
            const initials = `${p.nombre?.[0] ?? ''}${p.apellido?.[0] ?? ''}`.toUpperCase()
            return (
              <div key={p.idUsuario} className="card" style={{ display:'flex', flexDirection:'column', gap:'12px', opacity: p.activo ? 1 : 0.6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'9999px', flexShrink:0, backgroundColor:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:'1.1rem', fontWeight:700, color:cfg.color }}>{initials}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <h3 style={{ fontWeight:600, color:'var(--color-on-surface)', margin:0, fontSize:'0.9375rem' }}>
                        {p.nombre} {p.apellido}
                      </h3>
                      {!p.activo && <span style={{ fontSize:'11px', padding:'1px 6px', borderRadius:'9999px', backgroundColor:'var(--color-error-container)', color:'var(--color-error)', fontWeight:600 }}>Inactivo</span>}
                    </div>
                    <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{p.correo}</p>
                  </div>
                  <span style={{ padding:'3px 10px', borderRadius:'9999px', fontSize:'11px', fontWeight:700, backgroundColor:cfg.bg, color:cfg.color, flexShrink:0 }}>
                    {cfg.label}
                  </span>
                </div>

                {p.telefono && (
                  <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:'4px', margin:0 }}>
                    <span className="material-symbols-outlined" style={{fontSize:'14px'}}>call</span>{p.telefono}
                  </p>
                )}

                {p.activo && (
                  <div style={{ paddingTop:'8px', borderTop:'1px solid var(--color-outline-variant)' }}>
                    <button onClick={() => setConfirmDesactivar(p)}
                      style={{ width:'100%', padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:500,
                        color:'var(--color-error)', backgroundColor:'transparent', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}
                      onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-error-container)')}
                      onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                      <span className="material-symbols-outlined" style={{fontSize:'18px'}}>person_off</span> Desactivar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal agregar personal */}
      {modalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Agregar Personal</h2>
              <button onClick={() => setModalOpen(false)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Rol */}
              <div>
                <label className="input-label">Rol *</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {(['OPERARIO','AUXILIAR'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setForm(p => ({...p, rol:r}))}
                      style={{ flex:1, padding:'10px', borderRadius:'8px',
                        border:`2px solid ${form.rol === r ? ROL_CONFIG[r].color : 'var(--color-outline-variant)'}`,
                        cursor:'pointer', fontSize:'0.875rem', fontWeight:600,
                        backgroundColor: form.rol === r ? ROL_CONFIG[r].bg : 'transparent',
                        color: form.rol === r ? ROL_CONFIG[r].color : 'var(--color-on-surface-variant)' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Nombre *</label>
                  <input type="text" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Juan" className="input-field" required />
                </div>
                <div>
                  <label className="input-label">Apellido *</label>
                  <input type="text" value={form.apellido} onChange={e=>setForm(p=>({...p,apellido:e.target.value}))} placeholder="Ej: Pérez" className="input-field" required />
                </div>
              </div>

              <div>
                <label className="input-label">Correo electrónico *</label>
                <input type="email" value={form.correo} onChange={e=>setForm(p=>({...p,correo:e.target.value}))} placeholder="operario@agro.co" className="input-field" required />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Teléfono</label>
                  <input type="tel" value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} placeholder="+57 300..." className="input-field" />
                </div>
                <div>
                  <label className="input-label">Fecha de nacimiento *</label>
                  <input type="date" value={form.fechaNacimiento} onChange={e=>setForm(p=>({...p,fechaNacimiento:e.target.value}))} className="input-field" required />
                </div>
              </div>

              <div>
                <label className="input-label">Contraseña temporal *</label>
                <input type="password" value={form.contrasena} onChange={e=>setForm(p=>({...p,contrasena:e.target.value}))} placeholder="Mín. 6 caracteres" className="input-field" required minLength={6} />
              </div>

              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</> : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>person_add</span> Agregar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm desactivar */}
      {confirmDesactivar && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'360px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'9999px', margin:'0 auto 16px', backgroundColor:'var(--color-error-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-error)' }}>person_off</span>
            </div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'8px' }}>¿Desactivar usuario?</h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>
              <strong>{confirmDesactivar.nombre} {confirmDesactivar.apellido}</strong> no podrá iniciar sesión ni ser asignado a tareas.
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setConfirmDesactivar(null)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
              <button onClick={() => handleDesactivar(confirmDesactivar)} className="btn-danger" style={{flex:1}}>Sí, desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
