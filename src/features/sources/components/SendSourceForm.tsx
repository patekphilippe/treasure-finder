import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useCallback, useRef, useState } from 'react';
import { SOURCES_PRIVACY_NOTE } from '@/features/safety';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import type { SubmissionMode } from '@/shared/types/sources';
import { Icon, useToastStore } from '@/shared/ui';
import { MAX_FILES } from '../config/sourcesApi';
import { sourcesApi } from '../services/sourcesApi';
import { useSourcesStore } from '../store/useSourcesStore';
import { deviceId } from '../utils/deviceId';
import { shrinkImage } from '../utils/shrinkImage';
import { TurnstileWidget } from './TurnstileWidget';

interface SendSourceFormProps {
  onSent: () => void;
  /** sending is off in this build: the form is shown greyed so people see what will be there */
  disabled?: boolean;
}

export function SendSourceForm({ onSent, disabled = false }: SendSourceFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [mode, setMode] = useState<SubmissionMode>('private');
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const add = useSourcesStore((s) => s.add);
  const showToast = useToastStore((s) => s.show);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  const empty = !files.length && !text.trim() && !link.trim();
  const canSend = !disabled && !busy && !empty && !!token && (mode === 'private' || consent);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('mode', mode);
      form.append('deviceId', deviceId());
      form.append('turnstile', token ?? '');
      if (text.trim()) form.append('text', text.trim());
      if (link.trim()) form.append('link', link.trim());
      if (consent) form.append('consentPublish', 'true');
      const bounds = useMapViewStore.getState().bounds;
      if (bounds) form.append('viewBbox', JSON.stringify(bounds));
      for (const f of await Promise.all(files.map(shrinkImage))) form.append('files', f);
      const created = await sourcesApi.send(form);
      add({
        id: created.id,
        accessKey: created.accessKey,
        mode,
        label: files[0]?.name ?? (text.trim().slice(0, 40) || link.trim()),
        sentAt: Date.now(),
        view: null,
        accepted: [],
      });
      setFiles([]);
      setText('');
      setLink('');
      setConsent(false);
      showToast('Wysłano. Wynik pojawi się w „Moje źródła”, zwykle w ciągu godziny');
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się wysłać');
    } finally {
      // a Turnstile token works once
      setResetKey((k) => k + 1);
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5} data-tour="sources-send">
      <Typography variant="body2" color="text.secondary">
        Zdjęcie dawnej mapy, fragment kroniki albo wspomnienie („za kościołem stał młyn”). AI
        odczyta z niego młyny, karczmy i dawne zabudowania i pokaże je na mapie. Najpierw ustaw mapę
        na okolicy, której dotyczy źródło.
      </Typography>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept="image/*,application/pdf"
        onChange={(e) => {
          const picked = [...(e.target.files ?? [])].slice(0, MAX_FILES);
          setFiles(picked);
          e.target.value = '';
        }}
      />
      <Button
        variant="outlined"
        color="inherit"
        disabled={disabled}
        startIcon={<Icon name="camera" size={18} />}
        onClick={() => inputRef.current?.click()}
      >
        {files.length ? `Wybrano: ${files.map((f) => f.name).join(', ')}` : 'Zdjęcie lub skan mapy'}
      </Button>
      <TextField
        size="small"
        label="Opis albo fragment tekstu"
        disabled={disabled}
        multiline
        minRows={2}
        maxRows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        slotProps={{ htmlInput: { maxLength: 20000 } }}
      />
      <TextField
        size="small"
        label="Link do źródła (opcjonalnie)"
        disabled={disabled}
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        disabled={disabled}
        value={mode}
        onChange={(_, v) => v && setMode(v)}
        sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 999 }}
      >
        <ToggleButton value="private">Tylko dla mnie</ToggleButton>
        <ToggleButton value="public">Podziel się z innymi</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'public' && (
        <FormControlLabel
          control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
          label={
            <Typography variant="body2">
              Zgadzam się na publikację odczytanych obiektów (współrzędne i opis, bez zdjęć) po
              zatwierdzeniu
            </Typography>
          }
        />
      )}
      {!disabled && <TurnstileWidget onToken={onToken} resetKey={resetKey} />}
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        variant="contained"
        disabled={!canSend}
        startIcon={<Icon name="paper-plane" size={18} />}
        onClick={() => void send()}
      >
        {busy ? 'Wysyłanie…' : 'Wyślij'}
      </Button>
      <Typography variant="caption" color="text.secondary">
        {SOURCES_PRIVACY_NOTE}
      </Typography>
    </Stack>
  );
}
