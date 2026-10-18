import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useToastStore } from '@/shared/ui';
import type { Candidate } from '@/shared/types/domain';
import { PROTECTED_MESSAGE } from '../config/interpretationStyle';
import {
  acceptCandidate,
  ProtectedCandidateError,
  rejectCandidate,
  restoreCandidate,
} from '../services/candidateDecisions';
import { useAnalysisStore } from '../store/useAnalysisStore';

/** UI-level actions with feedback: select (and fly), accept, reject, restore. */
export function useCandidateActions() {
  const select = useAnalysisStore((s) => s.select);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);

  return {
    focus: (c: Candidate) => {
      select(c.id);
      flyTo({ lat: c.lat, lng: c.lng, zoom: 18, offsetY: bottomSheetOffset() });
    },
    accept: async (c: Candidate) => {
      try {
        const point = await acceptCandidate(c);
        showToast(`Do sprawdzenia: ${point.name}`);
      } catch (e) {
        showToast(
          e instanceof ProtectedCandidateError ? PROTECTED_MESSAGE : 'Nie udało się przyjąć',
        );
      }
    },
    reject: async (c: Candidate) => {
      await rejectCandidate(c);
      showToast('Odrzucono');
    },
    restore: async (c: Candidate) => {
      await restoreCandidate(c);
    },
  };
}
