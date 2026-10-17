/**
 * Loads the editable content in src/content/*.yaml and checks it against the
 * layout's rules. Any mistake (a typo in a field name, a missing gallery slot,
 * an unknown icon or photo) stops the build with a message pointing at the file.
 */
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { iconNames, type IconName } from '../components/ui/icons';
import floorsSource from '../content/floors.yaml?raw';
import gallerySource from '../content/gallery.yaml?raw';
import programsSource from '../content/programs.yaml?raw';
import supportSource from '../content/support.yaml?raw';
import { photoNames } from './photos';

const text = z.string().trim().min(1);
const icon = z.enum(iconNames as [IconName, ...IconName[]]);
const color = z.enum(['green', 'pink']);
const photo = z.enum(photoNames);

function load<T extends z.ZodType>(file: string, source: string, schema: T): z.output<T> {
  let data: unknown;
  try {
    data = parse(source, { uniqueKeys: true });
  } catch (error) {
    throw new Error(`src/content/${file}: YAML 형식 오류 (invalid YAML)\n${(error as Error).message}`);
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`src/content/${file}: 내용 확인 필요 (invalid content)\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** The building drawing has exactly these spaces, in this order. */
const ROOMS = ['6a', '6b', '5'] as const;

export const floors = load(
  'floors.yaml',
  floorsSource,
  z
    .array(
      z.strictObject({
        room: z.coerce.string().pipe(z.enum(ROOMS)),
        name: text,
        sign: text,
        description: text,
        tags: z.array(text).min(1),
      }),
    )
    .refine((items) => items.map((item) => item.room).join() === ROOMS.join(), {
      message: `rooms must be ${ROOMS.join(', ')} — each once, in this order`,
    }),
).map((floor) => ({ ...floor, level: floor.room.startsWith('6') ? '6F' : '5F' }));

export const programs = load(
  'programs.yaml',
  programsSource,
  z.strictObject({
    therapy: z.strictObject({
      label: text,
      title: text,
      cards: z.array(z.strictObject({ icon, color, title: text, text, chips: z.array(text).min(1) })).min(1),
    }),
    activities: z.strictObject({
      label: text,
      title: text,
      cards: z.array(z.strictObject({ photo, alt: text, title: text, text })).min(1),
    }),
  }),
);

export const support = load(
  'support.yaml',
  supportSource,
  z.array(z.strictObject({ icon, color, org: text, name: text, place: text })).min(1),
);

/**
 * The desktop collage has six fixed slots; their position and shape live in
 * the stylesheet (.t-music … .t-digital). Missing, repeated or extra slots
 * fail the build instead of breaking the layout.
 */
export const GALLERY_SLOTS = ['music', 'horse', 'party', 'vr', 'simulator', 'digital'] as const;
const tile = z.strictObject({ photo, alt: text, caption: text });

const galleryData = load(
  'gallery.yaml',
  gallerySource,
  z.strictObject(
    Object.fromEntries(GALLERY_SLOTS.map((slot) => [slot, tile])) as Record<
      (typeof GALLERY_SLOTS)[number],
      typeof tile
    >,
  ),
);

export const gallery = GALLERY_SLOTS.map((slot) => ({ slot, ...galleryData[slot] }));
