import fs from "node:fs/promises";
import path from "node:path";
import glob from "fast-glob";
import matter from "gray-matter";

const root = process.cwd();
const contentRoot = path.join(root, "src", "content");
const outFile = path.join(root, "src", "layouts", "helpers", ".json", "search.json");
const isProd = process.env.NODE_ENV === "production";

const toText = (md) =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_\-\+\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const files = await glob(["content/docs/**/*.{md,mdx}"], { cwd: path.join(root, "src") });

const items = [];
for (const rel of files) {
  const full = path.join(root, "src", rel);
  const raw = await fs.readFile(full, "utf8");
  const { data, content } = matter(raw);

  const devOnly = data?.devOnly === true || rel.includes("content/docs/_dev/");
  if (isProd && devOnly) continue;

  const parts = rel.split("content/docs/")[1].split("/");
  const base = parts.pop();
  const basename = base.replace(/\.(md|mdx)$/i, "");
  const isIndex = /^index$/i.test(basename);
  const slugPath = [...parts, isIndex ? "" : basename].filter(Boolean).join("/");
  const slug = `/docs/${slugPath}`;
  const title = data?.title || (isIndex ? (parts.at(-1) || "Index") : basename);
  const excerpt = toText(content).slice(0, 200);

  items.push({ title, slug, excerpt });
}

await fs.mkdir(path.dirname(outFile), { recursive: true });
await fs.writeFile(outFile, JSON.stringify(items, null, 2), "utf8");
console.log(`Wrote ${items.length} items -> ${path.relative(root, outFile)}`);
