import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useRef } from 'react';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { Icon, useToastStore } from '@/shared/ui';
import { AnalysisCancelled, runSheetAnalysis } from '../services/runSheetAnalysis';
import { saveSheetResults } from '../services/saveSheetResults';
import { useAnalysisStore } from '../store/useAnalysisStore';

interface LoadSheetButtonProps {
  variant?: 'compact' | 'full';
}

/** Picks an NMT sheet (.asc / GeoTIFF), interprets it in a worker and stores the candidates. */
export function LoadSheetButton({ variant = 'compact' }: LoadSheetButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useAnalysisStore((s) => s.run !== null);
  const showToast = useToastStore((s) => s.show);

  const analyse = async (file: File) => {
    try {
      const { sheet, candidates, exclusion } = await runSheetAnalysis(file);
      useAnalysisStore.getState().setExclusion(
        exclusion && {
          ...exclusion,
          sheetId: sheet.sheetId,
          originE: sheet.originE,
          originN: sheet.originN,
          res: sheet.cell,
          w: sheet.cols,
          h: sheet.rows,
        },
      );
      const { added } = await saveSheetResults(sheet.sheetId, candidates);
      const best = useAnalysisStore
        .getState()
        .candidates.filter(
          (c) =>
            c.sheetId === sheet.sheetId &&
            c.priority !== 'naturalne' &&
            c.interpretation !== 'nieokreslona',
        )
        .sort((a, b) => b.score - a.score)[0];
      if (best)
        useMapViewStore
          .getState()
          .flyTo({ lat: best.lat, lng: best.lng, zoom: 15, offsetY: bottomSheetOffset() });
      const failed = exclusion?.groups.filter((g) => g.status === 'error').map((g) => g.label);
      showToast(
        `Arkusz ${sheet.sheetId}: ${candidates.length} form, nowych ${Math.max(0, added)}` +
          (failed?.length ? `. BDOT10k nie pobrano: ${failed.join(', ')}` : ''),
      );
    } catch (e) {
      if (!(e instanceof AnalysisCancelled))
        showToast(e instanceof Error ? e.message : 'Analiza nie powiodła się');
    }
  };

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
          if (file) void analyse(file);
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
