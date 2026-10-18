import type { Platform } from '../config/tourSteps';

/** Which install instructions fit this device (iPadOS reports itself as a Mac with touch). */
export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1))
    return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}
