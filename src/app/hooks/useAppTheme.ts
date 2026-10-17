import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemo } from 'react';
import { createAppTheme } from '../theme/createAppTheme';

/** Light/dark theme following the system setting. */
export function useAppTheme() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  return useMemo(() => createAppTheme(prefersDark ? 'dark' : 'light'), [prefersDark]);
}
