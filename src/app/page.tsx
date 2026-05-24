import { redirect } from 'next/navigation'

// Página raíz: redirige al login
// El middleware o el layout del dashboard se encargan de proteger rutas
export default function RootPage() {
  redirect('/login')
}
