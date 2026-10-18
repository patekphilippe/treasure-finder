import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState, type ReactNode } from 'react';
import type { PointType } from '@/shared/types/domain';
import { UnexplodedOrdnanceScreen } from '@/features/safety';
import { useToastStore } from '@/shared/ui';
import { usePhotoUrl } from '../hooks/usePhotoUrl';
import { compressPhoto } from '../utils/compressPhoto';
import { PhotoInput } from './PhotoInput';
import { PointTypePicker } from './PointTypePicker';

export interface PointFormValues {
  type: PointType;
  name: string;
  desc: string;
  depthCm: number | null;
  /** new photo to store; null keeps the current one unless `removePhoto` */
  photo: Blob | null;
  removePhoto: boolean;
}

interface PointFormProps {
  initial?: Partial<Pick<PointFormValues, 'type' | 'name' | 'desc' | 'depthCm'>>;
  /** id of the photo already stored for this point */
  existingPhotoId?: string | null;
  namePlaceholder: (type: PointType) => string;
  submitLabel: string;
  disabled?: boolean;
  /** where the point is, shown on the unexploded-ordnance screen */
  coords?: { lat: number; lng: number } | null;
  /** shown above the form (e.g. a legal reminder) */
  notice?: ReactNode;
  onSubmit: (values: PointFormValues) => void;
}

export function PointForm({
  initial,
  existingPhotoId = null,
  namePlaceholder,
  submitLabel,
  disabled = false,
  coords = null,
  notice,
  onSubmit,
}: PointFormProps) {
  const showToast = useToastStore((s) => s.show);
  const [type, setType] = useState<PointType>(initial?.type ?? 'anomalia');
  const [name, setName] = useState(initial?.name ?? '');
  const [desc, setDesc] = useState(initial?.desc ?? '');
  const [depth, setDepth] = useState(initial?.depthCm?.toString() ?? '');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uxoOpen, setUxoOpen] = useState(false);
  const previewUrl = usePhotoUrl(photo ?? (removePhoto ? null : existingPhotoId));

  const pickPhoto = async (file: File) => {
    setBusy(true);
    try {
      setPhoto(await compressPhoto(file));
      setRemovePhoto(false);
    } catch {
      showToast('Nie udało się wczytać zdjęcia');
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const depthCm = depth.trim() === '' ? null : Math.round(Number(depth.replace(',', '.')));
    onSubmit({
      type,
      name: name.trim() || namePlaceholder(type),
      desc: desc.trim(),
      depthCm: Number.isFinite(depthCm) ? depthCm : null,
      photo,
      removePhoto,
    });
  };

  return (
    <Stack spacing={2}>
      {notice}
      <PointTypePicker
        value={type}
        onChange={(t) => {
          setType(t);
          if (t === 'niewybuch') setUxoOpen(true);
        }}
      />
      <Stack data-tour="point-details" spacing={2}>
        <TextField
          label="Nazwa"
          size="small"
          value={name}
          placeholder={namePlaceholder(type)}
          onChange={(e) => setName(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Opis"
          size="small"
          multiline
          minRows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <TextField
          label="Głębokość"
          size="small"
          value={depth}
          onChange={(e) => setDepth(e.target.value.replace(/[^\d.,]/g, ''))}
          slotProps={{
            htmlInput: { inputMode: 'decimal' },
            input: { endAdornment: <InputAdornment position="end">cm</InputAdornment> },
          }}
        />
        <PhotoInput
          previewUrl={previewUrl}
          busy={busy}
          onPick={pickPhoto}
          onRemove={() => {
            setPhoto(null);
            setRemovePhoto(true);
          }}
        />
      </Stack>
      <Button variant="contained" size="large" disabled={disabled || busy} onClick={submit}>
        {submitLabel}
      </Button>
      <UnexplodedOrdnanceScreen open={uxoOpen} coords={coords} onClose={() => setUxoOpen(false)} />
    </Stack>
  );
}
