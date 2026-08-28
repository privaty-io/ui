import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * The slice of a SvelteKit remote form that FormState needs. Structural on
 * purpose: tests can pass a fake, and a client-only adapter can satisfy it later.
 */
interface ValidatableForm {
  /**
   * Kit's programmatic validation. `all: true` also surfaces issues on fields
   * not yet edited and blurred; `preflightOnly: true` runs only the
   * client-side preflight schema (no server round-trip). Typed `unknown`
   * rather than `Promise<void>` so a fake may return synchronously — callers
   * wrap the result in Promise.resolve.
   */
  validate: (options?: { all?: boolean; preflightOnly?: boolean }) => unknown;
  /** Root issue accessor: validation issues for the whole form — form-level
   * (path-less) and field-level alike — if any. */
  fields: { allIssues: () => readonly StandardSchemaV1.Issue[] | undefined };
  /** The number of pending submissions — isSubmitting derives from it being
   * greater than zero. */
  readonly pending: number;
}

export type { ValidatableForm };
