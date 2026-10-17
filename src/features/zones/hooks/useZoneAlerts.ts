import { useEffect } from 'react';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { ALERT_VIBRATION } from '../config/alerts';
import { useZoneAlertStore } from '../store/useZoneAlertStore';
import { useZonesStore } from '../store/useZonesStore';
import { updateMembership, type Membership } from '../utils/updateMembership';
import { sameAlert, zoneAlert } from '../utils/zoneAlert';

/** App-level: checks every GPS fix against the zones and vibrates when a new alert starts. */
export function useZoneAlerts(): void {
  useEffect(() => {
    let membership: Membership = {};
    const check = () => {
      const { position } = useFieldStore.getState();
      const { zones } = useZonesStore.getState();
      const { alert: prev, setAlert } = useZoneAlertStore.getState();
      if (!position || zones.length === 0) {
        membership = {};
        if (prev) setAlert(null);
        return;
      }
      membership = updateMembership(membership, position.lat, position.lng, position.accM, zones);
      const next = zoneAlert(membership, zones, Date.now());
      if (sameAlert(prev, next)) return;
      setAlert(next);
      if (next) navigator.vibrate?.(ALERT_VIBRATION);
    };
    const unsubField = useFieldStore.subscribe((s, p) => s.position !== p.position && check());
    const unsubZones = useZonesStore.subscribe((s, p) => s.zones !== p.zones && check());
    check();
    return () => {
      unsubField();
      unsubZones();
    };
  }, []);
}
