import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { Icon } from '@/shared/ui';
import { FORM_META } from '../config/forms';
import { useFieldStatus } from '../hooks/useFieldStatus';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { fieldResultsByForm } from '../utils/fieldResultsByForm';

/** Collapsible table: accepted / checked / finds per landform class. */
export function FieldResultsSummary() {
  const candidates = useAnalysisStore((s) => s.candidates);
  const status = useFieldStatus();
  const rows = useMemo(() => fieldResultsByForm(candidates, status), [candidates, status]);
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;

  const checked = rows.reduce((n, r) => n + r.checked, 0);
  const finds = rows.reduce((n, r) => n + r.finds, 0);

  return (
    <Box sx={{ px: 2.5, pb: 1 }}>
      <ButtonBase
        onClick={() => setOpen(!open)}
        sx={{ width: '100%', justifyContent: 'space-between', py: 0.75, borderRadius: '8px' }}
      >
        <Typography variant="subtitle2">
          Wyniki z terenu: {checked} sprawdzonych, {finds} znalezisk
        </Typography>
        <Icon name={open ? 'angle-up' : 'angle-down'} size={18} />
      </ButtonBase>
      {open && (
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            '& td, & th': { py: 0.5 },
          }}
        >
          <thead>
            <Box
              component="tr"
              sx={{
                color: 'text.secondary',
                textAlign: 'right',
                '& th:first-of-type': { textAlign: 'left' },
              }}
            >
              <th>Klasa</th>
              <th>Przyjęte</th>
              <th>Sprawdzone</th>
              <th>Znaleziska</th>
            </Box>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Box
                component="tr"
                key={r.form}
                sx={{ textAlign: 'right', '& td:first-of-type': { textAlign: 'left' } }}
              >
                <td>{FORM_META[r.form].label}</td>
                <td>{r.accepted}</td>
                <td>{r.checked}</td>
                <td>
                  <b>{r.finds}</b>
                  {r.checked > 0 && (
                    <Typography component="span" variant="caption" color="text.secondary">
                      {' '}
                      ({Math.round((r.finds / r.checked) * 100)}%)
                    </Typography>
                  )}
                </td>
              </Box>
            ))}
          </tbody>
        </Box>
      )}
      {open && (
        <Stack direction="row" sx={{ gap: 0.75, alignItems: 'flex-start', mt: 0.75 }}>
          <Icon name="info-circle" size={16} sx={{ color: 'text.secondary', mt: '1px' }} />
          <Typography variant="caption" color="text.secondary">
            Klasy z wysokim odsetkiem znalezisk warto premiować w ocenie
            (qgis/candidates/config.py).
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
