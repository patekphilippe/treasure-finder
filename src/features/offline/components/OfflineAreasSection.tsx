import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useLayersStore } from '@/features/layers';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { ConfirmDialog, Icon } from '@/shared/ui';
import type { OfflineArea } from '../types';
import { useOfflineStore } from '../store/useOfflineStore';
import { OfflineAreaItem } from './OfflineAreaItem';

const SHOW_ZOOM = 16;

/** Section in Dane: download a map area for work without signal, and the saved areas. */
export function OfflineAreasSection() {
  const { areas, load, startSelecting, preselectBase, remove } = useOfflineStore();
  const baseLayer = useLayersStore((s) => s.baseLayer);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const [toDelete, setToDelete] = useState<OfflineArea | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Stack data-tour="data-offline" spacing={1.25}>
      <Typography variant="overline" color="text.secondary">
        Mapy offline
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Ortofotomapa, mapa topograficzna i cieniowanie NMT wybranego obszaru (przybliżenia 12–19) do
        pracy w terenie bez zasięgu.
      </Typography>
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
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<Icon name="download" size={20} />}
        onClick={() => {
          closeSheet();
          preselectBase(baseLayer);
          startSelecting();
        }}
      >
        Pobierz obszar mapy
      </Button>
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
