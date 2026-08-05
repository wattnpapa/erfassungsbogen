/**
 * Suchen, Filtern und Sortieren der Einheitenliste eines Einsatzes.
 *
 * Bei einer Großlage meldet sich ein Meldekopf 30–50 Einheiten in eine Liste;
 * fest alphabetisch und ungefiltert ist die dann nicht mehr zu überblicken.
 * Hier liegt die reine Logik dazu (kein React, keine Persistenz), damit die
 * Trefferregeln unit-getestet sind:
 *
 *  - SUCHE: alle Wörter müssen treffen (UND), Groß/Klein und Akzente egal.
 *    Gesucht wird über das, was auf der Karte bzw. im Funkverkehr steht —
 *    Einheit, Organisation, Ort/Zugehörigkeit, Zug- und Teil-Etikett,
 *    Kennzeichen und Funkrufname. Nicht über Personennamen: die Liste ist eine
 *    Einheitenliste, und die Namen stehen ausgeklappt in den Details.
 *  - QUALIFIKATION: „welche Einheit hat mir Atemschutzgeräteträger gemeldet?"
 *    Filtert auf Einheiten mit mindestens einer passenden Person und nennt
 *    deren Namen. Fahrerlaubnisklassen zählen als Qualifikation mit („Kf CE"),
 *    inklusive der eingeschlossenen Klassen. Siehe {@link qualifikationenImEinsatz}.
 *  - SORTIERUNG: umschaltbar, immer mit dem Anzeigenamen als letztem
 *    Vergleich, damit die Reihenfolge bei Gleichstand stabil bleibt.
 *
 * Alles davon betrifft NUR die Darstellung der Liste — die Summen des Einsatzes
 * (auswertung.ts) rechnen unverändert über alle anwesenden Einheiten.
 */

import { OrganisationsTyp, alleFahrerlaubnisse, type Person } from "../model";
import type { MeldeEintrag } from "./einsaetze";
import { FE_EINGESCHLOSSEN, FE_TEXT, einheitAnzeigename, einheitOrt, funkrufText, kennzeichenText, orgLabel, vokabularFuer } from "./hilfen";

export type EinheitenSortierung = "name" | "eintreffzeit" | "zug" | "organisation";

export const SORTIERUNGEN: { wert: EinheitenSortierung; label: string }[] = [
  { wert: "name", label: "Name (A–Z)" },
  { wert: "eintreffzeit", label: "Eintreffzeit (neueste zuerst)" },
  { wert: "zug", label: "Zug" },
  { wert: "organisation", label: "Organisation" },
];

/** Klein, ohne Akzente, Whitespace kollabiert — „München" findet man als „munchen". */
function normalisiere(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Durchsuchbarer Text einer Meldung (siehe Modul-Kopf: was auf der Karte steht). */
function suchtext(e: MeldeEintrag): string {
  const einheit = e.bogen.einheit;
  const ort = einheitOrt(einheit);
  const teile = [
    einheitAnzeigename(einheit),
    orgLabel(einheit.organisation),
    einheit.organisationName ?? "",
    e.zugEtikett ?? "",
    e.teilEtikett ?? "",
    ...einheit.hierarchie.flatMap((h) => [h.name, h.kurz ?? ""]),
    ...e.bogen.fahrzeuge.flatMap((f) => [kennzeichenText(f), funkrufText(f, ort)]),
  ];
  return normalisiere(teile.filter(Boolean).join(" "));
}

/**
 * Meldungen, auf die ALLE Suchwörter passen. Leere Suche = unveränderte Liste
 * (gleiche Referenz), damit die Liste ohne Sucheingabe nichts kostet.
 */
export function einheitenFiltern(eintraege: MeldeEintrag[], suche: string): MeldeEintrag[] {
  const woerter = normalisiere(suche).split(" ").filter(Boolean);
  if (woerter.length === 0) return eintraege;
  return eintraege.filter((e) => {
    const text = suchtext(e);
    return woerter.every((w) => text.includes(w));
  });
}

// ------------------------------------------------------- Qualifikationsfilter

/**
 * Eine Qualifikation, wie sie im Einsatz vorkommt.
 *
 * `schluessel` ist die normalisierte Kurzform („agt"), NICHT der Vokabular-Code.
 * Grund: dieselbe Qualifikation erreicht den Meldekopf auf zwei Wegen — als
 * THW-Code (32 = AGT) und als Freitext „AGT" aus einer Feuerwehr, die für ihre
 * Funktionen noch kein Vokabular hat. Wer nach Atemschutz sucht, will beide
 * sehen; ein Code-Schlüssel würde die Liste in zwei halbe Treffer zerlegen.
 * Der Preis: zwei Organisationen, die dasselbe Kürzel unterschiedlich meinen,
 * landen in einem Topf. Für einen Filter ist das die harmlosere Richtung —
 * eine Person zu viel in der Liste sieht man, eine fehlende nicht.
 */
export interface QualiEintrag {
  schluessel: string;
  /** Beschriftung für die Auswahlliste: „AGT – Atemschutzgeräteträger/in". */
  label: string;
  /** Personen mit dieser Qualifikation (über alle übergebenen Meldungen). */
  personen: number;
  /** Einheiten, die mindestens eine solche Person gemeldet haben. */
  einheiten: number;
}

/**
 * Qualifikationen einer Person — Grundfunktion, Zusatzfunktion und die
 * freien „weiteren Qualifikationen" in einem Topf. Für den Meldekopf ist beides
 * dasselbe Bedürfnis: „wer kann X?"; ob es in der StAN eine Funktion oder eine
 * Zusatzausbildung ist, entscheidet die Frage nicht.
 */
function qualisDerPerson(p: Person, org: OrganisationsTyp): { schluessel: string; label: string }[] {
  const tabelle = vokabularFuer(org, "funktion");
  const gefunden = new Map<string, string>();
  for (const v of [...p.funktionen, ...p.zusatzqualifikationen]) {
    if (v.code != null) {
      const e = tabelle.find((t) => t.code === v.code);
      // Unbekannter Code (Bogen aus einer neueren App-Fassung): bleibt filterbar,
      // nur ohne Klartext — besser als stillschweigend zu verschwinden.
      if (e) gefunden.set(normalisiere(e.kurz), `${e.kurz} – ${e.name}`);
      else gefunden.set(`#${org}:${v.code}`, `#${v.code} (unbekannte Funktion)`);
      continue;
    }
    const frei = (v.freitext ?? "").trim();
    if (frei !== "") {
      const s = normalisiere(frei);
      // Vorhandene Beschriftung nicht überschreiben: die aus dem Vokabular
      // („AGT – Atemschutzgeräteträger/in") sagt mehr als der Freitext „agt".
      if (!gefunden.has(s)) gefunden.set(s, frei);
    }
  }
  // Fahrerlaubnis: „welche Einheit hat mir CE-Kraftfahrer gemeldet?" ist
  // dieselbe Meldekopf-Frage wie AGT. Je gemeldeter Klasse zählen auch die
  // eingeschlossenen Klassen mit (FE_EINGESCHLOSSEN): wer CE hat, ist ein
  // Treffer für „Kf B" — der Meldekopf fragt nach dem Fahrzeug, das er besetzen
  // will, nicht nach dem Kartenaufdruck. Eigener Schlüsselraum „kf:…", damit
  // eine Funktion mit Kürzel „B" nicht mit der Klasse B verschmilzt.
  const klassen = alleFahrerlaubnisse(p);
  if (klassen.length > 0) gefunden.set("kf", "Kf – Kraftfahrer/in (beliebige Klasse)");
  for (const k of klassen) {
    for (const e of FE_EINGESCHLOSSEN[k]) {
      gefunden.set(`kf:${FE_TEXT[e].toLowerCase()}`, `Kf ${FE_TEXT[e]} – Fahrerlaubnisklasse ${FE_TEXT[e]}`);
    }
  }
  return [...gefunden].map(([schluessel, label]) => ({ schluessel, label }));
}

/**
 * Alle im Einsatz gemeldeten Qualifikationen, alphabetisch, mit Trefferzahlen.
 *
 * Gezählt wird über genau die übergebenen Meldungen — üblicherweise die neueste
 * Fassung je Einheit. Damit stimmen die Zahlen in der Auswahlliste mit dem, was
 * die Liste darunter zeigt; abgerückte Einheiten zählen mit, solange sie
 * angezeigt werden.
 */
export function qualifikationenImEinsatz(eintraege: MeldeEintrag[]): QualiEintrag[] {
  const gesammelt = new Map<string, { label: string; personen: number; einheiten: number }>();
  for (const e of eintraege) {
    const org = e.bogen.einheit.organisation;
    const inDieserEinheit = new Set<string>();
    for (const p of e.bogen.personal) {
      for (const { schluessel, label } of qualisDerPerson(p, org)) {
        const bisher = gesammelt.get(schluessel);
        if (bisher) {
          bisher.personen += 1;
          // Die informativere Beschriftung gewinnt (Vokabular vor Freitext).
          if (label.includes(" – ") && !bisher.label.includes(" – ")) bisher.label = label;
        } else {
          gesammelt.set(schluessel, { label, personen: 1, einheiten: 0 });
        }
        inDieserEinheit.add(schluessel);
      }
    }
    for (const s of inDieserEinheit) gesammelt.get(s)!.einheiten += 1;
  }
  return [...gesammelt]
    .map(([schluessel, rest]) => ({ schluessel, ...rest }))
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
}

/** Personen einer Meldung, die die gesuchte Qualifikation tragen (Reihenfolge des Bogens). */
export function personenMitQualifikation(e: MeldeEintrag, schluessel: string): Person[] {
  if (schluessel === "") return [];
  const org = e.bogen.einheit.organisation;
  return e.bogen.personal.filter((p) => qualisDerPerson(p, org).some((q) => q.schluessel === schluessel));
}

/** Meldungen mit mindestens einer passenden Person. Leerer Schlüssel = keine Einschränkung. */
export function nachQualifikationFiltern(eintraege: MeldeEintrag[], schluessel: string): MeldeEintrag[] {
  if (schluessel === "") return eintraege;
  return eintraege.filter((e) => personenMitQualifikation(e, schluessel).length > 0);
}

// ------------------------------------------------------------------ Sortierung

function nameVergleich(a: MeldeEintrag, b: MeldeEintrag): number {
  return einheitAnzeigename(a.bogen.einheit).localeCompare(einheitAnzeigename(b.bogen.einheit), "de");
}

/**
 * Sortierte Kopie der Liste. „zug" stellt Einheiten ohne Etikett ans Ende
 * (wie die Zwischensummen in auswertung.ts), „eintreffzeit" zeigt die zuletzt
 * eingetroffene Meldung oben — das ist beim Meldekopf das Neue.
 */
export function einheitenSortieren(
  eintraege: MeldeEintrag[],
  sortierung: EinheitenSortierung,
): MeldeEintrag[] {
  const liste = [...eintraege];
  switch (sortierung) {
    case "eintreffzeit":
      return liste.sort((a, b) => b.empfangenAm - a.empfangenAm || nameVergleich(a, b));
    case "zug":
      return liste.sort((a, b) => {
        const za = a.zugEtikett ?? "";
        const zb = b.zugEtikett ?? "";
        if (za !== zb) {
          if (za === "") return 1; // „ohne Zug" ans Ende
          if (zb === "") return -1;
          return za.localeCompare(zb, "de");
        }
        return nameVergleich(a, b);
      });
    case "organisation":
      return liste.sort(
        (a, b) =>
          orgLabel(a.bogen.einheit.organisation).localeCompare(
            orgLabel(b.bogen.einheit.organisation),
            "de",
          ) || nameVergleich(a, b),
      );
    case "name":
      return liste.sort(nameVergleich);
  }
}

/** Anzeigeliste: erst suchen, dann auf die Qualifikation einschränken, dann sortieren. */
export function einheitenAnsicht(
  eintraege: MeldeEintrag[],
  suche: string,
  sortierung: EinheitenSortierung,
  qualifikation = "",
): MeldeEintrag[] {
  return einheitenSortieren(
    nachQualifikationFiltern(einheitenFiltern(eintraege, suche), qualifikation),
    sortierung,
  );
}
