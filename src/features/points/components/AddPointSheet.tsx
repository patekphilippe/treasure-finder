import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { photosRepo } from '@/shared/db';
import { createId } from '@/shared/lib/createId';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { usePointDraftStore } from '@/shared/store/usePointDraftStore';
import { Sheet, useToastStore } from '@/shared/ui';
import { usePointsStore } from '../store/usePointsStore';
import { createPoint } from '../utils/createPoint';
import { defaultPointName } from '../utils/defaultPointName';
import { LocationPicker } from './LocationPicker';
import { PickLocationBar } from './PickLocationBar';
import { PointForm, type PointFormValues } from './PointForm';

interface AddPointSheetProps {
  onClose: () => void;
}

export function AddPointSheet({ onClose }: AddPointSheetProps) {
  const points = usePointsStore((s) => s.points);
  const savePoint = usePointsStore((s) => s.save);
  const { source, location, picking, reset } = usePointDraftStore();
  const showToast = useToastStore((s) => s.show);
  const [saving, setSaving] = useState(false);
  const position = useFieldStore((s) => s.position);
  const coords = source === 'gps' ? position : location;

  // a fresh draft every time the sheet is closed
  useEffect(() => () => reset(), [reset]);

  const submit = async (values: PointFormValues) => {
    const position = useFieldStore.getState().position;
    const where =
      source === 'gps'
        ? position && { lat: position.lat, lng: position.lng, accM: position.accM }
        : location && { ...location, accM: null };
    if (!where) {
      showToast(
        source === 'gps' ? 'Brak sygnału GPS. Wskaż punkt na mapie' : 'Wskaż miejsce na mapie',
      );
      return;
    }
    setSaving(true);
    try {
      let photoId: string | null = null;
      if (values.photo) {
        photoId = createId();
        await photosRepo.put(photoId, values.photo);
      }
      const point = createPoint(
        {
          type: values.type,
          name: values.name,
          desc: values.desc,
          depthCm: values.depthCm,
          ...where,
          src: source === 'gps' ? 'gps' : 'mapa',
          photoId,
        },
        Date.now(),
      );
      await savePoint(point);
      showToast(`Zapisano: ${point.name}`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {picking && <PickLocationBar />}
      <Sheet title="Nowy punkt" onClose={onClose} hidden={picking}>
        <Stack spacing={2}>
          <LocationPicker />
          <Divider />
          <PointForm
            namePlaceholder={(type) => defaultPointName(type, points)}
            submitLabel="Zapisz punkt"
            coords={coords}
            disabled={saving}
            onSubmit={submit}
          />
        </Stack>
      </Sheet>
    </>
  );
}
