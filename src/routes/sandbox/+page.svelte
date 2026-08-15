<script lang="ts">
  import { resolve } from "$app/paths";
</script>

<main class="mx-auto flex w-full max-w-md flex-col gap-4 py-8">
  <h1 class="text-2xl font-medium">Sandbox</h1>

  <ul class="flex flex-col gap-1 underline">
    <li><a href={resolve("sandbox/form")}>Form flow (remote functions)</a></li>
    <li><a href={resolve("sandbox/input")}>Core input variants</a></li>
  </ul>
</main>
