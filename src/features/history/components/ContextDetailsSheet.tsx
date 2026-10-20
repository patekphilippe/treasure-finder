import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { HISTORICAL_LAYERS } from '@/features/layers';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { ConfirmDialog, Icon, Sheet } from '@/shared/ui';
import { CONTEXT_KINDS } from '../config/contextKinds';
import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { knownMaps } from '../utils/knownMaps';
import { representativePoint } from '../utils/representativePoint';
import { sightingsOf } from '../utils/sightingsOf';
import { CommunityObjectBlock } from './CommunityObjectBlock';
import { SightingRow } from './SightingRow';

interface ContextDetailsSheetProps {
  onClose: () => void;
}

export function ContextDetailsSheet({ onClose }: ContextDetailsSheetProps) {
  const id = useUiStore((s) => s.selectedContextId);
  const feature = useContextStore((s) => s.features.find((f) => f.id === id));
  const remove = useContextStore((s) => s.remove);
  const ownMaps = useOwnMapsStore((s) => s.maps);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const [confirm, setConfirm] = useState(false);
  const sightings = useMemo(
    () => (feature ? sightingsOf(feature, knownMaps(HISTORICAL_LAYERS, ownMaps)) : []),
    [feature, ownMaps],
  );
  if (!feature) return null;
  const kind = CONTEXT_KINDS[feature.kind];
  const at = representativePoint(feature.geometry);

  return (
    <Sheet title={kind.label} onClose={onClose}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {feature.label || feature.source || 'brak opisu'}
          </Typography>
          {at && (
            <IconButton
              aria-label="Pokaż na mapie"
              onClick={() => flyTo({ ...at, zoom: 17, offsetY: bottomSheetOffset() })}
            >
              <Icon name="search" size={22} />
            </IconButton>
          )}
          {/* objects of others belong to the community: dispute them instead of deleting */}
          {(!feature.community || feature.community.mineAuthor) && (
            <IconButton aria-label="Usuń obiekt" color="error" onClick={() => setConfirm(true)}>
              <Icon name="trash-alt" size={22} />
            </IconButton>
          )}
        </Stack>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Widziany na mapach ({sightings.length})
          </Typography>
          {sightings.map((s, i) => (
            <SightingRow key={i} sighting={s} at={at} />
          ))}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Obiekt liczy się w analizie NMT zawsze, bez względu na widoczną mapę.{' '}
          {feature.kind === 'grob_wojenny'
            ? 'Kandydaci do 150 m dostają ostrzeżenie, a do 50 m są chronieni.'
            : feature.kind === 'wojsko'
              ? 'Kandydaci do 300 m dostają wyższy wynik i ostrzeżenie o niewybuchach.'
              : 'Kandydaci w pobliżu dostają wyższy wynik (osada do 400 m, młyn i karczma do 300 m, bród do 200 m).'}
        </Typography>
        <CommunityObjectBlock feature={feature} />
      </Stack>
      <ConfirmDialog
        open={confirm}
        title={`Usunąć: ${kind.label.toLowerCase()}?`}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await remove(feature.id);
          setConfirm(false);
          onClose();
        }}
      />
    </Sheet>
  );
}
