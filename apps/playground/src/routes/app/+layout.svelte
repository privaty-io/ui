<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { Snippet } from "svelte";
  import { cn } from "@privaty/ui";

  const { children }: { children: Snippet } = $props();

  const sections = [
    { href: resolve("app/inventory"), label: "Inventory" },
    { href: resolve("app/deliveries"), label: "Deliveries" },
    { href: resolve("app/suppliers"), label: "Suppliers" },
  ];
</script>

<!-- The "real app" shell: these pages are NOT component demos — they wire
     the libraries the way a product would, and the e2e suite drives them
     like a user. -->
<div class="mx-auto flex w-full max-w-5xl flex-col gap-4 py-6">
  <nav class="flex items-center gap-1" aria-label="Fromage HQ">
    <span class="mr-3 text-lg font-semibold">Fromage&nbsp;HQ</span>
    {#each sections as section (section.href)}
      <a
        href={section.href}
        aria-current={page.url.pathname === section.href ? "page" : undefined}
        class={cn(
          "rounded px-3 py-1 text-sm",
          page.url.pathname === section.href
            ? "bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900"
            : "hover:bg-stone-200 dark:hover:bg-stone-800",
        )}
      >
        {section.label}
      </a>
    {/each}
  </nav>

  {@render children()}
</div>
