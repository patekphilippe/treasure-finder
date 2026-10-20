import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { BACKEND_ENABLED } from '@/shared/config/backend';
import { MAP_CRS } from '@/shared/lib/geo';
import type { SheetSeries } from '@/shared/lib/georef';
import { useMembership } from '@/shared/store/useMembership';
import { TurnstileWidget } from '@/shared/ui';
import type { ImportOptions } from '../services/importOwnMap';

/** "auto": ask the backend to place the scan by its names (one AI reading) */
export type DialogChoice = Pick<ImportOptions, 'epsg' | 'sheet'> & {
  auto?: { turnstileToken: string | null };
};

interface OwnMapImportDialogProps {
  /** crs: the file is georeferenced but its system is unknown; scan: place a plain image */
  mode: 'crs' | 'scan';
  fileName: string;
  /** a JPEG, PNG or WebP scan: the backend can read it */
  canAuto: boolean;
  onSubmit: (choice: DialogChoice) => void;
  onClose: () => void;
}

const SERIES: readonly { id: SheetSeries | 'none' | 'auto'; label: string; example: string }[] = [
  { id: 'auto', label: 'Automatycznie: po nazwach na mapie (AI)', example: '' },
  { id: 'none', label: 'Bez numeru: umieść w widoku', example: '' },
  { id: 'messtischblatt', label: 'Messtischblatt 1:25 000', example: 'np. 4868' },
  { id: 'wig100', label: 'WIG 1:100 000', example: 'np. P47 S40' },
  { id: 'wig25', label: 'WIG 1:25 000', example: 'np. P46 S34 E' },
];

/** Mounted only while open. Asks for what the file does not say: its system, or where the scan goes. */
export function OwnMapImportDialog({
  mode,
  fileName,
  canAuto,
  onSubmit,
  onClose,
}: OwnMapImportDialogProps) {
  const auto = canAuto && BACKEND_ENABLED;
  const member = useMembership((s) => s.email !== null);
  const [epsg, setEpsg] = useState(2180);
  const [series, setSeries] = useState<SheetSeries | 'none' | 'auto'>(auto ? 'auto' : 'none');
  const [token, setToken] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setToken(t), []);
  const [number, setNumber] = useState('');
  const example = SERIES.find((s) => s.id === series)?.example;

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
    >
      <DialogTitle>{mode === 'crs' ? 'Układ współrzędnych' : 'Gdzie leży ta mapa?'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {fileName}
          </Typography>
          {mode === 'crs' ? (
            <>
              <TextField
                select
                size="small"
                label="Układ pliku"
                value={epsg}
                onChange={(e) => setEpsg(Number(e.target.value))}
              >
                {MAP_CRS.map((c) => (
                  <MenuItem key={c.epsg} value={c.epsg}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" color="text.secondary">
                Plik ma współrzędne, ale nie mówi, w jakim układzie. Sprawdź w QGIS (Właściwości
                warstwy, Źródło) albo w opisie pobranego pliku.
              </Typography>
            </>
          ) : (
            <>
              <TextField
                select
                size="small"
                label="Seria map"
                value={series}
                onChange={(e) => setSeries(e.target.value as SheetSeries | 'none' | 'auto')}
              >
                {SERIES.filter((s) => auto || s.id !== 'auto').map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
              {series === 'auto' && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Claude odczyta numer arkusza, ramkę i nazwy miejscowości, a serwer znajdzie je
                    na dzisiejszej mapie. Idzie tylko pomniejszony obraz i obecny widok jako
                    podpowiedź; to jeden odczyt z dziennego limitu. Najlepiej działa, gdy mapa w tle
                    pokazuje okolicę skanu.
                  </Typography>
                  {!member && <TurnstileWidget onToken={onToken} resetKey={0} />}
                </>
              )}
              {series !== 'none' && series !== 'auto' && (
                <TextField
                  size="small"
                  label="Numer arkusza"
                  placeholder={example}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              )}
              <Typography variant="caption" color="text.secondary">
                Potem przeciągniesz 4 narożniki, aż mapa pokryje się z ortofotomapą. Numer arkusza
                tylko ustawia ją od razu w dobrym miejscu.
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>
          Anuluj
        </Button>
        <Button
          variant="contained"
          disabled={
            mode === 'scan' &&
            (series === 'auto' ? !member && !token : series !== 'none' && !number.trim())
          }
          onClick={() =>
            onSubmit(
              mode === 'crs'
                ? { epsg }
                : series === 'auto'
                  ? { auto: { turnstileToken: member ? null : token } }
                  : { sheet: series === 'none' ? undefined : { series, number } },
            )
          }
        >
          {mode === 'crs' ? 'Wczytaj' : 'Umieść'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
