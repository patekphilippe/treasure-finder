import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useContextStore } from '@/features/history';
import { ImportError } from '@/shared/lib/io/parseBackup';
import { trackActivity } from '@/shared/store/trackActivity';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, useToastStore } from '@/shared/ui';
import { applyImport } from '../services/applyImport';
import { readImportFile } from '../services/readImportFile';
import { describeImport } from '../utils/describeImport';

type Result = { ok: true; lines: string[] } | { ok: false; message: string };

export function ImportSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // a task on the activity chip; with Dane closed meanwhile the result comes as a toast
  const importFile = async (file: File) => {
    setBusy(true);
    setResult(null);
    let done: Result;
    try {
      const summary = await trackActivity(
        {
          id: 'import',
          label: `Import ${file.name}`,
          short: 'Import',
          step: 'Czytam plik',
          open: { mode: 'field', sheet: 'data' },
        },
        async (update) => {
          const payload = await readImportFile(file);
          update({ step: 'Zapisuję dane' });
          return applyImport(payload);
        },
      );
      if (summary.contextAdded) void useContextStore.getState().load();
      done = { ok: true, lines: describeImport(summary) };
    } catch (e) {
      done = {
        ok: false,
        message: e instanceof ImportError ? e.message : 'Nie udało się wczytać pliku',
      };
    } finally {
      setBusy(false);
    }
    setResult(done);
    if (useUiStore.getState().activeSheet !== 'data')
      useToastStore.getState().show(done.ok ? (done.lines[0] ?? 'Wczytano') : done.message);
  };

  return (
    <Stack
      data-tour="data-import"
      spacing={1.25}
      sx={{ bgcolor: 'action.hover', borderRadius: '12px', p: 1.5 }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <Icon name="file-import" size={22} />
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">Wczytaj kopię</Typography>
          <Typography variant="caption" color="text.secondary">
            Kopia ZIP z innego urządzenia albo plik GeoJSON z QGIS. Wczytane dane dochodzą do
            Twoich, nic nie znika.
          </Typography>
        </Stack>
      </Stack>
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
        {busy ? 'Wczytuję…' : 'Wybierz plik'}
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
