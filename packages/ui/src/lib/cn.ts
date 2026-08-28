import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Builds a class string: clsx flattens and conditionalizes the inputs, then
 * tailwind-merge resolves conflicting Tailwind utilities — later classes win.
 * Use it wherever consumer `class` overrides meet component defaults.
 */
export function cn(...args: ClassValue[]) {
  return twMerge(clsx(...args));
}
