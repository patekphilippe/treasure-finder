import L from 'leaflet';
import { useMemo } from 'react';
import { CircleMarker } from 'react-leaflet';
import type { Candidate } from '@/shared/types/domain';
import { FORM_META, PROTECTED_COLOR } from '../config/forms';
import { useAnalysisStore } from '../store/useAnalysisStore';

interface CandidateMarkersProps {
  candidates: readonly Candidate[];
}

/** Circles coloured by class, sized by score; protected ones grey. Canvas-rendered (thousands). */
export function CandidateMarkers({ candidates }: CandidateMarkersProps) {
  const selectedId = useAnalysisStore((s) => s.selectedId);
  const select = useAnalysisStore((s) => s.select);
  const renderer = useMemo(() => L.canvas({ padding: 0.5 }), []);

  return candidates.map((c) => {
    const selected = c.id === selectedId;
    const color = c.protectedLikely ? PROTECTED_COLOR : FORM_META[c.form].color;
    return (
      <CircleMarker
        key={c.id}
        center={[c.lat, c.lng]}
        radius={(selected ? 6 : 3) + c.score / 14}
        pathOptions={{
          renderer,
          color: selected ? '#ffffff' : color,
          weight: selected ? 3 : 1,
          fillColor: color,
          fillOpacity: c.decision === 'przyjety' ? 0.95 : 0.6,
        }}
        eventHandlers={{ click: () => select(c.id) }}
      />
    );
  });
}
