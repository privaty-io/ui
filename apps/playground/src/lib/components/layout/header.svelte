<script lang="ts">
  import ThemeButton from "../theme/theme-button.svelte";
</script>

<header class="sticky top-0 z-40 row-start-1 py-4">
  <div
    class="grid grid-cols-layout rounded-3xl bg-stone-300/50 py-1.5 pr-1.5 pl-3 text-xl font-bold backdrop-blur dark:bg-stone-700/50"
  >
    <p class="col-start-1">Privaty/ui</p>
    <div class="col-start-3">
      <ThemeButton />
    </div>
  </div>
</header>
