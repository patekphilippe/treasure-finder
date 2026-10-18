import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { DEFAULT_SETTINGS, type AnalysisSettings } from '@/shared/lib/detect';
import { useToastStore } from '@/shared/ui';
import { rescoreCandidates } from '../services/rescoreCandidates';
import { useAnalysisSettings } from '../store/useAnalysisSettings';

interface AnalysisSettingsDialogProps {
  onClose: () => void;
}

const WEIGHTS: readonly { key: keyof AnalysisSettings['weights']; label: string; hint: string }[] =
  [
    { key: 'relief', label: 'Wyrazistość', hint: 'jak wyraźnie forma odcina się od terenu' },
    { key: 'confidence', label: 'Pewność', hint: 'jak dobrze kształt pasuje do interpretacji' },
    { key: 'context', label: 'Kontekst', hint: 'mapy archiwalne, dawne drogi, woda w pobliżu' },
  ];

/** Mounted only while open, so the draft always starts from the saved settings. */
export function AnalysisSettingsDialog({ onClose }: AnalysisSettingsDialogProps) {
  const saved = useAnalysisSettings();
  const showToast = useToastStore((s) => s.show);
  const [draft, setDraft] = useState<AnalysisSettings>({
    lrmRadiusM: saved.lrmRadiusM,
    thresholdM: saved.thresholdM,
    weights: saved.weights,
  });
  const sum = draft.weights.relief + draft.weights.confidence + draft.weights.context;
  const share = (v: number) => (sum > 0 ? Math.round((v * 100) / sum) : 0);

  const save = async () => {
    const weightsChanged = JSON.stringify(draft.weights) !== JSON.stringify(saved.weights);
    const detectChanged =
      draft.lrmRadiusM !== saved.lrmRadiusM || draft.thresholdM !== saved.thresholdM;
    saved.set(draft);
    onClose();
    if (weightsChanged) {
      const old = await rescoreCandidates(draft.weights);
      showToast(
        old
          ? `Oceny przeliczone. ${old} kandydatów ze starszej analizy zmieni ocenę po ponownym wczytaniu arkusza`
          : 'Oceny przeliczone',
      );
    } else if (detectChanged) showToast('Zapisano. Wczytaj arkusz ponownie, aby zastosować');
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
    >
      <DialogTitle>Ustawienia analizy</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">
              Promień reliefu lokalnego: {draft.lrmRadiusM} m
            </Typography>
            <Slider
              min={5}
              max={30}
              step={1}
              value={draft.lrmRadiusM}
              onChange={(_, v) => setDraft({ ...draft, lrmRadiusM: v as number })}
              aria-label="Promień reliefu lokalnego"
            />
            <Typography variant="caption" color="text.secondary">
              Mniejszy wyłapuje drobne doły, większy także szersze formy, np. kurhany.
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">
              Próg wysokości:{' '}
              {draft.thresholdM.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} m
            </Typography>
            <Slider
              min={0.1}
              max={0.8}
              step={0.05}
              value={draft.thresholdM}
              onChange={(_, v) => setDraft({ ...draft, thresholdM: v as number })}
              aria-label="Próg wysokości"
            />
            <Typography variant="caption" color="text.secondary">
              Niższy znajdzie płytsze formy, ale też więcej przypadkowych nierówności.
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Promień i próg działają przy następnym wczytaniu arkusza.
          </Typography>

          <Typography variant="overline" color="text.secondary" sx={{ mb: -1.5 }}>
            Wagi oceny 0–100
          </Typography>
          {WEIGHTS.map((w) => (
            <Stack key={w.key} spacing={0.25}>
              <Typography variant="subtitle2">
                {w.label}: {share(draft.weights[w.key])}%
              </Typography>
              <Slider
                min={0}
                max={100}
                step={5}
                value={draft.weights[w.key]}
                onChange={(_, v) =>
                  setDraft({ ...draft, weights: { ...draft.weights, [w.key]: v as number } })
                }
                aria-label={`Waga: ${w.label}`}
              />
              <Typography variant="caption" color="text.secondary">
                {w.hint}
              </Typography>
            </Stack>
          ))}
          <Typography variant="caption" color="text.secondary">
            Wagi przeliczają oceny od razu. Zestawienie znalezisk z terenu podpowie, którą podnieść.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={() => setDraft(DEFAULT_SETTINGS)} sx={{ mr: 'auto' }}>
          Domyślne
        </Button>
        <Button color="inherit" onClick={onClose}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={() => void save()}>
          Zapisz
        </Button>
      </DialogActions>
    </Dialog>
  );
}
