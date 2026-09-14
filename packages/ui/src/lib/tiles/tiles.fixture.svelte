<script lang="ts">
  // Shared fixture for the tile-family behavior specs: a canvas holding
  // a normal tile, a still tile, and a flush tile.
  import { createRawSnippet } from "svelte";
  import Tile from "./tile/tile.svelte";
  import TileCanvas from "./tile-canvas/tile-canvas.svelte";
  import TileTitle from "./tile-title/tile-title.svelte";

  const counter = createRawSnippet(() => ({
    render: () => `<span data-testid="title-action">3</span>`,
  }));
</script>

<TileCanvas class="flex flex-col" data-testid="canvas">
  <Tile label="Interactive" data-testid="interactive">
    <TileTitle title="Interactive" actions={counter} />
    <input aria-label="Inside" />
  </Tile>
  <Tile still label="Static" data-testid="static">status</Tile>
  <Tile flush label="Flush" data-testid="flush">edge to edge</Tile>
</TileCanvas>
