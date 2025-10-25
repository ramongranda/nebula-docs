// @ts-check
import path from 'node:path';

/** Astro integration: restarts dev server when docs tree changes. */
export function docsWatcherIntegration() {
  return {
    name: 'docs-watcher-integration',
    hooks: {
      'astro:server:setup'({ server, logger }) {
        const docsRel = 'src/content/docs';
        const docsRoot = path.resolve(docsRel);
        const docsRootNorm = docsRoot.replace(/\\/g, '/').toLowerCase();

        const norm = (p) => (typeof p === 'string' ? p.replace(/\\/g, '/').toLowerCase() : '');
        const inDocsTree = (p) => {
          const np = norm(p);
          return (
            np === docsRootNorm ||
            np.startsWith(docsRootNorm + '/') ||
            np === 'src/content/docs' ||
            np.startsWith('src/content/docs/')
          );
        };

        const log = (msg) => {
          try { logger && logger.info && logger.info(msg, { label: 'docs-watch' }); } catch {}
        };

        const restartIfDocs = (p) => {
          if (!inDocsTree(p)) return;
          log(`docs changed: ${p} -> restarting dev server to rebuild sidebar`);
          server.restart();
        };

        // Ensure watcher is attached to both relative and absolute paths
        server.watcher.add([
          docsRoot,
          docsRel,
          `${docsRel}/**`,
          `${docsRel}/**/*.{md,mdx,json}`,
          'src/config/sidebar-fs.mjs',
        ]);

        server.watcher.on('add', restartIfDocs);
        server.watcher.on('change', restartIfDocs);
        server.watcher.on('unlink', restartIfDocs);
        server.watcher.on('addDir', restartIfDocs);
        server.watcher.on('unlinkDir', restartIfDocs);

        // Catch-all and raw events to handle edge cases on Windows
        server.watcher.on('all', (event, p) => {
          if (!p) return;
          if (!inDocsTree(p)) return;
          log(`docs all: ${event} ${p} -> restarting`);
          server.restart();
        });
        // @ts-ignore chokidar-specific event
        server.watcher.on('raw', (event, p) => {
          if (typeof p !== 'string') return;
          if (!inDocsTree(p)) return;
          log(`docs raw: ${event} ${p} -> restarting`);
          server.restart();
        });
      },
    },
  };
}

