import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, ToggleRow } from '@/shared/ui';
import { useAreasStore } from '../store/useAreasStore';
import { useRoughnessStore } from '../store/useRoughnessStore';
import { AreaListItem } from './AreaListItem';

const LIST_LIMIT = 30;

/**
 * Warstwy: uneven ground on the map (the last analysis, counted in Analizy) and the numbered
 * places marked from it, each as one switch.
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

  return (
    <>
      <ToggleRow
        data-tour="layers-roughness"
        icon="fire"
        title="Teren nierówny"
        caption={
          result
            ? 'Gdzie jest dużo dołków, kopców i rowów'
            : status === 'loading'
              ? 'Liczy się w Analizach'
              : 'Najpierw policz go w Analizach'
        }
        checked={result !== null && visible}
        onChange={result ? setVisible : undefined}
        action={
          result ? undefined : (
            <Button size="small" color="inherit" onClick={() => showAnalyses('roughness')}>
              {status === 'loading' ? 'Zobacz' : 'Policz'}
            </Button>
          )
        }
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            Krycie
          </Typography>
          <Slider
            size="small"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(_, v) => setOpacity(v as number)}
            aria-label="Krycie terenu nierównego"
          />
        </Stack>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button
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
      {areas.length > 0 && (
        <ToggleRow
          icon="dot-circle"
          title={`Miejsca do sprawdzenia (${areas.length})`}
          caption="Kółka z numerami z terenu nierównego"
          checked={placesVisible}
          onChange={setPlacesVisible}
        >
          <ButtonBase
            onClick={() => setListOpen(!listOpen)}
            aria-expanded={listOpen}
            sx={{ justifyContent: 'flex-start', gap: 0.5, borderRadius: '8px', py: 0.5 }}
          >
            <Typography variant="body2">{listOpen ? 'Schowaj listę' : 'Pokaż listę'}</Typography>
            <Icon name={listOpen ? 'angle-up' : 'angle-down'} size={16} />
          </ButtonBase>
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
