export const TOUR_ACTIVE_ATTR = 'data-tour-active';

/** Outlines the element a step talks about (inside a sheet the spotlight covers the whole sheet). */
export function markTourTarget(selector: string | null): void {
  document
    .querySelectorAll(`[${TOUR_ACTIVE_ATTR}]`)
    .forEach((el) => el.removeAttribute(TOUR_ACTIVE_ATTR));
  if (selector) document.querySelector(selector)?.setAttribute(TOUR_ACTIVE_ATTR, '');
}
