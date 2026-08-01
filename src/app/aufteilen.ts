/**
 * Einen gemeldeten Bogen aufteilen: aus einer Meldung werden zwei — der REST,
 * der als Einheit weiterbesteht, und ein ABGETEILTER Teil (Fachberater allein,
 * halber Zug im anderen Abschnitt, Trupp auf dem Heimweg).
 *
 * Reine Logik ohne Persistenz; die Sammlung schreibt das Ergebnis in
 * einsaetze.ts (`meldungAufteilen`) fort.
 *
 * Regeln, die hier festgelegt sind:
 *  - PERSONAL UND FAHRZEUGE folgen der Auswahl. Bei vollständig erfasstem
 *    Personal rechnen sich Stärke, Verpflegung und Unterbringung damit von
 *    selbst richtig (abgeleitete Werte im Model) — es gibt nichts zu verteilen.
 *  - BEI NUR_STAERKE ist nichts ableitbar: die Zahlen des abgeteilten Teils
 *    werden eingegeben, der Rest bekommt die Differenz.
 *  - KRAFTSTOFF bleibt beim Rest (ein Fachberater nimmt keine 200 l Diesel
 *    mit); die Verpflegungszahl zieht mit der Stärke um. Beides ist am Ende
 *    ohnehin in beiden Bögen nachbearbeitbar — hier zählt eine Vorgabe, die
 *    nicht überrascht.
 *  - BEIM REST BLEIBT ETWAS. „Alles geht mit" ist keine Aufteilung, sondern
 *    eine Umbenennung, und würde eine leere Einheit in den Summen hinterlassen.
 */

import {
  PersonalErfassung,
  staerke,
  type EebZeitpunkt,
  type Erfassungsbogen,
  type Sofortbedarf,
  type Staerke,
} from "../model";

/** Stärkeangabe ohne `gesamt` — die Summe rechnet {@link teileBogen}. */
export interface TeilStaerke {
  fuehrer: number;
  unterfuehrer: number;
  mannschaft: number;
}

export interface AufteilungsWahl {
  /** Bezeichnung des abgeteilten Teils, z. B. „Fachberater". Pflicht. */
  teilEtikett: string;
  /** Indizes in `bogen.personal`, die MITGEHEN. */
  personal: number[];
  /** Indizes in `bogen.fahrzeuge`, die MITGEHEN. */
  fahrzeuge: number[];
  /** Nur bei NUR_STAERKE: Stärke des abgeteilten Teils (Rest = Differenz). */
  staerke?: TeilStaerke;
  /** Nur bei NUR_STAERKE und nur, wenn der Ursprung Zahlen dazu trägt. */
  unterbringung?: { m: number; w: number; d: number };
  verpflegung?: { vegetarisch: number; vegan: number };
}

export interface Teilung {
  /** Die Einheit, wie sie weiterbesteht — neue Revision derselben Meldung. */
  rest: Erfassungsbogen;
  /** Der abgeteilte Teil — eine eigene Meldung. */
  abgeteilt: Erfassungsbogen;
}

function summe(s: TeilStaerke): Staerke {
  return { ...s, gesamt: s.fuehrer + s.unterfuehrer + s.mannschaft };
}

/** Auswahl auf Indizes anwenden: [mitgenommen, verblieben]. */
function trenne<T>(liste: T[], mit: number[]): [T[], T[]] {
  const gewaehlt = new Set(mit);
  const a: T[] = [];
  const b: T[] = [];
  liste.forEach((x, i) => (gewaehlt.has(i) ? a : b).push(x));
  return [a, b];
}

/**
 * Prüft die Auswahl und liefert den Grund, warum sie (noch) nicht aufgeht —
 * oder `null`, wenn sie stimmt. Der Text erscheint unverändert in der
 * Oberfläche, ist also für Nutzer:innen geschrieben.
 */
export function aufteilungFehler(bogen: Erfassungsbogen, wahl: AufteilungsWahl): string | null {
  if (!wahl.teilEtikett.trim()) return "Der abgeteilte Teil braucht eine Bezeichnung.";

  const [fzgMit, fzgRest] = trenne(bogen.fahrzeuge, wahl.fahrzeuge);
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;

  if (nurStaerke) {
    const st = wahl.staerke;
    if (!st) return "Bitte die Stärke des abgeteilten Teils angeben.";
    if (st.fuehrer < 0 || st.unterfuehrer < 0 || st.mannschaft < 0) return "Negative Stärke geht nicht.";
    const ganz = staerke(bogen);
    if (st.fuehrer > ganz.fuehrer || st.unterfuehrer > ganz.unterfuehrer || st.mannschaft > ganz.mannschaft) {
      return `So viele sind nicht gemeldet (${ganz.fuehrer} / ${ganz.unterfuehrer} / ${ganz.mannschaft} / ${ganz.gesamt}).`;
    }
    const mit = summe(st);
    if (mit.gesamt === 0 && fzgMit.length === 0) return "Es geht niemand und nichts mit.";
    if (mit.gesamt === ganz.gesamt && fzgRest.length === 0) return "Beim Rest bliebe nichts übrig.";
    if (wahl.unterbringung) {
      const u = wahl.unterbringung;
      const ganzU = bogen.unterbringungManuell ?? { m: 0, w: 0, d: 0 };
      if (u.m < 0 || u.w < 0 || u.d < 0) return "Negative Unterbringungszahl geht nicht.";
      if (u.m > ganzU.m || u.w > ganzU.w || u.d > ganzU.d) {
        return `So viele sind nicht gemeldet (M ${ganzU.m} / W ${ganzU.w} / D ${ganzU.d}).`;
      }
    }
    if (wahl.verpflegung) {
      const v = wahl.verpflegung;
      const ganzV = bogen.verpflegungManuell ?? { vegetarisch: 0, vegan: 0 };
      if (v.vegetarisch < 0 || v.vegan < 0) return "Negative Verpflegungszahl geht nicht.";
      if (v.vegetarisch > ganzV.vegetarisch || v.vegan > ganzV.vegan) {
        return `So viele sind nicht gemeldet (${ganzV.vegetarisch} vegetarisch / ${ganzV.vegan} vegan).`;
      }
    }
    return null;
  }

  const [persMit, persRest] = trenne(bogen.personal, wahl.personal);
  if (persMit.length === 0 && fzgMit.length === 0) return "Es geht niemand und nichts mit.";
  if (persRest.length === 0 && fzgRest.length === 0) return "Beim Rest bliebe nichts übrig.";
  return null;
}

/**
 * Sofortbedarf verteilen: Kraftstoff bleibt beim Rest, die Verpflegungszahl
 * zieht mit der Stärke um (gedeckelt auf das, was gemeldet war), Unterbringung
 * und Ruhezeit gelten für beide Teile weiter (sie sind Ja/Nein, nicht teilbar).
 */
function teileSofortbedarf(
  sb: Sofortbedarf | undefined,
  gesamtAbgeteilt: number,
): { rest?: Sofortbedarf; abgeteilt?: Sofortbedarf } {
  if (!sb) return {};
  const mit = Math.min(gesamtAbgeteilt, sb.verpflegungPersonen);
  return {
    rest: { ...sb, verpflegungPersonen: sb.verpflegungPersonen - mit },
    abgeteilt: {
      verpflegungPersonen: mit,
      dieselLiter: 0,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: sb.unterbringung,
      ruhezeitErforderlich: sb.ruhezeitErforderlich,
    },
  };
}

/**
 * Bogen in Rest und abgeteilten Teil zerlegen. Beide bekommen denselben neuen
 * `stand` — sie beschreiben denselben Augenblick. Wirft bei ungültiger Auswahl
 * ({@link aufteilungFehler}), damit kein halb sinnvoller Bogen entsteht.
 */
export function teileBogen(bogen: Erfassungsbogen, wahl: AufteilungsWahl, stand: EebZeitpunkt): Teilung {
  const fehler = aufteilungFehler(bogen, wahl);
  if (fehler) throw new Error(fehler);

  const [persMit, persRest] = trenne(bogen.personal, wahl.personal);
  const [fzgMit, fzgRest] = trenne(bogen.fahrzeuge, wahl.fahrzeuge);
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;

  // Bei NUR_STAERKE zählen die eingegebenen Zahlen, sonst ergibt sich alles aus
  // dem verteilten Personal.
  const mitStaerke = nurStaerke ? summe(wahl.staerke!) : staerke({ personal: persMit });
  const ganzStaerke = staerke(bogen);
  const restStaerke: Staerke | undefined = nurStaerke
    ? {
        fuehrer: ganzStaerke.fuehrer - mitStaerke.fuehrer,
        unterfuehrer: ganzStaerke.unterfuehrer - mitStaerke.unterfuehrer,
        mannschaft: ganzStaerke.mannschaft - mitStaerke.mannschaft,
        gesamt: ganzStaerke.gesamt - mitStaerke.gesamt,
      }
    : undefined;

  const u = bogen.unterbringungManuell;
  const uMit = nurStaerke && u ? (wahl.unterbringung ?? { m: 0, w: 0, d: 0 }) : undefined;
  const v = bogen.verpflegungManuell;
  const vMit = nurStaerke && v ? (wahl.verpflegung ?? { vegetarisch: 0, vegan: 0 }) : undefined;

  const sb = teileSofortbedarf(bogen.sofortbedarf, mitStaerke.gesamt);

  return {
    rest: {
      ...bogen,
      stand,
      personal: persRest,
      fahrzeuge: fzgRest,
      staerkeManuell: restStaerke,
      unterbringungManuell: u && uMit ? { m: u.m - uMit.m, w: u.w - uMit.w, d: u.d - uMit.d } : u,
      verpflegungManuell:
        v && vMit
          ? { vegetarisch: v.vegetarisch - vMit.vegetarisch, vegan: v.vegan - vMit.vegan }
          : v,
      sofortbedarf: sb.rest,
    },
    abgeteilt: {
      ...bogen,
      stand,
      personal: persMit,
      fahrzeuge: fzgMit,
      staerkeManuell: nurStaerke ? mitStaerke : undefined,
      unterbringungManuell: uMit,
      verpflegungManuell: vMit,
      sofortbedarf: sb.abgeteilt,
    },
  };
}
