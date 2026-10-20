import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { glass, Icon } from '@/shared/ui';
import { useMapCreditsStore } from '../store/useMapCreditsStore';

/**
 * ⓘ next to the GPS chip: where the map data comes from (OSM, GUGiK, UMWD), as the licences ask.
 * Open when the map appears, folded after 5 s or at the first touch (hooks/useMapCredits.ts).
 */
export function MapCredits() {
  const credits = useMapCreditsStore((s) => s.credits);
  const open = useMapCreditsStore((s) => s.open);
  const setOpen = useMapCreditsStore((s) => s.setOpen);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (!credits.length) return null;

  return (
    <>
      <ButtonBase
        ref={setAnchor}
        data-tour="map-credits"
        aria-label={open ? 'Zwiń źródła danych mapy' : 'Źródła danych mapy'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        sx={(theme) => ({
          ...glass(theme),
          width: 24,
          height: 24,
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        })}
      >
        <Icon name="info-circle" size={20} />
      </ButtonBase>
      <Popper
        open={open && anchor !== null}
        anchorEl={anchor}
        placement="bottom-start"
        modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}
        sx={{ zIndex: 1100 }}
      >
        <Paper
          sx={(theme) => ({
            ...glass(theme),
            maxWidth: 'min(calc(100vw - 24px), 360px)',
            px: 1.25,
            py: 0.75,
            borderRadius: '10px',
          })}
        >
          <Stack
            spacing={0.25}
            sx={{ typography: 'caption', color: 'text.secondary', '& a': { color: 'inherit' } }}
          >
            {credits.map((c) => (
              // the layers' own credit strings from our config (OSM, GUGiK, UMWD)
              <Box key={c} component="span" dangerouslySetInnerHTML={{ __html: c }} />
            ))}
          </Stack>
        </Paper>
      </Popper>
    </>
  );
}
