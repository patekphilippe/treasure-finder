import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { requestCompassPermission } from '@/features/gps';
import { photosRepo } from '@/shared/db';
import { createId } from '@/shared/lib/createId';
import { haversine } from '@/shared/lib/geo';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { ConfirmDialog, Sheet, useToastStore } from '@/shared/ui';
import { usePointsStore } from '../store/usePointsStore';
import { defaultPointName } from '../utils/defaultPointName';
import { PointDetailsView } from './PointDetailsView';
import { PointForm, type PointFormValues } from './PointForm';

interface PointDetailsSheetProps {
  onClose: () => void;
}

export function PointDetailsSheet({ onClose }: PointDetailsSheetProps) {
  const selectedId = useUiStore((s) => s.selectedPointId);
  const points = usePointsStore((s) => s.points);
  const { save, remove } = usePointsStore();
  const position = useFieldStore((s) => s.position);
  const showToast = useToastStore((s) => s.show);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const point = points.find((p) => p.id === selectedId);
  if (!point) return null;
  const distM = position ? haversine(position.lat, position.lng, point.lat, point.lng) : null;

  const navigate = () => {
    const field = useFieldStore.getState();
    field.setNavigationTarget(point.id);
    field.setFollowing(true);
    void requestCompassPermission();
    onClose();
  };

  const copyCoords = async () => {
    try {
      await navigator.clipboard.writeText(`${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`);
      showToast('Skopiowano współrzędne');
    } catch {
      showToast('Nie udało się skopiować');
    }
  };

  const submitEdit = async (values: PointFormValues) => {
    let photoId = point.photoId;
    if (values.photo || values.removePhoto) {
      if (photoId) await photosRepo.remove(photoId);
      photoId = null;
    }
    if (values.photo) {
      photoId = createId();
      await photosRepo.put(photoId, values.photo);
    }
    await save({
      ...point,
      type: values.type,
      name: values.name,
      desc: values.desc,
      depthCm: values.depthCm,
      photoId,
      updated: Date.now(),
    });
    setEditing(false);
    showToast('Zapisano zmiany');
  };

  const deletePoint = async () => {
    const field = useFieldStore.getState();
    if (field.navigationTargetId === point.id) field.setNavigationTarget(null);
    await remove(point.id);
    setConfirmDelete(false);
    showToast(`Usunięto: ${point.name}`);
    onClose();
  };

  return (
    <Sheet title={editing ? 'Edycja punktu' : point.name} onClose={onClose}>
      {editing ? (
        <Stack spacing={1}>
          <PointForm
            key={point.id}
            initial={point}
            existingPhotoId={point.photoId}
            namePlaceholder={(type) =>
              defaultPointName(
                type,
                points.filter((p) => p.id !== point.id),
              )
            }
            submitLabel="Zapisz zmiany"
            onSubmit={submitEdit}
          />
          <Button color="inherit" onClick={() => setEditing(false)}>
            Anuluj
          </Button>
        </Stack>
      ) : (
        <PointDetailsView
          point={point}
          distM={distM}
          onNavigate={navigate}
          onEdit={() => setEditing(true)}
          onDelete={() => setConfirmDelete(true)}
          onCopyCoords={copyCoords}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Usunąć punkt?"
        message={`${point.name} zostanie usunięty razem ze zdjęciem.`}
        onConfirm={deletePoint}
        onCancel={() => setConfirmDelete(false)}
      />
    </Sheet>
  );
}
