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
function listFiles(dir, exts = [".md", ".mdx", ".mdoc", ".astro"]) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (d) => d.isFile() && exts.some((e) => d.name.toLowerCase().endsWith(e))
    )
    .map((d) => d.name);
}

function readFrontmatterTitle(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const isAstro = filePath.toLowerCase().endsWith('.astro');
    if (!raw.startsWith("---")) return null;
    const end = raw.indexOf("\n---", 3);
    if (end === -1) return null;
    const headerBlock = raw.slice(3, end);
    // Try YAML-style frontmatter first (for .md/.mdx/.mdoc)
    const headerLines = headerBlock.split(/\r?\n/);
    for (const line of headerLines) {
      const m = /^title:\s*(.*)\s*$/i.exec(line.trim());
      if (m) {
        let v = m[1] || "";
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return v.trim() || null;
      }
    }
    // If .astro, header is JS/TS. Look for common patterns.
    if (isAstro) {
      // export const title = '...'
      let m = headerBlock.match(/export\s+const\s+title\s*=\s*['"]([^'\"]+)['"]/);
      if (m) return m[1].trim();
      // const title = '...'
      m = headerBlock.match(/\bconst\s+title\s*=\s*['"]([^'\"]+)['"]/);
      if (m) return m[1].trim();
      // export const frontmatter = { title: '...' }
      m = headerBlock.match(/export\s+const\s+(frontmatter|page)\s*=\s*\{[\s\S]*?title\s*:\s*['"]([^'\"]+)['"]/);
      if (m) return m[2].trim();
    }
    return null;
  } catch {
    return null;
  }
}

/** Construye el sidebar de Starlight escaneando carpetas (soporta anidación) */
export function buildSidebarFromFS({ isDev, showReference = false }) {
  const allow = (devOnly) => isDev || showReference || !devOnly;

  if (!fs.existsSync(DOCS_ROOT)) return [];

  const norm = (p) => p.replace(/\\/g, '/');

  /**
   * Construye una sección para un directorio concreto (recursivo).
   * @param {string} absDir Ruta absoluta del directorio.
   * @param {string} relDir Ruta relativa a `src/content/docs` (sin barra inicial).
   * @param {string} dirName Nombre de la carpeta actual.
   */
  function buildSection(absDir, relDir, dirName) {
    const dirMeta = readJSON(path.join(absDir, '_metadata.json')) || {};
    if (!allow(!!dirMeta.devOnly)) return null;

    const items = [];

    // Archivos de contenido en este directorio
    for (const file of listFiles(absDir)) {
      const base = file.replace(/\.(md|mdx|mdoc|astro)$/i, "");
      const metaFromDir = (dirMeta && typeof dirMeta === 'object')
        ? (dirMeta.items?.[base] || dirMeta[base] || {})
        : {};
      const meta = { ...(metaFromDir || {}) };
      if (!allow(!!meta.devOnly)) continue;

      const filePath = path.join(absDir, file);
      const fmTitle = readFrontmatterTitle(filePath);

      const isAstro = file.toLowerCase().endsWith('.astro');
      const common = {
        __order: meta.order ?? 999,
        label: meta.label ?? fmTitle ?? base,
      };
      if (isAstro) {
        // Para archivos .astro sólo enlazamos si existe una página real en src/pages
        // o si viene un link explícito en metadatos.
          const explicitLink = typeof meta.link === 'string' && meta.link.trim().length > 0 ? meta.link.trim() : null;
          if (explicitLink) {
            // detect external links and add safe defaults (open in new tab, noopener)
            const isExternal = /^https?:\/\//i.test(explicitLink);
            const linkItem = { ...common, link: explicitLink };
            if (isExternal) {
              // Starlight rejects unknown keys like `target`/`rel` in the sidebar config.
              // Use a small flag `external` so the renderer can decide to add target/rel.
              linkItem.external = true;
            }
            items.push(linkItem);
        } else {
          const pageAbs = path.resolve('src/pages', relDir, `${base}.astro`);
          const pageIdxAbs = path.resolve('src/pages', relDir, base, 'index.astro');
          if (fs.existsSync(pageAbs)) {
            items.push({ ...common, link: `/${norm(path.join(relDir, base))}` });
          } else if (fs.existsSync(pageIdxAbs)) {
            items.push({ ...common, link: `/${norm(path.join(relDir, base))}/` });
          } else {
            // No existe ruta real -> no lo añadimos al sidebar para evitar 404.
          }
        }
      } else {
        // Para contenido de colección (md/mdx/mdoc) usamos slug, salvo que en metadatos se provea un link/href explícito
          const explicitLink = typeof meta.link === 'string' && meta.link.trim().length > 0
            ? meta.link.trim()
            : (typeof meta.href === 'string' && meta.href.trim().length > 0 ? meta.href.trim() : null);
          if (explicitLink) {
            const isExternal = /^https?:\/\//i.test(explicitLink);
            const linkItem = { ...common, link: explicitLink };
            if (isExternal) {
              linkItem.external = true;
            }
            items.push(linkItem);
          } else {
            items.push({ ...common, slug: `${norm(relDir)}/${base}` });
          }
      }
    }

    // Añadir entradas definidas en _metadata.json que no correspondan a un archivo físico
    const metaItems = (dirMeta && typeof dirMeta === 'object') ? (dirMeta.items || {}) : {};
    const existingBases = new Set(listFiles(absDir).map(f => f.replace(/\.(md|mdx|mdoc|astro)$/i, "")));
    for (const metaKey of Object.keys(metaItems)) {
      if (existingBases.has(metaKey)) continue; // ya procesado por archivo real
      const meta = metaItems[metaKey] || dirMeta[metaKey] || {};
      if (!allow(!!meta.devOnly)) continue;
      const common = {
        __order: meta.order ?? 999,
        label: meta.label ?? metaKey,
      };
      const explicitLink = typeof meta.link === 'string' && meta.link.trim().length > 0
        ? meta.link.trim()
        : (typeof meta.href === 'string' && meta.href.trim().length > 0 ? meta.href.trim() : null);
      if (explicitLink) {
        const isExternal = /^https?:\/\//i.test(explicitLink);
        const linkItem = { ...common, link: explicitLink };
        if (isExternal) {
          linkItem.external = true;
        }
        items.push(linkItem);
      } else if (typeof meta.slug === 'string' && meta.slug.trim().length > 0) {
        items.push({ ...common, slug: meta.slug.trim() });
      } else {
        // If no explicit link/slug provided, we skip to avoid broken links
      }
    }

    // Subcarpetas (recursivo)
    for (const childName of listDirs(absDir)) {
      const childAbs = path.join(absDir, childName);
      const childRel = relDir ? path.join(relDir, childName) : childName;
      const childSec = buildSection(childAbs, childRel, childName);
      if (childSec) items.push(childSec);
    }

    // Ordenar por __order y limpiar metacampo
    items.sort((a, b) => (a.__order ?? 999) - (b.__order ?? 999));
    const cleanedItems = items.map(({ __order, ...it }) => it);

    return {
      __order: dirMeta.order ?? 999,
      label: dirMeta.label ?? dirName,
      items: cleanedItems,
    };
  }

  // Construir secciones a partir de las carpetas de primer nivel
  const top = [];
  for (const dirName of listDirs(DOCS_ROOT)) {
    const abs = path.join(DOCS_ROOT, dirName);
    const sec = buildSection(abs, dirName, dirName);
    if (sec) top.push(sec);
  }

  top.sort((a, b) => (a.__order ?? 999) - (b.__order ?? 999));

  // Sanitize sidebar objects to only include keys accepted by Starlight.
  // Starlight validates the sidebar shape strictly; remove any helper keys
  // (like `external`, `target`, `rel`) before returning the structure.
  function sanitizeNode(node) {
    const allowed = {};
    if (typeof node.label === 'string') allowed.label = node.label;
    if (typeof node.link === 'string') allowed.link = node.link;
    if (typeof node.slug === 'string') allowed.slug = node.slug;
    if (Array.isArray(node.items)) allowed.items = node.items.map(sanitizeNode);
    return allowed;
  }

  return top.map(({ __order, ...s }) => sanitizeNode(s));
}
