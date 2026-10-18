import GlobalStyles from '@mui/material/GlobalStyles';
import { useTheme } from '@mui/material/styles';
import { EVENTS, Joyride, STATUS, type EventData } from 'react-joyride';
import { useUiStore } from '@/shared/store/useUiStore';
import { useTutorialStore } from '../store/useTutorialStore';
import { markTourTarget, TOUR_ACTIVE_ATTR } from '../utils/markTourTarget';
import { markTourSeen } from '../utils/tourSeen';
import { TutorialTooltip } from './TutorialTooltip';

/** Guided tour over every part of the app; shown on first launch and from the help button. */
export function TutorialTour() {
  const theme = useTheme();
  const { running, runId, steps, stop } = useTutorialStore();

  const onEvent = (data: EventData) => {
    const ended =
      data.type === EVENTS.TOUR_END ||
      data.status === STATUS.FINISHED ||
      data.status === STATUS.SKIPPED;
    if (!ended || !useTutorialStore.getState().running) return;
    markTourSeen();
    markTourTarget(null);
    stop();
    useUiStore.getState().setMode('field');
  };

  return (
    <>
      <GlobalStyles
        styles={{
          [`[${TOUR_ACTIVE_ATTR}]`]: {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 6,
            borderRadius: 6,
          },
        }}
      />
      <Joyride
        key={runId}
        run={running}
        continuous
        steps={steps}
        onEvent={onEvent}
        tooltipComponent={TutorialTooltip}
        options={{
          zIndex: 1500,
          primaryColor: theme.palette.primary.main,
          arrowColor: theme.palette.background.paper,
          overlayColor: 'rgba(0, 0, 0, 0.55)',
          skipBeacon: true,
          blockTargetInteraction: true,
          overlayClickAction: false,
          closeButtonAction: 'skip',
          targetWaitTimeout: 3000,
          // showTourView scrolls inside the sheet; joyride would scroll the whole page
          skipScroll: true,
          spotlightRadius: 12,
          spotlightPadding: 8,
        }}
      />
    </>
  );
}
