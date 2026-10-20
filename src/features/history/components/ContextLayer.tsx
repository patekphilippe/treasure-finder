import { useEffect, useMemo } from 'react';
import { GeoJSON, Marker } from 'react-leaflet';
import { isDisputed } from '@/shared/types/community';
import { useUiStore } from '@/shared/store/useUiStore';
import { CONTEXT_KINDS } from '../config/contextKinds';
import { useContextStore } from '../store/useContextStore';
import { contextIcon } from '../utils/contextIcon';
import { representativePoint } from '../utils/representativePoint';

/** Archival objects: an icon per object, plus the line or outline when it is not a point. */
export function ContextLayer() {
  const features = useContextStore((s) => s.features);
  const visible = useContextStore((s) => s.visible);
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
            fillOpacity: 0.1,
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
            zIndexOffset={f.id === selectedId ? 900 : -200}
            eventHandlers={{ click: () => showContext(f.id) }}
          />
        );
      })}
    </>
  );
}
