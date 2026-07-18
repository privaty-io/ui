<script lang="ts">
  import Input from "@privaty/ui/components/input.svelte";

  let query = $state("");
</script>

<main class="mx-auto flex w-full max-w-md flex-col gap-10 py-8">
  <h1 class="text-2xl font-medium">Core input variants</h1>

  <section class="flex flex-col gap-4">
    <h2 class="text-lg font-medium">Label styles</h2>

    <Input label="Top label (default)" />
    <Input label="Left label" labelStyle="left" />
    <Input
      label="Hidden label"
      labelStyle="hidden"
      placeholder="Label is screen-reader only"
    />
    <Input label="Floating label" labelStyle="floating" />
    <Input
      label="Floating, seeded"
      labelStyle="floating"
      value="Stays floated without focus"
    />
  </section>

  <section class="flex flex-col gap-4">
    <h2 class="text-lg font-medium">States</h2>

    <Input label="With marker" marker="(optional)" />
    <Input
      label="With errors"
      errors={["Too short.", "Needs a number."]}
      value="abc"
    />
    <Input
      label="Floating with errors"
      labelStyle="floating"
      errors={["Already taken."]}
      value="lukas"
    />
    <Input label="Disabled" disabled value="Can't touch this" />
    <Input label="Readonly" readonly value="Look, don't type" />
    <Input label="Password" type="password" value="hunter2" />
  </section>

  <section class="flex flex-col gap-4">
    <h2 class="text-lg font-medium">Standalone usage (bind:value)</h2>

    <Input
      label="Search"
      labelStyle="floating"
      type="search"
      bind:value={query}
    />
    <p class="text-sm text-stone-500">Query: {query || "(empty)"}</p>
  </section>
</main>
