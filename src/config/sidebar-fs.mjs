import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_ROOT = path.resolve("src/content/docs");

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}
function listDirs(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}
function listFiles(dir, exts = [".md", ".mdx"]) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (d) => d.isFile() && exts.some((e) => d.name.toLowerCase().endsWith(e))
    )
    .map((d) => d.name);
}

/** Construye el sidebar de Starlight escaneando carpetas + metadatos */
export function buildSidebarFromFS({ isDev, showReference = false }) {
  const allow = (devOnly) => isDev || showReference || !devOnly;
  const sections = [];

  if (!fs.existsSync(DOCS_ROOT)) return sections;

  for (const dirName of listDirs(DOCS_ROOT)) {
    const dirPath = path.join(DOCS_ROOT, dirName);
    // Único origen de verdad: `_metadata.json` por carpeta.
    // Puede contener metadatos de sección (label/order/devOnly/autogenerate)
    // y metadatos por fichero, ya sea en `items` o en la raíz.
    const dirMeta = readJSON(path.join(dirPath, '_metadata.json')) || {};
    if (!allow(!!dirMeta.devOnly)) continue;

    // No se usa autogeneración; se listan archivos MD/MDX de la carpeta.

    // Sección con items (lee *.meta.json junto a cada MD/MDX si existe, pero
    // el `dirMeta` puede contener entradas por fichero para label/order/devOnly)
    const items = [];
    for (const file of listFiles(dirPath)) {
      const base = file.replace(/\.(md|mdx)$/i, "");
      // Metadatos por fichero únicamente desde `_metadata.json`.
      const metaFromDir = (dirMeta && typeof dirMeta === 'object')
        ? (dirMeta.items?.[base] || dirMeta[base] || {})
        : {};
      const meta = { ...(metaFromDir || {}) };

      if (!allow(!!meta.devOnly)) continue;

      items.push({
        __order: meta.order ?? 999,
        label: meta.label ?? base,
        // El slug siempre se deriva de carpeta/archivo (sin extensión)
        slug: `${dirName}/${base}`,
      });
    }

    // Siempre añadimos la sección, aunque no haya items.
    items.sort((a, b) => a.__order - b.__order);
    sections.push({
      __order: dirMeta.order ?? 999,
      label: dirMeta.label ?? dirName,
      items: items.map(({ __order, ...it }) => it),
    });
  }

  sections.sort((a, b) => (a.__order ?? 999) - (b.__order ?? 999));
  return sections.map(({ __order, ...s }) => s);
}
