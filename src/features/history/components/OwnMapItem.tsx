import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { OwnMap } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { METHOD_LABEL } from '../config/ownMaps';
import { parseMapYear } from '../utils/parseMapYear';
import { readableMapName } from '../utils/readableMapName';

interface OwnMapItemProps {
  map: OwnMap;
  onChange: (patch: Partial<OwnMap>) => void;
  onShow: () => void;
  onFit: () => void;
  onDelete: () => void;
  /** throw away its AI reading and read it again; only for a map already read */
  onReread?: () => void;
}

export function OwnMapItem({ map, onChange, onShow, onFit, onDelete, onReread }: OwnMapItemProps) {
  // someone else's shared map: shown and switched here, changed only by its author
  const editable = !map.shared || map.shared.mine;
  return (
    <Stack spacing={1.25} sx={{ bgcolor: 'action.hover', borderRadius: '12px', p: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Icon name="map" size={20} />
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {readableMapName(map.name)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {map.shared
              ? map.shared.mine
                ? 'Udostępniona społeczności'
                : `Wspólna, od: ${map.shared.author ?? 'członka społeczności'}`
              : `${METHOD_LABEL[map.method]}, ${map.width} × ${map.height} px`}
          </Typography>
        </Stack>
        <IconButton size="small" aria-label="Włącz i pokaż na mapie" onClick={onShow}>
          <Icon name="crosshairs" size={18} />
        </IconButton>
        {editable && (
          <IconButton size="small" aria-label="Dopasuj narożnikami" onClick={onFit}>
            <Icon name="vector-square" size={18} />
          </IconButton>
        )}
        {editable && onReread && map.readAt && (
          <IconButton size="small" aria-label="Przeczytaj od nowa (AI)" onClick={onReread}>
            <Icon name="redo" size={18} />
          </IconButton>
        )}
        {editable && (
          <IconButton size="small" aria-label="Usuń mapę" color="error" onClick={onDelete}>
            <Icon name="trash" size={18} />
          </IconButton>
        )}
      </Stack>
      <Stack spacing={0.5}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
          <Typography component="label" htmlFor={`rok-${map.id}`} variant="body2" sx={{ flex: 1 }}>
            Rok mapy
          </Typography>
          <TextField
            key={map.year ?? ''}
            id={`rok-${map.id}`}
            size="small"
            placeholder="np. 1936"
            defaultValue={map.year ?? ''}
            disabled={!editable}
            slotProps={{
              htmlInput: { inputMode: 'numeric', maxLength: 4, style: { textAlign: 'center' } },
            }}
            sx={{ width: 104 }}
            onBlur={(e) => {
              const year = parseMapYear(e.target.value);
              if (year === null) e.target.value = map.year ? String(map.year) : '';
              else if (year !== map.year) onChange({ year });
            }}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {editable
            ? 'Obiekty oznaczone na tej mapie dostaną ten rok.'
            : 'Rok zmienia autor mapy. Obiekty oznaczone na niej dostają ten rok.'}
        </Typography>
      </Stack>
    </Stack>
  );
}
