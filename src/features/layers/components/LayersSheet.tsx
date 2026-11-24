import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { SheetReliefSection } from '@/features/analysis/field';
import { RoughnessSection } from '@/features/roughness';
import { useZonesStore } from '@/features/zones';
import { SWATH_MAX_M, SWATH_MIN_M, useCoverageStore } from '@/shared/store/useCoverageStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, Sheet, ToggleRow } from '@/shared/ui';
import { BASE_LAYER_OPTIONS } from '../config/baseLayers';
import { useLayersStore } from '../store/useLayersStore';
import { HistoricalSection } from './HistoricalSection';

interface LayersSheetProps {
  onClose: () => void;
  /** own maps shown or hidden (history; layers must not import it) */
  ownMaps?: ReactNode;
  /** the time slider over all historical maps (history) */
  timeline?: ReactNode;
  /** archival objects on the map (history) */
  contextObjects?: ReactNode;
  /** downloading an area for work without signal (offline) */
  offline?: ReactNode;
}

/**
 * Everything about the map in three plain groups: what is under it, old maps, and a list of
 * switches for what is drawn on it; at the end, saving an area for work without signal.
 */
export function LayersSheet({
  onClose,
  ownMaps,
  timeline,
  contextObjects,
  offline,
}: LayersSheetProps) {
  const { baseLayer, nmtOn, nmtOpacity, setBaseLayer, setNmtOn, setNmtOpacity } = useLayersStore();
  const zoneCount = useZonesStore((s) => s.zones.length);
  const showSheet = useUiStore((s) => s.showSheet);
  const searchZonesOn = useLayersStore((s) => s.searchZonesOn);
  const setSearchZonesOn = useLayersStore((s) => s.setSearchZonesOn);
  const { swathM, showCoverage, setSwathM, setShowCoverage } = useCoverageStore();

  return (
    <Sheet title="Warstwy" onClose={onClose}>
      <Stack spacing={2.5}>
        <Stack data-tour="layers-base" spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Tło mapy
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={baseLayer}
            onChange={(_, value) => value && setBaseLayer(value)}
            sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 999 }}
          >
            {BASE_LAYER_OPTIONS.map((opt) => (
              <ToggleButton key={opt.id} value={opt.id} sx={{ gap: 1 }}>
                <Icon name={opt.icon} size={18} />
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Divider />

        <HistoricalSection timeline={timeline} ownMaps={ownMaps} />

        <Divider />

        <Stack>
          <Typography variant="overline" color="text.secondary">
            Na mapie
          </Typography>
          <ToggleRow
            data-tour="layers-nmt"
            icon="mountain"
            title="Rzeźba terenu"
            caption="Dołki, wały i rowy, także pod lasem"
            checked={nmtOn}
            onChange={setNmtOn}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                Krycie
              </Typography>
              <Slider
                size="small"
                min={0.1}
                max={1}
                step={0.05}
                value={nmtOpacity}
                onChange={(_, value) => setNmtOpacity(value as number)}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                aria-label="Krycie rzeźby terenu"
              />
            </Stack>
          </ToggleRow>
          {contextObjects}
          <ToggleRow
            data-tour="layers-search-zones"
            icon="bullseye"
            title="Strefy poszukiwań"
            caption="Miejsca przyjęte w Kandydatach"
            checked={searchZonesOn}
            onChange={setSearchZonesOn}
          />
          <ToggleRow
            data-tour="layers-coverage"
            icon="route"
            title="Przeszukane pasy"
            caption="Twoje trasy jako pasy: widać, gdzie jeszcze nie byłeś"
            checked={showCoverage}
            onChange={setShowCoverage}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                Pas {swathM.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} m
              </Typography>
              <Slider
                size="small"
                min={SWATH_MIN_M}
                max={SWATH_MAX_M}
                step={0.1}
                value={swathM}
                onChange={(_, v) => setSwathM(v as number)}
                aria-label="Szerokość pasa przeszukania"
              />
            </Stack>
          </ToggleRow>
          <RoughnessSection />
          <SheetReliefSection />
          <ToggleRow
            data-tour="layers-zones"
            icon="draw-polygon"
            title="Zgody i zakazy"
            caption={
              zoneCount ? `Wczytane strefy: ${zoneCount}` : 'Tereny ze zgodą właściciela i zakazane'
            }
            action={
              <Button size="small" color="inherit" onClick={() => showSheet('zones')}>
                Otwórz
              </Button>
            }
          />
        </Stack>

        {offline && (
          <>
            <Divider />
            {offline}
          </>
        )}
      </Stack>
    </Sheet>
  );
}
