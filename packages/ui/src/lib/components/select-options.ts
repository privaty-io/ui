import type { SelectOption } from "./types";

/**
 * Builds a Select/SelectInput `options` array from an array of anything —
 * the glue between remote data and a select:
 *
 * ```svelte
 * <SelectInput
 *   field={form.fields.category}
 *   label="Category"
 *   options={toSelectOptions(categoriesQuery.current, {
 *     value: (category) => category.id,
 *     label: (category) => category.name,
 *   })}
 * />
 * ```
 *
 * `items` tolerates undefined and null (a query's `current` before the
 * fetch lands) and yields `[]` — pairing with the un-awaited-handle
 * recipe in the tables README. `label` falls back to the stringified
 * value; `disabled` marks options rendered-but-unselectable.
 */
function toSelectOptions<Item>(
  items: readonly Item[] | null | undefined,
  by: {
    /** The submitted value — must be unique among the options. */
    value: (item: Item) => string | number;
    /** Visible option text; defaults to the stringified value. */
    label?: (item: Item) => string;
    /** Renders the option but makes it unselectable. */
    disabled?: (item: Item) => boolean;
  },
): SelectOption[] {
  return (items ?? []).map((item) => {
    const value = String(by.value(item));
    return {
      value,
      label: by.label ? by.label(item) : value,
      disabled: by.disabled?.(item),
    };
  });
}

export { toSelectOptions };
