import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { useSourcesStore } from '../store/useSourcesStore';
import { AnalysisItem } from './AnalysisItem';

export function MyAnalysesList() {
  const sent = useSourcesStore((s) => s.sent);
  // new results stay marked while the list is open, and count as seen once it closes
  useEffect(() => () => useSourcesStore.getState().markSeen(), []);

  if (!sent.length)
    return (
      <Typography variant="body2" color="text.secondary">
        Nic jeszcze nie dodano. Wysłane źródła i to, co z nich odczytano, pojawią się tutaj.
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
