<script lang="ts">
  import { onMount } from "svelte";
  let checked = false;

  function applyTheme(isDark: boolean) {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    checked = isDark;
  }

  onMount(() => {
    const saved = localStorage.getItem("theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved ? saved === "dark" : prefers);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMQ = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) applyTheme(e.matches);
    };
    mq.addEventListener?.("change", onMQ);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) applyTheme(e.newValue === "dark");
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mq.removeEventListener?.("change", onMQ);
      window.removeEventListener("storage", onStorage);
    };
  });

  function toggle() {
    applyTheme(!checked);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  }
</script>

<button
  type="button"
  class="relative flex items-center bg-gray-300 dark:bg-gray-700 rounded-full w-10 h-5 transition-colors duration-300"
  role="switch"
  aria-checked={checked}
  aria-label="Toggle theme"
  on:click={toggle}
  on:keydown={onKey}
>
  <!-- Sol -->
  <svg class="absolute left-1 text-yellow-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <circle cx="12" cy="12" r="4"/><path d="M3 12h1m8-9v1m8 8h1m-9 8v1m-6.4-15.4.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"/>
  </svg>
  <!-- Luna -->
  <svg class="absolute right-1 text-gray-200" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
  </svg>
  <!-- Bola -->
  <span
    class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-black transition-transform duration-300"
    style:transform={`translateX(${checked ? '20px' : '0'})`}
  >
    <span class="sr-only">Toggle dark mode</span>
  </span>
</button>
