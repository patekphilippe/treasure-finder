import GlobalStyles from '@mui/material/GlobalStyles';
import { alpha } from '@mui/material/styles';

export function AppGlobalStyles() {
  return (
    <GlobalStyles
      styles={(theme) => ({
        'html, body, #root': { height: '100%' },
        body: {
          overscrollBehavior: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitFontSmoothing: 'antialiased',
        },
        // thin scrollbar on a transparent track, visible only over the scrolled area
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
        },
        '*:hover, *:focus-within': {
          scrollbarColor: `${alpha(theme.palette.text.primary, 0.22)} transparent`,
        },
        '.leaflet-container': {
          background: theme.palette.background.default,
          fontFamily: theme.typography.fontFamily,
        },
      })}
    />
  );
}
