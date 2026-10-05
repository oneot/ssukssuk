(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header border on scroll */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const toggle = $('.nav-toggle');
  const setMenu = (open) => {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    document.body.classList.toggle('menu-open', open);
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('.site-nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
      toggle?.focus();
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => e.matches && setMenu(false));

  /* Reveal on scroll */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* Active menu item (sprout marker) */
  const links = $$('.site-nav a[href^="#"]');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* Gallery lightbox */
  const dialog = $('#lightbox');
  const tiles = $$('[data-lightbox]');
  if (dialog && typeof dialog.showModal === 'function' && tiles.length) {
    const img = $('img', dialog);
    const caption = $('.lb-caption', dialog);
    const counter = $('.lb-count', dialog);
    let index = 0;

    const show = (i) => {
      index = (i + tiles.length) % tiles.length;
      const tile = tiles[index];
      const thumb = $('img', tile);
      img.src = tile.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      caption.textContent = tile.dataset.caption || '';
      counter.textContent = `${index + 1} / ${tiles.length}`;
    };

    tiles.forEach((tile, i) => {
      tile.addEventListener('click', (e) => {
        e.preventDefault();
        show(i);
        dialog.showModal();
      });
    });

    $('.lb-prev', dialog).addEventListener('click', () => show(index - 1));
    $('.lb-next', dialog).addEventListener('click', () => show(index + 1));
    $('.lb-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    dialog.addEventListener('close', () => tiles[index]?.focus());

    let startX = 0;
    dialog.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
})();
