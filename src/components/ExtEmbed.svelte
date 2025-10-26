<script lang="ts">
  import { onMount } from 'svelte';
  let url = '';
  let mode: 'embed' | 'new' | 'same' = 'embed';
  let valid = false;
  onMount(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const u = decodeURIComponent(params.get('u') || '').trim();
      const m = (params.get('m') || 'embed').toLowerCase();
      if (m === 'new' || m === 'same' || m === 'embed') mode = m as any;
      valid = /^https?:\/\//i.test(u);
      if (valid) url = u;
      // Handle special modes
      if (valid && mode === 'same') {
        window.location.replace(u);
      } else if (valid && mode === 'new') {
        // Attempt to open in new tab; also populate MDX-provided bar
        try { window.open(u, '_blank', 'noopener'); } catch {}
        try {
          const linkEl = document.getElementById('ext-new-link') as HTMLAnchorElement | null;
          const wrapEl = document.getElementById('ext-new');
          if (linkEl) {
            linkEl.href = u;
            linkEl.textContent = u;
          }
          if (wrapEl) {
            wrapEl.classList.remove('hidden');
          }
        } catch {}
      }
      // Ensure the matching sidebar link is marked as current
      try {
        const current = window.location.pathname + window.location.search;
        const root = document.getElementById('starlight__sidebar') || document;
        const links = root.querySelectorAll('a[href]');
        links.forEach((node) => {
          const a = node as HTMLAnchorElement;
          try {
            const href = new URL(a.getAttribute('href') || '', window.location.origin);
            const pq = href.pathname + href.search;
            if (pq === current) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
          } catch {}
        });
      } catch {}
    } catch {
      valid = false;
    }
  });
</script>

{#if valid}
  {#if mode === 'embed'}
    <div class="ext-embed">
      <div class="ext-inner">
        <div class="ext-frame">
          <iframe src={url} title="Embedded external content" style="border:0; width:100%; height:100%;"></iframe>
        </div>
      </div>
    </div>
  {:else}
    <!-- Mode 'new' handled by MDX markup; nothing to render here -->
  {/if}
{:else}
{/if}

<style>
  .ext-embed { padding: 0; margin: 0; }
  .ext-inner { max-width: none; margin: 0; }
  .ext-frame {
    height: calc(100vh - var(--sl-nav-height, 3rem));
    min-height: calc(100vh - var(--sl-nav-height, 3rem));
    width: 100%;
  }
</style>
