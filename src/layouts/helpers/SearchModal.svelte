<!-- src/layouts/helpers/SearchModal.svelte -->
<script lang="ts">
  import SearchResult from './SearchResult.svelte';
  import { searchDocs } from '@/lib/search/lunr';
  import { onMount } from 'svelte';

  /**
   * Placeholder text for the search input field.
   * @type {string}
   */
  export let placeholder: string = 'Search...';

  let open = false;
  let q = '';
  let results: Array<{ title: string; slug: string; excerpt?: string }> = [];
  let inputEl: HTMLInputElement | null = null;

  /**
   * Performs a search using the current query and updates the results array.
   * If the query is empty, clears the results.
   */
  async function doSearch() {
    const term = q.trim();
    if (!term) {
      results = [];
      return;
    }
    results = await searchDocs(term, 20);
  }

  /**
   * Handles global keyboard shortcuts for opening and closing the search modal.
   * - Cmd/Ctrl+K toggles the modal.
   * - Escape closes the modal.
   */
  function onKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'k') {
      e.preventDefault();
      open = !open;
      if (open) queueMicrotask(() => inputEl?.focus());
    } else if (k === 'escape') {
      open = false;
    }
  }

  /**
   * Registers the keyboard event listener when the component mounts,
   * and cleans it up on unmount.
   */
  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="hidden md:block">
  <button
    on:click={() => { open = true; queueMicrotask(() => inputEl?.focus()); }}
    class="px-3 py-1 text-sm border rounded-md"
  >
    ⌘K <span class="opacity-60 ml-1">Search</span>
  </button>
</div>

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-50 bg-black/40"
    aria-label="Close search modal"
    tabindex="0"
    on:click={() => open = false}
    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { open = false; } }}
    style="all:unset; position:fixed; inset:0; z-index:50; background:rgba(0,0,0,0.4); cursor:pointer;"
  ></button>

  <div class="fixed inset-x-0 top-20 z-50 mx-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl dark:bg-neutral-900">
    <input
      bind:this={inputEl}
      type="text"
      bind:value={q}
      on:input={doSearch}
      class="w-full rounded border px-3 py-2 outline-none dark:bg-neutral-800"
      {placeholder}
    />

    {#if q && results.length === 0}
      <p class="p-4 text-sm opacity-70">No results found for "{q}".</p>
    {:else if results.length > 0}
      <div class="p-2">
        <SearchResult items={results} keyword={q} />
      </div>
    {/if}
  </div>
{/if}
