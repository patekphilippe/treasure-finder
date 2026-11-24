import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useId, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';

interface ToggleRowProps {
  icon: string;
  title: ReactNode;
  /** one short line under the title */
  caption?: ReactNode;
  checked?: boolean;
  onChange?: (on: boolean) => void;
  /** in place of the switch, e.g. a button when there is nothing to switch on yet */
  action?: ReactNode;
  /** settings of what is switched on, under the row only while it is on */
  children?: ReactNode;
  /** anchor for the guided tour */
  'data-tour'?: string;
}

/**
 * One thing that can be on the map: icon, name, one line of what it is, a switch. Tapping the
 * text toggles it too; its settings (opacity, width…) show under it only while it is on.
 */
export function ToggleRow({
  icon,
  title,
  caption,
  checked = false,
  onChange,
  action,
  children,
  'data-tour': tourId,
}: ToggleRowProps) {
  const id = useId();
  const switchable = !action && onChange !== undefined;
  return (
    <Box data-tour={tourId}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, minHeight: 52 }}>
        <Box sx={{ color: checked ? 'primary.main' : 'text.secondary', display: 'flex' }}>
          <Icon name={icon} size={22} />
        </Box>
        <Stack
          component={switchable ? 'label' : 'div'}
          htmlFor={switchable ? id : undefined}
          sx={{ flex: 1, minWidth: 0, py: 0.75, cursor: switchable ? 'pointer' : 'default' }}
        >
          <Typography variant="subtitle2">{title}</Typography>
          {caption && (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          )}
        </Stack>
        {action ??
          (onChange && (
            <Switch id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
          ))}
      </Stack>
      {children && (
        <Collapse in={checked}>
          <Stack spacing={0.75} sx={{ pl: 4.75, pr: 0.5, pb: 1 }}>
            {children}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
}
