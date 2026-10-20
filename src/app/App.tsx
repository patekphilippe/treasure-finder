import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { lazy, Suspense } from 'react';
import { useLoadCandidates, useLoadReliefs } from '@/features/analysis/field';
import { useCompass, useGeolocation } from '@/features/gps';
import { MovedNotice, UpdatePrompt } from '@/features/offline';
import { useLoadPoints } from '@/features/points';
import { useLoadAreas } from '@/features/roughness';
import { LegalIntroDialog } from '@/features/safety';
import { useSourcesPolling } from '@/features/sources';
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
  useSourcesPolling();
  const mode = useUiStore((s) => s.mode);
  const startTourIfNew = useTutorialStore((s) => s.startIfNew);
  const admin = useIsAdminRoute();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {admin ? (
        <Suspense fallback={null}>
          <AdminPanel />
        </Suspense>
      ) : (
        <>
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
            <MovedNotice />
            <LegalIntroDialog onSeen={startTourIfNew} />
            <TutorialTour />
          </div>
        </>
      )}
      {/* on both routes, so a waiting new version can be taken from the owner's panel too */}
      <UpdatePrompt />
    </ThemeProvider>
  );
}
