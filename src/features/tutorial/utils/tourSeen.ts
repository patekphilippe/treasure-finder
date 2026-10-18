const TOUR_SEEN_KEY = 'mapa.tutorialSeen';

export function isTourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
  } catch {
    // private mode: the tour starts again next time
  }
}
