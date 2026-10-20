import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { ConfirmDialog, Icon, Sheet } from '@/shared/ui';
import { CONTEXT_KINDS } from '../config/contextKinds';
import { useContextStore } from '../store/useContextStore';
import { representativePoint } from '../utils/representativePoint';
import { CommunityObjectBlock } from './CommunityObjectBlock';

interface ContextDetailsSheetProps {
  onClose: () => void;
}

export function ContextDetailsSheet({ onClose }: ContextDetailsSheetProps) {
  const id = useUiStore((s) => s.selectedContextId);
  const feature = useContextStore((s) => s.features.find((f) => f.id === id));
  const remove = useContextStore((s) => s.remove);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const [confirm, setConfirm] = useState(false);
  if (!feature) return null;
  const kind = CONTEXT_KINDS[feature.kind];
  const at = representativePoint(feature.geometry);

  return (
    <Sheet title={kind.label} onClose={onClose}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Obiekt z mapy archiwalnej. Kandydaci z analizy NMT w pobliżu dostają wyższy wynik (osada
          do 400 m, młyn i karczma do 300 m, bród do 200 m).
        </Typography>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <Icon name="book" size={20} />
          <Typography variant="body2" sx={{ flex: 1 }}>
            Źródło: {feature.source || 'brak opisu'}
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
