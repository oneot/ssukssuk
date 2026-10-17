/**
 * Inline SVG symbols shared by every page. IconSprite renders them once per
 * page and <Icon name="…"> references them, so each icon exists in one place.
 */
export const icons = {
  sprout: {
    viewBox: '0 0 24 24',
    body: `<path d="M12 23V13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M12 14.6C6.6 15.6 2.4 12.2 1.8 6.6c5.8-.4 9.8 2.8 10.2 8z" fill="currentColor"/><path d="M12 12.4c0-5.8 3.6-10.2 10.2-10.4.4 6.2-4 10.6-10.2 10.4z" fill="currentColor"/>`,
  },
  'sprout-s': {
    viewBox: '0 0 24 24',
    body: `<path d="M12 22v-5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M12 17.4c-3.6.6-6.4-1.6-6.8-5.4 3.8-.2 6.6 1.8 6.8 5.4z" fill="currentColor"/><path d="M12 16.4c0-3.8 2.4-6.6 6.8-6.8.2 4-2.6 7-6.8 6.8z" fill="currentColor"/>`,
  },
  bud: {
    viewBox: '0 0 24 24',
    body: `<path d="M12 23V11.6" stroke="#4f7e52" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M12 18.4c-3.6.6-6.4-1.6-6.8-5.4 3.8-.2 6.6 1.8 6.8 5.4z" fill="#4f7e52"/><path d="M12 17c0-3.6 2.4-6.2 6.6-6.4.2 3.8-2.4 6.6-6.6 6.4z" fill="#4f7e52"/><path d="M12 11.2C8.4 8.7 6.8 6.9 6.8 5a2.6 2.6 0 0 1 5.2-1 2.6 2.6 0 0 1 5.2 1c0 1.9-1.6 3.7-5.2 6.2z" fill="#eea6a8"/>`,
  },
  seed: {
    viewBox: '0 0 24 24',
    body: `<ellipse cx="12" cy="14" rx="5" ry="6.2" fill="currentColor" transform="rotate(-18 12 14)"/>`,
  },
  phone: {
    viewBox: '0 0 24 24',
    body: `<path d="M6.6 3.5h2.7l1.5 4.2-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4.2 1.5v2.7a2 2 0 0 1-2.2 2C10.9 18.9 5.1 13.1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
  },
  arrow: {
    viewBox: '0 0 24 24',
    body: `<path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  external: {
    viewBox: '0 0 24 24',
    body: `<path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  check: {
    viewBox: '0 0 24 24',
    body: `<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  pin: {
    viewBox: '0 0 24 24',
    body: `<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>`,
  },
  clock: {
    viewBox: '0 0 24 24',
    body: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  insta: {
    viewBox: '0 0 24 24',
    body: `<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/>`,
  },
  shapes: {
    viewBox: '0 0 24 24',
    body: `<circle cx="7" cy="16.5" r="4" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13" y="12.5" width="8" height="8" rx="1.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3l4.6 7.6H7.4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
  },
  chat: {
    viewBox: '0 0 24 24',
    body: `<path d="M4 6.5A3 3 0 0 1 7 3.5h10a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3h-6.5L6 20v-4H7a3 3 0 0 1-3-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8.5" cy="9.8" r="1.2" fill="currentColor"/><circle cx="12" cy="9.8" r="1.2" fill="currentColor"/><circle cx="15.5" cy="9.8" r="1.2" fill="currentColor"/>`,
  },
  school: {
    viewBox: '0 0 24 24',
    body: `<path d="M3 10l9-6 9 6M5 9.5V20h14V9.5M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  award: {
    viewBox: '0 0 24 24',
    body: `<circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.6 13.9L7.2 21l4.8-2.6 4.8 2.6-1.4-7.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
  },
  users: {
    viewBox: '0 0 24 24',
    body: `<circle cx="9" cy="8.5" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="17" cy="9.5" r="2.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.5 14.2c2.4.1 4 1.6 4.5 4.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  },
  ticket: {
    viewBox: '0 0 24 24',
    body: `<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5v2.2a2.3 2.3 0 0 0 0 4.6v2.2A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5v-2.2a2.3 2.3 0 0 0 0-4.6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 8v8" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>`,
  },
  ball: {
    viewBox: '0 0 24 24',
    body: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v18M3 12h18M5.6 5.6c3 2.6 3 10.2 0 12.8M18.4 5.6c-3 2.6-3 10.2 0 12.8" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },
  close: {
    viewBox: '0 0 24 24',
    body: `<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  },
  'chev-left': {
    viewBox: '0 0 24 24',
    body: `<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'chev-right': {
    viewBox: '0 0 24 24',
    body: `<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  heart: {
    viewBox: '0 0 30 26',
    body: `<path d="M15 24C6 17.4 2 12.8 2 8.2 2 4.6 4.8 2 8.1 2c2.8 0 5 1.6 6.9 4.2C16.9 3.6 19.1 2 21.9 2 25.2 2 28 4.6 28 8.2c0 4.6-4 9.2-13 15.8z" fill="#EEA6A8"/>`,
  },
  doodle: {
    viewBox: '0 0 100 100',
    body: `<path d="M50 96C49 80 50 64 52 50" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M51 58C38 60 22 52 16 34c18-4 33 6 35 24z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M52 48c1-16 13-30 32-32 2 19-12 32-32 32z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M24 38c8 3 16 8 24 16M78 22c-7 6-14 14-22 22" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
  },
} as const;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];
