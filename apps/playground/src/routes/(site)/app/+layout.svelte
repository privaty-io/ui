<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import {
    BoxesIcon,
    FactoryIcon,
    PanelLeftIcon,
    TruckIcon,
  } from "@lucide/svelte";
  import { Button } from "@privaty/ui";
  import { NavItem, NavList, SidebarPage } from "@privaty/ui-layouts";
  import type { LayoutProps } from "./$types";

  const { children }: LayoutProps = $props();

  const sections = [
    { href: resolve("app/inventory"), label: "Inventory", icon: BoxesIcon },
    { href: resolve("app/deliveries"), label: "Deliveries", icon: TruckIcon },
    { href: resolve("app/suppliers"), label: "Suppliers", icon: FactoryIcon },
  ];
</script>

<!-- The "real app" shell: these pages are NOT component demos — they wire
     the libraries the way a product would, and the e2e suite drives them
     like a user. Its chrome is a SidebarPage under the site header: the
     nav compacts to an icon rail, the content scrolls in one main tile. -->
<SidebarPage mainLabel="Back office">
  {#snippet nav({ navCollapsed, toggleNav })}
    <Button
      variant="ghost"
      type="button"
      class={navCollapsed ? "justify-center px-0" : "self-end px-2"}
      aria-label="Toggle navigation"
      aria-expanded={!navCollapsed}
      title="Toggle navigation"
      onclick={toggleNav}
    >
      <PanelLeftIcon class="size-4 shrink-0" />
    </Button>
    <NavList label="Fromage HQ" class="mt-1">
      {#each sections as section (section.href)}
        <NavItem
          href={section.href}
          current={page.url.pathname === section.href}
          title={section.label}
        >
          {#snippet icon()}
            <section.icon class="size-4 shrink-0" />
          {/snippet}
          {section.label}
        </NavItem>
      {/each}
      {#snippet footer()}Fromage HQ · back office{/snippet}
    </NavList>
  {/snippet}

  <!-- The content column keeps the pre-conversion width so the wide
       tables still overflow and exercise their scroll math. -->
  <div class="mx-auto w-full max-w-5xl py-4">
    {@render children()}
  </div>
</SidebarPage>
