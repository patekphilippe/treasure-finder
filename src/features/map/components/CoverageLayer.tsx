import L from 'leaflet';
import { useMemo, useState } from 'react';
import { Polyline, useMap, useMapEvents } from 'react-leaflet';
import { useTracksStore } from '@/features/tracks';
import { useCoverageStore } from '@/shared/store/useCoverageStore';
import { COVERAGE_COLOR } from '../config/mapLayers';
import { metresPerPixel } from '../utils/metresPerPixel';

const PANE = 'coverage';

/**
 * Tracks as searched strips: line width = swath in metres converted to pixels at the
 * current zoom. All strips are opaque in one canvas and the pane itself is translucent,
 * so overlapping passes don't get darker — gaps stand out.
 */
export function CoverageLayer() {
  const map = useMap();
  const tracks = useTracksStore((s) => s.tracks);
  const swathM = useCoverageStore((s) => s.swathM);
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const renderer = useMemo(() => {
    const pane = map.getPane(PANE) ?? map.createPane(PANE);
    pane.style.opacity = '0.5';
    pane.style.zIndex = '450';
    return L.canvas({ pane: PANE, padding: 0.5 });
  }, [map]);

  const weight = Math.max(1, swathM / metresPerPixel(map.getCenter().lat, zoom));

  return tracks.map((track) => (
    <Polyline
      key={track.id}
      positions={track.segments.map((seg) =>
        seg.map(([lat, lng]) => [lat, lng] as [number, number]),
      )}
      interactive={false}
      pathOptions={{
        renderer,
        color: COVERAGE_COLOR,
        weight,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  ));
}
