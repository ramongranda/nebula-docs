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
          try { logger?.info?.(msg, { label: 'docs-watch' }); } catch {}
        };

        // Debounce restarts and ignore events until the initial scan is ready.
        let ready = false;
        let restartTimer = null;
        const scheduleRestart = (reason) => {
          if (!ready) return; // avoid storms during initial scan
          if (restartTimer) clearTimeout(restartTimer);
          restartTimer = setTimeout(() => {
            restartTimer = null;
            log(`docs changed (${reason}) -> restarting dev server to rebuild sidebar`);
            server.restart();
          }, 200);
        };

        const onChange = (p, reason) => {
          if (!p) return;
          if (!inDocsTree(p)) return;
          scheduleRestart(`${reason}: ${p}`);
        };

        // Ensure watcher includes docs root, explicit file globs (incl. .mdoc),
        // and the sidebar builder file. Debounce + ready gating prevents storms.
        server.watcher.add([
          docsRoot,
          'src/content/docs/**/*.{md,mdx,mdoc,astro,json}',
          'src/config/sidebar-fs.mjs',
        ]);

        server.watcher.on('ready', () => {
          ready = true;
          log('docs watcher ready');
        });

        server.watcher.on('add', (p) => onChange(p, 'add'));
        server.watcher.on('change', (p) => onChange(p, 'change'));
        server.watcher.on('unlink', (p) => onChange(p, 'unlink'));
        server.watcher.on('addDir', (p) => onChange(p, 'addDir'));
        server.watcher.on('unlinkDir', (p) => onChange(p, 'unlinkDir'));
      },
    },
  };
}
