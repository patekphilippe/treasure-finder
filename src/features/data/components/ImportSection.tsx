import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useContextStore } from '@/features/history';
import { ImportError } from '@/shared/lib/io/parseBackup';
import { Icon } from '@/shared/ui';
import { applyImport } from '../services/applyImport';
import { readImportFile } from '../services/readImportFile';
import { describeImport } from '../utils/describeImport';

type Result = { ok: true; lines: string[] } | { ok: false; message: string };

export function ImportSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const importFile = async (file: File) => {
    setBusy(true);
    setResult(null);
    try {
      const summary = await applyImport(await readImportFile(file));
      if (summary.contextAdded) void useContextStore.getState().load();
      setResult({ ok: true, lines: describeImport(summary) });
    } catch (e) {
      setResult({
        ok: false,
        message: e instanceof ImportError ? e.message : 'Nie udało się wczytać pliku',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack data-tour="data-import" spacing={1.25}>
      <Typography variant="overline" color="text.secondary">
        Import
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Kopia ZIP z tej aplikacji lub z wersji 1, sam plik kopia.json albo GeoJSON z QGIS (układ
        EPSG:4326): punkty, kontekst z map archiwalnych (pole kind) lub wody z BDOT10k. Dane są
        łączone, nic nie zostanie usunięte.
      </Typography>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".zip,.json,.geojson,application/zip,application/json,application/geo+json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importFile(file);
          e.target.value = '';
        }}
      />
      <Button
        variant="outlined"
        color="inherit"
        disabled={busy}
        startIcon={busy ? <CircularProgress size={16} /> : <Icon name="file-import" size={20} />}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? 'Wczytuję…' : 'Wczytaj plik'}
      </Button>
      {result?.ok && (
        <Alert
          severity="success"
          icon={<Icon name="check" size={20} />}
          onClose={() => setResult(null)}
        >
          {result.lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </Alert>
      )}
      {result && !result.ok && (
        <Alert severity="error" onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}
    </Stack>
  );
}
