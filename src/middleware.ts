import { NextRequest, NextResponse } from 'next/server'

// Rutas permitidas por rol
const RUTAS_POR_ROL: Record<string, string[]> = {
  PRODUCTOR: [
    '/inicio', '/mi-finca', '/personal', '/cultivos', '/tareas',
    '/anomalias', '/recomendaciones', '/clima', '/finanzas',
    '/reportes', '/perfil', '/notificaciones',
  ],
  OPERARIO: [
    '/inicio', '/cultivos', '/tareas', '/anomalias',
    '/recomendaciones', '/clima', '/perfil', '/notificaciones',
  ],
  AUXILIAR: [
    '/inicio', '/cultivos', '/tareas', '/anomalias',
    '/recomendaciones', '/perfil', '/notificaciones',
  ],
  ADMINISTRADOR: [
    '/inicio', '/usuarios', '/perfil', '/notificaciones',
  ],
}

// Rutas públicas (sin auth)
const RUTAS_PUBLICAS = ['/login', '/registro']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas y archivos estáticos
  if (
    RUTAS_PUBLICAS.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Leer token y user del cookie o header
  // Next.js middleware no puede leer localStorage, usamos cookies
  const token = request.cookies.get('agro_auth_token')?.value
  const userCookie = request.cookies.get('agro_user')?.value

  // Sin token → redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si no hay datos de usuario en cookie, dejar pasar (el cliente los tiene en localStorage)
  if (!userCookie) {
    return NextResponse.next()
  }

  try {
    const userData = JSON.parse(userCookie)
    const rol = userData?.state?.user?.rol as string

    if (!rol) return NextResponse.next()

    const rutasPermitidas = RUTAS_POR_ROL[rol] ?? []

    // Verificar si la ruta actual está permitida para el rol
    const permitida = rutasPermitidas.some(ruta => pathname === ruta || pathname.startsWith(ruta + '/'))

    if (!permitida) {
      // Redirigir a inicio si intenta acceder a ruta no permitida
      return NextResponse.redirect(new URL('/inicio', request.url))
    }
  } catch {
    // Si hay error parseando, dejar pasar y que el cliente maneje
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}