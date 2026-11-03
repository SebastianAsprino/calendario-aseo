/**
 * Generación de feeds iCalendar (RFC 5545) a partir de rotation.ts.
 * Funciones puras: los endpoints de Astro solo envuelven el texto que devuelven.
 */
import {
  CHORES,
  PEOPLE,
  choreIndexFor,
  fromDay,
  mondayOfWeek,
  type Day,
  type Slug,
} from "./rotation";

export const ICS_CONTENT_TYPE = "text/calendar; charset=utf-8";
export const GENERAL_CALENDAR_NAME = "Aseo del depa";

/** Fijo para que el build sea reproducible. */
const DTSTAMP = "20261102T000000Z";
const UID_DOMAIN = "calendario-aseo";

/** Escapa un valor TEXT (RFC 5545 §3.3.11). */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** Pliega una línea de contenido a ≤ 75 octetos sin cortar caracteres UTF-8 (RFC 5545 §3.1). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  // La primera línea admite 75 octetos; las de continuación llevan un espacio inicial.
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function formatDate(d: Day): string {
  const { year, month, day } = fromDay(d);
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

interface EventSpec {
  uid: string;
  summary: string;
  /** Lunes de la primera ocurrencia. */
  monday: Day;
}

function buildCalendar(name: string, events: EventSpec[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//calendario-aseo//Aseo del depa//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
  ];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${DTSTAMP}`,
      `DTSTART;VALUE=DATE:${formatDate(event.monday)}`,
      // DTEND es exclusivo: el lunes siguiente cubre lunes→domingo.
      `DTEND;VALUE=DATE:${formatDate(event.monday + 7)}`,
      `RRULE:FREQ=WEEKLY;INTERVAL=${CHORES.length}`,
      `SUMMARY:${escapeText(event.summary)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Un evento por (persona, semana k de 0..2); cada uno se repite cada 3 semanas. */
function eventsFor(personIndexes: number[], summary: (personIndex: number, chore: string) => string, uidPrefix: string) {
  const events: EventSpec[] = [];
  for (const p of personIndexes) {
    for (let k = 0; k < CHORES.length; k++) {
      events.push({
        uid: `${uidPrefix}-${PEOPLE[p].slug}-${k}@${UID_DOMAIN}`,
        summary: summary(p, CHORES[choreIndexFor(p, k)]),
        monday: mondayOfWeek(k),
      });
    }
  }
  return events;
}

/** Feed general: las 3 personas, SUMMARY "Tarea · Persona". */
export function generalFeed(): string {
  return buildCalendar(
    GENERAL_CALENDAR_NAME,
    eventsFor(PEOPLE.map((_, p) => p), (p, chore) => `${chore} · ${PEOPLE[p].name}`, "aseo-general"),
  );
}

export function personCalendarName(slug: Slug): string {
  const person = PEOPLE.find((x) => x.slug === slug)!;
  return `Aseo · ${person.name}`;
}

/** Feed de una persona: solo sus tareas, SUMMARY "Aseo: Tarea". */
export function personFeed(slug: Slug): string {
  const p = PEOPLE.findIndex((x) => x.slug === slug);
  if (p < 0) throw new Error(`Persona desconocida: ${slug}`);
  return buildCalendar(personCalendarName(slug), eventsFor([p], (_, chore) => `Aseo: ${chore}`, "aseo"));
}
