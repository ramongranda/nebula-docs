// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";
import { buildSidebarFromFS } from './src/config/sidebar-fs.mjs';
import starlightAutoDrafts from "starlight-auto-drafts";
import mermaid from "astro-mermaid";

const isDev = process.env.NODE_ENV === 'development';
const showReference = process.env.SHOW_REFERENCE === 'true';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "Nebula Docs",
      customCss: [
        // Relative path to your custom CSS file
        "./src/styles/custom.css",
      ],
      components: {
        // Override component.
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/withastro/starlight",
        },
      ],
      sidebar: buildSidebarFromFS({ isDev, showReference }),
    }),
    starlightAutoDrafts({
      highlights: {
        badges: false,
      },
    }),
    svelte(),
    mermaid({
      autoTheme: true,
      mermaidConfig: {
        flowchart: {
          curve: "basis",
        },
      },
    }),
  ],
});
