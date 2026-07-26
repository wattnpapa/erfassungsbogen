/**
 * Suchen und Sortieren der Einheitenliste eines Einsatzes.
 *
 * Bei einer Großlage meldet sich ein Meldekopf 30–50 Einheiten in eine Liste;
 * fest alphabetisch und ungefiltert ist die dann nicht mehr zu überblicken.
 * Hier liegt die reine Logik dazu (kein React, keine Persistenz), damit die
 * Trefferregeln unit-getestet sind:
 *
 *  - SUCHE: alle Wörter müssen treffen (UND), Groß/Klein und Akzente egal.
 *    Gesucht wird über das, was auf der Karte bzw. im Funkverkehr steht —
 *    Einheit, Organisation, Ort/Zugehörigkeit, Zug-Etikett, Kennzeichen und
 *    Funkrufname. Nicht über Personennamen: die Liste ist eine Einheitenliste,
 *    und die Namen stehen ausgeklappt in den Details.
 *  - SORTIERUNG: umschaltbar, immer mit dem Anzeigenamen als letztem
 *    Vergleich, damit die Reihenfolge bei Gleichstand stabil bleibt.
 *
 * Beides betrifft NUR die Darstellung der Liste — die Summen des Einsatzes
 * (auswertung.ts) rechnen unverändert über alle anwesenden Einheiten.
 */

import type { MeldeEintrag } from "./einsaetze";
import { einheitAnzeigename, einheitOrt, funkrufText, kennzeichenText, orgLabel } from "./hilfen";

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

/** Anzeigeliste: erst suchen, dann sortieren. */
export function einheitenAnsicht(
  eintraege: MeldeEintrag[],
  suche: string,
  sortierung: EinheitenSortierung,
): MeldeEintrag[] {
  return einheitenSortieren(einheitenFiltern(eintraege, suche), sortierung);
}
