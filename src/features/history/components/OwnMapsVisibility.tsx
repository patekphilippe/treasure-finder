import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useUiStore } from '@/shared/store/useUiStore';
import type { OwnMap } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { shownMaps } from '../utils/shownMaps';
import { readableMapName } from '../utils/readableMapName';

/**
 * Warstwy: which of your maps are shown, in one field grouped by year (by name or year, a whole
 * year at once); the others are hidden. Choosing here turns the year slider off. Maps are loaded
 * and fitted in Dane.
 */
export function OwnMapsVisibility() {
  const maps = useOwnMapsStore((s) => s.maps);
  const chosen = useOwnMapsStore((s) => s.years);
  const setYears = useOwnMapsStore((s) => s.setYears);
  const setTimeYear = useOwnMapsStore((s) => s.setTimeYear);
  const update = useOwnMapsStore((s) => s.update);
  const showSheet = useUiStore((s) => s.showSheet);
  // by year (oldest first, those without a year last), then by name
  const sorted = useMemo(
    () =>
      [...maps].sort(
        (a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.name.localeCompare(b.name, 'pl'),
      ),
    [maps],
  );
  const shownList = useMemo(() => shownMaps(sorted, chosen), [sorted, chosen]);
  const yearOf = (m: OwnMap) => (m.year ? String(m.year) : 'Bez roku');

  // the list decides alone: the slider goes off and the chosen maps are switched on, the rest off
  const show = (picked: readonly OwnMap[]) => {
    const ids = new Set(picked.map((m) => m.id));
    setTimeYear(null);
    setYears(null);
    for (const m of maps)
      if (m.visible !== ids.has(m.id)) void update(m.id, { visible: ids.has(m.id) });
  };

  return (
    <Stack data-tour="layers-own-maps" spacing={0.5}>
      {maps.length > 0 ? (
        <Autocomplete
          multiple
          size="small"
          disableCloseOnSelect
          limitTags={2}
          getLimitTagsText={(more) => `+${more}`}
          options={sorted}
          value={shownList}
          groupBy={yearOf}
          getOptionLabel={(m) => readableMapName(m.name)}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          noOptionsText="Brak takiej mapy"
          // a long name stays on one line with the typing space next to it
          sx={{ '& .MuiAutocomplete-tag': { maxWidth: 'calc(100% - 72px)' } }}
          // typing finds a map by its name or its year
          filterOptions={(options, { inputValue }) => {
            const q = inputValue.trim().toLowerCase();
            return q
              ? options.filter((m) =>
                  `${readableMapName(m.name)} ${m.year ?? ''}`.toLowerCase().includes(q),
                )
              : options;
          }}
          renderGroup={(group) => (
            <li key={group.key}>
              <ListSubheader
                component="div"
                sx={{ cursor: 'pointer', lineHeight: '40px', display: 'flex', gap: 1 }}
                // keep the list open: a tap on the year shows all its maps
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  show([...shownList, ...sorted.filter((m) => yearOf(m) === group.group)])
                }
              >
                <b>{group.group}</b>
                <Typography component="span" variant="caption" sx={{ lineHeight: 'inherit' }}>
                  pokaż wszystkie
                </Typography>
              </ListSubheader>
              <ul style={{ padding: 0 }}>{group.children}</ul>
            </li>
          )}
          renderOption={({ key, ...props }, m) => (
            <li key={key} {...props}>
              <Stack sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                  {readableMapName(m.name)}
                </Typography>
                {m.shared && !m.shared.mine && (
                  <Typography variant="caption" color="text.secondary">
                    od: {m.shared.author ?? 'członka społeczności'}
                  </Typography>
                )}
              </Stack>
            </li>
          )}
          onChange={(_, v) => show(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`Twoje mapy (${shownList.length} z ${maps.length})`}
              placeholder={shownList.length ? '' : 'Nazwa albo rok'}
            />
          )}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Nie masz jeszcze własnych map. Skan albo GeoTIFF wczytasz w Danych.
        </Typography>
      )}
      <Button
        size="small"
        color="inherit"
        startIcon={<Icon name="exchange-alt" size={16} />}
        onClick={() => showSheet('data')}
        sx={{ alignSelf: 'flex-start' }}
      >
        {maps.length ? 'Wczytaj albo dopasuj w Danych' : 'Otwórz Dane'}
      </Button>
    </Stack>
  );
}
