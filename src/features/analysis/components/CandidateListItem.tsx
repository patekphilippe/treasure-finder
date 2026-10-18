import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';
import { POINT_STATUS_LABELS } from '@/features/points';
import { INTERPRETATIONS, PRIORITIES } from '@/shared/lib/detect';
import type { Candidate, PointStatus } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { INTERPRETATION_STYLE, PRIORITY_COLOR } from '../config/interpretationStyle';

interface CandidateListItemProps {
  candidate: Candidate;
  selected: boolean;
  /** result of checking the accepted candidate in the field */
  fieldStatus?: PointStatus;
  onClick: () => void;
}

/** Row: interpretation and confidence, priority, score; red triangle for UXO risk. */
export function CandidateListItem({
  candidate: c,
  selected,
  fieldStatus,
  onClick,
}: CandidateListItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const color = PRIORITY_COLOR[c.priority];

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <ButtonBase
      ref={ref}
      onClick={onClick}
      sx={(theme) => ({
        width: '100%',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.25,
        px: 2.5,
        py: 1,
        opacity: c.decision === 'odrzucony' ? 0.5 : 1,
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
        '&:hover': { bgcolor: selected ? alpha(theme.palette.primary.main, 0.16) : 'action.hover' },
      })}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: '8px',
          display: 'grid',
          placeItems: 'center',
          color,
          bgcolor: alpha(color, 0.14),
        }}
      >
        <Icon
          name={
            c.priority === 'chroniony' ? 'shield-alt' : INTERPRETATION_STYLE[c.interpretation].icon
          }
          size={18}
        />
      </Box>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {INTERPRETATIONS[c.interpretation].label}
          <Typography component="span" variant="caption" color="text.secondary">
            {' '}
            {Math.round(c.confidence * 100)}%
          </Typography>
          {c.flags.uxo && (
            <Icon
              name="exclamation-triangle"
              size={15}
              sx={{ color: 'error.main', ml: 0.5, verticalAlign: '-2px' }}
            />
          )}
          {c.decision === 'przyjety' && (
            <Icon
              name="check-circle"
              size={15}
              sx={{ color: 'primary.main', ml: 0.5, verticalAlign: '-2px' }}
            />
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {fieldStatus && fieldStatus !== 'do_sprawdzenia'
            ? `Teren: ${POINT_STATUS_LABELS[fieldStatus].toLowerCase()}`
            : c.needsRecompute
              ? 'Przelicz arkusz ponownie'
              : (c.reasons[0] ?? '')}
        </Typography>
      </Stack>
      <Stack sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
          {PRIORITIES[c.priority].label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ocena {c.score}
        </Typography>
      </Stack>
    </ButtonBase>
  );
}
