import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { formatHectares } from '@/shared/lib/format';
import { coveragePercent } from '@/shared/lib/geo';
import { useCoverageStore } from '@/shared/store/useCoverageStore';
import type { Track, Zone } from '@/shared/types/domain';

interface ZoneCoverageProps {
  zone: Zone;
  tracks: readonly Track[];
}

/** How much of a permit zone the recorded tracks have searched (0.5 m grid). */
export function ZoneCoverage({ zone, tracks }: ZoneCoverageProps) {
  const swathM = useCoverageStore((s) => s.swathM);
  const c = useMemo(
    () =>
      coveragePercent(
        zone.geometry,
        tracks.flatMap((t) => t.segments),
        swathM,
      ),
    [zone.geometry, tracks, swathM],
  );

  return (
    <Stack spacing={0.75} sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'action.hover' }}>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">Przeszukano</Typography>
        <Typography variant="h6">
          {c.percent.toLocaleString('pl-PL', { maximumFractionDigits: 1 })}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, c.percent)}
        sx={{ height: 6, borderRadius: 3 }}
      />
      <Typography variant="caption" color="text.secondary">
        {formatHectares(c.coveredM2)} ha z {formatHectares(c.zoneAreaM2)} ha przy pasie{' '}
        {swathM.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} m
      </Typography>
    </Stack>
  );
}
