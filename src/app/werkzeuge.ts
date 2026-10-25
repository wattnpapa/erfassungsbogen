/**
 * Die Werkzeugzeile — die EINE Quelle für die Querverweise auf die Werkzeuge
 * desselben Autors, ganz unten in jeder Fußzeile.
 *
 * Zwei Fassungen entstehen daraus:
 *   - die React-Fassung in der App-Fußzeile (`Werkzeugzeile` in fusszeile.tsx),
 *   - der statische Block `<!-- WERKZEUGE:START -->` … `<!-- WERKZEUGE:END -->`
 *     in jeder Fußzeile unter `public/` (scripts/content-nav.mts).
 *
 * Alle vier stehen in fester Reihenfolge, das eigene Projekt eingeschlossen:
 * Die Zeile ist auf allen vier Seiten dieselbe. Linktext ist die Domain in
 * Kleinbuchstaben — sie sagt, wohin der Link führt, und ist zugleich der Name.
 *
 * Der Mittelpunkt ist ein eigenes Element mit `aria-hidden`, nicht Teil des
 * Links: sonst würde er mit unterstrichen, gehörte zur Trefferfläche und würde
 * vorgelesen.
 */

export interface Werkzeug {
  href: string;
  label: string;
}

export const WERKZEUGE: readonly Werkzeug[] = [
  { href: "https://erfassungsbogen.app/", label: "erfassungsbogen.app" },
  { href: "https://fmbauplaner.app/", label: "fmbauplaner.app" },
  { href: "https://nachrichtenvordruck.app/", label: "nachrichtenvordruck.app" },
  { href: "https://sprechfunk-uebung.de/", label: "sprechfunk-uebung.de" },
];

export const WERKZEUGE_TITEL = "Weitere Werkzeuge";

/** Statisches Markup für die Seiten unter public/ (ohne Laufzeit-Skript). */
export function werkzeugeHtml(): string {
  const eintraege = WERKZEUGE.map((w) => `<a href="${w.href}">${w.label}</a>`).join(
    '\n        <span class="werkzeuge-trenner" aria-hidden="true">·</span>\n        ',
  );
  return `<!-- WERKZEUGE:START -->
      <nav class="werkzeuge" aria-label="${WERKZEUGE_TITEL}">
        ${eintraege}
      </nav>
      <!-- WERKZEUGE:END -->`;
}
