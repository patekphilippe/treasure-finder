import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useState } from 'react';

interface NoteDialogProps {
  initial: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

/** Mounted only while open, so the text always starts from `initial`. */
export function NoteDialog({ initial, onSave, onClose }: NoteDialogProps) {
  const [note, setNote] = useState(initial);

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
    >
      <DialogTitle>Notatka</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          value={note}
          placeholder="np. widoczne na SVF, sprawdzić na mapie z 1937 r."
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSave(note.trim());
          }}
          sx={{ mt: 0.5 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={() => onSave(note.trim())}>
          Zapisz
        </Button>
      </DialogActions>
    </Dialog>
  );
}
