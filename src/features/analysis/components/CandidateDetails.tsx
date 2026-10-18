import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Candidate } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { INTERPRETATIONS, PRIORITIES } from '@/shared/lib/detect';
import { INTERPRETATION_STYLE, PROTECTED_MESSAGE } from '../config/interpretationStyle';
import { useCandidateActions } from '../hooks/useCandidateActions';
import { describeCandidate } from '../utils/describeCandidate';

interface CandidateDetailsProps {
  candidate: Candidate;
  onNote: () => void;
  onClose: () => void;
}

export function CandidateDetails({ candidate: c, onNote, onClose }: CandidateDetailsProps) {
  const { accept, reject, restore } = useCandidateActions();
  const label = INTERPRETATIONS[c.interpretation].label;
  const hint = INTERPRETATION_STYLE[c.interpretation].hint;

  return (
    <Box sx={{ px: 2.5, py: 1.5, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1 }}>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 650 }}>
            {label} · {PRIORITIES[c.priority].label.toLowerCase()} · ocena {c.score}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {describeCandidate(c)} · {hint}
          </Typography>
        </Stack>
        <IconButton size="small" aria-label="Zamknij szczegóły" onClick={onClose}>
          <Icon name="times" size={18} />
        </IconButton>
      </Stack>
      {c.priority === 'chroniony' && (
        <Alert severity="warning" icon={<Icon name="shield-alt" size={18} />} sx={{ mt: 1, py: 0 }}>
          {PROTECTED_MESSAGE}
        </Alert>
      )}
      {c.note && (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
          {c.note}
        </Typography>
      )}
      <Stack direction="row" sx={{ gap: 1, mt: 1.5 }}>
        {c.decision === 'przyjety' ? (
          <Button
            sx={{ flex: 1 }}
            variant="outlined"
            color="inherit"
            disabled
            startIcon={<Icon name="check" size={18} />}
          >
            Przyjęty jako punkt do sprawdzenia
          </Button>
        ) : (
          <Button
            sx={{ flex: 1 }}
            variant="contained"
            disabled={c.priority === 'chroniony'}
            startIcon={<Icon name="map-marker-alt" size={18} />}
            onClick={() => accept(c)}
          >
            Przyjmij
          </Button>
        )}
        {c.decision === 'odrzucony' ? (
          <Button
            color="inherit"
            startIcon={<Icon name="undo" size={18} />}
            onClick={() => restore(c)}
          >
            Przywróć
          </Button>
        ) : (
          <Button
            color="inherit"
            startIcon={<Icon name="times" size={18} />}
            onClick={() => reject(c)}
          >
            Odrzuć
          </Button>
        )}
        <IconButton aria-label="Notatka" onClick={onNote}>
          <Icon name="sticky-note" size={20} />
        </IconButton>
      </Stack>
    </Box>
  );
}
