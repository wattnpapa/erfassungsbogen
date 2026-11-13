/**
 * Datumsfelder „Zeitraum von/bis" (R12-E3). Wer ein Datum im Feld löscht (Löschen im Datumsdialog des Telefons),
 * bekam bisher stillschweigend den 01.01.1900 (`datumAusIso("")`), und die Hinweise sprachen von einem „Tippfehler
 * im Jahr 1900". Jetzt fällt ein leeres „bis" auf den Tag von „von" zurück (wie die Beschriftung „Vorschlag: wie
 * Beginn" sagt), ein leeres „von" auf heute.
 *
 * Seit Schema 11 trägt jedes Ende optional eine Uhrzeit als ISO 8601 mit Zeitzonen-Offset
 * (`zeitraumVonIso`/`zeitraumBisIso`). Die Oberfläche zeigt nur Datum und Wandzeit; den Offset setzt die App
 * aus der Zeitzone des Geräts für genau diesen Tag (Sommer-/Winterzeit).
 */

import { datumAusIso, datumZuIso, zeitraumIso, zeitraumIsoLesen, type EebDatum, type Einsatz } from "@bos/eeb-format/model";

export type Zeitraum = Pick<Einsatz, "zeitraumVon" | "zeitraumBis" | "zeitraumVonIso" | "zeitraumBisIso">;

/** Neuer Zeitraum nach einer Eingabe in „von" (`feld = "von"`) oder „bis"; `iso` ist der Feldwert (leer = gelöscht). */
export function zeitraumNachEingabe(
  alt: Zeitraum,
  feld: "von" | "bis",
  iso: string,
  heute: EebDatum,
): Zeitraum {
  // Leerer Zeitraum: Das erste eingetragene Datum gilt für beide Enden, ein geleertes Feld bleibt leer.
  if (zeitraumLeer(alt)) {
    if (!iso) return { zeitraumVon: 0, zeitraumBis: 0 };
    const tag = datumAusIso(iso);
    return { zeitraumVon: tag, zeitraumBis: tag };
  }
  const bisFolgtVon = alt.zeitraumBis === alt.zeitraumVon;
  const neu =
    feld === "von"
      ? (() => {
          const von = iso ? datumAusIso(iso) : heute;
          return { zeitraumVon: von, zeitraumBis: bisFolgtVon ? von : alt.zeitraumBis };
        })()
      : { zeitraumVon: alt.zeitraumVon, zeitraumBis: iso ? datumAusIso(iso) : alt.zeitraumVon };
  // Die Uhrzeit wandert mit dem Tag; der Offset wird für den neuen Tag neu bestimmt.
  const vonMin = uhrzeitAus(alt.zeitraumVonIso);
  const bisMin = uhrzeitAus(alt.zeitraumBisIso);
  return {
    ...neu,
    ...(vonMin != null ? { zeitraumVonIso: zeitraumZeitIso(neu.zeitraumVon, vonMin) } : {}),
    ...(bisMin != null ? { zeitraumBisIso: zeitraumZeitIso(neu.zeitraumBis, bisMin) } : {}),
  };
}

/**
 * Vorbelegte Uhrzeit zum Zeitraum (Schema 11): von 08:00 bis 18:00. Ein üblicher Dienst- bzw. Übungstag; wer
 * anders gemeldet ist, ändert die Felder. Minuten seit Mitternacht.
 */
export const UHRZEIT_VON_VORGABE = 8 * 60;
export const UHRZEIT_BIS_VORGABE = 18 * 60;

/**
 * Ist der Zeitraum nicht angegeben? Das Format verlangt für „von“ und „bis“ einen Tag (im QR je ein uint16);
 * „leer“ ist deshalb der Tag 0 an beiden Enden (01.01.2020, vor dem ersten Bogen), wie im Blanko-Vordruck.
 * Ältere Leser zeigen dafür „01.01.2020“.
 */
export function zeitraumLeer(z: Pick<Einsatz, "zeitraumVon" | "zeitraumBis">): boolean {
  return z.zeitraumVon === 0 && z.zeitraumBis === 0;
}

/** Einsatzangaben ohne Inhalt: Zeitraum nicht angegeben, Ort/Auftrag leer (Beispielbögen). */
export function einsatzLeer(): Einsatz {
  return { zeitraumVon: 0, zeitraumBis: 0, ortAuftrag: "" };
}

/** Einsatzangaben eines neuen bzw. zurückgesetzten Bogens: heute, 08:00–18:00, Ort/Auftrag leer. */
export function einsatzVorgabe(heute: EebDatum): Einsatz {
  return {
    zeitraumVon: heute,
    zeitraumBis: heute,
    zeitraumVonIso: zeitraumZeitIso(heute, UHRZEIT_VON_VORGABE),
    zeitraumBisIso: zeitraumZeitIso(heute, UHRZEIT_BIS_VORGABE),
    ortAuftrag: "",
  };
}

/** Abstand der Gerätezeitzone zu UTC an diesem Tag zu dieser Wandzeit, in Minuten (MEZ 60, MESZ 120). */
export function lokalerOffset(tag: EebDatum, minuten: number): number {
  const [j = 1970, m = 1, t = 1] = datumZuIso(tag).split("-").map(Number);
  const offset = -new Date(j, m - 1, t, Math.floor(minuten / 60), minuten % 60).getTimezoneOffset();
  return offset === 0 ? 0 : offset; // kein „-0"
}

/** Tag + Wandzeit → ISO 8601 mit dem Offset der Gerätezeitzone. */
export function zeitraumZeitIso(tag: EebDatum, minuten: number): string {
  return zeitraumIso({ tag, minuten, offsetMinuten: lokalerOffset(tag, minuten) });
}

/** Wandzeit (Minuten seit Mitternacht) aus einem Zeitraum-Ende in ISO 8601; ohne/unlesbar → undefined. Der Offset wird für die Anzeige bewusst ignoriert. */
export function uhrzeitAus(iso: string | undefined): number | undefined {
  return iso == null ? undefined : zeitraumIsoLesen(iso)?.minuten;
}

/** Minuten seit Mitternacht → Wert für `<input type="time">` („08:00"). */
export function uhrzeitZuIso(minuten: number): string {
  return `${String(Math.floor(minuten / 60)).padStart(2, "0")}:${String(minuten % 60).padStart(2, "0")}`;
}

/** Wert aus `<input type="time">` → Minuten seit Mitternacht; leer (Feld gelöscht) → undefined. */
export function uhrzeitAusIso(iso: string): number | undefined {
  const m = /^(\d{1,2}):(\d{2})/.exec(iso);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : undefined;
}
