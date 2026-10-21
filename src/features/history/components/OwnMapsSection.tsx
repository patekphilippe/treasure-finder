import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo, useRef, useState } from 'react';
import { useMembership } from '@/shared/store/useMembership';
import type { OwnMap } from '@/shared/types/domain';
import { ConfirmDialog, Icon, useToastStore } from '@/shared/ui';
import { OWN_MAP_ACCEPT } from '../config/ownMaps';
import { addOwnMapFiles, type AddOwnMapOptions } from '../services/addOwnMapFiles';
import { addOwnMapFolder } from '../services/addOwnMapFolder';
import { showOwnMap } from '../services/showOwnMap';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { OwnMapImportDialog } from './OwnMapImportDialog';
import { OwnMapItem } from './OwnMapItem';
import { removeOwnMap } from '../services/removeOwnMap';
import { removeAllOwnMaps } from '../services/removeAllOwnMaps';
import { removeOrphanObjects } from '../services/removeOrphanObjects';
import { rereadOwnMap } from '../services/rereadOwnMap';
import { useContextStore } from '../store/useContextStore';
import { orphanObjects } from '../utils/orphanObjects';
import { shareMap } from '../services/shareMap';
import { startFitting } from '../services/startFitting';
import { readableMapName } from '../utils/readableMapName';

/**
 * Dane: own historical maps loaded from files (a GeoTIFF, an image with a world file or a plain
 * scan), placed and managed here; Warstwy only shows them.
 */
export function OwnMapsSection() {
  const { maps, update } = useOwnMapsStore();
  const busy = useOwnMapsStore((s) => s.importing !== null);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ files: File[]; mode: 'crs' | 'scan' } | null>(null);
  const [toDelete, setToDelete] = useState<OwnMap | null>(null);
  const [toReread, setToReread] = useState<OwnMap | null>(null);
  const [clearAll, setClearAll] = useState(false);
  const mine = maps.filter((m) => !m.shared || m.shared.mine).length;
  const member = useMembership((st) => st.email !== null);
  const features = useContextStore((s) => s.features);
  // objects of maps removed before they went with their map
  const orphans = useMemo(
    () => orphanObjects(features, new Set(maps.map((m) => m.id))).length,
    [features, maps],
  );

  const fit = (id: string) => void startFitting(id);

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
          onReread={member ? () => setToReread(m) : undefined}
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
      <input
        ref={folderRef}
        type="file"
        hidden
        // a whole folder: not in React's types, the browsers take it as an attribute
        {...{ webkitdirectory: '' }}
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length) void addOwnMapFolder(files);
          e.target.value = '';
        }}
      />
      <Button
        data-tour="own-maps-folder"
        variant="outlined"
        color="inherit"
        disabled={busy}
        startIcon={<Icon name="folder-open" size={20} />}
        onClick={() => folderRef.current?.click()}
      >
        Wczytaj folder
      </Button>
      {mine > 1 && (
        <Button
          variant="outlined"
          color="error"
          disabled={busy}
          startIcon={<Icon name="trash" size={20} />}
          onClick={() => setClearAll(true)}
        >
          Usuń wszystkie moje mapy ({mine})
        </Button>
      )}
      {orphans > 0 && (
        <Button
          variant="outlined"
          color="warning"
          startIcon={<Icon name="broom" size={20} />}
          onClick={() => void removeOrphanObjects()}
        >
          Usuń {orphans} obiektów z usuniętych map
        </Button>
      )}
      <Typography variant="caption" color="text.secondary">
        Obraz z plikiem world file (.jgw, .pgw, .tfw): wybierz oba pliki naraz. Folder: wszystkie
        skany po kolei, arkusz WIG z nazwy pliku (np. P47_S40), każdy umieszczony i przeczytany
        przez AI; mapy już wczytane są pomijane.
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
        open={clearAll}
        title="Usunąć wszystkie Twoje mapy?"
        message={`${mine} map zniknie z tego urządzenia i ze wspólnej bazy, razem z obiektami odczytanymi tylko z nich. Mapy innych członków zostają.`}
        confirmLabel="Usuń wszystkie"
        destructive
        onConfirm={() => {
          setClearAll(false);
          void removeAllOwnMaps();
        }}
        onCancel={() => setClearAll(false)}
      />
      <ConfirmDialog
        open={toReread !== null}
        title="Przeczytać mapę od nowa?"
        confirmLabel="Przeczytaj od nowa"
        message={`${toReread?.name ?? ''}. Obiekty odczytane tylko z tej mapy znikną (także Twoje we wspólnej bazie), a AI przeczyta ją ponownie. Mapy 1:100 000 czyta wtedy według ich legendy.`}
        onConfirm={() => {
          if (toReread) void rereadOwnMap(toReread.id);
          setToReread(null);
        }}
        onCancel={() => setToReread(null)}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Usunąć mapę?"
        message={
          toDelete?.shared?.mine
            ? `${readableMapName(toDelete.name)}. Zniknie też u innych członków społeczności, razem z obiektami odczytanymi tylko z niej.`
            : toDelete
              ? `${readableMapName(toDelete.name)}. Obiekty odczytane tylko z tej mapy znikną razem z nią.`
              : undefined
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
