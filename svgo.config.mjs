// SVGO settings for the site's SVG files (`npm run optimize:svg`).
//
// Only lossless rewrites: the default preset, minus everything that moves
// geometry (rounding, applying transforms, arcs or lines in place of curves,
// merging paths). Coordinates also stay absolute: WebKit adds up relative path
// coordinates in single precision, which moved a pixel of the logo. Optimised
// files must render exactly like the originals (checked by the design lock),
// and keep their role/title for screen readers.
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertPathData: {
            floatPrecision: 6,
            applyTransforms: false,
            makeArcs: false,
            straightCurves: false,
            convertToQ: false,
            convertToZ: false,
            removeUseless: false,
            forceAbsolutePath: true,
          },
          cleanupNumericValues: { floatPrecision: 6 },
          convertTransform: false,
          mergePaths: false,
          removeUnknownsAndDefaults: { keepRoleAttr: true },
        },
      },
    },
  ],
};
