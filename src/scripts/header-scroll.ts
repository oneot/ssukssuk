/** Gives the floating header its stronger shadow once the page is scrolled. */
export function initHeaderScroll(): void {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
}
