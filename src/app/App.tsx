import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AnalysisView } from '@/features/analysis';
import { useCompass, useGeolocation } from '@/features/gps';
import { useLoadPoints } from '@/features/points';
import { useTrackRecorder } from '@/features/tracks';
import { Toast } from '@/shared/ui';
import { AppGlobalStyles } from './components/AppGlobalStyles';
import { FieldLayout } from './components/FieldLayout';
import { TopBar } from './components/TopBar';
import { useAppTheme } from './hooks/useAppTheme';
import { useUiStore } from '@/shared/store/useUiStore';

export function App() {
  const theme = useAppTheme();
  useGeolocation();
  useCompass();
  useTrackRecorder();
  useLoadPoints();
  const mode = useUiStore((s) => s.mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <AppGlobalStyles />
      <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        {mode === 'field' ? <FieldLayout /> : <AnalysisView />}
        <TopBar />
        <Toast />
      </div>
    </ThemeProvider>
  );
}
