/**
 * Root barrel for `@privaty/ui`. Every export here is also reachable via
 * its deep subpath (e.g. `@privaty/ui/components/button.svelte`) — pick
 * whichever import style reads better; bundlers tree-shake both.
 */

// Calendar engine
export {
  addMonths,
  calendarMonth,
  daysInMonth,
  firstDayOfWeek,
  formatIsoDate,
  formatIsoWeek,
  isoWeek,
  monthNames,
  parseIsoDate,
  weekdayNames,
} from "./calendar/calendar";
export type {
  CalendarDay,
  CalendarMonth,
  CalendarMonthOptions,
  CalendarWeek,
} from "./calendar/calendar";
export { default as DatePicker } from "./calendar/date-picker.svelte";
export { default as MonthPicker } from "./calendar/month-picker.svelte";
export { default as WeekPicker } from "./calendar/week-picker.svelte";

// Components
export { default as Button } from "./components/button.svelte";
export { default as Checkbox } from "./components/checkbox.svelte";
export { default as FieldFrame } from "./components/field-frame.svelte";
export { default as Input } from "./components/input.svelte";
export { default as Select } from "./components/select.svelte";
export { toSelectOptions } from "./components/select-options";
export { default as Spinner } from "./components/spinner.svelte";
export { default as Textarea } from "./components/textarea.svelte";
export type {
  ButtonVariant,
  InputType,
  LabelStyle,
  SelectOption,
} from "./components/types";

// Overlays
export { anchorTo, computeAnchorPosition } from "./overlays/position";
export type {
  Alignment,
  AnchorPosition,
  AnchorPositionOptions,
  AnchorRect,
  AnchorSize,
  AnchorToOptions,
  ComputeAnchorPositionInput,
  Placement,
  Side,
} from "./overlays/position";
export { default as Popover } from "./overlays/popover.svelte";
export { default as Tooltip } from "./overlays/tooltip.svelte";

// Configuration, theming, utilities
export { cn } from "./cn";
export {
  defaultUiConfig,
  getUiConfig,
  mergeUiConfig,
  setUiConfig,
} from "./config/context";
export { getUiDensity, setUiDensity } from "./config/density";
export type { UiDensity, UiDensityContext } from "./config/density";
export type {
  MessageResolver,
  PartialUiConfig,
  UiCalendarLabels,
  UiConfig,
  UiFormLabels,
  UiLabels,
  UiTableLabels,
} from "./config/types";
export { coreTheme } from "./theme";
