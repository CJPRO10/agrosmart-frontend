'use client'

import { useState, useEffect } from 'react'
import { perfilApi } from '@/lib/api/perfil'
import { useAuthStore } from '@/store/authStore'
import type { UsuarioResponse, EditarPerfilRequest } from '@/lib/api/perfil'

const ROL_LABELS: Record<string, string> = {
  PRODUCTOR:    'Productor Agrícola',
  ADMINISTRADOR:'Administrador',
  OPERARIO:     'Operario',
  AUXILIAR:     'Auxiliar',
}

export default function PerfilPage() {
  const { user, logout } = useAuthStore()
  const [perfil, setPerfil]       = useState<UsuarioResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [editando, setEditando]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [form, setForm] = useState<EditarPerfilRequest & { contrasenaConfirm?: string }>({
    nombre:'', apellido:'', correo:'', telefono:'', contrasena:'', contrasenaConfirm:''
  })

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setLoading(true)
      try {
        const p = await perfilApi.ver()
        if (!cancelado) {
          setPerfil(p)
          setForm({ nombre:p.nombre, apellido:p.apellido, correo:p.correo, telefono:p.telefono, contrasena:'', contrasenaConfirm:'' })
        }
      } catch {
        if (!cancelado) setError('No se pudo cargar el perfil.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.contrasena && form.contrasena !== form.contrasenaConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const req: EditarPerfilRequest = {
        nombre:    form.nombre,
        apellido:  form.apellido,
        correo:    form.correo,
        telefono:  form.telefono,
      }
      if (form.contrasena) req.contrasena = form.contrasena
      const actualizado = await perfilApi.editar(req)
      setPerfil(actualizado)
      setEditando(false)
      setSuccess('Perfil actualizado correctamente.')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Error al actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async () => {
    try {
      await perfilApi.eliminar()
      logout()
    } catch {
      setError('Error al eliminar la cuenta.')
    }
  }

  const initials = perfil
    ? `${perfil.nombre?.[0] ?? ''}${perfil.apellido?.[0] ?? ''}`.toUpperCase()
    : user?.nombreCompleto?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() ?? '?'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', maxWidth:'760px', margin:'0 auto' }} className="animate-fade-in">

      {/* ------- Encabezado ------- */}
      <div>
        <h1 style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)', margin:0 }}>Mi Perfil</h1>
        <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:'4px' }}>
          Administra tu información personal y preferencias
        </p>
      </div>

      {/* ------- Mensajes ------- */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-error-container)', color:'var(--color-on-error-container)', fontSize:'0.875rem' }} className="animate-fade-in">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>error</span>
          <span style={{flex:1}}>{error}</span>
          <button onClick={()=>setError(null)}><span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span></button>
        </div>
      )}
      {success && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'8px', backgroundColor:'var(--color-primary-fixed)', color:'var(--color-primary)', fontSize:'0.875rem' }} className="animate-fade-in">
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>check_circle</span>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize:'48px', color:'var(--color-primary)' }}>progress_activity</span>
        </div>
      ) : (
        <>
          {/* ------- Card perfil ------- */}
          <div className="card">
            {/* Avatar + info básica */}
            <div style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'24px', paddingBottom:'24px', borderBottom:'1px solid var(--color-outline-variant)' }}>
              <div style={{ width:'72px', height:'72px', borderRadius:'9999px', backgroundColor:'var(--color-primary-fixed)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--color-primary)' }}>{initials}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--color-on-surface)', margin:'0 0 4px' }}>
                  {perfil ? `${perfil.nombre} ${perfil.apellido}` : user?.nombreCompleto}
                </h2>
                <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:'0 0 8px' }}>{perfil?.correo ?? user?.correo}</p>
                <span style={{ padding:'4px 12px', borderRadius:'9999px', fontSize:'12px', fontWeight:700, backgroundColor:'var(--color-primary-fixed)', color:'var(--color-primary)' }}>
                  {ROL_LABELS[perfil?.rol ?? user?.rol ?? ''] ?? perfil?.rol ?? user?.rol}
                </span>
              </div>
              {!editando && (
                <button onClick={() => setEditando(true)} className="btn-secondary" style={{ whiteSpace:'nowrap' }}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>edit</span>
                  Editar perfil
                </button>
              )}
            </div>

            {!editando ? (
              /* ------- Vista datos ------- */
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
                {[
                  { label:'Nombre',     value: perfil?.nombre,     icon:'person'    },
                  { label:'Apellido',   value: perfil?.apellido,   icon:'person'    },
                  { label:'Correo',     value: perfil?.correo,     icon:'mail'      },
                  { label:'Teléfono',   value: perfil?.telefono,   icon:'call'      },
                  { label:'Rol',        value: ROL_LABELS[perfil?.rol ?? ''] ?? perfil?.rol, icon:'badge' },
                  { label:'Estado',     value: perfil?.activo ? 'Activo' : 'Inactivo', icon:'radio_button_checked' },
                ].map(campo => (
                  <div key={campo.label}>
                    <p style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--color-on-surface-variant)', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{campo.label}</p>
                    <p style={{ fontSize:'0.9375rem', color:'var(--color-on-surface)', margin:0, display:'flex', alignItems:'center', gap:'6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'var(--color-outline)' }}>{campo.icon}</span>
                      {campo.value ?? '—'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* ------- Formulario edición -------*/
              <form onSubmit={handleGuardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div>
                    <label className="input-label">Nombre</label>
                    <input type="text" value={form.nombre ?? ''} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Apellido</label>
                    <input type="text" value={form.apellido ?? ''} onChange={e=>setForm(p=>({...p,apellido:e.target.value}))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="input-label">Correo electrónico</label>
                  <input type="email" value={form.correo ?? ''} onChange={e=>setForm(p=>({...p,correo:e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Teléfono</label>
                  <input type="tel" value={form.telefono ?? ''} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} className="input-field" />
                </div>
                <div style={{ borderTop:'1px solid var(--color-outline-variant)', paddingTop:'16px' }}>
                  <p style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-on-surface)', margin:'0 0 12px' }}>Cambiar contraseña (opcional)</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label className="input-label">Nueva contraseña</label>
                      <input type="password" value={form.contrasena ?? ''} onChange={e=>setForm(p=>({...p,contrasena:e.target.value}))} placeholder="Mín. 6 caracteres" className="input-field" />
                    </div>
                    <div>
                      <label className="input-label">Confirmar contraseña</label>
                      <input type="password" value={form.contrasenaConfirm ?? ''} onChange={e=>setForm(p=>({...p,contrasenaConfirm:e.target.value}))} placeholder="Repite la contraseña" className="input-field" />
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'12px', paddingTop:'8px' }}>
                  <button type="button" onClick={()=>setEditando(false)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{flex:1}}>
                    {saving ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:'18px'}}>progress_activity</span> Guardando...</> : <><span className="material-symbols-outlined" style={{fontSize:'18px'}}>save</span> Guardar cambios</>}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ------- Zona de peligro ------- */}
          <div className="card" style={{ borderColor:'var(--color-error-container)' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:600, color:'var(--color-error)', margin:'0 0 8px', display:'flex', alignItems:'center', gap:'6px' }}>
              <span className="material-symbols-outlined" style={{fontSize:'20px'}}>warning</span>
              Zona de peligro
            </h3>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', margin:'0 0 16px' }}>
              Estas acciones son irreversibles. Procede con precaución.
            </p>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <button onClick={logout} className="btn-secondary" style={{ color:'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>logout</span>
                Cerrar sesión
              </button>
              <button onClick={() => setConfirmEliminar(true)} className="btn-danger">
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>delete_forever</span>
                Eliminar cuenta
              </button>
            </div>
          </div>
        </>
      )}

      {/* ------- Confirm eliminar cuenta ------- */}
      {confirmEliminar && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'400px', textAlign:'center' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'9999px', margin:'0 auto 16px', backgroundColor:'var(--color-error-container)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'32px', color:'var(--color-error)' }}>delete_forever</span>
            </div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'8px' }}>¿Eliminar tu cuenta?</h2>
            <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginBottom:'24px' }}>
              Esta acción eliminará permanentemente tu cuenta, cultivos, tareas y todos tus datos. <strong>No se puede deshacer.</strong>
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setConfirmEliminar(false)} className="btn-secondary" style={{flex:1}}>Cancelar</button>
              <button onClick={handleEliminar} className="btn-danger" style={{flex:1}}>Sí, eliminar todo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
