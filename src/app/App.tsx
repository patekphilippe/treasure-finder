import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { lazy, Suspense } from 'react';
import { useLoadCandidates, useLoadReliefs } from '@/features/analysis/field';
import { useCompass, useGeolocation } from '@/features/gps';
import { UpdatePrompt } from '@/features/offline';
import { useLoadPoints } from '@/features/points';
import { useLoadAreas } from '@/features/roughness';
import { LegalIntroDialog } from '@/features/safety';
import { useCommunitySignIn } from '@/features/history';
import { useTrackRecorder } from '@/features/tracks';
import { TutorialTour, useTutorialStore } from '@/features/tutorial';
import { useLoadZones, useZoneAlerts } from '@/features/zones';
import { Toast } from '@/shared/ui';
import { AppGlobalStyles } from './components/AppGlobalStyles';
import { FieldLayout } from './components/FieldLayout';
import { TopBar } from './components/TopBar';
import { useAppTheme } from './hooks/useAppTheme';
import { useContextRecompute } from './hooks/useContextRecompute';
import { useIsAdminRoute } from './hooks/useIsAdminRoute';
import { useUiStore } from '@/shared/store/useUiStore';

// analysis (laptop) is loaded only when opened — keeps the field app light on phones
const AnalysisView = lazy(() =>
  import('@/features/analysis').then((m) => ({ default: m.AnalysisView })),
);
// review panel for the owner (…/#admin), never loaded for normal use
const AdminPanel = lazy(() =>
  import('@/features/sources/admin').then((m) => ({ default: m.AdminPanel })),
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
  useLoadReliefs();
  useContextRecompute();
  useCommunitySignIn();
  const mode = useUiStore((s) => s.mode);
  const startTourIfNew = useTutorialStore((s) => s.startIfNew);
  const admin = useIsAdminRoute();

  if (admin)
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <Suspense fallback={null}>
          <AdminPanel />
        </Suspense>
      </ThemeProvider>
    );

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
        <UpdatePrompt />
        <LegalIntroDialog onSeen={startTourIfNew} />
        <TutorialTour />
      </div>
    </ThemeProvider>
  );
}
