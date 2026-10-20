/** view readings a day per device and per IP: plenty for field work, little for abuse */
export const READ_DAILY_LIMIT = 30;
/** a view image is at most 1568 px on a side: a few hundred kB as JPEG */
export const MAX_READ_IMAGE_BYTES = 3 * 1024 * 1024;
export const READ_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const READ_MAX_SIDE = 1600;
/** input tokens of one reading (image and prompt), for the budget check before calling */
export const READ_ESTIMATE_INPUT_TOKENS = 3000;
