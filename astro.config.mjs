// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";
import mermaid from "astro-mermaid";
import starlightAutoDrafts from "starlight-auto-drafts";
import { buildSidebarFromFS } from "./src/config/sidebar-fs.mjs";
import { docsWatcherIntegration } from "./src/config/docs-watcher.integration.mjs";

const isDev = process.env.NODE_ENV === "development";
const showReference = process.env.SHOW_REFERENCE === "true";

const baseSidebar = buildSidebarFromFS({ isDev, showReference });
const sidebar = [...baseSidebar];

export default defineConfig({
  integrations: [
    starlight({
      title: "Nebula Docs",
      customCss: ["./src/styles/fonts.css", "./src/styles/custom.css"],
      logo: {
        light: "./src/assets/light-logo.svg",
        dark: "./src/assets/dark-logo.svg",
        replacesTitle: true,
      },
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/ramongranda/nebula-docs" },
      ],
      sidebar,
    }),
    starlightAutoDrafts({ highlights: { badges: false } }),
    svelte(),
    mermaid({
      autoTheme: true,
      mermaidConfig: { flowchart: { curve: "basis" } },
    }),
    docsWatcherIntegration(),
  ],
});
