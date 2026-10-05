/**
 * Stärkeänderung vom Papier für eine schon gemeldete Einheit.
 *
 * Nach einer Ausfallphase trägt der Meldekopf Zeilen vom Lageblatt nach:
 * „OV Kirchehrenbach, B, 0/2/6/8". Über die Schnellerfassung (nur Stärke)
 * und „als neue Fassung" wurde daraus eine Fassung OHNE Fahrzeuge,
 * Sofortbedarf, Namen und Verpflegungsaufteilung — die neue Fassung zählt,
 * also fielen 2 Fahrzeuge, 65 l Kraftstoff, die Ruhezeit und fünf
 * vegetarische Portionen still aus den Summen (Audit Runde 3, R3-A1). Auf dem
 * Zettel stand aber nur, was sich geändert hat: ein Helfer weniger.
 *
 * Hier: erkennen, dass ein Bogen nur eine Stärke trägt; benennen, was beim
 * Ersetzen wegfiele; und eine Fassung bauen, die von der bisherigen alles
 * behält und nur die Stärke ändert.
 */

import { PersonalErfassung, staerke, type Erfassungsbogen, type Staerke } from "@bos/eeb-format/model";
import { unterbringungLage, verpflegungLage } from "./auswertung";

/** Trägt der Bogen nur eine Stärke (Schnellerfassung), nichts sonst? */
export function istNurStaerke(b: Erfassungsbogen): boolean {
  const sb = b.sofortbedarf;
  const bedarfLeer =
    !sb || (!sb.dieselLiter && !sb.benzinLiter && !sb.gemischLiter && !sb.unterbringung && !sb.ruhezeitErforderlich);
  return (
    b.personalErfassung === PersonalErfassung.NUR_STAERKE &&
    b.fahrzeuge.length === 0 &&
    bedarfLeer &&
    !b.verpflegungManuell &&
    !b.unterbringungManuell &&
    !b.sonstiges?.trim()
  );
}

/**
 * Was beim Ersetzen von `vorher` durch den Nur-Stärke-Bogen `neu` wegfiele —
 * „2 Fahrzeuge", „Diesel 60 l", „Ruhezeit", „9 Namen" … Leer, wenn nichts.
 */
export function wasWegfiele(vorher: Erfassungsbogen, neu: Erfassungsbogen): string[] {
  const weg: string[] = [];
  const n = vorher.fahrzeuge.length - neu.fahrzeuge.length;
  if (n > 0) weg.push(n === 1 ? "1 Fahrzeug" : `${n} Fahrzeuge`);
  const sb = vorher.sofortbedarf;
  if (sb) {
    if (sb.dieselLiter > 0) weg.push(`Diesel ${sb.dieselLiter} l`);
    if (sb.benzinLiter > 0) weg.push(`Benzin ${sb.benzinLiter} l`);
    if (sb.gemischLiter > 0) weg.push(`Gemisch ${sb.gemischLiter} l`);
    if (sb.ruhezeitErforderlich) weg.push("Ruhezeit");
    if (sb.unterbringung) weg.push("Unterbringung");
  }
  const namen = vorher.personal.length - neu.personal.length;
  if (namen > 0) weg.push(namen === 1 ? "1 Name" : `${namen} Namen`);
  if (vorher.verpflegungManuell && (vorher.verpflegungManuell.vegetarisch > 0 || vorher.verpflegungManuell.vegan > 0)) {
    weg.push("Verpflegungsaufteilung");
  }
  if (vorher.unterbringungManuell) weg.push("Aufteilung nach Geschlecht");
  if (vorher.sonstiges?.trim()) weg.push("Bemerkung");
  return weg;
}

/**
 * Neue Fassung der Einheit: alles von `vorher` (Einheit samt Schreibweise,
 * Personal, Fahrzeuge, Sofortbedarf, Bemerkung), nur die Stärke aus `neu`.
 * Der Stand rückt mindestens auf den neueren der beiden, damit die Fassung
 * die bisherige ablöst. Folgte die Verpflegung bisher der Gesamtstärke, folgt
 * sie ihr weiter.
 */
export function nurStaerkeUebernehmen(vorher: Erfassungsbogen, st: Staerke, stand = vorher.stand): Erfassungsbogen {
  const b: Erfassungsbogen = JSON.parse(JSON.stringify(vorher));
  const alt = staerke(vorher);
  b.stand = Math.max(stand, vorher.stand);
  b.staerkeManuell = {
    fuehrer: st.fuehrer,
    unterfuehrer: st.unterfuehrer,
    mannschaft: st.mannschaft,
    gesamt: st.fuehrer + st.unterfuehrer + st.mannschaft,
  };
  const gesamt = b.staerkeManuell.gesamt;
  if (b.sofortbedarf && b.sofortbedarf.verpflegungPersonen === alt.gesamt) {
    b.sofortbedarf.verpflegungPersonen = gesamt;
  }
  // Mit gesetzter Stärke rechnet die Lage Verpflegung und M/W/D nur noch aus
  // den manuellen Angaben (auswertung.ts) — ohne sie wären fünf vegetarische
  // Portionen und alle M/W/D-Angaben einer namentlichen Meldung weg. Darum
  // die bisherige Aufteilung festschreiben, auf die neue Stärke begrenzt.
  if (!b.verpflegungManuell) {
    const vp = verpflegungLage(vorher);
    if (vp.vegetarisch > 0 || vp.vegan > 0) b.verpflegungManuell = { vegetarisch: vp.vegetarisch, vegan: vp.vegan };
  }
  if (b.verpflegungManuell) {
    const v = b.verpflegungManuell;
    v.vegan = Math.min(v.vegan, gesamt);
    v.vegetarisch = Math.min(v.vegetarisch, gesamt - v.vegan);
  }
  if (!b.unterbringungManuell) {
    const u = unterbringungLage(vorher);
    if (u.ohneAngabe === 0 && u.m + u.w + u.d > 0) b.unterbringungManuell = { m: u.m, w: u.w, d: u.d };
  }
  if (b.unterbringungManuell) {
    // Weniger Helfer: der Überhang geht von der größten Gruppe ab (die
    // Angabe auf dem Zettel sagt nicht, wer ging). Mehr Helfer: deren
    // Geschlecht ist unbekannt — die Aufteilung bleibt, wie sie war.
    const u = b.unterbringungManuell;
    let ueber = u.m + u.w + u.d - gesamt;
    while (ueber > 0) {
      const k = u.m >= u.w && u.m >= u.d ? "m" : u.w >= u.d ? "w" : "d";
      u[k]--;
      ueber--;
    }
  }
  return b;
}
