import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { MapView } from '@/features/map';
import type { Candidate } from '@/shared/types/domain';
import { EmptyState, glass, Icon } from '@/shared/ui';
import { useCandidateShortcuts } from '../hooks/useCandidateShortcuts';
import { useLoadCandidates } from '../hooks/useLoadCandidates';
import { useVisibleCandidates } from '../hooks/useVisibleCandidates';
import { setCandidateNote } from '../services/candidateDecisions';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { CandidateDetails } from './CandidateDetails';
import { CandidateFiltersBar } from './CandidateFiltersBar';
import { CandidateList } from './CandidateList';
import { CandidateMarkers } from './CandidateMarkers';
import { FieldResultsSummary } from './FieldResultsSummary';
import { ImportCandidatesButton } from './ImportCandidatesButton';
import { NoteDialog } from './NoteDialog';

export function AnalysisView() {
  useLoadCandidates();
  const all = useAnalysisStore((s) => s.candidates);
  const selectedId = useAnalysisStore((s) => s.selectedId);
  const select = useAnalysisStore((s) => s.select);
  const visible = useVisibleCandidates();
  const [noteFor, setNoteFor] = useState<Candidate | null>(null);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const [filtersOpen, setFiltersOpen] = useState<boolean | null>(null);
  const showFilters = filtersOpen ?? !isPhone;
  const activeFilters = useAnalysisStore(
    (s) =>
      s.filters.forms.length + (s.filters.showRejected ? 1 : 0) + (s.filters.showProtected ? 0 : 1),
  );
  useCandidateShortcuts(visible, setNoteFor);

  const selected = all.find((c) => c.id === selectedId) ?? null;

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      <MapView>
        <CandidateMarkers candidates={visible} />
      </MapView>
      <Paper
        component="aside"
        sx={(theme) => ({
          ...glass(theme),
          position: 'absolute',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          right: 12,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          // phone: bottom sheet sized to its content; laptop: full-height side panel
          left: { xs: 12, md: 'auto' },
          top: { xs: 'auto', md: 12 },
          width: { md: 400 },
          maxHeight: { xs: '60vh', md: 'none' },
        })}
      >
        <Stack spacing={1.5} sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Kandydaci</Typography>
            <Chip
              size="small"
              label={all.length ? `${visible.length} / ${all.length}` : 0}
              sx={{ borderRadius: '8px' }}
            />
            <Box sx={{ flex: 1 }} />
            {all.length > 0 && (
              <IconButton
                size="small"
                aria-label="Filtry"
                aria-pressed={showFilters}
                onClick={() => setFiltersOpen(!showFilters)}
                sx={{ color: showFilters ? 'primary.main' : 'text.secondary' }}
              >
                <Badge color="primary" variant="dot" invisible={activeFilters === 0}>
                  <Icon name="filter" size={20} />
                </Badge>
              </IconButton>
            )}
            {all.length > 0 && <ImportCandidatesButton />}
          </Stack>
          <Stack
            direction="row"
            sx={{
              gap: 1,
              alignItems: 'flex-start',
              color: 'text.secondary',
              bgcolor: 'action.hover',
              borderRadius: '10px',
              px: 1.5,
              py: 1,
            }}
          >
            <Icon name="info-circle" size={18} sx={{ mt: '1px' }} />
            <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
              Ocena pokazuje potencjał miejsca: ślad dawnej działalności człowieka, a nie
              przewidywanie znaleziska.
            </Typography>
          </Stack>
        </Stack>

        {all.length === 0 ? (
          <EmptyState
            icon="file-import"
            title="Wczytaj kandydatów z QGIS"
            description="Plik kandydaci.geojson tworzy skrypt qgis/detect.py z arkuszy NMT. Przyjęci kandydaci trafiają do terenu jako punkty do sprawdzenia."
            action={<ImportCandidatesButton variant="full" />}
          />
        ) : (
          <>
            {showFilters && <CandidateFiltersBar />}
            <FieldResultsSummary />
            {selected && (
              <CandidateDetails
                candidate={selected}
                onNote={() => setNoteFor(selected)}
                onClose={() => select(null)}
              />
            )}
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <CandidateList candidates={visible} />
            </Box>
            {!isPhone && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ px: 2.5, py: 1, borderTop: 1, borderColor: 'divider' }}
              >
                J / K następny · A przyjmij · R odrzuć · N notatka
              </Typography>
            )}
          </>
        )}
      </Paper>
      {noteFor && (
        <NoteDialog
          initial={noteFor.note}
          onClose={() => setNoteFor(null)}
          onSave={async (note) => {
            await setCandidateNote(noteFor, note);
            setNoteFor(null);
          }}
        />
      )}
    </Box>
  );
}
