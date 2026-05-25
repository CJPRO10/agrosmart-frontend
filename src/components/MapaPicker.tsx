'use client'

import { useEffect, useRef, useState } from 'react'

interface MapaPickerProps {
  latitud?: number
  longitud?: number
  onChange: (lat: number, lng: number, nombre: string) => void
}

// Reverse geocoding con OpenStreetMap Nominatim (gratis)
async function obtenerNombreUbicacion(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { 'User-Agent': 'AgroSmart/1.0' } }
    )
    const data = await res.json()
    const addr = data.address
    return addr?.village ?? addr?.town ?? addr?.city ?? addr?.municipality ?? addr?.county ?? 'Ubicación personalizada'
  } catch {
    return 'Ubicación personalizada'
  }
}

export default function MapaPicker({ latitud, longitud, onChange }: MapaPickerProps) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapObjRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)
  const [cargando, setCargando] = useState(false)
  const [nombreActual, setNombreActual] = useState('')

  // Centro por defecto: Santa Marta, Magdalena
  const latInicial = latitud  ?? 11.2408
  const lngInicial = longitud ?? -74.2110

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return

    // Cargar Leaflet dinámicamente
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as unknown as { L: unknown }).L as {
        map: (el: HTMLElement, opts: unknown) => unknown
        tileLayer: (url: string, opts: unknown) => { addTo: (m: unknown) => void }
        marker: (latlng: [number, number]) => {
          addTo: (m: unknown) => unknown
          setLatLng: (latlng: [number, number]) => void
          getLatLng: () => { lat: number; lng: number }
        }
        DivIcon: new (opts: unknown) => unknown
      }

      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        center: [latInicial, lngInicial],
        zoom: 11,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)

      // Marker inicial
      const marker = L.marker([latInicial, lngInicial]).addTo(map)
      markerRef.current = marker
      mapObjRef.current = map

      // Click en el mapa
      ;(map as unknown as { on: (ev: string, fn: (e: { latlng: { lat: number; lng: number } }) => void) => void })
        .on('click', async (e) => {
          const { lat, lng } = e.latlng
          ;(marker as { setLatLng: (l: [number, number]) => void }).setLatLng([lat, lng])
          setCargando(true)
          const nombre = await obtenerNombreUbicacion(lat, lng)
          setNombreActual(nombre)
          onChange(lat, lng, nombre)
          setCargando(false)
        })
    }
    document.head.appendChild(script)

    return () => {
      if (mapObjRef.current) {
        ;(mapObjRef.current as { remove: () => void }).remove()
        mapObjRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      <div style={{ position:'relative' }}>
        <div ref={mapRef} style={{ width:'100%', height:'280px', borderRadius:'12px', overflow:'hidden', border:'1.5px solid var(--color-outline-variant)', zIndex:0 }} />
        {cargando && (
          <div style={{ position:'absolute', top:'8px', left:'50%', transform:'translateX(-50%)', backgroundColor:'var(--color-primary)', color:'white', padding:'4px 12px', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600, display:'flex', alignItems:'center', gap:'4px', zIndex:1000 }}>
            <span className="material-symbols-outlined animate-spin" style={{fontSize:'14px'}}>progress_activity</span>
            Obteniendo ubicación...
          </div>
        )}
      </div>
      {nombreActual && (
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.8rem', color:'var(--color-primary)', fontWeight:600 }}>
          <span className="material-symbols-outlined" style={{fontSize:'16px'}}>location_on</span>
          {nombreActual}
        </div>
      )}
      <p style={{ fontSize:'0.75rem', color:'var(--color-on-surface-variant)', margin:0 }}>
        Haz click en el mapa para seleccionar la ubicación exacta de tu finca
      </p>
    </div>
  )
}
