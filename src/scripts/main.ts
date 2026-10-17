import { initHeaderScroll } from './header-scroll';
import { initLightbox } from './lightbox';
import { initMobileMenu } from './mobile-menu';
import { initReveal } from './reveal';
import { initScrollspy } from './scrollspy';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initHeaderScroll();
initMobileMenu();
initReveal(reduceMotion);
initScrollspy();
initLightbox();
