import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Stack
      spacing={1.5}
      sx={{ alignItems: 'center', textAlign: 'center', py: { xs: 2.5, md: 4 }, px: 2 }}
    >
      <Box
        sx={(theme) => ({
          width: 56,
          height: 56,
          borderRadius: '12px',
          display: 'grid',
          placeItems: 'center',
          color: 'primary.main',
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        })}
      >
        <Icon name={icon} size={28} />
      </Box>
      <Typography variant="subtitle2">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );
}
