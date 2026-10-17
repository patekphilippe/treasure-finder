import { useEffect } from 'react';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { WATCH_OPTIONS } from '../config/gps';

/** Starts watching the device position for the lifetime of the component. */
export function useGeolocation(): void {
  const setPosition = useFieldStore((s) => s.setPosition);
  const setGpsError = useFieldStore((s) => s.setGpsError);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Ta przeglądarka nie obsługuje GPS');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accM: pos.coords.accuracy,
          t: pos.timestamp,
        });
      },
      (err) =>
        setGpsError(
          err.code === err.PERMISSION_DENIED ? 'Brak zgody na lokalizację' : 'GPS niedostępny',
        ),
      WATCH_OPTIONS,
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [setPosition, setGpsError]);
}
