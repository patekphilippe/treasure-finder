import { useTheme } from '@mui/material/styles';
import { Polyline } from 'react-leaflet';
import { useTracksStore } from '@/features/tracks';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { PAST_TRACK_COLOR } from '../config/mapLayers';

/** All tracks as lines; the one being recorded is drawn on top in the accent colour. */
export function TrackLines() {
  const tracks = useTracksStore((s) => s.tracks);
  const recordingId = useFieldStore((s) => s.recordingTrackId);
  const theme = useTheme();

  const ordered = [...tracks].sort(
    (a, b) => Number(a.id === recordingId) - Number(b.id === recordingId),
  );

  return ordered.map((track) => {
    const active = track.id === recordingId;
    return (
      <Polyline
        key={track.id}
        positions={track.segments.map((seg) =>
          seg.map(([lat, lng]) => [lat, lng] as [number, number]),
        )}
        interactive={false}
        pathOptions={{
          color: active ? theme.palette.primary.main : PAST_TRACK_COLOR,
          weight: active ? 5 : 4,
          opacity: active ? 0.95 : 0.7,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    );
  });
}
