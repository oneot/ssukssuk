/**
 * Contact details used across the site: header, hero, guide, contact card,
 * footer, mobile buttons, meta description and structured data (JSON-LD).
 * Change a value here and every place updates.
 */
export const site = {
  name: '쑥쑥아동청소년발달센터',
  englishName: 'SsukSsuk Development Center',
  url: 'https://ssukssuk.org/',
  /** Shown as written; links use `tel:` with the same value. */
  phone: '0507-1428-3425',
  /** Naver Map share link used by the "길찾기" buttons. */
  mapUrl: 'https://naver.me/GOPrnvrX',
  address: {
    region: '대전광역시',
    district: '대덕구',
    road: '계족산로81번길 95',
    building: '예성빌딩',
    floors: '5·6층',
    /** Lot-number address shown in brackets on the contact card. */
    dong: '송촌동',
    lot: '449-3',
  },
  /** Instagram account names, without the @. */
  instagram: ['ssukssuk2023', 'ssukssuk.activity.center'],
} as const;

const { address } = site;

export const tel = `tel:${site.phone}`;
/** The same number in international format for structured data: 0507-… → +82-507-… */
export const internationalPhone = `+82-${site.phone.replace(/^0/, '')}`;
export const instagramUrl = (handle: string) => `https://www.instagram.com/${handle}/`;

/** 대전광역시 대덕구 계족산로81번길 95, 예성빌딩 5·6층 */
export const fullAddress = `${address.region} ${address.district} ${address.road}, ${address.building} ${address.floors}`;
/** 계족산로81번길 95, 예성빌딩 5·6층 */
export const streetAddress = `${address.road}, ${address.building} ${address.floors}`;
/** 예성빌딩 5·6층 */
export const buildingAndFloors = `${address.building} ${address.floors}`;

export const navigation = [
  { href: '#about', label: '센터 소개' },
  { href: '#programs', label: '프로그램' },
  { href: '#guide', label: '이용 안내' },
  { href: '#moments', label: '쑥쑥의 순간들' },
  { href: '#contact', label: '오시는 길' },
];
