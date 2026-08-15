import type { InputType } from "@privaty/ui/components/types";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
  HTMLInputAttributes,
  HTMLSelectAttributes,
} from "svelte/elements";

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
  // A single signature over a tuple union mirrors Kit's exact-arity AsArgs:
  // seeded and unseeded are distinct call shapes (never an optional
  // parameter), while a single signature keeps Kit's generic return narrowed
  // by inference (overloads would compare against every field-type branch).
  as(
    ...args: [type: TextFieldType] | [type: TextFieldType, initialValue: string]
  ): TextFieldAttributes;
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  value(): string | undefined;
  set(value: string): void;
}

type NumberFieldAttributes = Omit<HTMLInputAttributes, "type"> & {
  name: string;
  type?: "number";
};

/**
 * The slice of a SvelteKit remote form number field that NumberInput needs.
 * Same structural/method-syntax reasoning as TextField.
 */
interface NumberField {
  // Same tuple-union reasoning as TextField.as.
  as(
    ...args: [type: "number"] | [type: "number", initialValue: number]
  ): NumberFieldAttributes;
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  value(): number | undefined;
  set(value: number): void;
}

type SelectFieldAttributes = Omit<
  HTMLSelectAttributes,
  "class" | "multiple"
> & {
  name: string;
};

/**
 * The slice of a SvelteKit remote form select field that SelectInput needs.
 * Same structural/method-syntax reasoning as TextField.
 */
interface SelectField {
  // Same tuple-union reasoning as TextField.as.
  as(
    ...args: [type: "select"] | [type: "select", initialValue: string]
  ): SelectFieldAttributes;
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  value(): string | undefined;
  /**
   * Typed `never` on purpose: picklist schemas make Kit type `set()` over the
   * field's literal union, which this slice cannot know. `never` is assignable
   * to every union parameter (contravariance), and the library only ever
   * passes back values the field itself produced.
   */
  set: (value: never) => void;
}

type CheckboxFieldAttributes = Omit<HTMLInputAttributes, "type"> & {
  name: string;
  type?: "checkbox";
};

/**
 * The slice of a SvelteKit remote form boolean field that CheckboxInput
 * needs. Same structural/method-syntax reasoning as TextField. Only the
 * bare call shape is declared — Kit types the two-argument form's value by
 * the field's value type, and a single boolean checkbox never uses it.
 */
interface CheckboxField {
  as(type: "checkbox"): CheckboxFieldAttributes;
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  value(): boolean | undefined;
  set: (value: boolean) => void;
}

export type {
  CheckboxField,
  CheckboxFieldAttributes,
  FieldRegistration,
  NumberField,
  NumberFieldAttributes,
  SelectField,
  SelectFieldAttributes,
  TextField,
  TextFieldAttributes,
  TextFieldType,
};
