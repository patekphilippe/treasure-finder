import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { SheetReliefSection, useAnalysisStore } from '@/features/analysis/field';
import { RoughnessSection } from '@/features/roughness';
import { useTracksStore } from '@/features/tracks';
import { useZonesStore } from '@/features/zones';
import { SWATH_MAX_M, SWATH_MIN_M, useCoverageStore } from '@/shared/store/useCoverageStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, OpacitySlider, Sheet, ToggleRow } from '@/shared/ui';
import { BASE_LAYER_OPTIONS } from '../config/baseLayers';
import { useLayersStore } from '../store/useLayersStore';

interface LayersSheetProps {
  onClose: () => void;
  /** which old map lies on top (history; layers must not import it) */
  oldMaps?: ReactNode;
  /** archival objects on the map (history) */
  contextObjects?: ReactNode;
  /** downloading an area for work without signal (offline) */
  offline?: ReactNode;
}

/**
 * Everything about the map in three plain groups: what is under it, which old map lies on top,
 * and switches for what is drawn on it (only those with something to show); at the end, saving
 * an area for work without signal.
 */
export function LayersSheet({ onClose, oldMaps, contextObjects, offline }: LayersSheetProps) {
  const { baseLayer, nmtOn, nmtOpacity, setBaseLayer, setNmtOn, setNmtOpacity } = useLayersStore();
  const zoneCount = useZonesStore((s) => s.zones.length);
  const showSheet = useUiStore((s) => s.showSheet);
  const searchZonesOn = useLayersStore((s) => s.searchZonesOn);
  const setSearchZonesOn = useLayersStore((s) => s.setSearchZonesOn);
  const { swathM, showCoverage, setSwathM, setShowCoverage } = useCoverageStore();
  const hasTracks = useTracksStore((s) => s.tracks.length > 0);
  const hasSearchZones = useAnalysisStore((s) =>
    s.candidates.some((c) => c.decision === 'przyjety' && c.searchZone),
  );

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

        {oldMaps}

        <Divider />

        <Stack data-tour="layers-on-map" spacing={1}>
          <Stack>
            <Typography variant="overline" color="text.secondary">
              Na mapie
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dotknij, żeby włączyć albo wyłączyć. Zielone widać na mapie.
            </Typography>
          </Stack>
          <ToggleRow
            data-tour="layers-nmt"
            icon="mountain"
            title="Rzeźba terenu"
            caption="Dołki, wały i rowy, także pod lasem"
            checked={nmtOn}
            onChange={setNmtOn}
          >
            <OpacitySlider value={nmtOpacity} onChange={setNmtOpacity} of="rzeźba terenu" />
          </ToggleRow>
          {contextObjects}
          {hasSearchZones && (
            <ToggleRow
              icon="bullseye"
              title="Strefy poszukiwań"
              caption="Miejsca przyjęte w Kandydatach"
              checked={searchZonesOn}
              onChange={setSearchZonesOn}
            />
          )}
          {hasTracks && (
            <ToggleRow
              icon="route"
              title="Przeszukane pasy"
              caption="Gdzie już chodziłeś, widać luki"
              checked={showCoverage}
              onChange={setShowCoverage}
            >
              <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: 88 }}>
                  Szerokość {swathM.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} m
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
          )}
          <RoughnessSection />
          <SheetReliefSection />
          <ToggleRow
            data-tour="layers-zones"
            icon="draw-polygon"
            title="Zgody i zakazy"
            caption={
              zoneCount ? `Wczytane strefy: ${zoneCount}` : 'Tereny ze zgodą właściciela i zakazane'
            }
            onOpen={() => showSheet('zones')}
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
