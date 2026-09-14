<script lang="ts">
  import NavItem from "../nav/nav-item.svelte";
  import NavList from "../nav/nav-list.svelte";
  import SidebarPage from "./sidebar-page.svelte";

  interface Props {
    bare?: boolean;
  }

  const { bare = false }: Props = $props();

  let navSize = $state(240);
  let sidebar: { toggleNav: () => void } | undefined = $state();

  export function currentNavSize() {
    return navSize;
  }
  export function toggleFromOutside() {
    sidebar?.toggleNav();
  }
</script>

<div class="h-160 w-240">
  <SidebarPage bind:this={sidebar} bind:navSize {bare} mainLabel="Workbench">
    {#snippet nav({ navCollapsed, toggleNav })}
      <button type="button" data-testid="toggle-nav" onclick={toggleNav}>
        {navCollapsed ? "open nav" : "close nav"}
      </button>
      <NavList label="Fixture sections">
        <NavItem href="#cellar" current title="Cellar">
          {#snippet icon()}
            <svg data-testid="cellar-icon" class="size-4"></svg>
          {/snippet}
          Cellar
        </NavItem>
        <NavItem href="#orders">Orders</NavItem>
        {#snippet footer()}<span data-testid="nav-footer">v0-fixture</span>
        {/snippet}
      </NavList>
    {/snippet}
    <div data-testid="main-content">main content</div>
  </SidebarPage>
</div>
