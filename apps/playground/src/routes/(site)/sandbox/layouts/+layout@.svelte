<script lang="ts">
  // The layouts showcase is a real mini-app: this route layout composes
  // the frame furniture (a section Header, a status Footer) around a
  // SidebarPage — pages render into the sidebar's bare main track, and
  // the shell (nav width included) persists across navigations. The `@`
  // resets past the sandbox Page layout: this section scaffolds itself.
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import {
    LayoutDashboardIcon,
    LogInIcon,
    PackageIcon,
    PanelLeftIcon,
  } from "@lucide/svelte";
  import { Button, Kbd } from "@privaty/ui";
  import {
    Footer,
    Header,
    NavItem,
    NavList,
    SidebarPage,
  } from "@privaty/ui-layouts";
  import type { LayoutProps } from "./$types";

  const { children }: LayoutProps = $props();

  // Bindable split size — a real app would persist this per user.
  let navSize = $state(230);

  const sections = [
    {
      href: resolve("sandbox/layouts"),
      label: "Dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      href: resolve("sandbox/layouts/orders"),
      label: "Orders",
      icon: PackageIcon,
    },
    {
      href: resolve("sandbox/layouts/sign-in"),
      label: "Sign-in demo",
      icon: LogInIcon,
    },
  ];
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
  <Header
    title="Cellar Ops"
    subtitle="composed from @privaty/ui-layouts"
    label="Cellar Ops header"
    themeToggle
  >
    {#snippet actions()}
      <Button variant="secondary" type="button">Export</Button>
    {/snippet}
  </Header>

  <SidebarPage bare bind:navSize>
    {#snippet nav({ navCollapsed, toggleNav })}
      <!-- The collapse affordance lives in the pane it collapses —
           docked to the pane's end while open, centered on the rail
           while compact. -->
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
      <NavList label="Cellar sections" class="mt-1">
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
        {#snippet footer()}Signed in as Lukas{/snippet}
      </NavList>
    {/snippet}

    {@render children()}
  </SidebarPage>

  <Footer label="Cellar status">
    <span>nav {navSize}px</span>
    {#snippet end()}
      drag gutters · <Kbd>Home</Kbd> compacts the nav · double-click resets
    {/snippet}
  </Footer>
</div>
