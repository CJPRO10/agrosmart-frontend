// El middleware no es compatible con output: export (SPA estática)
// La protección de rutas se maneja en el cliente con useRoleGuard en el dashboard layout
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const proxyConfig = {
  matcher: [],
}
