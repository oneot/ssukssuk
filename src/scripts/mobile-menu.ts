/**
 * Mobile menu: the toggle opens and closes it, choosing a link or pressing
 * Escape closes it (Escape returns focus to the toggle), and it closes when
 * the viewport grows to the desktop layout.
 */
export function initMobileMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle');

  const setOpen = (open: boolean) => {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    document.body.classList.toggle('menu-open', open);
  };

  toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  for (const link of document.querySelectorAll('.site-nav a')) {
    link.addEventListener('click', () => setOpen(false));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setOpen(false);
      toggle?.focus();
    }
  });

  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
