import L from 'leaflet';
import { useMemo } from 'react';
import { Circle, Marker } from 'react-leaflet';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { POSITION_COLOR } from '../config/mapLayers';

const SIZE = 64;

/** Own position: dot, accuracy circle and a heading cone when the compass works. */
export function PositionMarker() {
  const position = useFieldStore((s) => s.position);
  const heading = useFieldStore((s) => s.heading);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'position-marker',
        iconSize: [SIZE, SIZE],
        iconAnchor: [SIZE / 2, SIZE / 2],
        html: `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 64 64" style="overflow:visible">
          ${
            heading === null
              ? ''
              : `<path d="M32 32 L20 4 A30 30 0 0 1 44 4 Z" fill="${POSITION_COLOR}" opacity="0.28"
                  transform="rotate(${heading} 32 32)"/>`
          }
          <circle cx="32" cy="32" r="9" fill="#fff"/>
          <circle cx="32" cy="32" r="6.5" fill="${POSITION_COLOR}"/>
        </svg>`,
      }),
    [heading],
  );

  if (!position) return null;
  const center: [number, number] = [position.lat, position.lng];
  return (
    <>
      <Circle
        center={center}
        radius={position.accM}
        interactive={false}
        pathOptions={{ color: POSITION_COLOR, weight: 1, opacity: 0.4, fillOpacity: 0.1 }}
      />
      <Marker position={center} icon={icon} interactive={false} keyboard={false} />
    </>
  );
}
