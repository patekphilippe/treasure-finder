/** view readings a day per device and per IP: plenty for field work, little for abuse */
export const READ_DAILY_LIMIT = 30;
/** a view image is at most 1568 px on a side: a few hundred kB as JPEG */
export const MAX_READ_IMAGE_BYTES = 3 * 1024 * 1024;
export const READ_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const READ_MAX_SIDE = 1600;
export const READ_MAX_TOKENS = 4096;
/** upper bound of one reading's tokens, checked against the monthly budget before calling */
export const READ_ESTIMATE_TOKENS = { input_tokens: 3000, output_tokens: READ_MAX_TOKENS } as const;
