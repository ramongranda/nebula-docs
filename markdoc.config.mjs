import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import { createRequire } from 'node:module';

// Try to load Starlight’s Markdoc preset if installed.
let starlightMarkdoc = null;
try {
  const req = createRequire(import.meta.url);
  // eslint-disable-next-line import/no-commonjs
  starlightMarkdoc = req('@astrojs/starlight-markdoc')?.default ?? null;
} catch {}

export default defineMarkdocConfig({
  extends: starlightMarkdoc ? [starlightMarkdoc()] : [],
});
