import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useRef } from 'react';
import { Icon } from '@/shared/ui';
import { analyseSheetFile } from '../services/analyseSheetFile';
import { useAnalysisStore } from '../store/useAnalysisStore';

interface LoadSheetButtonProps {
  variant?: 'compact' | 'full';
}

/** Picks an NMT sheet (.asc / GeoTIFF), interprets it in a worker and stores the candidates. */
export function LoadSheetButton({ variant = 'compact' }: LoadSheetButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useAnalysisStore((s) => s.run !== null);

  const open = () => inputRef.current?.click();
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".asc,.tif,.tiff,image/tiff"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void analyseSheetFile(file);
          e.target.value = '';
        }}
      />
      {variant === 'compact' ? (
        <Tooltip title="Wczytaj arkusz NMT (.asc, GeoTIFF)">
          <span>
            <IconButton
              size="small"
              data-tour="load-sheet"
              aria-label="Wczytaj arkusz NMT"
              disabled={busy}
              onClick={open}
            >
              <Icon name="file-upload" size={20} />
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Button
          data-tour="load-sheet"
          variant="contained"
          disabled={busy}
          startIcon={<Icon name="file-upload" size={18} />}
          onClick={open}
        >
          Wczytaj arkusz NMT
        </Button>
      )}
    </>
  );
}
