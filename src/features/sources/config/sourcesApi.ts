import type { SubmissionStatus } from '@/shared/types/sources';

/**
 * Backend for AI analysis of historical sources (server/, docs/BACKEND.md). Both values are
 * public (the browser sees them anyway); a build may override them, e.g. for a test worker.
 */
const DEFAULT_API_URL = 'https://treasure-finder-api.treasure-finder-server.workers.dev';
// Cloudflare Turnstile site key of the widget for patekphilippe.github.io (public by design)
const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAAFbOm_C1nNH_sg35';

export const SOURCES_API_URL = String(
  import.meta.env.VITE_SOURCES_API_URL || DEFAULT_API_URL,
).replace(/\/$/, '');
export const TURNSTILE_SITE_KEY = String(
  import.meta.env.VITE_TURNSTILE_SITE_KEY || DEFAULT_TURNSTILE_SITE_KEY,
);
export const SOURCES_ENABLED = Boolean(SOURCES_API_URL && TURNSTILE_SITE_KEY);

/** Longest side sent: the model scales larger images down anyway. */
export const IMAGE_MAX_SIDE = 1568;
export const MAX_FILES = 5;
/** how often waiting analyses are checked while the sheet is open */
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
