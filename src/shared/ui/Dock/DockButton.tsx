import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Icon } from '../Icon/Icon';

interface DockButtonProps {
  icon: string;
  label: string;
  /** `data-tour` anchor for the guided tour */
  tourId?: string;
  active: boolean;
  primary: boolean;
  onClick: () => void;
}

export function DockButton({ icon, label, tourId, active, primary, onClick }: DockButtonProps) {
  return (
    <ButtonBase
      data-tour={tourId}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      sx={(theme) => ({
        flexDirection: 'column',
        gap: 0.25,
        height: 56,
        borderRadius: '10px',
        color: active ? 'primary.main' : 'text.secondary',
        backgroundColor:
          active && !primary ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
        transition: 'background-color 150ms, color 150ms, transform 120ms',
        '&:hover': { color: active ? 'primary.main' : 'text.primary' },
        '&:active': { transform: 'scale(0.95)' },
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}` },
      })}
    >
      {primary ? (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
          }}
        >
          <Icon name={icon} size={24} />
        </Box>
      ) : (
        <>
          <Icon name={icon} size={23} />
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11, lineHeight: 1.2 }}>
            {label}
          </Typography>
        </>
      )}
    </ButtonBase>
  );
}
