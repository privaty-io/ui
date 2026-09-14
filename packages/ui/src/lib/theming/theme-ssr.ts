/**
 * The server/static half of FOUC-free theming. Two delivery mechanisms,
 * use one or both:
 *
 * 1. SSR (best): put the placeholder in app.html —
 *    `<html lang="en" %theme-preference%>` — and replace it in a server
 *    hook from the cookie, so the first byte of HTML already carries the
 *    right attributes:
 *
 *    ```ts
 *    // hooks.server.ts
 *    export const handle: Handle = async ({ event, resolve }) =>
 *      resolve(event, {
 *        transformPageChunk: ({ html }) =>
 *          html.replace(
 *            "%theme-preference%",
 *            themeHtmlAttributes(
 *              parseThemePreference(event.cookies.get(defaultThemeCookie)),
 *            ),
 *          ),
 *      });
 *    ```
 *
 * 2. Client init script (covers prerendered/static pages, and any SSR
 *    setup without the hook): ThemeProvider emits it into <head> via
 *    svelte:head by default — fully importable, no app.html edits. Under
 *    a strict CSP the emitted script cannot carry Kit's nonce: disable
 *    the emission (`headScript={false}`) and paste
 *    `<script nonce="%sveltekit.nonce%">` + `themeInitScript()` +
 *    `</script>` into app.html's <head> instead.
 */
import type { ThemePreference } from "./theme.svelte";
import { defaultThemeCookie } from "./theme.svelte";

/**
 * The attribute string an SSR hook substitutes for the app.html
 * placeholder: explicit preferences carry `data-theme` (the scheme) and
 * `data-theme-preference` (for preference-keyed styling); "system"
 * carries only the preference — the media query owns the scheme until
 * the client resolves it.
 */
function themeHtmlAttributes(preference: ThemePreference): string {
  return preference === "system"
    ? `data-theme-preference="system"`
    : `data-theme="${preference}" data-theme-preference="${preference}"`;
}

/**
 * The pre-paint init script's SOURCE (no <script> tags): reads the
 * cookie, resolves "system" against the OS preference, and stamps both
 * data attributes — guarded, so it no-ops when the server already set
 * them, and self-removing. Runs in <head>, before first paint.
 */
function themeInitScript(cookieName: string = defaultThemeCookie): string {
  return (
    `if(!document.documentElement.dataset.theme){` +
    `var themePreferenceCookie=document.cookie.split("; ").find(function(row){return row.indexOf(${JSON.stringify(cookieName + "=")})===0});` +
    `var themePreference=themePreferenceCookie?themePreferenceCookie.split("=")[1]:"";` +
    `if(themePreference!=="dark"&&themePreference!=="light")themePreference="system";` +
    `var prefersDark=themePreference==="dark"||(themePreference==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);` +
    `document.documentElement.dataset.theme=prefersDark?"dark":"light";` +
    `document.documentElement.dataset.themePreference=themePreference;` +
    `}document.currentScript.remove();`
  );
}

export { themeHtmlAttributes, themeInitScript };
