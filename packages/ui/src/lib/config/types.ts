import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Maps a Standard Schema validation issue to the string shown to the user.
 * The default returns `issue.message` unchanged; override it to localize or
 * rewrite validation messages centrally.
 */
type MessageResolver = (issue: StandardSchemaV1.Issue) => string;

/** User-facing strings the form components render. */
interface UiFormLabels {
  /** The "(optional)" minority marker. */
  optional: string;
  /** The "*" minority marker. */
  required: string;
  /** Fallback when a submit throws. */
  generalError: string;

  /** Default Submit button label. */
  submit: string;
  /** Default Reset button label. */
  reset: string;
}

/** User-facing strings the table components render. */
interface UiTableLabels {
  /** Actions column header (sr-only when the Add button shows). */
  actions: string;

  /** Default Edit button on display rows. */
  edit: string;
  /** Default Delete button on display rows. */
  delete: string;
  /** Submit label while editing a row. */
  save: string;
  /** Submit label on the create row + the header Add button. */
  add: string;
  /** Leave the active editor. */
  cancel: string;

  /** Filler-row message when the table has no rows. */
  empty: string;
  /** The row expander toggle. */
  expand: string;
  /** Screen-reader text on the loading veil (`role="status"`). */
  loading: string;
}

/** User-facing strings the calendar pickers render. */
interface UiCalendarLabels {
  /** Previous/next month navigation (DatePicker, WeekPicker). */
  previousMonth: string;
  nextMonth: string;
  /** Previous/next year navigation (MonthPicker). */
  previousYear: string;
  nextYear: string;
  /** Header of the ISO week-number column (kept short). */
  week: string;
  /** Accessible names of the header month/year dropdowns. */
  month: string;
  year: string;
  /** Accessible name of the picker inputs' calendar trigger button. */
  open: string;
}

/** All label groups, one per component family. */
interface UiLabels {
  /** Strings the form components render. */
  form: UiFormLabels;
  /** Strings the table components render. */
  table: UiTableLabels;
  /** Strings the calendar pickers render. */
  calendar: UiCalendarLabels;
}

/**
 * The resolved UI configuration components read from context — see
 * setUiConfig/getUiConfig in ./context.
 */
interface UiConfig {
  /** BCP 47 locale for anything language-shaped beyond the label strings —
   * calendar month/weekday names, first day of week (see the calendar
   * engine). Undefined = the runtime's default locale. */
  locale?: string;

  /** Turns a validation issue into the message shown to the user. */
  resolveMessage: MessageResolver;
  /** All user-facing strings the components render. */
  labels: UiLabels;
}

/**
 * The override shape setUiConfig accepts: every top-level key is optional,
 * and each label group is independently partial — provide only the strings
 * you want to change.
 */
type PartialUiConfig = Partial<Omit<UiConfig, "labels">> & {
  labels?: {
    form?: Partial<UiFormLabels>;
    table?: Partial<UiTableLabels>;
    calendar?: Partial<UiCalendarLabels>;
  };
};

export type {
  MessageResolver,
  PartialUiConfig,
  UiCalendarLabels,
  UiConfig,
  UiFormLabels,
  UiLabels,
  UiTableLabels,
};
