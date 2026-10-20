import { Fragment } from 'react';
import { Marker, Polyline } from 'react-leaflet';
import { useUiStore } from '@/shared/store/useUiStore';
import { useProposalsStore } from '../store/useProposalsStore';
import { proposalIcon } from '../utils/proposalIcon';

/** AI proposals waiting for "Przyjmij" or "Odrzuć"; a tap opens the list. */
export function ProposalsLayer() {
  const proposals = useProposalsStore((s) => s.proposals);
  const showSheet = useUiStore((s) => s.showSheet);
  return proposals.map((p, i) => (
    <Fragment key={p.id}>
      {/* a front line or trench: its course, the number at its middle */}
      {p.line && (
        <Polyline
          positions={p.line}
          pathOptions={{ color: '#7c3aed', weight: 3, dashArray: '6 6' }}
          eventHandlers={{ click: () => showSheet('history') }}
        />
      )}
      <Marker
        position={[p.lat, p.lng]}
        icon={proposalIcon(i + 1)}
        title={p.title}
        eventHandlers={{ click: () => showSheet('history') }}
      />
    </Fragment>
  ));
}
