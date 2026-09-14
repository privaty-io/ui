import { getContext, setContext } from "svelte";

/**
 * The nav-state contract compact-aware nav pieces read (NavItem hides
 * its label, NavList its footer). Provide it with a reactive GETTER so
 * a changing value propagates — the same convention as the core density
 * context. SidebarPage provides it for its nav pane; anything else
 * composing a compact nav can provide it too.
 */
export interface NavContext {
  /** True while the nav is in its compact, icon-only state. */
  readonly compact: boolean;
}

const key = Symbol("privaty-ui-layouts-nav");

export function setNavContext(context: NavContext) {
  setContext(key, context);
}

/** Outside any provider the nav is simply not compact. */
export function getNavContext(): NavContext {
  return getContext<NavContext | undefined>(key) ?? { compact: false };
}
