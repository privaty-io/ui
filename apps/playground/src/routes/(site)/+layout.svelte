<script lang="ts">
  // The site chrome, built from the layouts package: the Header (brand
  // + top nav + theme toggle) and a quiet Footer around every regular
  // page. Layout fragments render straight into the root Frame's
  // column, so pages between the bars grow with their scaffolds.
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { Footer, Header, HeaderNav, NavItem } from "@privaty/ui-layouts";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();

  const sections = [
    { href: resolve("/(site)"), label: "Home", exact: true },
    { href: resolve("app"), label: "App" },
    { href: resolve("sandbox"), label: "Sandbox" },
  ];

  const isCurrent = (section: (typeof sections)[number]) =>
    section.exact
      ? page.url.pathname === section.href
      : page.url.pathname.startsWith(section.href);
</script>

<Header title="Privaty/ui" themeToggle label="Site header">
  <HeaderNav label="Site">
    {#each sections as section (section.href)}
      <NavItem href={section.href} current={isCurrent(section)}>
        {section.label}
      </NavItem>
    {/each}
  </HeaderNav>
</Header>

{@render children()}

<Footer>
  <span>Privaty UI · Apache-2.0</span>
  {#snippet end()}<span>built on the tiling system</span>{/snippet}
</Footer>
