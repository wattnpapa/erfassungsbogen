/**
 * Parser für die Mehrzeilen-Namenseingabe der Personal-Schnelleingabe:
 * Wer eine fertige Liste hat (Alarm-Nachricht, Tabelle, Notizzettel), fügt
 * sie als Text ein — eine Person je Zeile — statt jede Person einzeln
 * anzulegen. Reine Funktion, damit sie unit-testbar bleibt.
 */

import { StaerkeRolle, type Person } from "@bos/eeb-format/model";

/** Ein erkannter Name; weitere Personendaten werden anschließend erfasst. */
export interface NamensEintrag {
  vorname: string;
  nachname: string;
  /** Erkanntes Funktionskürzel der Zeile („ZFhr", „GrFü") — roh, ungedeutet. */
  funktion?: string;
  /** Aus der Funktion abgeleitete Stärke-Rolle; fehlt = Mannschaft (Vorgabe). */
  rolle?: StaerkeRolle;
}

/**
 * Funktionskürzel → Stärke-Rolle.
 *
 * Eingefügte Listen tragen die Funktion fast immer mit („Meyer, Jens, ZFhr").
 * Ohne diese Zuordnung landete das Kürzel im Vornamen und jede Person zählte
 * als Mannschaft: Aus einem Zugführer und drei Helfern wurde 0/0/4/4 — die
 * falsche Zahl reist über den Ausdruck bis in die Summe der Führungsstelle.
 *
 * Die Liste bleibt bewusst kurz und wörtlich: Erkannt wird, was in BOS-Listen
 * üblich ist; alles andere bleibt Mannschaft und steht als Funktionstext an der
 * Person, statt geraten zu werden. Verglichen wird kleingeschrieben und ohne
 * Punkte, Schrägstriche und Bindestriche.
 */
const ROLLE_KUERZEL: ReadonlyArray<readonly [RegExp, StaerkeRolle]> = [
  [/^(zfhr|zfu|zfue|zugfuhrer|zugfuehrer|zgfhr|efhr|einsatzleiter|el|ofuehrer|ortsbeauftragter|ob)$/, StaerkeRolle.FUEHRER],
  [/^(grfhr|grfu|grfue|gruppenfuhrer|gruppenfuehrer|trfhr|trfu|truppfuhrer|truppfuehrer|zugtrfhr|ztrfhr)$/, StaerkeRolle.UNTERFUEHRER],
];

/** Vergleichsform: klein, ohne Umlaute, ohne Trenn- und Satzzeichen. */
function kuerzelSchluessel(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z]/g, "");
}

/** Stärke-Rolle zu einem Funktionskürzel — `undefined`, wenn nichts passt. */
export function rolleAusFunktion(funktion: string): StaerkeRolle | undefined {
  const schluessel = kuerzelSchluessel(funktion);
  if (!schluessel) return undefined;
  return ROLLE_KUERZEL.find(([muster]) => muster.test(schluessel))?.[1];
}

/**
 * Text → Namensliste. Je Zeile eine Person, zwei gängige Schreibweisen:
 *  - „Nachname, Vorname"  (Komma trennt)
 *  - „Vorname [weitere Vornamen] Nachname"  (letztes Wort ist der Nachname)
 * Ein einzelnes Wort wird als Nachname übernommen. Leerzeilen entfallen.
 *
 * Ein drittes, kommagetrenntes Feld gilt als Funktion („Meyer, Jens, ZFhr")
 * und wird nicht mehr in den Vornamen gezogen; ist das Kürzel bekannt, bringt
 * es die Stärke-Rolle mit (siehe {@link rolleAusFunktion}).
 */
export function parseNamen(text: string): NamensEintrag[] {
  return text
    .split(/\r?\n/)
    .map((zeile) => zeile.trim())
    .filter(Boolean)
    .map((zeile) => {
      // Kürzel VOR dem Namen („GrFü Maier, Klaus", „TrFü Anna Schulz") wurde
      // bisher Teil des Nachnamens (Audit Runde 2, R2-N2). Nur bekannte
      // Führungskürzel zählen — ein Doppelname bleibt ein Name.
      const erstes = zeile.split(/\s+/)[0] ?? "";
      const rest = zeile.slice(erstes.length).trim();
      const vorangestellt = rest && !/,$/.test(erstes) ? rolleAusFunktion(erstes) : undefined;
      if (vorangestellt != null) {
        const eintrag = zeileLesen(rest);
        return { ...eintrag, funktion: eintrag.funktion ?? erstes, rolle: eintrag.rolle ?? vorangestellt };
      }
      return zeileLesen(zeile);
    });
}

/** Eine Zeile ohne vorangestelltes Kürzel lesen (siehe {@link parseNamen}). */
function zeileLesen(zeile: string): NamensEintrag {
  const komma = zeile.indexOf(",");
  if (komma >= 0) {
    const rest = zeile.slice(komma + 1);
    const zweites = rest.indexOf(",");
    const vorname = (zweites >= 0 ? rest.slice(0, zweites) : rest).trim();
    const funktion = zweites >= 0 ? rest.slice(zweites + 1).trim() : "";
    return {
      nachname: zeile.slice(0, komma).trim(),
      vorname,
      ...(funktion ? { funktion, rolle: rolleAusFunktion(funktion) } : {}),
    };
  }
  const teile = zeile.split(/\s+/);
  if (teile.length === 1) return { vorname: "", nachname: teile[0]! };
  return {
    vorname: teile.slice(0, -1).join(" "),
    nachname: teile[teile.length - 1]!,
  };
}

/** Ergebnis von {@link namenEinsetzen}: neue Liste und je eingefügter Person der Platz. */
export interface Einsetzung {
  personal: Person[];
  /** Je eingefügter Person: Index des gefüllten Sollplatzes, `null` = hinten angehängt. */
  plaetze: (number | null)[];
}

/**
 * Eingefügte Namen in die leeren Plätze der Liste setzen, statt die Plätze zu
 * ersetzen. Vorher fielen alle unbenannten Sollplätze weg — mit ihnen die
 * Funktionen GrFü und TrFü, und aus 0/2/7/9 wurde 0/0/2/2 (Audit Runde 2,
 * R2-N2). Jetzt:
 *  - Eine Zeile mit Führungsrolle („Maier, Klaus, GrFü") nimmt den ersten
 *    freien Platz derselben Rolle, sonst den ersten freien überhaupt.
 *  - Eine Zeile ohne Funktion nimmt den nächsten freien Platz der Reihe
 *    nach — der erste Name landet also auf dem ersten Sollplatz (GrFü).
 *  - Funktionen und Rolle des Platzes bleiben, es sei denn, die Zeile bringt
 *    eigene mit. Sind alle Plätze belegt, wird hinten angehängt.
 */
export function namenEinsetzen(
  personal: Person[],
  neue: Person[],
  istFrei: (p: Person) => boolean,
): Einsetzung {
  const liste = [...personal];
  const frei = liste.map((p, i) => (istFrei(p) ? i : -1)).filter((i) => i >= 0);
  const plaetze: (number | null)[] = [];
  for (const n of neue) {
    const eigeneFunktion = n.funktionen.length > 0;
    let wahl = eigeneFunktion ? frei.find((i) => liste[i]!.staerkeRolle === n.staerkeRolle) : undefined;
    wahl ??= frei[0];
    if (wahl == null) {
      liste.push(n);
      plaetze.push(null);
      continue;
    }
    frei.splice(frei.indexOf(wahl), 1);
    const platz = liste[wahl]!;
    liste[wahl] = {
      ...platz,
      vorname: n.vorname,
      nachname: n.nachname,
      ...(eigeneFunktion ? { funktionen: n.funktionen, staerkeRolle: n.staerkeRolle } : {}),
    };
    plaetze.push(wahl);
  }
  return { personal: liste, plaetze };
}
