/** localStorage when available (absent in tests / blocked in some private modes). */
export function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
