import type { SubmissionStatus } from '@/shared/types/sources';

// the backend's address and Turnstile key are shared with the map reading (history)
export {
  BACKEND_ENABLED as SOURCES_ENABLED,
  BACKEND_URL as SOURCES_API_URL,
  TURNSTILE_SITE_KEY,
} from '@/shared/config/backend';

/** Longest side sent: the model scales larger images down anyway. */
export const IMAGE_MAX_SIDE = 1568;
export const MAX_FILES = 5;
/** how often analyses that may still change are checked (in the background, app-wide) */
export const POLL_MS = 60_000;

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  nowe: 'Czeka na analizę',
  w_kolejce: 'Analiza w toku',
  gotowe: 'Gotowe',
  do_przegladu: 'Czeka na zatwierdzenie',
  zatwierdzone: 'Zatwierdzone',
  odrzucone: 'Odrzucone',
  czeka_na_budzet: 'Czeka na przyszły miesiąc',
  blad: 'Błąd analizy',
};

/** statuses that may still change, so they are polled */
export const PENDING: readonly SubmissionStatus[] = [
  'nowe',
  'w_kolejce',
  'czeka_na_budzet',
  'do_przegladu',
];

/** still being worked on by the server: counted on the activity chip ("Na serwerze") */
export const WAITING: readonly SubmissionStatus[] = ['nowe', 'w_kolejce'];

/** a result came (or the analysis failed): the user is told once */
export const READY: readonly SubmissionStatus[] = ['gotowe', 'do_przegladu', 'blad'];
