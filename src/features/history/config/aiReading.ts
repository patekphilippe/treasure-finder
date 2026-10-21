export const AI_MODELS = [
  { id: 'claude-haiku-5-5', label: 'Claude Haiku (szybszy, tańszy)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet (dokładniejszy)' },
] as const;
export type AiModelId = (typeof AI_MODELS)[number]['id'];

/** Longest side of the image sent (larger images are scaled down by the API anyway). */
export const AI_MAX_SIDE = 1568;
/** Houses on a 1:25 000 sheet are ~10 m: coarser than this the reading is pointless. */
export const AI_MAX_RES_M = 2;
/**
 * Proposal rules: reading error absorbed, houses joined into one site, readings the model is
 * unsure of dropped, and lone houses left out on maps coarser than ~1:25 000 (1:100 000 is ~8 m/px).
 */
export const PROPOSAL_OPTIONS = {
  bufferM: 25,
  linkM: 80,
  minConfidence: 0.5,
  coarseResM: 4,
} as const;

/** Most one view costs (docs/BACKEND.md: Haiku 0.0005–0.002 $, Sonnet ~20× more), for estimates. */
export const VIEW_COST_USD: Record<AiModelId, number> = {
  'claude-haiku-5-5': 0.002,
  'claude-sonnet-5-5': 0.04,
};
/** about how long one window takes, for the whole-map estimate */
export const VIEW_SECONDS = 15;

/** What the user should know before sending (the backend's privacy rules, docs/BACKEND.md). */
export const AI_READING_NOTE =
  'Do serwera analizy i do Anthropic trafia tylko obraz mapy z widoku, bez Twojej pozycji, punktów i tras. Serwer go nie zapisuje. Limit: 300 odczytów dziennie, dla członków społeczności 1000.';
