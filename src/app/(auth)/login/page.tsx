'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import type { LoginRequest } from '@/types'

export default function LoginPage() {
  const { login, isLoading } = useAuth()

  const [form, setForm] = useState<LoginRequest>({ correo: '', contrasena: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden min-h-[680px]">

        {/* ── Panel izquierdo: branding ── */}
        <section className="relative hidden md:flex flex-col justify-between p-lg overflow-hidden bg-primary-container">
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1594488651083-bb82abd507c5?q=80&w=2070&auto=format&fit=crop"
              alt="Campo agrícola Magdalena"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-primary-container/50 to-transparent" />
          </div>

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-lg">
              <span className="material-symbols-outlined text-4xl text-on-primary-container">potted_plant</span>
              <h1 className="text-headline-md text-white tracking-tight">AgroMagdalena</h1>
            </div>
            <div className="space-y-sm max-w-md">
              <h2 className="text-headline-lg text-white">Gestión agrícola inteligente.</h2>
              <p className="text-body-lg text-on-primary-container opacity-90">
                Potencia tu producción con herramientas diseñadas para el campo colombiano.
              </p>
            </div>
          </div>

          {/* Footer branding */}
          <div className="relative z-10 flex items-center gap-base">
            <div className="w-12 h-0.5 bg-white rounded-full" />
            <p className="text-label-md uppercase tracking-widest text-on-primary-container">
              Progreso Regional
            </p>
          </div>
        </section>

        {/* ── Panel derecho: formulario ── */}
        <section className="flex flex-col justify-center px-8 py-12 md:px-16 bg-surface-container-lowest">
          <div className="max-w-md w-full mx-auto">

            {/* Logo móvil */}
            <div className="md:hidden flex items-center gap-2 mb-lg">
              <span className="material-symbols-outlined text-primary text-3xl">potted_plant</span>
              <h1 className="text-headline-sm text-primary">AgroMagdalena</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-headline-lg text-on-surface mb-xs">Accede</h2>
              <p className="text-body-md text-on-surface-variant">Inicia sesión para continuar</p>
            </div>

            {/* Error global */}
            {error && (
              <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-error-container text-on-error-container text-body-md animate-fade-in">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Correo */}
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant ml-1 block" htmlFor="correo">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    value={form.correo}
                    onChange={handleChange}
                    placeholder="usuario@agro.co"
                    required
                    className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-b-2 border-outline-variant focus:border-primary focus:outline-none rounded-t-lg text-body-md transition-all"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant ml-1 block" htmlFor="contrasena">
                  Contraseña
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                  <input
                    id="contrasena"
                    name="contrasena"
                    type={showPassword ? 'text' : 'password'}
                    value={form.contrasena}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full h-14 pl-12 pr-12 bg-surface-container-low border-b-2 border-outline-variant focus:border-primary focus:outline-none rounded-t-lg text-body-md transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full rounded-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    Ingresando...
                  </>
                ) : (
                  <>
                    Acceder
                    <span className="material-symbols-outlined text-[20px]">login</span>
                  </>
                )}
              </button>
            </form>

            {/* Registro */}
            <p className="mt-8 text-center text-body-md text-on-surface-variant">
              ¿Todavía no tienes cuenta?{' '}
              <Link href="/registro" className="text-primary font-semibold hover:underline underline-offset-4">
                Regístrate
              </Link>
            </p>
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-outline-variant flex flex-wrap justify-center gap-6 text-caption text-outline">
            <a href="#" className="hover:text-primary transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a>
            <span>© 2025 AgroMagdalena</span>
          </footer>
        </section>
      </div>
    </div>
  )
}
