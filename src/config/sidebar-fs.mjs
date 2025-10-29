import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_ROOT = path.resolve("src/content/docs");
const PAGES_ROOT = path.resolve("src/pages");
const CONTENT_EXTS = [".md", ".mdx", ".mdoc", ".astro"];
const LINK_EXT = ".link";

/**
 * Sidebar builder notes (.link support)
 * - Co-named .link file (example.mdx + example.link): the .link file content is
 *   treated as the URL for that entry and takes precedence over any link/href
 *   defined in folder metadata. If no label is provided in metadata, the label
 *   is prettified from the base filename (e.g. "authoring-content" -> "Authoring Content").
 * - Standalone .link (example.link with no content file): creates a sidebar item
 *   with that URL. The label and order may be provided in folder metadata under
 *   the same base key; otherwise the label is prettified from the base filename
 *   and order defaults to 999.
 */

// FS utils
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
    // Exclude directories that start with '_' (private/hidden folders)
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);
}
function listFiles(dir, exts = CONTENT_EXTS) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    // Exclude files that start with '_' (private/hidden files)
    .filter(
      (d) =>
        d.isFile() &&
        !d.name.startsWith("_") &&
        exts.some((e) => d.name.toLowerCase().endsWith(e))
    )
    .map((d) => d.name);
}
function listLinkFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    // Exclude link files that start with '_' to avoid exposing internal links
    .filter((d) => d.isFile() && !d.name.startsWith("_") && d.name.toLowerCase().endsWith(LINK_EXT))
    .map((d) => d.name);
}
function readLinkText(file) {
  try {
    const v = fs.readFileSync(file, "utf8").trim();
    return v.length ? v : null;
  } catch {
    return null;
  }
}

// Frontmatter title (YAML for md*, common patterns for Astro)
function readFrontmatterTitle(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const isAstro = filePath.toLowerCase().endsWith(".astro");
    if (!raw.startsWith("---")) return null;
    const end = raw.indexOf("\n---", 3);
    if (end === -1) return null;
    const headerBlock = raw.slice(3, end);
    // YAML (md/mdx/mdoc)
    for (const line of headerBlock.split(/\r?\n/)) {
      const m = /^title:\s*(.*)\s*$/i.exec(line.trim());
      if (m) {
        let v = m[1] || "";
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        return v.trim() || null;
      }
    }
    // Astro (JS/TS)
    if (isAstro) {
      let m = /export\s+const\s+title\s*=\s*['"][^'\"]+['"]/ .exec(headerBlock);
      if (m) return /['"]([^'\"]+)['"]/.exec(m[0])[1].trim();
      m = /\bconst\s+title\s*=\s*['"][^'\"]+['"]/ .exec(headerBlock);
      if (m) return /['"]([^'\"]+)['"]/.exec(m[0])[1].trim();
      m = /export\s+const\s+(frontmatter|page)\s*=\s*\{[\s\S]*?title\s*:\s*['"][^'\"]+['"]/ .exec(headerBlock);
      if (m) return /title\s*:\s*['"]([^'\"]+)['"]/.exec(m[0])[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}

// Common helpers
const norm = (p) => p.replaceAll("\\", "/");
const sortByOrder = (a, b) => (a.__order ?? 999) - (b.__order ?? 999);
const getExplicitLink = (meta) => {
  if (typeof meta?.link === "string" && meta.link.trim()) return meta.link.trim();
  if (typeof meta?.href === "string" && meta.href.trim()) return meta.href.trim();
  return null;
};
const getOpenMode = (meta) => {
  const v = typeof meta?.open === "string" ? meta.open.trim().toLowerCase() : "";
  return v === "new" || v === "embed" || v === "same" ? v : "same";
};
const isExternal = (url) => /^https?:\/\//i.test(url);
const wrapExternal = (url, mode = "same") => {
  try {
    const b64 = Buffer.from(String(url), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    return `/ext/${mode}/${b64}`;
  } catch {
    return url;
  }
};
const embedLink = (url) => `/ext?u=${encodeURIComponent(url)}&m=embed`;
const newTabLink = (url) => `/ext-new?u=${encodeURIComponent(url)}`;

// Pretty label from base filename (e.g., "authoring-content" -> "Authoring Content")
function prettyLabelFromBase(base) {
  const name = String(base).replaceAll(/[-_]+/g, " ").replaceAll(/\s+/g, " ").trim();
  if (!name) return base;
  return name
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Keep only valid keys for Starlight
function sanitizeNode(node) {
  const out = {};
  if (typeof node.label === "string") out.label = node.label;
  if (typeof node.link === "string") out.link = node.link;
  if (typeof node.slug === "string") out.slug = node.slug;
  if (Array.isArray(node.items)) out.items = node.items.map(sanitizeNode);
  return out;
}

/** Construye el sidebar de Starlight escaneando carpetas (soporta anidación) */
export function buildSidebarFromFS({ isDev, showReference = false }) {
  const allow = (devOnly) => isDev || showReference || !devOnly;

  if (!fs.existsSync(DOCS_ROOT)) return [];

  // Sección recursiva por directorio
  function buildSection(absDir, relDir, dirName) {
    const dirMeta = readJSON(path.join(absDir, "_metadata.json")) || {};
    if (!allow(!!dirMeta.devOnly)) return null;

    const items = [];
    const files = listFiles(absDir);
    const dirs = listDirs(absDir);
    const linkFiles = listLinkFiles(absDir);
    const linkMap = new Map(
      linkFiles
        .map((f) => {
          const base = f.slice(0, -LINK_EXT.length);
          const url = readLinkText(path.join(absDir, f));
          return [base, url];
        })
        .filter(([, url]) => !!url)
    );
    const addedBases = new Set();

    // Archivos de contenido de este directorio
    for (const file of files) {
      const base = file.replace(/\.(md|mdx|mdoc|astro)$/i, "");
      const metaFromDir =
        dirMeta && typeof dirMeta === "object"
          ? dirMeta.items?.[base] || dirMeta[base] || {}
          : {};
      const meta = { ...(metaFromDir || {}) };
      if (!allow(!!meta.devOnly)) continue;

      const filePath = path.join(absDir, file);
      const isAstro = file.toLowerCase().endsWith(".astro");
      // Si existe .link co-nombrado y no hay label en metadata, usar un label "bonito" del nombre de fichero
      const linkFromFile = linkMap.get(base) || null;
      const label = linkFromFile
        ? (meta.label ?? prettyLabelFromBase(base))
        : (meta.label ?? readFrontmatterTitle(filePath) ?? base);
      const common = { __order: meta.order ?? 999, label };

      // Prioridad: fichero .link co-nombrado > metadatos link/href
      const explicitLink = linkFromFile || getExplicitLink(meta);
      if (explicitLink) {
        const mode = getOpenMode(meta);
        const finalLink = isExternal(explicitLink)
          ? (mode === 'embed' ? embedLink(explicitLink)
            : mode === 'new' ? newTabLink(explicitLink)
            : wrapExternal(explicitLink, mode))
          : explicitLink;
        items.push({ ...common, link: finalLink });
        addedBases.add(base);
        continue;
      }

      if (isAstro) {
        // Enlazar sólo si existe página real en src/pages
        const pageAbs = path.resolve(PAGES_ROOT, relDir, `${base}.astro`);
        const pageIdxAbs = path.resolve(PAGES_ROOT, relDir, base, "index.astro");
        if (fs.existsSync(pageAbs)) {
          items.push({ ...common, link: `/${norm(path.join(relDir, base))}` });
          addedBases.add(base);
        } else if (fs.existsSync(pageIdxAbs)) {
          items.push({ ...common, link: `/${norm(path.join(relDir, base))}/` });
          addedBases.add(base);
        } else {
          // Evitar 404
        }
      } else {
        // Colección (md/mdx/mdoc)
          // Normalize index files so that `reference/index` becomes `reference`, matching
          // the slug normalization used by the routing logic (which treats folder index
          // pages as the folder slug).
          const generatedSlug = base === 'index' ? norm(relDir) : `${norm(relDir)}/${base}`;
          items.push({ ...common, slug: generatedSlug.replace(/^\/+/, '') });
        addedBases.add(base);
      }
    }

    // Entradas extra de _metadata.json (sin archivo físico)
    const metaItems = dirMeta && typeof dirMeta === "object" ? dirMeta.items || {} : {};
    const existingBases = new Set([
      ...files.map((f) => f.replace(/\.(md|mdx|mdoc|astro)$/i, "")),
      ...Array.from(linkMap.keys()),
    ]);
    for (const metaKey of Object.keys(metaItems)) {
      // Skip metadata entries that are private (start with '_')
      if (metaKey.startsWith("_")) continue;
      if (existingBases.has(metaKey)) continue;
      const meta = metaItems[metaKey] || dirMeta[metaKey] || {};
      if (!allow(!!meta.devOnly)) continue;
      const common = { __order: meta.order ?? 999, label: meta.label ?? metaKey };
      const explicit = getExplicitLink(meta);
      if (explicit) {
        const mode = getOpenMode(meta);
        const final = isExternal(explicit)
          ? (mode === 'embed' ? embedLink(explicit)
            : mode === 'new' ? newTabLink(explicit)
            : wrapExternal(explicit, mode))
          : explicit;
        items.push({ ...common, link: final });
        addedBases.add(metaKey);
      } else if (typeof meta.slug === "string" && meta.slug.trim()) {
        items.push({ ...common, slug: meta.slug.trim() });
        addedBases.add(metaKey);
      }
    }

    // Entradas creadas por ficheros .link sin archivo de contenido asociado
    for (const [base, url] of linkMap.entries()) {
      if (addedBases.has(base)) continue;
      const metaFromDir =
        dirMeta && typeof dirMeta === "object"
          ? dirMeta.items?.[base] || dirMeta[base] || {}
          : {};
      if (!allow(!!metaFromDir.devOnly)) continue;
      const common = {
        __order: metaFromDir.order ?? 999,
        label: metaFromDir.label ?? prettyLabelFromBase(base),
      };
      const mode = getOpenMode(metaFromDir);
      const final = isExternal(url)
        ? (mode === 'embed' ? embedLink(url)
          : mode === 'new' ? newTabLink(url)
          : wrapExternal(url, mode))
        : url;
      items.push({ ...common, link: final });
      addedBases.add(base);
    }

    // Subcarpetas
    for (const childName of dirs) {
      const childAbs = path.join(absDir, childName);
      const childRel = relDir ? path.join(relDir, childName) : childName;
      const childSec = buildSection(childAbs, childRel, childName);
      if (childSec) items.push(childSec);
    }

    items.sort(sortByOrder);
    const cleanedItems = items.map(({ __order, ...it }) => it);

    return {
      __order: dirMeta.order ?? 999,
      label: dirMeta.label ?? dirName,
      items: cleanedItems,
    };
  }

  // Secciones de primer nivel
  const top = [];
  for (const dirName of listDirs(DOCS_ROOT)) {
    const abs = path.join(DOCS_ROOT, dirName);
    const sec = buildSection(abs, dirName, dirName);
    if (sec) top.push(sec);
  }
  top.sort(sortByOrder);

  return top.map(({ __order, ...s }) => sanitizeNode(s));
}
