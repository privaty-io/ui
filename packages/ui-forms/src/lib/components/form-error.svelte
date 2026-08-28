<!-- @component
Form-level error list — must render inside a <Form> (throws otherwise).
Shows the configured `labels.form.generalError` line when a submission threw,
plus every validation issue without a path (e.g. from `invalid("...")` in the
handler), translated through the configured `resolveMessage`; field-level
issues render at their inputs instead. Renders nothing while there are no
messages.
-->
<script lang="ts">
  import { cn } from "@privaty/ui/cn.js";
  import { getUiConfig } from "@privaty/ui/config/context.js";
  import { getFormContext } from "../context";

  interface Props {
    /** Extra classes for the <ul> element. */
    class?: string;
  }

  const { class: classes }: Props = $props();

  const { form, state } = getFormContext();
  const config = getUiConfig();

  const messages = $derived.by(() => {
    const collected: string[] = [];

    if (state.submitError !== undefined)
      collected.push(config.labels.form.generalError);

    // Form-level issues (e.g. from `invalid("...")` in the handler) carry no
    // path; field-level issues render at their fields instead.
    for (const issue of form.fields.allIssues() ?? []) {
      if (!issue.path?.length) collected.push(config.resolveMessage(issue));
    }

    return collected;
  });
</script>

{#if messages.length}
  <ul
    class={cn("text-sm text-red-700 dark:text-red-500", classes)}
    role="alert"
  >
    {#each messages as message, index (index)}
      <li>{message}</li>
    {/each}
  </ul>
{/if}
