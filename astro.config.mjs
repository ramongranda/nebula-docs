// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";
import { buildSidebarFromFS } from "./src/config/sidebar-fs.mjs";
import starlightAutoDrafts from "starlight-auto-drafts";
import mermaid from "astro-mermaid";

const isDev = process.env.NODE_ENV === "development";
const showReference = process.env.SHOW_REFERENCE === "true";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "Nebula Docs",
      customCss: [
        // Relative path to your custom CSS file
        "./src/styles/custom.css",
      ],
      logo: {
        light: "./src/assets/light-logo.svg",
        dark: "./src/assets/dark-logo.svg",
        replacesTitle: true,
      },
      components: {
        // Override component.
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/ramongranda/nebula-docs",
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
