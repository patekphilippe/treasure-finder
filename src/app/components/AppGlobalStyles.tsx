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
        '.leaflet-container': {
          background: theme.palette.background.default,
          fontFamily: theme.typography.fontFamily,
        },
        '.leaflet-control-attribution': {
          fontSize: '10px !important',
          background: `${alpha(theme.palette.background.paper, 0.7)} !important`,
          backdropFilter: 'blur(8px)',
          color: `${theme.palette.text.secondary} !important`,
          borderTopLeftRadius: 8,
          '& a': { color: `${theme.palette.text.secondary} !important` },
        },
        // keep attribution visible above the floating dock
        '.leaflet-bottom.leaflet-right': {
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
        },
      })}
    />
  );
}
