/**
 * Rotación semanal de aseo: única fuente de verdad para la página y los feeds .ics.
 *
 * Las fechas se manejan como "día civil" = número entero de días desde 1970-01-01
 * (aritmética UTC pura). Así un lunes sigue siendo lunes en cualquier zona horaria
 * y no hay sorpresas con horario de verano.
 */

export const PEOPLE = [
  { slug: "asprino", name: "Asprino" },
  { slug: "gabriela", name: "Gabriela" },
  { slug: "sebastian", name: "Sebastian" },
] as const;

export const CHORES = ["Cocina", "Sala - Balcón", "Baño - Escaleras"] as const;

export type Person = (typeof PEOPLE)[number];
export type Slug = Person["slug"];
export type Chore = (typeof CHORES)[number];

/** Día civil: días transcurridos desde 1970-01-01. */
export type Day = number;

export interface CivilDate {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
}

const MS_PER_DAY = 86_400_000;

export function toDay(year: number, month: number, day: number): Day {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function fromDay(d: Day): CivilDate {
  const date = new Date(d * MS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/** 0 = lunes … 6 = domingo. */
export function weekday(d: Day): number {
  // 1970-01-01 fue jueves (3 si lunes = 0).
  return mod(d + 3, 7);
}

/** Fecha local de hoy para quien mira la página (su calendario, su zona horaria). */
export function todayDay(now: Date = new Date()): Day {
  return toDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Lunes de la semana 0 de la rotación. */
export const START: Day = toDay(2026, 11, 2);

/** Módulo matemático (siempre ≥ 0, también para negativos). */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Semana de rotación a la que pertenece un día (lunes→domingo). Negativa antes del inicio. */
export function weekIndex(d: Day): number {
  return Math.floor((d - START) / 7);
}

/** Lunes de la semana w. */
export function mondayOfWeek(w: number): Day {
  return START + 7 * w;
}

/** Índice de la tarea que hace la persona p en la semana w. */
export function choreIndexFor(p: number, w: number): number {
  return mod(p + w, CHORES.length);
}

export interface Assignment {
  personIndex: number;
  person: Person;
  choreIndex: number;
  chore: Chore;
}

/** Quién hace qué en la semana w, en el orden de PEOPLE. */
export function assignmentsForWeek(w: number): Assignment[] {
  return PEOPLE.map((person, personIndex) => {
    const choreIndex = choreIndexFor(personIndex, w);
    return { personIndex, person, choreIndex, chore: CHORES[choreIndex] };
  });
}
