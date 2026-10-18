import Box from '@mui/material/Box';
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
      {/* Line Awesome has no filled question mark: a solid disc with the glyph */}
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'text.primary',
          color: 'background.paper',
        }}
      >
        <Icon name="question" size={17} sx={{ fontWeight: 900 }} />
      </Box>
    </IconButton>
  );
}
