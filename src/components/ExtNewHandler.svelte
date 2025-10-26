<script lang="ts">
  import { onMount } from 'svelte';
  onMount(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('u') || '';
      const u = decodeURIComponent(raw).trim();
      const isHttp = /^https?:\/\//i.test(u);
      const a = document.getElementById('ext-new-link') as HTMLAnchorElement | null;
      if (!isHttp) {
        if (a) a.textContent = 'Invalid external link';
        return;
      }
      try { window.open(u, '_blank', 'noopener'); } catch {}
      if (a) { a.href = u; a.textContent = u; }
      // Mark matching sidebar link as current
      try {
        const current = window.location.pathname + window.location.search;
        const root = document.getElementById('starlight__sidebar') || document;
        const links = root.querySelectorAll('a[href]');
        links.forEach((node) => {
          const link = node as HTMLAnchorElement;
          try {
            const href = new URL(link.getAttribute('href') || '', window.location.origin);
            const pq = href.pathname + href.search;
            if (pq === current) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
          } catch {}
        });
      } catch {}
    } catch {}
  });
</script>
