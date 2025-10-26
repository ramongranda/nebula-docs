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
   │   │   └── docs/           # Markdown/MDX/Markdoc content files and per-folder metadata
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
- For regular directories, the script looks for `.md`, `.mdx` and `.mdoc` files and for each content file it attempts to read a companion JSON metadata file named `<base>.meta.json` (e.g. `example.meta.json`). That metadata controls per-page `label`, `slug`, `order`, and `devOnly`.
- The builder respects `devOnly` flags: pages or sections marked dev-only are included only when `NODE_ENV=development` or when `SHOW_REFERENCE=true`.

### Link files (.link)

Nebula supports simple companion link files to declare external links in the sidebar without editing JSON metadata:

- Co-named `.link`: if a content file `foo.mdx` (or `.md`, `.mdoc`, `.astro`) has a sibling `foo.link`, the text inside `foo.link` is used as the sidebar URL for that entry. This takes precedence over any `link`/`href` defined in metadata. If no `label` is provided in metadata, the label is derived from the base filename and prettified (e.g., `authoring-content` → `Authoring Content`).
- Standalone `.link`: if `foo.link` exists without a content file, the builder creates a link-only sidebar item. You may still control `label`/`order` via folder metadata using the base key (`foo`); otherwise the label is prettified from the filename and the order defaults to `999`.

Note: the dev server watcher is configured to restart on `.link` changes. External links (http/https) in the sidebar render with an external-link icon next to the label.

#### Example

Folder structure:

```text
src/content/docs/
└─ guides/
   ├─ authoring-content.mdx
   ├─ authoring-content.link      # contains: https://docs.example.com/authoring
   ├─ external-tool.link          # contains: https://tool.example.com
   └─ _metadata.json              # optional label/order overrides
```

Resulting sidebar items under "Guides":

```jsonc
[
  { "label": "Authoring Content", "link": "https://docs.example.com/authoring" },
  { "label": "External Tool", "link": "https://tool.example.com" }
]
```

Notes:

- If `_metadata.json` provides `items.authoring-content.label`, that label is used instead of the prettified filename.
- Standalone `.link` items can also receive `label`/`order` from `_metadata.json` under the same base key (e.g., `items.external-tool`).

### Controlling how external links open

Per item you can set an `open` mode in `_metadata.json` (either in `items.<base>` or `<base>`):

- `"same"` (default): open the external URL in the same tab.
- `"new"`: open in a new tab.
- `"embed"`: load the external URL inside the site chrome using an iframe wrapper.

Implementation details:

- The sidebar builder wraps external URLs with a path helper `/ext/<mode>/<encoded>` (where `<encoded>` is base64url of the full URL) to implement these behaviors without relying on unsupported `target`/`rel` keys in Starlight’s sidebar.
- The external link icon in the sidebar also appears for wrapped links.

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
- The builder filters files by extensions `['.md', '.mdx', '.mdoc']` and ignores other files.
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

## Content types, metadata and validation

- Nebula admite archivos de contenido `.md`, `.mdx` y `.mdoc`.
- Para usar componentes/etiquetas de Markdoc (por ejemplo `{% tabs %}`), usa `.mdoc`.
- The project uses `src/content.config.ts` which wires Starlight’s `docsLoader()` and `docsSchema()` to provide typed frontmatter validation. Frontmatter inside `.md`/`.mdx`/`.mdoc` is the primary source of per-page metadata.
- The sidebar builder augments that by reading optional JSON metadata files (`*.meta.json`) when present.

## Where to edit

- To change the site title, logo, custom CSS, or integrations: edit `astro.config.mjs`.
- To change how the sidebar is built: edit `src/config/sidebar-fs.mjs`.
- To add or edit content: add `.md`, `.mdx` or `.mdoc` files under `src/content/docs/` and optionally create `<base>.meta.json` next to the file if you need custom `label`, `slug`, `order` or `devOnly`.

## Supported content types

- `.md` — Standard Markdown.
- `.mdx` — Markdown with JSX components.
- `.mdoc` — Markdoc (recommended for Starlight Markdoc tags like `{% tabs %}`).

## Notes for contributors

- Keep metadata minimal in JSON unless you need non-standard slugs or ordering; prefer frontmatter for page-level properties.
- Use `SHOW_REFERENCE=true pnpm dev` if you need to preview sections normally hidden behind environment flags.

## References

- Sidebar builder: `src/config/sidebar-fs.mjs`
- Content config: `src/content.config.ts`
- Starlight: [Starlight docs](https://starlight.astro.build/)

If you want, I can also add example `_section.json` and `*.meta.json` files into the repo, or generate README examples in a `docs/` folder. Tell me which you'd prefer.

## Docker

This repository includes a multi-stage Dockerfile that builds the site with Node (pnpm) and serves the compiled `dist/` via nginx.

Build (standard):

```pwsh
docker build -t nebula-docs:latest .
```

Build including dev-only content (set `SHOW_REFERENCE=true` at build time so the sidebar builder includes dev-only sections/pages):

```pwsh
docker build -t nebula-docs:dev --build-arg SHOW_REFERENCE=true .
```

Run the container (exposes nginx on container port 80):

```pwsh
docker run -d -p 8080:80 --name nebula-site nebula-docs:latest
# then open http://localhost:8080
```

Notes:

- The `SHOW_REFERENCE` flag is a build-time arg that controls the sidebar builder's dev-only inclusion; pass it with `--build-arg SHOW_REFERENCE=true` when building the Docker image if you want those sections baked into the static build.
- If you need to debug build-time behavior, you can run an interactive build container:

```pwsh
docker run --rm -it --entrypoint sh -v ${PWD}:/app node:18-alpine
# inside container: pnpm install && pnpm build
```
