export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight:'100vh', backgroundColor:'var(--color-background)', color:'var(--color-on-background)' }}>
      {children}
    </main>
  )
}
