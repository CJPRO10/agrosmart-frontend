// Layout para páginas públicas (login, registro)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-on-background">
      {children}
    </main>
  )
}
