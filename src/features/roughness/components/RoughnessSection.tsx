import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, OpacitySlider, ToggleRow } from '@/shared/ui';
import { useAreasStore } from '../store/useAreasStore';
import { useRoughnessStore } from '../store/useRoughnessStore';
import { AreaListItem } from './AreaListItem';

const LIST_LIMIT = 30;

/**
 * Warstwy: uneven ground on the map (the last analysis, counted in Analizy) and the numbered
 * places marked from it, each as one switch; nothing until something was counted.
 */
export function RoughnessSection() {
  const { status, result, visible, opacity, clear, setVisible, setOpacity } = useRoughnessStore();
  const areas = useAreasStore((s) => s.areas);
  const placesVisible = useAreasStore((s) => s.visible);
  const setPlacesVisible = useAreasStore((s) => s.setVisible);
  const showArea = useUiStore((s) => s.showArea);
  const showAnalyses = useUiStore((s) => s.showAnalyses);
  const [listOpen, setListOpen] = useState(false);

  const sorted = [...areas].sort((a, b) => b.strength - a.strength);
  // nothing counted yet: no tile (the analysis is in Analizy)
  if (!result && status !== 'loading' && areas.length === 0) return null;

  return (
    <>
      {result ? (
        <ToggleRow
          icon="fire"
          title="Teren nierówny"
          caption="Gdzie jest dużo dołków, kopców i rowów"
          checked={visible}
          onChange={setVisible}
        >
          <OpacitySlider value={opacity} onChange={setOpacity} min={0.2} of="teren nierówny" />
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={<Icon name="microscope" size={16} />}
              onClick={() => showAnalyses('roughness')}
            >
              Policz od nowa
            </Button>
            <Button size="small" color="inherit" onClick={clear}>
              Usuń wynik
            </Button>
          </Stack>
        </ToggleRow>
      ) : (
        status === 'loading' && (
          <ToggleRow
            icon="fire"
            title="Teren nierówny"
            caption="Liczy się teraz. Dotknij, żeby zobaczyć postęp."
            onOpen={() => showAnalyses('roughness')}
          />
        )
      )}
      {areas.length > 0 && (
        <ToggleRow
          icon="dot-circle"
          title={`Miejsca do sprawdzenia (${areas.length})`}
          caption="Kółka z numerami na mapie"
          checked={placesVisible}
          onChange={setPlacesVisible}
        >
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            aria-expanded={listOpen}
            startIcon={<Icon name={listOpen ? 'angle-up' : 'list-ul'} size={16} />}
            onClick={() => setListOpen(!listOpen)}
            sx={{ alignSelf: 'flex-start' }}
          >
            {listOpen ? 'Schowaj listę' : 'Pokaż listę'}
          </Button>
          <Collapse in={listOpen}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Wskazówki, gdzie patrzeć. Formy terenu rozpoznaje dopiero arkusz NMT w Analizach.
            </Typography>
            {sorted.slice(0, LIST_LIMIT).map((a) => (
              <AreaListItem key={a.id} area={a} onClick={() => showArea(a.id)} />
            ))}
          </Collapse>
        </ToggleRow>
      )}
    </>
  );
}
