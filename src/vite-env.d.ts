/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** AI analysis backend (server/), e.g. https://treasure-finder-api.<konto>.workers.dev */
  readonly VITE_SOURCES_API_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** community sign-in (Auth0), e.g. treasure-finder.eu.auth0.com */
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
}
