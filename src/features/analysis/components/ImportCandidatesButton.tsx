import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useRef, useState } from 'react';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { countCandidates } from '@/shared/lib/format';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { Icon, useToastStore } from '@/shared/ui';
import { importCandidatesFile } from '../services/importCandidatesFile';

interface ImportCandidatesButtonProps {
  /** compact = icon only (header); full = labelled button (empty state) */
  variant?: 'compact' | 'full';
}

export function ImportCandidatesButton({ variant = 'compact' }: ImportCandidatesButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const run = async (file: File) => {
    setBusy(true);
    try {
      const r = await importCandidatesFile(file);
      if (r.center)
        useMapViewStore.getState().flyTo({ ...r.center, zoom: 15, offsetY: bottomSheetOffset() });
      showToast(`Nowych: ${countCandidates(r.added)}, zaktualizowanych: ${r.updated}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Nie udało się wczytać pliku');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".geojson,.json,application/geo+json,application/json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void run(file);
          e.target.value = '';
        }}
      />
      {variant === 'compact' ? (
        <Tooltip title="Wczytaj kandydatów (kandydaci.geojson)">
          <span>
            <IconButton
              size="small"
              disabled={busy}
              data-tour="import-candidates"
              aria-label="Wczytaj kandydatów"
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <CircularProgress size={18} /> : <Icon name="file-import" size={20} />}
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Button
          data-tour="import-candidates"
          variant="contained"
          disabled={busy}
          startIcon={busy ? <CircularProgress size={14} /> : <Icon name="file-import" size={18} />}
          onClick={() => inputRef.current?.click()}
        >
          Wczytaj kandydatów
        </Button>
      )}
    </>
  );
}
