import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { useRef } from 'react';
import { Icon } from '@/shared/ui';

interface PhotoInputProps {
  /** object URL of the current photo, if any */
  previewUrl: string | null;
  busy: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}

export function PhotoInput({ previewUrl, busy, onPick, onRemove }: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = '';
        }}
      />
      {previewUrl ? (
        <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
          <Box
            component="img"
            src={previewUrl}
            alt="Zdjęcie punktu"
            sx={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'cover' }}
          />
          <IconButton
            aria-label="Usuń zdjęcie"
            onClick={onRemove}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.55)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <Icon name="times" size={18} />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          color="inherit"
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} /> : <Icon name="camera" size={20} />}
          onClick={() => inputRef.current?.click()}
          sx={{ borderRadius: '12px', borderStyle: 'dashed', py: 1.5, color: 'text.secondary' }}
        >
          {busy ? 'Przetwarzam zdjęcie…' : 'Dodaj zdjęcie'}
        </Button>
      )}
    </>
  );
}
