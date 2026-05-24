'use client'

import { useState, useEffect, useCallback } from 'react'
import { usuariosApi } from '@/lib/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import type { UsuarioResponse, UsuarioRequest, UsuarioUpdateRequest } from '@/lib/api/usuarios'

const ROL_CONFIG: Record<string, { color: string; bg: string }> = {
  PRODUCTOR:    { color:'var(--color-primary)',   bg:'var(--color-primary-fixed)'   },
  OPERARIO:     { color:'var(--color-secondary)', bg:'var(--color-secondary-fixed)' },
  AUXILIAR:     { color:'var(--color-tertiary)',  bg:'var(--color-tertiary-fixed)'  },
  ADMINISTRADOR:{ color:'var(--color-error)',     bg:'var(--color-error-container)' },
}

const ROLES_ADMIN    = ['PRODUCTOR','OPERARIO','AUXILIAR','ADMINISTRADOR']
const ROLES_PRODUCTOR = ['OPERARIO','AUXILIAR']

const FORM_CREAR_INICIAL: UsuarioRequest = {
  nombre:'', apellido:'', correo:'', contrasena:'',
  telefono:'', fechaNacimiento:'', rol:'OPERARIO',
}

export default function UsuariosPage() {
  const { user } = useAuthStore()
  const esAdmin = user?.rol === 'ADMINISTRADOR'

  const [usuarios, setUsuarios]         = useState<UsuarioResponse[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [busqueda, setBusqueda]         = useState('')
  const [filtroBusqueda, setFiltroBusqueda] = useState<'nombre'|'correo'|'rol'>('nombre')
  const [filtroRol, setFiltroRol]       = useState('')
  const [filtroActivo, setFiltroActivo] = useState<'todos'|'activos'|'inactivos'>('todos')

  const [modalCrear, setModalCrear]     = useState(false)
  const [modalEditar, setModalEditar]   = useState<UsuarioResponse | null>(null)
  const [confirmEliminar, setConfirmEliminar] = useState<UsuarioResponse | null>(null)
  const [saving, setSaving]             = useState(false)

  const [formCrear, setFormCrear]       = useState<UsuarioRequest>(FORM_CREAR_INICIAL)
  const [formEditar, setFormEditar]     = useState<UsuarioUpdateRequest>({})

  const rolesDisponibles = esAdmin ? ROLES_ADMIN : ROLES_PRODUCTOR

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await usuariosApi.listar()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Búsqueda con debounce
  useEffect(() => {
    if (!busqueda.trim()) { cargar(); return }
    const timer = setTimeout(async () => {
      try {
        let data: UsuarioResponse[] = []
        if (filtroBusqueda === 'nombre') data = await usuariosApi.buscarPorNombre(busqueda)
        else if (filtroBusqueda === 'correo') data = await usuariosApi.buscarPorCorreo(busqueda)
        else if (filtroBusqueda === 'rol') data = await usuariosApi.buscarPorRol(busqueda)
        setUsuarios(Array.isArray(data) ? data : [])
      } catch { /* sin resultados */ }
    }, 400)
    return () => clearTimeout(timer)
  }, [busqueda, filtroBusqueda, cargar])

  const usuariosFiltrados = usuarios.filter(u => {
    const matchRol    = !filtroRol || u.rol === filtroRol
    const matchActivo = filtroActivo === 'todos' ||
      (filtroActivo === 'activos' && u.activo) ||
      (filtroActivo === 'inactivos' && !u.activo)
    return matchRol && matchActivo
  })

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usuariosApi.crear({
        ...formCrear,
        fechaNacimiento: new Date(formCrear.fechaNacimiento).toISOString(),
      })
      setModalCrear(false)
      setFormCrear(FORM_CREAR_INICIAL)
      await cargar()
    } catch {
      setError('Error al crear el usuario. Verifica que el correo no esté en uso.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalEditar) return
    setSaving(true)
    try {
      await usuariosApi.actualizar(modalEditar.idUsuario, formEditar)
      setModalEditar(null)
      await cargar()
    } catch {
      setError('Error al actualizar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (u: UsuarioResponse) => {
    try {
      await usuariosApi.eliminar(u.idUsuario)
      setConfirmEliminar(null)
      await cargar()
    } catch {
      setError('Error al eliminar el usuario.')
    }
  }

  const handleDesactivar = async (u: UsuarioResponse) => {
    try {
      await usuariosApi.desactivar(u.idUsuario)
      await cargar()
    } catch {
      setError('Error al desactivar el usuario.')
    }
  }

  const abrirEditar = (u: UsuarioResponse) => {
    setFormEditar({ nombre:u.nombre, apellido:u.apellido, correo:u.correo, telefono:u.telefono, rol:u.rol })
    setModalEditar(u)
  }

  const stats = [
    { label:'Total',        value: usuarios.length,                              color:'var(--color-primary)'   },
    { label:'Activos',      value: usuarios.filter(u=>u.activo).length,          color:'var(--color-secondary)' },
    { label:'Productores',  value: usuarios.filter(u=>u.rol==='PRODUCTOR').length, color:'var(--color-primary)'  },
    { label:'Operarios',    value: usuarios.filter(u=>u.rol==='OPERARIO').length,  color:'var(--color-secondary)'},
    { label:'Auxiliares',   value: usuarios.filter(u=>u.rol==='AUXILIAR').length,  color:'var(--color-tertiary)' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }} className="animate-fade-in">

      {/* Encabezado */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>
            {esAdmin ? 'Administrar Usuarios' : 'Mi Personal'}
          </h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
            {esAdmin ? 'Gestión completa de usuarios del sistema' : 'Operarios y auxiliares de tu finca'}
          </p>
        </div>
        <button onClick={() => { setFormCrear(FORM_CREAR_INICIAL); setModalCrear(true) }} className="btn-primary">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>person_add</span>
          {esAdmin ? 'Nuevo Usuario' : 'Agregar Personal'}
        </button>
      </div>

      {/* Stats — solo admin */}
      {esAdmin && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px,1fr))', gap:'12px' }}>
          {stats.map(s => (
            <div key={s.label} className="card" style={{ padding:'12px', textAlign:'center' }}>
              <p style={{ fontSize:'1.5rem', fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Búsqueda y filtros */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
        <div style={{ display:'flex', flex:1, minWidth:'250px', gap:'0' }}>
          <select value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value as 'nombre'|'correo'|'rol')}
            style={{ padding:'0 12px', borderRadius:'8px 0 0 8px', border:'1.5px solid var(--color-outline-variant)', borderRight:'none', fontSize:'0.875rem', color:'var(--color-on-surface-variant)', backgroundColor:'var(--color-surface-container-low)', cursor:'pointer', outline:'none' }}>
            <option value="nombre">Nombre</option>
            <option value="correo">Correo</option>
            <option value="rol">Rol</option>
          </select>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder={`Buscar por ${filtroBusqueda}...`} className="input-field"
            style={{ borderRadius:'0 8px 8px 0', flex:1 }} />
        </div>

        {/* Filtro rol */}
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
          className="input-field" style={{ minHeight:'48px', width:'auto', minWidth:'140px' }}>
          <option value="">Todos los roles</option>
          {ROLES_ADMIN.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Filtro activo */}
        {(['todos','activos','inactivos'] as const).map(f => (
          <button key={f} onClick={() => setFiltroActivo(f)}
            style={{ padding:'8px 14px', borderRadius:'9999px', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:500,
              backgroundColor: filtroActivo === f ? 'var(--color-primary)' : 'var(--color-surface-container)',
              color: filtroActivo === f ? 'white' : 'var(--color-on-surface-variant)' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
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

      {/* Tabla de usuarios */}
      {!loading && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-outline-variant)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'var(--color-on-surface)' }}>
              {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
            </h3>
            <button onClick={cargar} style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{fontSize:'20px'}}>refresh</span>
            </button>
          </div>

          {usuariosFiltrados.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px', textAlign:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'48px', color:'var(--color-primary-fixed)', marginBottom:'12px' }}>manage_accounts</span>
              <p style={{ color:'var(--color-on-surface-variant)', margin:0 }}>No hay usuarios con ese criterio de búsqueda.</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor:'var(--color-surface-container-low)' }}>
                    {['Usuario','Correo','Teléfono','Rol','Estado', esAdmin ? 'Acciones' : ''].filter(Boolean).map(col => (
                      <th key={col} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.75rem', fontWeight:700, color:'var(--color-on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map(u => {
                    const cfg = ROL_CONFIG[u.rol] ?? ROL_CONFIG['OPERARIO']
                    const initials = `${u.nombre?.[0]??''}${u.apellido?.[0]??''}`.toUpperCase()
                    return (
                      <tr key={u.idUsuario} style={{ borderBottom:'1px solid var(--color-outline-variant)', opacity: u.activo ? 1 : 0.6 }}>
                        {/* Usuario */}
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'36px', height:'36px', borderRadius:'9999px', flexShrink:0, backgroundColor:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:'0.8rem', fontWeight:700, color:cfg.color }}>{initials}</span>
                            </div>
                            <div>
                              <p style={{ fontWeight:600, color:'var(--color-on-surface)', margin:0 }}>{u.nombre} {u.apellido}</p>
                              <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>ID: {u.idUsuario}</p>
                            </div>
                          </div>
                        </td>
                        {/* Correo */}
                        <td style={{ padding:'12px 16px', color:'var(--color-on-surface-variant)' }}>{u.correo}</td>
                        {/* Teléfono */}
                        <td style={{ padding:'12px 16px', color:'var(--color-on-surface-variant)' }}>{u.telefono ?? '—'}</td>
                        {/* Rol */}
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:'9999px', fontSize:'11px', fontWeight:700, backgroundColor:cfg.bg, color:cfg.color }}>
                            {u.rol}
                          </span>
                        </td>
                        {/* Estado */}
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:'9999px', fontSize:'11px', fontWeight:600,
                            backgroundColor: u.activo ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-high)',
                            color: u.activo ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        {/* Acciones */}
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', gap:'4px' }}>
                            {/* Editar — solo ADMIN */}
                            {esAdmin && (
                              <button onClick={() => abrirEditar(u)}
                                title="Editar"
                                style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-secondary)' }}
                                onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-secondary-fixed)')}
                                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                                <span className="material-symbols-outlined" style={{fontSize:'20px'}}>edit</span>
                              </button>
                            )}
                            {/* Desactivar/activar */}
                            {u.activo && (
                              <button onClick={() => handleDesactivar(u)}
                                title="Desactivar"
                                style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-tertiary)' }}
                                onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-tertiary-fixed)')}
                                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                                <span className="material-symbols-outlined" style={{fontSize:'20px'}}>person_off</span>
                              </button>
                            )}
                            {/* Eliminar — solo ADMIN */}
                            {esAdmin && (
                              <button onClick={() => setConfirmEliminar(u)}
                                title="Eliminar"
                                style={{ padding:'6px', borderRadius:'8px', border:'none', cursor:'pointer', backgroundColor:'transparent', color:'var(--color-error)' }}
                                onMouseEnter={e=>(e.currentTarget.style.backgroundColor='var(--color-error-container)')}
                                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                                <span className="material-symbols-outlined" style={{fontSize:'20px'}}>delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal CREAR */}
      {modalCrear && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>
                {esAdmin ? 'Nuevo Usuario' : 'Agregar Personal'}
              </h2>
              <button onClick={() => setModalCrear(false)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCrear} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {/* Rol */}
              <div>
                <label className="input-label">Rol *</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {rolesDisponibles.map(r => {
                    const cfg = ROL_CONFIG[r] ?? ROL_CONFIG['OPERARIO']
                    return (
                      <button key={r} type="button" onClick={() => setFormCrear(p=>({...p,rol:r}))}
                        style={{ flex:1, minWidth:'80px', padding:'10px', borderRadius:'8px',
                          border:`2px solid ${formCrear.rol === r ? cfg.color : 'var(--color-outline-variant)'}`,
                          cursor:'pointer', fontSize:'0.8rem', fontWeight:600,
                          backgroundColor: formCrear.rol === r ? cfg.bg : 'transparent',
                          color: formCrear.rol === r ? cfg.color : 'var(--color-on-surface-variant)' }}>
                        {r}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Nombre *</label>
                  <input type="text" value={formCrear.nombre} onChange={e=>setFormCrear(p=>({...p,nombre:e.target.value}))} placeholder="Juan" className="input-field" required />
                </div>
                <div>
                  <label className="input-label">Apellido *</label>
                  <input type="text" value={formCrear.apellido} onChange={e=>setFormCrear(p=>({...p,apellido:e.target.value}))} placeholder="Pérez" className="input-field" required />
                </div>
              </div>
              <div>
                <label className="input-label">Correo electrónico *</label>
                <input type="email" value={formCrear.correo} onChange={e=>setFormCrear(p=>({...p,correo:e.target.value}))} placeholder="usuario@agro.co" className="input-field" required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Teléfono *</label>
                  <input type="tel" value={formCrear.telefono} onChange={e=>setFormCrear(p=>({...p,telefono:e.target.value}))} placeholder="+57 300..." className="input-field" required />
                </div>
                <div>
                  <label className="input-label">Fecha de nacimiento *</label>
                  <input type="date" value={formCrear.fechaNacimiento} onChange={e=>setFormCrear(p=>({...p,fechaNacimiento:e.target.value}))} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="input-label">Contraseña temporal *</label>
                <input type="password" value={formCrear.contrasena} onChange={e=>setFormCrear(p=>({...p,contrasena:e.target.value}))} placeholder="Mín. 6 caracteres" className="input-field" required minLength={6} />
              </div>
              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={() => setModalCrear(false)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Creando...</> : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>person_add</span> Crear</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal EDITAR — solo ADMIN */}
      {modalEditar && esAdmin && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'480px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:0 }}>Editar Usuario</h2>
              <button onClick={() => setModalEditar(null)} style={{ padding:'4px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label className="input-label">Nombre</label>
                  <input type="text" value={formEditar.nombre??''} onChange={e=>setFormEditar(p=>({...p,nombre:e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Apellido</label>
                  <input type="text" value={formEditar.apellido??''} onChange={e=>setFormEditar(p=>({...p,apellido:e.target.value}))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="input-label">Correo</label>
                <input type="email" value={formEditar.correo??''} onChange={e=>setFormEditar(p=>({...p,correo:e.target.value}))} className="input-field" />
              </div>
              <div>
                <label className="input-label">Teléfono</label>
                <input type="tel" value={formEditar.telefono??''} onChange={e=>setFormEditar(p=>({...p,telefono:e.target.value}))} className="input-field" />
              </div>
              <div>
                <label className="input-label">Rol</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {ROLES_ADMIN.map(r => {
                    const cfg = ROL_CONFIG[r] ?? ROL_CONFIG['OPERARIO']
                    return (
                      <button key={r} type="button" onClick={() => setFormEditar(p=>({...p,rol:r}))}
                        style={{ flex:1, minWidth:'80px', padding:'8px', borderRadius:'8px',
                          border:`2px solid ${formEditar.rol === r ? cfg.color : 'var(--color-outline-variant)'}`,
                          cursor:'pointer', fontSize:'0.75rem', fontWeight:600,
                          backgroundColor: formEditar.rol === r ? cfg.bg : 'transparent',
                          color: formEditar.rol === r ? cfg.color : 'var(--color-on-surface-variant)' }}>
                        {r}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="input-label">Nueva contraseña (opcional)</label>
                <input type="password" value={formEditar.contrasena??''} onChange={e=>setFormEditar(p=>({...p,contrasena:e.target.value}))} placeholder="Dejar vacío para no cambiar" className="input-field" />
              </div>
              <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                <button type="button" onClick={() => setModalEditar(null)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                  {saving ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</> : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>save</span> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar — solo ADMIN */}
      {confirmEliminar && esAdmin && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'380px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'9999px', margin:'0 auto 16px', backgroundColor:'var(--color-error-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'28px', color:'var(--color-error)' }}>delete_forever</span>
            </div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'8px' }}>¿Eliminar usuario?</h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>
              Se eliminará permanentemente la cuenta de <strong>{confirmEliminar.nombre} {confirmEliminar.apellido}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setConfirmEliminar(null)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
              <button onClick={() => handleEliminar(confirmEliminar)} className="btn-danger" style={{flex:1}}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
