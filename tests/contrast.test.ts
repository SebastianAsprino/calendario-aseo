/**
 * Contraste de texto (WCAG AA, ≥ 4.5:1) leído directamente de src/styles/global.css,
 * en ambos temas. Si alguien cambia un token y rompe la legibilidad, esto falla.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");

function block(selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`No se encontró ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

function tokens(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [, name, value] of text.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[name] = value;
  return out;
}

const light = tokens(block("@theme {"));
const dark = { ...light, ...tokens(block(":root.dark {")) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [texto, fondo] — todas las combinaciones de texto que usa la UI. */
const PAIRS: [string, string][] = [
  ["on-person-0", "person-0"],
  ["on-person-1", "person-1"],
  ["on-person-2", "person-2"],
  ["on-primary-fixed", "primary-container"],
  ...["surface", "surface-container-lowest", "surface-container-low", "surface-container", "surface-container-high"].flatMap(
    (bg): [string, string][] => [
      ["on-surface", bg],
      ["on-surface-variant", bg],
      ["primary", bg],
    ],
  ),
];

describe.each([
  ["claro", light],
  ["oscuro", dark],
] as const)("tema %s", (_, theme) => {
  test("el tema oscuro redefine todos los colores del claro", () => {
    expect(Object.keys(tokens(block(":root.dark {")))).toEqual(Object.keys(light));
  });

  test.each(PAIRS)("%s sobre %s ≥ 4.5:1", (fg, bg) => {
    expect(theme[fg]).toBeDefined();
    expect(theme[bg]).toBeDefined();
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
