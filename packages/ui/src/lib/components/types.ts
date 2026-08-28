type ButtonVariant = "primary" | "secondary";

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

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type { ButtonVariant, InputType, LabelStyle, SelectOption };
