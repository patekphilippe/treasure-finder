import { useState } from 'react';
import { INTRO_SEEN_KEY } from '../config/legal';

/** Whether the first-run legal intro was confirmed (persisted per device). */
export function useIntroSeen(): [boolean, () => void] {
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(INTRO_SEEN_KEY) === '1';
    } catch {
      return true;
    }
  });
  const confirm = () => {
    try {
      localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // private mode: show again next time
    }
    setSeen(true);
  };
  return [seen, confirm];
}
