import { useEffect, useMemo } from 'react';
import { GeoJSON, Marker } from 'react-leaflet';
import { isDisputed } from '@/shared/types/community';
import { useUiStore } from '@/shared/store/useUiStore';
import { CONTEXT_KINDS } from '../config/contextKinds';
import { useSeenOnView } from '../hooks/useSeenOnView';
import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { idsSeenInYear } from '../utils/idsSeenInYear';
import { contextIcon } from '../utils/contextIcon';
import { representativePoint } from '../utils/representativePoint';

/** opacity of objects not seen on the visible map ("Tylko z widocznej mapy") or not of the slider's year */
const DIMMED = 0.35;

/**
 * Archival objects: an icon per object, plus the line or outline when it is not a point. With
 * "Tylko z widocznej mapy" the objects not seen on the visible map are dimmed, not hidden: they
 * still count in the analysis.
 */
export function ContextLayer() {
  const features = useContextStore((s) => s.features);
  const visible = useContextStore((s) => s.visible);
  const onlyViewMap = useContextStore((s) => s.onlyViewMap);
  const seenOnView = useSeenOnView();
  const year = useOwnMapsStore((s) => s.yearFilter);
  // a year on the slider: what was read from maps of that year stands out; with the view filter both
  const filter = useMemo(() => {
    const byView = onlyViewMap ? seenOnView : null;
    const byYear = year === null ? null : idsSeenInYear(features, year);
    if (byView && byYear) return new Set([...byYear].filter((id) => byView.has(id)));
    return byYear ?? byView;
  }, [onlyViewMap, seenOnView, year, features]);
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
      {features.map((f) => {
        const at = representativePoint(f.geometry);
        if (!at) return null;
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
            opacity={filter && !filter.has(f.id) ? DIMMED : 1}
            zIndexOffset={f.id === selectedId ? 900 : -200}
            eventHandlers={{ click: () => showContext(f.id) }}
          />
        );
      })}
    </>
  );
}
