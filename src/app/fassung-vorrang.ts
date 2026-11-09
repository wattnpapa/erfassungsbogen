/**
 * Welche Fassung einer Einheit gilt — die App-Schicht über der Kern-Regel.
 *
 * Der geteilte Kern (`@bos/meldekopf/einsaetze`, Submodul) entscheidet allein
 * nach dem Zeitstempel im Bogen (`stand`), bei gleicher Minute nach der
 * Empfangszeit (`neuesteJeEinheit`, `revisionen`). Das passt für
 * Folgemeldungen, aber nicht für zwei Lagen, die am Meldekopf alltäglich
 * sind (Audit Runde 4, R4-W1):
 *
 *  - Der Meldekopf erfasst eine Einheit schnell (StAN-Platzhalter, 20:55),
 *    ihr richtiger Bogen kommt danach — ausgefüllt vor der Abfahrt, also mit
 *    älterem Stand (18:55). Nach der Kern-Regel gilt weiter die
 *    Schnellerfassung, der Bogen verschwindet still in der Historie.
 *  - Zwei Fassungen derselben Minute: es gilt die zuletzt EMPFANGENE, also
 *    die zufällig zuletzt eingelesene Datei.
 *
 * Der Kern bleibt unverändert (ADR-003). Stattdessen trägt eine Fassung, die
 * jemand ausdrücklich verdrängt hat, den Verweis `ersetztDurch` auf die
 * Fassung, die stattdessen gilt. Alle Stellen der App fragen nach Köpfen und
 * Historie über {@link geltendeJeEinheit} und {@link fassungenJeEinheit}:
 * Verdrängte Fassungen fallen aus der Wahl des Kopfs heraus, unter den übrigen
 * gilt die Kern-Regel. Eine spätere Folgemeldung der Einheit (jüngerer Stand)
 * löst die bestätigte Fassung also wieder ganz normal ab.
 *
 * Wie die übrigen Zusätze aus eintrag-zeiten.ts ein optionales Feld am
 * Eintrag: der Kern reicht es durch, Sammel-PDF und Einsatz-Transport tragen
 * es mit, kein Schemawechsel. Fehlt die Fassung, auf die der Verweis zeigt
 * (verworfen, nicht mit importiert), gilt der Verweis nicht — dann entscheidet
 * wieder der Kern.
 */
import { MeldeStatus, neuesteJeEinheit, revisionen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { einsaetzeLaden as kernEinsaetzeLaden, einsaetzePapierkorb as kernEinsaetzePapierkorb } from "@bos/meldekopf/einsaetze";
import { sammlungenSchreiben } from "./eintrag-zeiten";

declare module "@bos/meldekopf/einsaetze" {
  interface MeldeEintrag {
    /**
     * Eintrags-ID der Fassung, die an Stelle dieser gilt — gesetzt, wenn die
     * Führungsstelle eine (ältere) Fassung als gültig bestätigt hat, etwa den
     * nachgereichten Bogen statt der Schnellerfassung (Audit Runde 4, R4-W1).
     */
    ersetztDurch?: string;
    /** Wann die Fassung verdrängt wurde (Date.now()); nur mit `ersetztDurch`. */
    ersetztAm?: number;
  }
}

/** Ist diese Fassung durch eine noch vorhandene andere verdrängt? */
function verdraengt(e: MeldeEintrag, ids: ReadonlySet<string>): boolean {
  return e.ersetztDurch != null && e.ersetztDurch !== e.id && ids.has(e.ersetztDurch);
}

/**
 * Geltende Fassung je Einheit — wie `neuesteJeEinheit` aus dem Kern, aber
 * ohne verdrängte Fassungen. Sind (unerwartet) alle Fassungen einer Einheit
 * verdrängt, entscheidet für sie der Kern.
 */
export function geltendeJeEinheit(eintraege: readonly MeldeEintrag[]): MeldeEintrag[] {
  const alle = eintraege as MeldeEintrag[];
  if (!alle.some((e) => e.ersetztDurch != null)) return neuesteJeEinheit(alle);
  const ids = new Set(alle.map((e) => e.id));
  const koepfe = neuesteJeEinheit(alle.filter((e) => !verdraengt(e, ids)));
  const vertreten = new Set(koepfe.map((k) => k.einheitSchluessel));
  const rest = alle.filter((e) => !vertreten.has(e.einheitSchluessel));
  return rest.length === 0 ? koepfe : [...koepfe, ...neuesteJeEinheit(rest)];
}

/**
 * Alle Fassungen einer Einheit, die geltende zuerst: wie `revisionen` aus dem
 * Kern, die verdrängten Fassungen stehen hinter den übrigen.
 */
export function fassungenJeEinheit(eintraege: readonly MeldeEintrag[], einheitSchl: string): MeldeEintrag[] {
  const revs = revisionen(eintraege as MeldeEintrag[], einheitSchl);
  if (!revs.some((e) => e.ersetztDurch != null)) return revs;
  const ids = new Set(revs.map((e) => e.id));
  const vorn = revs.filter((e) => !verdraengt(e, ids));
  if (vorn.length === 0) return revs;
  return [...vorn, ...revs.filter((e) => verdraengt(e, ids))];
}



/**
 * Wie eine eben aufgenommene Fassung zur bisher geltenden steht — Grundlage
 * der Rückfrage beim Eingang (R4-W1).
 *
 *  - `ersetzt-platzhalter`: Der Bogen der Einheit kam nach einer
 *    Schnellerfassung, trägt aber den älteren Stand — nach der Kern-Regel
 *    bliebe die Schnellerfassung gültig. Vorschlag: der Bogen gilt.
 *  - `gleiche-minute`: Bisherige und neue Fassung tragen denselben Stand.
 *    Nach der Kern-Regel gälte die zuletzt eingelesene; welche stimmt, weiß
 *    nur der Mensch.
 *  - `aelter`: Der neue Bogen ist älter als der geltende (und der ist keine
 *    Schnellerfassung) — er liegt nur in der Historie.
 *  - `null`: normale Folgemeldung bzw. erste Meldung der Einheit.
 */
export type FassungsLage = "ersetzt-platzhalter" | "gleiche-minute" | "aelter";

export interface FassungsPruefung {
  lage: FassungsLage;
  /** Die eben aufgenommene Fassung. */
  neu: MeldeEintrag;
  /** Die bis zum Eingang geltende Fassung. */
  bisher: MeldeEintrag;
}



/** Ergebnis von {@link fassungGiltSetzen} — für „Rückgängig". */
export interface VorrangAenderung {
  einsatzId: string;
  /** Die Fassung, die jetzt gilt. */
  giltId: string;
  /** Je geänderter Fassung der vorige Verweis (undefined = keiner). */
  vorher: { id: string; ersetztDurch?: string; ersetztAm?: number }[];
}

function alleSammlungen() {
  return [...kernEinsaetzeLaden(), ...kernEinsaetzePapierkorb()];
}

/**
 * Diese Fassung gilt für ihre Einheit. Alle Fassungen, die nach der
 * Kern-Regel vor ihr stünden, werden als verdrängt vermerkt; ein eigener
 * Verweis der Fassung fällt weg. Zug, Auftrag, Eintreffzeit und Verlauf
 * gehören der Einheit, nicht der Fassung: Fehlen sie an der jetzt geltenden,
 * übernimmt sie sie von der bisher geltenden. Ein Schreibvorgang. Rückgabe
 * für {@link vorrangZuruecknehmen}, null wenn nichts zu tun war.
 */
export function fassungGiltSetzen(einsatzId: string, eintragId: string, jetzt = Date.now()): VorrangAenderung | null {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  const gilt = s?.eintraege.find((e) => e.id === eintragId);
  if (!s || !gilt) return null;
  const fassungen = s.eintraege.filter((e) => e.einheitSchluessel === gilt.einheitSchluessel);
  const bisherKopf = geltendeJeEinheit(fassungen)[0];
  const reihe = revisionen(fassungen, gilt.einheitSchluessel); // Kern-Reihenfolge, neueste zuerst
  const davor = reihe.slice(0, reihe.findIndex((e) => e.id === gilt.id));
  const aenderung: VorrangAenderung = { einsatzId, giltId: gilt.id, vorher: [] };
  const merken = (e: MeldeEintrag) => {
    if (!aenderung.vorher.some((v) => v.id === e.id)) aenderung.vorher.push({ id: e.id, ersetztDurch: e.ersetztDurch, ersetztAm: e.ersetztAm });
  };
  if (gilt.ersetztDurch != null) {
    merken(gilt);
    delete gilt.ersetztDurch;
    delete gilt.ersetztAm;
  }
  for (const e of davor) {
    if (e.ersetztDurch === gilt.id) continue;
    merken(e);
    e.ersetztDurch = gilt.id;
    e.ersetztAm = jetzt;
  }
  if (aenderung.vorher.length === 0) return null;
  // Was die Führungsstelle der Einheit gegeben hat, bleibt an der Einheit.
  if (bisherKopf && bisherKopf.id !== gilt.id) {
    if (gilt.eingetroffenAm == null) gilt.eingetroffenAm = bisherKopf.eingetroffenAm ?? bisherKopf.empfangenAm;
    if (gilt.notiz == null && bisherKopf.notiz) gilt.notiz = bisherKopf.notiz;
    if (!gilt.zugEtikett && bisherKopf.zugEtikett) gilt.zugEtikett = bisherKopf.zugEtikett;
    if (!gilt.teilEtikett && bisherKopf.teilEtikett) gilt.teilEtikett = bisherKopf.teilEtikett;
    // Hat die bisher geltende Fassung die Einheit nur durch eine Folgemeldung
    // zurückgeholt (R5-K1), war ihr Status keine Entscheidung der Führungsstelle:
    // Dann gilt der Status der Fassung, die jetzt gilt, nicht der geerbte.
    if (!bisherKopf.rueckkehr && gilt.status !== bisherKopf.status) {
      gilt.status = bisherKopf.status;
      if (bisherKopf.abgerueckAm != null) gilt.abgerueckAm = bisherKopf.abgerueckAm;
      else delete gilt.abgerueckAm;
    }
    if (gilt.status === MeldeStatus.ABGERUECKT) delete gilt.rueckkehr;
    if (bisherKopf.vermerke?.length) {
      const bekannt = new Set((gilt.vermerke ?? []).map((v) => `${v.zeit}|${v.text}`));
      const dazu = bisherKopf.vermerke.filter(
        (v) =>
          !bekannt.has(`${v.zeit}|${v.text}`) &&
          // Der Vermerk der Rückkehr gehört zu der Fassung, die sie bewirkt hat.
          !(gilt.status === MeldeStatus.ABGERUECKT && bisherKopf.rueckkehr && v.text.startsWith("Wieder als anwesend geführt: Folgemeldung")),
      );
      if (dazu.length > 0) gilt.vermerke = [...(gilt.vermerke ?? []), ...dazu.map((v) => ({ ...v }))].sort((a, b) => a.zeit - b.zeit);
    }
  }
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
  return aenderung;
}




/** {@link fassungGiltSetzen} zurücknehmen: die Verweise wie vorher. */
export function vorrangZuruecknehmen(a: VorrangAenderung): void {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === a.einsatzId);
  if (!s) return;
  for (const v of a.vorher) {
    const e = s.eintraege.find((x) => x.id === v.id);
    if (!e) continue;
    if (v.ersetztDurch != null) {
      e.ersetztDurch = v.ersetztDurch;
      if (v.ersetztAm != null) e.ersetztAm = v.ersetztAm;
    } else {
      delete e.ersetztDurch;
      delete e.ersetztAm;
    }
  }
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
}
