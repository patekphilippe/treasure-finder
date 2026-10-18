import IconButton from '@mui/material/IconButton';
import { glass, Icon } from '@/shared/ui';
import { useTutorialStore } from '../store/useTutorialStore';

/** Replays the guided tour. */
export function TutorialButton() {
  const start = useTutorialStore((s) => s.start);

  return (
    <IconButton
      data-tour="help"
      aria-label="Przewodnik po aplikacji"
      onClick={start}
      sx={(theme) => ({ ...glass(theme), width: 44, height: 44, borderRadius: 999 })}
    >
      <Icon name="question" size={22} />
    </IconButton>
  );
}
