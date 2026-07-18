import type { InputType } from "@privaty/ui/components/types";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { HTMLInputAttributes } from "svelte/elements";

interface FieldRegistration {
  name: string;
  initialValue: unknown;
  required: boolean;
  getValue: () => unknown;
  setValue: (value: unknown) => void;
}

type TextFieldType = Extract<
  InputType,
  "text" | "email" | "password" | "search" | "url" | "tel"
>;

type TextFieldAttributes = Omit<HTMLInputAttributes, "type"> & {
  name: string;
  type?: TextFieldType;
};

/**
 * The slice of a SvelteKit remote form string field that TextInput needs.
 * Structural on purpose: tests can pass a fake, and a client-only adapter can
 * satisfy it later. Declared with method syntax — methods are checked
 * bivariantly, which lets Kit's generic `as(...)` (a union of narrow tuples)
 * satisfy this widened signature.
 */
interface TextField {
  as(type: TextFieldType, initialValue?: string): TextFieldAttributes;
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  value(): string | undefined;
  set(value: string): void;
}

export type {
  FieldRegistration,
  TextField,
  TextFieldAttributes,
  TextFieldType,
};
