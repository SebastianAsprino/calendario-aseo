/**
 * Los feeds .ics deben decir exactamente lo mismo que la página (rotation.ts).
 * Se parsean con ical.js —un lector independiente— y se expanden las recurrencias.
 */
import { describe, expect, test } from "bun:test";
import ICAL from "ical.js";
import { escapeText, foldLine, generalFeed, personFeed } from "../src/lib/ics";
import { CHORES, PEOPLE, assignmentsForWeek, toDay, weekIndex, weekday } from "../src/lib/rotation";

const WEEKS = 40;

interface Occurrence {
  week: number;
  summary: string;
}

// Nota: occurrences() usa expect, así que solo se llama dentro de test() (bun ignora expect fuera de un test).

/** Expande todas las ocurrencias de las semanas 0..WEEKS-1 y valida que cada una sea lunes→domingo, todo el día. */
function occurrences(ics: string): Occurrence[] {
  const vcalendar = new ICAL.Component(ICAL.parse(ics));
  const out: Occurrence[] = [];
  for (const vevent of vcalendar.getAllSubcomponents("vevent")) {
    const event = new ICAL.Event(vevent);
    expect(event.startDate.isDate).toBe(true);
    expect(event.endDate.isDate).toBe(true);
    const it = event.iterator();
    for (let next = it.next(); next; next = it.next()) {
      const start = toDay(next.year, next.month, next.day);
      const week = weekIndex(start);
      if (week >= WEEKS) break;
      expect(weekday(start)).toBe(0); // empieza en lunes
      const end = next.clone();
      end.addDuration(event.duration);
      expect(toDay(end.year, end.month, end.day) - start).toBe(7); // DTEND exclusivo = lunes siguiente
      out.push({ week, summary: event.summary });
    }
  }
  return out;
}

function byWeek(list: Occurrence[]): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const o of list) map.set(o.week, [...(map.get(o.week) ?? []), o.summary]);
  return map;
}

describe("feed general ↔ página", () => {
  test(`cada semana 0..${WEEKS - 1} tiene exactamente las 3 asignaciones de assignmentsForWeek`, () => {
    const weeks = byWeek(occurrences(generalFeed()));
    expect([...weeks.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: WEEKS }, (_, w) => w));
    for (let w = 0; w < WEEKS; w++) {
      const fromFeed = weeks.get(w)!.map((s) => {
        const [chore, person] = s.split(" · ");
        return `${person}→${chore}`;
      });
      const fromPage = assignmentsForWeek(w).map((a) => `${a.person.name}→${a.chore}`);
      expect(fromFeed.sort()).toEqual(fromPage.sort());
    }
  });
});

describe.each(PEOPLE.map((p, i) => [p.slug, i] as const))("feed de %s ↔ página", (slug, p) => {
  test("una sola tarea por semana y es la que muestra la página", () => {
    const weeks = byWeek(occurrences(personFeed(slug)));
    for (let w = 0; w < WEEKS; w++) {
      expect(weeks.get(w)).toEqual([`Aseo: ${assignmentsForWeek(w)[p].chore}`]);
    }
  });
});

describe("formato RFC 5545", () => {
  const feeds: Record<string, string> = {
    general: generalFeed(),
    ...Object.fromEntries(PEOPLE.map((p) => [p.slug, personFeed(p.slug)])),
  };

  test.each(Object.entries(feeds))("%s: CRLF, ninguna línea > 75 octetos, cabecera completa", (_, ics) => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/); // sin LF/CR sueltos
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    for (const header of ["VERSION:2.0", "PRODID:", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:"]) {
      expect(ics).toContain(`\r\n${header}`);
    }
  });

  test("UIDs únicos dentro de cada feed y estables entre builds", () => {
    for (const ics of Object.values(feeds)) {
      const uids = ics.match(/^UID:.*$/gm)!;
      expect(new Set(uids).size).toBe(uids.length);
    }
    expect(generalFeed()).toBe(feeds.general); // determinista (DTSTAMP fijo)
    expect(personFeed("asprino")).toContain("UID:aseo-asprino-0@calendario-aseo");
  });

  test("feed general: 9 eventos (3 personas × 3 semanas base); por persona: 3", () => {
    expect(feeds.general.match(/BEGIN:VEVENT/g)).toHaveLength(PEOPLE.length * CHORES.length);
    for (const p of PEOPLE) expect(feeds[p.slug].match(/BEGIN:VEVENT/g)).toHaveLength(CHORES.length);
  });

  test("texto con , ; \\ saltos de línea y tildes sobrevive el escape y el plegado (lo lee igual ical.js)", () => {
    const weird = "Baño, sala; patio \\ terraza\nsegunda línea — ".repeat(5);
    const line = foldLine(`SUMMARY:${escapeText(weird)}`);
    for (const part of line.split("\r\n")) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    const ics = ["BEGIN:VCALENDAR", "BEGIN:VEVENT", line, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    const vevent = new ICAL.Component(ICAL.parse(ics)).getFirstSubcomponent("vevent")!;
    expect(vevent.getFirstPropertyValue("summary")).toBe(weird);
  });

  test("escape TEXT exacto (ical.js tolera comas sin escapar en SUMMARY; otros lectores no)", () => {
    expect(escapeText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });
});
