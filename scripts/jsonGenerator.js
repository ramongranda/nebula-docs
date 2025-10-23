// scripts/jsonGenerator.js
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');
const OUT_DIR = path.join(ROOT, 'src', 'layouts', 'helpers', '.json');
const OUT_FILE = path.join(OUT_DIR, 'generated.json');

function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
}

function getData() {
  const entries = safeReaddir(BLOG_DIR);
  if (!entries) return [];
  const items = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const fp = path.join(BLOG_DIR, e.name);
    const content = fs.readFileSync(fp, 'utf8');
    items.push({
      title: e.name.replace(/\.(md|mdx)$/i, ''),
      slug: '/blog/' + e.name.replace(/\.(md|mdx)$/i, ''),
      excerpt: content.slice(0, 200).replace(/\s+/g, ' ').trim(),
    });
  }
  return items;
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function main() {
  const data = getData();
  ensureDir(OUT_DIR);
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Generated ${data.length} items -> ${path.relative(ROOT, OUT_FILE)}`);
}

main();
