<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import Copy from "@lucide/svelte/icons/copy";
  import Download from "@lucide/svelte/icons/download";
  import { onMount } from "svelte";
  import { GENERAL_CALENDAR_NAME, personCalendarName } from "../lib/ics";
  import { PEOPLE } from "../lib/rotation";

  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");

  const feeds = [
    { label: "General", file: "aseo.ics", calendarName: GENERAL_CALENDAR_NAME },
    ...PEOPLE.map((p) => ({ label: p.name, file: `${p.slug}.ics`, calendarName: personCalendarName(p.slug) })),
  ];

  /**
   * Dominio público (`site` en astro.config.mjs). Las suscripciones apuntan siempre ahí, aunque el
   * sitio se abra desde otra URL (preview de Cloudflare, localhost). Sin `site`, se usa el origen
   * actual al hidratar.
   */
  let origin = $state(import.meta.env.SITE ? new URL(import.meta.env.SITE).origin : "");
  let copied = $state<string | null>(null);
  let status = $state("");

  onMount(() => {
    if (!origin) origin = window.location.origin;
  });

  function linksFor(file: string, calendarName: string) {
    if (!origin) return null;
    const https = new URL(base + file, origin).href;
    const webcal = https.replace(/^https?:/, "webcal:");
    return {
      https,
      apple: webcal,
      google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
      outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(calendarName)}`,
    };
  }

  async function copy(file: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      copied = file;
      status = "URL copiada";
      setTimeout(() => {
        if (copied === file) copied = null;
      }, 2000);
    } catch {
      status = `No se pudo copiar. La URL es: ${url}`;
    }
  }

  const button =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono text-label-lg text-on-surface transition-colors hover:bg-surface-container-high aria-disabled:pointer-events-none aria-disabled:opacity-60 disabled:pointer-events-none disabled:opacity-60";
</script>

<section aria-labelledby="suscribir-titulo" class="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 sm:p-5">
  <h2 id="suscribir-titulo" class="font-mono text-headline-md">Agregar a tu calendario</h2>
  <p class="mt-1 text-body-sm text-on-surface-variant">
    Para suscribirte desde Google o Apple el sitio debe estar publicado en una URL pública (no sirve con localhost).
  </p>

  <ul class="mt-4 flex flex-col gap-3">
    {#each feeds as feed (feed.file)}
      {@const links = linksFor(feed.file, feed.calendarName)}
      <li class="rounded-lg border border-outline-variant p-3">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 class="font-mono text-headline-sm uppercase">{feed.label}</h3>
          <code class="min-w-0 truncate font-mono text-code-md text-on-surface-variant">{links?.https ?? base + feed.file}</code>
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <a class={button} href={links?.apple} aria-disabled={links ? undefined : "true"}>Apple / iOS</a>
          <a class={button} href={links?.google} target="_blank" rel="noopener noreferrer" aria-disabled={links ? undefined : "true"}>Google</a>
          <a class={button} href={links?.outlook} target="_blank" rel="noopener noreferrer" aria-disabled={links ? undefined : "true"}>Outlook</a>
          <a class={button} href={base + feed.file} download>
            <Download size={16} aria-hidden="true" />Descargar .ics
          </a>
          <button
            type="button"
            class={button}
            disabled={!links}
            onclick={() => links && copy(feed.file, links.https)}
            aria-label={`Copiar URL del calendario ${feed.label}`}
          >
            {#if copied === feed.file}
              <Check size={16} aria-hidden="true" />Copiada
            {:else}
              <Copy size={16} aria-hidden="true" />Copiar URL
            {/if}
          </button>
        </div>
      </li>
    {/each}
  </ul>
  <p class="sr-only" aria-live="polite">{status}</p>
</section>
