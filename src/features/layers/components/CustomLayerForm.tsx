import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useState } from 'react';
import type { CustomLayer } from '@/shared/types/domain';
import { validateCustomLayer } from '../utils/validateCustomLayer';

interface CustomLayerFormProps {
  onAdd: (layer: CustomLayer) => void;
  onCancel: () => void;
}

export function CustomLayerForm({ onAdd, onCancel }: CustomLayerFormProps) {
  const [kind, setKind] = useState<'xyz' | 'wms'>('xyz');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [layers, setLayers] = useState('');
  const [maxZoom, setMaxZoom] = useState('19');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const result = validateCustomLayer({ name, kind, url, layers, maxNativeZoom: Number(maxZoom) });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdd(result.layer);
  };

  return (
    <Stack spacing={1.5} sx={{ pt: 1 }}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={kind}
        onChange={(_, v: 'xyz' | 'wms' | null) => v && setKind(v)}
        sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 999 }}
      >
        <ToggleButton value="xyz">XYZ</ToggleButton>
        <ToggleButton value="wms">WMS</ToggleButton>
      </ToggleButtonGroup>
      <TextField
        size="small"
        label="Nazwa"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        size="small"
        label="Adres"
        value={url}
        placeholder={kind === 'xyz' ? 'https://…/{z}/{x}/{y}.png' : 'https://…/wms'}
        onChange={(e) => setUrl(e.target.value)}
        slotProps={{ htmlInput: { inputMode: 'url', autoCapitalize: 'none', spellCheck: false } }}
      />
      {kind === 'wms' && (
        <TextField
          size="small"
          label="Warstwa (LAYERS)"
          value={layers}
          onChange={(e) => setLayers(e.target.value)}
        />
      )}
      <TextField
        size="small"
        label="Maks. zoom źródła"
        value={maxZoom}
        onChange={(e) => setMaxZoom(e.target.value.replace(/\D/g, ''))}
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
      />
      {error && (
        <Alert severity="error" sx={{ py: 0 }}>
          {error}
        </Alert>
      )}
      <Stack direction="row" sx={{ gap: 1, justifyContent: 'flex-end' }}>
        <Button color="inherit" onClick={onCancel}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={submit}>
          Dodaj warstwę
        </Button>
      </Stack>
    </Stack>
  );
}
