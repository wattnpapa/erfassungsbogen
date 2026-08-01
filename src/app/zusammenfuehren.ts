/**
 * Gegenstück zu aufteilen.ts: abgeteilte Truppteile wieder zu einer Meldung
 * zusammenführen — der Zug sammelt sich, der Fachberater kehrt zur Einheit
 * zurück.
 *
 * Reine Logik ohne Persistenz; geschrieben wird in einsaetze.ts
 * (`meldungenZusammenfuehren`).
 *
 * Regeln, die hier festgelegt sind:
 *  - PERSONAL UND FAHRZEUGE werden zusammengelegt, nicht entdoppelt. Teile
 *    einer Aufteilung sind überschneidungsfrei; würde hier nach Namen
 *    zusammengefasst, verschwänden zwei echte Namensgleiche zu einer Person.
 *    Die Vorschau zeigt die entstehende Stärke, damit ein Doppeleintrag
 *    auffällt, bevor er gespeichert ist.
 *  - GEMISCHTE ERFASSUNG fällt auf Zahlen zurück: sobald ein Teil nur als
 *    Stärke gemeldet ist, kann die Summe nicht mehr aus Personen abgeleitet
 *    werden. Dann trägt der Ergebnisbogen die Summen als Zahlen und behält die
 *    bekannten Personen als Ansprechpartner — die Zahlen bleiben exakt, die
 *    Namen gehen nicht verloren.
 *  - SOFORTBEDARF summiert sich (Kraftstoff, Verpflegung); Unterbringung und
 *    Ruhezeit sind Ja/Nein und gelten, sobald ein Teil sie angemeldet hat.
 *  - ÜBUNG UND ERNSTFALL werden nicht vermischt — das wird abgewiesen, nicht
 *    stillschweigend in eine Richtung entschieden.
 */

import {
  PersonalErfassung,
  staerke,
  unterbringungMWD,
  verpflegung,
  type EebZeitpunkt,
  type Erfassungsbogen,
  type Sofortbedarf,
} from "../model";

/**
 * Prüft, ob die Bögen zusammenpassen, und liefert sonst den Grund im Klartext
 * (er erscheint unverändert in der Oberfläche).
 */
export function zusammenfuehrungFehler(ziel: Erfassungsbogen, weitere: Erfassungsbogen[]): string | null {
  if (weitere.length === 0) return "Bitte mindestens einen Teil zum Zusammenführen auswählen.";
  const alle = [ziel, ...weitere];
  const uebung = alle.filter((b) => b.uebung === true).length;
  if (uebung > 0 && uebung < alle.length) {
    return "Übungs- und Einsatzmeldungen lassen sich nicht zusammenführen.";
  }
  return null;
}

/** Summiert den Sofortbedarf; ohne jede Angabe bleibt das Feld leer. */
function summiereSofortbedarf(alle: Erfassungsbogen[]): Sofortbedarf | undefined {
  const vorhanden = alle.map((b) => b.sofortbedarf).filter((s): s is Sofortbedarf => s != null);
  if (vorhanden.length === 0) return undefined;
  return {
    verpflegungPersonen: vorhanden.reduce((n, s) => n + s.verpflegungPersonen, 0),
    dieselLiter: vorhanden.reduce((n, s) => n + s.dieselLiter, 0),
    benzinLiter: vorhanden.reduce((n, s) => n + s.benzinLiter, 0),
    gemischLiter: vorhanden.reduce((n, s) => n + s.gemischLiter, 0),
    unterbringung: vorhanden.some((s) => s.unterbringung),
    ruhezeitErforderlich: vorhanden.some((s) => s.ruhezeitErforderlich),
  };
}

/**
 * Bögen zu einem verschmelzen. Einheit und Auftrag kommen aus dem Zielbogen —
 * die Teile beschreiben dieselbe Einheit, und das Ziel ist die Meldung, die
 * weiterläuft. Wirft bei unpassenden Bögen ({@link zusammenfuehrungFehler}).
 */
export function fuegeZusammen(
  ziel: Erfassungsbogen,
  weitere: Erfassungsbogen[],
  stand: EebZeitpunkt,
): Erfassungsbogen {
  const fehler = zusammenfuehrungFehler(ziel, weitere);
  if (fehler) throw new Error(fehler);

  const alle = [ziel, ...weitere];
  const personal = alle.flatMap((b) => b.personal);
  const fahrzeuge = alle.flatMap((b) => b.fahrzeuge);
  const nurZahlen = alle.some((b) => b.personalErfassung === PersonalErfassung.NUR_STAERKE);

  const gemeinsam = {
    ...ziel,
    stand,
    personal,
    fahrzeuge,
    sofortbedarf: summiereSofortbedarf(alle),
  };

  if (!nurZahlen) {
    // Alle Teile tragen ihre Personen — Stärke, Unterbringung und Verpflegung
    // leiten sich daraus wieder von selbst ab.
    return {
      ...gemeinsam,
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      staerkeManuell: undefined,
      unterbringungManuell: undefined,
      verpflegungManuell: undefined,
    };
  }

  const st = alle.map(staerke);
  const u = alle.map(unterbringungMWD);
  const v = alle.map(verpflegung);
  const summe = (zahlen: number[]) => zahlen.reduce((a, b) => a + b, 0);
  return {
    ...gemeinsam,
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: {
      fuehrer: summe(st.map((s) => s.fuehrer)),
      unterfuehrer: summe(st.map((s) => s.unterfuehrer)),
      mannschaft: summe(st.map((s) => s.mannschaft)),
      gesamt: summe(st.map((s) => s.gesamt)),
    },
    unterbringungManuell: {
      m: summe(u.map((x) => x.m)),
      w: summe(u.map((x) => x.w)),
      d: summe(u.map((x) => x.d)),
    },
    verpflegungManuell: {
      vegetarisch: summe(v.map((x) => x.vegetarisch)),
      vegan: summe(v.map((x) => x.vegan)),
    },
  };
}
