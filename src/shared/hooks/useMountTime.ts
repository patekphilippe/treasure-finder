import { useState } from 'react';

/** Current time captured once when the component mounts (render must stay pure). */
export function useMountTime(): number {
  const [now] = useState(() => Date.now());
  return now;
}
