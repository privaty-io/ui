/**
 * Root barrel for `@privaty/ui` — the package's ONLY public module (plus
 * the explicit testing subpath). Folder layout below is internal and free
 * to change; bundlers tree-shake the barrel.
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
} from "./inputs/calendar/calendar";
export type {
  CalendarDay,
  CalendarMonth,
  CalendarMonthOptions,
  CalendarWeek,
} from "./inputs/calendar/calendar";
export { default as DatePicker } from "./inputs/calendar/date-picker/date-picker.svelte";
export { default as MonthPicker } from "./inputs/calendar/month-picker/month-picker.svelte";
export { default as WeekPicker } from "./inputs/calendar/week-picker/week-picker.svelte";

// Controls & display
export { default as Button } from "./controls/button/button.svelte";
export { default as Checkbox } from "./inputs/checkbox/checkbox.svelte";
export { default as FieldFrame } from "./inputs/field-frame.svelte";
export { default as Input } from "./inputs/input/input.svelte";
export { default as Select } from "./inputs/select/select.svelte";
export { toSelectOptions } from "./inputs/select/select-options";
export { default as Spinner } from "./feedback/spinner/spinner.svelte";
export { default as Textarea } from "./inputs/textarea.svelte";
export type { ButtonVariant } from "./controls/button/types";
export type { InputType, LabelStyle, SelectOption } from "./inputs/types";

// Overlays
export { anchorTo, computeAnchorPosition } from "./overlays/position/position";
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
} from "./overlays/position/position";
export { default as Modal } from "./overlays/modal/modal.svelte";
export { default as Popover } from "./overlays/popover/popover.svelte";
export { default as Tooltip } from "./overlays/tooltip/tooltip.svelte";

// Configuration, theming, utilities
export { cn } from "./cn/cn";
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
  UiModalLabels,
  UiConfig,
  UiFormLabels,
  UiLabels,
  UiTableLabels,
} from "./config/types";
export { coreTheme } from "./theme";
