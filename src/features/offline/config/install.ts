import type { Platform } from '@/shared/lib/pwa/detectPlatform';

/** Manual steps where the browser cannot show its own install dialog. */
export const INSTALL_STEPS: Record<Platform, string> = {
  ios: 'W Safari dotknij Udostępnij (kwadrat ze strzałką), potem Do ekranu początkowego i Dodaj. Najpierw zrób kopię danych: zainstalowana aplikacja na iPhonie ma osobne dane.',
  android: 'W menu przeglądarki ⋮ wybierz Zainstaluj aplikację albo Dodaj do ekranu głównego.',
  desktop:
    'W Chrome lub Edge kliknij ikonę instalacji na końcu paska adresu albo wybierz Zainstaluj w menu przeglądarki.',
};
