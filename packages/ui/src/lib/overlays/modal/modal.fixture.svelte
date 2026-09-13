<script lang="ts">
  import Modal from "./modal.svelte";

  interface Props {
    title?: string;
    lightDismiss?: boolean;
  }

  const { title = "Confirm", lightDismiss }: Props = $props();

  let open = $state(false);
  export function setOpen(next: boolean) {
    open = next;
  }
  export function isOpen() {
    return open;
  }
</script>

<Modal bind:open {title} {lightDismiss}>
  {#snippet trigger(props)}
    <button data-testid="trigger" {...props}>Open modal</button>
  {/snippet}
  <p>Are you sure?</p>
  <button data-testid="confirm">Yes</button>
</Modal>
