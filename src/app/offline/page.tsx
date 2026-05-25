'use client'
export default function OfflinePage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#f9faf2', padding:'24px', textAlign:'center' }}>
      <div style={{ fontSize:'64px', marginBottom:'24px' }}>🌱</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'#154212', margin:'0 0 12px' }}>Sin conexión</h1>
      <p style={{ fontSize:'1rem', color:'#666', maxWidth:'320px', lineHeight:1.6, margin:'0 0 32px' }}>
        No tienes conexión a internet. Los datos que ya cargaste siguen disponibles.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding:'14px 32px', borderRadius:'10px', backgroundColor:'#154212', color:'white', border:'none', fontSize:'1rem', fontWeight:700, cursor:'pointer' }}>
        Reintentar
      </button>
    </div>
  )
}
