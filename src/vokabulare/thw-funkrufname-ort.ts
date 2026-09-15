/**
 * Ortsteil des THW-Funkrufnamens für Stadtstaaten mit mehreren Ortsverbänden.
 *
 * Der Regelfall ist einfach: der Ortsteil des Funkrufnamens ist der OV-Name
 * ("Heros Oldenburg 18/13"). In Berlin ist er es nicht — dort sprechen alle
 * zwölf Ortsverbände auf „Berlin", und welcher OV gemeint ist, sagt eine
 * vorangestellte Kennzahl: „Heros Berlin 06/22/51" ist die Bergungsgruppe des
 * OV Steglitz-Zehlendorf. Ohne diese Zahl klingt der Funkrufname aus dem
 * Bogen ("Heros Berlin Steglitz-Zehlendorf 22/51") wie kein Funkrufname, den
 * es in Berlin gibt (Issue #25).
 *
 * Die Kennzahl ist die amtliche Bezirksnummer Berlins (01 Mitte … 12
 * Reinickendorf); die OV-Namen decken sich mit den Bezirken. Bestätigt ist
 * 06 = Steglitz-Zehlendorf (Meldung aus dem OV); die übrigen Zahlen folgen
 * derselben Reihenfolge.
 *
 * Bewusst nur Berlin: Hamburg und Bremen führen ebenfalls mehrere OVs unter
 * einem Stadtnamen, dort ist die gesprochene Zuordnung hier aber nicht
 * belegt — lieber keine Zahl als eine erfundene.
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
}

/** OVs, deren Funkrufname den Ortsverband als Kennzahl führt (Stand: nur Berlin). */
export const FUNKRUF_ORTSVERBAENDE: FunkrufOrtsverband[] = [
  { kurz: "OBEM", name: "Berlin-Mitte", ort: "Berlin", kennzahl: 1 },
  { kurz: "OFRK", name: "Berlin Friedrichshain-Kreuzberg", ort: "Berlin", kennzahl: 2 },
  { kurz: "OPKW", name: "Berlin Pankow", ort: "Berlin", kennzahl: 3 },
  { kurz: "OCHA", name: "Berlin Charlottenburg-Wilmersdorf", ort: "Berlin", kennzahl: 4 },
  { kurz: "OSPA", name: "Berlin Spandau", ort: "Berlin", kennzahl: 5 },
  { kurz: "OSTZ", name: "Berlin Steglitz-Zehlendorf", ort: "Berlin", kennzahl: 6 },
  { kurz: "OTES", name: "Berlin Tempelhof-Schöneberg", ort: "Berlin", kennzahl: 7 },
  { kurz: "ONKO", name: "Berlin Neukölln", ort: "Berlin", kennzahl: 8 },
  { kurz: "OTRE", name: "Berlin Treptow-Köpenick", ort: "Berlin", kennzahl: 9 },
  { kurz: "OMZH", name: "Berlin Marzahn-Hellersdorf", ort: "Berlin", kennzahl: 10 },
  { kurz: "OLIC", name: "Berlin Lichtenberg", ort: "Berlin", kennzahl: 11 },
  { kurz: "OREI", name: "Berlin Reinickendorf", ort: "Berlin", kennzahl: 12 },
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
 * Kennzahlen des Funkrufnamens wie gesprochen. In Berlin steht die OV-Zahl
 * vorn; fehlt sie (Bogen von Hand erfasst oder aus älterer Fassung), wird sie
 * ergänzt. Drei oder mehr Kennzahlen bleiben unangetastet: dann führt der
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
 * stanFahrzeugVorbelegung, in Berlin aber mit der OV-Kennzahl vor den
 * Kennzahlen der Teileinheit — so steht im Fahrzeugfeld gleich „06/22/51".
 */
export function fahrzeugVorbelegung(e: Einheit): Fahrzeug[] {
  return fahrzeugeMitFunkrufOv(stanFahrzeugVorbelegung(e.organisation, e.einheitsTyp), e);
}
