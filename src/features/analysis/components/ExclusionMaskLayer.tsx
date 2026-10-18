import { useMemo } from 'react';
import { Image2180Layer } from '@/features/map';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { exclusionCanvas } from '../utils/exclusionCanvas';

/** Cells left out of the analysis by BDOT10k (buildings red, paved roads orange, water blue). */
export function ExclusionMaskLayer() {
  const exclusion = useAnalysisStore((s) => s.exclusion);
  const visible = useAnalysisStore((s) => s.exclusionVisible);
  const source = useMemo(
    () =>
      exclusion && {
        image: exclusionCanvas(exclusion.mask, exclusion.w, exclusion.h),
        originE: exclusion.originE,
        originN: exclusion.originN,
        res: exclusion.res,
      },
    [exclusion],
  );
  if (!source || !visible) return null;
  return <Image2180Layer source={source} zIndex={55} />;
}
