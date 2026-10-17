import { GeoJSON } from 'react-leaflet';
import { useZonesStore, ZONE_STYLE } from '@/features/zones';

/** Permit zones in green, forbidden zones in red (drawn under tracks and points). */
export function ZoneLayers() {
  const zones = useZonesStore((s) => s.zones);

  return zones.map((zone) => {
    const color = ZONE_STYLE[zone.kind].color;
    return (
      <GeoJSON
        key={`${zone.id}-${zone.kind}`}
        data={zone.geometry}
        interactive={false}
        style={{
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: zone.kind === 'zakaz' ? 0.18 : 0.06,
          dashArray: zone.kind === 'zakaz' ? '6 6' : undefined,
        }}
      />
    );
  });
}
