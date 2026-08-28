import type { InputType } from "#privaty/ui/components/types.js";
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
  /** Maps raw field values onto the initialValue's domain before dirty
   * comparison — Kit stores raw DOM strings mid-edit ("5", "on") while
   * registrations hold typed seeds (5, true). */
  normalize: (value: unknown) => unknown;
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

type DateFieldType = Extract<
  InputType,
  "date" | "datetime-local" | "month" | "time" | "week"
>;

type DateFieldAttributes = Omit<HTMLInputAttributes, "type"> & {
  name: string;
  type?: DateFieldType;
};

/**
 * The slice of a SvelteKit remote form date-family field that DateInput
 * needs. The whole family — date, month, week, time, datetime-local —
 * carries ISO-style string values, so one slice covers all five. Same
 * structural/method-syntax reasoning as TextField.
 */
interface DateField {
  // Same tuple-union reasoning as TextField.as.
  as(
    ...args: [type: DateFieldType] | [type: DateFieldType, initialValue: string]
  ): DateFieldAttributes;
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
  /** Raw DOM strings appear mid-edit — Kit only coerces at submit/reset. */
  value(): number | string | undefined;
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
 * needs. Same structural/method-syntax reasoning as TextField. The seeded
 * call shape matters: Kit's as("checkbox", seed) provides `checked` AND a
 * `defaultChecked` getter, which is what makes native reset restore the
 * seed — never add a separate defaultChecked attribute on top (Kit defines
 * its getter non-configurably; SSR crashes redefining it).
 */
interface CheckboxField {
  // Same tuple-union reasoning as TextField.as.
  as(
    ...args: [type: "checkbox"] | [type: "checkbox", initialValue: boolean]
  ): CheckboxFieldAttributes;
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  /** Mid-edit, Kit stores the raw DOM value ("on") or null for unchecked —
   * coercion to boolean only happens at submit/reset. */
  value(): boolean | string | null | undefined;
  set: (value: boolean) => void;
}

export type {
  CheckboxField,
  CheckboxFieldAttributes,
  DateField,
  DateFieldAttributes,
  DateFieldType,
  FieldRegistration,
  NumberField,
  NumberFieldAttributes,
  SelectField,
  SelectFieldAttributes,
  TextField,
  TextFieldAttributes,
  TextFieldType,
};
