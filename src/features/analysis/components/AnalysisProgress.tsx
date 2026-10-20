import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAnalysisStore } from '../store/useAnalysisStore';

export function AnalysisProgress() {
  const run = useAnalysisStore((s) => s.run);
  if (!run) return null;
  return (
    <Stack spacing={0.75} sx={{ px: 2.5, pb: 1.5 }}>
      <LinearProgress
        variant="determinate"
        value={Math.round(run.share * 100)}
        sx={{ height: 6, borderRadius: 3 }}
      />
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }} noWrap>
          {run.name}: {run.step} ({Math.round(run.share * 100)}%)
        </Typography>
        {run.cancel && (
          <Button size="small" color="inherit" onClick={run.cancel}>
            Przerwij
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
