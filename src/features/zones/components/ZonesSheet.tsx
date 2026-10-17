import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { createId } from '@/shared/lib/createId';
import { useUiStore } from '@/shared/store/useUiStore';
import type { Zone } from '@/shared/types/domain';
import { EmptyState, Icon, Sheet, useToastStore } from '@/shared/ui';
import { useZonesStore } from '../store/useZonesStore';
import { ZoneListItem } from './ZoneListItem';

interface ZonesSheetProps {
  onClose: () => void;
}

export function ZonesSheet({ onClose }: ZonesSheetProps) {
  const zones = useZonesStore((s) => s.zones);
  const saveMany = useZonesStore((s) => s.saveMany);
  const showZone = useUiStore((s) => s.showZone);
  const showToast = useToastStore((s) => s.show);
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Zone['kind']>('zgoda');
  const [busy, setBusy] = useState(false);

  const importFile = async (file: File) => {
    setBusy(true);
    try {
      const { importZonesGeoJSON, ImportError } = await import('@/shared/lib/io');
      let json: unknown;
      try {
        json = JSON.parse(await file.text());
      } catch {
        throw new ImportError('Plik nie jest poprawnym GeoJSON');
      }
      const { zones: imported } = importZonesGeoJSON(json, kind, createId);
      await saveMany(imported);
      showToast(`Dodano strefy: ${imported.length}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Nie udało się wczytać stref');
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...zones].sort(
    (a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
  );

  return (
    <Sheet title="Strefy" onClose={onClose}>
      <Stack spacing={2}>
        {sorted.length === 0 ? (
          <EmptyState
            icon="draw-polygon"
            title="Brak stref"
            description="Narysuj w QGIS poligony terenów ze zgodą właściciela i miejsc, gdzie szukać nie wolno (stanowiska, rezerwaty), i zapisz je jako GeoJSON w EPSG:4326."
          />
        ) : (
          <Stack>
            {sorted.map((z) => (
              <ZoneListItem key={z.id} zone={z} onClick={() => showZone(z.id)} />
            ))}
          </Stack>
        )}
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Import z QGIS
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={kind}
            onChange={(_, v: Zone['kind'] | null) => v && setKind(v)}
            sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 999 }}
          >
            <ToggleButton value="zgoda">Zgoda właściciela</ToggleButton>
            <ToggleButton value="zakaz">Zakaz</ToggleButton>
          </ToggleButtonGroup>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".geojson,.json,application/geo+json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFile(file);
              e.target.value = '';
            }}
          />
          <Button
            variant="outlined"
            color="inherit"
            disabled={busy}
            startIcon={
              busy ? <CircularProgress size={16} /> : <Icon name="file-import" size={20} />
            }
            onClick={() => inputRef.current?.click()}
          >
            Importuj poligony ({kind === 'zgoda' ? 'zgoda' : 'zakaz'})
          </Button>
        </Stack>
      </Stack>
    </Sheet>
  );
}
