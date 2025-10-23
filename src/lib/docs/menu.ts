// Genera el árbol del sidebar desde /src/content/docs/**/*.{md,mdx}
// Oculta entradas dev-only en build de producción (carpeta _dev/ o frontmatter devOnly: true)

type Node = { name: string; url?: string; children?: Node[] };

const titleCase = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function getDocsMenu(): Node[] {
  const isDev = import.meta.env.DEV;
  const modules = import.meta.glob("../../content/docs/**/*.{md,mdx}", { eager: true });

  const entries = Object.keys(modules)
    .map((k) => {
      const mod: any = (modules as any)[k];
      const fm = mod?.frontmatter ?? {};
      const rel = k.split("content/docs/")[1]; // e.g. "cli/commands.md"
      const parts = rel.split("/");
      const file = parts.pop()!;
      const basename = file.replace(/\.(md|mdx)$/i, "");
      const isIndex = /^index$/i.test(basename);
      const slugPath = [...parts, isIndex ? "" : basename].filter(Boolean).join("/");
      const url = `/docs/${slugPath}`;
      const name = fm.title ?? titleCase(isIndex ? (parts.at(-1) ?? "index") : basename);
      const isDevOnly = fm.devOnly === true || rel.startsWith("_dev/");
      return { parts, isIndex, url, name, isDevOnly };
    })
    .filter((e) => isDev || !e.isDevOnly);

  const root: Node[] = [];
  const getOrPush = (arr: Node[], key: string): Node => {
    const label = titleCase(key);
    let n = arr.find((x) => x.name === label && x.children);
    if (!n) { n = { name: label, children: [] }; arr.push(n); }
    return n;
  };

  for (const e of entries) {
    let level = root;
    for (const dir of e.parts) level = getOrPush(level, dir).children!;
    if (e.isIndex) {
      const sec = getOrPush(level, e.parts.at(-1) ?? "index");
      sec.url = e.url;
    } else {
      level.push({ name: e.name, url: e.url });
    }
  }

  const sortTree = (nodes: Node[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => n.children && sortTree(n.children));
  };
  sortTree(root);

  return root;
}

export function flattenTree(nodes: Node[], acc: Node[] = []): Node[] {
  for (const n of nodes) {
    if (n.url) acc.push({ name: n.name, url: n.url });
    if (n.children) flattenTree(n.children, acc);
  }
  return acc;
}
