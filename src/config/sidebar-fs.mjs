import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_ROOT = path.resolve('src/content/docs');

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
function listDirs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}
function listFiles(dir, exts = ['.md', '.mdx']) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile() && exts.some(e => d.name.toLowerCase().endsWith(e)))
    .map(d => d.name);
}

/** Construye el sidebar de Starlight escaneando carpetas + metadatos */
export function buildSidebarFromFS({ isDev, showReference = false }) {
  const allow = (devOnly) => isDev || showReference || !devOnly;
  const sections = [];

  if (!fs.existsSync(DOCS_ROOT)) return sections;

  for (const dirName of listDirs(DOCS_ROOT)) {
    const dirPath = path.join(DOCS_ROOT, dirName);
    const sectionMeta = readJSON(path.join(dirPath, '_section.json')) || {};
    if (!allow(!!sectionMeta.devOnly)) continue;

    // Sección autogenerada (Reference)
    if (sectionMeta.autogenerate?.directory) {
      sections.push({
        __order: sectionMeta.order ?? 999,
        label: sectionMeta.label ?? dirName,
        autogenerate: { directory: sectionMeta.autogenerate.directory },
      });
      continue;
    }

    // Sección con items (lee *.meta.json junto a cada MD/MDX)
    const items = [];
    for (const file of listFiles(dirPath)) {
      const base = file.replace(/\.(md|mdx)$/i, '');
      const meta = readJSON(path.join(dirPath, `${base}.meta.json`)) || {};
      if (!allow(!!meta.devOnly)) continue;
      items.push({
        __order: meta.order ?? 999,
        label: meta.label ?? base,
        slug: meta.slug ?? `${dirName}/${base}`,
      });
    }

    if (items.length) {
      items.sort((a, b) => a.__order - b.__order);
      sections.push({
        __order: sectionMeta.order ?? 999,
        label: sectionMeta.label ?? dirName,
        items: items.map(({ __order, ...it }) => it),
      });
    }
  }

  sections.sort((a, b) => (a.__order ?? 999) - (b.__order ?? 999));
  return sections.map(({ __order, ...s }) => s);
}
