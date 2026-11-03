import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"

export type MapPoint = { name: string; lat: number; lng: number; count: number }

/** Peta sebaran: lingkaran makin besar = pendaftar makin banyak. */
export default function TrialMap({ points }: { points: MapPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count))
  return (
    <MapContainer
      center={[-2.5, 118]}
      zoom={4}
      minZoom={3}
      scrollWheelZoom={false}
      style={{ height: 360, width: "100%", borderRadius: 12 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.name}
          center={[p.lat, p.lng]}
          radius={8 + Math.round((p.count / max) * 22)}
          pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.45, weight: 1 }}
        >
          <Tooltip>
            {p.name}: {p.count} pendaftar
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
