/** Marks the menu item of the section crossing the middle of the screen (sprout marker). */
export function initScrollspy(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.site-nav a[href^="#"]')];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')!))
    .filter((section): section is Element => section !== null);
  if (!('IntersectionObserver' in window) || !sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const section of sections) observer.observe(section);
}
