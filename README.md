# Nebula Docs: Technical Documentation Site

This repository hosts a technical documentation site built with Astro and Markdown. Below, you'll find details about the project structure, commands, and resources.

## 🚀 Project Structure

The project is organized as follows:

```text
/
├── public/
│   └── Static assets (e.g., images, diagrams, favicon)
├── src/
│   ├── assets/        # Additional assets
│   ├── components/    # Astro components
│   ├── layouts/       # Shared layouts
│   ├── pages/         # Markdown and Astro pages
│   ├── hooks/         # Utility scripts
│   ├── scripts/       # Client-side scripts
│   └── styles/        # Global and component-specific styles
└── package.json       # Project metadata and scripts
```

For more details on the folder structure, refer to the [Astro project structure guide](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

Run the following commands from the root of the project:

| Command                   | Description                                      |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`            | Install project dependencies                     |
| `pnpm dev`                | Start the local development server at `localhost:4321` |
| `pnpm build`              | Build the production site to the `./dist/` folder |
| `pnpm preview`            | Preview the production build locally             |
| `pnpm astro ...`          | Run Astro CLI commands (e.g., `astro add`, `astro check`) |
| `pnpm astro -- --help`    | Display help for the Astro CLI                   |

## 🌟 Features

- **Responsive Design**: Includes a `boilerplate.css` for responsive utilities.
- **Markdown Documentation**: All content is authored in Markdown under `src/pages/docs/`.
- **JSON Generation**: Automatically generates JSON before running the development server.
- **Custom Hooks and Scripts**: Utility scripts for navigation, themes, and table of contents.

## 📚 Documentation Guidelines

- All documentation must be written in English.
- Use Markdown with proper frontmatter for each page:
  ```markdown
  ---
  layout: ../../layouts/DocLayout.astro
  title: Page Title
  description: One-line summary.
  ---
  ```
- Start sections at `##` (no `#` as the layout renders the title).
- Use fenced code blocks with language tags (e.g., ` ```ts `, ` ```bash `).

## 👀 Learn More

- [Astro Documentation](https://docs.astro.build)
- [Astro Discord Community](https://astro.build/chat)
"# nebula-docs" 
