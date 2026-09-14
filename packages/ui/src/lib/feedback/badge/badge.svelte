<!-- @component
A status chip — a count in a pane title, "3 pending", a QA flag. Tones
keep muted backgrounds so the TEXT carries the meaning: color is never
the only signal.
-->
<script lang="ts" module>
  /** The badge's semantic tone — neutral unless the status genuinely is
   * good ("positive"), needs an eye ("warning"), or is wrong
   * ("critical"). */
  export type BadgeTone = "neutral" | "positive" | "warning" | "critical";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";

  interface Props {
    children: Snippet;
    /** Semantic tone — defaults to neutral. */
    tone?: BadgeTone;
    /** Extra classes for the chip. */
    class?: string;
  }

  const { children, tone = "neutral", class: classes }: Props = $props();
</script>

<span class={cn(coreTheme.badge.base, coreTheme.badge.tones[tone], classes)}>
  {@render children()}
</span>
