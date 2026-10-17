/**
 * Intentional, reviewed visual differences against the legacy hand-written
 * site (2dcc3c5). They only apply while that legacy site is the baseline;
 * every later baseline (a build of main) is compared strictly.
 */
export const legacyExpectedChanges = {
  /**
   * 404.html carried its own copy of the `i-doodle` icon without the
   * leaf-vein path that index.html has. Sharing one icon sprite adds the
   * veins to the 404 doodle.
   */
  doodleVeins: true,
  /**
   * Photos are re-encoded (AVIF/WebP, more widths, a dedicated hero circle
   * crop, a small government emblem). Photo regions are compared with a
   * perceptual tolerance and the diff images are reviewed by eye; everything
   * else must still match exactly.
   */
  reencodedPhotos: true,
};
