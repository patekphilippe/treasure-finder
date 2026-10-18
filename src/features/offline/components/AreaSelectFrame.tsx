import Box from '@mui/material/Box';
import { useEffect, useRef } from 'react';
import { Rectangle, useMap, useMapEvents } from 'react-leaflet';
import { useOfflineStore } from '../store/useOfflineStore';

/**
 * Frame over the map marking the area to download; the map outside it is dimmed.
 * Rendered inside the map container so its rectangle converts straight to coordinates.
 */
export function AreaSelectFrame() {
  const map = useMap();
  const frame = useRef<HTMLDivElement>(null);
  const setSelection = useOfflineStore((s) => s.setSelection);
  const areas = useOfflineStore((s) => s.areas);

  const measure = () => {
    const el = frame.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const container = map.getContainer().getBoundingClientRect();
    const nw = map.containerPointToLatLng([box.left - container.left, box.top - container.top]);
    const se = map.containerPointToLatLng([box.right - container.left, box.bottom - container.top]);
    setSelection({ north: nw.lat, west: nw.lng, south: se.lat, east: se.lng });
  };
  useMapEvents({ moveend: measure, zoomend: measure, resize: measure });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, []);

  return (
    <>
      {/* areas already saved, so a new frame can join them instead of overlapping */}
      {areas.map((a) => (
        <Rectangle
          key={a.id}
          bounds={[
            [a.bounds.south, a.bounds.west],
            [a.bounds.north, a.bounds.east],
          ]}
          pathOptions={{ color: '#059669', weight: 1.5, fillOpacity: 0.12, interactive: false }}
        />
      ))}
      <Box
        ref={frame}
        sx={(theme) => ({
          position: 'absolute',
          zIndex: 450,
          pointerEvents: 'none',
          top: 'calc(env(safe-area-inset-top, 0px) + 112px)',
          left: 16,
          right: 16,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 320px)',
          border: `2px dashed ${theme.palette.primary.main}`,
          borderRadius: '12px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
        })}
      />
    </>
  );
}
