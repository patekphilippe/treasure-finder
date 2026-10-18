/**
 * Light public entry for the field view (Teren): accepted search zones and loading candidates.
 * Kept apart from index.ts so the analysis screen (detection, worker) stays lazy-loaded.
 */
export { AcceptedZonesLayer } from './components/AcceptedZonesLayer';
export { useLoadCandidates } from './hooks/useLoadCandidates';
export { useAnalysisStore } from './store/useAnalysisStore';
