/**
 * Woran sich erkennen lässt, dass Personal und Nummern eines Bogens noch aus einem Beispiel stammen (R14-E6).
 *
 * Die Beispielbögen sind als Übung gekennzeichnet und tragen erfundene Personen und Rufnummern. Wer sie als Vorlage nimmt
 * und nur „Dies ist eine Übung" abwählt, gab diese Namen und Nummern als echte Rückkanäle in Link, QR-Code und PDF weiter.
 * Beim Öffnen eines Beispiels (oder einer Datei mit gesetzter Übungsmarke, oder nach „Beispielnamen erzeugen") merkt sich
 * dieses Modul die Namen und Nummern des Bogens; beim Abwählen der Übung und in der Übersicht fragt die App, solange davon
 * noch etwas im Bogen steht.
 *
 * Neuer Speicherschlüssel: `eeb.beispiel-herkunft.v1` (JSON-Liste aus „n:nachname|vorname" und „t:ziffern", nur vom offenen
 * Bogen; verschwindet, sobald kein Bogen mehr offen ist). Bei gesperrtem Speicher fragt die App nicht.
 * Bewusst ohne Vokabular- oder Kern-Importe (Startbündel, ADR-003).
 */

import type { Erfassungsbogen } from "@bos/eeb-format/model";

export const BEISPIEL_HERKUNFT_SCHLUESSEL = "eeb.beispiel-herkunft.v1";

type B = Pick<Erfassungsbogen, "personal">;
const name = (p: { nachname: string; vorname: string }): string => [p.nachname, p.vorname].map((t) => t.trim()).filter(Boolean).join(", ");

/** Namen („n:…") und Rufnummern („t:…") des Bogens, auf die es ankommt. */
function merkmale(b: B): string[] {
  return b.personal.flatMap((p) => [
    ...(name(p) ? [`n:${name(p).toLocaleLowerCase("de-DE")}`] : []),
    ...p.kontakte.map((k) => (k.wert ?? "").replace(/\D/gu, "")).filter((z) => z.length >= 5).map((z) => `t:${z}`),
  ]);
}

function gemerkt(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(BEISPIEL_HERKUNFT_SCHLUESSEL) ?? "[]"));
  } catch {
    return new Set();
  }
}

/** Namen und Nummern dieses Bogens als „aus dem Beispiel" merken (ergänzt, was schon gemerkt ist). */
export function beispielMerken(b: B): void {
  try {
    localStorage.setItem(BEISPIEL_HERKUNFT_SCHLUESSEL, JSON.stringify([...new Set([...gemerkt(), ...merkmale(b)])]));
  } catch {
    /* gesperrt oder voll */
  }
}

/** Vergessen — der Bogen ist geschlossen, verworfen oder abgelegt. */
export function beispielVergessen(): void {
  try {
    localStorage.removeItem(BEISPIEL_HERKUNFT_SCHLUESSEL);
  } catch {
    /* nichts zu tun */
  }
}

/** Satz für Rückfrage und offenen Punkt: was von den gemerkten Namen und Nummern noch im Bogen steht; leer, wenn nichts. */
export function beispielRestText(b: B): string {
  const z = gemerkt();
  const personen = b.personal.map(name).filter((n) => n && z.has(`n:${n.toLocaleLowerCase("de-DE")}`));
  const nummern = new Set(merkmale(b).filter((m) => m.startsWith("t:") && z.has(m)));
  const teile = [
    ...(personen.length ? [`${personen.length} ${personen.length === 1 ? "Person" : "Personen"} (${personen.slice(0, 2).map((n) => `„${n}“`).join(", ")}${personen.length > 2 ? " …" : ""})`] : []),
    ...(nummern.size ? [`${nummern.size} ${nummern.size === 1 ? "Rufnummer" : "Rufnummern"}`] : []),
  ];
  return teile.length ? `${teile.join(" und ")} stammen aus einem Beispiel- oder Übungsbogen und sind vermutlich erfunden.` : "";
}

/**
 * Prüfsumme des über „Anzeigen" geöffneten, noch unveränderten Beispielbogens
 * (Prüfrunde Beispielbögen, Runde 2, BB2-D2): Bisher stand sie nur im
 * Arbeitsspeicher; nach dem Neuladen galt das Beispiel wieder als eigener
 * Entwurf, und das nächste Beispiel bot an, den echten Bogen auf dem
 * Rückholplatz „endgültig zu löschen". Gespeichert wird nur eine Zahl (FNV-1a
 * über das JSON), keine Bogendaten; der Schlüssel fällt mit „Alle Daten
 * löschen" (Präfix `eeb.`) und verschwindet, sobald kein Bogen mehr offen ist.
 */
export const BEISPIEL_OFFEN_SCHLUESSEL = "eeb.beispiel-offen.v1";

function pruefsumme(b: unknown): string {
  const s = JSON.stringify(b);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${s.length}:${h.toString(16)}`;
}

/** Dieses Beispiel ist gerade unverändert geöffnet (null: nichts mehr merken). */
export function beispielOffenMerken(b: unknown | null): void {
  try {
    if (b == null) localStorage.removeItem(BEISPIEL_OFFEN_SCHLUESSEL);
    else localStorage.setItem(BEISPIEL_OFFEN_SCHLUESSEL, pruefsumme(b));
  } catch {
    /* gesperrt: dann gilt das Beispiel wie früher als gewöhnlicher Bogen */
  }
}

/** Steht im Bogen noch genau das zuletzt über „Anzeigen" geöffnete Beispiel? */
export function istUnveraendertesBeispiel(b: unknown | null): boolean {
  if (b == null) return false;
  try {
    const gemerkt = localStorage.getItem(BEISPIEL_OFFEN_SCHLUESSEL);
    return gemerkt != null && gemerkt === pruefsumme(b);
  } catch {
    return false;
  }
}
