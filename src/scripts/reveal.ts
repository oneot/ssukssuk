/**
 * Fades [data-reveal] content in as it scrolls into view. With reduced motion
 * (or no IntersectionObserver) everything is shown at once.
 */
export function initReveal(reduceMotion: boolean): void {
  const elements = document.querySelectorAll('[data-reveal]');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    for (const element of elements) element.classList.add('is-in');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.16, rootMargin: '0px 0px -40px 0px' },
  );
  for (const element of elements) observer.observe(element);
}
