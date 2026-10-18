/**
 * Scrolls only the element's own scroll box (the sheet body), never the page:
 * the app is a fixed full-screen layout and a scrolled page leaves a black strip.
 */
export function scrollIntoSheet(el: Element): void {
  let box = el.parentElement;
  while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
  if (box) {
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    box.scrollTop = Math.max(0, top - 12);
  }
  window.scrollTo(0, 0);
}
