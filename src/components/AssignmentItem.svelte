<script lang="ts">
  import type { Assignment } from "../lib/rotation";
  import { CHORE_ICONS, PERSON_CHIP } from "./ui";

  interface Props {
    assignment: Assignment;
    /** Atenuado (otra persona está filtrada). */
    muted?: boolean;
    /** Resaltado (persona filtrada). */
    highlighted?: boolean;
    size?: "sm" | "lg";
  }

  let { assignment, muted = false, highlighted = false, size = "sm" }: Props = $props();
  const Icon = $derived(CHORE_ICONS[assignment.choreIndex]);
</script>

<div
  class={[
    "flex min-w-0 items-center gap-2 rounded-lg",
    size === "lg" ? "p-2" : "px-1.5 py-1",
    highlighted && "bg-surface-container-highest outline-2 outline-on-surface",
  ]}
>
  <span
    class={[
      "inline-flex shrink-0 items-center rounded-sm border px-1.5 font-mono font-bold uppercase",
      size === "lg" ? "text-label-lg" : "text-label-md",
      muted ? "border-outline-variant bg-surface-container text-on-surface-variant" : ["border-transparent", PERSON_CHIP[assignment.personIndex]],
    ]}
  >
    {assignment.person.name}
  </span>
  <span class={["flex min-w-0 items-center gap-1.5", muted ? "text-on-surface-variant" : "text-on-surface"]}>
    <Icon size={size === "lg" ? 20 : 15} aria-hidden="true" class="shrink-0" />
    <span class={["truncate", size === "lg" ? "text-body-md font-medium" : "text-body-sm"]}>{assignment.chore}</span>
  </span>
</div>
