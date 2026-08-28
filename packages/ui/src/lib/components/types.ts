/**
 * Button's visual variants: "primary" is the filled default, "secondary" the
 * outlined alternative.
 */
type ButtonVariant = "primary" | "secondary";

/**
 * Where a field's label renders: "top" above the control, "left" inline
 * before it, "floating" inside the control box doubling as the placeholder
 * (of the shipped controls only Input; FieldFrame supports it for a
 * cooperating custom control), "hidden" visually hidden but still read by
 * screen readers.
 */
type LabelStyle = "top" | "left" | "floating" | "hidden";

/**
 * The input types this component supports: box-shaped and bindable via
 * `value`. Excluded on purpose: checkbox/radio (bind on `checked`), file
 * (binds `files`, value is read-only), color/range (not box-shaped, label
 * styles don't apply), hidden (nothing to label), button/submit/reset/image
 * (buttons, not inputs).
 */
type InputType =
  | "text"
  | "email"
  | "password"
  | "search"
  | "url"
  | "tel"
  | "number"
  | "date"
  | "datetime-local"
  | "month"
  | "time"
  | "week";

/**
 * One entry in Select's `options` list. Select also accepts a plain string
 * as shorthand for `{ value: s, label: s }`.
 */
interface SelectOption {
  /** Submitted/bound value — also keys the rendered list, so it must be
   * unique among the options. */
  value: string;
  /** Visible option text. */
  label: string;
  /** Renders the option but makes it unselectable. */
  disabled?: boolean;
}

export type { ButtonVariant, InputType, LabelStyle, SelectOption };
