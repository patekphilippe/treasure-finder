import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { glass } from '../styles/glass';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** keeps the sheet (and its state) mounted but invisible */
  hidden?: boolean;
}

/** Floating card that slides up above the dock. */
export function Sheet({ title, onClose, children, hidden = false }: SheetProps) {
  return (
    <Slide direction="up" in mountOnEnter appear>
      <Box
        sx={{
          position: 'absolute',
          zIndex: 1050,
          left: 12,
          right: 12,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)',
          display: hidden ? 'none' : 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Paper
          component="section"
          data-tour="sheet"
          aria-label={title}
          sx={(theme) => ({
            ...glass(theme),
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 440,
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
          })}
        >
          <Box
            sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mt: 1 }}
          />
          <Stack direction="row" sx={{ alignItems: 'center', px: 2.5, pt: 1, pb: 0.5 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {title}
            </Typography>
            <IconButton size="small" onClick={onClose} aria-label="Zamknij">
              <Icon name="times" size={20} />
            </IconButton>
          </Stack>
          <Box sx={{ overflowY: 'auto', px: 2.5, pb: 2.5 }}>{children}</Box>
        </Paper>
      </Box>
    </Slide>
  );
}
