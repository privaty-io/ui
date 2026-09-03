<script lang="ts">
  import { resolve } from "$app/paths";
</script>

<main class="flex flex-col items-center gap-4 px-2 text-center">
  <h1 class="px-4 text-2xl font-medium sm:text-3xl md:text-4xl">
    Welcome to Privaty/ui
  </h1>
  <ul class="flex gap-4 underline">
    <li><a href={resolve("app")}>The app (e2e surface)</a></li>
    <li><a href={resolve("sandbox")}>Component sandbox</a></li>
  </ul>
</main>
