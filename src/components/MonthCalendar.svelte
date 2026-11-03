<script lang="ts">
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { PEOPLE, assignmentsForWeek, fromDay, mondayOfWeek, toDay, weekIndex, weekday, type Day } from "../lib/rotation";
  import AssignmentItem from "./AssignmentItem.svelte";
  import { capitalize, formatDay, formatWeekRange } from "./ui";

  interface Props {
    today: Day;
  }

  let { today }: Props = $props();

  /** Meses desplazados respecto al mes de hoy (0 = mes actual). */
  let monthOffset = $state(0);
  /** Índice de persona filtrada, o null para "Todos". */
  let filter = $state<number | null>(null);

  const view = $derived.by(() => {
    const t = fromDay(today);
    const total = t.year * 12 + (t.month - 1) + monthOffset;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
  });

  const monthTitle = $derived(capitalize(formatDay(toDay(view.year, view.month, 1), { month: "long", year: "numeric" })));

  const weeks = $derived.by(() => {
    const first = toDay(view.year, view.month, 1);
    const last = toDay(view.year, view.month + 1, 1) - 1;
    const result = [];
    for (let w = weekIndex(first); w <= weekIndex(last); w++) {
      const monday = mondayOfWeek(w);
      result.push({ w, monday, days: Array.from({ length: 7 }, (_, i) => monday + i), assignments: assignmentsForWeek(w) });
    }
    return result;
  });

  const currentWeek = $derived(weekIndex(today));

  // Nombres de días desde un lunes cualquiera (2026-11-02).
  const weekdayNames = Array.from({ length: 7 }, (_, i) => {
    const d = toDay(2026, 11, 2) + i;
    return { short: capitalize(formatDay(d, { weekday: "short" }).replace(".", "")), long: formatDay(d, { weekday: "long" }) };
  });

  const navButton =
    "inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-mono text-label-lg text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60 disabled:hover:bg-surface-container-lowest";
</script>

<section aria-labelledby="calendario-titulo" class="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 sm:p-5">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h2 id="calendario-titulo" class="font-mono text-headline-md" aria-live="polite">{monthTitle}</h2>
    <div class="flex items-center gap-2">
      <button type="button" class={navButton} onclick={() => monthOffset--} aria-label="Mes anterior">
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button type="button" class={navButton} onclick={() => (monthOffset = 0)} disabled={monthOffset === 0}>Hoy</button>
      <button type="button" class={navButton} onclick={() => monthOffset++} aria-label="Mes siguiente">
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  </div>

  <div class="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Resaltar persona">
    <span class="font-mono text-label-md text-on-surface-variant uppercase">Resaltar</span>
    {#each [null, 0, 1, 2] as option (option)}
      <button
        type="button"
        aria-pressed={filter === option}
        onclick={() => (filter = option)}
        class={[
          "rounded-sm border px-2 py-1 font-mono text-label-md uppercase transition-colors",
          filter === option
            ? "border-on-surface bg-on-surface text-surface"
            : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high",
        ]}
      >
        {option === null ? "Todos" : PEOPLE[option].name}
      </button>
    {/each}
  </div>

  <div class="mt-4 grid grid-cols-7 border-b border-outline-variant pb-1" aria-hidden="true">
    {#each weekdayNames as name (name.long)}
      <span class="text-center font-mono text-label-md text-on-surface-variant uppercase">{name.short}</span>
    {/each}
  </div>

  <ol class="mt-2 flex flex-col gap-2">
    {#each weeks as week (week.w)}
      {@const isCurrent = week.w === currentWeek}
      <li
        aria-label={`Semana del ${formatWeekRange(week.monday)}${isCurrent ? " (esta semana)" : ""}`}
        aria-current={isCurrent ? "true" : undefined}
        class={[
          "rounded-lg border p-1.5",
          isCurrent ? "border-on-surface border-l-4 border-l-primary-container bg-surface-container-low" : "border-outline-variant",
        ]}
      >
        <div class="grid grid-cols-7">
          {#each week.days as d, i (d)}
            {@const date = fromDay(d)}
            {@const inMonth = date.month === view.month}
            <span
              class="flex justify-center py-0.5"
              aria-label={`${weekdayNames[i].long} ${date.day}`}
              aria-current={d === today ? "date" : undefined}
            >
              <span
                class={[
                  "inline-flex h-7 min-w-7 items-center justify-center rounded-sm px-1 font-mono text-label-lg",
                  d === today
                    ? "bg-primary-container font-bold text-on-primary-fixed"
                    : inMonth
                      ? "text-on-surface"
                      : "text-on-surface-variant opacity-70",
                ]}
              >
                {date.day}
              </span>
            </span>
          {/each}
        </div>
        {#if isCurrent}
          <p class="mt-1 px-1.5 font-mono text-label-sm text-on-surface uppercase">Esta semana</p>
        {/if}
        <ul class="mt-1 grid grid-cols-1 gap-0.5 sm:grid-cols-3 sm:gap-1">
          {#each week.assignments as a (a.personIndex)}
            <li>
              <AssignmentItem
                assignment={a}
                highlighted={filter === a.personIndex}
                muted={filter !== null && filter !== a.personIndex}
              />
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ol>
  <p class="mt-3 text-body-sm text-on-surface-variant">La rotación empieza el lunes 2 de noviembre de 2026 y cambia cada lunes.</p>
</section>
