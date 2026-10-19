export interface Turnstile {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      language?: string;
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<Turnstile> | null = null;

/** Cloudflare's bot check, loaded only when the send form opens. */
export function loadTurnstile(): Promise<Turnstile> {
  const ready = (window as { turnstile?: Turnstile }).turnstile;
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve((window as { turnstile?: Turnstile }).turnstile!);
    s.onerror = () => {
      loading = null;
      reject(new Error('Nie udało się wczytać weryfikacji'));
    };
    document.head.append(s);
  });
  return loading;
}
