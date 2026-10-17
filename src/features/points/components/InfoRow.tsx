import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface InfoRowProps {
  label: string;
  children: ReactNode;
}

export function InfoRow({ label, children }: InfoRowProps) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 2, minHeight: 32 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 104, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ flex: 1, minWidth: 0 }}>
        {children}
      </Typography>
    </Stack>
  );
}
