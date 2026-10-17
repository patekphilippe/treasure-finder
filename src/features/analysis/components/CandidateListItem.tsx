import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';
import type { Candidate } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { FORM_META, PROTECTED_COLOR } from '../config/forms';
import { describeCandidate } from '../utils/describeCandidate';

interface CandidateListItemProps {
  candidate: Candidate;
  selected: boolean;
  onClick: () => void;
}

export function CandidateListItem({ candidate: c, selected, onClick }: CandidateListItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const meta = FORM_META[c.form];
  const color = c.protectedLikely ? PROTECTED_COLOR : meta.color;

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
        <Icon name={c.protectedLikely ? 'shield-alt' : meta.icon} size={18} />
      </Box>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {meta.label}
          {c.decision === 'przyjety' && (
            <Icon
              name="check-circle"
              size={15}
              sx={{ color: 'primary.main', ml: 0.5, verticalAlign: '-2px' }}
            />
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {describeCandidate(c)}
        </Typography>
      </Stack>
      <Typography
        variant="subtitle2"
        sx={{ minWidth: 28, textAlign: 'right', color: 'text.secondary' }}
      >
        {c.score}
      </Typography>
    </ButtonBase>
  );
}
