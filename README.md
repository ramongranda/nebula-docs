# Nebula Docs (fork of Starlight)

Nebula is a fork of the Starlight starter kit for Astro, adapted as a documentation theme for the Nebula project. This README is maintained in English and documents repository-specific details (sidebar generation, metadata conventions, and developer commands).

<p align="center">
  <img src="src/assets/light-logo.svg" alt="Nebula logo" width="240" />
</p>

## Quick commands

```pwsh
pnpm install
pnpm dev      # start development server (default: http://localhost:4321)
pnpm build    # production build -> ./dist
pnpm preview  # preview built site locally
```

## Project layout (important files)

```text
.  ├── public/
   ├── src/
   │   ├── assets/
   │   ├── content/
   │   │   └── docs/           # Markdown/MDX content files and per-folder metadata
   │   ├── config/             # helper scripts (e.g. sidebar builder)
   │   └── content.config.ts   # Astro content collections and loaders
   ├── astro.config.mjs        # Starlight/Nebula configuration (title, sidebar hook)
   ├── package.json
   └── README.md
```

## How the sidebar is generated in Nebula

Nebula includes a small custom builder that scans `src/content/docs/` and produces the Starlight `sidebar` structure dynamically. The builder is implemented at:

- `src/config/sidebar-fs.mjs`
- `astro.config.mjs` calls the builder with environment flags: `buildSidebarFromFS({ isDev, showReference })`.

### Key behavior

- Scans each subdirectory of `src/content/docs/` to create a section.
- If a directory contains `_section.json`, the script reads it for section metadata (`label`, `order`, `devOnly`, `autogenerate`).
- If `_section.json` includes `autogenerate: { "directory": "..." }`, the builder emits an `autogenerate` sidebar entry for Starlight instead of enumerating items.
- For regular directories, the script looks for `.md` and `.mdx` files and for each content file it attempts to read a companion JSON metadata file named `<base>.meta.json` (e.g. `example.meta.json`). That metadata controls per-page `label`, `slug`, `order`, and `devOnly`.
- The builder respects `devOnly` flags: pages or sections marked dev-only are included only when `NODE_ENV=development` or when `SHOW_REFERENCE=true`.

### Folder metadata details (schema & examples)

Folder-level metadata lives in a file named `_section.json` inside a documentation subfolder (for example `src/content/docs/reference/_section.json`). Fields supported:

- `label` (string): human-friendly section label shown in the sidebar.
- `order` (number): numeric ordering priority (lower numbers appear first). Defaults to `999` when omitted.
- `devOnly` (boolean): if true the whole section is only visible when `NODE_ENV=development` or `SHOW_REFERENCE=true`.
- `autogenerate` (object): when present the builder will emit an `{ autogenerate: { directory: '...' } }` entry to Starlight instead of enumerating per-file items. Use `autogenerate.directory` to point to the route/path to autogenerate.

Example `_section.json`:

```json
{
  "label": "Reference",
  "order": 20,
  "devOnly": false,
  "autogenerate": { "directory": "reference" }
}
```

Per-page metadata: for fine-grained control next to each markdown file you can add a `<base>.meta.json` file (for `example.md` use `example.meta.json`). Supported fields:

- `label` (string): override the displayed label for the page.
- `slug` (string): custom route slug for the page (e.g. `guides/example`). If omitted the slug is inferred from folder and file name.
- `order` (number): ordering within the section (lower first). Default `999`.
- `devOnly` (boolean): hide this page except when `NODE_ENV=development` or `SHOW_REFERENCE=true`.

Example `example.meta.json`:

```json
{
  "label": "Example Guide",
  "slug": "guides/example",
  "order": 10,
  "devOnly": false
}
```

Precedence and behavior notes

- Frontmatter inside `.md`/`.mdx` remains the authoritative source for page metadata used at runtime (title, description, template). The JSON metadata in `*.meta.json` is only consulted by the sidebar builder to construct labels, slugs and ordering. When possible keep display metadata in the page frontmatter and use `.meta.json` only for navigation overrides.
- The builder filters files by extensions `['.md', '.mdx']` and ignores other files.
- Ordering is numeric; unspecified orders default to `999`, and items are sorted ascending.

How to preview dev-only content

Set the environment variable `SHOW_REFERENCE=true` when running the dev server to force include dev-only sections/pages:

```pwsh
$env:SHOW_REFERENCE = 'true'
pnpm dev
```

Or run in a single line:

```pwsh
$env:SHOW_REFERENCE='true'; pnpm dev
```

## Why this approach

- Keeps content (Markdown/MDX) and navigation metadata next to each other in the repository.
- Allows partial automation (autogenerate sections) while keeping precise control via JSON metadata overrides.
- Makes it straightforward to hide dev-only content behind environment flags when publishing.

## Content metadata and validation

- The project uses `src/content.config.ts` which wires Starlight’s `docsLoader()` and `docsSchema()` to provide typed frontmatter validation for MD/MDX files. Frontmatter inside `.md`/`.mdx` is the primary source of per-page metadata.
- The sidebar builder augments that by reading optional JSON metadata files (`*.meta.json`) when present.

## Where to edit

- To change the site title, logo, custom CSS, or integrations: edit `astro.config.mjs`.
- To change how the sidebar is built: edit `src/config/sidebar-fs.mjs`.
- To add or edit content: add `.md`/`.mdx` files under `src/content/docs/` and optionally create `<base>.meta.json` next to the file if you need custom `label`, `slug`, `order` or `devOnly`.

## Notes for contributors

- Keep metadata minimal in JSON unless you need non-standard slugs or ordering; prefer frontmatter for page-level properties.
- Use `SHOW_REFERENCE=true pnpm dev` if you need to preview sections normally hidden behind environment flags.

## References

- Sidebar builder: `src/config/sidebar-fs.mjs`
- Content config: `src/content.config.ts`
- Starlight: [Starlight docs](https://starlight.astro.build/)

If you want, I can also add example `_section.json` and `*.meta.json` files into the repo, or generate README examples in a `docs/` folder. Tell me which you'd prefer.
