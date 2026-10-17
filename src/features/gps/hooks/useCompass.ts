import { useEffect } from 'react';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { headingFromOrientation, type OrientationReading } from '../utils/headingFromOrientation';

/** Smallest heading change (degrees) worth a re-render. */
const MIN_DELTA = 2;

/** Listens to absolute device orientation and publishes the compass heading. */
export function useCompass(): void {
  const setHeading = useFieldStore((s) => s.setHeading);

  useEffect(() => {
    const eventName =
      'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    let last: number | null = null;

    const onOrientation = (event: Event) => {
      const heading = headingFromOrientation(
        event as unknown as OrientationReading,
        screen.orientation?.angle ?? 0,
      );
      if (heading === null) return;
      const delta = last === null ? Infinity : Math.abs(((heading - last + 540) % 360) - 180);
      if (delta < MIN_DELTA) return;
      last = heading;
      setHeading(heading);
    };

    window.addEventListener(eventName, onOrientation);
    return () => window.removeEventListener(eventName, onOrientation);
  }, [setHeading]);
}
