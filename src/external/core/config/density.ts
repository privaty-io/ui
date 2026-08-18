import { getContext, setContext } from "svelte";

type UiDensity = "comfortable" | "compact";

/**
 * Reactive read access to the ambient density. Containers (e.g. a compact
 * table) provide it with a getter so consumers track changes; controls read
 * it as their sizing default.
 */
interface UiDensityContext {
  readonly density: UiDensity;
}

const defaultUiDensity: UiDensityContext = { density: "comfortable" };

const uiDensityContextKey = Symbol("privaty-ui-density");

function setUiDensity(context: UiDensityContext): void {
  setContext<UiDensityContext>(uiDensityContextKey, context);
}

function getUiDensity(): UiDensityContext {
  return (
    getContext<UiDensityContext | undefined>(uiDensityContextKey) ??
    defaultUiDensity
  );
}

export { getUiDensity, setUiDensity };
export type { UiDensity, UiDensityContext };
