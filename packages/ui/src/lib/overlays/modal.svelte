<!-- @component
Modal dialog on the native `<dialog>` element — top layer, focus trapping,
and Escape come from the browser. Open it via the `trigger` snippet
(spread the props onto a `<button>`) or `bind:open`; clicking the backdrop
closes it unless `lightDismiss` is off. `title` renders the heading and
labels the dialog for assistive tech.
-->
<script lang="ts">
  import { XIcon } from "@lucide/svelte";
  import type { Snippet } from "svelte";
  import { cn } from "../cn";
  import { getUiConfig } from "../config/context";
  import { coreTheme } from "../theme";

  interface ModalTriggerProps {
    onclick: () => void;
    /** The trigger opens a dialog — announced to assistive tech. */
    "aria-haspopup": "dialog";
  }

  interface Props {
    /** Renders the trigger. Spread the given props onto a `<button>` (or a
     * component forwarding rest props). Optional — `bind:open` alone works
     * for programmatic modals (confirmations, wizards). */
    trigger?: Snippet<[ModalTriggerProps]>;
    /** Dialog content. */
    children: Snippet;

    /** Open state (bindable): set it to open/close programmatically. */
    open?: boolean;

    /** Heading text — rendered above the content and wired as the
     * dialog's accessible name. */
    title?: string;
    /** Clicking the backdrop closes the dialog (default true). Escape
     * always closes — that is the native contract. */
    lightDismiss?: boolean;

    /** Extra classes for the dialog panel. */
    class?: string;
  }

  let {
    trigger,
    children,

    open = $bindable(false),

    title,
    lightDismiss = true,

    class: classes,
  }: Props = $props();

  const config = getUiConfig();
  const titleId = $props.id();

  let dialog = $state<HTMLDialogElement>();

  // Programmatic control converges the element onto `open`; native paths
  // (Escape → cancel → close) travel back via the close event. The
  // dialog.open guard keeps the two directions from re-triggering.
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  // Backdrop clicks hit the <dialog> element itself — content clicks
  // cannot, because the padding lives on an inner wrapper (the dialog is
  // p-0), so every in-panel click targets a descendant.
  function onclick(event: MouseEvent) {
    if (lightDismiss && event.target === dialog) dialog?.close();
  }
</script>

{#if trigger}
  {@render trigger({ onclick: () => (open = true), "aria-haspopup": "dialog" })}
{/if}

<dialog
  bind:this={dialog}
  aria-labelledby={title !== undefined ? titleId : undefined}
  class={cn(coreTheme.modal.panel, classes)}
  onclose={() => (open = false)}
  {onclick}
>
  <div class={coreTheme.modal.inner}>
    <div class="flex items-start justify-between gap-4">
      {#if title !== undefined}
        <h2 id={titleId} class={coreTheme.modal.title}>{title}</h2>
      {/if}
      <button
        type="button"
        class={cn(coreTheme.modal.closeButton, "ml-auto")}
        onclick={() => dialog?.close()}
      >
        <XIcon class="size-4" aria-hidden="true" />
        <span class="sr-only">{config.labels.modal.close}</span>
      </button>
    </div>
    {@render children()}
  </div>
</dialog>
