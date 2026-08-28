import { getContext, setContext } from "svelte";

/**
 * Sizing modes for density-aware components (core controls, tables) —
 * "comfortable" is the default; "compact" tightens vertical padding and
 * shrinks the text.
 */
type UiDensity = "comfortable" | "compact";

/**
 * Reactive read access to the ambient density. Containers (e.g. a compact
 * table) provide it with a getter so consumers track changes; controls read
 * it as their sizing default.
 */
interface UiDensityContext {
  /** The current density. Providers back this with a getter over reactive
   * state so reads track changes. */
  readonly density: UiDensity;
}

const defaultUiDensity: UiDensityContext = { density: "comfortable" };

const uiDensityContextKey = Symbol("privaty-ui-density");

/**
 * Provides the ambient density to the component's subtree. Pass an object
 * whose `density` is a getter over reactive state so downstream controls
 * re-render when it changes. Must be called during component init.
 */
function setUiDensity(context: UiDensityContext): void {
  setContext<UiDensityContext>(uiDensityContextKey, context);
}

/**
 * Reads the nearest ambient density context, falling back to "comfortable".
 * Must be called during component init; read `.density` off the returned
 * object where you use it (don't destructure at init) so getter-backed
 * providers stay reactive.
 */
function getUiDensity(): UiDensityContext {
  return (
    getContext<UiDensityContext | undefined>(uiDensityContextKey) ??
    defaultUiDensity
  );
}

export { getUiDensity, setUiDensity };
export type { UiDensity, UiDensityContext };
