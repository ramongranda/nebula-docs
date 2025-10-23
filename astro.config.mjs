// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkCollapse from 'remark-collapse';
import remarkToc from 'remark-toc';
import sharp from 'sharp';
import config from './src/config/config.json';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  site: config.site?.base_url || 'http://examplesite.com',
  base: config.site?.base_path || '/',
  trailingSlash: config.site?.trailing_slash ? 'always' : 'never',

  image: { service: sharp() },

  integrations: [
    svelte(),
    mdx(),
    sitemap({
      // Oculta docs dev-only del sitemap en producción
      filter: (page) =>
        !(isProd && page.pathname.startsWith('/docs/_dev/')),
    }),
  ],

  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: 'Table of contents' }]],
    shikiConfig: { theme: 'one-dark-pro', wrap: true },
    extendDefaultPlugins: true,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
