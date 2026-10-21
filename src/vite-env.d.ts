/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** AI analysis backend (server/), e.g. https://treasure-finder-api.<konto>.workers.dev */
  readonly VITE_SOURCES_API_URL?: string;
  /** community sign-in (Auth0), e.g. treasure-finder.eu.auth0.com */
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
}

/** the running build (vite.config.ts): commit and build time */
declare const __APP_BUILD__: { commit: string; at: string };
