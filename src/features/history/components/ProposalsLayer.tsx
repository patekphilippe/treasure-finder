import { Marker } from 'react-leaflet';
import { useUiStore } from '@/shared/store/useUiStore';
import { useProposalsStore } from '../store/useProposalsStore';
import { proposalIcon } from '../utils/proposalIcon';

/** AI proposals waiting for "Przyjmij" or "Odrzuć"; a tap opens the list. */
export function ProposalsLayer() {
  const proposals = useProposalsStore((s) => s.proposals);
  const showSheet = useUiStore((s) => s.showSheet);
  return proposals.map((p, i) => (
    <Marker
      key={p.id}
      position={[p.lat, p.lng]}
      icon={proposalIcon(i + 1)}
      title={p.title}
      eventHandlers={{ click: () => showSheet('history') }}
    />
  ));
}
