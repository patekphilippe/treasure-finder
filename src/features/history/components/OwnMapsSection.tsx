import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useUiStore } from '@/shared/store/useUiStore';
import type { OwnMap } from '@/shared/types/domain';
import { ConfirmDialog, Icon, useToastStore } from '@/shared/ui';
import { OWN_MAP_ACCEPT } from '../config/ownMaps';
import { addOwnMapFiles, type AddOwnMapOptions } from '../services/addOwnMapFiles';
import { showOwnMap } from '../services/showOwnMap';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { OwnMapImportDialog } from './OwnMapImportDialog';
import { OwnMapItem } from './OwnMapItem';
import { removeOwnMap } from '../services/removeOwnMap';
import { shareMap } from '../services/shareMap';

/**
 * Dane: own historical maps loaded from files (a GeoTIFF, an image with a world file or a plain
 * scan), placed and managed here; Warstwy only shows them.
 */
export function OwnMapsSection() {
  const { maps, update, startFit } = useOwnMapsStore();
  const busy = useOwnMapsStore((s) => s.importing !== null);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ files: File[]; mode: 'crs' | 'scan' } | null>(null);
  const [toDelete, setToDelete] = useState<OwnMap | null>(null);

  const fit = (id: string) => {
    closeSheet();
    startFit(id);
  };

  const run = async (files: File[], opts: AddOwnMapOptions = {}) => {
    if ((await addOwnMapFiles(files, opts)) === 'needCrs') setPending({ files, mode: 'crs' });
  };

  const pick = (files: File[]) => {
    const image = files.find((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
    const world = files.some((f) => /\.(jgw|jpgw|pgw|pngw|tfw|tifw|wld|j2w)$/i.test(f.name));
    // a plain image needs a place; an image with a world file needs its system
    if (image && !world) setPending({ files, mode: 'scan' });
    else if (image && world) setPending({ files, mode: 'crs' });
    else void run(files);
  };

  return (
    <Stack data-tour="own-maps" spacing={1}>
      <Typography variant="overline" color="text.secondary">
        Mapy historyczne ({maps.length})
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Skan albo GeoTIFF dawnej mapy, np. z PZGiK, SLUB albo mapywig.org. GeoTIFF i obraz z plikiem
        world file trafiają od razu na miejsce, zwykły skan dopasujesz 4 narożnikami. Mapy zostają
        na tym urządzeniu i działają bez internetu; włączasz je w Warstwach.
      </Typography>
      {maps.map((m) => (
        <OwnMapItem
          key={m.id}
          map={m}
          // a year or name changed on a shared map goes to the community too
          onChange={(patch) => void update(m.id, patch).then(() => shareMap(m.id))}
          onShow={() => {
            if (!m.visible) void update(m.id, { visible: true });
            showOwnMap(m);
          }}
          onFit={() => fit(m.id)}
          onDelete={() => setToDelete(m)}
        />
      ))}
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={OWN_MAP_ACCEPT}
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length) pick(files);
          e.target.value = '';
        }}
      />
      <Button
        variant="outlined"
        color="inherit"
        disabled={busy}
        sx={{ mt: maps.length ? 0.5 : 0 }}
        startIcon={busy ? <CircularProgress size={16} /> : <Icon name="file-image" size={20} />}
        onClick={() => inputRef.current?.click()}
      >
        Dodaj mapę
      </Button>
      <Typography variant="caption" color="text.secondary">
        Obraz z plikiem world file (.jgw, .pgw, .tfw): wybierz oba pliki naraz.
      </Typography>
      {pending && (
        <OwnMapImportDialog
          mode={pending.mode}
          fileName={pending.files.map((f) => f.name).join(', ')}
          canAuto={pending.files.some((f) => /\.(jpe?g|png|webp)$/i.test(f.name))}
          onClose={() => setPending(null)}
          onSubmit={({ auto, ...opts }) => {
            const files = pending.files;
            setPending(null);
            void run(files, auto ? { auto } : opts);
          }}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title="Usunąć mapę?"
        message={
          toDelete?.shared?.mine
            ? `${toDelete.name}. Zniknie też u innych członków społeczności.`
            : toDelete?.name
        }
        onConfirm={() => {
          if (toDelete)
            removeOwnMap(toDelete.id).catch((e: unknown) =>
              useToastStore
                .getState()
                .show(e instanceof Error ? e.message : 'Nie udało się usunąć mapy'),
            );
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </Stack>
  );
}
