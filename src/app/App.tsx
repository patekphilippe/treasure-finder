import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { lazy, Suspense } from 'react';
import { useLoadCandidates } from '@/features/analysis/field';
import { useCompass, useGeolocation } from '@/features/gps';
import { useLoadPoints } from '@/features/points';
import { useLoadAreas } from '@/features/roughness';
import { LegalIntroDialog } from '@/features/safety';
import { useTrackRecorder } from '@/features/tracks';
import { useLoadZones, useZoneAlerts } from '@/features/zones';
import { Toast } from '@/shared/ui';
import { AppGlobalStyles } from './components/AppGlobalStyles';
import { FieldLayout } from './components/FieldLayout';
import { TopBar } from './components/TopBar';
import { useAppTheme } from './hooks/useAppTheme';
import { useUiStore } from '@/shared/store/useUiStore';

// analysis (laptop) is loaded only when opened — keeps the field app light on phones
const AnalysisView = lazy(() =>
  import('@/features/analysis').then((m) => ({ default: m.AnalysisView })),
);

export function App() {
  const theme = useAppTheme();
  useGeolocation();
  useCompass();
  useTrackRecorder();
  useLoadPoints();
  useLoadZones();
  useZoneAlerts();
  useLoadAreas();
  useLoadCandidates();
  const mode = useUiStore((s) => s.mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <AppGlobalStyles />
      <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        {mode === 'field' ? (
          <FieldLayout />
        ) : (
          <Suspense fallback={null}>
            <AnalysisView />
          </Suspense>
        )}
        <TopBar />
        <Toast />
        <LegalIntroDialog />
      </div>
    </ThemeProvider>
  );
}
