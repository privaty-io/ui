import type { InputType } from "@privaty/ui/components/types.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
  HTMLInputAttributes,
  HTMLSelectAttributes,
} from "svelte/elements";

/**
 * What an input hands to FormState.register, so the form can compute
 * dirtiness, pick the majority-aware required/optional marker, and restore
 * values on reset.
 */
interface FieldRegistration {
  /** The field's form name — must be unique within the form (register throws
   * on a duplicate). */
  name: string;
  /** The typed seed the field started from — the reference value for the
   * dirty comparison and the value reset restores. */
  initialValue: unknown;
  /** Whether the field is required — feeds the majority-aware
   * required/optional markers. */
  required: boolean;
  /** Reads the field's current value from the remote form. `undefined` means
   * Kit tracks no value yet, in which case initialValue stands in. */
  getValue: () => unknown;
  /** Writes a value back into the remote form field — reset uses it to
   * restore initialValue. */
  setValue: (value: unknown) => void;
  /** Maps raw field values onto the initialValue's domain before dirty
   * comparison — Kit stores raw DOM strings mid-edit ("5", "on") while
   * registrations hold typed seeds (5, true). */
  normalize: (value: unknown) => unknown;
}

/** The `type` values a text-family field can render as. */
type TextFieldType = Extract<
  InputType,
  "text" | "email" | "password" | "search" | "url" | "tel"
>;

/** The attribute bag TextField.as() returns — spread onto the <input>. */
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
  /**
   * Returns the spreadable attribute bag for the <input>, optionally seeding
   * an initial value. A single signature over a tuple union mirrors Kit's
   * exact-arity AsArgs: seeded and unseeded are distinct call shapes (never
   * an optional parameter), while a single signature keeps Kit's generic
   * return narrowed by inference (overloads would compare against every
   * field-type branch).
   */
  as(
    ...args: [type: TextFieldType] | [type: TextFieldType, initialValue: string]
  ): TextFieldAttributes;
  /** Validation issues belonging to this field, if any. */
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  /** The field's current value, or undefined when Kit tracks none. */
  value(): string | undefined;
  /** Writes a value into the field — reset uses it to restore the seed. */
  set(value: string): void;
}

/** The `type` values a date-family field can render as. */
type DateFieldType = Extract<
  InputType,
  "date" | "datetime-local" | "month" | "time" | "week"
>;

/** The attribute bag DateField.as() returns — spread onto the <input>. */
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
  /** Returns the spreadable attribute bag for the <input>, optionally seeding
   * an initial value — same tuple-union reasoning as TextField.as. */
  as(
    ...args: [type: DateFieldType] | [type: DateFieldType, initialValue: string]
  ): DateFieldAttributes;
  /** Validation issues belonging to this field, if any. */
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  /** The field's current ISO-style value, or undefined when Kit tracks none. */
  value(): string | undefined;
  /** Writes a value into the field — reset uses it to restore the seed. */
  set(value: string): void;
}

/** The attribute bag NumberField.as() returns — spread onto the <input>. */
type NumberFieldAttributes = Omit<HTMLInputAttributes, "type"> & {
  name: string;
  type?: "number";
};

/**
 * The slice of a SvelteKit remote form number field that NumberInput needs.
 * Same structural/method-syntax reasoning as TextField.
 */
interface NumberField {
  /** Returns the spreadable attribute bag for the <input>, optionally seeding
   * an initial value — same tuple-union reasoning as TextField.as. */
  as(
    ...args: [type: "number"] | [type: "number", initialValue: number]
  ): NumberFieldAttributes;
  /** Validation issues belonging to this field, if any. */
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  /** The field's current value, or undefined when Kit tracks none. Raw DOM
   * strings appear mid-edit — Kit only coerces at submit/reset. */
  value(): number | string | undefined;
  /** Writes a number into the field — reset uses it to restore the seed. */
  set(value: number): void;
}

/** The attribute bag SelectField.as() returns — spread onto the <select>. */
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
  /** Returns the spreadable attribute bag for the <select>, optionally
   * seeding an initial value — same tuple-union reasoning as TextField.as. */
  as(
    ...args: [type: "select"] | [type: "select", initialValue: string]
  ): SelectFieldAttributes;
  /** Validation issues belonging to this field, if any. */
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  /** The field's current value, or undefined when Kit tracks none. */
  value(): string | undefined;
  /**
   * Typed `never` on purpose: picklist schemas make Kit type `set()` over the
   * field's literal union, which this slice cannot know. `never` is assignable
   * to every union parameter (contravariance), and the library only ever
   * passes back values the field itself produced.
   */
  set: (value: never) => void;
}

/** The attribute bag CheckboxField.as() returns — spread onto the <input>. */
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
  /** Returns the spreadable attribute bag for the <input>, optionally seeding
   * an initial value — same tuple-union reasoning as TextField.as. */
  as(
    ...args: [type: "checkbox"] | [type: "checkbox", initialValue: boolean]
  ): CheckboxFieldAttributes;
  /** Validation issues belonging to this field, if any. */
  issues(): readonly StandardSchemaV1.Issue[] | undefined;
  /** The field's current value, or undefined when Kit tracks none. Mid-edit,
   * Kit stores the raw DOM value ("on") or null for unchecked — coercion to
   * boolean only happens at submit/reset. */
  value(): boolean | string | null | undefined;
  /** Writes a boolean into the field — reset uses it to restore the seed. */
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
