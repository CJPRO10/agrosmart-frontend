// Layout para páginas públicas (login, registro)
// Sin sidebar ni navbar — solo el contenido centrado
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-on-background">
      {children}
    </main>
  )
}
