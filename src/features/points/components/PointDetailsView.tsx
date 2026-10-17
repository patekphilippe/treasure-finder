import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { formatDate, formatDistance } from '@/shared/lib/format';
import type { FieldPoint } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { POINT_STATUS_LABELS, POINT_TYPES } from '../config/pointTypes';
import { usePhotoUrl } from '../hooks/usePhotoUrl';
import { InfoRow } from './InfoRow';

interface PointDetailsViewProps {
  point: FieldPoint;
  distM: number | null;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyCoords: () => void;
}

export function PointDetailsView({
  point,
  distM,
  onNavigate,
  onEdit,
  onDelete,
  onCopyCoords,
}: PointDetailsViewProps) {
  const meta = POINT_TYPES[point.type];
  const photoUrl = usePhotoUrl(point.photoId);

  return (
    <Stack spacing={2}>
      {photoUrl && (
        <Box
          component="img"
          src={photoUrl}
          alt={point.name}
          sx={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: '12px' }}
        />
      )}
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          icon={<Icon name={meta.icon} size={15} />}
          label={meta.label}
          sx={{
            borderRadius: '8px',
            bgcolor: alpha(meta.color, 0.14),
            '& .MuiChip-icon': { color: meta.color },
          }}
        />
        <Chip
          size="small"
          variant="outlined"
          label={POINT_STATUS_LABELS[point.status]}
          sx={{ borderRadius: '8px' }}
        />
      </Stack>
      {point.desc && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {point.desc}
        </Typography>
      )}
      <Stack>
        {distM !== null && <InfoRow label="Odległość">{formatDistance(distM)}</InfoRow>}
        <InfoRow label="Głębokość">{point.depthCm !== null ? `${point.depthCm} cm` : '—'}</InfoRow>
        <InfoRow label="Współrzędne">
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            <span>
              {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
            </span>
            <IconButton size="small" aria-label="Kopiuj współrzędne" onClick={onCopyCoords}>
              <Icon name="copy" size={18} />
            </IconButton>
          </Stack>
        </InfoRow>
        {point.accM !== null && <InfoRow label="Dokładność">±{Math.round(point.accM)} m</InfoRow>}
        <InfoRow label="Dodano">{formatDate(point.created)}</InfoRow>
      </Stack>
      <Stack direction="row" sx={{ gap: 1 }}>
        <Button
          variant="contained"
          sx={{ flex: 1 }}
          startIcon={<Icon name="directions" size={20} />}
          onClick={onNavigate}
        >
          Prowadź
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Icon name="pen" size={18} />}
          onClick={onEdit}
        >
          Edytuj
        </Button>
        <IconButton aria-label="Usuń punkt" color="error" onClick={onDelete}>
          <Icon name="trash-alt" size={22} />
        </IconButton>
      </Stack>
    </Stack>
  );
}
