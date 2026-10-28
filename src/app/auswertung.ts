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
  PersonalErfassung,
  staerke,
  unterbringungMWD,
  verpflegung,
  type Erfassungsbogen,
  type Staerke,
  type VerpflegungSplit,
} from "@bos/eeb-format/model";
import { EinsatzArt, MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { geltendeJeEinheit } from "./fassung-vorrang";
import { angabenZeit } from "./angaben-alter";

export interface EinsatzSummen {
  /** Anzahl anwesender Einheiten (nicht Personen). */
  einheiten: number;
  staerke: Staerke;
  verpflegung: VerpflegungSplit;
  /**
   * Personen, für die Verpflegung ausdrücklich angefordert ist (Schritt 5 angehakt, R11-W1).
   * `verpflegung.gesamt` ist die Kopfstärke nach Bogen und bleibt davon getrennt: Wer nichts
   * angekreuzt hat, will nicht mitbestellt werden.
   */
  verpflegungAngefordert: number;
  unterbringung: { m: number; w: number; d: number };
  /**
   * Personen, deren M/W/D-Aufteilung niemand angegeben hat (Schnellerfassung
   * nur mit Stärke, ohne „Unterbringung M/W/D angeben"). Sie stehen nicht
   * stillschweigend als 0 in M/W/D, sondern werden benannt (R2-N5).
   */
  unterbringungOhneAngabe: number;
  /** Einheiten, die Unterbringung angefordert haben (Sofortbedarf). */
  unterbringungBenoetigt: number;
  /**
   * Personen genau dieser Einheiten, mit M/W/D-Aufteilung. `unterbringung`
   * oben zählt ALLE Anwesenden (WC/Dusche); neben „6× angefordert" las man
   * „M 71 / W 30" und bestellte Quartier für 101 statt 66 Personen (Audit
   * Runde 3, R3-K4).
   */
  unterbringungAngefordert: { personen: number; m: number; w: number; d: number; ohneAngabe: number };
  kraftstoff: { dieselLiter: number; benzinLiter: number; gemischLiter: number };
  /** Einheiten, die Ruhezeit angemeldet haben. */
  ruhezeitErforderlich: number;
  fahrzeuge: number;
  /**
   * Einheiten, deren Bedarf (Unterbringung, Ruhezeit, Betriebsstoff, Fahrzeuge) niemand erfasst hat — Schnellerfassung
   * „nur Stärke". „Keine Unterbringung angefordert" wäre für sie eine falsche Aussage (R14-W1).
   */
  bedarfOhneAngabe: number;
}

/**
 * Hat bei dieser Meldung niemand den Bedarf erfasst? Schnellerfassung (nur Stärke) ohne Fahrzeuge, Unterbringung,
 * Ruhezeit und Betriebsstoff: leer heißt dort „nicht gefragt", nicht „nicht nötig" (R14-W1).
 */
export function bedarfNichtErfasst(b: Erfassungsbogen): boolean {
  const sb = b.sofortbedarf;
  return (
    b.personalErfassung === PersonalErfassung.NUR_STAERKE &&
    b.fahrzeuge.length === 0 &&
    (!sb || (!sb.dieselLiter && !sb.benzinLiter && !sb.gemischLiter && !sb.unterbringung && !sb.ruhezeitErforderlich))
  );
}

/**
 * Zählt diese Meldung in die Lage der Sammlung?
 *
 * Ein als Übung gekennzeichneter Bogen gehört nicht in die Zahlen eines echten
 * Einsatzes: Er beschreibt Kräfte, die für die Lage nicht verfügbar sind. In
 * einer Übungssammlung ist er dagegen genau richtig. Die Startseite sichert
 * das ausdrücklich zu („wird am Meldekopf nicht versehentlich zur Lage
 * gezählt"); bis hierher galt die Zusage nur für das Etikett auf der Karte,
 * nicht für die Summen.
 */
export function zaehltInLage(art: EinsatzArt, bogen: Erfassungsbogen): boolean {
  return art === EinsatzArt.UEBUNG || !bogen.uebung;
}

/**
 * Aktuell zählende Meldungen: neueste Revision je Einheit, nur anwesende —
 * und, sobald die Einsatzart mitgegeben wird, ohne die Übungsmeldungen, die
 * nicht in diese Lage gehören. Reihenfolge folgt {@link neuesteJeEinheit}.
 */
export function aktuelleMeldungen(eintraege: MeldeEintrag[], art?: EinsatzArt): MeldeEintrag[] {
  const anwesend = geltendeJeEinheit(eintraege).filter((e) => e.status === MeldeStatus.ANWESEND);
  return art == null ? anwesend : anwesend.filter((e) => zaehltInLage(art, e.bogen));
}

/**
 * Die Gegenprobe: anwesende Meldungen, die wegen ihrer Übungskennzeichnung
 * NICHT in die Lage zählen. Die Oberfläche sagt damit, was sie weglässt —
 * eine stillschweigend kleinere Summe wäre so falsch wie die zu große.
 */
export function uebungenAusserhalbDerLage(eintraege: MeldeEintrag[], art: EinsatzArt): MeldeEintrag[] {
  return geltendeJeEinheit(eintraege).filter(
    (e) => e.status === MeldeStatus.ANWESEND && !zaehltInLage(art, e.bogen),
  );
}

function leereSummen(): EinsatzSummen {
  return {
    einheiten: 0,
    staerke: { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 },
    verpflegung: { gesamt: 0, fleisch: 0, vegetarisch: 0, vegan: 0 },
    verpflegungAngefordert: 0,
    unterbringung: { m: 0, w: 0, d: 0 },
    unterbringungOhneAngabe: 0,
    unterbringungBenoetigt: 0,
    unterbringungAngefordert: { personen: 0, m: 0, w: 0, d: 0, ohneAngabe: 0 },
    kraftstoff: { dieselLiter: 0, benzinLiter: 0, gemischLiter: 0 },
    ruhezeitErforderlich: 0,
    fahrzeuge: 0,
    bedarfOhneAngabe: 0,
  };
}

/**
 * Verpflegungs-Kopfzahl eines Bogens für die Lage.
 *
 * Das Model (`verpflegung`, Submodul) zählt ohne manuelle Aufteilung die
 * Personalliste. Bei einer Schnellerfassung nur mit Stärke stehen dort aber nur
 * die „nicht gezählten" Ansprechpartner — heraus kamen „Verpflegung 0" bei
 * 12 anwesenden Helfern bzw. „Verpflegung 1" für die eine Kontaktperson
 * (Audit Runde 2, R2-N5). Hier gilt dann die Stärke, alle als „sonstige" —
 * genau so, wie die Erfassung selbst es anzeigt („0 von 12 vegetarisch/vegan ·
 * 12 sonstige").
 */
export function verpflegungLage(b: Erfassungsbogen): VerpflegungSplit {
  if (b.staerkeManuell && !b.verpflegungManuell) {
    const gesamt = b.staerkeManuell.gesamt;
    return { gesamt, fleisch: gesamt, vegetarisch: 0, vegan: 0 };
  }
  return verpflegung(b);
}

/**
 * Personen, für die dieser Bogen Verpflegung anfordert: nur mit angehaktem Schritt 5 (Sofortbedarf),
 * dann die dort eingetragene Zahl. Ohne Sofortbedarf 0 — die Kopfstärke ist keine Bestellung (R11-W1).
 */
export function verpflegungAngefordertLage(b: Erfassungsbogen): number {
  return b.sofortbedarf ? Math.max(0, b.sofortbedarf.verpflegungPersonen) : 0;
}

/**
 * Verpflegung für Kopfzeile und Lageblatt: Stimmen angefordert und Stärke überein, steht eine Zahl
 * („Verpflegung 9"); sonst beide benannt („Verpflegung angefordert 0 (Stärke 9)", R11-W1).
 */
export function verpflegungText(s: Pick<EinsatzSummen, "verpflegung" | "verpflegungAngefordert">): string {
  if (s.verpflegungAngefordert === s.verpflegung.gesamt) return `Verpflegung ${s.verpflegung.gesamt}`;
  // R20-N5: ein Satz, kein „angefordert 0 … nicht erfasst": was angefordert ist, gegen die Zahl der Personen vor Ort.
  return s.verpflegungAngefordert === 0
    ? `Verpflegung: kein Bedarf gemeldet (${s.verpflegung.gesamt} Personen vor Ort)` // R21-N6: „keine angefordert" klang nach „nichts nötig"
    : `Verpflegung: ${s.verpflegungAngefordert} angefordert (${s.verpflegung.gesamt} Personen vor Ort)`;
}

/**
 * Unterbringung M/W/D eines Bogens für die Lage — bei Schnellerfassung ohne
 * M/W/D-Angabe nicht aus den Ansprechpartnern abgeleitet (die zählen nicht,
 * R2-N5), sondern als `ohneAngabe` mit der Gesamtstärke.
 */
export function unterbringungLage(b: Erfassungsbogen): { m: number; w: number; d: number; ohneAngabe: number } {
  if (b.staerkeManuell && !b.unterbringungManuell) {
    return { m: 0, w: 0, d: 0, ohneAngabe: b.staerkeManuell.gesamt };
  }
  return { ...unterbringungMWD(b), ohneAngabe: 0 };
}

/**
 * Summiert eine Liste von Bögen. Getrennt von {@link summiere}, damit auch die
 * Sammel-PDF (die nur die Bögen kennt) exakt dieselben Zahlen ausweist wie die
 * Meldekopf-Oberfläche.
 */
export function summiereBoegen(boegen: Erfassungsbogen[]): EinsatzSummen {
  const s = leereSummen();
  for (const b of boegen) {
    const st = staerke(b);
    s.staerke.fuehrer += st.fuehrer;
    s.staerke.unterfuehrer += st.unterfuehrer;
    s.staerke.mannschaft += st.mannschaft;
    s.staerke.gesamt += st.gesamt;

    const vp = verpflegungLage(b);
    s.verpflegung.gesamt += vp.gesamt;
    s.verpflegung.fleisch += vp.fleisch;
    s.verpflegung.vegetarisch += vp.vegetarisch;
    s.verpflegung.vegan += vp.vegan;
    s.verpflegungAngefordert += verpflegungAngefordertLage(b);

    const u = unterbringungLage(b);
    s.unterbringung.m += u.m;
    s.unterbringung.w += u.w;
    s.unterbringung.d += u.d;
    s.unterbringungOhneAngabe += u.ohneAngabe;

    if (b.sofortbedarf) {
      s.kraftstoff.dieselLiter += b.sofortbedarf.dieselLiter;
      s.kraftstoff.benzinLiter += b.sofortbedarf.benzinLiter;
      s.kraftstoff.gemischLiter += b.sofortbedarf.gemischLiter;
      if (b.sofortbedarf.unterbringung) {
        s.unterbringungBenoetigt++;
        const a = s.unterbringungAngefordert;
        a.m += u.m;
        a.w += u.w;
        a.d += u.d;
        a.ohneAngabe += u.ohneAngabe;
        a.personen += u.m + u.w + u.d + u.ohneAngabe;
      }
      if (b.sofortbedarf.ruhezeitErforderlich) s.ruhezeitErforderlich++;
    }

    s.fahrzeuge += b.fahrzeuge.length;
    s.einheiten++;
    if (bedarfNichtErfasst(b)) s.bedarfOhneAngabe++;
  }
  return s;
}

/**
 * „8 männl. / 1 weibl. / 0 div." — bei Schnellerfassungen ohne Aufteilung mit
 * dem Rest „· 12 ohne Angabe zum Geschlecht" (R2-N5). Für Bedarfsblock,
 * Zwischensummen, Bogen-Übersicht und Lageblatt, damit alle dieselbe
 * Schreibweise haben.
 *
 * Ausgeschrieben statt „M 8 / W 1 / D 0": Direkt daneben steht die Stärke
 * mit „M" für Mannschaft, und „Unterbringung: M 9" las sich als „9 Mann
 * brauchen ein Quartier" (Audit Runde 3, R3-N3). Die Erklärung stand nur im
 * Tooltip, den es auf dem Telefon nicht gibt.
 */
export function mwdText(x: { m: number; w: number; d: number; ohneAngabe?: number }): string {
  return `${x.m} männl. / ${x.w} weibl. / ${x.d} div.${x.ohneAngabe ? ` · ${x.ohneAngabe} ohne Angabe zum Geschlecht` : ""}`;
}

/**
 * Verpflegung eines Bogens als Satz: „11 Personen, davon 3 vegetarisch, 1 vegan". Bei 0 Portionen steht „nicht
 * angefordert" und die Ernährung der Personen getrennt — „0 Personen, davon 3 vegetarisch" widersprach sich
 * (R13-W4). Ohne Angabe zur Aufteilung (Schnellerfassung): „· Aufteilung vegetarisch/vegan: keine Angabe".
 */
export function verpflegungBogenText(personen: number, vp: { vegetarisch: number; vegan: number }, aufteilungAngegeben = true): string {
  if (personen <= 0) {
    return aufteilungAngegeben && (vp.vegetarisch > 0 || vp.vegan > 0)
      ? `nicht angefordert (Ernährung der Personen: ${vp.vegetarisch} vegetarisch, ${vp.vegan} vegan)`
      : "nicht angefordert";
  }
  return `${personen} Personen` + (aufteilungAngegeben ? `, davon ${vp.vegetarisch} vegetarisch, ${vp.vegan} vegan` : " · Aufteilung vegetarisch/vegan: keine Angabe");
}

/**
 * „6 Einheiten, 66 Personen (M 56 / W 10 / D 0)" — die Zahl fürs Quartier
 * (R3-K4). Leer, wenn niemand Unterbringung angefordert hat.
 */
export function unterbringungAngefordertText(s: EinsatzSummen): string {
  if (s.unterbringungBenoetigt === 0) return "";
  const a = s.unterbringungAngefordert;
  return `${s.unterbringungBenoetigt} ${s.unterbringungBenoetigt === 1 ? "Einheit" : "Einheiten"}, ${a.personen} ${a.personen === 1 ? "Person" : "Personen"} (${mwdText(a)})`;
}

/** Summiert eine bereits gefilterte Meldungsliste (neueste je Einheit, anwesend). */
function summiere(meldungen: MeldeEintrag[]): EinsatzSummen {
  return summiereBoegen(meldungen.map((m) => m.bogen));
}

/** Gesamtsummen über alle aktuell anwesenden Einheiten des Einsatzes. */
export function aggregiere(eintraege: MeldeEintrag[], art?: EinsatzArt): EinsatzSummen {
  return summiere(aktuelleMeldungen(eintraege, art));
}

export interface ZugGruppe {
  /** Zug-/Verbands-Etikett; undefined = Einheiten ohne Etikett („Einzeln"). */
  zugEtikett?: string;
  summen: EinsatzSummen;
  /** Eingang der ältesten geltenden Meldung dieser Gruppe (ms) — Altersaussage je Zug (R12-K3). */
  aeltesteMeldungAm?: number;
}

/**
 * Summen gruppiert nach Zug-Etikett (optionale Verbands-Zwischensumme).
 * Nur aktuell anwesende Einheiten. Gruppen sind alphabetisch sortiert,
 * Einheiten ohne Etikett kommen zuletzt.
 */
export function aggregiereNachZug(eintraege: MeldeEintrag[], art?: EinsatzArt): ZugGruppe[] {
  const nach = new Map<string, MeldeEintrag[]>();
  for (const m of aktuelleMeldungen(eintraege, art)) {
    const k = m.zugEtikett ?? "";
    (nach.get(k) ?? nach.set(k, []).get(k)!).push(m);
  }
  return [...nach.entries()]
    .sort(([a], [b]) => {
      if (a === "") return 1; // „ohne Etikett" ans Ende
      if (b === "") return -1;
      return a.localeCompare(b, "de");
    })
    .map(([k, ms]) => ({
      zugEtikett: k || undefined,
      summen: summiere(ms),
      aeltesteMeldungAm: Math.min(...ms.map(angabenZeit)),
    }));
}
