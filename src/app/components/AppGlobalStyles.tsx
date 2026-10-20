import GlobalStyles from '@mui/material/GlobalStyles';
import { alpha } from '@mui/material/styles';
import { BESIDE_DOCK_MIN_WIDTH, besideDockBottom } from '@/shared/config/layout';
import { glass } from '@/shared/ui';

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
        // map data credits behind an ⓘ (features/map/hooks/useCompactAttribution.ts)
        '.leaflet-container .leaflet-control-attribution': {
          ...glass(theme),
          // Leaflet's own white background has the same specificity
          background: `${alpha(theme.palette.background.paper, 0.78)} !important`,
          margin: '0 12px 0 0 !important',
          padding: '6px 10px',
          maxWidth: 'min(calc(100vw - 24px), 420px)',
          borderRadius: '10px',
          fontSize: '11px !important',
          lineHeight: 1.45,
          color: `${theme.palette.text.secondary} !important`,
          cursor: 'pointer',
          '& a': { color: `${theme.palette.text.secondary} !important` },
          '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}` },
        },
        '.leaflet-container .tf-attribution:not(.tf-attribution--open)': {
          width: 32,
          height: 32,
          padding: 0,
          // centred over the 48 px follow button, 12 px from the edge
          marginRight: '20px !important',
          borderRadius: '999px',
          fontSize: '0 !important',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          '& > *': { display: 'none' },
          // la-info-circle from Line Awesome, like <Icon name="info-circle" />
          '&::before': {
            content: '"\\f05a"',
            fontFamily: "'Line Awesome Free'",
            fontWeight: 900,
            fontSize: 20,
            lineHeight: 1,
            color: alpha(theme.palette.text.primary, 0.7),
          },
        },
        // the credits sit above the follow button (features/map/components/FollowButton.tsx: 48 px,
        // 92 px from the bottom, beside the dock on wide screens)
        '.leaflet-bottom.leaflet-right': {
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 148px)',
          [theme.breakpoints.up(BESIDE_DOCK_MIN_WIDTH)]: {
            bottom: `calc(${besideDockBottom(48)} + 56px)`,
          },
        },
      })}
    />
  );
}
