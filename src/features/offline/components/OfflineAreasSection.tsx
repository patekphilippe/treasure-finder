import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { ConfirmDialog, ToggleRow } from '@/shared/ui';
import type { OfflineArea } from '../types';
import { useOfflineStore } from '../store/useOfflineStore';
import { OfflineAreaItem } from './OfflineAreaItem';

const SHOW_ZOOM = 16;

/** Warstwy: download a map area for work without signal, and the saved areas. */
export function OfflineAreasSection() {
  const { areas, load, startSelecting, remove } = useOfflineStore();
  const closeSheet = useUiStore((s) => s.closeSheet);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const [toDelete, setToDelete] = useState<OfflineArea | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Stack data-tour="data-offline" spacing={1.25}>
      <Typography variant="overline" color="text.secondary">
        Bez internetu
      </Typography>
      <ToggleRow
        icon="download"
        title="Zapisz obszar mapy"
        caption="Jedziesz tam, gdzie nie ma zasięgu? Zapisz wcześniej zdjęcia i rzeźbę terenu."
        onOpen={() => {
          closeSheet();
          startSelecting();
        }}
      />
      {areas.length > 0 && (
        <Stack>
          {areas.map((a) => (
            <OfflineAreaItem
              key={a.id}
              area={a}
              onShow={() => {
                closeSheet();
                flyTo({
                  lat: (a.bounds.north + a.bounds.south) / 2,
                  lng: (a.bounds.west + a.bounds.east) / 2,
                  zoom: SHOW_ZOOM,
                });
              }}
              onDelete={() => setToDelete(a)}
            />
          ))}
        </Stack>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title="Usunąć obszar?"
        message={
          toDelete ? `${toDelete.name}: mapa tego miejsca nie będzie dostępna bez internetu.` : ''
        }
        onConfirm={async () => {
          if (toDelete) await remove(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </Stack>
  );
}
