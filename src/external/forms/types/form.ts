import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * The slice of a SvelteKit remote form that FormState needs. Structural on
 * purpose: tests can pass a fake, and a client-only adapter can satisfy it later.
 */
interface ValidatableForm {
  validate: (options?: { all?: boolean; preflightOnly?: boolean }) => unknown;
  fields: { allIssues: () => readonly StandardSchemaV1.Issue[] | undefined };
  readonly pending: number;
}

export type { ValidatableForm };
