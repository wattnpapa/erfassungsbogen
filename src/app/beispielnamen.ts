/**
 * Beispielpersonen für Übungsbögen: zufällige, erkennbar fiktive, aber
 * realistisch verteilte Personen (Name, Geschlecht, Ernährung, Fahrerlaubnis,
 * Stärkerollen). Nur erreichbar, wenn der Bogen als Übung gekennzeichnet ist
 * (siehe SchrittPersonal) — im Produktivbetrieb existiert der Weg nicht.
 */

import { Ernaehrung, Fahrerlaubnis, Geschlecht, Person, StaerkeRolle } from "../model";
import { neuePerson } from "./hilfen";

// Gängige deutsche Namen — bewusst Allerweltsnamen, damit in einer Übung
// niemand eine reale Person dahinter vermutet.
const VORNAMEN_M = [
  "Alexander", "Andreas", "Christian", "Daniel", "David", "Felix", "Florian",
  "Jan", "Jonas", "Julian", "Lukas", "Marcel", "Markus", "Martin", "Matthias",
  "Max", "Michael", "Niklas", "Patrick", "Paul", "Peter", "Philipp", "Sebastian",
  "Stefan", "Thomas", "Tim", "Tobias",
] as const;
const VORNAMEN_W = [
  "Anna", "Christina", "Claudia", "Franziska", "Hannah", "Julia", "Katharina",
  "Katrin", "Laura", "Lea", "Lena", "Lisa", "Marie", "Melanie", "Miriam",
  "Nadine", "Nicole", "Nina", "Sabine", "Sandra", "Sarah", "Sophie", "Stefanie",
  "Svenja", "Vanessa",
] as const;
const VORNAMEN_D = ["Alex", "Chris", "Kim", "Luca", "Mika", "Robin", "Sam", "Toni"] as const;
const NACHNAMEN = [
  "Albrecht", "Bauer", "Becker", "Braun", "Fischer", "Friedrichs", "Hartmann",
  "Hoffmann", "Janssen", "Klein", "Koch", "Krüger", "Lange", "Lehmann", "Meyer",
  "Müller", "Neumann", "Peters", "Richter", "Schmidt", "Schneider", "Schröder",
  "Schulz", "Vogel", "Wagner", "Weber", "Werner", "Wolf", "Zimmermann",
] as const;

function aus<T>(liste: readonly T[]): T {
  return liste[Math.floor(Math.random() * liste.length)]!;
}

/** Zufallswahl nach Gewichten (Summe beliebig). */
function gewichtet<T>(paare: [T, number][]): T {
  const summe = paare.reduce((s, [, g]) => s + g, 0);
  let rest = Math.random() * summe;
  for (const [wert, gewicht] of paare) {
    rest -= gewicht;
    if (rest < 0) return wert;
  }
  return paare[paare.length - 1]![0];
}

function zufallsGeschlecht(): Geschlecht {
  return gewichtet([
    [Geschlecht.M, 60],
    [Geschlecht.W, 37],
    [Geschlecht.D, 3],
  ]);
}

function zufallsErnaehrung(): Ernaehrung {
  return gewichtet([
    [Ernaehrung.FLEISCH, 75],
    [Ernaehrung.VEGETARISCH, 18],
    [Ernaehrung.VEGAN, 7],
  ]);
}

function zufallsFahrerlaubnis(): Fahrerlaubnis {
  return gewichtet([
    [Fahrerlaubnis.B, 55],
    [Fahrerlaubnis.BE, 15],
    [Fahrerlaubnis.CE, 15],
    [Fahrerlaubnis.C1E, 5],
    [Fahrerlaubnis.NONE, 10],
  ]);
}

function vorname(g: Geschlecht): string {
  if (g === Geschlecht.M) return aus(VORNAMEN_M);
  if (g === Geschlecht.W) return aus(VORNAMEN_W);
  return aus(VORNAMEN_D);
}

/**
 * `anzahl` Beispielpersonen erzeugen. `bestehende` = Personen, die schon im
 * Bogen stehen: Führungsstruktur wird nur ergänzt, nie doppelt aufgebaut —
 * über Bestand und Neuzugang zusammen gilt 1 Führer/in, dann je angefangene
 * 6 Mannschaften ein/e Unterführer/in (an gängige Gruppenstärken angelehnt).
 */
export function beispielPersonen(anzahl: number, bestehende: Person[] = []): Person[] {
  const neue: Person[] = [];
  let fuehrer = bestehende.filter((p) => p.staerkeRolle === StaerkeRolle.FUEHRER).length;
  let unterfuehrer = bestehende.filter((p) => p.staerkeRolle === StaerkeRolle.UNTERFUEHRER).length;
  for (let i = 0; i < anzahl; i++) {
    const g = zufallsGeschlecht();
    const gesamt = bestehende.length + neue.length + 1;
    let rolle = StaerkeRolle.MANNSCHAFT;
    if (fuehrer === 0) {
      rolle = StaerkeRolle.FUEHRER;
      fuehrer++;
    } else if (unterfuehrer < Math.ceil((gesamt - fuehrer) / 6)) {
      rolle = StaerkeRolle.UNTERFUEHRER;
      unterfuehrer++;
    }
    neue.push({
      ...neuePerson(),
      vorname: vorname(g),
      nachname: aus(NACHNAMEN),
      geschlecht: g,
      ernaehrung: zufallsErnaehrung(),
      fahrerlaubnis: zufallsFahrerlaubnis(),
      staerkeRolle: rolle,
    });
  }
  return neue;
}
