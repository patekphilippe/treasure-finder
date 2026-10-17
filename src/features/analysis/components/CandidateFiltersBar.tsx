import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { FormClass } from '@/shared/types/domain';
import { FORM_META } from '../config/forms';
import { useAnalysisStore } from '../store/useAnalysisStore';

const FORMS = Object.keys(FORM_META) as FormClass[];

export function CandidateFiltersBar() {
  const filters = useAnalysisStore((s) => s.filters);
  const setFilters = useAnalysisStore((s) => s.setFilters);

  const toggleForm = (form: FormClass) =>
    setFilters({
      forms: filters.forms.includes(form)
        ? filters.forms.filter((f) => f !== form)
        : [...filters.forms, form],
    });

  return (
    <Stack spacing={1} sx={{ px: 2.5, pb: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Ocena ≥ {filters.minScore}
        </Typography>
        <Slider
          size="small"
          min={0}
          max={100}
          step={5}
          value={filters.minScore}
          onChange={(_, v) => setFilters({ minScore: v as number })}
          aria-label="Minimalna ocena"
        />
      </Stack>
      <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap' }}>
        {FORMS.map((form) => {
          const on = filters.forms.includes(form);
          return (
            <Chip
              key={form}
              size="small"
              label={FORM_META[form].label}
              onClick={() => toggleForm(form)}
              variant={on ? 'filled' : 'outlined'}
              sx={{
                borderRadius: '8px',
                ...(on && { bgcolor: FORM_META[form].color, color: '#fff' }),
              }}
            />
          );
        })}
        <Chip
          size="small"
          label="Chronione"
          variant={filters.showProtected ? 'filled' : 'outlined'}
          onClick={() => setFilters({ showProtected: !filters.showProtected })}
          sx={{ borderRadius: '8px' }}
        />
        <Chip
          size="small"
          label="Odrzucone"
          variant={filters.showRejected ? 'filled' : 'outlined'}
          onClick={() => setFilters({ showRejected: !filters.showRejected })}
          sx={{ borderRadius: '8px' }}
        />
      </Stack>
    </Stack>
  );
}
