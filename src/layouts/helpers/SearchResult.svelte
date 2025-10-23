<script lang="ts">
  /**
   * List of search result items to display.
   * @type {Array<{ title: string; excerpt?: string; slug: string; content?: string }>}
   */
  export let items: Array<{ title: string; excerpt?: string; slug: string; content?: string }> = [];

  /**
   * The search keyword to highlight in the results.
   * @type {string}
   */
  export let keyword: string = '';

  /**
   * Highlights all occurrences of the search term in the given text by wrapping them in <mark> tags.
   * @param text - The text to search within.
   * @param term - The term to highlight.
   * @returns The text with highlighted terms.
   */
  function highlight(text: string, term: string) {
    if (!term || !text) return text || '';
    const parts = text.split(new RegExp(`(${term})`, 'ig'));
    return parts.map((p) => p.toLowerCase() === term.toLowerCase() ? `<mark>${p}</mark>` : p).join('');
  }
</script>

<ul class="space-y-4">
  {#each items as it}
    <li>
      <a href={it.slug} class="text-lg font-medium hover:underline" rel="prefetch">
        {@html highlight(it.title, keyword)}
      </a>
      {#if it.excerpt}
        <p class="text-sm opacity-80 mt-1">{@html highlight(it.excerpt, keyword)}</p>
      {/if}
    </li>
  {/each}
</ul>
