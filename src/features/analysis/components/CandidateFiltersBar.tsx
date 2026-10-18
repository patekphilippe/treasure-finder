import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { INTERPRETATIONS, PRIORITIES } from '@/shared/lib/detect';
import type { Interpretation, Priority } from '@/shared/types/domain';
import { PRIORITY_COLOR } from '../config/interpretationStyle';
import { useAnalysisStore } from '../store/useAnalysisStore';

const SEARCHABLE: Priority[] = ['najwyzszy', 'wysoki', 'sredni', 'niski'];
const ALL_INTERPRETATIONS = Object.keys(INTERPRETATIONS) as Interpretation[];

export function CandidateFiltersBar() {
  const filters = useAnalysisStore((s) => s.filters);
  const setFilters = useAnalysisStore((s) => s.setFilters);

  const togglePriority = (p: Priority) =>
    setFilters({
      priorities: filters.priorities.includes(p)
        ? filters.priorities.filter((x) => x !== p)
        : [...filters.priorities, p],
    });
  const toggle = (label: string, on: boolean, onClick: () => void) => (
    <Chip
      size="small"
      label={label}
      variant={on ? 'filled' : 'outlined'}
      onClick={onClick}
      sx={{ borderRadius: '8px' }}
    />
  );

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
      <Select
        multiple
        size="small"
        displayEmpty
        value={filters.interpretations}
        onChange={(e) => setFilters({ interpretations: e.target.value as Interpretation[] })}
        renderValue={(v) =>
          v.length === 0
            ? 'Wszystkie interpretacje'
            : v.map((i) => INTERPRETATIONS[i].label).join(', ')
        }
        sx={{ fontSize: 13, borderRadius: '10px' }}
        aria-label="Interpretacje"
      >
        {ALL_INTERPRETATIONS.map((i) => (
          <MenuItem key={i} value={i} dense>
            <Checkbox size="small" checked={filters.interpretations.includes(i)} />
            <ListItemText primary={INTERPRETATIONS[i].label} />
          </MenuItem>
        ))}
      </Select>
      <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap' }}>
        {SEARCHABLE.map((p) => {
          const on = filters.priorities.includes(p);
          return (
            <Chip
              key={p}
              size="small"
              label={PRIORITIES[p].label}
              onClick={() => togglePriority(p)}
              variant={on ? 'filled' : 'outlined'}
              sx={{ borderRadius: '8px', ...(on && { bgcolor: PRIORITY_COLOR[p], color: '#fff' }) }}
            />
          );
        })}
        {toggle('Chronione', filters.showProtected, () =>
          setFilters({ showProtected: !filters.showProtected }),
        )}
        {toggle('Naturalne', filters.showNatural, () =>
          setFilters({ showNatural: !filters.showNatural }),
        )}
        {toggle('Odrzucone', filters.showRejected, () =>
          setFilters({ showRejected: !filters.showRejected }),
        )}
      </Stack>
    </Stack>
  );
}
