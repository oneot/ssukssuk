/**
 * Gallery lightbox on top of plain links: without JavaScript each tile simply
 * opens its full-size photo. With JavaScript the photo opens in a <dialog>,
 * ←/→, the buttons and a horizontal swipe move between photos, and closing
 * returns focus to the tile of the photo last shown. Neighbouring photos are
 * fetched in advance so moving between them is instant.
 */
export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#lightbox');
  const tiles = [...document.querySelectorAll<HTMLAnchorElement>('[data-lightbox]')];
  if (!dialog || typeof dialog.showModal !== 'function' || !tiles.length) return;

  const image = dialog.querySelector('img')!;
  const caption = dialog.querySelector('.lb-caption')!;
  const counter = dialog.querySelector('.lb-count')!;
  const preloaded = new Map<string, HTMLImageElement>();
  let index = 0;

  const wrap = (i: number) => (i + tiles.length) % tiles.length;

  const preload = (i: number) => {
    const href = tiles[wrap(i)].getAttribute('href');
    if (!href || preloaded.has(href)) return;
    const next = new Image();
    next.decoding = 'async';
    next.src = href;
    preloaded.set(href, next);
  };

  const show = (i: number) => {
    index = wrap(i);
    const tile = tiles[index];
    image.src = tile.getAttribute('href') ?? '';
    image.alt = tile.querySelector('img')?.alt ?? '';
    caption.textContent = tile.dataset.caption ?? '';
    counter.textContent = `${index + 1} / ${tiles.length}`;
    preload(index - 1);
    preload(index + 1);
  };

  tiles.forEach((tile, i) => {
    tile.addEventListener('click', (event) => {
      event.preventDefault();
      show(i);
      dialog.showModal();
    });
  });

  dialog.querySelector('.lb-prev')!.addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lb-next')!.addEventListener('click', () => show(index + 1));
  dialog.querySelector('.lb-close')!.addEventListener('click', () => dialog.close());
  // A click on the backdrop targets the dialog itself.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
  dialog.addEventListener('close', () => tiles[index]?.focus());

  let startX = 0;
  dialog.addEventListener(
    'touchstart',
    (event) => {
      startX = event.changedTouches[0].clientX;
    },
    { passive: true },
  );
  dialog.addEventListener(
    'touchend',
    (event) => {
      const dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    },
    { passive: true },
  );
}
