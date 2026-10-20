import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { fromEpsg2180 } from '@/shared/lib/geo';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import type { OwnMap } from '@/shared/types/domain';
import { ConfirmDialog, Icon, useToastStore } from '@/shared/ui';
import { OWN_MAP_ACCEPT } from '../config/ownMaps';
import {
  importOwnMap,
  mapCorners2180,
  NeedCrsError,
  type ImportOptions,
} from '../services/importOwnMap';
import { placeOwnMap } from '../services/placeOwnMap';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { OwnMapImportDialog } from './OwnMapImportDialog';
import { OwnMapItem } from './OwnMapItem';

/** Own historical maps: add a GeoTIFF, an image with a world file or a plain scan; list them. */
export function OwnMapsSection() {
  const { maps, add, update, remove, startFit } = useOwnMapsStore();
  const closeSheet = useUiStore((s) => s.closeSheet);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ files: File[]; mode: 'crs' | 'scan' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<OwnMap | null>(null);

  const show = (m: OwnMap) => {
    const c = mapCorners2180(m);
    const [lat, lng] = fromEpsg2180((c[0]!.x + c[2]!.x) / 2, (c[0]!.y + c[2]!.y) / 2);
    closeSheet();
    flyTo({ lat, lng, zoom: 14 });
  };

  const fit = (id: string) => {
    closeSheet();
    startFit(id);
  };

  const run = async (files: File[], opts: Partial<ImportOptions> = {}) => {
    setBusy(true);
    try {
      const { map, needsFit } = await importOwnMap(files, {
        ...opts,
        view: useMapViewStore.getState().bounds,
      });
      await add(map);
      if (needsFit) {
        showToast('Przeciągnij narożniki, aby dopasować mapę');
        fit(map.id);
      } else {
        showToast(`Wczytano: ${map.name}`);
        show(map);
      }
    } catch (e) {
      if (e instanceof NeedCrsError) setPending({ files, mode: 'crs' });
      else showToast(e instanceof Error ? e.message : 'Nie udało się wczytać mapy');
    } finally {
      setBusy(false);
    }
  };

  // the backend places the scan by its names; if it cannot, the scan goes into the view
  const runAuto = async (files: File[], turnstileToken: string | null) => {
    const image = files.find((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
    if (!image) return run(files);
    setBusy(true);
    let placed: Partial<ImportOptions> = {};
    try {
      const p = await placeOwnMap(image, useMapViewStore.getState().bounds, turnstileToken);
      placed = { corners: p.corners, ...(p.year && { year: p.year }) };
      showToast(
        p.method === 'arkusz'
          ? `Umieszczono po numerze arkusza ${p.sheetNumber ?? ''}. Sprawdź narożniki.`
          : `Umieszczono po nazwach: ${p.anchors.slice(0, 4).join(', ')} (błąd ok. ${p.uncertaintyM} m). Sprawdź narożniki.`,
      );
    } catch (e) {
      showToast(
        `${e instanceof Error ? e.message : 'Nie udało się umieścić mapy'}. Umieść ją ręcznie.`,
      );
    } finally {
      setBusy(false);
    }
    await run(files, placed);
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
        Własne mapy ({maps.length})
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Skan albo GeoTIFF dawnej mapy, np. z PZGiK, SLUB albo mapywig.org. GeoTIFF i obraz z plikiem
        world file trafiają od razu na miejsce, zwykły skan dopasujesz 4 narożnikami. Mapy zostają
        na tym urządzeniu i działają bez internetu.
      </Typography>
      {maps.map((m) => (
        <OwnMapItem
          key={m.id}
          map={m}
          onChange={(patch) => void update(m.id, patch)}
          onShow={() => show(m)}
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
            void (auto ? runAuto(files, auto.turnstileToken) : run(files, opts));
          }}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title="Usunąć mapę?"
        message={toDelete?.name}
        onConfirm={() => {
          if (toDelete) void remove(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </Stack>
  );
}
