/**
 * Großstadtregelung der THW-Funkrufnamen.
 *
 * Der Regelfall ist einfach: der Ortsteil des Funkrufnamens ist der OV-Name
 * ("Heros Oldenburg 18/13"). Sitzen mehrere Ortsverbände in einer Stadt,
 * greift die Großstadtregelung der Funkrufnamen-Taschenkarte — dann sprechen
 * alle OVs auf den Stadtnamen, und welcher OV gemeint ist, sagt eine
 * vorangestellte Kennzahl: „Heros Berlin 06/22/51" ist die Bergungsgruppe des
 * OV Steglitz-Zehlendorf. Ohne diese Zahl klingt der Funkrufname aus dem
 * Bogen ("Heros Berlin Steglitz-Zehlendorf 22/51") wie kein Funkrufname, den
 * es in Berlin gibt (Issue #25).
 *
 * Die Regelung nennt fünf Städte, aber nur für drei davon Kennzahlen:
 *
 *   Berlin  01 Mitte … 12 Reinickendorf (zweistellig geschrieben)
 *   Hamburg 1 Mitte, 2 Altona, 3 Eimsbüttel, 4 Nord, 5 Wandsbek,
 *           6 Bergedorf, 7 Harburg
 *   Köln    4 Nord-West, 7 Porz, 10 Ost
 *
 * München (München-Land/-Mitte/-Ost/-West) und Bremen (Bremen-Mitte/-Nord/
 * -Ost/-Süd) stehen ohne Zahl in der Regelung: dort unterscheidet der
 * OV-Name selbst die Ortsverbände. Für sie bleibt es deshalb beim Regelfall,
 * und sie stehen hier bewusst nicht in der Tabelle.
 */

import type { Einheit, Fahrzeug, Funkrufname } from "@bos/eeb-format/model";
import { OrganisationsTyp } from "@bos/eeb-format/model";
import { stanFahrzeugVorbelegung } from "@bos/vokabulare/thw-stan-fahrzeuge";

export interface FunkrufOrtsverband {
  /** Offizielles OV-Kürzel aus dem OV-Verzeichnis ("OSTZ"). */
  kurz: string;
  /** OV-Name aus dem OV-Verzeichnis ("Berlin Steglitz-Zehlendorf"). */
  name: string;
  /** Ortsteil des Funkrufnamens ("Berlin"). */
  ort: string;
  /** Erste Kennzahl des Funkrufnamens: der OV (6 → gesprochen „null-sechs"). */
  kennzahl: number;
  /**
   * Stellen, mit denen die OV-Kennzahl geschrieben wird. Berlin führt sie
   * zweistellig („06"), Hamburg und Köln einstellig („4") — so steht es in der
   * Regelung, und so steht es auf den Fahrzeugen.
   */
  stellen: 1 | 2;
}

/** OVs der Großstadtregelung, deren Funkrufname den OV als Kennzahl führt. */
export const FUNKRUF_ORTSVERBAENDE: FunkrufOrtsverband[] = [
  { kurz: "OBEM", name: "Berlin-Mitte", ort: "Berlin", kennzahl: 1, stellen: 2 },
  { kurz: "OFRK", name: "Berlin Friedrichshain-Kreuzberg", ort: "Berlin", kennzahl: 2, stellen: 2 },
  { kurz: "OPKW", name: "Berlin Pankow", ort: "Berlin", kennzahl: 3, stellen: 2 },
  { kurz: "OCHA", name: "Berlin Charlottenburg-Wilmersdorf", ort: "Berlin", kennzahl: 4, stellen: 2 },
  { kurz: "OSPA", name: "Berlin Spandau", ort: "Berlin", kennzahl: 5, stellen: 2 },
  { kurz: "OSTZ", name: "Berlin Steglitz-Zehlendorf", ort: "Berlin", kennzahl: 6, stellen: 2 },
  { kurz: "OTES", name: "Berlin Tempelhof-Schöneberg", ort: "Berlin", kennzahl: 7, stellen: 2 },
  { kurz: "ONKO", name: "Berlin Neukölln", ort: "Berlin", kennzahl: 8, stellen: 2 },
  { kurz: "OTRE", name: "Berlin Treptow-Köpenick", ort: "Berlin", kennzahl: 9, stellen: 2 },
  { kurz: "OMZH", name: "Berlin Marzahn-Hellersdorf", ort: "Berlin", kennzahl: 10, stellen: 2 },
  { kurz: "OLIC", name: "Berlin Lichtenberg", ort: "Berlin", kennzahl: 11, stellen: 2 },
  { kurz: "OREI", name: "Berlin Reinickendorf", ort: "Berlin", kennzahl: 12, stellen: 2 },
  { kurz: "OHHM", name: "Hamburg Mitte", ort: "Hamburg", kennzahl: 1, stellen: 1 },
  { kurz: "OHHA", name: "Hamburg-Altona", ort: "Hamburg", kennzahl: 2, stellen: 1 },
  { kurz: "OHHE", name: "Hamburg-Eimsbüttel", ort: "Hamburg", kennzahl: 3, stellen: 1 },
  { kurz: "OHHN", name: "Hamburg Nord", ort: "Hamburg", kennzahl: 4, stellen: 1 },
  { kurz: "OHHW", name: "Hamburg-Wandsbek", ort: "Hamburg", kennzahl: 5, stellen: 1 },
  { kurz: "OHHB", name: "Hamburg-Bergedorf", ort: "Hamburg", kennzahl: 6, stellen: 1 },
  { kurz: "OHHH", name: "Hamburg-Harburg", ort: "Hamburg", kennzahl: 7, stellen: 1 },
  { kurz: "OKNW", name: "Köln Nord-West", ort: "Köln", kennzahl: 4, stellen: 1 },
  { kurz: "OKPZ", name: "Köln-Porz", ort: "Köln", kennzahl: 7, stellen: 1 },
  { kurz: "OKOT", name: "Köln-Ost", ort: "Köln", kennzahl: 10, stellen: 1 },
];

/**
 * Vergleichsform eines OV-Namens: Groß-/Kleinschreibung, Binde- und
 * Leerzeichen fallen weg. „Berlin-Mitte", „Berlin Mitte" und „berlin mitte"
 * sind derselbe OV — im Bogen steht, was jemand getippt oder aus der
 * Vorschlagsliste übernommen hat.
 */
function normal(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");
}

const JE_KURZ = new Map(FUNKRUF_ORTSVERBAENDE.map((o) => [o.kurz.toLowerCase(), o]));
const JE_NAME = new Map(FUNKRUF_ORTSVERBAENDE.map((o) => [normal(o.name), o]));

/** Trägt die Einheit einen OV mit Kennzahl-Funkrufnamen? Sonst undefined. */
export function funkrufOrtsverband(e: Einheit): FunkrufOrtsverband | undefined {
  if (e.organisation !== OrganisationsTyp.THW) return undefined;
  const ebene = e.hierarchie[0];
  if (!ebene) return undefined;
  const kurz = ebene.kurz?.trim().toLowerCase();
  return (kurz ? JE_KURZ.get(kurz) : undefined) ?? JE_NAME.get(normal(ebene.name ?? ""));
}

/**
 * Kennzahlen des Funkrufnamens wie gesprochen. Unter der Großstadtregelung
 * steht die OV-Zahl vorn; fehlt sie (Bogen von Hand erfasst oder aus älterer
 * Fassung), wird sie ergänzt. Drei oder mehr Kennzahlen bleiben unangetastet: dann führt der
 * Funkrufname bereits einen OV — auch einen fremden, etwa bei einem
 * Fahrzeug, das aus einem anderen OV mitgefahren ist.
 */
export function funkrufKennzahlen(fr: Funkrufname, ov: FunkrufOrtsverband | undefined): number[] {
  if (!ov || !fr.eigenerStandort || fr.teile.length === 0 || fr.teile.length >= 3) return fr.teile;
  return [ov.kennzahl, ...fr.teile];
}

/**
 * Schreibt die OV-Kennzahl in die Funkrufnamen einer Fahrzeugliste. Gedacht
 * für den Moment, in dem der Ortsverband feststeht (Schritt 1) — der
 * Einheitstyp und mit ihm die StAN-Vorbelegung ist oft schon vorher gewählt.
 * Ändert sich nichts, kommt die übergebene Liste unverändert zurück.
 */
export function fahrzeugeMitFunkrufOv(fahrzeuge: Fahrzeug[], e: Einheit): Fahrzeug[] {
  const ov = funkrufOrtsverband(e);
  if (!ov) return fahrzeuge;
  let geaendert = false;
  const neu = fahrzeuge.map((f) => {
    if (!f.funkrufname) return f;
    const teile = funkrufKennzahlen(f.funkrufname, ov);
    if (teile === f.funkrufname.teile) return f;
    geaendert = true;
    return { ...f, funkrufname: { ...f.funkrufname, teile } };
  });
  return geaendert ? neu : fahrzeuge;
}

/**
 * StAN-Fahrzeugvorbelegung für eine konkrete Einheit: wie
 * stanFahrzeugVorbelegung, unter der Großstadtregelung aber mit der
 * OV-Kennzahl vor den Kennzahlen der Teileinheit — so steht im Fahrzeugfeld
 * gleich „06/22/51".
 */
export function fahrzeugVorbelegung(e: Einheit): Fahrzeug[] {
  return fahrzeugeMitFunkrufOv(stanFahrzeugVorbelegung(e.organisation, e.einheitsTyp), e);
}
