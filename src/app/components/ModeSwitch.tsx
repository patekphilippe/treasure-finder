import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { glass, Icon } from '@/shared/ui';
import { useUiStore, type AppMode } from '@/shared/store/useUiStore';

export function ModeSwitch() {
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);

  return (
    <Paper data-tour="mode-switch" sx={(theme) => ({ ...glass(theme), p: 0.5, borderRadius: 999 })}>
      <ToggleButtonGroup
        exclusive
        size="small"
        aria-label="Tryb pracy"
        value={mode}
        onChange={(_, value: AppMode | null) => value && setMode(value)}
      >
        <ToggleButton value="field" sx={{ gap: 0.75 }}>
          <Icon name="walking" size={18} />
          Teren
        </ToggleButton>
        <ToggleButton value="analysis" sx={{ gap: 0.75 }}>
          <Icon name="microscope" size={18} />
          Analiza
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}
