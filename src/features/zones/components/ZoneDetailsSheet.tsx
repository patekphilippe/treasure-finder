import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useMountTime } from '@/shared/hooks/useMountTime';
import { useUiStore } from '@/shared/store/useUiStore';
import type { Zone } from '@/shared/types/domain';
import { ConfirmDialog, Icon, Sheet, useToastStore } from '@/shared/ui';
import { useZonesStore } from '../store/useZonesStore';
import { dateInputValue } from '../utils/dateInputValue';
import { isPermitValid } from '../utils/isPermitValid';
import { ZoneCoverage } from './ZoneCoverage';

interface ZoneDetailsSheetProps {
  onClose: () => void;
}

export function ZoneDetailsSheet({ onClose }: ZoneDetailsSheetProps) {
  const zoneId = useUiStore((s) => s.selectedZoneId);
  const zone = useZonesStore((s) => s.zones.find((z) => z.id === zoneId));
  const { save, remove } = useZonesStore();
  const showSheet = useUiStore((s) => s.showSheet);
  const showToast = useToastStore((s) => s.show);
  const [draft, setDraft] = useState<Zone | undefined>(zone);
  const [confirm, setConfirm] = useState(false);
  const now = useMountTime();
  if (!zone || !draft) return null;

  const set = (patch: Partial<Zone>) => setDraft({ ...draft, ...patch });
  const expired = zone.kind === 'zgoda' && !isPermitValid(zone, now);

  return (
    <Sheet
      title={zone.kind === 'zgoda' ? 'Strefa zgody' : 'Strefa zakazu'}
      onClose={() => showSheet('zones')}
    >
      <Stack spacing={2}>
        {expired && (
          <Alert severity="error">
            Termin zgody minął — przed poszukiwaniami odnów zgłoszenie i zgodę.
          </Alert>
        )}
        <TextField
          size="small"
          label="Nazwa"
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        {zone.kind === 'zgoda' && (
          <>
            <TextField
              size="small"
              label="Numer zgłoszenia"
              value={draft.permitNo ?? ''}
              onChange={(e) => set({ permitNo: e.target.value || undefined })}
            />
            <TextField
              size="small"
              label="Właściciel terenu"
              value={draft.owner ?? ''}
              onChange={(e) => set({ owner: e.target.value || undefined })}
            />
            <TextField
              size="small"
              type="date"
              label="Zgoda ważna do"
              value={dateInputValue(draft.validUntil)}
              onChange={(e) =>
                set({
                  validUntil: e.target.value ? Date.parse(`${e.target.value}T23:59:59`) : undefined,
                })
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <ZoneCoverage zone={zone} />
          </>
        )}
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button
            variant="contained"
            sx={{ flex: 1 }}
            onClick={async () => {
              await save({ ...draft, name: draft.name.trim() || zone.name });
              showToast('Zapisano strefę');
              onClose();
            }}
          >
            Zapisz
          </Button>
          <Button
            color="error"
            startIcon={<Icon name="trash-alt" size={18} />}
            onClick={() => setConfirm(true)}
          >
            Usuń
          </Button>
        </Stack>
      </Stack>
      <ConfirmDialog
        open={confirm}
        title="Usunąć strefę?"
        message={zone.name}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await remove(zone.id);
          setConfirm(false);
          showSheet('zones');
        }}
      />
    </Sheet>
  );
}
