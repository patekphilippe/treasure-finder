import { Circle, MapContainer, Rectangle, TileLayer, Tooltip } from 'react-leaflet';
import type { SourceObject, ViewBbox } from '@/shared/types/sources';

interface AdminMiniMapProps {
  objects: readonly SourceObject[];
  view: ViewBbox | null;
}

/** Where the analysis put the objects, with the sender's map view as a dashed frame. */
export function AdminMiniMap({ objects, view }: AdminMiniMapProps) {
  const first = objects[0];
  const center: [number, number] = first
    ? [first.lat, first.lng]
    : view
      ? [(view.south + view.north) / 2, (view.west + view.east) / 2]
      : [52.1, 19.4];
  return (
    <MapContainer
      center={center}
      zoom={first ? 14 : view ? 12 : 6}
      style={{ height: 260, borderRadius: 12 }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
      />
      {view && (
        <Rectangle
          bounds={[
            [view.south, view.west],
            [view.north, view.east],
          ]}
          pathOptions={{ color: '#64748b', weight: 1, dashArray: '4 4', fill: false }}
        />
      )}
      {objects.map((o, i) => (
        <Circle
          key={i}
          center={[o.lat, o.lng]}
          radius={o.radiusM}
          pathOptions={{ color: '#7c3aed', weight: 2, fillOpacity: 0.12 }}
        >
          <Tooltip>{`${i + 1}. ${o.label}`}</Tooltip>
        </Circle>
      ))}
    </MapContainer>
  );
}
