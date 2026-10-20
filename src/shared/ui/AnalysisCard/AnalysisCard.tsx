import Box, { type BoxProps } from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useUiStore, type AnalysesCardId } from '@/shared/store/useUiStore';
import { Icon } from '../Icon/Icon';

interface AnalysisCardProps extends Omit<BoxProps, 'title'> {
  card: AnalysesCardId;
  icon: string;
  title: string;
  /** what the analysis needs, e.g. "plik .asc albo GeoTIFF z Geoportalu" */
  needs: string;
  /** state in one line: running, the last result, or what is missing */
  status?: ReactNode;
  children: ReactNode;
}

/**
 * One analysis in the Analizy sheet: what it is and needs, its state, and (opened) its controls.
 * One card is open at a time; a closed card unmounts its content (e.g. a Turnstile widget).
 */
export function AnalysisCard({
  card,
  icon,
  title,
  needs,
  status,
  children,
  sx,
  ...rest
}: AnalysisCardProps) {
  const open = useUiStore((s) => s.analysesCard === card);
  const toggle = useUiStore((s) => s.toggleAnalysesCard);
  return (
    <Box
      sx={[
        { border: 1, borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      <ButtonBase
        onClick={() => toggle(card)}
        aria-expanded={open}
        sx={{ width: '100%', textAlign: 'left', p: 1.5, gap: 1.5, alignItems: 'flex-start' }}
      >
        <Box sx={{ color: 'primary.main', pt: 0.25 }}>
          <Icon name={icon} size={24} />
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{title}</Typography>
          <Typography variant="caption" color="text.secondary">
            Potrzebne: {needs}
          </Typography>
          {status && (
            <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600 }}>
              {status}
            </Typography>
          )}
        </Stack>
        <Icon name={open ? 'angle-up' : 'angle-down'} size={18} />
      </ButtonBase>
      <Collapse in={open} unmountOnExit>
        <Stack spacing={1.25} sx={{ px: 1.5, pb: 1.5 }}>
          {children}
        </Stack>
      </Collapse>
    </Box>
  );
}
