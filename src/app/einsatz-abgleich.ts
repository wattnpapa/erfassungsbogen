/**
 * Abgleich einer importierten Einsatz-Sammlung mit dem Stand dieses Geräts.
 *
 * Der geteilte Kern (`einsatzImportieren`, Submodul) führt nur über die
 * Eintrags-ID zusammen: Meldungen, die das Gerät noch nicht kennt, kommen
 * dazu, bekannte bleiben unberührt. Was die Führungsstelle des anderen Geräts
 * an bekannten Einheiten getan hat — Abrücken, Zug, Auftrag/Notiz,
 * Eintreffzeit —, ging beim Rückimport still verloren. Die Quittung sagte
 * „0 neue Meldung(en) ergänzt", und beide Geräte führten danach verschiedene
 * Lagen (Audit Runde 3, R3-W1).
 *
 * Diese Schicht legt sich um den Kern, ohne ihn zu ändern: Sie merkt sich den
 * Stand vor dem Import, lässt den Kern die neuen Meldungen anhängen und
 * gleicht danach je Einheit die Zusätze der Führungsstelle ab.
 *
 * Regel je Feld (Status samt Abrückzeit, Zug, Auftrag/Notiz, Eintreffzeit):
 *  1. Gleich → nichts zu tun.
 *  2. Den Verlauf der Führungsstelle (`vermerke`, mit Uhrzeit) tragen beide
 *     Stände mit. Hat nur eine Seite das Feld geändert, seit sich die Stände
 *     zuletzt kannten (Vermerk, den die andere Seite nicht hat), gilt diese.
 *  3. Haben beide Seiten es geändert, gilt der jüngere Vermerk — und der
 *     Abgleich nennt das als Widerspruch in der Quittung und im Verlauf der
 *     Einheit („Abgleich: …"), damit nichts still überschrieben wird.
 *  4. Ohne Vermerk (ältere Sammlungen, Zug aus einem Bündel): Ist der Wert
 *     hier leer, wird er übernommen. Für den Status zählt die Abrückzeit als
 *     Änderungszeitpunkt. Sonst bleibt der Wert dieses Geräts stehen, und der
 *     Unterschied wird als Widerspruch genannt.
 *
 * Kein Schemawechsel: die Felder sind die App-Zusätze aus eintrag-zeiten.ts,
 * die schon heute mit Sammel-PDF und Einsatz-Transport reisen.
 */

import {
  MeldeStatus,
  einsaetzeLaden,
  einsaetzePapierkorb,
  einsatzImportieren,
  type Einsatzsammlung,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { geltendeJeEinheit } from "./fassung-vorrang";
import { einheitAnzeigename } from "./hilfen";
import { sammlungenSchreiben, zeitKurz, type FuehrungsVermerk } from "./eintrag-zeiten";

export type Feld = "status" | "zug" | "notiz" | "eintreffzeit";

const FELD_NAME: Record<Feld, string> = {
  status: "Status",
  zug: "Zug",
  notiz: "Auftrag/Notiz",
  eintreffzeit: "Eintreffzeit",
};

/**
 * Zu welchem Feld gehört ein Vermerk? Die Texte schreibt eintrag-zeiten.ts
 * (`statusMitZeitSetzen`, `abrueckzeitSetzen`, `zugSetzen`, `notizSetzen`,
 * `eintreffzeitSetzen`); „Abgleich: …" gehört zu keinem Feld.
 */
export function vermerkFeld(text: string): Feld | null {
  if (/^(Abgerückt|Wieder als anwesend geführt|Status geändert|Abrückzeit korrigiert)/.test(text)) return "status";
  if (/^Zug/.test(text)) return "zug";
  if (/^Auftrag\/Notiz/.test(text)) return "notiz";
  if (/^Eintreffzeit korrigiert/.test(text)) return "eintreffzeit";
  return null;
}

/** Kennung eines Vermerks für den Vergleich zweier Stände. */
export function vermerkKennung(einheitSchl: string, v: FuehrungsVermerk): string {
  return `${einheitSchl}|${v.zeit}|${v.text}`;
}

/** Alle Vermerke einer Sammlung als Kennungen (je Einheit, über alle Fassungen). */
export function vermerkKennungen(eintraege: MeldeEintrag[]): Set<string> {
  const k = new Set<string>();
  for (const e of eintraege) for (const v of e.vermerke ?? []) k.add(vermerkKennung(e.einheitSchluessel, v));
  return k;
}

interface Seite {
  kopf: MeldeEintrag;
  vermerke: FuehrungsVermerk[];
  kennungen: Set<string>;
}

function seite(eintraege: MeldeEintrag[], schl: string): Seite | null {
  const eigene = eintraege.filter((e) => e.einheitSchluessel === schl);
  const kopf = geltendeJeEinheit(eigene)[0];
  if (!kopf) return null;
  const vermerke = vereinigeVermerke(eigene.map((e) => e.vermerke ?? []));
  return { kopf, vermerke, kennungen: new Set(vermerke.map((v) => vermerkKennung(schl, v))) };
}

function vereinigeVermerke(listen: FuehrungsVermerk[][]): FuehrungsVermerk[] {
  const gesehen = new Set<string>();
  const alle: FuehrungsVermerk[] = [];
  for (const l of listen) {
    for (const v of l) {
      const k = `${v.zeit}|${v.text}`;
      if (gesehen.has(k)) continue;
      gesehen.add(k);
      alle.push({ zeit: v.zeit, text: v.text });
    }
  }
  return alle.sort((a, b) => a.zeit - b.zeit);
}

/** Wert eines Felds als Vergleichs- und Anzeigegröße. */
interface Wert {
  gleichheit: string;
  text: string;
  leer: boolean;
}

/**
 * Vergleichswert eines Felds der Einheit (Status samt Abrückzeit, Zug, Auftrag,
 * Eintreffzeit) — Grundlage der Stände „was hat sich seit dem Export
 * geändert?" (export-stand.ts, R4-K1): Es zählt der Zustand, nicht die Zahl der
 * Vermerke, damit „Abrücken" und sein „Rückgängig" nichts Neues ergeben.
 */
export function feldGleichheit(feld: Feld, e: MeldeEintrag): string {
  return wert(feld, e).gleichheit;
}

function wert(feld: Feld, e: MeldeEintrag): Wert {
  switch (feld) {
    case "status": {
      const s = e.status;
      if (s === MeldeStatus.ABGERUECKT) {
        return {
          gleichheit: `1|${e.abgerueckAm ?? ""}`,
          text: e.abgerueckAm != null ? `abgerückt ${zeitKurz(e.abgerueckAm)}` : "abgerückt",
          leer: false,
        };
      }
      if (s === MeldeStatus.AUFGEGANGEN) return { gleichheit: "2", text: "zusammengeführt", leer: false };
      return { gleichheit: "0", text: "anwesend", leer: true };
    }
    case "zug":
      return e.zugEtikett
        ? { gleichheit: e.zugEtikett, text: `Zug „${e.zugEtikett}“`, leer: false }
        : { gleichheit: "", text: "ohne Zug", leer: true };
    case "notiz":
      return e.notiz
        ? { gleichheit: e.notiz, text: `Auftrag „${e.notiz}“`, leer: false }
        : { gleichheit: "", text: "ohne Auftrag", leer: true };
    case "eintreffzeit": {
      const t = e.eingetroffenAm ?? e.empfangenAm;
      return { gleichheit: String(t), text: `eingetroffen ${zeitKurz(t)}`, leer: false };
    }
  }
}

/** Änderungszeitpunkt des Status ohne Vermerk: Abrücken bzw. Zusammenführen. */
function statusZeit(e: MeldeEintrag): number | undefined {
  if (e.status === MeldeStatus.ABGERUECKT) return e.abgerueckAm;
  if (e.status === MeldeStatus.AUFGEGANGEN) return e.aufgegangenIn?.zusammengefuehrtAm;
  return undefined;
}

interface Entscheidung {
  von: "hier" | "datei";
  widerspruch: boolean;
}

function entscheide(feld: Feld, hier: Seite, datei: Seite): Entscheidung | null {
  if (wert(feld, hier.kopf).gleichheit === wert(feld, datei.kopf).gleichheit) return null;
  const neuSeit = (a: Seite, b: Seite) =>
    a.vermerke
      .filter((v) => vermerkFeld(v.text) === feld && !b.kennungen.has(vermerkKennung(b.kopf.einheitSchluessel, v)))
      .reduce<number | undefined>((m, v) => (m == null || v.zeit > m ? v.zeit : m), undefined);
  const hierT = neuSeit(hier, datei);
  const dateiT = neuSeit(datei, hier);
  if (dateiT != null && hierT == null) return { von: "datei", widerspruch: false };
  if (hierT != null && dateiT == null) return { von: "hier", widerspruch: false };
  if (hierT != null && dateiT != null) return { von: dateiT > hierT ? "datei" : "hier", widerspruch: true };
  // Ohne Vermerk auf beiden Seiten.
  if (feld === "status") {
    const h = statusZeit(hier.kopf);
    const d = statusZeit(datei.kopf);
    if (d != null && h == null) return { von: "datei", widerspruch: false };
    if (h != null && d == null) return { von: "hier", widerspruch: false };
    if (h != null && d != null) return { von: d > h ? "datei" : "hier", widerspruch: true };
    return { von: "hier", widerspruch: true };
  }
  const hierLeer = wert(feld, hier.kopf).leer;
  const dateiLeer = wert(feld, datei.kopf).leer;
  if (hierLeer && !dateiLeer) return { von: "datei", widerspruch: false };
  if (!hierLeer && dateiLeer) return { von: "hier", widerspruch: false };
  return { von: "hier", widerspruch: true };
}

/** Wert eines Felds von `quelle` auf `ziel` übertragen (Zug: alle Fassungen). */
function uebertrage(feld: Feld, quelle: MeldeEintrag, ziel: MeldeEintrag, alleFassungen: MeldeEintrag[]): void {
  switch (feld) {
    case "status":
      ziel.status = quelle.status;
      if (quelle.abgerueckAm != null) ziel.abgerueckAm = quelle.abgerueckAm;
      else delete ziel.abgerueckAm;
      if (quelle.aufgegangenIn) ziel.aufgegangenIn = { ...quelle.aufgegangenIn };
      else delete ziel.aufgegangenIn;
      break;
    case "zug":
      for (const e of alleFassungen) {
        if (quelle.zugEtikett) e.zugEtikett = quelle.zugEtikett;
        else delete e.zugEtikett;
      }
      break;
    case "notiz":
      if (quelle.notiz) ziel.notiz = quelle.notiz;
      else delete ziel.notiz;
      break;
    case "eintreffzeit":
      ziel.eingetroffenAm = quelle.eingetroffenAm ?? quelle.empfangenAm;
      break;
  }
}

/** Was sich an einer Einheit durch den Abgleich geändert hat. */
export interface AbgleichAenderung {
  einheitSchluessel: string;
  /** Kurzname der Einheit („Ulm", sonst Anzeigename). */
  einheit: string;
  /** Übernommene Werte, z. B. „abgerückt 20:47", „Zug „2. TZ“". */
  was: string[];
}

/** Beide Geräte haben dasselbe Feld geändert — der jüngere Stand gilt. */
export interface AbgleichWiderspruch {
  einheitSchluessel: string;
  einheit: string;
  feld: string;
  hier: string;
  datei: string;
  /** Welcher Wert jetzt gilt. */
  gilt: "hier" | "datei";
}

export interface AbgleichErgebnis {
  neuerEinsatz: boolean;
  /** Neu angehängte Meldungen (Kern). */
  hinzugefuegt: number;
  aktualisiert: AbgleichAenderung[];
  widersprueche: AbgleichWiderspruch[];
  /** Eintrags-IDs, die durch den Import hierher kamen. */
  neueIds: string[];
  /** Vermerk-Kennungen, die durch den Import hierher kamen oder dabei entstanden. */
  neueVermerke: string[];
  /**
   * Je Einheit die Felder, deren Wert jetzt dem der Datei entspricht — das
   * andere Gerät kennt sie (R4-W7). Wo hier ein anderer Wert gilt (Widerspruch,
   * hier behalten), fehlt das Feld: das hat das andere Gerät noch nicht.
   */
  bekannt: Record<string, Partial<Record<Feld, string>>>;
}

function kurzname(e: MeldeEintrag): string {
  const ort = e.bogen.einheit.hierarchie[0]?.name?.trim();
  const basis = ort || einheitAnzeigename(e.bogen.einheit);
  return e.teilEtikett ? `${basis} (${e.teilEtikett})` : basis;
}

function alleSammlungen(): Einsatzsammlung[] {
  return [...einsaetzeLaden(), ...einsaetzePapierkorb()];
}

export const FELDER: Feld[] = ["status", "zug", "notiz", "eintreffzeit"];

/**
 * Sammlung importieren und mit dem Stand dieses Geräts abgleichen. Ersetzt
 * überall dort, wo eine Sammlung von einem anderen Gerät kommt, den direkten
 * Aufruf von `einsatzImportieren`.
 */
export function einsatzAbgleichen(importiert: Einsatzsammlung, jetzt = Date.now()): AbgleichErgebnis {
  const vorherRoh = alleSammlungen().find((s) => s.id === importiert.id);
  // Tiefe Kopie: der Kern verändert die geladene Liste nicht, aber wir lesen
  // danach neu und wollen den Stand VOR dem Import sicher in der Hand haben.
  const vorher: Einsatzsammlung | undefined = vorherRoh ? JSON.parse(JSON.stringify(vorherRoh)) : undefined;
  const r = einsatzImportieren(importiert);
  const ergebnis: AbgleichErgebnis = {
    neuerEinsatz: r.neuerEinsatz,
    hinzugefuegt: r.hinzugefuegt,
    aktualisiert: [],
    widersprueche: [],
    neueIds: [],
    neueVermerke: [],
    bekannt: {},
  };
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === importiert.id);
  if (!s) return ergebnis;
  const vorherIds = new Set(vorher?.eintraege.map((e) => e.id) ?? []);
  ergebnis.neueIds = s.eintraege.filter((e) => !vorherIds.has(e.id)).map((e) => e.id);
  // Was die Datei an Zuständen trägt und hier jetzt genauso gilt (R4-W7).
  const bekanntBuchen = () => {
    for (const schl of new Set(importiert.eintraege.map((e) => e.einheitSchluessel))) {
      const datei = seite(importiert.eintraege, schl);
      const jetztKopf = seite(s.eintraege, schl);
      if (!datei || !jetztKopf) continue;
      const felder: Partial<Record<Feld, string>> = {};
      for (const feld of FELDER) {
        const g = feldGleichheit(feld, jetztKopf.kopf);
        if (g === feldGleichheit(feld, datei.kopf)) felder[feld] = g;
      }
      ergebnis.bekannt[schl] = felder;
    }
  };
  if (!vorher) {
    ergebnis.neueVermerke = [...vermerkKennungen(s.eintraege)];
    bekanntBuchen();
    return ergebnis;
  }
  const vorherVermerke = vermerkKennungen(vorher.eintraege);

  const einheiten = new Set(importiert.eintraege.map((e) => e.einheitSchluessel));
  let geschrieben = false;
  // Welche Fassung gilt, hat womöglich das andere Gerät entschieden (R4-W1):
  // ein dort bestätigter Vorrang kommt mit, solange hier keiner gesetzt ist.
  for (const e of importiert.eintraege) {
    if (e.ersetztDurch == null) continue;
    const lokal = s.eintraege.find((x) => x.id === e.id);
    if (!lokal || lokal.ersetztDurch != null) continue;
    lokal.ersetztDurch = e.ersetztDurch;
    if (e.ersetztAm != null) lokal.ersetztAm = e.ersetztAm;
    geschrieben = true;
  }
  for (const schl of einheiten) {
    const hier = seite(vorher.eintraege, schl);
    const datei = seite(importiert.eintraege, schl);
    if (!hier || !datei) continue; // nur hier oder nur in der Datei: nichts abzugleichen
    const fassungen = s.eintraege.filter((e) => e.einheitSchluessel === schl);
    const ziel = geltendeJeEinheit(fassungen)[0];
    if (!ziel) continue;
    const vorZiel = JSON.stringify(ziel) + fassungen.map((e) => e.zugEtikett ?? "").join("|");
    const was: string[] = [];
    const notizen: FuehrungsVermerk[] = [];
    for (const feld of FELDER) {
      const ent = entscheide(feld, hier, datei);
      if (!ent) continue; // beide Köpfe gleich — der neue Kopf ist einer davon
      // Gilt der Wert dieses Geräts, muss er trotzdem auf den neuen Kopf: kam
      // mit der Datei eine Folgemeldung, trägt sie den Stand des anderen Geräts.
      uebertrage(feld, ent.von === "hier" ? hier.kopf : datei.kopf, ziel, fassungen);
      const hierWert = wert(feld, hier.kopf).text;
      const dateiWert = wert(feld, datei.kopf).text;
      if (ent.von === "datei") was.push(dateiWert);
      if (ent.widerspruch) {
        ergebnis.widersprueche.push({
          einheitSchluessel: schl,
          einheit: kurzname(ziel),
          feld: FELD_NAME[feld],
          hier: hierWert,
          datei: dateiWert,
          gilt: ent.von,
        });
        notizen.push({
          zeit: jetzt,
          text:
            `Abgleich mit anderem Gerät: ${FELD_NAME[feld]} dort ${dateiWert}, hier ${hierWert} — ` +
            (ent.von === "datei" ? "von dort übernommen (jünger)" : "hier behalten"),
        });
      }
    }
    const vermerke = vereinigeVermerke([hier.vermerke, datei.vermerke, ziel.vermerke ?? [], notizen]);
    if (vermerke.length > 0) ziel.vermerke = vermerke;
    if (was.length > 0) ergebnis.aktualisiert.push({ einheitSchluessel: schl, einheit: kurzname(ziel), was });
    if (JSON.stringify(ziel) + fassungen.map((e) => e.zugEtikett ?? "").join("|") !== vorZiel) geschrieben = true;
  }
  if (geschrieben) {
    s.geaendert = jetzt;
    sammlungenSchreiben(liste);
  }
  ergebnis.neueVermerke = [...vermerkKennungen(s.eintraege)].filter((k) => !vorherVermerke.has(k));
  bekanntBuchen();
  return ergebnis;
}

/**
 * Quittungstext für den Abgleich: „3 Meldungen aktualisiert: Ulm abgerückt
 * 20:47; Biberach Zug „2. TZ“." und — falls vorhanden — die Widersprüche.
 * Leer, wenn nichts abzugleichen war.
 */
export function abgleichText(r: Pick<AbgleichErgebnis, "aktualisiert" | "widersprueche">): string {
  const teile: string[] = [];
  if (r.aktualisiert.length > 0) {
    const n = r.aktualisiert.length;
    teile.push(
      `${n === 1 ? "1 Meldung" : `${n} Meldungen`} aktualisiert: ` +
        r.aktualisiert.map((a) => `${a.einheit} ${a.was.join(", ")}`).join("; ") +
        ".",
    );
  }
  if (r.widersprueche.length > 0) {
    const n = r.widersprueche.length;
    teile.push(
      `${n === 1 ? "1 Widerspruch" : `${n} Widersprüche`} zwischen den Geräten: ` +
        r.widersprueche
          .map(
            (w) =>
              `${w.einheit} ${w.feld} — hier ${w.hier}, in der Datei ${w.datei}; ` +
              (w.gilt === "datei" ? "der jüngere Stand aus der Datei gilt" : "der Stand dieses Geräts bleibt"),
          )
          .join("; ") +
        ". Bitte prüfen (steht auch im Verlauf der Einheit).",
    );
  }
  return teile.join(" ");
}

/**
 * Sammlung eines anderen Geräts (z. B. die Sammel-PDF des Zugführers) für die
 * Übernahme in eine ANDERE, laufende Sammlung vorbereiten: dieselben
 * Meldungen mit Eintreffzeit, Status, Auftrag, Siegel und Verlauf, aber unter
 * der Kennung des Ziels — `einsatzAbgleichen` legt sie dann dort ab, statt
 * eine zweite Sammlung anzulegen (Audit Runde 3, R3-W3). Einheiten, die im
 * Ziel noch fehlen und keinen Zug tragen, bekommen `zug` (Vorschlag: der
 * Name der Quell-Sammlung, „1. TZ Albstadt"), mit Vermerk. Bekannte Einheiten
 * behalten ihren Zug — den gleicht der Abgleich nach seinen Regeln ab.
 */
export function sammlungFuerZiel(
  quelle: Einsatzsammlung,
  ziel: Einsatzsammlung,
  zug = "",
  jetzt = Date.now(),
): Einsatzsammlung {
  const bekannt = new Set(ziel.eintraege.map((e) => e.einheitSchluessel));
  const eintraege: MeldeEintrag[] = JSON.parse(JSON.stringify(quelle.eintraege));
  const wert = zug.trim();
  if (wert) {
    const neueEinheiten = new Set(
      eintraege.filter((e) => !bekannt.has(e.einheitSchluessel) && !e.zugEtikett).map((e) => e.einheitSchluessel),
    );
    for (const schl of neueEinheiten) {
      const fassungen = eintraege.filter((e) => e.einheitSchluessel === schl);
      if (fassungen.some((e) => e.zugEtikett)) continue;
      for (const e of fassungen) e.zugEtikett = wert;
      const kopf = geltendeJeEinheit(fassungen)[0];
      if (kopf) (kopf.vermerke ??= []).push({ zeit: jetzt, text: `Zug: ${wert} (aus Sammlung „${quelle.name}“ übernommen)` });
    }
  }
  return { ...ziel, eintraege };
}
