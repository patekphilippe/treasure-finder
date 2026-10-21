import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { CircleMarker, GeoJSON, Marker } from 'react-leaflet';
import { isDisputed } from '@/shared/types/community';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { CONTEXT_KINDS } from '../config/contextKinds';
import { useSeenOnView } from '../hooks/useSeenOnView';
import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { idsSeenInYears } from '../utils/idsSeenInYears';
import { contextIcon } from '../utils/contextIcon';
import { representativePoint } from '../utils/representativePoint';

/** opacity of objects not seen on the visible map ("Tylko z widocznej mapy") or not of the slider's year */
const DIMMED = 0.35;
/** icons from this zoom; further out the objects are dots on one canvas, cheap to zoom */
const ICON_MIN_ZOOM = 13;
/** more icons than this in view also fall back to dots: each icon is an element of its own */
const MAX_ICONS = 250;
/** objects this far outside the view (share of its size) are drawn too, for smooth panning */
const VIEW_PAD = 0.5;

/**
 * Archival objects: an icon per object, plus the line or outline when it is not a point; zoomed
 * out, or with many in view, coloured dots on a canvas instead (hundreds of icons made zooming
 * stutter). Only what is near the view is drawn. With "Tylko z widocznej mapy" the objects not
 * seen on the visible map are dimmed, not hidden: they still count in the analysis.
 */
export function ContextLayer() {
  const features = useContextStore((s) => s.features);
  const visible = useContextStore((s) => s.visible);
  const onlyViewMap = useContextStore((s) => s.onlyViewMap);
  const seenOnView = useSeenOnView();
  const years = useOwnMapsStore((s) => s.years);
  // years chosen: what was read from maps of those years stands out; with the view filter both
  const filter = useMemo(() => {
    const byView = onlyViewMap ? seenOnView : null;
    const byYear = years === null ? null : idsSeenInYears(features, years);
    if (byView && byYear) return new Set([...byYear].filter((id) => byView.has(id)));
    return byYear ?? byView;
  }, [onlyViewMap, seenOnView, years, features]);
  const showContext = useUiStore((s) => s.showContext);
  const selectedId = useUiStore((s) =>
    s.activeSheet === 'contextDetails' ? s.selectedContextId : null,
  );

  useEffect(() => {
    void useContextStore.getState().load();
  }, []);

  const shapes = useMemo(
    () => features.filter((f) => f.geometry.type !== 'Point' && f.geometry.type !== 'MultiPoint'),
    [features],
  );

  const zoom = useMapViewStore((s) => s.zoom);
  const bounds = useMapViewStore((s) => s.bounds);
  const renderer = useMemo(() => L.canvas({ padding: VIEW_PAD }), []);
  const points = useMemo(
    () =>
      features.flatMap((f) => {
        const at = representativePoint(f.geometry);
        return at ? [{ f, at }] : [];
      }),
    [features],
  );
  const near = useMemo(() => {
    if (!bounds) return points;
    const dLat = (bounds.north - bounds.south) * VIEW_PAD;
    const dLng = (bounds.east - bounds.west) * VIEW_PAD;
    return points.filter(
      ({ at }) =>
        at.lat > bounds.south - dLat &&
        at.lat < bounds.north + dLat &&
        at.lng > bounds.west - dLng &&
        at.lng < bounds.east + dLng,
    );
  }, [points, bounds]);
  const icons = zoom >= ICON_MIN_ZOOM && near.length <= MAX_ICONS;

  if (!visible) return null;
  return (
    <>
      {shapes.map((f) => (
        <GeoJSON
          key={f.id}
          data={f.geometry}
          style={{
            color: CONTEXT_KINDS[f.kind].color,
            weight: 3,
            dashArray: '6 6',
            opacity: filter && !filter.has(f.id) ? DIMMED : 1,
            fillOpacity: filter && !filter.has(f.id) ? 0.03 : 0.1,
          }}
          eventHandlers={{ click: () => showContext(f.id) }}
        />
      ))}
      {near.map(({ f, at }) => {
        const opacity = filter && !filter.has(f.id) ? DIMMED : 1;
        if (!icons && f.id !== selectedId)
          return (
            <CircleMarker
              key={f.id}
              center={[at.lat, at.lng]}
              radius={5}
              pathOptions={{
                renderer,
                color: '#ffffff',
                weight: 1.5,
                opacity,
                fillColor: CONTEXT_KINDS[f.kind].color,
                fillOpacity: opacity,
              }}
              eventHandlers={{ click: () => showContext(f.id) }}
            />
          );
        return (
          <Marker
            key={f.id}
            position={[at.lat, at.lng]}
            icon={contextIcon(
              f.kind,
              f.id === selectedId,
              !f.community ? 'local' : isDisputed(f.community) ? 'disputed' : 'shared',
            )}
            title={CONTEXT_KINDS[f.kind].label}
            opacity={opacity}
            zIndexOffset={f.id === selectedId ? 900 : -200}
            eventHandlers={{ click: () => showContext(f.id) }}
          />
        );
      })}
    </>
  );
}
