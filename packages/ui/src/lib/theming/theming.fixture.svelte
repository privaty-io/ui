<script lang="ts">
  import ThemeProvider from "./theme-provider.svelte";
  import ThemeToggle from "./theme-toggle.svelte";

  interface Props {
    /** The browser test page shares one <head> — keep the init script
     * out of it by default. */
    headScript?: boolean;
  }

  const { headScript = false }: Props = $props();
</script>

<ThemeProvider {headScript} />
<ThemeToggle />
