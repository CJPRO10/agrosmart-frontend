import { NextRequest, NextResponse } from 'next/server'

// Rutas que SÍ requieren autenticación
const RUTAS_PROTEGIDAS = [
  '/inicio', '/mi-finca', '/personal', '/cultivos', '/tareas',
  '/anomalias', '/recomendaciones', '/clima', '/finanzas',
  '/reportes', '/perfil', '/notificaciones', '/usuarios',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Dejar pasar archivos estáticos y API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')   ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Verificar si es ruta protegida
  const esProtegida = RUTAS_PROTEGIDAS.some(
    ruta => pathname === ruta || pathname.startsWith(ruta + '/')
  )

  if (!esProtegida) {
    // Landing (/), login, registro — siempre permitidas
    return NextResponse.next()
  }

  // Para rutas protegidas verificar token en cookie
  const token = request.cookies.get('agro_auth_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const proxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}