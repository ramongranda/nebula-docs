<script lang="ts">
  import config from '@/config/config.json';
  /**
   * Optional CSS class for the main Disqus container.
   * @type {string}
   */
  export let className: string = '';
  const { disqus } = config as any;


  /**
   * Loads and injects the Disqus script into the page if enabled and not already loaded.
   * Sets the page URL and identifier for the comments.
   */
  function loadDisqus() {
    if (!disqus?.enable || !disqus?.shortname) return;
    if (document.getElementById('dsq-embed-scr')) return;
    // Configuración de Disqus para la página actual
    (window as any).disqus_config = function () {
      this.page.url = window.location.href;
      this.page.identifier = window.location.pathname;
    };
    // Crear e insertar el script de Disqus
    const s = document.createElement('script');
    s.src = `https://${disqus.shortname}.disqus.com/embed.js`;
    s.id = 'dsq-embed-scr';
    s.setAttribute('data-timestamp', Date.now().toString());
    (document.head || document.body).appendChild(s);
  }

  if (typeof window !== 'undefined') loadDisqus();
</script>

{#if disqus?.enable}
  <div class={className}><div id="disqus_thread"></div></div>
{/if}
