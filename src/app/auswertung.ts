/**
 * Auswertung einer Einsatz-Sammlung: Summen über die aktuell anwesenden
 * Einheiten. „Aktuell" heißt: pro Einheit nur die neueste Revision, und nur
 * solange die Einheit als anwesend gilt (abgerückte fallen aus den Summen,
 * bleiben aber in der Historie).
 *
 * Reine Logik, keine Persistenz — baut auf die abgeleiteten Werte des Models
 * (staerke/verpflegung/unterbringungMWD) auf, damit Einzel- und Meldekopf-Sicht
 * garantiert dieselben Zahlen liefern.
 */

import {
  staerke,
  unterbringungMWD,
  verpflegung,
  type Staerke,
  type VerpflegungSplit,
} from "../model";
import { MeldeStatus, neuesteJeEinheit, type MeldeEintrag } from "./einsaetze";

export interface EinsatzSummen {
  /** Anzahl anwesender Einheiten (nicht Personen). */
  einheiten: number;
  staerke: Staerke;
  verpflegung: VerpflegungSplit;
  unterbringung: { m: number; w: number; d: number };
  /** Einheiten, die Unterbringung angefordert haben (Sofortbedarf). */
  unterbringungBenoetigt: number;
  kraftstoff: { dieselLiter: number; benzinLiter: number; gemischLiter: number };
  /** Einheiten, die Ruhezeit angemeldet haben. */
  ruhezeitErforderlich: number;
  fahrzeuge: number;
}

/**
 * Aktuell zählende Meldungen: neueste Revision je Einheit, nur anwesende.
 * Reihenfolge folgt {@link neuesteJeEinheit}.
 */
export function aktuelleMeldungen(eintraege: MeldeEintrag[]): MeldeEintrag[] {
  return neuesteJeEinheit(eintraege).filter((e) => e.status === MeldeStatus.ANWESEND);
}

function leereSummen(): EinsatzSummen {
  return {
    einheiten: 0,
    staerke: { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 },
    verpflegung: { gesamt: 0, fleisch: 0, vegetarisch: 0, vegan: 0 },
    unterbringung: { m: 0, w: 0, d: 0 },
    unterbringungBenoetigt: 0,
    kraftstoff: { dieselLiter: 0, benzinLiter: 0, gemischLiter: 0 },
    ruhezeitErforderlich: 0,
    fahrzeuge: 0,
  };
}

/** Summiert eine bereits gefilterte Meldungsliste (neueste je Einheit, anwesend). */
function summiere(meldungen: MeldeEintrag[]): EinsatzSummen {
  const s = leereSummen();
  for (const m of meldungen) {
    const b = m.bogen;
    const st = staerke(b);
    s.staerke.fuehrer += st.fuehrer;
    s.staerke.unterfuehrer += st.unterfuehrer;
    s.staerke.mannschaft += st.mannschaft;
    s.staerke.gesamt += st.gesamt;

    const vp = verpflegung(b);
    s.verpflegung.gesamt += vp.gesamt;
    s.verpflegung.fleisch += vp.fleisch;
    s.verpflegung.vegetarisch += vp.vegetarisch;
    s.verpflegung.vegan += vp.vegan;

    const u = unterbringungMWD(b);
    s.unterbringung.m += u.m;
    s.unterbringung.w += u.w;
    s.unterbringung.d += u.d;

    if (b.sofortbedarf) {
      s.kraftstoff.dieselLiter += b.sofortbedarf.dieselLiter;
      s.kraftstoff.benzinLiter += b.sofortbedarf.benzinLiter;
      s.kraftstoff.gemischLiter += b.sofortbedarf.gemischLiter;
      if (b.sofortbedarf.unterbringung) s.unterbringungBenoetigt++;
      if (b.sofortbedarf.ruhezeitErforderlich) s.ruhezeitErforderlich++;
    }

    s.fahrzeuge += b.fahrzeuge.length;
    s.einheiten++;
  }
  return s;
}

/** Gesamtsummen über alle aktuell anwesenden Einheiten des Einsatzes. */
export function aggregiere(eintraege: MeldeEintrag[]): EinsatzSummen {
  return summiere(aktuelleMeldungen(eintraege));
}

export interface ZugGruppe {
  /** Zug-/Verbands-Etikett; undefined = Einheiten ohne Etikett („Einzeln"). */
  zugEtikett?: string;
  summen: EinsatzSummen;
}

/**
 * Summen gruppiert nach Zug-Etikett (optionale Verbands-Zwischensumme).
 * Nur aktuell anwesende Einheiten. Gruppen sind alphabetisch sortiert,
 * Einheiten ohne Etikett kommen zuletzt.
 */
export function aggregiereNachZug(eintraege: MeldeEintrag[]): ZugGruppe[] {
  const nach = new Map<string, MeldeEintrag[]>();
  for (const m of aktuelleMeldungen(eintraege)) {
    const k = m.zugEtikett ?? "";
    (nach.get(k) ?? nach.set(k, []).get(k)!).push(m);
  }
  return [...nach.entries()]
    .sort(([a], [b]) => {
      if (a === "") return 1; // „ohne Etikett" ans Ende
      if (b === "") return -1;
      return a.localeCompare(b, "de");
    })
    .map(([k, ms]) => ({ zugEtikett: k || undefined, summen: summiere(ms) }));
}
