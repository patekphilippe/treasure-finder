import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { UXO_WARNING, WAR_GRAVES_WARNING } from '@/features/safety';
import { INTERPRETATIONS } from '@/shared/lib/detect';
import type { Candidate } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { PROTECTED_MESSAGE } from '../config/interpretationStyle';

interface CandidateWhyProps {
  candidate: Candidate;
}

/** "Dlaczego": reasons, alternatives and safety notes in plain Polish. */
export function CandidateWhy({ candidate: c }: CandidateWhyProps) {
  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        Dlaczego
      </Typography>
      <Stack component="ul" sx={{ m: 0, pl: 2.5, gap: 0.25 }}>
        {c.reasons.map((r) => (
          <Typography component="li" key={r} variant="body2">
            {r}
          </Typography>
        ))}
      </Stack>
      {c.alternatives.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          Może to być też:{' '}
          {c.alternatives
            .map(
              (a) =>
                `${INTERPRETATIONS[a.interpretation].label.toLowerCase()} (${Math.round(a.confidence * 100)}%)`,
            )
            .join(', ')}
        </Typography>
      )}
      {c.priority === 'chroniony' && (
        <Alert severity="warning" icon={<Icon name="shield-alt" size={18} />} sx={{ py: 0 }}>
          {PROTECTED_MESSAGE}
        </Alert>
      )}
      {c.flags.uxo && (
        <Alert
          severity="error"
          icon={<Icon name="exclamation-triangle" size={18} />}
          sx={{ py: 0 }}
        >
          {UXO_WARNING}
        </Alert>
      )}
      {c.flags.warGraves && (
        <Alert severity="info" icon={<Icon name="cross" size={18} />} sx={{ py: 0 }}>
          {WAR_GRAVES_WARNING}
        </Alert>
      )}
    </Stack>
  );
}
