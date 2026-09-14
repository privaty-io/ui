<script lang="ts">
  // The CenteredPage demo — a full page of its own, so this route
  // RESETS to the root layout (the @ in the filename): the Cellar Ops
  // shell stays behind, one centered card fills the Frame's column.
  import { resolve } from "$app/paths";
  import { Button, Checkbox, Input, Link } from "@privaty/ui";
  import { CenteredPage } from "@privaty/ui-layouts";

  let email = $state("");
  let password = $state("");
  let remember = $state(false);
</script>

<svelte:head>
  <title>Sign in — layouts sandbox</title>
</svelte:head>

<CenteredPage title="Sign in to Cellar Ops">
  <form
    class="flex flex-col gap-3"
    onsubmit={(event) => event.preventDefault()}
  >
    <Input label="Email" type="email" bind:value={email} required />
    <Input label="Password" type="password" bind:value={password} required />
    <Checkbox label="Stay signed in" bind:checked={remember} />
    <Button type="submit" class="mt-1">Sign in</Button>
  </form>
  {#snippet footer()}
    A CenteredPage demo —
    <Link href={resolve("sandbox/layouts")}>back to the dashboard</Link>
  {/snippet}
</CenteredPage>
