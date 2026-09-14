<script lang="ts">
  import HeaderNav from "./header-nav.svelte";
  import NavItem from "./nav-item.svelte";
  import NavList from "./nav-list.svelte";

  let activated = $state(0);
  export function activations() {
    return activated;
  }
</script>

<NavList label="Fixture nav">
  <NavItem href="#cellar" current>Cellar</NavItem>
  <NavItem href="#orders">Orders</NavItem>
  <NavItem onclick={() => (activated += 1)}>Act</NavItem>
  {#snippet footer()}<span>v0-fixture</span>{/snippet}
</NavList>

<HeaderNav label="Fixture top nav">
  <NavItem href="#home" current>Home</NavItem>
  <NavItem href="#docs">Docs</NavItem>
</HeaderNav>
