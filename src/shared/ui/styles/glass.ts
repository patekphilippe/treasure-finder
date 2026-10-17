import { alpha, type Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

/** Frosted, floating surface used for everything that sits on top of the map. */
export function glass(theme: Theme): SystemStyleObject<Theme> {
  return {
    backgroundColor: alpha(theme.palette.background.paper, 0.78),
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[8],
  };
}
