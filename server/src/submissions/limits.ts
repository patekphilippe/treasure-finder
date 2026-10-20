export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 5;
export const MAX_TEXT_CHARS = 20_000;
export const MAX_LINK_CHARS = 500;
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
/** public submissions a day per member: enough for an enthusiast, not for a spammer */
export const PUBLIC_DAILY_LIMIT = 20;
