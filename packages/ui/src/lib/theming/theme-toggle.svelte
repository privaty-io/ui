<!-- @component
A ready-made theme cycle button: system → light → dark → system. The
three icons are ALL rendered and CSS picks the visible one from the
`data-theme-preference` attribute — the SSR hook (or init script) sets
that attribute pre-hydration, so the server and client render identical
markup and hydration stays clean. Requires ThemeProvider mounted.
-->
<script lang="ts">
  import { MoonIcon, SunIcon, SunMoonIcon } from "@lucide/svelte";
  import { cn } from "../cn/cn";
  import Button from "../controls/button/button.svelte";
  import { theme, themePreferences } from "./theme.svelte";

  interface Props {
    /** Accessible name for the button. */
    label?: string;
    /** Extra classes for the button. */
    class?: string;
    /** Extra classes for the icons — e.g. "size-5" to resize (merged
     * last, so it wins over the size-4 default). */
    iconClass?: string;
  }

  const { label = "Switch theme", class: classes, iconClass }: Props = $props();

  function cycle() {
    const index = themePreferences.indexOf(theme.preference);
    theme.preference = themePreferences[(index + 1) % themePreferences.length];
  }

  // Visibility is attribute-driven so SSR needs no client knowledge of
  // the preference — html[data-theme-preference] decides.
  const iconClasses = {
    system: cn("hidden [[data-theme-preference=system]_&]:block"),
    light: cn("hidden [[data-theme-preference=light]_&]:block"),
    dark: cn("hidden [[data-theme-preference=dark]_&]:block"),
  };
</script>

<Button
  variant="secondary"
  type="button"
  title={label}
  class={cn("px-2", classes)}
  onclick={cycle}
>
  <SunMoonIcon
    class={cn("size-4", iconClasses.system, iconClass)}
    aria-hidden="true"
  />
  <SunIcon
    class={cn("size-4", iconClasses.light, iconClass)}
    aria-hidden="true"
  />
  <MoonIcon
    class={cn("size-4", iconClasses.dark, iconClass)}
    aria-hidden="true"
  />
  <span class="sr-only">{label}</span>
</Button>
