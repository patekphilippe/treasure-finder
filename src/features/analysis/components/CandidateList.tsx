import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Candidate } from '@/shared/types/domain';
import { LIST_LIMIT } from '../config/filters';
import { useCandidateActions } from '../hooks/useCandidateActions';
import { useFieldStatus } from '../hooks/useFieldStatus';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { CandidateListItem } from './CandidateListItem';

interface CandidateListProps {
  candidates: readonly Candidate[];
}

export function CandidateList({ candidates }: CandidateListProps) {
  const selectedId = useAnalysisStore((s) => s.selectedId);
  const { focus } = useCandidateActions();
  const fieldStatus = useFieldStatus();

  if (candidates.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 2 }}>
        Żaden kandydat nie spełnia filtrów. Obniż minimalną ocenę.
      </Typography>
    );
  }
  return (
    <Stack sx={{ py: 0.5 }}>
      {candidates.slice(0, LIST_LIMIT).map((c) => (
        <CandidateListItem
          key={c.id}
          candidate={c}
          selected={c.id === selectedId}
          fieldStatus={fieldStatus.get(c.id)}
          onClick={() => focus(c)}
        />
      ))}
      {candidates.length > LIST_LIMIT && (
        <Typography variant="caption" color="text.secondary" sx={{ px: 2.5, py: 1.5 }}>
          Pokazano {LIST_LIMIT} najlepszych z {candidates.length}, na mapie są wszystkie. Zawęź
          filtry, aby zobaczyć resztę.
        </Typography>
      )}
    </Stack>
  );
}
