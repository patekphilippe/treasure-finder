import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { OwnMapsLayer } from '@/features/history';
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
import { AnalysisProgress } from './AnalysisProgress';
import { AnalysisSettingsDialog } from './AnalysisSettingsDialog';
import { CandidateMarkers } from './CandidateMarkers';
import { CandidateZones } from './CandidateZones';
import { ExclusionMaskLayer } from './ExclusionMaskLayer';
import { ExclusionSummary } from './ExclusionSummary';
import { FieldResultsSummary } from './FieldResultsSummary';
import { ImportCandidatesButton } from './ImportCandidatesButton';
import { LoadSheetButton } from './LoadSheetButton';
import { NoteDialog } from './NoteDialog';
import { SheetReliefLayer } from './SheetReliefLayer';
import { SheetReliefSection } from './SheetReliefSection';

export function AnalysisView() {
  useLoadCandidates();
  const all = useAnalysisStore((s) => s.candidates);
  const selectedId = useAnalysisStore((s) => s.selectedId);
  const select = useAnalysisStore((s) => s.select);
  const visible = useVisibleCandidates();
  const [noteFor, setNoteFor] = useState<Candidate | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const [filtersOpen, setFiltersOpen] = useState<boolean | null>(null);
  const showFilters = filtersOpen ?? !isPhone;
  const activeFilters = useAnalysisStore(
    (s) =>
      s.filters.priorities.length +
      s.filters.interpretations.length +
      (s.filters.showRejected ? 1 : 0) +
      (s.filters.showNatural ? 1 : 0) +
      (s.filters.showProtected ? 0 : 1),
  );
  useCandidateShortcuts(visible, setNoteFor);

  const selected = all.find((c) => c.id === selectedId) ?? null;
  const recompute = all.filter((c) => c.needsRecompute).length;

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      <MapView>
        <ExclusionMaskLayer />
        <OwnMapsLayer />
        <SheetReliefLayer />
        <CandidateZones candidates={visible} />
        <CandidateMarkers candidates={visible} />
      </MapView>
      <Paper
        component="aside"
        data-tour="analysis-panel"
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
          // dvh: on phones vh includes the hidden browser bars; keep below the mode switch
          maxHeight: {
            xs: 'min(60dvh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 84px))',
            md: 'none',
          },
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
                data-tour="analysis-filters"
                aria-pressed={showFilters}
                onClick={() => setFiltersOpen(!showFilters)}
                sx={{ color: showFilters ? 'primary.main' : 'text.secondary' }}
              >
                <Badge color="primary" variant="dot" invisible={activeFilters === 0}>
                  <Icon name="filter" size={20} />
                </Badge>
              </IconButton>
            )}
            <IconButton
              size="small"
              aria-label="Ustawienia analizy"
              data-tour="analysis-settings"
              onClick={() => setSettingsOpen(true)}
              sx={{ color: 'text.secondary' }}
            >
              <Icon name="sliders-h" size={20} />
            </IconButton>
            <LoadSheetButton />
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
          <SheetReliefSection />
        </Stack>

        <AnalysisProgress />
        <ExclusionSummary />
        {all.length === 0 ? (
          <EmptyState
            icon="file-upload"
            title="Wczytaj arkusz NMT"
            description="Plik .asc lub GeoTIFF z Geoportalu (EPSG:2180). Aplikacja rozpozna formy terenu, wskaże strefy poszukiwań i pominie zabudowę. Przyjęte strefy trafiają do trybu Teren."
            action={
              <Stack spacing={1} sx={{ alignItems: 'center' }}>
                <LoadSheetButton variant="full" />
                <ImportCandidatesButton variant="full" />
              </Stack>
            }
          />
        ) : (
          <>
            {recompute > 0 && (
              <Typography variant="caption" color="warning.main" sx={{ px: 2.5, pb: 1 }}>
                {recompute} kandydatów pochodzi ze starej analizy. Wczytaj ich arkusz ponownie, aby
                rozpoznać formy.
              </Typography>
            )}
            {showFilters && <CandidateFiltersBar />}
            <FieldResultsSummary />
            {selected && (
              <CandidateDetails
                candidate={selected}
                onNote={() => setNoteFor(selected)}
                onClose={() => select(null)}
              />
            )}
            <Box data-tour="candidate-list" sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
      {settingsOpen && <AnalysisSettingsDialog onClose={() => setSettingsOpen(false)} />}
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
