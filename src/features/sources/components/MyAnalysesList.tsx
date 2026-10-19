import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { usePollSources } from '../hooks/usePollSources';
import { useSourcesStore } from '../store/useSourcesStore';
import { AnalysisItem } from './AnalysisItem';

export function MyAnalysesList() {
  const sent = useSourcesStore((s) => s.sent);
  usePollSources(sent.length > 0);

  if (!sent.length)
    return (
      <Typography variant="body2" color="text.secondary">
        Nic jeszcze nie wysłano. Wyniki pojawią się tutaj, zwykle w ciągu godziny.
      </Typography>
    );
  return (
    <Stack data-tour="sources-results">
      {sent.map((s) => (
        <AnalysisItem key={s.id} item={s} />
      ))}
    </Stack>
  );
}
