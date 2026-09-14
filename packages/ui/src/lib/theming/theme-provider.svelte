<!-- @component
The theme system's runtime: mount ONCE in the root layout. Applies the
store's preference to the html element (`data-theme` = the resolved
scheme, `data-theme-preference` = the stated preference, for
preference-keyed styling), follows OS changes while on "system",
persists to the cookie, and routes every flip through `switchTheme` so
the page switches atomically. By default it also emits the pre-paint
init script into the head via svelte:head — the FOUC guard for pages the SSR
hook didn't stamp; under a strict CSP set `headScript={false}` and
paste `themeInitScript()` into app.html with Kit's nonce instead (see
theme-ssr.ts).
-->
<script lang="ts">
  import { MediaQuery } from "svelte/reactivity";
  import { switchTheme } from "./switch-theme";
  import { defaultThemeCookie, readThemeCookie, theme } from "./theme.svelte";
  import { themeInitScript } from "./theme-ssr";

  interface Props {
    /** The preference cookie's name — keep every layer (SSR hook, init
     * script, provider) on the same one. */
    cookie?: string;
    /** Emits the pre-paint init script via svelte:head (default). Turn
     * off under a strict CSP and app.html the nonce'd script instead. */
    headScript?: boolean;
  }

  const { cookie = defaultThemeCookie, headScript = true }: Props = $props();

  // A custom cookie name invalidates the store's default-cookie init —
  // re-read before anything renders from the store. The cookie name is
  // deliberately captured once: it is configuration, stable for the
  // component's lifetime.
  // svelte-ignore state_referenced_locally
  if (typeof document !== "undefined" && cookie !== defaultThemeCookie) {
    theme.preference = readThemeCookie(cookie);
  }

  const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

  const prefersDark = new MediaQuery("(prefers-color-scheme: dark)");
  const resolved = $derived(
    theme.preference === "system"
      ? prefersDark.current
        ? "dark"
        : "light"
      : theme.preference,
  );

  // The mount run applies directly (the init script/SSR hook already
  // painted the right state — nothing visible changes); later runs are
  // real flips and go through switchTheme so the page switches
  // atomically instead of half-fading element by element.
  let mounted = false;

  $effect(() => {
    const scheme = resolved;
    const preference = theme.preference;
    const applyToDom = () => {
      document.documentElement.dataset.theme = scheme;
      document.documentElement.dataset.themePreference = preference;
    };
    if (mounted) switchTheme(applyToDom);
    else {
      applyToDom();
      mounted = true;
    }

    document.cookie =
      preference === "system"
        ? `${cookie}=; SameSite=Strict; Secure; Path=/; Max-Age=0`
        : `${cookie}=${preference}; SameSite=Strict; Secure; Path=/; Max-Age=${ONE_YEAR_SECONDS}`;
  });

  // The tags are assembled without any literal "<" + letter sequence:
  // the Svelte parser scans this component's script block for tag-like
  // text and a spelled-out script tag would end the block at parse time.
  const angle = String.fromCharCode(60);
  // svelte-ignore state_referenced_locally
  const initScriptHtml =
    angle + "script>" + themeInitScript(cookie) + angle + "/script>";
</script>

<svelte:head>
  {#if headScript}
    <!-- The injected markup is our own constant, never user input. -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html initScriptHtml}
  {/if}
</svelte:head>
