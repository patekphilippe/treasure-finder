import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { HISTORICAL_LAYERS, ORTHO_ARCHIVE_ID } from '@/features/layers';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { Icon, useToastStore } from '@/shared/ui';
import type { AiModelId } from '../config/aiReading';
import type { ViewSource } from '../services/captureView';
import { compareMaps } from '../services/compareMaps';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { useProposalsStore } from '../store/useProposalsStore';

interface CompareMapsProps {
  source: ViewSource;
  model: AiModelId;
  member: boolean;
  /** comparison reads topographic maps only */
  topographic: boolean;
}

/**
 * "Porównaj widok": the visible view read on the current map and on a second one, so what
 * both show is surer and what only one shows appeared or vanished between them. Members only.
 */
export function CompareMaps({ source, model, member, topographic }: CompareMapsProps) {
  const maps = useOwnMapsStore((s) => s.maps);
  const { step, set } = useProposalsStore();
  const showToast = useToastStore((s) => s.show);
  const [other, setOther] = useState('');

  if (!member)
    return (
      <Typography variant="caption" color="text.secondary">
        Porównanie widoku na dwóch mapach jest dla członków społeczności.
      </Typography>
    );

  // an orthophoto has no map symbols to compare
  const options: ViewSource[] = [
    ...maps.map((m): ViewSource => ({ kind: 'own', map: m, label: `${m.name} (własna mapa)` })),
    ...HISTORICAL_LAYERS.filter((l) => l.id !== ORTHO_ARCHIVE_ID).map((l): ViewSource => ({
      kind: 'wms',
      layer: l,
      year: 0,
      label: `${l.label} (${l.years})`,
    })),
  ].filter((o) => o.label !== source.label);
  const chosen = options.find((o) => o.label === other) ?? null;

  const run = async () => {
    const bounds = useMapViewStore.getState().bounds;
    if (!bounds || !chosen) return;
    set({ step: 'Start', proposals: [], usage: null, read: null });
    try {
      const r = await compareMaps(bounds, source, chosen, model, (s) => set({ step: s }));
      set({ proposals: r.proposals, usage: r.usage, read: r.read });
      showToast(
        r.proposals.length ? `Propozycje: ${r.proposals.length}` : 'Nic nowego w tym widoku',
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Porównanie nie powiodło się');
    } finally {
      set({ step: null });
    }
  };

  return (
    <Stack data-tour="ai-compare" spacing={1}>
      <TextField
        select
        size="small"
        label="Porównaj widok z mapą"
        value={chosen ? other : ''}
        disabled={!topographic}
        onChange={(e) => setOther(e.target.value)}
        helperText={topographic ? undefined : 'Porównanie działa dla map topograficznych'}
      >
        {options.map((o) => (
          <MenuItem key={o.label} value={o.label}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        disabled={!topographic || !chosen || Boolean(step)}
        startIcon={<Icon name="columns" size={18} />}
        onClick={() => void run()}
      >
        Porównaj widok (2 odczyty)
      </Button>
    </Stack>
  );
}
