'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import type { RegistroProductorRequest } from '@/types'

// Paso 1: datos personales
// Paso 2: datos de la finca
type Step = 1 | 2

interface Step1Data {
  nombre: string
  apellido: string
  correo: string
  contrasena: string
  confirmar: string
  telefono: string
  fechaNacimiento: string
}

interface Step2Data {
  nombreFinca: string
  hectareas: string
  numLotes: string
  idUbicacion: string
}

const INITIAL_STEP1: Step1Data = {
  nombre: '', apellido: '', correo: '',
  contrasena: '', confirmar: '', telefono: '', fechaNacimiento: '',
}

const INITIAL_STEP2: Step2Data = {
  nombreFinca: '', hectareas: '', numLotes: '', idUbicacion: '1',
}

export default function RegistroPage() {
  const { registrar, isLoading } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [step1, setStep1] = useState<Step1Data>(INITIAL_STEP1)
  const [step2, setStep2] = useState<Step2Data>(INITIAL_STEP2)
  const [error, setError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStep1((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setStep2((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const validateStep1 = (): boolean => {
    if (!step1.nombre || !step1.apellido || !step1.correo || !step1.telefono || !step1.fechaNacimiento) {
      setError('Todos los campos son obligatorios')
      return false
    }
    if (step1.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    if (step1.contrasena !== step1.confirmar) {
      setError('Las contraseñas no coinciden')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setError(null)
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!step2.nombreFinca || !step2.hectareas || !step2.numLotes) {
      setError('Todos los campos de la finca son obligatorios')
      return
    }

    const data: RegistroProductorRequest = {
      nombre:          step1.nombre,
      apellido:        step1.apellido,
      correo:          step1.correo,
      contrasena:      step1.contrasena,
      telefono:        step1.telefono,
      fechaNacimiento: new Date(step1.fechaNacimiento).toISOString(),
      nombreFinca:     step2.nombreFinca,
      hectareas:       parseFloat(step2.hectareas),
      numLotes:        parseInt(step2.numLotes),
      idUbicacion:     parseInt(step2.idUbicacion),
    }

    try {
      await registrar(data)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'mensaje' in err
        ? (err as { mensaje: string }).mensaje
        : 'Error al registrar. Intenta nuevamente.'
      setError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-outline-variant">
        <div className="flex justify-between items-center px-6 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">potted_plant</span>
            <span className="text-headline-sm text-primary font-bold">AgroMagdalena</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-label-md text-secondary hidden sm:block">¿Ya tienes cuenta?</span>
            <Link href="/login" className="btn-primary text-sm px-4 py-2 min-h-0 rounded-lg">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 flex justify-center">
        <div className="w-full max-w-3xl">

          {/* Indicador de pasos */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Paso 1 */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all
                  ${step >= 1 ? 'bg-secondary text-on-secondary' : 'border-2 border-outline text-outline'}`}>
                  {step > 1
                    ? <span className="material-symbols-outlined text-[20px]">check</span>
                    : '1'}
                </div>
                <div>
                  <p className={`text-label-md ${step >= 1 ? 'text-secondary' : 'text-on-surface-variant'}`}>Paso 1</p>
                  <p className="text-body-md font-bold text-on-surface">Datos personales</p>
                </div>
              </div>

              {/* Línea */}
              <div className="hidden md:block h-0.5 flex-1 mx-6 bg-surface-variant" />

              {/* Paso 2 */}
              <div className={`flex items-center gap-3 transition-opacity ${step < 2 ? 'opacity-40' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg
                  ${step === 2 ? 'bg-secondary text-on-secondary' : 'border-2 border-outline text-outline'}`}>
                  2
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant">Paso 2</p>
                  <p className="text-body-md text-on-surface-variant">Rol y datos de tu finca</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="card p-8 md:p-12">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-headline-lg text-primary mb-1">
                {step === 1 ? 'Registra tus datos personales' : 'Registra tu finca'}
              </h1>
              <p className="text-body-md text-on-surface-variant">
                ¿Ya estás registrado?{' '}
                <Link href="/login" className="text-secondary font-semibold hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-error-container text-on-error-container text-body-md animate-fade-in">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}

            {/* ── PASO 1 ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="input-label" htmlFor="nombre">Nombre</label>
                  <input id="nombre" name="nombre" type="text" value={step1.nombre}
                    onChange={handleStep1Change} placeholder="Ej: Juan"
                    className="input-field" required />
                </div>
                <div>
                  <label className="input-label" htmlFor="apellido">Apellido</label>
                  <input id="apellido" name="apellido" type="text" value={step1.apellido}
                    onChange={handleStep1Change} placeholder="Ej: Pérez"
                    className="input-field" required />
                </div>
                <div className="md:col-span-2">
                  <label className="input-label" htmlFor="correo">Correo Electrónico</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
                    <input id="correo" name="correo" type="email" value={step1.correo}
                      onChange={handleStep1Change} placeholder="usuario@agro.com"
                      className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="input-label" htmlFor="telefono">Teléfono</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">call</span>
                    <input id="telefono" name="telefono" type="tel" value={step1.telefono}
                      onChange={handleStep1Change} placeholder="+57 300 000 0000"
                      className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="input-label" htmlFor="fechaNacimiento">Fecha de nacimiento</label>
                  <input id="fechaNacimiento" name="fechaNacimiento" type="date"
                    value={step1.fechaNacimiento} onChange={handleStep1Change}
                    className="input-field" required />
                </div>
                <div>
                  <label className="input-label" htmlFor="contrasena">Contraseña</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                    <input id="contrasena" name="contrasena"
                      type={showPass ? 'text' : 'password'} value={step1.contrasena}
                      onChange={handleStep1Change} placeholder="Mín. 6 caracteres"
                      className="input-field pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined">{showPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="input-label" htmlFor="confirmar">Confirma tu contraseña</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                    <input id="confirmar" name="confirmar"
                      type={showPass ? 'text' : 'password'} value={step1.confirmar}
                      onChange={handleStep1Change} placeholder="Repite tu contraseña"
                      className="input-field pl-10" required />
                  </div>
                </div>
                <div className="md:col-span-2 pt-4 flex justify-center">
                  <button type="button" onClick={handleNextStep}
                    className="btn-primary flex items-center gap-2 min-w-[200px] justify-center">
                    Siguiente
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 2 ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="md:col-span-2">
                  <label className="input-label" htmlFor="nombreFinca">Nombre de tu finca</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">home</span>
                    <input id="nombreFinca" name="nombreFinca" type="text" value={step2.nombreFinca}
                      onChange={handleStep2Change} placeholder="Ej: Finca El Paraíso"
                      className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="input-label" htmlFor="hectareas">Número de hectáreas</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">straighten</span>
                    <input id="hectareas" name="hectareas" type="number" step="0.01"
                      min="0.01" max="5" value={step2.hectareas}
                      onChange={handleStep2Change} placeholder="Ej: 2.5"
                      className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="input-label" htmlFor="numLotes">Número de lotes</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">grid_view</span>
                    <input id="numLotes" name="numLotes" type="number" min="1"
                      value={step2.numLotes} onChange={handleStep2Change}
                      placeholder="Ej: 3" className="input-field pl-10" required />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="input-label" htmlFor="idUbicacion">Municipio</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">location_on</span>
                    <select id="idUbicacion" name="idUbicacion" value={step2.idUbicacion}
                      onChange={handleStep2Change} className="input-field pl-10 appearance-none">
                      <option value="1">Santa Marta</option>
                      <option value="2">Ciénaga</option>
                      <option value="3">Fundación</option>
                      <option value="4">Aracataca</option>
                      <option value="5">El Banco</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="md:col-span-2 pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button type="button" onClick={() => setStep(1)}
                    className="btn-secondary flex items-center gap-2 min-w-[160px] justify-center">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Anterior
                  </button>
                  <button type="submit" disabled={isLoading}
                    className="btn-primary flex items-center gap-2 min-w-[200px] justify-center">
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        Registrando...
                      </>
                    ) : (
                      <>
                        Crear cuenta
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Trust cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: 'verified_user', title: 'Datos Protegidos', desc: 'Tus datos están cifrados con los más altos estándares de seguridad.' },
              { icon: 'support_agent', title: 'Soporte 24/7',    desc: 'Nuestro equipo en el Magdalena está listo para apoyarte.' },
              { icon: 'trending_up',   title: 'Crece con nosotros', desc: 'Únete a la comunidad de productores que digitalizan el campo.' },
            ].map((item) => (
              <div key={item.title} className="card flex flex-col gap-2">
                <span className="material-symbols-outlined text-secondary text-3xl">{item.icon}</span>
                <h3 className="text-label-md text-primary">{item.title}</h3>
                <p className="text-caption text-on-surface-variant">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
