import Bath from "@lucide/svelte/icons/bath";
import CookingPot from "@lucide/svelte/icons/cooking-pot";
import Sofa from "@lucide/svelte/icons/sofa";
import type { Day } from "../lib/rotation";

/** Ícono por índice de tarea (mismo orden que CHORES). */
export const CHORE_ICONS = [CookingPot, Sofa, Bath];

/** Clases de chip por índice de persona (mismo orden que PEOPLE). Literales para Tailwind. */
export const PERSON_CHIP = [
  "bg-person-0 text-on-person-0",
  "bg-person-1 text-on-person-1",
  "bg-person-2 text-on-person-2",
];

const MS_PER_DAY = 86_400_000;

/** Formatea un día civil en español; timeZone UTC porque Day ya es una fecha civil. */
export function formatDay(d: Day, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es", { ...options, timeZone: "UTC" }).format(new Date(d * MS_PER_DAY));
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "2 – 8 nov 2026" (o "30 nov – 6 dic 2026"). */
export function formatWeekRange(monday: Day): string {
  const sunday = monday + 6;
  const sameMonth = formatDay(monday, { month: "short" }) === formatDay(sunday, { month: "short" });
  const start = sameMonth ? formatDay(monday, { day: "numeric" }) : formatDay(monday, { day: "numeric", month: "short" });
  return `${start} – ${formatDay(sunday, { day: "numeric", month: "short", year: "numeric" })}`;
}
