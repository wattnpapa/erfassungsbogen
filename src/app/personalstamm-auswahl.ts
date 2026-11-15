/**
 * Auswahl aus dem lokalen Personalstamm (personalstamm.ts): Suche, Filter nach Teileinheit und Qualifikation,
 * und die Umsetzung einer Stamm-Person in eine Person des Bogens. Reine Funktionen; die Oberfläche steht in
 * personalstamm-ui.tsx. Nur nachgeladen.
 */

import { Ernaehrung, Fahrerlaubnis, type OrganisationsTyp, type Person } from "@bos/eeb-format/model";
import { FE_EINGESCHLOSSEN, FE_TEXT, neuePerson, vokabularFuer } from "./hilfen";
import { kontaktAusNummer } from "./personal-schnell";
import type { StammPerson } from "./personalstamm";

const klein = (s: string) => s.trim().toLowerCase();

/** Name zum Vergleichen mit den Personen eines Bogens (wie vorlage-nachzuegler.ts). */
export function namensSchluessel(p: Pick<StammPerson, "vorname" | "nachname">): string {
  return `${klein(p.vorname)}|${klein(p.nachname)}`;
}

/** „Meier, Anna" — Nachname zuerst, wie die Liste sortiert ist. */
export function stammName(p: Pick<StammPerson, "vorname" | "nachname">): string {
  return [p.nachname.trim(), p.vorname.trim()].filter(Boolean).join(", ") || "(ohne Name)";
}

/** Zweite Zeile einer Person in der Auswahl: Funktion, Teileinheit, Fahrerlaubnis, Qualifikationen. */
export function stammZusatz(p: StammPerson): string {
  return [
    p.funktion,
    p.teileinheit,
    p.fahrerlaubnisse.length > 0 ? `Kf ${p.fahrerlaubnisse.map((k) => FE_TEXT[k]).join("+")}` : "",
    ...p.qualifikationen,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Sortiert nach Nachname, dann Vorname — unabhängig von der Reihenfolge der Datei. */
export function stammSortiert(personen: readonly StammPerson[]): StammPerson[] {
  return [...personen].sort(
    (a, b) => a.nachname.localeCompare(b.nachname, "de") || a.vorname.localeCompare(b.vorname, "de"),
  );
}

/** Alle Teileinheiten des Stamms, alphabetisch. */
export function stammTeileinheiten(personen: readonly StammPerson[]): string[] {
  const menge = new Map<string, string>();
  for (const p of personen) if (p.teileinheit) menge.set(klein(p.teileinheit), menge.get(klein(p.teileinheit)) ?? p.teileinheit);
  return [...menge.values()].sort((a, b) => a.localeCompare(b, "de", { numeric: true }));
}

/** Filterwert „Kraftfahrer ab Klasse …" — keine Qualifikation der Liste, aber dieselbe Frage („wer darf den LKW fahren?"). */
export const KF_FILTER: ReadonlyArray<readonly [string, Fahrerlaubnis]> = [
  ["Kf B", Fahrerlaubnis.B],
  ["Kf BE", Fahrerlaubnis.BE],
  ["Kf C1", Fahrerlaubnis.C1],
  ["Kf C", Fahrerlaubnis.C],
  ["Kf CE", Fahrerlaubnis.CE],
];

/** Alle Qualifikationen des Stamms, alphabetisch; davor die Kraftfahrer-Filter, für die es jemanden gibt. */
export function stammQualifikationen(personen: readonly StammPerson[]): string[] {
  const menge = new Map<string, string>();
  for (const p of personen) for (const q of p.qualifikationen) menge.set(klein(q), menge.get(klein(q)) ?? q);
  const kf = KF_FILTER.filter(([, klasse]) => personen.some((p) => hatKlasse(p, klasse))).map(([text]) => text);
  return [...kf, ...[...menge.values()].sort((a, b) => a.localeCompare(b, "de", { numeric: true }))];
}

/** Besitzt die Person die Klasse — auch eingeschlossen (wer CE hat, ist ein Treffer für „Kf B")? */
function hatKlasse(p: StammPerson, klasse: Fahrerlaubnis): boolean {
  return p.fahrerlaubnisse.some((k) => FE_EINGESCHLOSSEN[k].includes(klasse));
}

export interface StammFilter {
  /** Suchtext: jedes Wort muss in Name, Funktion, Teileinheit oder einer Qualifikation vorkommen. */
  suche: string;
  /** Genau diese Teileinheit; leer = alle. */
  teileinheit: string;
  /** Diese Qualifikation oder ein Kraftfahrer-Filter („Kf C"); leer = alle. */
  qualifikation: string;
}

export function stammPasst(p: StammPerson, f: StammFilter): boolean {
  if (f.teileinheit && klein(p.teileinheit ?? "") !== klein(f.teileinheit)) return false;
  if (f.qualifikation) {
    const kf = KF_FILTER.find(([text]) => text === f.qualifikation);
    if (kf ? !hatKlasse(p, kf[1]) : !p.qualifikationen.some((q) => klein(q) === klein(f.qualifikation))) return false;
  }
  const woerter = klein(f.suche).split(/\s+/).filter(Boolean);
  if (woerter.length === 0) return true;
  const heu = klein([p.nachname, p.vorname, p.funktion ?? "", p.teileinheit ?? "", ...p.qualifikationen].join(" "));
  return woerter.every((w) => heu.includes(w));
}

/**
 * Stamm-Person → Person eines Bogens der Organisation `org`. Die Funktion wird im Vokabular der Organisation
 * gesucht (Kürzel oder Name) und sonst als Freitext übernommen; Qualifikationen sind Freitext wie im
 * Personalschritt. Fehlen Geschlecht oder Ernährung im Stamm, gilt die Vorgabe eines neuen Eintrags — der Hinweis
 * „Geschlecht prüfen" des Personalschritts greift dann wie bei jeder von Hand angelegten Person.
 */
export function stammPersonAlsPerson(sp: StammPerson, org: OrganisationsTyp): Person {
  const p = { ...neuePerson(), vorname: sp.vorname.trim(), nachname: sp.nachname.trim(), staerkeRolle: sp.rolle };
  if (sp.funktion) {
    const gesucht = klein(sp.funktion);
    const treffer = vokabularFuer(org, "funktion").find((v) => klein(v.kurz ?? "") === gesucht || klein(v.name) === gesucht);
    p.funktionen = [treffer ? { code: treffer.code } : { freitext: sp.funktion.trim() }];
  }
  const [haupt, ...weitere] = sp.fahrerlaubnisse;
  if (haupt != null) p.fahrerlaubnis = haupt;
  if (weitere.length > 0) p.weitereFahrerlaubnisse = weitere;
  p.zusatzqualifikationen = sp.qualifikationen.map((q) => ({ freitext: q }));
  const kontakt = sp.mobil ? kontaktAusNummer(sp.mobil) : null;
  if (kontakt) p.kontakte = [kontakt];
  if (sp.geschlecht != null) p.geschlecht = sp.geschlecht;
  p.ernaehrung = sp.ernaehrung ?? Ernaehrung.FLEISCH;
  return p;
}
