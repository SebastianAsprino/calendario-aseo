import { describe, expect, test } from "bun:test";
import {
  CHORES,
  PEOPLE,
  START,
  assignmentsForWeek,
  fromDay,
  mondayOfWeek,
  toDay,
  todayDay,
  weekIndex,
  weekday,
} from "../src/lib/rotation";

/** "Persona→Tarea" por semana, para comparar de forma legible. */
const summary = (w: number) => assignmentsForWeek(w).map((a) => `${a.person.name}→${a.chore}`);

describe("rotación acordada", () => {
  test("semana 0 (desde el lunes 2026-11-02): Asprino Cocina, Gabriela Sala, Sebastian Baño", () => {
    expect(summary(0)).toEqual(["Asprino→Cocina", "Gabriela→Sala - Balcón", "Sebastian→Baño - Escaleras"]);
  });

  test("semana 1: cada uno pasa a la tarea siguiente (Asprino Sala, Gabriela Baño, Sebastian Cocina)", () => {
    expect(summary(1)).toEqual(["Asprino→Sala - Balcón", "Gabriela→Baño - Escaleras", "Sebastian→Cocina"]);
  });

  test("antes del inicio la rotación sigue hacia atrás sin romperse (semana -1 = semana 2)", () => {
    expect(summary(-1)).toEqual(summary(2));
    expect(summary(-3)).toEqual(summary(0));
  });

  test("todas las semanas (también negativas) reparten las 3 tareas: nadie repite y no falta ninguna", () => {
    for (let w = -520; w <= 520; w++) {
      const assignments = assignmentsForWeek(w);
      expect(assignments.map((a) => a.person.slug)).toEqual(PEOPLE.map((p) => p.slug));
      expect(new Set(assignments.map((a) => a.chore))).toEqual(new Set(CHORES));
    }
  });

  test("cada persona hace cada tarea exactamente una vez cada 3 semanas (reparto justo)", () => {
    for (let w = -30; w <= 30; w += 3) {
      for (let p = 0; p < PEOPLE.length; p++) {
        const chores = [0, 1, 2].map((k) => assignmentsForWeek(w + k)[p].chore);
        expect(new Set(chores)).toEqual(new Set(CHORES));
      }
    }
  });
});

describe("weekIndex: semanas de lunes a domingo", () => {
  test("bordes de la semana 0 y vecinas", () => {
    expect(weekIndex(toDay(2026, 11, 2))).toBe(0); // lunes
    expect(weekIndex(toDay(2026, 11, 8))).toBe(0); // domingo
    expect(weekIndex(toDay(2026, 11, 9))).toBe(1); // lunes siguiente
    expect(weekIndex(toDay(2026, 11, 1))).toBe(-1); // domingo anterior
  });

  test("el inicio es lunes y cada semana empieza en lunes, en un rango amplio (incluye cambios de año y bisiestos)", () => {
    expect(weekday(START)).toBe(0);
    for (let w = -600; w <= 600; w++) {
      const monday = mondayOfWeek(w);
      expect(new Date(Date.UTC(fromDay(monday).year, fromDay(monday).month - 1, fromDay(monday).day)).getUTCDay()).toBe(1);
      expect(weekIndex(monday)).toBe(w);
      expect(weekIndex(monday + 6)).toBe(w);
    }
  });

  test("toDay/fromDay son inversas", () => {
    for (let d = START - 2000; d <= START + 2000; d++) {
      const { year, month, day } = fromDay(d);
      expect(toDay(year, month, day)).toBe(d);
    }
  });
});

describe("independencia de la zona horaria", () => {
  const original = process.env.TZ;
  // Bogotá UTC-5 sin horario de verano; Kiritimati UTC+14; Santiago y Londres con horario de verano.
  const zones = ["America/Bogota", "Pacific/Kiritimati", "America/Santiago", "Europe/London", "UTC"];

  test.each(zones)("en %s weekIndex y los lunes no cambian", (zone) => {
    process.env.TZ = zone;
    try {
      expect(weekIndex(toDay(2026, 11, 2))).toBe(0);
      expect(weekIndex(toDay(2026, 11, 8))).toBe(0);
      expect(weekIndex(toDay(2026, 11, 9))).toBe(1);
      expect(weekIndex(toDay(2026, 11, 1))).toBe(-1);
      for (let w = -60; w <= 60; w++) expect(weekday(mondayOfWeek(w))).toBe(0);
    } finally {
      process.env.TZ = original;
    }
  });

  test("'hoy' es la fecha local de quien mira: el mismo instante cae en semanas distintas en Bogotá y Kiritimati", () => {
    // 2026-11-09 03:00 UTC = domingo 8 nov 22:00 en Bogotá, lunes 9 nov 17:00 en Kiritimati.
    const instant = new Date(Date.UTC(2026, 10, 9, 3, 0));
    try {
      process.env.TZ = "America/Bogota";
      expect(instant.getTimezoneOffset()).toBe(300); // confirma que el cambio de TZ tomó efecto
      expect(weekIndex(todayDay(instant))).toBe(0);

      process.env.TZ = "Pacific/Kiritimati";
      expect(instant.getTimezoneOffset()).toBe(-840);
      expect(weekIndex(todayDay(instant))).toBe(1);
    } finally {
      process.env.TZ = original;
    }
  });
});
