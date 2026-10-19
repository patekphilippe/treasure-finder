import { useEffect, useState } from 'react';

/** The review panel lives at …/#admin; everything else is the map. */
export function useIsAdminRoute(): boolean {
  const [admin, setAdmin] = useState(() => window.location.hash === '#admin');
  useEffect(() => {
    const onHash = () => setAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return admin;
}
