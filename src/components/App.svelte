<script lang="ts">
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import { onMount } from "svelte";
  import { assignmentsForWeek, fromDay, mondayOfWeek, todayDay, weekIndex, type Day } from "../lib/rotation";
  import AssignmentItem from "./AssignmentItem.svelte";
  import MonthCalendar from "./MonthCalendar.svelte";
  import Subscribe from "./Subscribe.svelte";
  import { capitalize, formatDay, formatWeekRange } from "./ui";

  interface Props {
    /** Día del build: el HTML estático y la primera hidratación coinciden; al montar se usa el día local real. */
    buildDay: Day;
  }

  let { buildDay }: Props = $props();
  let today = $state(buildDay);

  onMount(() => {
    today = todayDay();
  });

  const week = $derived(weekIndex(today));
  const monday = $derived(mondayOfWeek(week));
  const thisWeek = $derived(assignmentsForWeek(week));

  function toggleTheme() {
    const root = document.documentElement;
    const dark = root.classList.toggle("dark");
    try {
      localStorage.setItem("aseo-theme", dark ? "dark" : "light");
    } catch {
      // Sin almacenamiento: el cambio vale solo para esta visita.
    }
  }
</script>

<header class="border-b border-outline-variant bg-surface-container-lowest">
  <div class="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4">
    <h1 class="flex items-center gap-2 font-mono text-headline-md">
      <span class="inline-block size-3 rounded-sm bg-primary-container ring-1 ring-on-surface" aria-hidden="true"></span>
      Aseo del depa
    </h1>
    <button
      type="button"
      onclick={toggleTheme}
      aria-label="Cambiar entre tema claro y oscuro"
      class="inline-flex size-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-high"
    >
      <Moon size={18} aria-hidden="true" class="dark:hidden" />
      <Sun size={18} aria-hidden="true" class="hidden dark:block" />
    </button>
  </div>
</header>

<main class="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-5 sm:gap-6 sm:py-8">
  <section aria-labelledby="semana-titulo" class="rounded-xl border border-on-surface bg-surface-container-lowest p-3 sm:p-5">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2 id="semana-titulo" class="font-mono text-headline-lg">Esta semana</h2>
      <p class="font-mono text-label-lg text-on-surface-variant">{formatWeekRange(monday)}</p>
    </div>

    <ol class="mt-3 grid grid-cols-7 gap-1" aria-label="Días de esta semana">
      {#each Array.from({ length: 7 }, (_, i) => monday + i) as d (d)}
        <li
          aria-current={d === today ? "date" : undefined}
          class={[
            "flex flex-col items-center rounded-sm border py-1",
            d === today ? "border-on-surface bg-primary-container text-on-primary-fixed" : "border-outline-variant text-on-surface",
          ]}
        >
          <span class="font-mono text-label-sm uppercase">{capitalize(formatDay(d, { weekday: "short" }).replace(".", ""))}</span>
          <span class="font-mono text-label-lg font-bold">{fromDay(d).day}</span>
          {#if d === today}<span class="sr-only">(hoy)</span>{/if}
        </li>
      {/each}
    </ol>

    <ul class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {#each thisWeek as a (a.personIndex)}
        <li class="rounded-lg border border-outline-variant bg-surface-container-low">
          <AssignmentItem assignment={a} size="lg" />
        </li>
      {/each}
    </ul>
  </section>

  <MonthCalendar {today} />
  <Subscribe />
</main>
