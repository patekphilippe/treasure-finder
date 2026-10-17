import { alpha, createTheme, type PaletteMode, type Theme } from '@mui/material/styles';

const TOKENS = {
  light: {
    primary: '#059669',
    bg: '#f4f4f5',
    paper: '#ffffff',
    text: '#18181b',
    textSecondary: '#71717a',
    divider: 'rgba(24, 24, 27, 0.08)',
    shadow: '0 1px 2px rgba(24, 24, 27, 0.06), 0 8px 32px rgba(24, 24, 27, 0.10)',
    shadowSmall: '0 1px 3px rgba(24, 24, 27, 0.18)',
  },
  dark: {
    primary: '#34d399',
    bg: '#09090b',
    paper: '#18181b',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    divider: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.45)',
    shadowSmall: '0 1px 3px rgba(0, 0, 0, 0.5)',
  },
} as const;

export function createAppTheme(mode: PaletteMode): Theme {
  const t = TOKENS[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, contrastText: mode === 'light' ? '#ffffff' : '#022c22' },
      error: { main: mode === 'light' ? '#dc2626' : '#f87171' },
      success: { main: t.primary },
      background: { default: t.bg, paper: t.paper },
      text: { primary: t.text, secondary: t.textSecondary },
      divider: t.divider,
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: 14,
      h5: { fontWeight: 650, letterSpacing: '-0.02em' },
      h6: { fontWeight: 650, fontSize: '1.05rem', letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
      caption: { letterSpacing: 0 },
    },
    // levels 1–4: small controls (switch thumb, slider); 5+: floating panels and dialogs
    shadows: [
      'none',
      ...Array<string>(4).fill(t.shadowSmall),
      ...Array<string>(20).fill(t.shadow),
    ] as Theme['shadows'],
    components: {
      MuiButtonBase: { defaultProps: { disableRipple: true } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 18 },
          sizeLarge: { paddingBlock: 10 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            transition: 'background-color 120ms, transform 120ms',
            '&:active': { transform: 'scale(0.94)' },
            '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.06) },
          }),
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiAlert: {
        styleOverrides: {
          // soft tint in the severity colour instead of MUI's heavy dark-mode blocks
          root: ({ theme, ownerState }) => {
            const color = theme.palette[ownerState.severity ?? 'info'].main;
            return {
              borderRadius: 10,
              ...(ownerState.variant === 'standard' && {
                backgroundColor: alpha(color, theme.palette.mode === 'dark' ? 0.16 : 0.1),
                color: theme.palette.text.primary,
                '& .MuiAlert-icon': { color },
              }),
            };
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 999 },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 999,
            paddingInline: 18,
            backgroundColor: theme.palette.text.primary,
            color: theme.palette.background.paper,
            fontWeight: 500,
            boxShadow: t.shadow,
          }),
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: { gap: 4 },
          grouped: { border: 0, borderRadius: '999px !important', margin: '0 !important' },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: 0,
            borderRadius: 999,
            paddingBlock: 6,
            paddingInline: 14,
            textTransform: 'none',
            fontWeight: 600,
            color: theme.palette.text.secondary,
            '&.Mui-selected, &.Mui-selected:hover': {
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            },
          }),
        },
      },
    },
  });
}
