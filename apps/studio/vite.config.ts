import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const packagesDir = path.resolve(__dirname, '../../packages');

  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        // Workspace packages — map bare name AND all subpaths to source
        // e.g. @clypra-studio/runtime/pixi  →  packages/runtime/src/pixi
        // e.g. @clypra-studio/runtime       →  packages/runtime/src
        {
          find: /^@clypra-studio\/runtime(\/.*)?$/,
          replacement: `${packagesDir}/runtime/src$1`,
        },
        {
          find: /^@clypra-studio\/ui(\/.*)?$/,
          replacement: `${packagesDir}/ui/src$1`,
        },
        {
          find: /^@clypra\/ui-color-picker(\/.*)?$/,
          replacement: `${packagesDir}/ui-color-picker/src$1`,
        },
        {
          find: /^@clypra-studio\/engine(\/.*)?$/,
          replacement: `${packagesDir}/clypra-engine/src$1`,
        },
        // Non-source-aliased packages — keep simple string alias
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    optimizeDeps: {
      // Tell Vite to scan workspace package source files at startup so it
      // discovers pixi.js and pixi-filters *before* serving the page.
      // Without this, they are discovered the first time the browser requests
      // renderer.ts / filters.ts, which triggers a full-page dep-optimization
      // restart that aborts in-flight lazy import() — leaving Suspense stuck.
      entries: [
        // Studio app entry (always included by default, listed explicitly)
        'src/main.tsx',
        // Runtime package source — contains pixi.js and pixi-filters imports
        '../../packages/runtime/src/pixi/renderer.ts',
        '../../packages/runtime/src/pixi/filters.ts',
        // Engine package source — also imports pixi.js
        '../../packages/clypra-engine/src/videoEffects/PixiRenderer.ts',
        '../../packages/clypra-engine/src/effects/index.ts',
      ],
      // Do NOT exclude workspace packages here. They are resolved to /@fs/ source
      // via the aliases above, so Vite already won't try to pre-bundle them.
      // Listing them in exclude was actively harmful: it caused the mid-session
      // dep-optimization restart described above.
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

