/**
 * Oberfläche für „Einsatz-Sammlung" (Meldekopf/Zugführer):
 *  - EinsatzListe: Kartenliste der Einsätze auf dem Startbildschirm.
 *  - EinsatzDetail: Summen über die anwesenden Einheiten, Einheitenliste mit
 *    Status (anwesend/abgerückt) und aufklappbarer Revisions-Historie, Bögen
 *    hinzufügen (Scan / manuell), Einsatz löschen.
 *
 * Reine Anzeige + Aufruf der Store-/Auswertungslogik (einsaetze.ts, auswertung.ts).
 */

import { Fragment, Suspense, lazy, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { DaumenQuittung } from "./daumen-quittung";
import { useJuengsteQuittung } from "./juengste-quittung";

const ImportHinweis = lazy(() => import("./import-hinweis"));
const AuftragQuittung = lazy(() => import("./auftrag-quittung"));
// Papierkorb der entfernten Meldungen (R17-E2): erscheint nur, wenn etwas darin liegt, und bleibt aus dem Startbündel.
const EntfernteMeldungenBlock = lazy(() => import("./entfernte-meldungen-block"));
/** So viele Tage liegt eine entfernte Meldung im Papierkorb (gleich `MELDUNGEN_PAPIERKORB_TAGE`; ein Test hält beide gleich). */
export const PAPIERKORB_TAGE = 7;
/** Liegt in diesem Papierkorb etwas für diese Sammlung? Billige Vorprüfung, ohne den Block zu laden. */
function papierkorbGefuellt(einsatzId: string): boolean {
  try {
    return (localStorage.getItem("eeb.meldungen-papierkorb.v1") ?? "").includes(`"${einsatzId}"`);
  } catch {
    return false;
  }
}
const NeuereEingabe = lazy(() => import("./neuere-eingabe"));
// Der Block „Lagemonitor für den Fernseher" liegt am Ende der Ansicht und gehört nicht ins Startbündel (R17-K3 gab dem Monitor Zeilen).
const LagemonitorBlock = lazy(() => import("./lagemonitor-ui").then((m) => ({ default: m.LagemonitorBlock })));
import { ORTSSPERRE_MS, PRELLSCHUTZ_MS, QUITTUNG_SPERRE_KURZ_MS, ortSperren } from "./tipp-schutz";
import {
  MINUTEN_JE_TAG,
  PersonalErfassung,
  datumZuIso,
  jetztZeitpunkt,
  staerke,
  unterbringungMWD,
  verpflegung,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";
import { datenschutzfristAbgelaufen } from "@bos/eeb-format/datenschutzfrist";
import { datenschutzZeitpunkt, stempelZeitpunkt } from "./datenschutz-uhr";
import {
  datumDeutsch,
  einheitAnzeigename,
  funkrufText,
  funktionsText,
  kennzeichenText,
  orgLabel,
  nurSollstaerke,
  vokabText,
  vokabularFuer,
  zeitpunktDeutsch,
  staerkePlausibilitaet,
  datumAnzeige,
} from "./hilfen";
import { diffKurzfassung, type WertAenderung } from "@bos/meldekopf/meldung-diff";
import { bogenDiff } from "./diff-lage";
import {
  EinsatzArt,
  MeldeStatus,
  einsatzEndgueltigLoeschen,
  einsatzLoeschen,
  meldungAufteilen,
  meldungenZusammenfuehren,
  meldungEntfernen,
  einsatzImportieren,
  tageBisAufraeumen,
  stammSchluessel,
  type AufteilungOptionen,
  type Einsatzsammlung,
  type MeldeEintrag,
  type ZusammenfuehrungOptionen,
} from "@bos/meldekopf/einsaetze";
import { einsatzWiederherstellen, ruhtSchonLange } from "./einsatz-wiederherstellen";
import { angabenVermerken, fassungGiltSetzen, fassungObenauf, fassungenJeEinheit, geltendeJeEinheit, istVerdraengt, nachgereichterBogen } from "./fassung-vorrang";
import { ausgelasseneMeldungen, einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import { UnlesbarHinweis } from "./unlesbar-hinweis";
import { unlesbarBestand } from "./unlesbar";
import { koepfeJe, revisionenJe } from "./einheiten-index";
import { aehnlicherOrt, andererEinheitstyp } from "./nacherfassung";
import { vorhandeneZuege, zugNormalisiert } from "./zug-name";
import { einheitOrt } from "@bos/meldekopf/darstellung";
import { RolleMarke } from "./rolle-marke";
import { fortschrittSatz, sammelPdfDauerText, tippWaehrendLauf, useArbeitet, useArbeitFortschritt } from "./arbeitet";
import { useMinutenTakt } from "./minuten-takt";
import { AUSGABE_SPERRE_MS, ausgabeFreiBeiTipp } from "./ausgabe-sperre";
import { verloreneEingabeText } from "./eingabe-verloren";
import { loeschenErfassungSatz } from "./einsatz-geloescht";
import { angabenAlterWort, angabenZeit } from "./angaben-alter";
import { alterText, anwesendenAlter, anwesendenAlterText, bedarfOhneAngabeHinweis, bedarfOhneAngabeText, kraftstoffTeile, personenText, zugAlterText } from "./lagemonitor";
import { AufteilenPanel } from "./aufteilen-ui";
import { ZusammenfuehrenPanel } from "./zusammenfuehren-ui";
import type { AufteilungsWahl } from "@bos/meldekopf/aufteilen";
import { absenderLabel, type Absenderkarte } from "@bos/eeb-format/signatur";
import { AbsenderKontakt, KontaktLink, PersonKontakt } from "./kontakt-link";
import { ANONYM_ERKLAERUNG } from "./anonym-hinweis";
import { STAND_NACH_EINTREFFEN_TEXT, standLiegtNachEintreffen } from "./stand-uhr";
import { staerkeSummeZeile } from "./staerke-summe";
import { aggregiere, aggregiereNachZug, aktuelleMeldungen, bedarfNichtErfasst, mwdText, uebungenAusserhalbDerLage, verpflegungBogenText, verpflegungText, type EinsatzSummen } from "./auswertung";
import {
  SORTIERUNGEN,
  passtZuLueckenfilter,
  passtZuStatusfilter,
  type StatusFilter,
  einheitenAnsicht,
  personenMitQualifikation,
  qualifikationenImEinsatz,
  type EinheitenSortierung,
  type LueckenFilter,
} from "./einheiten-liste";
import { debugAktiv } from "./debug-plattform";
import { datumZweistellig, papierkorbRest } from "./papierkorb-frist";
import { Auswahl, NAMEN_EINGABE, STAERKE_LEGENDE } from "./schritte/bausteine";
import { SeitenKopf } from "./seiten-kopf";
import { AnzeigeLeistenKnopf, AnzeigeSchalter } from "./anzeige-schalter";
import {
  SpeicherVollFehler,
  istSpeicherVoll,
  abrueckzeitSetzen,
  eintreffzeit,
  eintreffzeitSetzen,
  einheitEntfernen,
  einheitVerschieben,
  einsatzKopfSetzen,
  notizSetzen,
  meldungAufnehmen,
  zugSetzen,
  HERKUNFT_TEXT,
  statusMitZeitSetzen,
  zeitKurz,
  zeitLang,
  zeitUnstimmigkeit,
  zeitpunktZuMs,
  zusammenfuehrungZurueck,
  type ZusammenfuehrungVorher,
} from "./eintrag-zeiten";
import { frageFelder, frageJaNein, frageWahl, zeigeHinweis } from "./dialoge";
import { nurStaerkeUebernehmen } from "./nur-staerke";
import { PapierAbgleich, PapierMarke } from "./papier-abgleich-ui";
import { abgleichEntwurfAufraeumen, abgleichEntwurfLoeschen } from "./papier-abgleich-entwurf";
import { SOLL_NICHT_GEMELDET } from "./soll-text";
import { karteOffenMerken, karteWarOffen } from "./ansicht-stelle";
import type { PapierkorbMeldung } from "./meldungs-papierkorb";
import { standAbsenderVermerken, standDesAbsenders } from "./stand-absender";
import { ortBilligen, ortIstGebilligt } from "./ort-gebilligt";
import { gezaehltWegBeobachten, gezaehltWegFuer, gezaehltWegVergessen, gezaehltZuruecknehmen } from "./gezaehlt-weg";
import { TabellenScroll } from "./tabellen-scroll";
import {
  TABELLEN_SPALTEN,
  ausgeblendetText,
  einheitenAnwesend,
  bedarfMarken,
  gemerkteAnsicht,
  gemerkteAlleSpalten,
  merkeAlleSpalten,
  ORT_REGEL,
  abweichenderOrt,
  letzteMeldung,
  frischGemeldet,
  istNeu,
  lueckenText,
  pruefpunkteEintrag,
  folgeAenderung,
  vergleichKurztext,
  einheitenZahl,
  rueckkehrText,
  meldungsNummern,
  entfernenNummernText,
  sollstaerkeAnteil,
  passtZuBedarfsfilter,
  type BedarfsFilter,
  merkeAnsicht,
  standIstAlt,
  summenBeschriftung,
  tabellenSumme,
  tabellenZaehlung,
  tabellenZeilen,
  weicheTrennstellen,
  zeilenSortieren,
  type EinheitenAnsicht,
  type Sortierrichtung,
  type SpaltenDefinition,
  type TabellenSpalte,
  type TabellenZeile,
} from "./einheiten-tabelle";
import { imWebBrowser } from "./nativ";
import { aufgeraeumteLaden, aufgeraeumteQuittieren } from "./aufraeum-hinweis";
import { useZahlQuittung } from "./quittung";
import { mitAbgang, useEingangsquittung } from "./eintrag-bewegung";
import { AbgangKnopf, Kartenstapel } from "./kartenstapel";
import { istBilddatei } from "./qr-stapel";
import { fehlerText } from "./nachladen";
import { PAPIERKORB_LEER_RAT } from "./speicher-fehler-text";
import { widerspruchLaden, widerspruchMerken, widerspruchVergessen } from "./widerspruch-merker";
import { entfernteMerken, entfernteVergessen } from "./entfernte-meldungen";
import {
  EXPORT_ZIELE,
  EXPORT_ZIEL_NAME,
  exportStaendeLaden,
  exportZeitKurz,
  letzterStandMit,
  exportVorhanden,
  kenntnisStandLaden,
  kenntnisVermerken,
  kenntnisVermerkenGeprueft,
  kenntnisWiederherstellen,
  lageblattStandLaden,
  nachtragEintraege,
  neueEintraege,
  neuZurKenntnis,
  seitdemText,
  weitergabeStandLaden,
  aenderungenSeit,
  aenderungText,
  type ExportStand,
  type ExportUmfang,
  type ExportZiel,
} from "./export-stand";

/** Zeichen des Auftrags auf der zugeklappten Karte (R8-K3): der Auftrag steht bis hierhin ungekürzt da. */
const AUFTRAG_KARTE_MAX = 80;

export const ART_LABEL: Record<EinsatzArt, string> = {
  [EinsatzArt.EINSATZ]: "Einsatz",
  [EinsatzArt.UEBUNG]: "Übung",
  [EinsatzArt.VERANSTALTUNG]: "Veranstaltung",
};

/** Überschrift über den nicht anwesenden Karten am Ende der Liste: „Abgerückt (2)" bzw. mit zusammengeführten Einheiten (R17-K4). */
export function abgerueckteUeberschrift(liste: readonly Pick<MeldeEintrag, "status">[]): string {
  const rest = liste.filter((e) => e.status !== MeldeStatus.ANWESEND);
  return `${rest.every((e) => e.status === MeldeStatus.ABGERUECKT) ? "Abgerückt" : "Abgerückt oder zusammengeführt"} (${rest.length})`;
}

/**
 * Herkunft der Meldung an der Karte, in Worten, die ohne Einweisung tragen:
 * „Empfangen“ allein sagte nicht, von wem und wie (Audit Runde 4, R4-N4). Die
 * CSV führt weiter HERKUNFT_TEXT.
 */
const QUELLE_LABEL: Record<keyof typeof HERKUNFT_TEXT, string> = {
  scan: "von der Einheit empfangen, per Scan oder Link",
  manuell: "am Meldekopf von Hand erfasst",
  "pdf-import": "aus Datei übernommen",
  aufteilung: "aus einer Aufteilung",
  zusammenfuehrung: "aus einer Zusammenführung",
};

/**
 * Herkunft der geltenden Fassung. Eine am Meldekopf geänderte Fassung (Stärke ändern, Übung umstellen) einer
 * eingelesenen Einheit bleibt „aus Datei, …": „von Hand erfasst" stimmte nicht, die Einheit wurde gescannt (R15-A1).
 */
export function quelleText(kopf: Pick<MeldeEintrag, "quelle" | "angaben">, fassungenNeuesteZuerst: Pick<MeldeEintrag, "quelle">[]): string {
  if (kopf.quelle !== "manuell" && kopf.angaben) return `${QUELLE_LABEL[kopf.quelle]}, am Meldekopf von Hand geändert`;
  const erste = fassungenNeuesteZuerst[fassungenNeuesteZuerst.length - 1];
  if (kopf.quelle !== "manuell" || !erste || erste.quelle === "manuell") return QUELLE_LABEL[kopf.quelle];
  return `${QUELLE_LABEL[erste.quelle]}, am Meldekopf von Hand geändert`;
}

/**
 * Eine Schreibaktion auf die Sammlung ausführen und einen vollen Speicher dem
 * Nutzer sagen, statt ihn zu verschlucken: Ein Statuswechsel, der still nicht
 * gespeichert wurde, ist am Meldekopf schlimmer als eine Fehlermeldung — die
 * Anzeige sagt „abgerückt", der Speicher sagt „anwesend", und beim nächsten
 * Laden stimmt die Lage nicht mehr. Liefert, ob geschrieben wurde.
 */
async function gesichert(titel: string, aktion: () => void, merke?: string, papierkorbLeer = false): Promise<boolean> {
  try {
    aktion();
    return true;
  } catch (e) {
    // R13-O3: Bei vollem Speicher und leerem Papierkorb passt „Papierkorb leeren" nicht.
    const voll = e instanceof SpeicherVollFehler || istSpeicherVoll(e);
    const grund =
      papierkorbLeer && voll ? PAPIERKORB_LEER_RAT : e instanceof SpeicherVollFehler ? e.message : fehlerText(e);
    // `merke`: was der Helfer eingegeben hatte und das der Dialog nicht mehr
    // zeigt — so lässt es sich auf den Meldeblock schreiben, bevor Platz
    // geschaffen und neu eingegeben wird (Audit Runde 5, R5-E7).
    await zeigeHinweis({
      titel,
      text: merke ? (
        <>
          <p>{grund}</p>
          <p><strong>{merke}</strong></p>
        </>
      ) : grund,
    });
    return false;
  }
}

/**
 * Schließt einen Inline-Editor erst, wenn der laufende Tipp zu Ende ist (Klick auf den Knopf, auf den der
 * Fokus gewandert ist), spätestens nach 1,5 s — etwa wenn der Finger vom Knopf weggezogen wird (R11-W3).
 */
export const EDITOR_NACHLAUF_MS = 1500;
function nachKlickSchliessen(schliessen: () => void): void {
  let erledigt = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fertig = () => {
    if (erledigt) return;
    erledigt = true;
    document.removeEventListener("click", fertig);
    if (timer !== undefined) clearTimeout(timer);
    schliessen();
  };
  document.addEventListener("click", fertig);
  timer = setTimeout(fertig, EDITOR_NACHLAUF_MS);
}

/** Zeitpunkt → Wert eines datetime-local-Felds (Ortszeit, ohne Sekunden). */
function zuDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const zwei = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}T${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
}

/** Wert eines datetime-local-Felds → Zeitpunkt; null bei leerem/ungültigem Feld. */
function ausDatetimeLocal(wert: string): number | null {
  if (!wert.trim()) return null;
  const ms = new Date(wert).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Ein von Hand gesetzter Statuswechsel — die Quittung dafür steht in der
 * Einsatzansicht, mit Uhrzeit und Rückweg (Zerstörende-Handlungen-Audit D4).
 */
export interface StatusWechsel {
  /** Die Meldung VOR dem Wechsel — der Rückweg stellt genau diesen Stand her. */
  vorher: MeldeEintrag;
  status: MeldeStatus;
  zeit: number;
}

/** Kurzes Signatur-Etikett für eine Meldung (leer, wenn unsigniert empfangen). */
function signaturBadge(e: MeldeEintrag) {
  if (!e.signatur) return null;
  if (e.signatur.zustand === "gueltig") {
    return (
      <span className="signatur-badge gueltig" title={`Öffentlicher Schlüssel: ${e.signatur.pubkey ?? ""}`}>
        ✓ signiert {e.signatur.kurzform ?? ""}
      </span>
    );
  }
  return <span className="signatur-badge ungueltig" title="Signatur passt nicht zu den Daten">⚠ Signatur ungültig</span>;
}

/**
 * Marke „⚠ Signatur ungültig" im Kopf der Karte und im Zeilenkopf der
 * Tabelle. Sie stand nur in der aufgeklappten Karte; zugeklappt und in der
 * Tabelle sah ein Bogen mit gebrochener Signatur aus wie jeder andere (Audit
 * Runde 3, R3-L2). Zeichen, Wort und Rahmen tragen auch in Graustufen.
 * Gültig signierte Bögen brauchen keine Marke.
 */
function SignaturWarnung({ eintrag }: { eintrag: MeldeEintrag }) {
  if (eintrag.signatur?.zustand !== "ungueltig") return null;
  return (
    <span className="signatur-badge ungueltig signatur-marke" title="Signatur passt nicht zu den Daten — der Bogen kann unterwegs verändert worden sein">
      ⚠ Signatur ungültig
    </span>
  );
}

/** „seitdem keine neuen Bögen" / „seitdem 1 neuer Bogen und 1 Änderung (Abrücken)" — für die Zeile je Format (R4-W2, R4-K1). */
function seitdemBoegenText(eintraege: MeldeEintrag[], stand: ExportStand): string {
  const neu = neueEintraege(eintraege, stand).length;
  const aend = aenderungText(aenderungenSeit(eintraege, stand));
  const teile = [...(neu > 0 ? [neu === 1 ? "1 neuer Bogen" : `${neu} neue Bögen`] : []), ...(aend ? [aend] : [])];
  return `seitdem ${teile.length > 0 ? teile.join(" und ") : "keine neuen Bögen"}`;
}

/** „Lageblatt Mo., 16:30 (seitdem 1 neue Meldung) · Export: noch keiner" — für die Startseitenkarte (R2-A3). */
function ausgabeStandText(s: Einsatzsammlung): string {
  // Neue Meldungen UND Änderungen an bekannten Einheiten (Abrücken, Zug,
  // Auftrag, Eintreffzeit) — wie die Weitergabe (R4-K1).
  const seit = (stand: ExportStand) => seitdemText(neueEintraege(s.eintraege, stand).length, aenderungenSeit(s.eintraege, stand));
  const teil = (was: string, stand: ExportStand | null, keiner: string) =>
    stand ? `${was} ${exportZeitKurz(stand.zeitpunkt)} (${seit(stand)})` : `${was}: ${keiner}`;
  // Weitergabe der ganzen Sammlung nur, wenn es eine gab: an ihr erkennt man
  // auf der Startseite die an die nächste Schicht übergebene Lage (R2-W5).
  const weitergabe = weitergabeStandLaden(s.id);
  // Exporte je Format (R4-W2): nur die, die es gab, sonst „noch keiner".
  const staende = exportStaendeLaden(s.id);
  const exporte = EXPORT_ZIELE.filter((z) => staende[z]).map((z) => `${EXPORT_ZIEL_NAME[z]} ${exportZeitKurz(staende[z]!.zeitpunkt)} (${seit(staende[z]!)})`);
  // Ein veraltetes Blatt sagt es auch hier: „… — neu drucken" (R8-W6).
  const lbStand = lageblattStandLaden(s.id);
  const lbVeraltet = lbStand != null && (neueEintraege(s.eintraege, lbStand).length > 0 || aenderungenSeit(s.eintraege, lbStand).anzahl > 0);
  return [
    teil("Lageblatt", lbStand, "noch keins") + (lbVeraltet ? " — neu drucken" : ""),
    exporte.length > 0 ? `Export ${exporte.join(", ")}` : "Export: noch keiner",
    ...(weitergabe ? [weitergabeTeil(s, weitergabe)] : []),
  ].join(" · ");
}

/** „Weitergegeben … (seitdem 1 neue Meldung und 1 Änderung (Abrücken))" — Änderungen an bekannten Einheiten zählen mit (R3-W2). */
function weitergabeTeil(s: Einsatzsammlung, stand: ExportStand): string {
  return `Weitergabe-Datei erzeugt ${exportZeitKurz(stand.zeitpunkt)}, Empfang nicht bestätigt (${seitdemText(neueEintraege(s.eintraege, stand).length, aenderungenSeit(s.eintraege, stand))})`;
}

/** Ab diesem Alter der letzten Meldung warnt die App wie der Lagemonitor („Lage ist alt", R10-K1). */
const VERALTET_MIN = 60;

/**
 * „04.10.2026, 21:17 (vor 5 Std 1 Min)" mit Warnzeichen ab einer Stunde — dieselbe Regel und dieselbe
 * Funktion (`alterText`) wie im Lagemonitor: Die Zahlen sollen nicht gleich verlässlich wirken, ob sie
 * vor einer Minute oder vor fünf Stunden gemeldet wurden (R10-K1).
 */
export function meldeZeitMitAlter(letzte: number, jetzt = Date.now()): { text: string; veraltet: boolean } {
  const veraltet = jetzt - letzte >= VERALTET_MIN * 60_000 || letzte - jetzt > 5 * 60_000;
  return { text: `${veraltet ? "⚠ " : ""}${zeitLang(letzte)} (${alterText(letzte, jetzt)})`, veraltet };
}

/**
 * „⚠ älteste Meldung vor 8 Std 20 Min, 5 von 6 älter als 1 Std" — das Alter der Meldungen, auf denen die
 * Stärke der Anwesenden beruht. „Letzte Meldung vor 1 Min" allein verdeckte, dass eine frische abgerückte
 * Einheit die jüngste war und alle anwesenden Stunden alt (R11-K1). `null`, solange keine anwesende Einheit
 * älter als eine Stunde ist.
 */
export function aeltesteAnwesendeText(s: Einsatzsammlung, jetzt = Date.now()): string | null {
  const text = anwesendenAlterText(anwesendenAlter(aktuelleMeldungen(s.eintraege, s.art), jetzt), jetzt);
  return text ? `⚠ ${text}` : null;
}

/**
 * „Letzte Meldung 04.10.2026, 21:17 · 3 neu seit der letzten Kenntnisnahme"
 * — für die Startseitenkarte (Audit Runde 3, R3-K5).
 */
export function letzteMeldungText(s: Einsatzsammlung): string {
  const letzte = letzteMeldung(s.eintraege);
  // Was die App nicht anzeigen kann, zählt mit: „Noch keine Meldung" gilt nur für eine wirklich leere Sammlung (R7-E2).
  const nichtLesbar = ausgelasseneMeldungen(s.id) + (unlesbarBestand()?.meldungen.filter((m) => m.sammlungId === s.id).length ?? 0);
  const unlesbarZusatz = nichtLesbar > 0 ? `${nichtLesbar} ${nichtLesbar === 1 ? "Meldung" : "Meldungen"} nicht lesbar — Daten sichern` : "";
  if (letzte == null) return unlesbarZusatz ? `Keine lesbare Meldung · ${unlesbarZusatz}.` : "Noch keine Meldung.";
  const stand = kenntnisStandLaden(s.id);
  const neu = stand ? neuZurKenntnis(s.eintraege, stand).length : 0;
  const aelteste = aeltesteAnwesendeText(s);
  return `Letzte Meldung ${meldeZeitMitAlter(letzte).text}${aelteste ? ` · ${aelteste}` : ""}${neu > 0 ? ` · ${neu} neu seit der letzten Kenntnisnahme` : ""}${unlesbarZusatz ? ` · ${unlesbarZusatz}` : ""}`;
}

/**
 * Kurzfassung für den Schnelleinstieg der Startseite, im Minutentakt (R14-O1): nur die Zeit der letzten Meldung. Die
 * ausführliche Zeile (älteste Meldung, neu seit der Kenntnisnahme) steht einmal in der Liste darunter (R16-N2).
 */
export function LetzteMeldungZeit({ s }: { s: Einsatzsammlung }) {
  useMinutenTakt();
  const letzte = letzteMeldung(s.eintraege);
  return <>{letzte == null ? letzteMeldungText(s) : `Letzte Meldung ${meldeZeitMitAlter(letzte).text}`}</>;
}

/** Kalendertag der Geräteuhr: „28.09.2026". */
function tagText(ms: number): string {
  return datumZweistellig(ms);
}

function staerkeText(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

function summenStaerkeText(sum: EinsatzSummen): string {
  const s = sum.staerke;
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

/**
 * Stand lesbar: „28.09.2026, 14:42" statt der Zeitgruppe „281442sep26", die
 * ein Neuling nicht auf Anhieb liest (Audit Runde 2, R2-N4).
 */
function standText(b: Erfassungsbogen): string {
  return zeitpunktDeutsch(b.stand);
}

/**
 * Was gerade in dieser Sammlung eingegangen ist: der Schlüssel der Einheit
 * plus ein Zähler. Der Zähler ist der Unterschied zwischen „schon da" und
 * „gerade gekommen" — eine Folgemeldung derselben Einheit trägt denselben
 * Schlüssel, ändert aber still eine bestehende Zeile, und genau die soll
 * quittieren (siehe useEingangsquittung).
 */
export type Eingang = {
  schluessel: string;
  nonce: number;
  /** Der Inhalt lag schon vor: Quittungstext, der sagt, dass nichts geändert wurde (R15-W1). */
  uebersprungen?: string;
};

/** Eine Einheit, die eben in einen anderen Einsatz verschoben wurde; `zurueck` holt sie wieder her (R14-D4). */
export type Verschoben = { name: string; nach: string; zurueck: () => Promise<void>; nonce: number };

/** Ein Zug, der eben mehreren Einheiten zugleich zugeordnet wurde — für Quittung und Rückgängig (R14-G2). */
export type ZugGesetzt = { zug: string; ziele: { id: string; einheitSchluessel: string }[]; nonce: number };
/** Auftrag/Notiz an einer Karte gespeichert — die Ansicht quittiert mit „Rückgängig" (R15-W3). */
export type AuftragGesetzt = { eintragId: string; name: string; nummer?: number; vorher: string; nachher: string; nonce: number };

/** Marke für genau diese Zeile — null, wenn sie nicht gemeint ist. */
function marke(eingang: Eingang | null | undefined, schluessel: string): string | null {
  return eingang && eingang.schluessel === schluessel ? `${eingang.schluessel}#${eingang.nonce}` : null;
}

/**
 * Zug für die eben aufgenommenen Einheiten ohne Zug in einem Zug setzen (R13-W5): Die Aufnahme fragte nicht nach
 * dem Zug, und je Einheit hieß es Karte aufklappen, „Zug zuordnen", tippen, speichern. Ein Feld mit den schon
 * vergebenen Zügen als Knöpfen ordnet alle gelisteten Einheiten zugleich zu: ein Tipp je Einheit-Gruppe.
 * Schreibweise wie an der Karte (zugSetzen gleicht mit den vergebenen Zügen ab, „1.Zug" = „1. Zug").
 */
export function ZugSchnellZuordnen(props: {
  einsatzId: string;
  /** Die geltenden Fassungen, die einen Zug bekommen sollen (nur anwesende ohne Zug zählen). */
  einheiten: readonly MeldeEintrag[];
  /** Alle Zug-Etiketten der Sammlung — Vorschläge. */
  vorhandene: readonly (string | undefined)[];
  onGeaendert: () => void;
  /** Zug gesetzt — die Ansicht quittiert mit „Rückgängig" (R14-G2/H2/D3). */
  onZugGesetzt?: (z: ZugGesetzt) => void;
}) {
  const [wert, setWert] = useState("");
  const listeId = useId();
  const ziele = props.einheiten.filter((e) => e.status === MeldeStatus.ANWESEND && !e.zugEtikett);
  if (ziele.length === 0) return null;
  const vorschlaege = vorhandeneZuege([...props.vorhandene]);
  async function zuordnen(zug: string) {
    if (!zug.trim()) return;
    const ok = await gesichert("Zug zuordnen", () => {
      for (const e of ziele) zugSetzen(props.einsatzId, e.einheitSchluessel, e.id, zug);
    });
    if (ok) {
      setWert("");
      // Der Zug in der Schreibweise, in der er gespeichert wurde („1.Zug" = „1. Zug").
      props.onZugGesetzt?.({
        zug: zugNormalisiert(zug, props.vorhandene) || zug.trim(),
        ziele: ziele.map((e) => ({ id: e.id, einheitSchluessel: e.einheitSchluessel })),
        nonce: Date.now(),
      });
      props.onGeaendert();
    }
  }
  return (
    <div className="zug-schnell" role="group" aria-label="Zug zuordnen">
      <span className="zug-schnell-text">
        {ziele.length === 1 ? "Zug dieser Einheit:" : `Zug für ${ziele.length} Einheiten ohne Zug:`}
      </span>
      {vorschlaege.map((z) => (
        <button key={z} type="button" onClick={() => void zuordnen(z)}>
          {z}
        </button>
      ))}
      <datalist id={listeId}>
        {vorschlaege.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      <input
        type="text"
        value={wert}
        placeholder="Zug für alle, z. B. 3. Zug"
        aria-label="Zug für diese Einheiten"
        list={listeId}
        {...NAMEN_EINGABE}
        onChange={(e) => setWert(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void zuordnen(wert);
        }}
      />
      <button type="button" className="primaer" disabled={!wert.trim()} onClick={() => void zuordnen(wert)}>
        Zuordnen
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Einsatzliste

/**
 * Der zuletzt in den Papierkorb gelegte Einsatz — die Startseite quittiert
 * ihn mit „Rückgängig", wie bei den Vorlagen. Vorher ging die Karte auf der
 * Startseite wortlos ab, und aus der Einsatzansicht hieß es nur „Einsatz in
 * den Papierkorb verschoben." ohne Rückweg (Audit Runde 2, R2-D6). Auf
 * Modulebene, weil der Weg aus der Einsatzansicht die Startseite erst danach
 * aufbaut.
 */
let zuletztGeloeschterEinsatz: { id: string; name: string } | null = null;

export function EinsatzListe(props: {
  einsaetze: Einsatzsammlung[];
  onOeffnen: (s: Einsatzsammlung) => void;
  onGeaendert: () => void;
}) {
  const { einsaetze, onOeffnen, onGeaendert } = props;
  useMinutenTakt(); // Altersangaben „vor 4 Min" laufen mit (R14-O1)
  const [zeigePapierkorb, setZeigePapierkorb] = useState(false);
  const papierkorb = einsaetzePapierkorb();
  // Nach dem Laden gelesen: einsaetzePapierkorb() hat die Frist gerade geprüft
  // und fällige Löschungen vorgemerkt (aufraeum-hinweis.ts, R2-D5).
  const [aufgeraeumt, setAufgeraeumt] = useState(() => aufgeraeumteLaden());
  // Nach Ablauf der 30 Tage im Papierkorb (oder der 90 Tage) räumt der Kern still auf; Zwischenstände des
  // Papier-Abgleichs zu Einsätzen, die es nicht mehr gibt, gehen mit (R16-O1).
  const einsatzIdsText = [...einsaetze, ...papierkorb].map((s) => s.id).join(",");
  useEffect(() => {
    abgleichEntwurfAufraeumen(einsatzIdsText ? einsatzIdsText.split(",") : []);
  }, [einsatzIdsText]);
  /**
   * Der gerade zurückgeholte Einsatz. Aus dem Papierkorb wiederhergestellt,
   * taucht er irgendwo in der Liste darüber wieder auf — bei mehreren
   * Sammlungen ist ohne Stempel nicht zu sehen, welche zurückkam. Genau die
   * Zusage „nichts geht verloren" bliebe damit unquittiert.
   */
  const [zurueckgeholt, setZurueckgeholt] = useState<string | null>(null);
  // Die Übergabe aus der Einsatzansicht gilt für genau einen Aufbau der
  // Startseite; danach führt die Liste die Quittung selbst.
  const [geloescht, setGeloescht] = useState(() => zuletztGeloeschterEinsatz);
  // Aus der Einsatzansicht übergeben: Die Startseite beginnt oben, die Zeile
  // über der Liste stand dreieinhalb Bildschirme tiefer, ohne Hinweis im
  // ersten Bild (Audit Runde 4, R4-G1). Dann quittiert die Daumenleiste.
  const [uebergeben] = useState(() => zuletztGeloeschterEinsatz !== null);
  useEffect(() => {
    zuletztGeloeschterEinsatz = null;
  }, []);

  function loeschenRueckgaengig() {
    if (!geloescht) return;
    einsatzWiederherstellen(geloescht.id);
    setZurueckgeholt(geloescht.id);
    setGeloescht(null);
    onGeaendert();
  }

  /**
   * Rückfrage vor dem Weg in den Papierkorb. Dass ein Fehltipp umkehrbar ist,
   * hilft nur, wenn der Rückweg auch bekannt ist — der Papierkorb liegt hinter
   * einem Textlink, den nichts ankündigt. Die Frage nennt ihn deshalb.
   */
  function fragLoeschen(s: Einsatzsammlung) {
    const einheiten = geltendeJeEinheit(s.eintraege).length;
    return frageJaNein({
      titel: "Einsatz löschen?",
      text: `„${s.name}" mit ${einheiten} gemeldeten Einheit${einheiten === 1 ? "" : "en"} wandert in den Papierkorb und lässt sich dort 30 Tage lang zurückholen.`,
      ok: "In den Papierkorb",
      gefahr: true,
    });
  }

  async function loeschen(s: Einsatzsammlung) {
    // Bei vollem Speicher scheiterte das Ablegen im Papierkorb ohne Meldung
    // (Audit Runde 6, R6-O1).
    if (!(await gesichert("Nicht gelöscht", () => einsatzLoeschen(s.id), undefined, einsaetzePapierkorb().length === 0))) return;
    setGeloescht({ id: s.id, name: s.name });
    onGeaendert();
  }

  // Rückfrage und Mutation bleiben getrennt: der Abgang der Karte läuft
  // zwischen beiden (siehe AbgangKnopf).
  function fragEndgueltig(s: Einsatzsammlung) {
    return frageJaNein({
      titel: "Einsatz endgültig löschen?",
      text:
        `„${s.name}" mit ${s.eintraege.length} Meldung(en) wird aus dem Papierkorb entfernt. Darin stecken fremde Personendaten; rückgängig geht das nicht.` +
        // Gibt es keine Kopie, ist das hier die letzte (Audit Runde 4, R4-D5).
        (s.eintraege.length > 0 && !exportVorhanden(s.id)
          ? " Von dieser Sammlung gibt es noch keinen Export, kein Lageblatt und keine Weitergabe — es ist die einzige Kopie."
          : ""),
      ok: "Endgültig löschen",
      gefahr: true,
    });
  }

  function endgueltigLoeschen(s: Einsatzsammlung) {
    einsatzEndgueltigLoeschen(s.id);
    abgleichEntwurfLoeschen(s.id); // auch der Zwischenstand des Papier-Abgleichs: Freitext und Namen (R16-O1)
    onGeaendert();
  }

  return (
    <>
      {/* Nach einer automatischen Löschung einmal sagen, WAS weg ist — sonst
          sucht man eine Sammlung, die nicht verlegt, sondern gelöscht ist
          (Audit Runde 2, R2-D5). */}
      {aufgeraeumt.length > 0 && (
        <div className="warnung aufgeraeumt-hinweis" role="status">
          <p>
            <strong>Automatisch gelöscht:</strong>{" "}
            {aufgeraeumt.length === 1 ? "Diese Sammlung lag" : "Diese Sammlungen lagen"} nach dem Datum dieses Geräts 90 Tage unverändert
            und {aufgeraeumt.length === 1 ? "wurde" : "wurden"} wegen der enthaltenen Personendaten endgültig
            entfernt — nicht im Papierkorb. Wer die Daten noch braucht, greift auf einen Export oder das Papier zurück.
          </p>
          <ul>
            {aufgeraeumt.map((a) => (
              <li key={a.id}>
                „{a.name}" · {tagText(a.angelegt)} bis {tagText(a.geaendert)} · {einheitenZahl(a.einheiten)},{" "}
                {a.meldungen} Meldung(en) · gelöscht am {zeitLang(a.entferntAm)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              aufgeraeumteQuittieren();
              setAufgeraeumt([]);
            }}
          >
            Verstanden
          </button>
        </div>
      )}
      {geloescht && uebergeben && (
        <DaumenQuittung onRueckgaengig={loeschenRueckgaengig} onSchliessen={() => setGeloescht(null)}>
          {/* Die Folge vorn, der Name hinten: Die Leiste kürzt auf zwei Zeilen am Ende (R5-E4). */}
          <strong>In den Papierkorb gelegt (30 Tage rückholbar):</strong> Einsatz „{geloescht.name}"
        </DaumenQuittung>
      )}
      {geloescht && !uebergeben && (
        <p className="meldung einsatz-geloescht" role="status">
          Einsatz „{geloescht.name}" in den Papierkorb gelegt (30 Tage rückholbar).{" "}
          {/* Voller Knopf wie bei Vorlagen und in der Daumenleiste (R3-D4). */}
          <button type="button" onClick={loeschenRueckgaengig}>Rückgängig</button>
        </p>
      )}
      {einsaetze.map((s) => {
        const sum = aggregiere(s.eintraege, s.art);
        // Reine Sollstärke steckt in der Gesamtzahl: die Kachel sagt, wie viel davon (R9-K1).
        const soll = sollstaerkeAnteil(s.eintraege, s.art);
        return (
          <Kartenstapel className="karte" key={s.id} frisch={s.id === zurueckgeholt}>
            <div className="kopfzeile">
              <h2>{s.name}</h2>
              <button type="button" className="primaer" onClick={() => onOeffnen(s)}>Öffnen</button>
            </div>
            <p>
              <strong>{ART_LABEL[s.art]}</strong>
              {s.ort ? ` · ${s.ort}` : ""}
              {/* Zwei Sammlungen gleichen Namens (zwei Meldeköpfe, R5-W2) sind nur an der Anlagezeit zu unterscheiden. */}
              {einsaetze.some((x) => x.id !== s.id && x.name.trim().toLowerCase() === s.name.trim().toLowerCase()) ? ` · angelegt ${zeitLang(s.angelegt)}` : ""}
            </p>
            <p className="hinweis">
              {/* Gemeldet und anwesend auseinander: beide Wörter, wie auf dem Schnellzugriff (R13-W3). */}
              {einheitenAnwesend(s.eintraege, s.art)} · Stärke {sum.staerke.fuehrer} / {sum.staerke.unterfuehrer} / {sum.staerke.mannschaft} / {sum.staerke.gesamt}
              {soll.einheiten > 0 && <> · davon {soll.personen} Sollstärke, nicht gemeldet</>}
            </p>
            {/* Zeitbezug der Zahlen und was seit der letzten Kenntnisnahme kam
                (R3-K5, R3-K1). */}
            <p className="hinweis letzte-meldung">{letzteMeldungText(s)}</p>
            <UnlesbarHinweis sammlungId={s.id} />
            {/* Stand von Papier und Export schon auf der Startseite: ob der
                Aushang und die letzte Lieferung noch stimmen (R2-A3). */}
            <p className="hinweis ausgabe-stand">{ausgabeStandText(s)}</p>
            {/* Ankündigung der automatischen Löschung (siehe AUFRAEUM_FRIST_MS).
                Sie steht über den Aktionen, damit der Ausweg — exportieren oder
                durch eine Änderung die Uhr zurücksetzen — direkt daneben liegt. */}
            <AufraeumWarnung sammlung={s} />
            <div className="vorlage-aktionen">
              {/* Der Abgang zeigt, welche Sammlung geht — die Liste rückt erst
                  danach nach. Ohne ihn verschwindet aus einem Stapel gleich
                  aussehender Karten schlagartig eine, und welche es war, steht
                  nur noch im Papierkorb. */}
              <AbgangKnopf className="entfernen" bestaetigen={() => fragLoeschen(s)} onAusfuehren={() => loeschen(s)}>
                Löschen…
              </AbgangKnopf>
            </div>
          </Kartenstapel>
        );
      })}
      {papierkorb.length > 0 && (
        <p>
          <button type="button" className="link" onClick={() => setZeigePapierkorb(!zeigePapierkorb)}>
            {zeigePapierkorb ? "Papierkorb Einsätze ausblenden" : `Papierkorb Einsätze (${papierkorb.length})`}
          </button>
        </p>
      )}
      {zeigePapierkorb &&
        papierkorb.map((s) => (
          <Kartenstapel className="karte papierkorb" key={s.id}>
            <div className="kopfzeile">
              <h2>{s.name}</h2>
              {/* Nur der harmlose Weg steht in der Kopfzeile. „Endgültig
                  löschen" lag daneben, keine zwei Fingerbreit vom
                  Wiederherstellen entfernt — mit Handschuh eine Verwechslung
                  ohne Rückweg. */}
              <AbgangKnopf
                onAusfuehren={() => {
                  const gleichnamig = einsaetze.filter((x) => x.id !== s.id && x.name.trim().toLowerCase() === s.name.trim().toLowerCase());
                  einsatzWiederherstellen(s.id);
                  setZurueckgeholt(s.id);
                  onGeaendert();
                  // Stilles Duplikat (R11-D5): Es gibt jetzt zwei Sammlungen gleichen Namens — das sagt ein Hinweis
                  // mit den Merkmalen, an denen man sie unterscheidet.
                  if (gleichnamig.length > 0) {
                    const vorhanden = gleichnamig[0]!;
                    void zeigeHinweis({
                      titel: "Zwei Sammlungen gleichen Namens",
                      text: `„${s.name}" ist zurück, aber es gibt schon eine Sammlung „${vorhanden.name}" (${vorhanden.eintraege.length} Meldung(en), angelegt ${zeitLang(vorhanden.angelegt)}). Die zurückgeholte ist von ${zeitLang(s.angelegt)} mit ${s.eintraege.length} Meldung(en). Auf der Startseite unterscheidet beide die Anlagezeit; Einheiten lassen sich über „Verschieben…“ umlegen.`,
                    });
                  }
                }}
              >
                Wiederherstellen
              </AbgangKnopf>
            </div>
            {/* Datum und Restzeit statt „nach 30 Tagen": Ab drei Tagen
                hervorgehoben (Audit Runde 4, R4-D5). */}
            <p className={papierkorbRest(s.geloeschtAm!).bald ? "hinweis warnung-text" : "hinweis"}>
              {s.eintraege.length} Meldung(en) · gelöscht am {datumZweistellig(s.geloeschtAm!)} —{" "}
              {papierkorbRest(s.geloeschtAm!).text}
            </p>
            {/* Wiederherstellen zählt als Änderung: Die Aufräumfrist ruhender
                Sammlungen beginnt neu (R5-D2). Vorher löschte der Kern eine
                länger als 90 Tage ruhende Sammlung im selben Augenblick. */}
            {ruhtSchonLange(s) && (
              <p className="hinweis">Beim Wiederherstellen beginnt die Aufräumfrist von 90 Tagen neu.</p>
            )}
            <div className="papierkorb-endgueltig">
              <AbgangKnopf
                className="entfernen"
                bestaetigen={() => fragEndgueltig(s)}
                onAusfuehren={() => endgueltigLoeschen(s)}
              >
                Endgültig löschen…
              </AbgangKnopf>
            </div>
          </Kartenstapel>
        ))}
    </>
  );
}

// ---------------------------------------------------------------- Einsatzdetail

/**
 * Kann dieses Gerät einen ganzen Ordner auswählen? Nur der Rechner: Handy- und
 * Tablet-Browser kennen das Attribut zwar, öffnen aber trotzdem den normalen
 * Dateipicker — ein Knopf, der etwas anderes tut als er verspricht, ist im Feld
 * schlimmer als kein Knopf. Der Zeigergerät-Test trennt beide Welten
 * zuverlässiger als eine Browser-Erkennung.
 */
function ordnerAuswahlMoeglich(): boolean {
  if (typeof HTMLInputElement === "undefined" || !("webkitdirectory" in HTMLInputElement.prototype)) return false;
  return typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches;
}

/** Was der Einlese-Knopf im Dateifenster vorschlägt: fertige Bögen in jeder Form. */
const EINLESE_ARTEN = ".json,application/json,.pdf,application/pdf,image/*";

/**
 * Ein Knopf für alles, was fertig ausgefüllt hereinkommt: JSON, PDF, Fotos und
 * Screenshots von QR-Codes — einzeln, viele auf einmal oder als ganzer Ordner.
 *
 * Vorher standen dafür drei Knöpfe nebeneinander und verlangten vorab eine
 * Entscheidung, die das Dateifenster ohnehin abnimmt: dort liegt die Datei, und
 * was sie ist, sieht man an ihr — nicht am Knopf davor. Welcher Weg gegangen
 * wird, entscheidet deshalb hier der Dateityp: Bilder gehen durch den
 * QR-Stapel, JSON und PDF durch den Bogen-Import. Beides gemischt ist erlaubt.
 *
 * Nur die Ordnerauswahl bleibt ein eigener Weg, weil ein Dateifeld entweder
 * Dateien ODER einen Ordner öffnen lässt. Sie hängt als zweiter Eintrag an
 * einem kleinen Menü — und das Menü erscheint nur dort, wo es Ordner überhaupt
 * gibt: sonst öffnet der Knopf ohne Zwischenschritt das Dateifenster.
 */
function BoegenEinlesenKnopf(props: {
  /** JSON-/PDF-Dateien mit fertigen Bögen. */
  onDaten: (dateien: File[]) => void;
  /** Bilder, aus denen erst noch QR-Codes gelesen werden. */
  onBilder: (dateien: File[]) => void;
  /** Beides zugleich, wenn der Aufrufer eine gemeinsame Rückmeldung gibt. */
  onEinlesen?: (daten: File[], bilder: File[]) => void;
}) {
  const mitOrdner = ordnerAuswahlMoeglich();
  const dateiFeld = useRef<HTMLInputElement>(null);
  const ordnerFeld = useRef<HTMLInputElement>(null);
  const huelle = useRef<HTMLDivElement>(null);
  const [offen, setOffen] = useState(false);

  // `webkitdirectory` ist kein React-Attribut und wird deshalb nachgesetzt.
  useEffect(() => {
    if (mitOrdner) ordnerFeld.current?.setAttribute("webkitdirectory", "");
  }, [mitOrdner]);

  // Ein offenes Menü muss auch wieder zugehen, ohne dass etwas gewählt wurde —
  // sonst verdeckt es die Knopfreihe darunter.
  useEffect(() => {
    if (!offen) return;
    function danebenGeklickt(e: MouseEvent) {
      if (!huelle.current?.contains(e.target as Node)) setOffen(false);
    }
    function taste(e: KeyboardEvent) {
      if (e.key === "Escape") setOffen(false);
    }
    document.addEventListener("mousedown", danebenGeklickt);
    document.addEventListener("keydown", taste);
    return () => {
      document.removeEventListener("mousedown", danebenGeklickt);
      document.removeEventListener("keydown", taste);
    };
  }, [offen]);

  /** Auswahl auf die beiden Wege verteilen. */
  function verteile(dateien: File[]) {
    const bilder = dateien.filter((d) => istBilddatei(d.name, d.type));
    const daten = dateien.filter((d) => !istBilddatei(d.name, d.type));
    if (props.onEinlesen) {
      props.onEinlesen(daten, bilder);
      return;
    }
    if (daten.length > 0) props.onDaten(daten);
    // Auch die leere Auswahl geht weiter: der Aufrufer meldet dann „keine
    // Bilddateien" — besser als ein Knopf, der wortlos nichts tut.
    if (bilder.length > 0 || daten.length === 0) props.onBilder(bilder);
  }

  return (
    <div className="einlese" ref={huelle}>
      <button
        type="button"
        className="mit-zusatz"
        aria-haspopup={mitOrdner ? "menu" : undefined}
        aria-expanded={mitOrdner ? offen : undefined}
        aria-describedby="aufnahme-zusatz-einlesen"
        title="Fertig ausgefüllte Bögen aufnehmen: JSON- oder PDF-Datei, Fotos oder Screenshots von QR-Codes — auch viele auf einmal und mehrteilige Bögen."
        onClick={() => (mitOrdner ? setOffen((o) => !o) : dateiFeld.current?.click())}
      >
        Bögen einlesen…
        {/* Sichtbar, nicht nur im Tooltip (R3-N5). */}
        <span className="knopf-zusatz" id="aufnahme-zusatz-einlesen" aria-hidden="true">Dateien oder Fotos von QR-Codes</span>
      </button>
      {mitOrdner && offen && (
        <div className="einlese-menue" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOffen(false);
              dateiFeld.current?.click();
            }}
          >
            Dateien wählen…
          </button>
          <button
            type="button"
            role="menuitem"
            title="Einen ganzen Ordner mit QR-Bildern einlesen (Unterordner eingeschlossen). Nicht-Bilder werden übergangen."
            onClick={() => {
              setOffen(false);
              ordnerFeld.current?.click();
            }}
          >
            Ganzen Ordner wählen…
          </button>
        </div>
      )}
      {/* Die Felder werden vom Knopf ausgelöst und stehen deshalb nicht selbst
          in der Tabfolge — sichtbar und bedienbar ist der Knopf. */}
      <input
        ref={dateiFeld}
        type="file"
        accept={EINLESE_ARTEN}
        multiple
        tabIndex={-1}
        className="nur-sr"
        aria-label="Dateien wählen…"
        onChange={(e) => {
          const dateien = [...(e.target.files ?? [])];
          e.target.value = "";
          if (dateien.length > 0) verteile(dateien);
        }}
      />
      {mitOrdner && (
        <input
          ref={ordnerFeld}
          type="file"
          multiple
          tabIndex={-1}
          className="nur-sr"
          aria-label="Ganzen Ordner wählen…"
          onChange={(e) => {
            // Ein Ordner enthält auch .DS_Store und Ähnliches: hier zählen nur
            // die Bilder, alles andere wird stillschweigend übergangen.
            const bilder = [...(e.target.files ?? [])].filter((d) => istBilddatei(d.name, d.type));
            e.target.value = "";
            if (props.onEinlesen) props.onEinlesen([], bilder);
            else props.onBilder(bilder);
          }}
        />
      )}
    </div>
  );
}

/**
 * Schmaler Bildschirm (Telefon hochkant)? Dort stehen die Einheiten als
 * kompakte Zeilen — Name, Stärke, Bedarf —, Knöpfe erst nach Antippen: eine
 * volle Karte war rund 450 px hoch, das Lagebild lief über 13 Bildschirmhöhen
 * (Audit Runde 2, R2-K7). Ohne matchMedia (Tests, alte Webviews): nein.
 */
/** Kennungen aller Sammlungen samt Papierkorb — Stände verschwundener fallen weg. */
function alleEinsatzIds(): string[] {
  return [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((s) => s.id);
}

/** Bis zu so vielen Zeichen steht die Bemerkung der Einheit ungekürzt auf der Karte (R3-K3). */
const BEMERKUNG_KURZ = 120;

/**
 * Ankündigung der automatischen Löschung einer ruhenden Sammlung — auf der
 * Startseitenkarte und in der Einsatzansicht. Dort fehlte sie: Wer die
 * Sammlung offen hatte, sah die Frist nicht (Audit Runde 3, R3-D4).
 */
function AufraeumWarnung({ sammlung: s }: { sammlung: Einsatzsammlung }) {
  const restTage = tageBisAufraeumen(s);
  if (restTage == null) return null;
  const ruhtTage = Math.floor((Date.now() - s.geaendert) / (24 * 60 * 60 * 1000));
  return (
    <p className="warnung">
      {restTage > 0 ? `Wird in ${restTage} Tag(en) automatisch gelöscht.` : "Wird beim nächsten Start automatisch gelöscht."}{" "}
      {/* Die tatsächliche Ruhezeit — „seit 60 Tagen" stand auch bei
          70 Tagen da (Audit Runde 2, R2-D5). */}
      Die Sammlung liegt seit {ruhtTage} Tagen unverändert und enthält Personendaten gemeldeter Kräfte. Wenn du sie
      noch brauchst, exportiere sie jetzt — jede Änderung an der Sammlung setzt die Frist zurück.
    </p>
  );
}

/**
 * Entfernte Meldungen je Sammlung (jüngste zuletzt), für „Rückgängig" nach dem Zurückkehren (nur Arbeitsspeicher).
 * Ein Stapel statt nur der letzten: Wer zwei falsche Meldungen nacheinander wegräumt, holt beide zurück (R9-E2).
 */
const entferntGemerkt = new Map<string, Entfernt[]>();
/** So viele Entfernungen hintereinander lassen sich zurückholen. */
const ENTFERNT_STAPEL_MAX = 20;

/** Nonce der Aufnahme, zu der die Quittung zuletzt ins Bild gerollt wurde (je Seite, nicht je Ansicht). */
let eingangGerollt = 0;

/** So viele Namen nennt die Sammelquittung, der Rest steht als Zahl da. */
const QUITTUNG_MAX = 10;
/** Ab so vielen neuen Einheiten zeigt der Kasten „Neu seit der letzten Kenntnisnahme" nur Zahl und dringende Fälle (R15-S2). */
const QUITTUNG_VIELE = 5;

const SCHMAL_ABFRAGE = "(max-width: 600px)";
/** So lange steht „Zuletzt abgelegt/eingelesen … jetzt n Einheiten" (R17-S8): zehn Minuten, dann ist „jetzt" nicht mehr wahr. */
export const EINGANG_QUITTUNG_MS = 10 * 60_000;

/** Was am Kopf des Einsatzes geändert wurde, mit Alt und Neu: „Name: „A" → „B"" (R17-S4). */
export function kopfAenderungText(vorher: { name: string; ort: string }, name: string, ort: string): string {
  const teile: string[] = [];
  if (vorher.name !== name) teile.push(`Name „${vorher.name}" → „${name}"`);
  if (vorher.ort !== ort) teile.push(`Ort ${vorher.ort ? `„${vorher.ort}"` : "(leer)"} → ${ort ? `„${ort}"` : "(leer)"}`);
  return teile.join(" · ");
}

/** Zwischenstand der laufenden Sammel-PDF: „12 von 30 Bögen vorbereitet" samt Balken (R17-O1, R17-D4, R17-A4). */
function ArbeitFortschrittZeile() {
  const f = useArbeitFortschritt();
  if (!f) return null;
  return (
    <>
      <br />
      <strong className="arbeit-fortschritt">{fortschrittSatz(f)}</strong>
      {f.von > 0 && <progress value={f.n} max={f.von} aria-label="Fortschritt der Sammel-PDF" style={{ display: "block", width: "100%" }} />}
    </>
  );
}

function useSchmal(): boolean {
  const [schmal, setSchmal] = useState(() => typeof matchMedia === "function" && matchMedia(SCHMAL_ABFRAGE).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const m = matchMedia(SCHMAL_ABFRAGE);
    const wechsel = () => setSchmal(m.matches);
    m.addEventListener?.("change", wechsel);
    return () => m.removeEventListener?.("change", wechsel);
  }, []);
  return schmal;
}

export function EinsatzDetail(props: {
  einsatz: Einsatzsammlung;
  onZurueck: () => void;
  onGeaendert: () => void;
  onScannen: () => void;
  onManuell: () => void;
  /** Schnellerfassung (nur Stärke) für diese Sammlung (R16-W3). */
  onSchnell?: () => void;
  /** Fertige Bögen aus JSON-/PDF-Dateien. */
  onDateiImport: (dateien: File[]) => void;
  /** Stapel abfotografierter/gescannter QR-Codes (Mehrfachauswahl oder Ordner). */
  onBilderImport: (dateien: File[]) => void;
  /**
   * Dateien und Bilder einer Auswahl zusammen — eine Rückmeldung je Stapel
   * (R3-E4). Ohne ihn gehen beide getrennt an onDateiImport/onBilderImport.
   */
  onEinlesen?: (daten: File[], bilder: File[]) => void;
  /** Rückmeldung des Einlesens, unter den Aufnahme-Knöpfen gezeigt (R3-L1). */
  einleseQuittung?: ReactNode;
  /** Zählt hoch, wenn der Abgleich vom Papier geöffnet werden soll — Knopf im Einlese-Bericht (R4-A6). */
  abgleichAnstoss?: number;
  /** Der Einlese-Bericht trägt den Knopf zum Abgleich; die Karte darunter zeigt ihn dann nicht noch einmal (R5-N9). */
  abgleichKnopfImBericht?: boolean;
  onExport: () => void;
  /** Die Ausgabewege bekommen den gewählten Umfang mit: alle Bögen oder nur die seit dem letzten Export neuen. */
  onCsvExport: (umfang: ExportUmfang) => void;
  onCsvDetailExport: (umfang: ExportUmfang) => void;
  onOldenburgExport: (umfang: ExportUmfang) => void;
  /** Sammel-PDF (Übersicht, Bögen, eingebettete Sammlung) im gewählten Umfang. */
  onSammelPdf: (umfang: ExportUmfang) => void;
  /**
   * Einsatz weitergeben / sichern — immer die ganze Sammlung (Meldungen,
   * Zeiten, Historie, Züge), die das nächste Gerät über „Einsatz
   * importieren…" liest; unabhängig vom Kästchen „nur neue Bögen".
   * Optional, solange die App den Weg noch nicht verdrahtet hat.
   */
  onWeitergeben?: () => void;
  /** Einseitiges Lageblatt (Übersicht + Bedarf + Züge) als PDF. */
  onLageblatt?: () => void;
  /**
   * Bestätigung der letzten PDF-Erzeugung (Weitergeben, Lageblatt, Blanko),
   * gezeigt direkt unter deren Knöpfen statt am Seitenende (Audit Runde 5, R5-L4).
   */
  ausgabeQuittung?: string | null;
  /** Leerer Bogen zum Ausfüllen mit der Hand — die Papier-Reserve (R3-A7). */
  onBlanko?: () => void;
  onGeloescht: () => void;
  /** Name der für DIESEN Einsatz angefangenen Erfassung einer fremden Einheit, falls es eine gibt (R12-S1). */
  angefangeneErfassung?: string;
  /** Die gerade eingegangene Meldung — sie quittiert in der Liste. */
  eingang?: Eingang | null;
  /**
   * Die zuletzt eingelesene Meldung wurde mit „Ja — dieselbe Einheit"
   * zusammengelegt: Ihren Rückweg führt die Daumenleiste (als eigene Einheit).
   * Der Link im Kasten „Zuletzt eingelesen" entfernte sie samt Erfassung — zwei
   * „Rückgängig" mit gegensätzlicher Wirkung (Audit Runde 5, R5-E3).
   */
  zusammenlegungEintragId?: string | null;
  /**
   * Stand des letzten Exports dieses Einsatzes je Format (export-stand.ts,
   * R4-W2); fehlendes Format oder weggelassen: noch kein Export in diesem Format.
   */
  exportStaende?: Partial<Record<ExportZiel, ExportStand>>;
  /**
   * Alle Bögen oder nur die neuen. Hält der Aufrufer die Wahl (app.tsx, damit
   * sie das Aus- und Einhängen der Ansicht übersteht), gibt er beides herein;
   * sonst führt die Ansicht sie selbst.
   */
  exportUmfang?: ExportUmfang;
  onExportUmfang?: (umfang: ExportUmfang) => void;
  /**
   * Das Format ab der letzten Weitergabe rechnen (R5-W5): der Stab hat die
   * Sammel-PDF der Weitergabe ebenfalls bekommen. Fehlt der Weg, bietet die
   * Ansicht ihn nicht an.
   */
  onStandAusWeitergabe?: (ziel: ExportZiel) => void;
}) {
  const { einsatz, onZurueck, onGeaendert, onScannen, onManuell, onDateiImport, onBilderImport, onExport, onCsvExport, onCsvDetailExport, onOldenburgExport, onSammelPdf, onWeitergeben, onLageblatt, onBlanko, onGeloescht, eingang, ausgabeQuittung } = props;
  // Läuft eine PDF-Erzeugung (arbeitet.ts), sperrt sie alle PDF-Knöpfe und beschriftet den eigenen (R5-O3).
  const arbeitet = useArbeitet();
  const arbeitFortschrittJetzt = useArbeitFortschritt();
  // Altersangaben („gerade eben", „älter als 1 Std") rechnen im Minutentakt und bei Rückkehr in die App neu (R14-O1).
  useMinutenTakt();
  // Tipp-Sperre und sofortige Rückmeldung aller Ausgaben (R12-G2): ein Doppeltipp erzeugt keine zweite Datei,
  // und auch eine Ausgabe, die sofort fertig ist (CSV, Excel), sagt am Knopf, dass sie läuft.
  const [sofort, setSofort] = useState<string | null>(null);
  const sofortUhr = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(sofortUhr.current), []);
  // Im Nachtrag-Modus heißen die Knöpfe nicht wie der Vollexport, sondern nennen Nachtrag und Zahl (R16-W2).
  const nachtragKnopf = (basis: string, ziel: ExportZiel) => {
    if (exportUmfang !== "neue") return basis;
    const stand = exportStaende[ziel];
    if (!stand) return `${basis} — erste Lieferung: alle Bögen`;
    const n = new Set(nachtragEintraege(einsatz.eintraege, stand).map((e) => e.einheitSchluessel)).size;
    return `${basis} — ${n === 0 ? "Nachtrag: nichts Neues" : `Nachtrag (${n === 1 ? "1 Einheit" : `${n} Einheiten`})`}`;
  };
  const ausgabeTipp = (schluessel: string, name: string | null, los: () => void, ereignis?: { timeStamp: number }) => {
    // Nach der Ereigniszeit, nicht nach der Bearbeitungszeit: Die PDF-Erzeugung blockiert den Hauptfaden (R13-G1).
    if (!ausgabeFreiBeiTipp(schluessel, ereignis, tippWaehrendLauf)) return;
    if (name && einsatz.eintraege.length > 0) {
      setSofort(`${name} wird erzeugt — bitte nicht noch einmal tippen.`);
      clearTimeout(sofortUhr.current);
      sofortUhr.current = setTimeout(() => setSofort(null), Math.max(AUSGABE_SPERRE_MS, 1500));
    }
    los();
  };
  // Eingaben, die mit einer in einem anderen Fenster entfernten Einheit verschwanden (R12-O1). Gemeldet wird nur,
  // wenn die Einheit wirklich aus dem Einsatz verschwunden ist (nicht bei Filter oder Sortierung).
  const [verloreneEingaben, setVerloreneEingaben] = useState<string[]>([]);
  const eintraegeRef = useRef(einsatz.eintraege);
  eintraegeRef.current = einsatz.eintraege;
  const eingabeVerloren = (schluessel: string, text: string) => {
    if (eintraegeRef.current.some((x) => x.einheitSchluessel === schluessel)) return;
    setVerloreneEingaben((v) => [...v, text]);
  };
  const exportStaende = props.exportStaende ?? {};
  const [eigenerUmfang, setEigenerUmfang] = useState<ExportUmfang>("alle");
  const exportUmfang = props.exportUmfang ?? eigenerUmfang;
  const setExportUmfang = props.onExportUmfang ?? setEigenerUmfang;
  const nurNeue = exportUmfang === "neue";
  // Je Format, was seit DESSEN letztem Export neu ist: neue Bögen und die
  // geltende Fassung jeder Einheit mit Änderung (R4-W2, R4-K1). Beim Teilexport
  // ohne Neues gäbe es eine leere Datei — der Knopf dieses Formats bleibt
  // gesperrt, seine Zeile sagt warum.
  const nachtragJe = (z: ExportZiel) => nachtragEintraege(einsatz.eintraege, exportStaende[z] ?? null).length;
  const gesperrt = (z: ExportZiel) => nurNeue && nachtragJe(z) === 0;
  // Wann zuletzt ein Lageblatt entstand und was seitdem kam — ob der Aushang
  // an der Wand noch stimmt (Audit Runde 2, R2-A3). Bei jedem Rendern frisch
  // gelesen: pdf.ts vermerkt den Druck, die Ansicht rendert danach neu.
  const lageblattStand = lageblattStandLaden(einsatz.id);
  const lageblattVeraltet =
    lageblattStand != null &&
    (neueEintraege(einsatz.eintraege, lageblattStand).length > 0 || aenderungenSeit(einsatz.eintraege, lageblattStand).anzahl > 0);
  // „✓ Lageblatt erzeugt" über einer Zeile „Aushang ist nicht mehr aktuell" widerspricht sich: Nach der
  // ersten Änderung fällt die Bestätigung weg (R8-W6).
  const ausgabeQuittungSichtbar = ausgabeQuittung?.startsWith("✓ Lageblatt erzeugt") && lageblattVeraltet ? null : ausgabeQuittung;
  // Letzte Weitergabe der ganzen Sammlung — nach einer Schichtübergabe führt
  // womöglich ein anderes Gerät die Lage (Audit Runde 2, R2-W5).
  const weitergabeStand = weitergabeStandLaden(einsatz.id);
  const seitWeitergabe = weitergabeStand ? neueEintraege(einsatz.eintraege, weitergabeStand).length : 0;
  // Auch Abrücken, Zug, Auftrag zählen — was ein Import mitbrachte, nicht (R3-W2).
  const aenderungenSeitWeitergabe = weitergabeStand ? aenderungenSeit(einsatz.eintraege, weitergabeStand) : { anzahl: 0, arten: [] };
  const weitergabeOffen = seitWeitergabe > 0 || aenderungenSeitWeitergabe.anzahl > 0;
  const [suche, setSuche] = useState("");
  const [sortierung, setSortierung] = useState<EinheitenSortierung>("nummer");
  // Sprünge innerhalb der Ansicht (R4-K5): zur Einheitenliste und zu Weitergabe/Export.
  const ausgabeBlock = useRef<HTMLDivElement>(null);
  const listeKopf = useRef<HTMLHeadingElement>(null);
  const [zurListe, setZurListe] = useState(0);
  useEffect(() => {
    if (zurListe === 0) return;
    try {
      listeKopf.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    } catch {
      /* Testumgebung ohne Layout */
    }
  }, [zurListe]);
  // "" = keine Einschränkung. Schlüssel siehe einheiten-liste.ts.
  const [quali, setQuali] = useState("");
  // Nur Einheiten, bei denen jetzt etwas zu entscheiden ist — Kraftstoff
  // allein zählt nicht, den meldet fast jede Einheit (Audit Runde 2, R2-K4).
  // "ruhezeit"/"unterbringung" kommen aus den Kopfzahlen („Ruhezeit: 5×").
  const [bedarfsFilter, setBedarfsFilter] = useState<BedarfsFilter | null>(null);
  const nurBedarf = bedarfsFilter != null;
  // „ohne Auftrag" / „ohne Zug": Lücken, die die Führung schließen will (R7-K6).
  const [lueckenFilter, setLueckenFilter] = useState<LueckenFilter | null>(null);
  // „Wer ist noch da?": nur Anwesende oder nur Abgerückte; abgerückte Karten bleiben sonst an ihrem Platz stehen (R11-K2).
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  // Suche, Sortierung und Filter am Telefon hinter einer Zeile, solange die Liste kurz ist (R4-K5).
  const [filterOffen, setFilterOffen] = useState(false);
  const bedarfsFilterText =
    bedarfsFilter === "ruhezeit" ? "„nur mit Ruhezeit“" : bedarfsFilter === "unterbringung" ? "„nur mit Unterbringung“" : "„nur dringender Bedarf“";
  // „n ohne Auftrag" / „n ohne Zug": Filter setzen, das Filterfeld zu lassen und die Liste in den Blick rollen (R10-K2).
  const aufLueckeFiltern = (f: LueckenFilter) => {
    setLueckenFilter(f);
    setTimeout(
      () => document.querySelector(".luecken-zaehler")?.scrollIntoView?.({ block: "start" }),
      0,
    );
  };
  const aufBedarfFiltern = (f: BedarfsFilter) => {
    setBedarfsFilter(f);
    setFilterOffen(true);
    // Nach dem Rendern: Hinter der geschlossenen Zeile gibt es noch nichts zum Anspringen.
    setTimeout(() => document.querySelector(".einheiten-filter")?.scrollIntoView?.({ block: "start" }), 0);
  };
  // Letzter Statuswechsel von Hand — solange er hier steht, gibt es den Rückweg.
  const [statusWechsel, setStatusWechsel] = useState<StatusWechsel | null>(null);
  // Karten oder Tabelle — geräteweit gemerkt (einheiten-tabelle.ts).
  const [ansicht, setAnsicht] = useState<EinheitenAnsicht>(gemerkteAnsicht);
  const kompakt = useSchmal();
  // Die feste Ansichtsleiste zieht sich beim Lesen nach unten ein (R17-N3, R17-H7).
  useEffect(() => {
    let ab: (() => void) | undefined;
    let weg = false;
    // Nachgeladen: Die Einziehregel gehört nicht ins Startbündel (ADR-003, Aufnahmeregel 5).
    void import("./balken-einziehen").then((m) => {
      if (!weg) ab = m.balkenEinziehen();
    });
    return () => {
      weg = true;
      ab?.();
    };
  }, []);
  const sum = aggregiere(einsatz.eintraege, einsatz.art);
  const sollAnteil = sollstaerkeAnteil(einsatz.eintraege, einsatz.art);
  const zugGruppen = aggregiereNachZug(einsatz.eintraege, einsatz.art);
  // Nur benannte Züge zählen; der Sammelblock „Ohne Zug“ ist kein Zug (R9-K4).
  const benannteZuege = zugGruppen.filter((g) => g.zugEtikett).length;
  const zugTitel = `${benannteZuege === 1 ? "1 Zug" : `${benannteZuege} Züge`}${zugGruppen.some((g) => !g.zugEtikett) ? " + Einheiten ohne Zug" : ""}`;
  // Was die Lage NICHT enthält, gehört genauso sichtbar gemacht wie das, was
  // sie enthält (siehe zaehltInLage).
  const uebungenDaneben = uebungenAusserhalbDerLage(einsatz.eintraege, einsatz.art);
  // Zuletzt Entferntes — solange es hier steht, gibt es einen Rückweg. Beim
  // Entfernen einer Einheit ALLE ihre Fassungen, beim Verwerfen einer Fassung
  // nur diese (Audit Runde 2, R2-D1).
  // Der Rückweg einer entfernten Meldung übersteht das Verlassen der
  // Ansicht (nur Arbeitsspeicher, bis die Seite neu lädt): Bisher führte
  // danach nur „Einsatz importieren…" mit einer älteren Datei zurück (Audit
  // Runde 3, R3-D4).
  const [entferntStapel, setEntferntStapel] = useState<Entfernt[]>(() => entferntGemerkt.get(einsatz.id) ?? []);
  const zuletztEntfernt: Entfernt | null = entferntStapel[entferntStapel.length - 1] ?? null;
  const stapelSetzen = (neu: Entfernt[]) => {
    if (neu.length > 0) entferntGemerkt.set(einsatz.id, neu);
    else entferntGemerkt.delete(einsatz.id);
    setEntferntStapel(neu);
  };
  /** `x`: oben auf den Stapel; `null`: Leiste schließen, der Rückweg ist damit aufgegeben. */
  const setZuletztEntfernt = (x: Entfernt | null) => {
    // Jede entfernte Meldung liegt zusätzlich im Papierkorb der Sammlung und übersteht das Neuladen (R17-E2, R17-D6).
    if (x) void papierkorbBewegen((m) => m.meldungInPapierkorb(einsatz.id, x));
    stapelSetzen(x ? [...entferntStapel, x].slice(-ENTFERNT_STAPEL_MAX) : []);
  };
  // Zeichnet neu, wenn sich der Papierkorb bewegt hat (die Vorprüfung `papierkorbGefuellt` liest den Speicher bei jedem Zeichnen).
  const [, setPapierkorbStand] = useState(0);
  /** Den Papierkorb ändern (Modul bei Bedarf nachladen) und danach neu zeichnen. */
  const papierkorbBewegen = async (aktion: (m: typeof import("./meldungs-papierkorb")) => void) => {
    aktion(await import("./meldungs-papierkorb"));
    setPapierkorbStand((n) => n + 1);
  };
  // Zuletzt aufgeteilt — Quittung mit Rückweg (R2-D6).
  const [aufgeteilt, setAufgeteilt] = useState<Aufgeteilt | null>(null);
  // Zuletzt zusammengeführt — Quittung mit Rückweg (R4-D5).
  const [zusammengefuehrt, setZusammengefuehrt] = useState<Zusammengefuehrt | null>(null);
  // Zuletzt „Stärke ändern…" — Quittung mit Rückweg (R4-E4).
  const [staerkeGeaendert, setStaerkeGeaendert] = useState<StaerkeGeaendert | null>(null);
  // Quittung eines Rückwegs: Das Zurücknehmen geschah bisher wortlos — wer
  // nach 700 ms ein zweites Mal tippte und dabei „Rückgängig" traf, sah nur,
  // dass die Leiste verschwand (Audit Runde 3, R3-G2).
  const [zurueckQuittung, setZurueckQuittung] = useState<{ text: string; nonce: number } | null>(null);
  const zurueckQuittieren = (text: string) => setZurueckQuittung({ text, nonce: Date.now() });

  /** Aufteilung zurücknehmen: die beiden neuen Einträge heraus, die Fassung davor gilt wieder. */
  async function aufteilungZurueck() {
    if (!aufgeteilt) return;
    const ok = await gesichert("Rückgängig", () => {
      for (const id of aufgeteilt.neueIds) meldungEntfernen(einsatz.id, id);
      entfernteMerken(einsatz.id, aufgeteilt.neueIds); // kommen beim Import nicht still zurück (R2-D4)
    });
    if (!ok) return;
    zurueckQuittieren(`Aufteilen zurückgenommen: „${aufgeteilt.teil}" ist wieder Teil von „${aufgeteilt.name}".`);
    setAufgeteilt(null);
    onGeaendert();
  }

  /** „So gezählt" zurücknehmen: Die Einheit steht wieder als Sollstärke, nicht gemeldet da (R16-S3). */
  async function gezaehltZurueckNehmen() {
    if (!gezaehltWeg) return;
    const w = gezaehltWeg;
    let da = true;
    const ok = await gesichert("Rückgängig", () => {
      da = gezaehltZuruecknehmen(w);
    });
    if (!ok) return;
    setGezaehltWeg(null);
    zurueckQuittieren(da ? `Wieder als Sollstärke geführt: „${w.name}" — ${SOLL_NICHT_GEMELDET}.` : `„${w.name}" ist nicht mehr in dieser Sammlung.`);
    onGeaendert();
  }

  /** Stärke zurücknehmen: die neue Fassung heraus, die davor gilt wieder. */
  async function staerkeZurueckNehmen() {
    if (!staerkeGeaendert) return;
    const { eintragId, name, vorher } = staerkeGeaendert;
    const ok = await gesichert("Rückgängig", () => {
      meldungEntfernen(einsatz.id, eintragId);
      entfernteMerken(einsatz.id, [eintragId]); // kommt beim Import nicht still zurück (R2-D4)
    });
    if (!ok) return;
    zurueckQuittieren(
      staerkeGeaendert.kennzeichnung
        ? `Zurückgenommen: „${name}" ${staerkeGeaendert.kennzeichnung === "einsatz" ? "ist wieder als Übung gekennzeichnet" : "zählt wieder als Einsatzmeldung"}.`
        : `Stärke zurückgenommen: „${name}" gilt wieder mit ${vorher}.`,
    );
    setStaerkeGeaendert(null);
    onGeaendert();
  }

  /** Eine Folgemeldung zurücknehmen (Quittung „Zuletzt eingelesen"): die Fassung heraus, die davor gilt wieder. */
  async function folgemeldungZurueckNehmen() {
    if (!eingegangen || !eingang) return;
    const name = einheitAnzeigename(eingegangen.bogen.einheit);
    const davor = fassungenJeEinheit(einsatz.eintraege, eingegangen.einheitSchluessel).find((x) => x.id !== eingegangen.id);
    const ok = await gesichert("Rückgängig", () => {
      meldungEntfernen(einsatz.id, eingegangen.id);
      entfernteMerken(einsatz.id, [eingegangen.id]);
    });
    if (!ok) return;
    setEingangWeg(eingang.nonce);
    zurueckQuittieren(`Folgemeldung zurückgenommen: „${name}" gilt wieder mit Stärke ${davor ? staerke(davor.bogen).gesamt : "?"}.`);
    onGeaendert();
  }

  /** Zusammenführen zurücknehmen: Teile wieder anwesend, die neue Fassung heraus. */
  async function zusammenfuehrungZurueckNehmen() {
    if (!zusammengefuehrt) return;
    const ok = await gesichert("Rückgängig", () => {
      zusammenfuehrungZurueck(einsatz.id, zusammengefuehrt.vorher);
      if (zusammengefuehrt.vorher.zielWarNeu) entfernteMerken(einsatz.id, [zusammengefuehrt.vorher.zielId]);
    });
    if (!ok) return;
    zurueckQuittieren(`Zusammenführen zurückgenommen: „${zusammengefuehrt.name}" steht wieder in ${zusammengefuehrt.vorher.teile.length === 1 ? "zwei Teilen" : `${zusammengefuehrt.vorher.teile.length + 1} Teilen`}.`);
    setZusammengefuehrt(null);
    onGeaendert();
  }

  /** Eine entfernte Meldung aus dem Papierkorb der Sammlung zurücklegen — auch nach dem Neuladen (R17-E2, R17-D6). */
  async function ausPapierkorbHolen(m: PapierkorbMeldung) {
    const ids = m.eintraege.map((e) => e.id);
    const ok = await gesichert("Zurückholen", () => {
      einsatzImportieren({ ...einsatz, eintraege: m.eintraege });
      entfernteVergessen(einsatz.id, ids);
    });
    if (!ok) return;
    void papierkorbBewegen((p) => p.meldungAusPapierkorb(einsatz.id, m.id));
    const idSet = new Set(ids);
    if (entferntStapel.some((x) => x.eintraege.some((e) => idSet.has(e.id)))) stapelSetzen(entferntStapel.filter((x) => !x.eintraege.some((e) => idSet.has(e.id))));
    zurueckQuittieren(m.art === "fassung" ? `Fassung von „${m.name}" zurückgeholt.` : `Meldung „${m.name}" zurückgeholt.`);
    onGeaendert();
  }

  /** Entferntes unverändert zurücklegen (mit Signatur, Herkunft, Zeiten, Notiz, Etiketten). */
  async function entferntesZurueckholen() {
    if (!zuletztEntfernt) return;
    const ok = await gesichert("Rückgängig", () => {
      einsatzImportieren({ ...einsatz, eintraege: zuletztEntfernt.eintraege });
      // Zurückgeholt gilt nicht mehr als „hier entfernt" (R2-D4).
      entfernteVergessen(einsatz.id, zuletztEntfernt.eintraege.map((e) => e.id));
    });
    if (!ok) return;
    const zurueckIds = zuletztEntfernt.eintraege.map((e) => e.id);
    void papierkorbBewegen((p) => p.meldungAusPapierkorb(einsatz.id, zurueckIds));
    const name = einheitAnzeigename(zuletztEntfernt.eintraege[0]!.bogen.einheit);
    const weitere = entferntStapel.length - 1;
    zurueckQuittieren(
      (zuletztEntfernt.art === "fassung" ? `Fassung von „${name}" zurückgeholt.` : `Meldung „${name}" zurückgeholt.`) +
        (weitere > 0 ? ` Noch ${weitere} weitere zum Zurückholen.` : ""),
    );
    stapelSetzen(entferntStapel.slice(0, -1));
    onGeaendert();
  }

  /**
   * Statuswechsel zurücknehmen: der Stand VOR dem Tipp kommt wieder — samt
   * der alten Abrückzeit, falls die Einheit vorher schon einmal abgerückt war.
   */
  async function statusZurueck() {
    if (!statusWechsel) return;
    const { vorher } = statusWechsel;
    const ok = await gesichert("Rückgängig", () =>
      statusMitZeitSetzen(einsatz.id, vorher.id, vorher.status, vorher.abgerueckAm),
    );
    if (!ok) return;
    const nr = nummern.get(vorher.einheitSchluessel);
    // Ergebnis zuerst — die Leiste kürzt den Namen am Ende.
    zurueckQuittieren(
      (vorher.status === MeldeStatus.ABGERUECKT ? "Wieder abgerückt: " : "Wieder anwesend: ") +
        (statusWechsel.status === MeldeStatus.ABGERUECKT ? "Abrücken" : '„Wieder anwesend"') +
        ` von ${nr != null ? `Nr. ${nr} ` : ""}„${einheitAnzeigename(vorher.bogen.einheit)}" zurückgenommen.`,
    );
    setStatusWechsel(null);
    onGeaendert();
  }
  // Alle gemeldeten Einheiten (neueste Revision je Einheit) — Grundlage für die
  // Gesamtzahl; `kopf` ist davon nur der gerade angezeigte Ausschnitt. Suche,
  // Filter und Sortierung ändern die Summen oben bewusst nicht.
  const alleEinheiten = geltendeJeEinheit(einsatz.eintraege);
  /** Am Telefon steht die Suchleiste hinter einer Zeile, auch bei langer Liste: offen war sie 321 px hoch vor der ersten Karte (R4-K5, R5-K4); Suche oder Filter öffnen sie. */
  const filterEingeklappt = kompakt;
  const letzte = letzteMeldung(einsatz.eintraege);
  // Laufende Nummer je Meldung — dieselbe wie auf dem Lageblatt (R2-A6).
  const nummern = meldungsNummern(einsatz.eintraege);
  // Bögen, die für eine andere Lage ausgefüllt scheinen (R4-K6): Ort/Auftrag
  // teilt kein Wort mit Sammlung und übrigen Meldungen. Nur ein Hinweis.
  const fremdeOrte = new Map(
    alleEinheiten.flatMap((e) => {
      const ort = abweichenderOrt(e, einsatz, einsatz.eintraege);
      return ort != null ? [[e.einheitSchluessel, ort] as const] : [];
    }),
  );
  /** „Nr. 3 " für die Quittungsleiste — kurz und eindeutig, wie auf dem Lageblatt. */
  const nummerText = (schluessel: string) => {
    const nr = nummern.get(schluessel);
    return nr != null ? `Nr. ${nr} ` : "";
  };
  // Die zuletzt eingelesene Einheit (siehe `eingang`) — für die Quittung oben.
  const eingegangen = eingang ? alleEinheiten.find((e) => e.einheitSchluessel === eingang.schluessel) : undefined;
  // Die Quittung lag nach „In Einsatz übernehmen" und nach einem Scan bei
  // 636 px, unter dem Bildrand: Die Ansicht beginnt oben (R3-H1), und Kopf
  // und Stärke-Leiste füllen am Telefon das erste Bild (Audit Runde 3,
  // R3-S7, R3-N1). Einmal je Aufnahme rollt die Ansicht darum so weit, dass
  // die Quittung ganz im Bild steht; die Summen bleiben dabei sichtbar.
  // Nach dem Zurückrollen an den Anfang (useAnsichtBeginntOben in app.tsx,
  // ein Layout-Effekt) — darum useEffect und ein Bild später.
  const eingangQuittung = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!eingang || !eingegangen || eingang.nonce === eingangGerollt) return;
    eingangGerollt = eingang.nonce;
    // Von Hand statt scrollIntoView: scroll-padding-bottom hält Platz für die
    // Fußleiste des Assistenten frei, die es hier nicht gibt.
    requestAnimationFrame(() => {
      const r = eingangQuittung.current?.getBoundingClientRect();
      if (!r || r.height === 0) return;
      const ueber = r.bottom - (window.innerHeight - 16);
      if (ueber > 0) window.scrollBy(0, Math.min(ueber, r.top - 8));
    });
  }, [eingang, eingegangen]);
  // War es eine Folgemeldung, sagt die Quittung, was sich geändert hat (R3-K1).
  const eingangFolge = eingegangen ? folgeAenderung(eingegangen, einsatz.eintraege) : null;
  const nurSollAnzahl = alleEinheiten.filter((e) => nurSollstaerke(e.bogen)).length;
  // „…jetzt 1 Einheit, Gesamt 9" stand nach Stunden noch da und las sich wie der aktuelle Stand (R17-S8): Die Quittung
  // geht nach EINGANG_QUITTUNG_MS. Die Minutenuhr (useMinutenTakt) zeichnet dafür neu.
  const eingangGesehen = useRef<{ nonce: number | null; seit: number }>({ nonce: null, seit: Date.now() });
  if (eingangGesehen.current.nonce !== (eingang?.nonce ?? null)) eingangGesehen.current = { nonce: eingang?.nonce ?? null, seit: Date.now() };
  const eingangVeraltet = Date.now() - eingangGesehen.current.seit > EINGANG_QUITTUNG_MS;
  // „Rückgängig" an der Folgemeldung hat die Quittung verbraucht (R4-E4).
  const [eingangWeg, setEingangWeg] = useState<number | null>(null);
  /**
   * Beim Öffnen und nach jeder Aufnahme beginnt die Ansicht oben, bei Summe
   * und Aufnahme-Knopf. Vorher öffnete sie mitten auf der Seite (mit der
   * Rollposition der vorigen Ansicht) bzw. an der neuen Karte, rund 700 px
   * unter dem Knopf für die nächste Einheit (Audit Runde 2, R2-S3). Die
   * Karte quittiert trotzdem; wer sie sehen will, tippt „In der Liste zeigen".
   */
  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch {
      /* Testumgebung ohne Layout */
    }
  }, [einsatz.id, eingang?.nonce]);
  /** Die Karte (oder Tabellenzeile) der zuletzt eingelesenen Einheit ins Bild holen. */
  function eingangZeigen() {
    if (!eingegangen) return;
    const ziel = [...document.querySelectorAll<HTMLElement>("[data-einheit]")].find(
      (el) => el.dataset.einheit === eingegangen.einheitSchluessel,
    );
    ziel?.scrollIntoView({ block: "center" });
  }
  /**
   * Was seit der letzten Kenntnisnahme in die Sammlung kam — neue Einheiten
   * und Folgemeldungen, in Eingangsreihenfolge. Kommen mehrere Einheiten kurz
   * nacheinander oder als Stapel, nannte die Quittung nur „4 Bögen
   * aufgenommen" (Audit Runde 2, R2-S4). Danach merkte sich die Ansicht den
   * Eingang nur im Arbeitsspeicher: nach dem Neuladen war die Quittung weg,
   * und ob eine Zeile eine neue Einheit oder eine Folgemeldung mit drei
   * Helfern weniger war, sagte sie nicht (Audit Runde 3, R3-K1). Jetzt steht
   * der Stand je Gerät im Speicher (export-stand.ts) und die Quittung bleibt,
   * bis jemand „Zur Kenntnis genommen" tippt. Eigene Umbauten (Aufteilen,
   * Zusammenführen) und zurückgeholte Meldungen zählen nicht: deren
   * Kennungen waren schon da oder entstehen hier.
   */
  const [kenntnis, setKenntnis] = useState<{ einsatzId: string; stand: ExportStand } | null>(null);
  const kenntnisStand =
    kenntnis?.einsatzId === einsatz.id
      ? kenntnis.stand
      : (kenntnisStandLaden(einsatz.id) ?? kenntnisVermerken(einsatz, alleEinsatzIds()));
  useEffect(() => {
    if (kenntnis?.einsatzId !== einsatz.id) setKenntnis({ einsatzId: einsatz.id, stand: kenntnisStand });
  }, [einsatz.id, kenntnis?.einsatzId, kenntnisStand]);
  /**
   * „Zur Kenntnis genommen" räumt die Merkliste für alle Einheiten ab (R11-D1): Es gibt dafür eine Quittung mit
   * „Rückgängig", die den Stand davor samt der Hinweise („passt das zu dieser Lage?") zurückbringt. Schlägt das
   * Speichern fehl (voller Speicher), sagt es ein Hinweis, statt still zu scheitern (R11-O4).
   */
  // Offene Widersprüche eines Imports (R11-O3): bleiben nach dem Neuladen stehen, bis „Erledigt".
  const [widersprueche, setWidersprueche] = useState<string[]>(() => widerspruchLaden(einsatz.id));
  useEffect(() => {
    setWidersprueche(widerspruchLaden(einsatz.id));
  }, [einsatz.id, einsatz.geaendert]);
  // Zuletzt mit „Erledigt" weggeräumte Widersprüche — solange sie hier stehen, gibt es „Rückgängig" (R12-O2).
  const [widerspruchErledigt, setWiderspruchErledigt] = useState<string[] | null>(null);
  useEffect(() => setWiderspruchErledigt(null), [einsatz.id]);
  const [kenntnisGenommen, setKenntnisGenommen] = useState<{ vorher: ExportStand; anzahl: number; nonce: number } | null>(null);
  // Alle neuen Einheiten einzeln im Kasten „Neu seit der letzten Kenntnisnahme" zeigen (bei vielen, R15-S2).
  const [stapelAlle, setStapelAlle] = useState(false);
  // Die Quittung gehört zu diesem Einsatz und weicht jeder jüngeren Quittung (eine Leiste zur Zeit).
  useEffect(() => {
    setKenntnisGenommen(null);
  }, [einsatz.id]);
  // Zug für mehrere Einheiten auf einmal gesetzt: Quittung mit „Rückgängig", die zu genau dieser Handlung gehört
  // (R14-G2/H2/D3). Jede andere Quittung und jede spätere Handlung an einer Karte (Zug, Auftrag, Zeit) ersetzt sie —
  // ein stehengebliebenes „Rückgängig" nähme sonst etwas anderes zurück als die letzte Handlung.
  const [zugGesetzt, setZugGesetzt] = useState<ZugGesetzt | null>(null);
  // Verschieben in einen anderen Einsatz: „Rückgängig" bleibt auch nach „Alles klar" erreichbar (R14-D4).
  const [verschobenQuittung, setVerschobenQuittung] = useState<Verschoben | null>(null);
  // Auftrag/Notiz an einer Karte gespeichert: Quittung mit „Rückgängig" (R15-W3).
  const [auftragGesetzt, setAuftragGesetzt] = useState<AuftragGesetzt | null>(null);
  // Name oder Ort des Einsatzes geändert: Quittung mit „Rückgängig" (R16-K1).
  const [kopfGeaendert, setKopfGeaendert] = useState<{ vorher: { name: string; ort: string }; nachher: string; nonce: number } | null>(null);
  useEffect(() => {
    setZugGesetzt(null);
    setVerschobenQuittung(null);
    setAuftragGesetzt(null);
    setKopfGeaendert(null);
  }, [einsatz.id]);

  /** Name und Ort/Auftrag am Kopf ändern oder nachtragen (R16-K1). */
  async function kopfAendern() {
    const w = await frageFelder({
      titel: "Einsatz bearbeiten",
      hinweis: "Name und Ort stehen auf Lageblatt, Sammel-PDF und Lagemonitor. Einheiten, Zeiten und Aufträge bleiben, wie sie sind.",
      ok: "Übernehmen",
      felder: [
        { name: "name", label: "Name", vorgabe: einsatz.name },
        // Der Knopf „Ort eintragen…" setzt den Cursor in das Feld, das er nennt (R17-S4).
        { name: "ort", label: "Ort / Auftrag (optional)", vorgabe: einsatz.ort ?? "", optional: true, platzhalter: "z. B. Deichabschnitt Nord", fokus: !einsatz.ort },
      ],
    });
    if (!w) return;
    const name = (w.name ?? "").trim() || einsatz.name;
    const ort = (w.ort ?? "").trim();
    if (name === einsatz.name && ort === (einsatz.ort ?? "")) return;
    const alt: { werte: { name: string; ort: string } | null } = { werte: null };
    if (!(await gesichert("Nicht geändert", () => (alt.werte = einsatzKopfSetzen(einsatz.id, name, ort))))) return;
    if (!alt.werte) return;
    setKopfGeaendert({ vorher: alt.werte, nachher: kopfAenderungText(alt.werte, name, ort), nonce: Date.now() });
    onGeaendert();
  }

  async function kopfZurueck() {
    if (!kopfGeaendert) return;
    const { vorher } = kopfGeaendert;
    if (!(await gesichert("Rückgängig", () => einsatzKopfSetzen(einsatz.id, vorher.name, vorher.ort)))) return;
    zurueckQuittieren(`Zurückgenommen: Der Einsatz heißt wieder „${vorher.name}".`);
    setKopfGeaendert(null);
    onGeaendert();
  }
  // Empfang übersprungen, weil der Inhalt schon da war: die Antwort steht in der Quittungsleiste, nicht am Seitenende (R15-W1).
  const uebersprungenQuittung = useMemo(
    () => (eingang?.uebersprungen && eingang.nonce !== eingangWeg ? { text: eingang.uebersprungen, nonce: eingang.nonce } : null),
    [eingang, eingangWeg],
  );
  // Eine Leiste zur Zeit (R15-D1): gezeigt wird die zuletzt ausgelöste, die älteren weichen. Der Stapel der entfernten
  // Meldungen bleibt (er hat seinen eigenen Rückweg und kommt wieder, wenn die jüngere Leiste weg ist).
  // „Zahlen stimmen, so gezählt" (R16-S3): Die Rückfrage legte die Sollzahlen als Meldung ab; „Rückgängig" führt sie wieder als Sollstärke.
  const [gezaehltWeg, setGezaehltWeg] = useState(() => gezaehltWegFuer(einsatz.id));
  useEffect(() => {
    const abgleichen = () => setGezaehltWeg(gezaehltWegFuer(einsatz.id));
    abgleichen();
    return gezaehltWegBeobachten(abgleichen);
  }, [einsatz.id]);
  const aktiveQuittung = useJuengsteQuittung({
    entfernt: zuletztEntfernt, aufgeteilt, staerke: staerkeGeaendert, zusammen: zusammengefuehrt, status: statusWechsel,
    verschoben: verschobenQuittung, zug: zugGesetzt, auftrag: auftragGesetzt, kenntnis: kenntnisGenommen, zurueck: zurueckQuittung,
    uebersprungen: uebersprungenQuittung, kopf: kopfGeaendert, gezaehlt: gezaehltWeg,
  }, "entfernt");
  useEffect(() => {
    // Eine Leiste ohne Knopf ist nur Auskunft: sie geht von selbst, statt eine Weile im Weg zu stehen.
    if (aktiveQuittung === "uebersprungen") {
      const nonce = uebersprungenQuittung?.nonce ?? null;
      const uhr = setTimeout(() => setEingangWeg(nonce), 12_000);
      return () => clearTimeout(uhr);
    }
    if (aktiveQuittung !== "zurueck") return;
    const uhr = setTimeout(() => setZurueckQuittung(null), 12_000);
    return () => clearTimeout(uhr);
  }, [aktiveQuittung, zurueckQuittung, uebersprungenQuittung]);
  /** Eine spätere Handlung an einer Karte: ältere Quittungen ohne Bezug zu ihr weichen. */
  const andereHandlung = () => {
    setKenntnisGenommen(null);
    setAuftragGesetzt(null);
    setZugGesetzt(null);
    setZurueckQuittung(null);
    setVerschobenQuittung(null);
  };
  const zugGesetztMelden = (z: ZugGesetzt) => {
    andereHandlung();
    setZugGesetzt(z);
  };
  async function zugZurueck() {
    if (!zugGesetzt) return;
    const { zug, ziele } = zugGesetzt;
    // Nur, was noch diesen Zug trägt (an einer Karte inzwischen anders gesetzt: bleibt).
    const betroffen = ziele.filter((z) => einsatz.eintraege.some((e) => e.id === z.id && e.zugEtikett === zug));
    const ok = await gesichert("Rückgängig", () => {
      for (const z of betroffen) zugSetzen(einsatz.id, z.einheitSchluessel, z.id, "");
    });
    setZugGesetzt(null);
    if (ok) {
      zurueckQuittieren(`Zug „${zug}“ wieder entfernt: ${betroffen.length === 1 ? "1 Einheit" : `${betroffen.length} Einheiten`}.`);
      onGeaendert();
    }
  }
  function kenntnisNehmen() {
    const vorher = kenntnisStand;
    const anzahl = aufgenommenListe.length;
    // R15-G1: Der Block verschwindet, die Liste rückt unter den Finger — der zweite Tipp an dieser Stelle klappte eine Karte auf.
    // Nur so lang wie der Prellschutz: Das „Rückgängig" der Quittung liegt oft genau dort und musste 2,5 s warten (R17-D3).
    ortSperren(QUITTUNG_SPERRE_KURZ_MS);
    const { stand, gespeichert } = kenntnisVermerkenGeprueft(einsatz, alleEinsatzIds(), Date.now(), true);
    setKenntnis({ einsatzId: einsatz.id, stand });
    setZugGesetzt(null);
    setVerschobenQuittung(null);
    setKenntnisGenommen({ vorher, anzahl, nonce: Date.now() });
    if (!gespeichert) {
      void zeigeHinweis({
        titel: "Kenntnisnahme nicht gespeichert",
        text: "Der Speicher ist voll oder gesperrt. Die Meldungen gelten in dieser Ansicht als gesehen, erscheinen nach dem Neuladen aber wieder als „neu“.",
      });
    }
  }
  function kenntnisZurueck() {
    if (!kenntnisGenommen) return;
    const { vorher } = kenntnisGenommen;
    const gespeichert = kenntnisWiederherstellen(einsatz.id, vorher, alleEinsatzIds());
    setKenntnis({ einsatzId: einsatz.id, stand: vorher });
    setKenntnisGenommen(null);
    if (!gespeichert) {
      void zeigeHinweis({
        titel: "Rückgängig nicht gespeichert",
        text: "Der Speicher ist voll oder gesperrt. Die Liste ist hier wieder da, nach dem Neuladen aber nicht mehr.",
      });
    }
  }
  const ungeseheneIds = new Set(neuZurKenntnis(einsatz.eintraege, kenntnisStand).map((e) => e.id));
  const zuletztAufgenommen = [
    ...new Set(
      einsatz.eintraege
        .filter((e) => ungeseheneIds.has(e.id))
        .sort((a, b) => a.empfangenAm - b.empfangenAm)
        .map((e) => e.einheitSchluessel),
    ),
  ];
  const aufgenommenListe = zuletztAufgenommen
    .map((schl) => alleEinheiten.find((e) => e.einheitSchluessel === schl))
    .filter((e): e is MeldeEintrag => e != null);
  // Eine einzelne, gerade eingelesene Meldung quittiert schon „Zuletzt
  // eingelesen" — dieselbe Einheit zweimal untereinander wäre Lärm.
  // Einheiten, deren aktuelle Fassung eine frische oder noch nicht zur
  // Kenntnis genommene Folgemeldung ist — Marke auch in der Tabelle (R3-K1).
  // Jünger als 30 Minuten und seit dem letzten Tipp auf „Zur Kenntnis genommen"
  // eingegangen — nach dem Tipp trägt nichts davon mehr eine Marke (R4-K7).
  const frischUnquittiert = (e: MeldeEintrag) =>
    (frischGemeldet(e) || istNeu(e)) && !(kenntnisStand.bestaetigt === true && e.empfangenAm <= kenntnisStand.zeitpunkt);
  const neueFassungen = new Set(
    alleEinheiten
      // Gebunden an die Kenntnisnahme, nicht nur an die Uhr: „Zur Kenntnis
      // genommen" nimmt die Marke weg (R4-K7). Vorher blieb sie noch 30 Minuten
      // stehen.
      .filter((e) => (ungeseheneIds.has(e.id) || frischUnquittiert(e)) && folgeAenderung(e, einsatz.eintraege) != null)
      .map((e) => e.einheitSchluessel),
  );
  const sammelquittungZeigen =
    aufgenommenListe.length > 1 ||
    (aufgenommenListe.length === 1 && aufgenommenListe[0]!.einheitSchluessel !== eingegangen?.einheitSchluessel);
  const aufgenommenUebung = aufgenommenListe.filter((e) => uebungenDaneben.some((u) => u.id === e.id)).length;
  // R15-S2: Nach einem Stapelimport stand jede Einheit als Satz im Kasten, die Liste lag drei Bildschirme tiefer. Ab
  // QUITTUNG_VIELE Einheiten bleiben nur die Zahl und die dringenden Fälle (ungültige Signatur, Rückkehr) stehen.
  const stapelKurz = aufgenommenListe.length > QUITTUNG_VIELE && !stapelAlle;
  const gezeigteZeilen = stapelKurz
    ? aufgenommenListe.filter((e) => e.signatur?.zustand === "ungueltig" || folgeAenderung(e, einsatz.eintraege)?.rueckkehr).slice(0, QUITTUNG_MAX)
    : aufgenommenListe;
  const stapelOrtHinweise = stapelKurz ? aufgenommenListe.filter((e) => !gezeigteZeilen.includes(e) && fremdeOrte.has(e.einheitSchluessel)).length : 0;
  const qualiListe = qualifikationenImEinsatz(alleEinheiten);
  const gewaehlteQuali = qualiListe.find((q) => q.schluessel === quali);
  // Zwei Gruppen in der Auswahlliste: „wer kann X?" und „wer darf was fahren?"
  // sind verschiedene Fragen; in einer Liste standen die Fahrerlaubnisklassen
  // alphabetisch zwischen den Funktionen (K6). Die Klassen tragen den
  // Schlüsselraum „kf…" (siehe qualisDerPerson).
  const istFahrerlaubnis = (schluessel: string) => schluessel === "kf" || schluessel.startsWith("kf:");
  const qualiFunktionen = qualiListe.filter((q) => !istFahrerlaubnis(q.schluessel));
  const qualiFahrerlaubnis = qualiListe.filter((q) => istFahrerlaubnis(q.schluessel));
  const kopfOhneBedarfsfilter = einheitenAnsicht(alleEinheiten, suche, sortierung, quali, nummern);
  const kopfNachBedarf = bedarfsFilter ? kopfOhneBedarfsfilter.filter((e) => passtZuBedarfsfilter(e, bedarfsFilter)) : kopfOhneBedarfsfilter;
  const kopfNachLuecke = lueckenFilter ? kopfNachBedarf.filter((e) => passtZuLueckenfilter(e, lueckenFilter)) : kopfNachBedarf;
  const kopf = statusFilter ? kopfNachLuecke.filter((e) => passtZuStatusfilter(e, statusFilter)) : kopfNachLuecke;
  // Erste nicht anwesende Karte, falls vor ihr anwesende stehen: dort beginnt der Abschnitt „Abgerückt" (R17-E6, K4).
  const abgerueckteStelle = kopf.some((e) => e.status === MeldeStatus.ANWESEND) ? kopf.findIndex((e) => e.status !== MeldeStatus.ANWESEND) : -1;
  const anwesendAnzahl = alleEinheiten.filter((e) => passtZuStatusfilter(e, "anwesend")).length;
  const abgerueckteAnzahl = alleEinheiten.length - anwesendAnzahl;
  const veraltetAnzahl = alleEinheiten.filter((e) => passtZuStatusfilter(e, "veraltet")).length;
  // „Wer hat noch keinen Auftrag, noch keinen Zug?" — gezählt über alle anwesenden Einheiten (R7-K6).
  const ohneAuftragAnzahl = alleEinheiten.filter((e) => passtZuLueckenfilter(e, "ohne-auftrag")).length;
  const ohneZugAnzahl = alleEinheiten.filter((e) => passtZuLueckenfilter(e, "ohne-zug")).length;
  const gefiltert = kopf.length !== alleEinheiten.length;
  /** Irgendeine Einschränkung wirkt: dann bleibt die Suchleiste auch am Telefon offen (R4-K5). */
  const filterAktiv = suche.trim() !== "" || quali !== "" || nurBedarf || lueckenFilter != null || statusFilter != null;
  // Der Lückenfilter („n ohne Auftrag") klappt das Feld nicht auf: Er steht in der Zeile darüber, samt „Filter aufheben" (R10-K2).
  const filterAktivOhneLuecke = suche.trim() !== "" || quali !== "" || nurBedarf || statusFilter != null;
  // Meldeköpfe melden oft nur die Stärke — dort steht keine Person und damit
  // keine Qualifikation. Ohne diesen Hinweis sähe der Filter wie ein Fehler aus.
  const ohnePersonen = alleEinheiten.filter(
    (e) => e.bogen.personalErfassung === PersonalErfassung.NUR_STAERKE || e.bogen.personal.length === 0,
  ).length;
  // Kurzform für die Trefferzeile an der Karte: „AGT" statt der ganzen
  // Beschriftung — die steht schon im Hinweis über der Liste.
  const qualiKurz = gewaehlteQuali?.label.split(" – ")[0] ?? "";

  /**
   * Einsatz löschen — mit Rückfrage, obwohl es „nur" in den Papierkorb geht.
   *
   * Der Knopf stand als einzige dauerhaft eingeblendete Aktion in der festen
   * Fußleiste, an genau der Stelle, an der im Assistenten „← Zurück" sitzt: ein
   * Daumentipp löschte die ganze Sammlung, ohne Frage, ohne Rückmeldung, und
   * der Rückweg über den Papierkorb ist von dort aus nicht zu sehen. Die
   * Rückfrage nennt deshalb den Umfang und den Papierkorb beim Namen.
   */
  async function loeschen() {
    const anzahl = geltendeJeEinheit(einsatz.eintraege).length;
    const sicher = await frageJaNein({
      titel: "Einsatz löschen?",
      text: `„${einsatz.name}" mit ${anzahl} gemeldeten Einheit${anzahl === 1 ? "" : "en"} wandert in den Papierkorb und lässt sich dort 30 Tage lang zurückholen.${loeschenErfassungSatz(props.angefangeneErfassung)}`,
      ok: "In den Papierkorb",
      gefahr: true,
    });
    if (!sicher) return;
    if (!(await gesichert("Nicht gelöscht", () => einsatzLoeschen(einsatz.id), undefined, einsaetzePapierkorb().length === 0))) return;
    // Die Startseite quittiert mit Rückweg (R2-D6).
    zuletztGeloeschterEinsatz = { id: einsatz.id, name: einsatz.name };
    onGeloescht();
  }

  const filterZeile = (
    <div className="zeile einheiten-filter">
      <label className="feld">
        Suche
        <input
          type="search"
          {...NAMEN_EINGABE}
          value={suche}
          placeholder="Einheit, Organisation, Ort, Zug, Kennzeichen, Auftrag…"
          onChange={(e) => setSuche(e.target.value)}
        />
      </label>
      <label className="feld sortierung">
        Sortierung
        <Auswahl
          beschriftung="Sortierung"
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as EinheitenSortierung)}
        >
          {SORTIERUNGEN.map((s) => (
            <option key={s.wert} value={s.wert}>{s.label}</option>
          ))}
        </Auswahl>
      </label>
      {/* Erst anbieten, wenn überhaupt Qualifikationen gemeldet sind —
          bei reinen Stärkemeldungen wäre die Liste leer. */}
      {qualiListe.length > 0 && (
        <label className="feld sortierung">
          Qualifikation
          <Auswahl
            beschriftung="Qualifikation"
            value={quali}
            onChange={(e) => setQuali(e.target.value)}
          >
            <option value="">alle</option>
            {qualiFunktionen.length > 0 && (
              <optgroup label="Funktionen">
                {qualiFunktionen.map((q) => (
                  <option key={q.schluessel} value={q.schluessel}>
                    {q.label} ({q.personen})
                  </option>
                ))}
              </optgroup>
            )}
            {qualiFahrerlaubnis.length > 0 && (
              <optgroup label="Fahrerlaubnis">
                {qualiFahrerlaubnis.map((q) => (
                  <option key={q.schluessel} value={q.schluessel}>
                    {q.label} ({q.personen})
                  </option>
                ))}
              </optgroup>
            )}
          </Auswahl>
        </label>
      )}
      {/* „Wer braucht etwas?" — der Bedarf stand nur als Summe im Kopf,
          die Zuordnung führte die Führungskraft nebenbei auf Papier (K1). */}
      <label className="inline bedarf-filter" title="Ruhezeit, Unterbringung, abweichende Verpflegung — Kraftstoff allein zählt nicht.">
        <input
          type="checkbox"
          checked={nurBedarf}
          onChange={(e) => setBedarfsFilter(e.target.checked ? "dringend" : null)}
        />
        {" "}nur dringender Bedarf (ohne Kraftstoff)
      </label>
      {/* Lücken: wer noch keinen Auftrag oder keinen Zug hat (R7-K6). */}
      <label className="feld sortierung">
        Auftrag / Zug
        <Auswahl
          beschriftung="Auftrag / Zug"
          value={lueckenFilter ?? ""}
          onChange={(e) => setLueckenFilter((e.target.value || null) as LueckenFilter | null)}
        >
          <option value="">alle</option>
          <option value="ohne-auftrag">ohne Auftrag ({ohneAuftragAnzahl})</option>
          <option value="ohne-zug">ohne Zug ({ohneZugAnzahl})</option>
        </Auswahl>
      </label>
      {/* Status: „wer ist noch da?" ohne die durchgestrichenen Karten (R11-K2). */}
      <label className="feld sortierung">
        Status
        <Auswahl
          beschriftung="Status"
          value={statusFilter ?? ""}
          onChange={(e) => setStatusFilter((e.target.value || null) as StatusFilter | null)}
        >
          <option value="">alle</option>
          <option value="anwesend">nur Anwesende ({anwesendAnzahl})</option>
          <option value="abgerueckt">nur Abgerückte ({abgerueckteAnzahl})</option>
          <option value="veraltet">nur ⚠ ältere als 1 Std ({veraltetAnzahl})</option>
        </Auswahl>
      </label>
    </div>
  );

  return (
    <>
    <SeitenKopf variante="einsatz-kopf">
      {/* Rücksprung und Anzeige-Umschalter in einer Zeile — wie im Assistenten.
          Wer am Meldekopf in die Nacht oder in die Sonne gerät, darf den
          Umschalter nicht erst in der Fußzeile unter 30 Karten suchen müssen
          (Nacht-und-Sicht-Audit N3). */}
      <div className="kopf-oberzeile">
        {/* „‹ Startseite" wie im Assistenten: Der Weg führt auf die
            Startseite, die Einsätze stehen dort erst weiter unten (R3-N6). */}
        <button type="button" className="zur-start" onClick={onZurueck}>‹ Startseite</button>
        <AnzeigeSchalter beschriftet />
      </div>
      <div className="titelzeile">
        <h1>{einsatz.name}</h1>
        <button type="button" className="kopf-aendern" onClick={() => void kopfAendern()}>
          {einsatz.ort ? "Name / Ort ändern…" : "Ort eintragen…"}
        </button>
      </div>
      <p className="hinweis">
        {ART_LABEL[einsatz.art]}{einsatz.ort ? ` · ${einsatz.ort}` : ""}
        {/* Wie aktuell die Zahlen darunter sind: Wer das Gerät übernimmt, sah
            nicht, ob die letzte Meldung von eben oder von gestern war (Audit
            Runde 3, R3-K5). */}
        {letzte != null && (() => {
          const m = meldeZeitMitAlter(letzte);
          return <span className={`letzte-meldung${m.veraltet ? " warnung-text" : ""}`}> · letzte Meldung {m.text}</span>;
        })()}
        {/* Das Alter der Anwesenden, nicht der jüngsten Meldung (R11-K1). */}
        {aeltesteAnwesendeText(einsatz) && (
          <span className="letzte-meldung aelteste-meldung warnung-text"> · {aeltesteAnwesendeText(einsatz)}</span>
        )}
      </p>
      {/* Übergabevermerk im Kopf: Wer das alte Gerät nach der Schichtübergabe
          wieder in die Hand nimmt, sieht zuerst, dass die Lage weitergegeben
          wurde — und ob seitdem etwas nur hier dazukam (R2-W5). */}
      {weitergabeStand && (
        <p className={`hinweis weitergabe-vermerk${weitergabeOffen ? " seitdem-neu" : ""}`}>
          <strong>Weitergabe-Datei erzeugt {exportZeitKurz(weitergabeStand.zeitpunkt)}</strong>
          {" — Empfang nicht bestätigt"}
          {!weitergabeOffen
            ? ", seitdem hier nichts Neues."
            : `, seitdem hier ${[
                ...(seitWeitergabe > 0 ? [seitWeitergabe === 1 ? "1 neue Meldung" : `${seitWeitergabe} neue Meldungen`] : []),
                ...(aenderungenSeitWeitergabe.anzahl > 0
                  ? [`${aenderungenSeitWeitergabe.anzahl === 1 ? "1 Änderung" : `${aenderungenSeitWeitergabe.anzahl} Änderungen`} (${aenderungenSeitWeitergabe.arten.join(", ")})`]
                  : []),
              ].join(" und ")}. Führt inzwischen ein anderes Gerät die Lage, fehlt das dort: erneut weitergeben.`}
          {weitergabeStand.uebernommenAm != null && ` Neuere Angaben aus der Datei des anderen Geräts übernommen ${exportZeitKurz(weitergabeStand.uebernommenAm)}.`}
        </p>
      )}
    </SeitenKopf>
    <main id="inhalt" tabIndex={-1} className="einsatz-detail">
      <AufraeumWarnung sammlung={einsatz} />
      {/* Kopfzahlen, Aufnahme, Bedarf und Summen bilden am Laptop die linke
          Spalte neben der Liste (R4-K5); auf dem Telefon löst „display:
          contents" den Rahmen auf, es bleibt eine Spalte. */}
      <div className="einsatz-seite">
      <section className="karte staerke-leiste">
        <div className="anzahl"><Zaehlwert wert={sum.einheiten} /><span>Einheiten</span></div>
        <div><Zaehlwert wert={sum.staerke.fuehrer} /><span>Führer</span></div>
        <div><Zaehlwert wert={sum.staerke.unterfuehrer} /><span>Unterf.</span></div>
        <div><Zaehlwert wert={sum.staerke.mannschaft} /><span>Mannsch.</span></div>
        <div className="gesamt"><Zaehlwert wert={sum.staerke.gesamt} /><span>Gesamt</span></div>
      </section>
      {/* Eine nicht gezählte Sollstärke steckt in der Summe: Die Summe sagt, wie viel davon (R8-A1). */}
      {sollAnteil.einheiten > 0 && (
        <p className="hinweis soll-anteil" role="status">
          Davon {sollAnteil.einheiten === 1 ? "1 Einheit" : `${sollAnteil.einheiten} Einheiten`} nur Sollstärke
          ({sollAnteil.personen} {sollAnteil.personen === 1 ? "Person" : "Personen"}) — {SOLL_NICHT_GEMELDET}, bis eine Zahl vorliegt.
        </p>
      )}

      {/* Aufnahme direkt unter der Summe: Beim Blick aufs Telefon steht oben
          die Gesamtzahl und gleich darunter „nächste Einheit". Unter Bedarf
          und Zwischensummen lag der Hauptknopf des Meldekopfs in keinem Fall
          im ersten Bild (Audit Runde 2, R2-S3). */}
      <div className="aktionen">
        {/* Unterzeile sichtbar statt nur im Tooltip: „scannen" und „einlesen"
            sind für einen Neuling dasselbe, und der Tipp auf „Bögen
            einlesen…" öffnete ohne Erklärung die Dateiauswahl (R3-N5). Die
            Unterzeile gehört nicht zum Knopfnamen, sie beschreibt ihn. */}
        <button type="button" className="primaer mit-zusatz" onClick={onScannen} aria-describedby="aufnahme-zusatz-scan">
          Bogen scannen…
          <span className="knopf-zusatz" id="aufnahme-zusatz-scan" aria-hidden="true">mit Kamera oder Handscanner</span>
        </button>
        <button type="button" className="mit-zusatz" onClick={onManuell} aria-describedby="aufnahme-zusatz-manuell">
          Einheit manuell erfassen…
          <span className="knopf-zusatz" id="aufnahme-zusatz-manuell" aria-hidden="true">von Hand, ohne Bogen</span>
        </button>
        {/* Der kurze Weg der Startseite auch hier, mit dieser Sammlung vorbelegt: Ort, Stärke, übernehmen (R16-W3). */}
        {props.onSchnell && (
          <button type="button" className="mit-zusatz" onClick={props.onSchnell} aria-describedby="aufnahme-zusatz-schnell">
            Einheit schnell erfassen (nur Stärke)…
            <span className="knopf-zusatz" id="aufnahme-zusatz-schnell" aria-hidden="true">Ort und Stärke vom Zettel</span>
          </button>
        )}
        {/* Datei, PDF, einzelne Bilder, viele Bilder, ganzer Ordner: ein Knopf,
            der die Sorte am Dateityp erkennt (siehe BoegenEinlesenKnopf). */}
        <BoegenEinlesenKnopf onDaten={onDateiImport} onBilder={onBilderImport} onEinlesen={props.onEinlesen} />
      </div>

      {/* Was das Einlesen ergab, dort, wo der Finger eben war (R3-L1). */}
      {props.einleseQuittung}

      {/* Quittung der Aufnahme dort, wo nach dem Übernehmen der Blick liegt:
          Name und neue Gesamtzahl bei Summe und Aufnahme-Knopf, statt die
          Seite zur neuen Karte zu rollen (R2-S3). Unter den Knöpfen, damit
          sie den Knopf für die nächste Einheit nicht unter den Bildrand
          schiebt. */}
      {/* Nach dem Abrücken sagt die Abrück-Quittung, was geschah; „jetzt 0 Einheiten" las sich wie ein Verlust (R13-W2). */}
      {eingegangen && eingegangen.status !== MeldeStatus.ABGERUECKT && eingang?.nonce !== eingangWeg && !eingang?.uebersprungen && !eingangVeraltet && (
        <p className="meldung eingang-quittung" role="status" ref={eingangQuittung}>
          {/* Von Hand erfasst oder abgelegt ist nicht „eingelesen“ (R9-N3). */}
          {eingegangen.quelle === "manuell" ? "Zuletzt abgelegt" : "Zuletzt eingelesen"}: „{einheitAnzeigename(eingegangen.bogen.einheit)}"
          {eingegangen.teilEtikett ? ` (${eingegangen.teilEtikett})` : ""}
          {/* „Als Sollstärke ablegen" und „so gezählt" lasen sich gleich (R17-S1): Die Sollstärke nennt sich hier. */}
          {nurSollstaerke(eingegangen.bogen) ? " als Sollstärke, nicht gemeldet" : ""}
          {eingangFolge ? <> — Folgemeldung: <span className={eingangFolge.verlust ? "staerke-verlust" : undefined}>{eingangFolge.kurz}</span></> : null}
          {/* Eine abgerückte Einheit kommt durch die Folgemeldung zurück in die Lage — nicht still (R5-K1). */}
          {eingangFolge?.rueckkehr && (
            <strong className="rueckkehr-hinweis"> — ⚠ {rueckkehrText(eingangFolge.rueckkehr)}, zählt wieder mit{eingangFolge.kurz === "inhaltlich unverändert" ? " (inhaltlich unverändert — war sie wirklich zurück?)" : ""}</strong>
          )}
          {" · "}jetzt {sum.einheiten}{" "}
          {sum.einheiten === 1 ? "Einheit" : "Einheiten"}, Gesamt {sum.staerke.gesamt}.{" "}
          <button type="button" className="link" onClick={eingangZeigen}>In der Liste zeigen</button>
          {/* Eine falsch aufgenommene Folgemeldung (Zahlendreher, falsche
              Einheit) mit einem Tipp zurücknehmen statt über „Historie →
              Fassung verwerfen…" (Audit Runde 4, R4-E4). */}
          {eingangFolge && props.zusammenlegungEintragId !== eingegangen.id && (
            <>
              {" "}
              <button type="button" className="link" onClick={() => void folgemeldungZurueckNehmen()}>Rückgängig</button>
            </>
          )}
        </p>
      )}

      {/* Zug gleich bei der Aufnahme (R13-W5): eine einzelne Einheit direkt unter ihrer Quittung. */}
      {eingegangen && !sammelquittungZeigen && eingang?.nonce !== eingangWeg && !eingang?.uebersprungen && (
        <ZugSchnellZuordnen
          einsatzId={einsatz.id}
          einheiten={[eingegangen]}
          vorhandene={einsatz.eintraege.map((e) => e.zugEtikett)}
          onGeaendert={onGeaendert}
          onZugGesetzt={zugGesetztMelden}
        />
      )}

      {/* Vom Papier eingelesen: Eintreffzeit, Status und Zug in einem Schritt
          vom Blatt übernehmen (Audit Runde 3, R3-A2). */}
      <PapierAbgleich
        einsatzId={einsatz.id}
        eintraege={einsatz.eintraege}
        zuege={[...new Set(einsatz.eintraege.map((e) => e.zugEtikett).filter((z): z is string => !!z))].sort()}
        onGeaendert={onGeaendert}
        anstoss={props.abgleichAnstoss}
        knopfImBericht={props.abgleichKnopfImBericht}
      />

      {/* Was seit der letzten Kenntnisnahme kam: mit Namen, mit der Änderung
          einer Folgemeldung („Stärke 12 → 9 (−3)") und dem Hinweis, welche
          Einheiten als Übung nicht zählen (R2-S4). Sie bleibt über ein
          Neuladen hinweg stehen, bis jemand sie zur Kenntnis nimmt; ein Tipp
          stellt die zuletzt gemeldeten nach oben (Audit Runde 3, R3-K1). */}
      {/* Ein Stapel „Bögen einlesen…" kam vor dem Neuladen nicht zu Ende (R15-S1): bleibt stehen, bis „Verstanden". */}
      <Suspense fallback={null}>
        <ImportHinweis einsatzId={einsatz.id} meldungen={einsatz.eintraege.length} geaendert={einsatz.geaendert} />
      </Suspense>
      {widersprueche.length > 0 && (
        <div className="meldung warnung-text widerspruch-merker" role="status">
          <p><strong>{widersprueche.length === 1 ? "1 Widerspruch" : `${widersprueche.length} Widersprüche`} zwischen den Geräten (offen):</strong></p>
          <ul>{widersprueche.map((z) => <li key={z}>{z}</li>)}</ul>
          <button
            type="button"
            className="link widerspruch-aktion"
            onClick={() => {
              // „Erledigt" nimmt den Wert der Gegenseite aus der App: ein Tipp mit Rückweg (R12-O2).
              const zeilen = widersprueche;
              widerspruchVergessen(einsatz.id);
              setWidersprueche([]);
              setWiderspruchErledigt(zeilen);
            }}
          >
            Erledigt
          </button>
        </div>
      )}
      {widerspruchErledigt && widersprueche.length === 0 && (
        <div className="meldung widerspruch-erledigt" role="status">
          <p>
            {widerspruchErledigt.length === 1 ? "1 Widerspruch" : `${widerspruchErledigt.length} Widersprüche`} als erledigt
            weggeräumt — der Wert der anderen Seite steht danach nirgends mehr in der App.
          </p>
          <button
            type="button"
            className="link widerspruch-aktion"
            onClick={() => {
              widerspruchMerken(einsatz.id, widerspruchErledigt);
              setWidersprueche(widerspruchLaden(einsatz.id));
              setWiderspruchErledigt(null);
            }}
          >
            Rückgängig
          </button>{" "}
          <button type="button" className="link widerspruch-aktion" onClick={() => setWiderspruchErledigt(null)}>
            ✕ Schließen
          </button>
        </div>
      )}
      {sammelquittungZeigen && (
        <div className="meldung stapel-eingang" role="status">
          <p>
            <strong>Neu seit der letzten Kenntnisnahme ({aufgenommenListe.length}):</strong>
            {aufgenommenUebung > 0
              ? aufgenommenUebung === aufgenommenListe.length
                ? ` ${aufgenommenUebung === 1 ? "Übung" : aufgenommenUebung === 2 ? "beide Übung" : `alle ${aufgenommenUebung} Übung`}, nicht gezählt.`
                : ` davon ${aufgenommenUebung} Übung, nicht gezählt.`
              : ""}
          </p>
          {aufgenommenListe.length > QUITTUNG_VIELE && (
            <button type="button" className="link" onClick={() => setZurListe((n) => n + 1)}>
              Zur Liste springen ↓
            </button>
          )}
          <ul>
            {gezeigteZeilen.map((e) => {
              const folge = folgeAenderung(e, einsatz.eintraege);
              // Die geltende Fassung war schon bekannt, eingegangen ist nur
              // ein älterer Stand: kein „neu gemeldet" (Audit Runde 4, R4-W1).
              const nurAelter = !ungeseheneIds.has(e.id)
                ? einsatz.eintraege.find((x) => x.einheitSchluessel === e.einheitSchluessel && ungeseheneIds.has(x.id))
                : undefined;
              if (nurAelter) {
                return (
                  <li key={e.einheitSchluessel}>
                    {einheitAnzeigename(e.bogen.einheit)}
                    {e.teilEtikett ? ` (${e.teilEtikett})` : ""}
                    {` — älterer Stand ${standText(nurAelter.bogen)} nachgereicht, gilt nicht (nur Historie)`}
                  </li>
                );
              }
              return (
                <li key={e.einheitSchluessel}>
                  {einheitAnzeigename(e.bogen.einheit)}
                  {e.teilEtikett ? ` (${e.teilEtikett})` : ""}
                  {folge ? (
                    <>
                      {" — Folgemeldung "}{zeitKurz(folge.gemeldetAm)}:{" "}
                      <span className={folge.verlust ? "staerke-verlust" : undefined}>{folge.kurz}</span>
                    </>
                  ) : (
                    " — neu gemeldet"
                  )}
                  {folge?.rueckkehr && <strong className="rueckkehr-hinweis"> — ⚠ {rueckkehrText(folge.rueckkehr)}, zählt wieder mit</strong>}
                  {e.signatur?.zustand === "ungueltig" && <strong className="warnung-text"> — ⚠ Signatur ungültig (Daten verändert?)</strong>}
                  {fremdeOrte.has(e.einheitSchluessel) && (
                    <span className="warnung-text"> — ⚠ Bogen nennt: „{fremdeOrte.get(e.einheitSchluessel)}“, passt das zu dieser Lage? {ORT_REGEL}</span>
                  )}
                </li>
              );
            })}
            {stapelKurz && (
              <li>
                {(() => {
                  const versteckt = aufgenommenListe.filter((e) => !gezeigteZeilen.includes(e));
                  const folgen = versteckt.filter((e) => folgeAenderung(e, einsatz.eintraege) != null).length;
                  return ausgeblendetText(versteckt.length - folgen, folgen);
                })()}
                {stapelOrtHinweise > 0 && <strong className="warnung-text"> — ⚠ bei {stapelOrtHinweise} passt der Ort im Bogen vielleicht nicht</strong>}
              </li>
            )}
          </ul>
          {aufgenommenListe.length > QUITTUNG_VIELE && (
            <button type="button" className="link" aria-expanded={!stapelKurz} onClick={() => setStapelAlle(!stapelAlle)}>
              {stapelKurz ? `Alle ${aufgenommenListe.length} einzeln anzeigen` : "Weniger zeigen"}
            </button>
          )}
          {/* Zug für alle neuen Einheiten ohne Zug in einem Zug (R13-W5). */}
          <ZugSchnellZuordnen
            einsatzId={einsatz.id}
            einheiten={aufgenommenListe}
            vorhandene={einsatz.eintraege.map((e) => e.zugEtikett)}
            onGeaendert={onGeaendert}
            onZugGesetzt={zugGesetztMelden}
          />
          {/* Zwei Ziele in Fingergröße (44 px) mit Abstand: Der Sammelschalter „Zur Kenntnis genommen" lag
              mit 30 px und ohne Lücke unter dem Sortierumschalter (R11-D1). */}
          <div className="kenntnis-aktionen">
            {sortierung !== "zuletzt" && (
              <button
                type="button"
                className="link"
                onClick={() => {
                  setSortierung("zuletzt");
                  // Sortieren allein änderte die Liste, aber nicht das Bild:
                  // wer tippte, sah nichts passieren (R4-K5).
                  setZurListe((n) => n + 1);
                }}
              >
                Zuletzt gemeldete oben zeigen
              </button>
            )}
            <button type="button" className="link kenntnis-nehmen" onClick={kenntnisNehmen}>Zur Kenntnis genommen</button>
          </div>
        </div>
      )}

      {/* Ausgenommene Übungsmeldungen: Die Zahlen darüber sind ohne sie
          gerechnet, und das muss dort stehen, wo die Zahlen stehen — nicht nur
          als Etikett an der einzelnen Karte weiter unten. Eine Zeile, die
          Namen auf Tipp: Der Hinweis wuchs mit jedem Namen und schob Summe und
          Aufnahme-Knöpfe unter den Bildrand (Audit Runde 2, R2-S3). Aus
          demselben Grund steht er unter den Aufnahme-Knöpfen: im Feld-Thema
          lag „Bogen scannen…" unter ihm bei 649 px, über ihm bei 545 px. */}
      {uebungenDaneben.length > 0 && (
        <details className="meldung uebung-ausgenommen">
          <summary>
            {uebungenDaneben.length} Übungsmeldung{uebungenDaneben.length === 1 ? "" : "en"} nicht gezählt — anzeigen
          </summary>
          <p>
            {uebungenDaneben.map((e) => einheitAnzeigename(e.bogen.einheit)).join(", ")}.{" "}
            {uebungenDaneben.length === 1 ? "Sie zählt" : "Sie zählen"} nicht in diese Lage; die Summen oben sind ohne{" "}
            sie gerechnet.
          </p>
        </details>
      )}


      {/* Am Telefon eingeklappt, mit einer Summenzeile: Der Block war 346 px hoch und
          schob die erste Einheitenkarte auf 2,6 Bildschirme (R5-K4). Am Laptop steht
          er wie bisher offen in der linken Spalte. */}
      {kompakt ? (
        <details className="karte bedarf-block">
          <summary>
            <strong>Bedarf:</strong>{" "}
            {/* Die Werte in eigenem Span: Die Zeile ist ein Flex-Behälter, und das Wort „Bedarf:" brach
                sonst als schrumpfender Flex-Teil im Wort („Bed / arf:"; R7-M1, R7-G9). */}
            <span className="bedarf-werte">
              {/* R15-M4: Jeder Posten ein unteilbarer Block — umbrochen wird nur zwischen den Posten. */}
              {[
                verpflegungText(sum),
                ...(sum.unterbringungBenoetigt > 0 ? [`Unterbringung ${personenText(sum.unterbringungAngefordert.personen)}`] : []),
                ...kraftstoffTeile(sum.kraftstoff),
                ...(sum.ruhezeitErforderlich > 0
                  ? [`Ruhezeit ${sum.ruhezeitErforderlich} ${sum.ruhezeitErforderlich === 1 ? "Einheit" : "Einheiten"}`]
                  : []),
                ...(sum.bedarfOhneAngabe > 0 ? [bedarfOhneAngabeText(sum.bedarfOhneAngabe)] : []),
              ].map((posten, i, alle) => (
                // Der Punkt gehört zum vorigen Posten: eine Zeile beginnt nie mit „·".
                <Fragment key={posten}>
                  <span className="bedarf-posten">{i < alle.length - 1 ? `${posten} ·` : posten}</span>
                  {i < alle.length - 1 ? " " : ""}
                </Fragment>
              ))}
            </span>
          </summary>
          {/* Vier Bedarfsarten als beschriftete Paare statt als zwei Sätze: nach
            diesen Zahlen wird gezielt gesucht („wie viel Diesel?"), nicht
            gelesen. Im Fließtext lag jede Zahl an einer anderen Stelle der
            Zeile und war nur über den davorstehenden Begriff zu finden. */}
        <dl className="paare">
          <dt>Verpflegung</dt>
          <dd>
            {sum.verpflegungAngefordert === sum.verpflegung.gesamt ? (
              <strong>{sum.verpflegung.gesamt}</strong>
            ) : (
              <>
                angefordert <strong>{sum.verpflegungAngefordert}</strong>, Stärke {sum.verpflegung.gesamt}
              </>
            )}
            {" "}({sum.verpflegung.vegetarisch} vegetarisch / {sum.verpflegung.vegan} vegan)
          </dd>
          {/* Zwei Zahlen, zwei Fragen (Audit Runde 3, R3-K4): Quartier
              brauchen nur die Einheiten, die Unterbringung angefordert haben —
              „M 71 / W 30" daneben zählte alle 101 Anwesenden, angefordert
              hatten sechs Einheiten mit 66 Personen. Die Zahl aller
              Anwesenden bleibt, beschriftet, für WC und Duschen. */}
          <dt>Unterbringung angefordert</dt>
          <dd className="unterbringung-angefordert">
            {sum.unterbringungBenoetigt > 0 ? (
              <>
                {/* Sprung in den passenden Filter: „wer braucht ein Quartier?"
                    ist genau die Frage hinter der Zahl (R2-K4). */}
                <button type="button" className="link" onClick={() => aufBedarfFiltern("unterbringung")}>
                  {sum.unterbringungBenoetigt} {sum.unterbringungBenoetigt === 1 ? "Einheit" : "Einheiten"}
                </button>
                {", "}
                <strong>{sum.unterbringungAngefordert.personen} {sum.unterbringungAngefordert.personen === 1 ? "Person" : "Personen"}</strong>
                {` (${mwdText(sum.unterbringungAngefordert)})`}
              </>
            ) : (
              "keine"
            )}
          </dd>
          <dt>WC/Dusche (alle Anwesenden)</dt>
          <dd>
            {/* Schnellerfassungen ohne M/W/D-Aufteilung benennen statt als 0
                zu verschweigen (Audit Runde 2, R2-N5). */}
            {mwdText({ ...sum.unterbringung, ohneAngabe: sum.unterbringungOhneAngabe })}
          </dd>
          <dt>Kraftstoff</dt>
          <dd>
            {/* Nur gemeldete Sorten, wie Kurzzeile, Monitor und Lageblatt (R14-K4). */}
            {kraftstoffTeile(sum.kraftstoff).join(" · ") || "keiner angefordert"}
          </dd>
          <dt>Fahrzeuge</dt>
          <dd>
            {sum.fahrzeuge}
            {sum.ruhezeitErforderlich > 0 && (
              <>
                {" · "}
                <button type="button" className="link" onClick={() => aufBedarfFiltern("ruhezeit")}>
                  Ruhezeit: {sum.ruhezeitErforderlich} {sum.ruhezeitErforderlich === 1 ? "Einheit" : "Einheiten"}
                </button>
              </>
            )}
          </dd>
        </dl>
        {sum.bedarfOhneAngabe > 0 && <p className="hinweis bedarf-ohne-angabe">{bedarfOhneAngabeHinweis(sum.bedarfOhneAngabe)}</p>}
        </details>
      ) : (
      <section className="karte">
        <h2>Bedarf (anwesende Einheiten)</h2>
        {/* Vier Bedarfsarten als beschriftete Paare statt als zwei Sätze: nach
            diesen Zahlen wird gezielt gesucht („wie viel Diesel?"), nicht
            gelesen. Im Fließtext lag jede Zahl an einer anderen Stelle der
            Zeile und war nur über den davorstehenden Begriff zu finden. */}
        <dl className="paare">
          <dt>Verpflegung</dt>
          <dd>
            {sum.verpflegungAngefordert === sum.verpflegung.gesamt ? (
              <strong>{sum.verpflegung.gesamt}</strong>
            ) : (
              <>
                angefordert <strong>{sum.verpflegungAngefordert}</strong>, Stärke {sum.verpflegung.gesamt}
              </>
            )}
            {" "}({sum.verpflegung.vegetarisch} vegetarisch / {sum.verpflegung.vegan} vegan)
          </dd>
          {/* Zwei Zahlen, zwei Fragen (Audit Runde 3, R3-K4): Quartier
              brauchen nur die Einheiten, die Unterbringung angefordert haben —
              „M 71 / W 30" daneben zählte alle 101 Anwesenden, angefordert
              hatten sechs Einheiten mit 66 Personen. Die Zahl aller
              Anwesenden bleibt, beschriftet, für WC und Duschen. */}
          <dt>Unterbringung angefordert</dt>
          <dd className="unterbringung-angefordert">
            {sum.unterbringungBenoetigt > 0 ? (
              <>
                {/* Sprung in den passenden Filter: „wer braucht ein Quartier?"
                    ist genau die Frage hinter der Zahl (R2-K4). */}
                <button type="button" className="link" onClick={() => aufBedarfFiltern("unterbringung")}>
                  {sum.unterbringungBenoetigt} {sum.unterbringungBenoetigt === 1 ? "Einheit" : "Einheiten"}
                </button>
                {", "}
                <strong>{sum.unterbringungAngefordert.personen} {sum.unterbringungAngefordert.personen === 1 ? "Person" : "Personen"}</strong>
                {` (${mwdText(sum.unterbringungAngefordert)})`}
              </>
            ) : (
              "keine"
            )}
          </dd>
          <dt>WC/Dusche (alle Anwesenden)</dt>
          <dd>
            {/* Schnellerfassungen ohne M/W/D-Aufteilung benennen statt als 0
                zu verschweigen (Audit Runde 2, R2-N5). */}
            {mwdText({ ...sum.unterbringung, ohneAngabe: sum.unterbringungOhneAngabe })}
          </dd>
          <dt>Kraftstoff</dt>
          <dd>
            {/* Nur gemeldete Sorten, wie Kurzzeile, Monitor und Lageblatt (R14-K4). */}
            {kraftstoffTeile(sum.kraftstoff).join(" · ") || "keiner angefordert"}
          </dd>
          <dt>Fahrzeuge</dt>
          <dd>
            {sum.fahrzeuge}
            {sum.ruhezeitErforderlich > 0 && (
              <>
                {" · "}
                <button type="button" className="link" onClick={() => aufBedarfFiltern("ruhezeit")}>
                  Ruhezeit: {sum.ruhezeitErforderlich} {sum.ruhezeitErforderlich === 1 ? "Einheit" : "Einheiten"}
                </button>
              </>
            )}
          </dd>
        </dl>
        {sum.bedarfOhneAngabe > 0 && <p className="hinweis bedarf-ohne-angabe">{bedarfOhneAngabeHinweis(sum.bedarfOhneAngabe)}</p>}
      </section>
      )}

      {/* Ab drei Zügen zugeklappt: der Block schob auf dem Tablet den Einstieg
          in die Einheitenliste unter den Falz (K6). Die Zusammenfassung nennt
          die Zahl, damit klar ist, was sich dahinter verbirgt. */}
      {zugGruppen.length > 1 && (
        <details className="karte zug-summen" open={zugGruppen.length < 3 && !kompakt}>
          <summary><h2>Zwischensummen nach Zug ({zugTitel})</h2></summary>
          {zugGruppen.map((g) => (
            <div className="zug-summe" key={g.zugEtikett ? `zug:${g.zugEtikett}` : "zug:ohne"}>
              <p>
                <strong>{g.zugEtikett ?? "Ohne Zug"}</strong>
                {" · "}{einheitenZahl(g.summen.einheiten)}{" · "}Stärke {summenStaerkeText(g.summen)}
                {zugAlterText(g.aeltesteMeldungAm, Date.now()) && (
                  <span className="warnung-text zug-alter"> · {zugAlterText(g.aeltesteMeldungAm, Date.now())}</span>
                )}
              </p>
              <p className="hinweis">
                Verpflegung {g.summen.verpflegung.gesamt}
                {" · "}Unterbringung angefordert{" "}
                {g.summen.unterbringungBenoetigt > 0
                  ? `${g.summen.unterbringungAngefordert.personen} Pers. (${mwdText(g.summen.unterbringungAngefordert)})`
                  : "keine"}
                {" · "}WC/Dusche {mwdText({ ...g.summen.unterbringung, ohneAngabe: g.summen.unterbringungOhneAngabe })}
                {" · "}Fahrzeuge {g.summen.fahrzeuge}
                {/* Ruhezeit je Zug, damit die Zugsummen zum Gesamtbedarf aufgehen (R15-K3). */}
                {g.summen.ruhezeitErforderlich > 0 ? ` · Ruhezeit ${g.summen.ruhezeitErforderlich} ${g.summen.ruhezeitErforderlich === 1 ? "Einheit" : "Einheiten"}` : ""}
                {/* Betriebsstoff je Zug wie auf dem Lageblatt — nur gemeldete Sorten (R4-K8). */}
                {[
                  g.summen.kraftstoff.dieselLiter > 0 ? `Diesel ${g.summen.kraftstoff.dieselLiter} l` : "",
                  g.summen.kraftstoff.benzinLiter > 0 ? `Benzin ${g.summen.kraftstoff.benzinLiter} l` : "",
                  g.summen.kraftstoff.gemischLiter > 0 ? `Gemisch ${g.summen.kraftstoff.gemischLiter} l` : "",
                ]
                  .filter(Boolean)
                  .map((k) => ` · ${k}`)
                  .join("")}
              </p>
            </div>
          ))}
        </details>
      )}


      {/* Eine Geste von den Summen zur Liste der Einheiten (R9-K3). */}
      <p className="hinweis ausgabe-sprung">
        <button
          type="button"
          className="link"
          onClick={() => {
            try {
              listeKopf.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
            } catch {
              /* Testumgebung ohne Layout */
            }
          }}
        >
          Zur Einheitenliste ↓
        </button>
      </p>
      {(onWeitergeben || onLageblatt) && (
        <p className="hinweis ausgabe-sprung">
          <button
            type="button"
            className="link"
            onClick={() => {
              try {
                ausgabeBlock.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
              } catch {
                /* Testumgebung ohne Layout */
              }
            }}
          >
            Weitergeben, Lageblatt, Export ↓
          </button>{" "}
          — unter der Liste der Einheiten.
        </p>
      )}
      </div>

      <section className="karte einsatz-liste">
        <UnlesbarHinweis sammlungId={einsatz.id} />
        {verloreneEingaben.map((text, i) => (
          <p className="warnung verlorene-eingabe" role="alert" key={`${i}-${text}`}>
            {text}{" "}
            <button type="button" onClick={() => setVerloreneEingaben((v) => v.filter((_, j) => j !== i))}>
              Verstanden
            </button>
          </p>
        ))}
        <div className="kopfzeile">
          {/* Zwei beschriftete Zahlen statt drei unbeschrifteter: „gemeldet"
              ist die Länge der Liste, „zählend" die Zahl der Stärkeleiste —
              dieselbe Zählweise wie die Summenzeile der Tabelle (K4). */}
          <h2 ref={listeKopf} id="einheiten-liste">
            Einheiten ({gefiltert ? `${kopf.length} von ${alleEinheiten.length}` : alleEinheiten.length - nurSollAnzahl} gemeldet
            {!gefiltert && nurSollAnzahl > 0 ? ` · ${nurSollAnzahl} nur Sollstärke` : ""}
            {" · "}{sum.einheiten} zählend)
          </h2>
          {/* Zwei Sichten auf dieselbe (gesuchte, gefilterte, sortierte) Liste:
              die Karten für die Arbeit an einer Einheit, die Tabelle für den
              Vergleich über alle — „wer hat die meisten Kräfte?" ist an
              Karten untereinander nicht zu beantworten. */}
          {alleEinheiten.length > 0 && (
            <span className="ansicht-umschalter" role="group" aria-label="Darstellung der Einheiten">
              {([
                { wert: "karten", label: "Karten" },
                { wert: "tabelle", label: "Tabelle" },
              ] as const).map((a) => (
                <button
                  key={a.wert}
                  type="button"
                  aria-pressed={ansicht === a.wert}
                  onClick={() => {
                    setAnsicht(a.wert);
                    merkeAnsicht(a.wert);
                  }}
                >
                  {a.label}
                </button>
              ))}
            </span>
          )}
        </div>
        {/* Ab einer Handvoll Meldungen trägt die Liste allein nicht mehr — bei
            einer Großlage stehen hier 30–50 Einheiten. Bei einer einzigen
            Meldung wäre die Leiste nur Beiwerk, ab der zweiten steht sie
            bereit: eine erst später auftauchende Leiste liest sich am Gerät
            wie eine fehlende Funktion (Rückmeldung Anwender, August 2026). */}
        {alleEinheiten.length > 0 && (ohneAuftragAnzahl > 0 || ohneZugAnzahl > 0) && (
          <p className="hinweis luecken-zaehler">
            {ohneAuftragAnzahl > 0 && (
              <button type="button" className="link" onClick={() => aufLueckeFiltern("ohne-auftrag")}>
                {ohneAuftragAnzahl} ohne Auftrag
              </button>
            )}
            {ohneAuftragAnzahl > 0 && ohneZugAnzahl > 0 ? " · " : ""}
            {ohneZugAnzahl > 0 && (
              <button type="button" className="link" onClick={() => aufLueckeFiltern("ohne-zug")}>
                {ohneZugAnzahl} ohne Zug
              </button>
            )}
            {lueckenFilter && (
              <>
                {" · "}
                <button type="button" className="link" onClick={() => setLueckenFilter(null)}>Filter aufheben</button>
              </>
            )}
          </p>
        )}
        {alleEinheiten.length > 1 && (
          filterEingeklappt ? (
            <details
              className="einheiten-filter-wahl"
              open={filterOffen || filterAktivOhneLuecke}
              onToggle={(e) => setFilterOffen(e.currentTarget.open)}
            >
              <summary>
                Suchen, sortieren, filtern
                {filterAktiv ? ` · Filter aktiv${lueckenFilter ? `: ${lueckenFilter === "ohne-auftrag" ? "ohne Auftrag" : "ohne Zug"}` : ""}` : ""}
              </summary>
              {filterZeile}
            </details>
          ) : (
            filterZeile
          )
        )}
        {gewaehlteQuali && (
          <p className="hinweis" role="status">
            <strong>{gewaehlteQuali.personen}</strong>
            {gewaehlteQuali.personen === 1 ? " Einsatzkraft" : " Einsatzkräfte"} mit {`„${gewaehlteQuali.label}“`}
            {" in "}{gewaehlteQuali.einheiten} {gewaehlteQuali.einheiten === 1 ? "Einheit" : "Einheiten"}.
            {ohnePersonen > 0 && (
              <>
                {" "}
                {ohnePersonen === 1
                  ? "Eine Meldung führt keine Personen und bleibt hier außen vor."
                  : `${ohnePersonen} Meldungen führen keine Personen und bleiben hier außen vor.`}
              </>
            )}
            {" "}
            <button type="button" className="link" onClick={() => setQuali("")}>Filter aufheben</button>
          </p>
        )}
        {(bedarfsFilter === "ruhezeit" || bedarfsFilter === "unterbringung") && kopf.length > 0 && (
          <p className="hinweis" role="status">
            {kopf.length} {kopf.length === 1 ? "Einheit" : "Einheiten"} {bedarfsFilter === "ruhezeit" ? "mit Ruhezeit" : "mit angeforderter Unterbringung"}.{" "}
            <button type="button" className="link" onClick={() => setBedarfsFilter(null)}>Bedarfsfilter aufheben</button>
          </p>
        )}
        {alleEinheiten.length === 0 && <p className="hinweis">Noch keine Meldung. Bogen scannen oder manuell erfassen.</p>}
        {alleEinheiten.length > 0 && kopf.length === 0 && (
          <p className="hinweis">
            Keine Einheit passt zu{" "}
            {[suche.trim() && `„${suche.trim()}“`, gewaehlteQuali && `„${gewaehlteQuali.label}“`, nurBedarf && bedarfsFilterText, lueckenFilter && (lueckenFilter === "ohne-auftrag" ? "„ohne Auftrag“" : "„ohne Zug“"), statusFilter && (statusFilter === "anwesend" ? "„nur Anwesende“" : statusFilter === "veraltet" ? "„nur ältere als 1 Std“" : "„nur Abgerückte“")]
              .filter(Boolean)
              .join(" und ")}
            .{" "}
            {suche.trim() !== "" && (
              <>
                Auch ohne Umlaute oder in anderer Schreibweise versuchen.{" "}
              </>
            )}
            {suche.trim() !== "" && (
              <button type="button" className="link" onClick={() => setSuche("")}>Suche löschen</button>
            )}
            {suche.trim() !== "" && gewaehlteQuali ? " · " : ""}
            {gewaehlteQuali && (
              <button type="button" className="link" onClick={() => setQuali("")}>Filter aufheben</button>
            )}
            {nurBedarf && (
              <>
                {suche.trim() !== "" || gewaehlteQuali ? " · " : ""}
                <button type="button" className="link" onClick={() => setBedarfsFilter(null)}>Bedarfsfilter aufheben</button>
              </>
            )}
            {lueckenFilter && (
              <>
                {suche.trim() !== "" || gewaehlteQuali || nurBedarf ? " · " : ""}
                <button type="button" className="link" onClick={() => setLueckenFilter(null)}>Filter aufheben</button>
              </>
            )}
          </p>
        )}
        {/* Legende einmal über der Liste: „Stärke 1 / 1 / 2 / 4" auf den Karten trägt keine Beschriftung (R7-K9). */}
        {ansicht === "karten" && kopf.length > 0 && (
          <p className="hinweis staerke-legende">Stärke auf den Karten: Führer / Unterführer / Mannschaft / Gesamt.</p>
        )}
        {ansicht === "tabelle" && kopf.length > 0 && (
          <EinheitenTabelle meldungen={kopf} art={einsatz.art} eingang={eingang} nummern={nummern} neueFassungen={neueFassungen} kompakt={kompakt} />
        )}
        {/* Eine Liste: das Vorleseprogramm nennt die Zahl der Einheiten und
            erlaubt den Sprung von Eintrag zu Eintrag (R2-M4). */}
        {ansicht === "karten" && kopf.length > 0 && (
          <ul className="einheiten-liste">
            {kopf.map((e, i) => (
              <Fragment key={e.einheitSchluessel}>
              {/* Abgerückte stehen am Ende unter eigener Überschrift, nicht zwischen den Anwesenden (R17-E6, K4). */}
              {i === abgerueckteStelle && (
                <li className="einheiten-trenner"><strong>{abgerueckteUeberschrift(kopf)}</strong></li>
              )}
              <EinheitKarte
                einsatzId={einsatz.id}
                kopf={e}
                alle={einsatz.eintraege}
                onGeaendert={onGeaendert}
                qualifikation={quali}
                qualifikationKurz={qualiKurz}
                eingang={eingang}
                onEntfernt={(x) => { setAufgeteilt(null); setZusammengefuehrt(null); setStaerkeGeaendert(null); setZurueckQuittung(null); setZuletztEntfernt({ ...x, nummer: nummern.get(e.einheitSchluessel) }); }}
                onStatusWechsel={(w) => { setAufgeteilt(null); setZusammengefuehrt(null); setStaerkeGeaendert(null); setZurueckQuittung(null); setStatusWechsel(w); }}
                onAufgeteilt={(a) => { setZuletztEntfernt(null); setStatusWechsel(null); setZusammengefuehrt(null); setStaerkeGeaendert(null); setZurueckQuittung(null); setAufgeteilt(a); }}
                onStaerkeGeaendert={(x) => { setZuletztEntfernt(null); setStatusWechsel(null); setAufgeteilt(null); setZusammengefuehrt(null); setZurueckQuittung(null); setStaerkeGeaendert(x); }}
                onZusammengefuehrt={(z) => { setZuletztEntfernt(null); setStatusWechsel(null); setAufgeteilt(null); setStaerkeGeaendert(null); setZurueckQuittung(null); setZusammengefuehrt(z); }}
                kompakt={kompakt}
                nummer={nummern.get(e.einheitSchluessel)}
                ungesehen={ungeseheneIds.has(e.id)}
                frisch={frischUnquittiert(e)}
                fremderOrt={fremdeOrte.get(e.einheitSchluessel)}
                onEingabeVerloren={eingabeVerloren}
                onHandlung={andereHandlung}
                onAuftragGesetzt={(a) => { andereHandlung(); setAuftragGesetzt(a); }}
                onVerschoben={(v) => { andereHandlung(); setVerschobenQuittung(v); }}
              />
              </Fragment>
            ))}
          </ul>
        )}
      </section>

      {/* Entfernte Meldungen bleiben eine Woche zum Zurückholen liegen — auch nach dem Neuladen (R17-E2, R17-D6). */}
      {papierkorbGefuellt(einsatz.id) && (
        <Suspense fallback={null}>
          <EntfernteMeldungenBlock einsatzId={einsatz.id} geaendert={einsatz.geaendert} onHolen={(m) => void ausPapierkorbHolen(m)} />
        </Suspense>
      )}

      {/* Weitergeben, Lageblatt und Exporte stehen UNTER der Liste (R4-K5): Auf
          dem Telefon lag die erste Einheitenkarte rund vier Bildschirme tief,
          weil Exportknöpfe, Erklärtext und Kästchen davor standen — wer führt,
          liest die Einheiten, wer übergibt, scrollt einmal. Der Sprungknopf
          über der Liste nennt den Ort. */}
      <div className="ausgabe-block" id="ausgabe-block" ref={ausgabeBlock}>
      {/* Einsatzende (R13-W6): Alle Einheiten sind abgerückt, die Zahlen stehen auf 0. Die Ansicht sagt, was jetzt
          ansteht — sichern, solange die Lage noch vollständig in der Sammlung steht. */}
      {onWeitergeben && alleEinheiten.length > 0 && alleEinheiten.every((e) => e.status !== MeldeStatus.ANWESEND) && (
        <p className="meldung einsatzende-hinweis" role="status">
          Alle Einheiten sind abgerückt. Zum Abschluss den Einsatz sichern.{" "}
          <button type="button" className="link" disabled={arbeitet !== null} onClick={(e) => ausgabeTipp("weitergeben", null, onWeitergeben, e)}>
            Jetzt sichern
          </button>
        </p>
      )}
      {/* Zweite Reihe: was aus der Sammlung herausgeht. Die erste nimmt Bögen
          auf. Der Sprung zwischen den Reihen muss größer sein als der zwischen
          den Knöpfen, sonst liest sich die Aufteilung als zufälliger Umbruch
          einer einzigen Reihe aus sieben gleichrangigen Knöpfen. */}
      {(onWeitergeben || onLageblatt) && (
        <div className="vorlage-aktionen einsatz-weitergabe">
          {/* Der Weg, der immer geht — auch am Einsatzende, wenn alle abgerückt
              sind. Er hieß „Sammel-PDF" und versprach ein Druckstück; dass er
              die ganze Sammlung trägt, stand nur im Tooltip, den ein Telefon nie
              zeigt (W2). Das Lageblatt daneben ist das Papier für die Wand:
              eine Seite statt 41 (A3, A4). */}
          {onWeitergeben && (
            <button
              type="button"
              className={`primaer${arbeitet === "weitergeben" ? " arbeitet" : ""}`}
              aria-busy={arbeitet === "weitergeben" || undefined}
              disabled={arbeitet !== null}
              onClick={(e) => ausgabeTipp("weitergeben", null, onWeitergeben, e)}
              title="Die ganze Sammlung als Datei — auf dem nächsten Gerät über „Einsatz importieren…“ einlesbar."
            >
              {arbeitet === "weitergeben" ? "Einsatz wird erzeugt…" : "Einsatz weitergeben / sichern"}
            </button>
          )}{" "}
          {onLageblatt && (
            <button
              type="button"
              className={arbeitet === "lageblatt" ? "arbeitet" : ""}
              aria-busy={arbeitet === "lageblatt" || undefined}
              disabled={arbeitet !== null}
              onClick={(e) => ausgabeTipp("lageblatt", null, onLageblatt, e)}
              title="Nur die Übersicht: Einheiten mit Zug, Eintreff- und Abrückzeit, Bedarf und Zwischensummen — A4 quer, ohne Bögen; Stärke und Bedarf stehen oben auf Seite 1; bis etwa sechs Einheiten eine Seite, darüber folgen weitere Seiten."
            >
              {/* Ehrlich beschriftet: bei großen Lagen wird es mehr als eine
                  Seite (Audit Runde 2, R2-K3). */}
              {arbeitet === "lageblatt" ? "Lageblatt wird erzeugt…" : "Lageblatt (A4 quer)"}
            </button>
          )}{" "}
          {/* Der leere Vordruck dort, wo am Meldekopf gearbeitet wird — vorher
              nur über die Website „Aufbau des Bogens" (Audit Runde 3, R3-A7). */}
          {onBlanko && (
            <button
              type="button"
              className={arbeitet === "blanko" ? "arbeitet" : ""}
              aria-busy={arbeitet === "blanko" || undefined}
              disabled={arbeitet !== null}
              onClick={(e) => ausgabeTipp("blanko", null, onBlanko, e)}
              title="Leerer Erfassungsbogen (2 Seiten A4) zum Ausfüllen mit der Hand — für Einheiten ohne Gerät oder bei Geräteausfall."
            >
              {arbeitet === "blanko" ? "Blanko-Vordruck wird erzeugt…" : "Blanko-Vordruck (Papier-Reserve)"}
            </button>
          )}
        </div>
      )}
      {/* Rückmeldung dort, wo getippt wurde: während der Arbeit, dass sie läuft
          und nicht noch einmal getippt werden muss; danach die Bestätigung
          (R5-O3, R5-L4). */}
      {(onWeitergeben || onLageblatt || onBlanko) && (arbeitet === "weitergeben" || arbeitet === "sammel-pdf" || arbeitet === "lageblatt" || arbeitet === "blanko" || ausgabeQuittungSichtbar) && (
        <p className="hinweis arbeitet-zeile ausgabe-quittung" role="status">
          {arbeitet === "weitergeben" || arbeitet === "sammel-pdf"
            ? <>{sammelPdfDauerText(geltendeJeEinheit(einsatz.eintraege).length, arbeitFortschrittJetzt?.schaetzungSek)}<ArbeitFortschrittZeile /></>
            : arbeitet === "lageblatt"
              ? "Das Lageblatt wird erzeugt — einen Moment, bitte nicht noch einmal tippen."
              : arbeitet === "blanko"
                ? "Der Blanko-Vordruck wird erzeugt — einen Moment, bitte nicht noch einmal tippen."
                : ausgabeQuittungSichtbar}
        </p>
      )}
      {/* Die PDFs sind weiß und bleiben es: auch in „Dunkel“ und „Nacht“ (R5-L5). Wer sie nachts auf
          dem Telefon aufruft, wird nicht überrascht. */}
      {(onWeitergeben || onLageblatt || onBlanko) && (
        <p className="hinweis papier-hinweis">Die PDFs sind für Papier gedacht — hell, auch in der Ansicht „Nacht“.</p>
      )}
      {onLageblatt && (
        <p className="hinweis lageblatt-stand" role="status">
          {lageblattStand
            ? `Lageblatt erstellt ${exportZeitKurz(lageblattStand.zeitpunkt)} · ${seitdemText(neueEintraege(einsatz.eintraege, lageblattStand).length, aenderungenSeit(einsatz.eintraege, lageblattStand))}${lageblattVeraltet ? " — Aushang ist nicht mehr aktuell, neu drucken" : ""}`
            : "Noch kein Lageblatt aus diesem Einsatz."}
        </p>
      )}
      {onWeitergeben && (
        <p className="hinweis einsatz-ausgaben-hinweis">
          {/* Ein Knopf für die ganze Sammel-PDF: „Sammel-PDF (alle Bögen)"
              darunter erzeugte dieselbe Datei — zwei gleichwertige Knöpfe, und
              welcher „für Papier" ist, stand nur hier (Audit Runde 2, R2-A3). */}
          „Einsatz weitergeben / sichern" erzeugt die Sammel-PDF mit allen Bögen (zum Drucken) und allen Meldungen,
          Zeiten, Historie und Zügen — auf dem nächsten Gerät über „Einsatz importieren…" einlesbar, auch wenn alle
          abgerückt sind. Ein Nachtrag für den Stab (PDF, CSV, Excel): weiter unten „Nur neue Bögen seit dem letzten Export“
          ankreuzen — erst dann erscheinen dort die Nachtrag-Knöpfe, je Format mit eigenem Bezugspunkt.
        </p>
      )}
      {/* Der Meldekopf liefert dem Stab nach: einmal am Abend alles, am Morgen
          nur, was seitdem dazukam. Das Kästchen schaltet alle vier Ausgabewege
          um; die Zeile sagt, wann zuletzt exportiert wurde und wie viel
          seitdem neu ist (Rückmeldung Anwender, September 2026). */}
      <div className="export-umfang">
        <label className="inline">
          <input
            type="checkbox"
            checked={nurNeue}
            onChange={(e) => setExportUmfang(e.target.checked ? "neue" : "alle")}
          />
          Nur neue Bögen seit dem letzten Export
        </label>
        {/* Bezugspunkt ist das Erzeugen der Datei: Ob sie den Stab erreicht hat, weiß das Gerät nicht (R7-A3). */}
        <span className="hinweis">Gerechnet ab dem Erzeugen der Datei — ob sie beim Stab angekommen ist, weiß das Gerät nicht.</span>
        {/* Je Format ein eigener Bezugspunkt (R4-W2): Excel für die eigene
            Liste verbraucht den Nachtrag-PDF nicht, die Weitergabe an die
            Ablösung keines von beiden. Ohne Haken nur, was es gab. */}
        {EXPORT_ZIELE.every((z) => !exportStaende[z]) ? (
          <span className="hinweis">
            Noch kein Export aus diesem Einsatz — alle Bögen sind neu.
            {weitergabeStand ? ` Die Weitergabe vom ${exportZeitKurz(weitergabeStand.zeitpunkt)} (an die Ablösung) zählt nicht als Lieferung an den Stab.` : ""}
          </span>
        ) : null}
        {EXPORT_ZIELE.filter((z) => nurNeue || exportStaende[z]).map((z) => {
          const stand = exportStaende[z];
          if (!stand) {
            // Das Sammel-PDF gibt es auch als Weitergabe an die Ablösung; die zählt
            // nicht als Lieferung an den Stab — die Zeile sagt es und bietet an,
            // ab der Weitergabe zu rechnen (R5-W5).
            const weitergabeZeigen = z === "pdf" && nurNeue && weitergabeStand != null;
            return nurNeue && (EXPORT_ZIELE.some((x) => exportStaende[x]) || weitergabeZeigen) ? (
              <span className="hinweis export-stand-zeile" key={z}>
                {EXPORT_ZIEL_NAME[z]}: {weitergabeZeigen ? "für den Stab noch keine Lieferung" : "noch nicht in diesem Format exportiert"} — alle Bögen sind neu.
                {weitergabeZeigen && (
                  <>
                    {" "}Die Weitergabe-Datei vom {exportZeitKurz(weitergabeStand!.zeitpunkt)} zählt hier nicht (sie geht zum Sichern an die Ablösung oder ins Archiv). Das nächste Sammel-PDF hier ist die erste Lieferung an den Stab.
                    {props.onStandAusWeitergabe && (
                      <>
                        {" "}
                        <button type="button" className="link" onClick={() => props.onStandAusWeitergabe!("pdf")}>
                          Ab dieser Weitergabe rechnen
                        </button>
                      </>
                    )}
                  </>
                )}
              </span>
            ) : null;
          }
          return (
            <span className="hinweis export-stand-zeile" key={z}>
              {EXPORT_ZIEL_NAME[z]}: zuletzt erzeugt {exportZeitKurz(stand.zeitpunkt)}
              {stand.herkunft === "geraet" ? " (vom anderen Gerät)" : stand.herkunft === "weitergabe" ? " (ab der Weitergabe gerechnet)" : ""} ·{" "}
              {seitdemBoegenText(einsatz.eintraege, stand)}
            </span>
          );
        })}
      </div>
      <div className="vorlage-aktionen einsatz-ausgaben">
        {/* Die ganze Sammel-PDF liegt auf „Einsatz weitergeben / sichern";
            hier nur noch der Nachtrag „nur neue Bögen" (R2-A3). Ohne
            Weitergabe-Knopf bleibt der Gesamtweg hier. */}
        {(nurNeue || !onWeitergeben) && (
          <>
            <button
              type="button"
              onClick={(e) => ausgabeTipp("sammel-pdf", null, () => onSammelPdf(exportUmfang), e)}
              disabled={gesperrt("pdf") || arbeitet !== null}
              aria-busy={arbeitet === "sammel-pdf" || undefined}
              title={nurNeue
                ? "Nur die seit dem letzten Export neuen Bögen als eine PDF — mit eingebetteten Daten dieser Bögen. Auf dem Zielgerät über „Einsatz importieren…“ einlesbar."
                : "Alle Bögen als eine PDF — mit eingebetteter kompletter Sammlung (Züge, Status, Historie). Auf dem Zielgerät über „Einsatz importieren…“ einlesbar."}
            >
              {/* Ohne früheren Stab-Export ist „nur neue Bögen" die ganze Lage; der Knopf sagt es (R6-K9). */}
              {arbeitet === "sammel-pdf" ? "Sammel-PDF wird erzeugt…" : nurNeue ? (exportStaende.pdf ? "Sammel-PDF (nur neue Bögen)" : "Sammel-PDF (erste Lieferung: alle Bögen)") : "Sammel-PDF (alle Bögen)"}
            </button>{" "}
          </>
        )}
        {/* Zwei CSV-Wege, weil zwei verschiedene Fragen dahinterstehen: die
            Übersicht beantwortet „wie stark ist die Lage?" (eine Zeile je
            Einheit, mit Summenzeile), der Detail-Export „wer und was genau ist
            da?" (jede Person, jedes Fahrzeug einzeln). */}
        <button type="button" onClick={(e) => ausgabeTipp("csv", "Die Übersicht als CSV", () => onCsvExport(exportUmfang), e)} disabled={gesperrt("csv")} title="Eine Zeile je anwesender Einheit mit Stärke, Verpflegung, Unterbringung und Kraftstoff — plus Summenzeile. Für die Lagekarte.">
          {nachtragKnopf("Übersicht als CSV", "csv")}
        </button>{" "}
        <button type="button" onClick={(e) => ausgabeTipp("csv-detail", "Die CSV mit allen Daten", () => onCsvDetailExport(exportUmfang), e)} disabled={gesperrt("csv-detail")} title="Alle Daten aller gemeldeten Einheiten: je Einheit eine Zeile, dazu eine Zeile pro Person und pro Fahrzeug. Für Auswertung in Excel.">
          {nachtragKnopf("Alle Daten als CSV", "csv-detail")}
        </button>{" "}
        {/* Drittes Format, weil es keinem der beiden CSVs entspricht: eine
            fremde Excel-Vorlage mit fester Spaltenfolge, in die die
            Führungsstelle die Zeilen direkt einfügt. */}
        <button type="button" onClick={(e) => ausgabeTipp("xlsx", "Die Excel-Liste", () => onOldenburgExport(exportUmfang), e)} disabled={gesperrt("xlsx")} title="Einheitenliste im Format der Führungsstelle Oldenburg: je gemeldeter Einheit eine Zeile, Spalten und Formatierung wie in deren Excel-Vorlage.">
          {nachtragKnopf("Excel-Liste (Format „Oldenburg“)", "xlsx")}
        </button>{" "}
        {/* Roh-JSON nur im Debug-Modus: fürs Publikum trägt die Sammel-PDF die
            Bögen als eingebettetes JSON — ein separater Export verwirrt nur. */}
        {debugAktiv() && (
          <button type="button" onClick={onExport}>Als Datei exportieren (Debug)</button>
        )}
      </div>
      {/* Was die zwei CSV-Dateien unterscheidet, steht unter den Knöpfen und nicht nur im Tooltip (R17-N9). */}
      <p className="hinweis csv-erklaerung">
        „Übersicht“: eine Zeile je Einheit mit Stärke und Bedarf, ohne Namen — für die Lage. „Alle Daten“: zusätzlich eine Zeile je Person
        (mit Namen und Rufnummern) und je Fahrzeug — nur an Stellen weitergeben, die Personendaten sehen dürfen.
      </p>
      {sofort && arbeitet === null && (
        <p className="hinweis arbeitet-zeile ausgabe-quittung" role="status">
          {sofort}
        </p>
      )}
      </div>

      {/* Hinter den Export-Knöpfen, nicht mitten in deren Erklärung (Audit Runde 6, R6-K5). */}
      <Suspense fallback={null}>
        <LagemonitorBlock einsatzId={einsatz.id} alleIds={einsaetzeLaden().map((x) => x.id)} />
      </Suspense>

      {/* Das Löschen gehört ans Ende des Inhalts, nicht in die feste Leiste am
          Daumen: Es ist die seltenste und folgenschwerste Handlung dieser
          Ansicht. */}
      <section className="karte einsatz-verwalten">
        <h2>Einsatz verwalten</h2>
        <p className="hinweis">
          Gelöschte Einsätze liegen 30 Tage im Papierkorb auf der Startseite und lassen sich von dort zurückholen.
        </p>
        <button type="button" className="entfernen" onClick={loeschen}>Einsatz löschen…</button>
      </section>

      {/* Quittung von Entfernen und Statuswechsel mit Rückweg — fest im
          Daumenbereich statt über den Summen am Seitenanfang: Wer in einer
          langen Liste bei 2 400 px „Abrücken" traf, sah die Quittung nicht,
          „Rückgängig" war ein 74 × 30 px großer Textlink (Audit Runde 2,
          R2-H4). Eine Quittung zur Zeit: die jüngere ersetzt die ältere. */}
      {/* Handlung und Zeit vorn, der Name danach: Die Leiste hat höchstens
          zwei Zeilen und kürzt am Ende (R3-G2). */}
      {zuletztEntfernt && (aktiveQuittung === "entfernt" || aktiveQuittung === "zurueck") && (
        <DaumenQuittung
          key={`entfernt:${zuletztEntfernt.eintraege.map((e) => e.id).join(",")}:${entferntStapel.length}`}
          mehrzeilig // die Umnummerierung („Nr. 2–4 rücken auf") steht am Satzende und gehört in die Quittung (R11-D2)
          onRueckgaengig={() => void entferntesZurueckholen()}
          onSchliessen={() => setZuletztEntfernt(null)}
        >
          {zuletztEntfernt.art === "fassung" ? (
            <>
              <strong>Fassung verworfen:</strong> Stand {standText(zuletztEntfernt.eintraege[0]!.bogen)} von „
              {einheitAnzeigename(zuletztEntfernt.eintraege[0]!.bogen.einheit)}"
            </>
          ) : (
            <>
              <strong>
                Entfernt{zuletztEntfernt.eintraege.length > 1 ? ` (${zuletztEntfernt.eintraege.length} Fassungen)` : ""}:
              </strong>{" "}
              Meldung {zuletztEntfernt.nummer != null ? `Nr. ${zuletztEntfernt.nummer} ` : ""}„{einheitAnzeigename(zuletztEntfernt.eintraege[0]!.bogen.einheit)}"
              {zuletztEntfernt.bezug ? ` (${zuletztEntfernt.bezug})` : ""}
              {zuletztEntfernt.verschoben ? `. ${zuletztEntfernt.verschoben}.` : ""}
              {entferntStapel.length > 1 ? ` · davor noch ${entferntStapel.length - 1} entfernt` : ""}
            </>
          )}
        </DaumenQuittung>
      )}
      {aufgeteilt && aktiveQuittung === "aufgeteilt" && (
        <DaumenQuittung
          key={`aufgeteilt:${aufgeteilt.neueIds.join(",")}`}
          mehrzeilig // „abgeteilt" und der Weg über „Zusammenführen…" stehen am Satzende (R11-D2)
          onRueckgaengig={() => void aufteilungZurueck()}
          onSchliessen={() => setAufgeteilt(null)}
        >
          „{aufgeteilt.teil}" von „{aufgeteilt.name}" abgeteilt. Später zurück über „Mehr…" › „Zusammenführen…".
        </DaumenQuittung>
      )}
      {gezaehltWeg && aktiveQuittung === "gezaehlt" && (
        <DaumenQuittung
          key={`gezaehlt:${gezaehltWeg.nonce}`}
          prellschutz
          mehrzeilig
          onRueckgaengig={() => void gezaehltZurueckNehmen()}
          rueckgaengigName="Rückgängig — wieder als Sollstärke führen"
          onSchliessen={() => { gezaehltWegVergessen(); setGezaehltWeg(null); }}
        >
          <strong>Als gezählt übernommen:</strong> „{gezaehltWeg.name}" mit den Sollzahlen — „Rückgängig" führt sie wieder als Sollstärke.
        </DaumenQuittung>
      )}
      {staerkeGeaendert && aktiveQuittung === "staerke" && (
        <DaumenQuittung
          key={`staerke:${staerkeGeaendert.eintragId}`}
          kurz={staerkeGeaendert.kennzeichnung ? (staerkeGeaendert.kennzeichnung === "einsatz" ? "Zählt jetzt" : "Jetzt Übung") : `Stärke ${staerkeGeaendert.vorher} → ${staerkeGeaendert.nachher}`}
          onRueckgaengig={() => void staerkeZurueckNehmen()}
          onSchliessen={() => setStaerkeGeaendert(null)}
        >
          {staerkeGeaendert.kennzeichnung ? (
            <>
              <strong>{staerkeGeaendert.kennzeichnung === "einsatz" ? "Zählt jetzt als Einsatzmeldung" : "Jetzt als Übung gekennzeichnet"}:</strong>{" "}
              „{staerkeGeaendert.name}"
            </>
          ) : (
            <>
              <strong>Stärke {staerkeGeaendert.vorher} → {staerkeGeaendert.nachher}</strong> geändert: „{staerkeGeaendert.name}"
            </>
          )}
        </DaumenQuittung>
      )}
      {zusammengefuehrt && aktiveQuittung === "zusammen" && (
        <DaumenQuittung
          key={`zusammengefuehrt:${zusammengefuehrt.vorher.zielId}`}
          onRueckgaengig={() => void zusammenfuehrungZurueckNehmen()}
          onSchliessen={() => setZusammengefuehrt(null)}
        >
          <strong>Zusammengeführt:</strong> „{zusammengefuehrt.name}" · Stärke der Meldung {zusammengefuehrt.staerkeVorher} → {zusammengefuehrt.staerkeNachher}
        </DaumenQuittung>
      )}
      {/* Statuswechsel mit Uhrzeit: Ein Tipp nahm die Einheit bisher wortlos
          aus allen Summen — und niemand konnte hinterher sagen, wann (D4, W3).
          Sie liegt womöglich genau unter dem Finger, der eben „Abrücken"
          getippt hat; ihre Knöpfe tragen deshalb denselben Prellschutz wie
          die Karte (R2-G4). */}
      {statusWechsel && aktiveQuittung === "status" && (
        <DaumenQuittung
          key={`status:${statusWechsel.vorher.id}:${statusWechsel.zeit}`}
          prellschutz
          mehrzeilig
          kurz={`${nummerText(statusWechsel.vorher.einheitSchluessel) || "Einheit "}${statusWechsel.status === MeldeStatus.ABGERUECKT ? "abgerückt" : "wieder da"}`}
          onRueckgaengig={() => void statusZurueck()}
          onSchliessen={() => setStatusWechsel(null)}
        >
          <strong>
            {statusWechsel.status === MeldeStatus.ABGERUECKT ? "Abgerückt" : "Wieder anwesend"} {zeitKurz(statusWechsel.zeit)}:
          </strong>{" "}
          {nummerText(statusWechsel.vorher.einheitSchluessel)}„{einheitAnzeigename(statusWechsel.vorher.bogen.einheit)}"
        </DaumenQuittung>
      )}
      {verschobenQuittung && aktiveQuittung === "verschoben" && (
        <DaumenQuittung
          key={`verschoben:${verschobenQuittung.nonce}`}
          prellschutz
          mehrzeilig
          onRueckgaengig={() => {
            const v = verschobenQuittung;
            setVerschobenQuittung(null);
            void v.zurueck();
          }}
          rueckgaengigName={`Verschieben rückgängig machen — zurück nach „${einsatz.name}“`}
          onSchliessen={() => setVerschobenQuittung(null)}
        >
          <strong>Verschoben:</strong> „{verschobenQuittung.name}“ liegt jetzt in „{verschobenQuittung.nach}“.
        </DaumenQuittung>
      )}
      {zugGesetzt && aktiveQuittung === "zug" && (
        <DaumenQuittung
          key={`zug:${zugGesetzt.nonce}`}
          prellschutz
          sperreKurz
          kurz={`Zug „${zugGesetzt.zug.length > 11 ? `${zugGesetzt.zug.slice(0, 10)}…` : zugGesetzt.zug}“`}
          onRueckgaengig={() => void zugZurueck()}
          rueckgaengigName="Zug-Zuordnung rückgängig machen"
          onSchliessen={() => setZugGesetzt(null)}
        >
          <strong>Zug „{zugGesetzt.zug}“ gesetzt:</strong>{" "}
          {zugGesetzt.ziele.length === 1 ? "1 Einheit" : `${zugGesetzt.ziele.length} Einheiten`}
        </DaumenQuittung>
      )}
      {auftragGesetzt && aktiveQuittung === "auftrag" && (
        <Suspense fallback={null}>
          <AuftragQuittung
            key={auftragGesetzt.nonce}
            a={auftragGesetzt}
            einsatzId={einsatz.id}
            setzen={notizSetzen}
            fertig={(text) => {
              setAuftragGesetzt(null);
              if (text) {
                zurueckQuittieren(text);
                onGeaendert();
              }
            }}
          />
        </Suspense>
      )}
      {kenntnisGenommen && aktiveQuittung === "kenntnis" && (
        <DaumenQuittung
          key={`kenntnis:${kenntnisGenommen.nonce}`}
          prellschutz
          sperreKurz
          kurz={`Zur Kenntnis: ${kenntnisGenommen.anzahl}`}
          onRueckgaengig={kenntnisZurueck}
          rueckgaengigName="Zur Kenntnis genommen rückgängig machen"
          onSchliessen={() => setKenntnisGenommen(null)}
        >
          <strong>Zur Kenntnis genommen:</strong>{" "}
          {kenntnisGenommen.anzahl === 1 ? "1 Einheit" : `${kenntnisGenommen.anzahl} Einheiten`}
        </DaumenQuittung>
      )}
      {kopfGeaendert && aktiveQuittung === "kopf" && (
        <DaumenQuittung
          key={`kopf:${kopfGeaendert.nonce}`}
          prellschutz
          sperreKurz
          onRueckgaengig={() => void kopfZurueck()}
          rueckgaengigName="Änderung an Name und Ort rückgängig machen"
          onSchliessen={() => setKopfGeaendert(null)}
        >
          <strong>Einsatz geändert:</strong> {kopfGeaendert.nachher}
        </DaumenQuittung>
      )}
      {uebersprungenQuittung && aktiveQuittung === "uebersprungen" && !zuletztEntfernt && (
        <DaumenQuittung key={`uebersprungen:${uebersprungenQuittung.nonce}`} onSchliessen={() => setEingangWeg(uebersprungenQuittung.nonce)}>
          {uebersprungenQuittung.text}
        </DaumenQuittung>
      )}
      {zurueckQuittung && aktiveQuittung === "zurueck" && !zuletztEntfernt && (
        <DaumenQuittung key={`zurueck:${zurueckQuittung.nonce}`} onSchliessen={() => setZurueckQuittung(null)}>
          {zurueckQuittung.text}
        </DaumenQuittung>
      )}
      {/* Moduswechsel von unten (Audit Runde 4, R4-L3): Die Einsatzansicht hat
          keine feste Leiste, der Umschalter im Kopf lag mitten in der Liste
          rund 2 000 px entfernt. Der Knopf stand zuerst schwebend über dem
          Inhalt und deckte Text und Bedienelemente ab (R5-L1); jetzt steht er
          in einer festen Leiste am unteren Rand, die ihre Höhe selbst
          freihält. Zwei Tipps (öffnen, wählen) genügen, ohne zu rollen. Die
          Quittung mit „Rückgängig" steht über der Leiste, die
          Bildschirmtastatur blendet sie aus. */}
      <div className="anzeige-balken">
        <AnzeigeLeistenKnopf mitText />
      </div>
    </main>
    </>
  );
}

/**
 * Einheitenliste als Tabelle: eine Zeile je Meldung, Spalten wie im
 * CSV-Export der Übersicht, darunter eine Summenzeile über die anwesenden
 * Zeilen der Auswahl.
 *
 * Gesucht und gefiltert wird oben in der Leiste — die Tabelle bekommt genau
 * das Ergebnis. Zusätzlich sind die Spaltenköpfe Sortierknöpfe: das ist der
 * Griff, den eine Tabelle mitbringt und eine Kartenliste nicht („welche
 * Einheit meldet den größten Verpflegungsbedarf?"). Zahlen starten dabei
 * absteigend — gefragt ist der größte Wert, nicht die Null.
 */
/**
 * Spalten der Einheitentabelle (R10-K3): Die Spalte „Zug" steht nur, wenn mindestens eine Einheit einen Zug trägt (sonst
 * 45 px leer vor den Zahlen). Am Telefon steht „Ges." gleich hinter dem Namen, F/U/M als Aufteilung dahinter, „Zug" danach:
 * Einheit, Gesamtstärke und Aufteilung liegen so ohne Wischen im Bild (360 und 320 px).
 */
export function tabellenSpaltenFuer(zugVorhanden: boolean, kompakt: boolean, kern = false): SpaltenDefinition[] {
  const spalten = TABELLEN_SPALTEN.filter((s) => zugVorhanden || s.schluessel !== "zugEtikett");
  if (!kompakt) return spalten;
  const nimm = (k: TabellenSpalte) => spalten.find((s) => s.schluessel === k);
  // R17-H8, R17-K7, R17-G7: Am Telefon vorerst nur das, wonach die Führung fragt: wer, wie stark, welcher Zug, wie alt die
  // Angaben, was gebraucht wird. Alle Spalten bleiben einen Tipp entfernt; die schmalen Köpfe sind dort kein Tippziel.
  if (kern) {
    return (["einheit", "gesamt", "zugEtikett", "meldung", "bedarf"] as const)
      .map(nimm)
      .filter((s): s is SpaltenDefinition => s != null);
  }
  const vorn = ["einheit", "gesamt", "fuehrer", "unterfuehrer", "mannschaft", "zugEtikett"] as const;
  return [
    ...vorn.map(nimm).filter((s): s is SpaltenDefinition => s != null),
    ...spalten.filter((s) => !(vorn as readonly string[]).includes(s.schluessel)),
  ];
}

function EinheitenTabelle({ meldungen, art, eingang, nummern, neueFassungen, kompakt = false }: { meldungen: MeldeEintrag[]; art: EinsatzArt; eingang?: Eingang | null; nummern?: Map<string, number>; neueFassungen?: Set<string>; kompakt?: boolean }) {
  // null = Reihenfolge der Liste (Sortierauswahl der Leiste) unverändert
  // übernehmen. Erst ein Klick auf einen Spaltenkopf ordnet hier um.
  const [spalte, setSpalte] = useState<TabellenSpalte | null>(null);
  const [richtung, setRichtung] = useState<Sortierrichtung>("auf");
  const [alleSpalten, setAlleSpalten] = useState(gemerkteAlleSpalten);
  const kern = kompakt && !alleSpalten;
  const zeilen = tabellenZeilen(meldungen, art);
  const spalten = tabellenSpaltenFuer(zeilen.some((z) => z.zugEtikett !== ""), kompakt, kern);
  const sortiert = spalte ? zeilenSortieren(zeilen, spalte, richtung) : zeilen;
  const summe = tabellenSumme(zeilen);
  const zaehlung = tabellenZaehlung(zeilen);

  function sortierenNach(s: TabellenSpalte, zahl: boolean) {
    if (spalte === s) {
      setRichtung(richtung === "auf" ? "ab" : "auf");
      return;
    }
    setSpalte(s);
    setRichtung(zahl ? "ab" : "auf");
  }

  /** Summenzeile spaltenweise — dieselbe Reihenfolge wie die Datenzeilen. */
  const summenWert: Record<TabellenSpalte, string | number> = {
    einheit: summenBeschriftung(zaehlung),
    organisation: "",
    zugEtikett: "",
    fuehrer: summe.staerke.fuehrer,
    unterfuehrer: summe.staerke.unterfuehrer,
    mannschaft: summe.staerke.mannschaft,
    gesamt: summe.staerke.gesamt,
    verpflegung: summe.verpflegung.gesamt,
    vegetarisch: summe.verpflegung.vegetarisch,
    vegan: summe.verpflegung.vegan,
    unterbringungM: summe.unterbringungAngefordert.m,
    unterbringungW: summe.unterbringungAngefordert.w,
    unterbringungD: summe.unterbringungAngefordert.d,
    wcM: summe.unterbringung.m,
    wcW: summe.unterbringung.w,
    wcD: summe.unterbringung.d,
    diesel: summe.kraftstoff.dieselLiter,
    benzin: summe.kraftstoff.benzinLiter,
    gemisch: summe.kraftstoff.gemischLiter,
    fahrzeuge: summe.fahrzeuge,
    bedarf: "",
    eingetroffen: "",
    meldung: "",
    abgerueckt: "",
    stand: "",
    auftrag: "",
  };

  return (
    <>
      {kompakt && (
        <p className="tabellen-spalten">
          <button
            type="button"
            aria-pressed={alleSpalten}
            onClick={() => {
              setAlleSpalten(!alleSpalten);
              merkeAlleSpalten(!alleSpalten);
            }}
          >
            {alleSpalten ? "Nur Kernspalten" : "Alle Spalten zeigen"}
          </button>
        </p>
      )}
      <TabellenScroll titel="Einheitenübersicht">
        <table className={`uebersicht einheiten-tabelle${kern ? " tabelle-kern" : ""}`}>
          <caption className="nur-sr">
            Gemeldete Einheiten mit Stärke, Verpflegung, Unterbringung und Kraftstoff
          </caption>
          <thead>
            <tr>
              {spalten.map((s) => (
                <th
                  key={s.schluessel}
                  scope="col"
                  data-spalte={s.schluessel}
                  className={s.zahl ? "zahl" : undefined}
                  aria-sort={
                    kern
                      ? undefined
                      : spalte === s.schluessel
                        ? richtung === "auf"
                          ? "ascending"
                          : "descending"
                        : "none"
                  }
                >
                  {kern ? (
                    // Kernspalten am Telefon: Köpfe nur zum Lesen. Fünf Tippziele von 44 px liegen dort ohne Abstand
                    // nebeneinander; sortiert wird mit „Alle Spalten" oder in der Leiste „Suchen, sortieren, filtern".
                    <span className="spalten-kopf">
                      <span aria-hidden="true">{s.kopf}</span>
                      <span className="nur-sr">{s.titel}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="spalten-sortierung"
                      title={`Nach ${s.titel} sortieren`}
                      onClick={() => sortierenNach(s.schluessel, s.zahl)}
                    >
                      <span aria-hidden="true">{s.kopf}</span>
                      <span className="nur-sr">{s.titel}</span>
                      {spalte === s.schluessel && (
                        <span className="sortier-pfeil" aria-hidden="true">
                          {richtung === "auf" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortiert.map((z) => (
              <TabellenZeileZelle
                key={z.eintrag.einheitSchluessel}
                zeile={z}
                spalten={spalten}
                eingang={eingang}
                nummer={nummern?.get(z.eintrag.einheitSchluessel)}
                neueFassung={neueFassungen?.has(z.eintrag.einheitSchluessel)}
              />
            ))}
          </tbody>
          {/* Die Summe zählt nur die anwesenden Zeilen der Auswahl — abgerückte
              stehen in der Tabelle, aber in keiner Summe, genau wie in der
              Stärkeleiste oben. */}
          <tfoot>
            <tr>
              {spalten.map((s) => (
                <td key={s.schluessel} className={s.zahl ? "zahl" : undefined}>
                  {summenWert[s.schluessel]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </TabellenScroll>
      <p className="hinweis">
        {kern
          ? "Kernspalten. Mit „Alle Spalten zeigen“ sind die Spaltenköpfe zum Sortieren antippbar. "
          : "Spaltenkopf anklicken sortiert die Tabelle. "}
        Details, Historie und Aktionen einer Einheit stehen in der Kartenansicht.
      </p>
    </>
  );
}

/**
 * Kennzeichnung einer Meldung, deren Datenschutzfrist abgelaufen ist — ihre
 * Personaldaten hat die Sammlung beim Laden schon entfernt. Ohne die Marke
 * sähe „Einsatzkraft 1" wie ein Erfassungsfehler aus.
 */
function AnonymBadge({ bogen, kurz }: { bogen: Erfassungsbogen; kurz?: boolean }) {
  if (!datenschutzfristAbgelaufen(bogen, datenschutzZeitpunkt())) return null;
  // In der schmalen, klebenden Namensspalte der Tabelle: Kurzmarke, die volle Marke bleibt für Vorleser und auf der Karte (R13-M1).
  if (kurz) {
    return (
      <span className="uebung-badge anonym-kurz" title={ANONYM_ERKLAERUNG}>
        <span aria-hidden="true">anon.</span>
        <span className="nur-sr">ANONYMISIERT</span>
      </span>
    );
  }
  return (
    <span className="uebung-badge" title={ANONYM_ERKLAERUNG}>
      ANONYMISIERT
    </span>
  );
}

/** Marke „älter als 24 h" am Absender-Stand, der weit vor dem Eintreffen liegt (siehe standIstAlt). */
function AltBadge() {
  return (
    <span className="alt-badge" title="Der Stand des Absenders liegt mehr als 24 Stunden vor dem Eintreffen — die Zahlen stammen aus einer anderen Zeit.">
      älter als 24 h
    </span>
  );
}

/** Eine Datenzeile — abgerückte Meldungen bleiben sichtbar, aber durchgestrichen. */
function TabellenZeileZelle({ zeile: z, spalten, eingang, nummer, neueFassung }: { zeile: TabellenZeile; spalten: SpaltenDefinition[]; eingang?: Eingang | null; nummer?: number; neueFassung?: boolean }) {
  const zeile = useEingangsquittung<HTMLTableRowElement>(marke(eingang, z.eintrag.einheitSchluessel), { rollen: false });
  return (
    <tr ref={zeile} data-einheit={z.eintrag.einheitSchluessel} className={z.anwesend ? undefined : "gestrichen"}>
      <th scope="row">
        {nummer != null ? <><span className="meldung-nr">Nr. {nummer}</span>{" "}</> : null}
        {/* Durchgestrichen wird nur der Name, das Statuswort bleibt lesbar —
            wie in den Karten (Audit Runde 3, R3-L3). */}
        <span className="tabelle-name">{weicheTrennstellen(z.einheit)}</span>
        {z.eintrag.bogen.uebung ? <span className="uebung-badge">ÜBUNG</span> : null}
        <AnonymBadge bogen={z.eintrag.bogen} kurz />
        <SignaturWarnung eintrag={z.eintrag} />
        {z.teilEtikett ? <span className="teil-badge">{z.teilEtikett}</span> : null}
        {z.anwesend && nurSollstaerke(z.eintrag.bogen) ? <span className="bedarf-marke" title="Niemand hat gezählt: Die Zahl ist die Sollstärke der Vorbelegung.">Sollstärke, nicht gemeldet</span> : null}
        {neueFassung ? <span className="fassung-badge">neue Fassung</span> : null}
        {!z.anwesend && (
          <span className="status-badge">
            {z.eintrag.status === MeldeStatus.ABGERUECKT ? "abgerückt" : "zusammengeführt"}
          </span>
        )}
      </th>
      {/* Die Zellen folgen TABELLEN_SPALTEN, damit Kopf, Zeile und Summe nie
          auseinanderlaufen, wenn die Spaltenfolge sich ändert (R2-K5). */}
      {spalten.filter((s) => s.schluessel !== "einheit").map((s) => (
        <TabellenZelle key={s.schluessel} spalte={s.schluessel} zeile={z} />
      ))}
    </tr>
  );
}

/** Eine Datenzelle der Einheitentabelle (alles außer dem Zeilenkopf „Einheit"). */
function TabellenZelle({ spalte, zeile: z }: { spalte: TabellenSpalte; zeile: TabellenZeile }) {
  switch (spalte) {
    // Zahl plus Typen: „3" beantwortet die Summenfrage, „GKW / MzKW" die
    // nach dem, was tatsächlich dasteht.
    case "fahrzeuge":
      return <td className="zahl" title={z.fahrzeugTypen}>{z.fahrzeuge}</td>;
    case "bedarf":
      // Jede Marke unteilbar („Diesel 745 l" bricht nicht), die Zelle bricht zwischen den Marken (R8-K2): statt einer
      // langen Zeile eine schmale Spalte, und Auftrag und Eintreffen davor bleiben im Bild.
      return (
        <td className="bedarf-zelle">
          {z.bedarf
            ? z.bedarf.split(" · ").map((teil, i) => (
                <Fragment key={i}>
                  {i > 0 ? " · " : null}
                  <span className="bedarf-teil">{teil}</span>
                </Fragment>
              ))
            : null}
        </td>
      );
    case "auftrag":
      return <td className="auftrag-zelle">{z.auftrag}</td>;
    case "meldung": {
      // Abgerückte: Das Alter der Meldung sagt nichts mehr über die Lage.
      if (!z.anwesend) return <td>—</td>;
      const jetzt = Date.now();
      const alt = jetzt - z.angabenAm >= 60 * 60_000;
      return (
        <td className={alt ? "warnung-text" : undefined}>
          {alt ? "⚠ " : ""}
          {/* Unter „Meldung vor" steht nur die Dauer; beim Stand trägt die Zelle ihr „vor" selbst, sonst las es sich „Stand 101 Tagen" (R16-N1). */}
          {z.angabenWort === "Stand" ? `Stand ${alterText(z.angabenAm, jetzt)}` : alterText(z.angabenAm, jetzt).replace(/^vor /, "")}
        </td>
      );
    }
    case "stand":
      return (
        <td>
          {z.stand}
          {z.standAlt && <AltBadge />}
        </td>
      );
    // „1. Zug" bricht nicht in „1." und „Zug" (R17-K7).
    case "zugEtikett":
      return <td className="zug-zelle">{z.zugEtikett}</td>;
    case "einheit":
    case "organisation":
    case "eingetroffen":
    case "abgerueckt":
      return <td>{z[spalte]}</td>;
    default:
      return <td className="zahl">{z[spalte]}</td>;
  }
}

/**
 * Zahl der Stärke-Leiste. Ändert eine neue Meldung den Wert, quittiert die
 * Zahl das mit dem Aufblitzen aus index.html (.zahl-geaendert) — dieselbe
 * Quittung wie die abgeleitete Stärke im Personal-Schritt (siehe quittung.ts).
 */
function Zaehlwert({ wert }: { wert: number }) {
  return <strong ref={useZahlQuittung<HTMLElement>(wert)}>{wert}</strong>;
}

/**
 * Read-only Vollansicht eines gemeldeten Bogens (Zugehörigkeit, Einsatz,
 * Personal, Fahrzeuge, Sofortbedarf) — spiegelt die Erfassungs-Übersicht bzw.
 * das PDF, aber ohne Bearbeiten-Aktionen: fremde Bögen werden hier nur gelesen.
 */
/** E-Mail-Adresse mit Umbruchstellen hinter „@" und „." — der Text selbst bleibt unverändert kopierbar (R14-S4). */
export function adresseUmbrechbar(wert: string): ReactNode[] {
  const aus: ReactNode[] = [];
  let teil = "";
  for (const z of wert) {
    teil += z;
    if (z === "@" || z === ".") {
      aus.push(teil, <wbr key={aus.length} />);
      teil = "";
    }
  }
  if (teil) aus.push(teil);
  return aus;
}

export function BogenDetails({ bogen, absender, absenderKarte }: { bogen: Erfassungsbogen; absender?: string; absenderKarte?: Absenderkarte }) {
  const org = bogen.einheit.organisation;
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);
  const vp = verpflegung(bogen);
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const sb = bogen.sofortbedarf;

  return (
    <div className="bogen-details">
      {absender ? (
        <>
          <h4>Absender (Rückfrage)</h4>
          <p className="absender-details">{absenderKarte ? <AbsenderKontakt karte={absenderKarte} /> : absender}</p>
        </>
      ) : null}
      <h4>Zugehörigkeit</h4>
      <dl className="paare">
        <dt>Organisation</dt>
        <dd>{orgLabel(org)}{bogen.einheit.organisationName ? ` — ${bogen.einheit.organisationName}` : ""}</dd>
        <dt>Einheitstyp</dt>
        <dd>{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "—"}</dd>
        {/* <div> statt <span>: nur <div> ist in einer Definitionsliste als
            Gruppierung zulässig, sonst verliert Vorlesesoftware den Bezug
            zwischen Ebene und Name. */}
        {bogen.einheit.hierarchie.map((h, i) => (
          <div key={i} style={{ display: "contents" }}>
            <dt>{vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene"}</dt>
            <dd>
              {h.name}{h.kurz ? ` (${h.kurz})` : ""}
              {/* Telefon und Adresse je Zeile, Adressen nur an „@" und „." umbrechen — kein „·" am Zeilenrand (R14-S4). */}
              {h.telefon ? <span className="kontakt-zeile"><KontaktLink art="tel" wert={h.telefon} /></span> : null}
              {h.email ? <span className="kontakt-zeile"><KontaktLink art="mail" wert={h.email} kinder={adresseUmbrechbar(h.email)} /></span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <h4>Einsatz / Auftrag</h4>
      <dl className="paare">
        <dt>Zeitraum</dt>
        <dd>{datumAnzeige(bogen.einsatz.zeitraumVon)} – {datumAnzeige(bogen.einsatz.zeitraumBis)}</dd>
        <dt>Ort / Auftrag</dt><dd>{bogen.einsatz.ortAuftrag || "—"}</dd>
        <dt>Beginn / Ende</dt>
        <dd>
          {bogen.einsatz.einsatzbeginn != null ? zeitpunktDeutsch(bogen.einsatz.einsatzbeginn) : "—"}
          {" / "}
          {bogen.einsatz.einsatzende != null ? zeitpunktDeutsch(bogen.einsatz.einsatzende) : "—"}
        </dd>
      </dl>

      <h4>Personal ({s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt})</h4>
      {nurStaerke && (
        <p className="hinweis">
          Meldekopf-Modus: nur Stärke gemeldet{bogen.personal.length > 0 ? " — unten die Ansprechpartner:innen" : ""}.
        </p>
      )}
      {/* „Stärke ändern…" lässt die Namen stehen: Überschrift und Liste sagen sonst Verschiedenes (R14-W4). */}
      {bogen.staerkeManuell != null && bogen.personal.length > 0 && bogen.personal.length !== s.gesamt && (
        <p className="hinweis stärke-hand-hinweis">
          Stärke von Hand auf {s.gesamt} geändert; die {bogen.personal.length} Namen stammen aus der Meldung davor.
        </p>
      )}
      {bogen.personal.length > 0 ? (
        <TabellenScroll titel="Personal">
          <table className="uebersicht">
            <thead>
              {/* Spalten wie in der Bogen-Übersicht: erst die Rolle, dann die
                  Funktion — der Meldekopf liest beide Listen nebeneinander. */}
              <tr><th title={STAERKE_LEGENDE}>Rolle</th><th>Funktion / Zusatzfunktion</th><th>Name, Vorname</th><th>Erreichbarkeit</th></tr>
            </thead>
            <tbody>
              {bogen.personal.map((p, i) => (
                <tr key={i}>
                  <td><RolleMarke rolle={p.staerkeRolle} /></td>
                  <td>{funktionsText(p, org) || "—"}</td>
                  <td>{p.nachname}{p.nachname && p.vorname ? ", " : ""}{p.vorname}</td>
                  <td>
                    {p.kontakte.length > 0
                      ? p.kontakte.map((k, ki) => (
                          <span key={ki}>{ki > 0 && " · "}<PersonKontakt kontakt={k} /></span>
                        ))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabellenScroll>
      ) : (
        !nurStaerke && <p className="hinweis">Kein Personal erfasst.</p>
      )}
      <p className="hinweis">Geschlecht: {mwdText(mwd)}</p>

      <h4>Fahrzeuge ({bogen.fahrzeuge.length})</h4>
      {bogen.fahrzeuge.length > 0 ? (
        <TabellenScroll titel="Fahrzeuge">
          <table className="uebersicht">
            <thead>
              <tr><th>Typ</th><th>Kennzeichen</th><th>Funkrufname</th><th>Ausstattung (StAN)</th><th>Änderungen</th></tr>
            </thead>
            <tbody>
              {bogen.fahrzeuge.map((f, i) => (
                <tr key={i}>
                  <td>{vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "—"}</td>
                  <td>{kennzeichenText(f) || "—"}</td>
                  <td>{funkrufText(f, bogen.einheit) || "—"}</td>
                  <td>{f.stanKonform == null ? "—" : f.stanKonform ? "ja" : "nein"}</td>
                  <td>{f.aenderungen ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabellenScroll>
      ) : (
        <p className="hinweis">Keine Fahrzeuge erfasst.</p>
      )}

      <h4>Sofortbedarf &amp; Sonstiges</h4>
      <dl className="paare">
        <dt>Verpflegung</dt>
        <dd>{sb ? verpflegungBogenText(sb.verpflegungPersonen, vp) : "—"}</dd>
        <dt>Betriebsstoff</dt>
        <dd>{sb ? `${sb.dieselLiter} l Diesel / ${sb.benzinLiter} l Benzin / ${sb.gemischLiter} l Gemisch` : "—"}</dd>
        <dt>Unterbringung / Ruhezeit</dt>
        <dd>{sb ? `${sb.unterbringung ? "Unterbringung" : "keine Unterbringung"} · ${sb.ruhezeitErforderlich ? "Ruhezeit erforderlich" : "keine Ruhezeit"}` : "—"}</dd>
        <dt>Sonstiges</dt><dd>{bogen.sonstiges || "—"}</dd>
      </dl>
    </div>
  );
}

// ------------------------------------------------------- Änderungen (Diff)

/** Geänderte Felder als „vorher → nachher"; rendert nichts, wenn leer. */
function DiffWerte({ titel, eintraege }: { titel: string; eintraege: WertAenderung[] }) {
  if (eintraege.length === 0) return null;
  return (
    <>
      <h4>{titel}</h4>
      <ul className="diff-liste">
        {eintraege.map((a) => (
          <li key={a.feld}>
            <span className="diff-feld">{a.feld}:</span> <span className="diff-vorher">{a.vorher}</span>
            {" → "}
            <span className="diff-nachher">{a.nachher}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Zu- bzw. abgegangene Positionen (Personen, Fahrzeuge). */
function DiffPosten({ titel, art, zeilen }: { titel: string; art: "zugang" | "abgang"; zeilen: string[] }) {
  if (zeilen.length === 0) return null;
  return (
    <>
      <h4>{titel}</h4>
      <ul className={`diff-liste ${art}`}>
        {zeilen.map((z, i) => (
          <li key={`${z}-${i}`}>
            <span className="diff-zeichen">{art === "zugang" ? "+" : "−"}</span> {z}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * „Was hat sich seit der letzten Meldung geändert?" — Kern der Schichtübergabe.
 * Zeigt ausschließlich Bewegung; unveränderte Felder bleiben weg (dafür gibt es
 * die Vollansicht „Details").
 */
function Aenderungen({ vorher, nachher }: { vorher: Erfassungsbogen; nachher: Erfassungsbogen }) {
  const d = bogenDiff(vorher, nachher);
  // Übung ↔ Einsatzmeldung am Meldekopf umgestellt (R14-E1): eine eigene Zeile, kein „inhaltlich unverändert".
  const kennzeichnung = !!vorher.uebung === !!nachher.uebung ? "" : nachher.uebung ? "Einsatzmeldung → Übung" : "Übung → Einsatzmeldung";
  if (d.anzahl === 0 && kennzeichnung) {
    return (
      <p className="hinweis diff-block">
        Gegenüber der Meldung vom {standText(vorher)}: Kennzeichnung {kennzeichnung}.
      </p>
    );
  }
  if (d.anzahl === 0) {
    return (
      <p className="hinweis diff-block">
        Inhaltlich unverändert gegenüber der Meldung vom {standText(vorher)} (nur der Meldestand ist neuer).
      </p>
    );
  }
  return (
    <div className="diff-block">
      <p className="hinweis">Gegenüber der Meldung vom {standText(vorher)}:</p>
      {kennzeichnung && <p className="hinweis">Kennzeichnung: {kennzeichnung}.</p>}
      <DiffWerte titel="Stärke" eintraege={d.staerke} />
      <DiffPosten titel="Personal neu gemeldet" art="zugang" zeilen={d.personalZugang} />
      <DiffPosten titel="Personal nicht mehr gemeldet" art="abgang" zeilen={d.personalAbgang} />
      <DiffWerte titel="Personal geändert" eintraege={d.personalGeaendert} />
      <DiffPosten titel="Fahrzeuge neu gemeldet" art="zugang" zeilen={d.fahrzeugeZugang} />
      <DiffPosten titel="Fahrzeuge abgemeldet" art="abgang" zeilen={d.fahrzeugeAbgang} />
      <DiffWerte titel="Fahrzeuge geändert" eintraege={d.fahrzeugeGeaendert} />
      <DiffWerte titel="Sofortbedarf" eintraege={d.bedarf} />
      <DiffWerte titel="Auftrag / Sonstiges" eintraege={d.sonstiges} />
    </div>
  );
}

/**
 * Eine eben vorgenommene Aufteilung — die Quittung nennt sie und bietet den
 * Rückweg an (Audit Runde 2, R2-D6). `neueIds` sind genau die Einträge, die
 * die Aufteilung angelegt hat (Rest-Fassung und abgeteilter Teil); sie wieder
 * herauszunehmen stellt den Stand davor her.
 */
interface Aufgeteilt {
  name: string;
  teil: string;
  neueIds: string[];
}

/** „Stärke ändern…" eben übernommen — Quittung mit Rückweg (R4-E4). */
interface StaerkeGeaendert {
  name: string;
  vorher: number;
  nachher: number;
  /** Die neue Fassung — „Rückgängig" nimmt sie wieder heraus. */
  eintragId: string;
  /** Statt der Stärke wurde die Kennzeichnung umgestellt: „Als Einsatzmeldung zählen" / „Als Übung kennzeichnen" (R14-E1). */
  kennzeichnung?: "einsatz" | "uebung";
}

/** Eben zusammengeführt — Quittung mit Rückweg und der Stärke vorher → nachher (R4-D5). */
interface Zusammengefuehrt {
  name: string;
  staerkeVorher: number;
  staerkeNachher: number;
  vorher: ZusammenfuehrungVorher;
}

/**
 * Was „Entfernen" oder „Fassung verwerfen" zuletzt aus der Sammlung nahm —
 * neueste Fassung zuerst. Die Ansicht legt es bei „Rückgängig" unverändert
 * zurück (Audit Runde 2, R2-D1).
 */
interface Entfernt {
  art: "einheit" | "fassung";
  eintraege: MeldeEintrag[];
  /** Laufende Nummer vor dem Entfernen — danach hat die Einheit keine mehr. */
  nummer?: number;
  /** Folge für die Nummern der übrigen Einheiten (R8-D2), leer ohne Verschiebung. */
  verschoben?: string;
  /** Teil und Stärke, wie die Karte sie trägt („Teil „Trupp 2", 4 Personen") — gleich benannte Karten unterscheiden (R14-D1). */
  bezug?: string;
}

/**
 * Was die Rückfrage „Meldung entfernen?" und ihre Quittung über die Meldung sagen, außer dem Namen (R14-D1): Ein
 * abgeteilter Trupp trägt denselben Namen wie seine Stammeinheit; ohne Teil und Stärke lautete die Rückfrage für beide
 * Karten wörtlich gleich. `bezug` = Teil und Stärke dieser Meldung, `folge` = was mit den Personen geschieht.
 */
export function entfernenBezug(alle: readonly MeldeEintrag[], kopf: MeldeEintrag): { bezug: string; folge: string } {
  const personen = (n: number) => `${n} ${n === 1 ? "Person" : "Personen"}`;
  const eigene = staerke(kopf.bogen).gesamt;
  const istTeil = stammSchluessel(kopf.einheitSchluessel) !== kopf.einheitSchluessel;
  const bezug = `${istTeil ? `Teil „${kopf.teilEtikett || "abgeteilt"}", ` : ""}${personen(eigene)}`;
  if (istTeil) {
    return {
      bezug,
      folge: `Diese ${personen(eigene)} zählen danach nirgends mehr; zurück in die Einheit geht es über „Zusammenführen…“.`,
    };
  }
  const teile = koepfeJe(alle).filter(
    (e) => e.einheitSchluessel !== kopf.einheitSchluessel && stammSchluessel(e.einheitSchluessel) === kopf.einheitSchluessel,
  );
  if (teile.length === 0) return { bezug, folge: "" };
  const liste = teile.map((e) => `„${e.teilEtikett || "abgeteilt"}" (${personen(staerke(e.bogen).gesamt)})`).join(", ");
  return {
    bezug,
    folge: `Abgeteilt bleibt stehen: ${liste}.`,
  };
}

/** Eine Revisionszeile in der Historie, mit Diff zur direkt älteren Fassung. */
function HistorieZeile({ eintrag, vorheriger, aktuell, verdraengt = false, onVerwerfen, onGilt }: {
  eintrag: MeldeEintrag;
  vorheriger?: MeldeEintrag;
  aktuell: boolean;
  /** Von der Führungsstelle durch eine andere Fassung ersetzt (R4-W1). */
  verdraengt?: boolean;
  /** Nur diese Fassung verwerfen (R2-D1) — die Historie steht erst ab zwei Fassungen da. */
  onVerwerfen?: () => void;
  /** Diese Fassung soll gelten (R4-W1). */
  onGilt?: () => void;
}) {
  const [offen, setOffen] = useState(false);
  return (
    <li>
      Stand {standText(eintrag.bogen)} · Stärke {staerkeText(eintrag.bogen)} · {QUELLE_LABEL[eintrag.quelle]}
      {/* Wann die Fassung HIER eingegangen ist — der Stand ist die Uhr des
          Absenders (Audit Runde 2, R2-K6). */}
      {" · eingegangen "}{zeitKurz(eintrag.empfangenAm)}
      {/* Am Meldekopf von Hand geändert: die Meldung der Einheit hat ihre eigene Zeit (R17-K1). */}
      {eintrag.angaben && <> · Meldung der Einheit {zeitLang(eintrag.angaben.seit)}</>}
      {aktuell ? " (aktuell)" : verdraengt ? " (ersetzt)" : ""}
      {onGilt && (
        <>
          {" "}
          <button type="button" className="link historie-aktion" onClick={onGilt}>Diese Fassung gilt…</button>
        </>
      )}
      {vorheriger && (
        <>
          {" "}
          <button type="button" className="link historie-aktion" onClick={() => setOffen(!offen)}>
            {offen ? "Änderungen ausblenden" : "Änderungen"}
          </button>
        </>
      )}
      {onVerwerfen && (
        <>
          {" "}
          <button type="button" className="link historie-aktion historie-verwerfen" onClick={onVerwerfen}>Fassung verwerfen…</button>
        </>
      )}
      {offen && vorheriger && <Aenderungen vorher={vorheriger.bogen} nachher={eintrag.bogen} />}
    </li>
  );
}

// Quittungsleiste: daumen-quittung.tsx; Prellschutz und Ortssperre: tipp-schutz.ts.
export { PRELLSCHUTZ_MS } from "./tipp-schutz";

function EinheitKarte(props: {
  einsatzId: string;
  kopf: MeldeEintrag;
  alle: MeldeEintrag[];
  onGeaendert: () => void;
  /** Das Entfernte — die Ansicht bietet es danach zum Zurückholen an. */
  onEntfernt?: (entfernt: Entfernt) => void;
  /** Aktiver Qualifikationsfilter ("" = keiner) — nennt die passenden Personen in der Zeile. */
  qualifikation?: string;
  /** Kurzform der gefilterten Qualifikation für die Trefferzeile („AGT"). */
  qualifikationKurz?: string;
  /** Die gerade eingegangene Meldung — trifft sie diese Zeile, quittiert sie. */
  eingang?: Eingang | null;
  /** Statuswechsel von Hand — die Ansicht quittiert ihn mit Uhrzeit und Rückweg. */
  onStatusWechsel?: (w: StatusWechsel) => void;
  /** Schmaler Bildschirm: zugeklappt nur Name, Stärke und Bedarf (R2-K7). */
  kompakt?: boolean;
  /** Stärke eben geändert — die Ansicht quittiert mit Rückweg (R4-E4). */
  onStaerkeGeaendert?: (s: StaerkeGeaendert) => void;
  /** Eben zusammengeführt — die Ansicht quittiert mit Rückweg (R4-D5). */
  onZusammengefuehrt?: (z: Zusammengefuehrt) => void;
  /** Eben aufgeteilt — die Ansicht quittiert mit Rückweg (R2-D6). */
  onAufgeteilt?: (a: Aufgeteilt) => void;
  /** Auftrag/Notiz eben gespeichert — die Ansicht quittiert mit Rückweg (R15-W3). */
  onAuftragGesetzt?: (a: AuftragGesetzt) => void;
  /** Laufende Nummer der Meldung, wie auf dem Lageblatt (R2-A6). */
  nummer?: number;
  /** Aktuelle Fassung kam nach der letzten Kenntnisnahme (R3-K1). */
  ungesehen?: boolean;
  /** Jünger als 30 Minuten und noch nicht zur Kenntnis genommen (R4-K7). */
  frisch?: boolean;
  /** Ort/Auftrag des Bogens passt nicht zu dieser Lage: sein Text (R4-K6). */
  fremderOrt?: string;
  /** Die Karte verschwand mit nicht gespeicherter Eingabe: Schlüssel der Einheit und Satz dazu (R12-O1). */
  onEingabeVerloren?: (einheitSchluessel: string, text: string) => void;
  /** Zug, Auftrag/Notiz oder Zeit an dieser Karte gespeichert — ältere Quittungen ohne Bezug weichen (R14-D3). */
  onHandlung?: () => void;
  /** Eine Einheit wurde in einen anderen Einsatz verschoben und der Ergebnisdialog ist zu — Quittung mit Rückgängig (R14-D4). */
  onVerschoben?: (v: Verschoben) => void;
}) {
  const { einsatzId, kopf, alle, onGeaendert, onEntfernt, qualifikation = "", qualifikationKurz = "", eingang, onStatusWechsel, kompakt = false } = props;
  // Auf dem Telefon zugeklappt, bis die Einheit angetippt wird (R2-K7).
  // Nach dem Neuladen wieder aufgeklappt, wenn es die Karte war, an der zuletzt gearbeitet wurde (R17-E5, R17-O2, R17-S10, R17-W5).
  const [aufgeklappt, setAufgeklapptRoh] = useState(() => karteWarOffen(props.einsatzId, props.kopf.einheitSchluessel));
  const setAufgeklappt = (offen: boolean) => {
    setAufgeklapptRoh(offen);
    karteOffenMerken(einsatzId, kopf.einheitSchluessel, offen);
  };
  const zu = kompakt && !aufgeklappt;
  // Ohne Rollen: Die Ansicht bleibt nach der Aufnahme oben (R2-S3).
  const zeile = useEingangsquittung<HTMLLIElement>(marke(eingang, kopf.einheitSchluessel), { rollen: false });
  const nameId = useId();
  // Bis wann die Karte nach einem Statuswechsel keine Tipps annimmt (R2-G4).
  // Der Zeitstempel sperrt jeden Knopf der Karte; der Zustand graut den
  // Wechselknopf für diese Zeit aus, damit sichtbar ist, dass er gerade nicht
  // annimmt (und Testautomaten auf ihn warten, statt ins Leere zu tippen).
  const gesperrtBis = useRef(0);
  const [prellt, setPrellt] = useState(false);
  // Der Wechselknopf selbst bleibt länger zu (ORTSSPERRE_MS) und zeigt so
  // lange, was eben geschah („✓ Abgerückt"): Ein zögernder zweiter Tipp nach
  // 600 oder 1 000 ms traf sonst „Wieder anwesend" am selben Platz und nahm
  // das Abrücken zurück (Audit Runde 3, R3-S5). Wer unsicher war, ob der
  // erste Tipp ankam, sieht die Antwort jetzt unter dem Finger.
  const tauschBis = useRef(0);
  const [getauscht, setGetauscht] = useState<MeldeStatus | null>(null);
  useEffect(() => {
    if (getauscht == null) return;
    const uhr = setTimeout(() => setGetauscht(null), Math.max(0, tauschBis.current - Date.now()));
    return () => clearTimeout(uhr);
  }, [getauscht]);
  // Der Wechselknopf und seine Lage im Bild beim Tipp: Nach dem Abrücken
  // wächst die Zeitzeile („· abgerückt 11:07 ändern") meist um eine Zeile,
  // und die Knopfreihe rutschte 28 px unter dem Finger weg. Die Ansicht rollt
  // um genau diesen Betrag nach, damit der Rückweg dort liegt, wo eben
  // „Abrücken" lag (R2-G4).
  const wechselKnopf = useRef<HTMLButtonElement>(null);
  const ankerOben = useRef<number | null>(null);
  useLayoutEffect(() => {
    const alt = ankerOben.current;
    ankerOben.current = null;
    const neu = wechselKnopf.current?.getBoundingClientRect().top;
    if (alt == null || neu == null) return;
    const versatz = neu - alt;
    if (Math.abs(versatz) < 1) return;
    try {
      window.scrollBy(0, versatz);
    } catch {
      /* Testumgebung ohne Layout */
    }
  }, [kopf.status]);
  useEffect(() => {
    if (!prellt) return;
    const uhr = setTimeout(() => setPrellt(false), Math.max(0, gesperrtBis.current - Date.now()));
    return () => clearTimeout(uhr);
  }, [prellt]);
  // Die Namen gehören in die Zeile, nicht hinter einen Klick: die Frage lautet
  // „wen habe ich?", und die Antwort ist der Name, nicht die Zahl.
  const qualiPersonen = personenMitQualifikation(kopf, qualifikation);
  const [details, setDetails] = useState(false);
  const [historie, setHistorie] = useState(false);
  const vermerke = kopf.vermerke ?? [];
  const [aenderungen, setAenderungen] = useState(false);
  const [aufteilen, setAufteilen] = useState(false);
  const [zusammenfuehren, setZusammenfuehren] = useState(false);
  // Zweite Knopfreihe mit den seltenen Aktionen (R2-H9).
  const [mehr, setMehr] = useState(false);
  const mehrOffen = mehr || aufteilen || zusammenfuehren;
  const [pdfLaeuft, setPdfLaeuft] = useState(false);
  // Bestätigung nach „Bogen als PDF" (R15-A5); der nächste Tipp auf den Knopf räumt sie weg.
  const [pdfHinweis, setPdfHinweis] = useState<string | null>(null);
  // null = nicht in Bearbeitung; String = Entwurf des Zug-Etiketts.
  const [zugEntwurf, setZugEntwurf] = useState<string | null>(null);
  const zugListeId = useId();
  // Entwurf des Auftrags/der Notiz der Führungsstelle (K5), gleiche Regel.
  const [notizEntwurf, setNotizEntwurf] = useState<string | null>(null);
  // Eintreff- oder Abrückzeit in Korrektur (Nachtragen vom Papier).
  const [zeitEntwurf, setZeitEntwurf] = useState<{ feld: "eintreffen" | "abruecken"; wert: string } | null>(null);
  const [lueckenOffen, setLueckenOffen] = useState(false);
  // Was der Bogen offenlässt (keine Rufnummer, Stärke ohne Namen…) — dieselbe
  // Prüfliste, die die Einheit beim Ausfüllen sieht. Auf der Karte, damit die
  // Rückfrage kommt, solange die Einheit noch vor dem Meldekopf steht (K3).
  const luecken = pruefpunkteEintrag(kopf);
  const bedarf = bedarfMarken(kopf.bogen);
  const revs = revisionenJe(alle, kopf.einheitSchluessel);
  // Folgemeldung: die direkt ältere Fassung derselben Einheit ist der Bezug für
  // „was hat sich seit der letzten Meldung geändert?".
  // Eine nur in die Historie gelegte ältere Fassung (verdrängt) ist kein Vorgänger (R8-W2).
  const vorige = revs[1] && !istVerdraengt(revs[1], revs) ? revs[1] : undefined;
  // Bogen der Einheit kam nach der Schnellerfassung, trägt aber den älteren
  // Stand — die Lage rechnet sonst still weiter mit Platzhaltern (R4-W1).
  const nachgereicht = nachgereichterBogen(kopf, revs);
  // Später eingetroffen, anderer Inhalt, älterer Stand: gilt nicht und bleibt nach der flüchtigen Quittung sichtbar (R15-E2).
  const neuereMarke = (kompakt: boolean) =>
    kopf.status === MeldeStatus.ANWESEND && !nachgereicht && (
      <Suspense fallback={null}>
        <NeuereEingabe kopf={kopf} fassungen={revs} standText={standText} nameId={nameId} kompakt={kompakt} onHistorie={() => setHistorie(true)} />
      </Suspense>
    );
  const kurz = vorige ? vergleichKurztext(vorige, kopf) : "";
  // Folgemeldung von außen (nicht die Rest-Fassung eines Aufteilens): wann
  // sie einging und was sie änderte. Frisch oder noch nicht zur Kenntnis
  // genommen trägt sie die Marke „neue Fassung" — auch zugeklappt auf dem
  // Telefon; an der geerbten Eintreffzeit war sie nicht zu erkennen (Audit
  // Runde 3, R3-K1).
  const folge = folgeAenderung(kopf, alle);
  // Bemerkung der Einheit („Sonstiges"); neu, wenn die Folgemeldung sie
  // geändert hat — dann auch zugeklappt ein Merkmal (R3-K3).
  const bemerkung = kopf.bogen.sonstiges?.trim() ?? "";
  const bemerkungNeu = folge != null && !!vorige && bemerkung !== "" && (vorige.bogen.sonstiges?.trim() ?? "") !== bemerkung;
  const [bemerkungGanz, setBemerkungGanz] = useState(false);
  const neueFassung = folge != null && (!!props.ungesehen || (!!props.frisch && frischGemeldet(kopf)));
  const abgerueckt = kopf.status === MeldeStatus.ABGERUECKT;
  // Eine Einheit, die schon abgerückt war und zurückgeholt wurde, ist dem Helfer bekannt: kein erneutes „neu" (R17-N4).
  const warAbgerueckt = (kopf.vermerke ?? []).some((v) => v.text === "Abgerückt");
  const zeitHinweis =zeitUnstimmigkeit({ eintreffen: eintreffzeit(kopf), abgerueckt: abgerueckt ? kopf.abgerueckAm : null });
  const aufgegangen = kopf.status === MeldeStatus.AUFGEGANGEN;
  // Nur anwesende Meldungen zählen — und nur an ihnen sind Aufteilen und
  // Zusammenführen sinnvoll.
  const zaehlt = kopf.status === MeldeStatus.ANWESEND;
  // Andere anwesende Teile derselben Einheit — die Gegenstücke zum Zusammenführen.
  const geschwister = koepfeJe(alle).filter(
    (e) =>
      e.einheitSchluessel !== kopf.einheitSchluessel &&
      stammSchluessel(e.einheitSchluessel) === stammSchluessel(kopf.einheitSchluessel) &&
      e.status === MeldeStatus.ANWESEND,
  );
  // Eine andere Karte derselben Organisation am selben Ort ohne klar anderen Einheitstyp:
  // möglicherweise dieselbe Einheit, die zweimal zählt (R7-N1). Die Marke steht an beiden Karten.
  const aehnlicheKarte = zaehlt
    ? koepfeJe(alle).find(
        (g) =>
          g.status === MeldeStatus.ANWESEND &&
          g.einheitSchluessel !== kopf.einheitSchluessel &&
          stammSchluessel(g.einheitSchluessel) !== stammSchluessel(kopf.einheitSchluessel) &&
          g.bogen.einheit.organisation === kopf.bogen.einheit.organisation &&
          !andererEinheitstyp(g.bogen.einheit, kopf.bogen.einheit) &&
          aehnlicherOrt(einheitOrt(g.bogen.einheit), einheitOrt(kopf.bogen.einheit)),
      )
    : undefined;
  const zielVonAufgegangen = kopf.aufgegangenIn
    ? alle.find((e) => e.einheitSchluessel === kopf.aufgegangenIn!.einheitSchluessel)
    : undefined;
  // Herkunft eines abgeteilten Teils: Name der Einheit, aus der er stammt.
  const stammt = kopf.stammtVon
    ? alle.find((e) => e.einheitSchluessel === kopf.stammtVon!.einheitSchluessel)
    : undefined;

  /** Statuswechsel mit Zeitstempel; die Ansicht bekommt den alten Stand für den Rückweg. */
  async function statusSetzen(status: MeldeStatus) {
    const zeit = Date.now();
    gesperrtBis.current = zeit + PRELLSCHUTZ_MS;
    setPrellt(true);
    tauschBis.current = zeit + Math.max(PRELLSCHUTZ_MS, ORTSSPERRE_MS);
    if (tauschBis.current > zeit) setGetauscht(status);
    ortSperren();
    ankerOben.current = wechselKnopf.current?.getBoundingClientRect().top ?? null;
    const vorher = { ...kopf };
    const ok = await gesichert(
      status === MeldeStatus.ABGERUECKT ? "Abrücken" : "Wieder anwesend",
      () => statusMitZeitSetzen(einsatzId, kopf.id, status, zeit),
    );
    if (!ok) {
      ankerOben.current = null;
      setGetauscht(null);
      return;
    }
    onStatusWechsel?.({ vorher, status, zeit });
    onGeaendert();
  }

  /**
   * Eine durch Folgemeldung zurückgeholte Einheit wieder abrücken (R5-K1) — mit
   * ihrer früheren Abrückzeit; der Verlauf bekommt den Vermerk mit der Zeit von jetzt.
   */
  async function wiederAbruecken() {
    const rueck = kopf.rueckkehr;
    if (!rueck) return;
    const zeit = Date.now();
    const vorher = { ...kopf };
    const ok = await gesichert("Wieder abrücken", () =>
      statusMitZeitSetzen(einsatzId, kopf.id, MeldeStatus.ABGERUECKT, rueck.abgerueckAm ?? zeit, zeit),
    );
    if (!ok) return;
    onStatusWechsel?.({ vorher, status: MeldeStatus.ABGERUECKT, zeit });
    onGeaendert();
  }

  async function zugSpeichern(wert?: string, offenLassen = false) {
    const ok = await gesichert("Zug zuordnen", () =>
      zugSetzen(einsatzId, kopf.einheitSchluessel, kopf.id, wert ?? zugEntwurf ?? ""),
    );
    if (!offenLassen) setZugEntwurf(null);
    if (ok) {
      if (!offenLassen) props.onHandlung?.();
      onGeaendert();
    }
  }

  /**
   * Beim Verlassen des Felds speichern — „1. Zug" getippt, kurz in die Liste
   * und zurück: das Feld war leer, die Zuordnung weg (Stress-Audit S5). Ein
   * leerer Entwurf ändert nichts; wer den Zug löschen will, drückt Speichern.
   * Der Wechsel auf Speichern/Abbrechen daneben ist kein Verlassen.
   */
  function inlineVerlassen(
    e: FocusEvent<HTMLInputElement>,
    entwurf: string | null,
    speichern: (offenLassen?: boolean) => void,
    schliessen: () => void,
  ) {
    if (e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) return;
    if (entwurf == null) return;
    // Der Fokus wandert auf einen anderen Knopf (Abrücken, Zug zuordnen …): Der Tipp ist noch nicht
    // zu Ende. Schlösse der Editor jetzt, rutschte die Knopfreihe nach oben, und der Tipp ginge ins
    // Leere (R11-W3). Also jetzt speichern, den Editor aber erst nach dem Klick schließen.
    const zuKnopf = e.relatedTarget instanceof HTMLButtonElement;
    if (zuKnopf) {
      if (entwurf.trim() !== "") speichern(true);
      nachKlickSchliessen(schliessen);
      return;
    }
    if (entwurf.trim() === "") schliessen();
    else speichern();
  }

  async function notizSpeichern(offenLassen = false) {
    const vorher = kopf.notiz ?? "";
    const nachher = (notizEntwurf ?? "").trim();
    const ok = await gesichert("Auftrag/Notiz", () => notizSetzen(einsatzId, kopf.id, notizEntwurf ?? ""));
    if (!offenLassen) setNotizEntwurf(null);
    if (ok) {
      if (!offenLassen) props.onHandlung?.();
      // Quittung mit Rückgängig, wie bei Zug und Stärke — bei aktivem Filter „ohne Auftrag" verschwindet die Karte (R15-W3).
      if (nachher !== vorher.trim()) {
        props.onAuftragGesetzt?.({ eintragId: kopf.id, name: einheitAnzeigename(kopf.bogen.einheit), nummer: props.nummer, vorher, nachher, nonce: Date.now() });
      }
      onGeaendert();
    }
  }

  /**
   * Eingetipptes, aber nicht gespeichertes Zug-Etikett oder Auftrag beim Ausblenden der Seite und beim Verlassen
   * (Neuladen, Seitenwechsel, Verwerfen durch das Betriebssystem) sichern (R11-O1): Wer auf dem Telefon einen Auftrag
   * tippt und kurz in die Funk-App wechselt, findet ihn danach wieder. Gespeichert wird, wie beim Verlassen des Feldes,
   * nur ein nicht leerer Entwurf; das Feld bleibt offen. Der Handler liest über Refs den jeweils jüngsten Stand.
   */
  const entwuerfeRef = useRef({ zug: zugEntwurf, notiz: notizEntwurf });
  entwuerfeRef.current = { zug: zugEntwurf, notiz: notizEntwurf };
  // Verschwindet die Karte mit offener Eingabe, sagt die Ansicht, was nicht gespeichert wurde (R12-O1).
  const verlorenRef = useRef(props.onEingabeVerloren);
  verlorenRef.current = props.onEingabeVerloren;
  const schluesselRef = useRef(kopf.einheitSchluessel);
  schluesselRef.current = kopf.einheitSchluessel;
  const nameRef = useRef("");
  nameRef.current = einheitAnzeigename(kopf.bogen.einheit);
  const kartenRef = useRef({ einsatzId, kopfId: kopf.id });
  kartenRef.current = { einsatzId, kopfId: kopf.id };
  useEffect(
    () => () => {
      // R13-S3: Verschwindet die Karte mit offenem Feld (Browser-Zurück, Startseite, Einsatzwechsel), wird ein nicht
      // leerer Entwurf gesichert, wie beim Neuladen; ist die Einheit weg, tut das Sichern nichts (siehe unten).
      const { zug: zugE, notiz: notizE } = entwuerfeRef.current;
      const { einsatzId: eid, kopfId } = kartenRef.current;
      try {
        if (zugE != null && zugE.trim() !== "") zugSetzen(eid, schluesselRef.current, kopfId, zugE);
        if (notizE != null && notizE.trim() !== "") notizSetzen(eid, kopfId, notizE);
      } catch {
        /* Speicher voll: Der Entwurf geht verloren; die Meldung unten gilt nur für entfernte Einheiten. */
      }
      const text = verloreneEingabeText(nameRef.current, entwuerfeRef.current);
      if (text) verlorenRef.current?.(schluesselRef.current, text);
    },
    [],
  );
  const speichernRef = useRef({ zug: zugSpeichern, notiz: notizSpeichern });
  speichernRef.current = { zug: zugSpeichern, notiz: notizSpeichern };
  useEffect(() => {
    const sichern = () => {
      const { zug, notiz } = entwuerfeRef.current;
      if (zug != null && zug.trim() !== "") void speichernRef.current.zug(undefined, true);
      if (notiz != null && notiz.trim() !== "") void speichernRef.current.notiz(true);
    };
    const beiSichtwechsel = () => {
      if (document.visibilityState === "hidden") sichern();
    };
    document.addEventListener("visibilitychange", beiSichtwechsel);
    window.addEventListener("pagehide", sichern);
    return () => {
      document.removeEventListener("visibilitychange", beiSichtwechsel);
      window.removeEventListener("pagehide", sichern);
    };
  }, []);

  /** Korrigierte Zeit übernehmen; ein leeres oder ungültiges Feld ändert nichts. */
  async function zeitSpeichern() {
    if (!zeitEntwurf) return;
    const ms = ausDatetimeLocal(zeitEntwurf.wert);
    if (ms == null) {
      setZeitEntwurf(null);
      return;
    }
    // Zukunft oder Abrücken vor Eintreffen: einmal fragen, nicht sperren (R3-E5).
    const unstimmig = zeitUnstimmigkeit(
      zeitEntwurf.feld === "eintreffen"
        ? { eintreffen: ms, abgerueckt: abgerueckt ? kopf.abgerueckAm : null }
        : { eintreffen: eintreffzeit(kopf), abgerueckt: ms },
      Date.now(),
      zeitEntwurf.feld === "eintreffen"
        ? {
            aufnahme: kopf.empfangenAm,
            zeitraumVon: zeitpunktZuMs(kopf.bogen.einsatz.zeitraumVon * MINUTEN_JE_TAG),
          }
        : undefined,
    );
    if (
      unstimmig &&
      !(await frageJaNein({
        titel: "Stimmt die Zeit?",
        text: unstimmig,
        ok: "Ja, so speichern",
        abbruch: "Zeit korrigieren",
      }))
    ) {
      return; // Das Feld bleibt offen, der Wert steht zum Korrigieren drin.
    }
    const ok = await gesichert("Zeit ändern", () =>
      zeitEntwurf.feld === "eintreffen"
        ? eintreffzeitSetzen(einsatzId, kopf.id, ms)
        : abrueckzeitSetzen(einsatzId, kopf.id, ms),
    );
    setZeitEntwurf(null);
    if (ok) {
      props.onHandlung?.();
      onGeaendert();
    }
  }

  function aufteilenAusfuehren(wahl: AufteilungsWahl, opt: AufteilungOptionen) {
    const vorher = new Set(alle.map((e) => e.id));
    // Der Zug des abgeteilten Teils in der Schreibweise der vorhandenen Züge (R10-S1).
    const zugEtikett = opt.zugEtikett ? zugNormalisiert(opt.zugEtikett, alle.map((e) => e.zugEtikett)) : opt.zugEtikett;
    const r = meldungAufteilen(einsatzId, kopf.id, wahl, { ...opt, zugEtikett });
    setAufteilen(false);
    // Nach dem Aufteilen stand die neue Karte wortlos in der Liste; dass es
    // über „Zusammenführen…" zurückgeht, sagte die App nicht (R2-D6).
    if (r) {
      props.onAufgeteilt?.({
        name: einheitAnzeigename(kopf.bogen.einheit),
        teil: r.abgeteilt.teilEtikett ?? "",
        neueIds: [r.rest.id, r.abgeteilt.id].filter((id) => !vorher.has(id)),
      });
    }
    onGeaendert();
  }

  function zusammenfuehrenAusfuehren(teilIds: string[], opt: ZusammenfuehrungOptionen) {
    // Stand vorher festhalten: Das Zusammenführen nahm Teile still aus der
    // Lage, ohne Quittung und ohne Rückweg (Audit Runde 4, R4-D5).
    const teile = alle.filter((e) => teilIds.includes(e.id));
    const vorher: ZusammenfuehrungVorher = {
      zielId: "",
      zielWarNeu: false,
      teile: teile.map((e) => ({ id: e.id, status: e.status, abgerueckAm: e.abgerueckAm })),
    };
    const bisher = new Set(alle.map((e) => e.id));
    const staerkeVorher = staerke(kopf.bogen).gesamt;
    const r = meldungenZusammenfuehren(einsatzId, kopf.id, teilIds, opt);
    setZusammenfuehren(false);
    if (r) {
      props.onZusammengefuehrt?.({
        name: einheitAnzeigename(kopf.bogen.einheit),
        staerkeVorher,
        staerkeNachher: staerke(r.ziel.bogen).gesamt,
        vorher: { ...vorher, zielId: r.ziel.id, zielWarNeu: !bisher.has(r.ziel.id) },
      });
    }
    onGeaendert();
  }

  /**
   * Einzelbogen dieser Meldung als PDF öffnen — der Blick auf genau eine
   * Einheit (und der Ausdruck fürs Klemmbrett), ohne die Sammel-PDF aller
   * Meldungen. Der Tab geht im Klick auf, noch vor dem Nachladen des
   * PDF-Satzes: erst danach geöffnet, fiele er dem Popup-Blocker zum Opfer.
   * In App und Desktop-Fenster gibt es keinen Tab — dort führt derselbe Knopf
   * zu Share-Sheet bzw. Download.
   */
  async function bogenPdf() {
    // Kein Tab mehr (R17-A2): Ein Tab mit dem PDF trug im Download-Ordner eine Zufalls-ID als Namen. Der Download hat den Namen
    // aus Einheit und Stand; der Anker mit `download` liegt in pdfmake.
    setPdfLaeuft(true);
    setPdfHinweis(null);
    try {
      // Dynamisch: pdfmake samt Schriften bleibt aus dem Start-Bundle heraus.
      const { meldungPdfAnzeigen } = await import("./pdf");
      const datei = await meldungPdfAnzeigen(kopf, null);
      // Auch hier eine Bestätigung in der App wie bei Lageblatt und Sammel-PDF (R15-A5).
      setPdfHinweis(typeof datei === "string" ? `✓ Bogen als PDF gespeichert: ${datei} (Download-Ordner).` : "✓ Bogen als PDF gespeichert (Download-Ordner).");
    } catch (e) {
      await zeigeHinweis({ titel: "Bogen als PDF", text: fehlerText(e) });
    } finally {
      setPdfLaeuft(false);
    }
  }

  /**
   * Einheit in eine andere Sammlung verschieben — die falsche Mappe erwischt
   * (Audit „Fehler und Wiederanlauf", E5). Vorher hieß der Rückweg
   * „Entfernen" und neu scannen, beim eigenen Bogen sogar PDF → Datei laden.
   * Alle Fassungen, Signatur, Zeiten und Notiz ziehen unverändert mit.
   */
  /**
   * Stärke dieser Meldung korrigieren (Papiernachtrag „ein Helfer weniger"):
   * neue Fassung mit allem Übrigen der bisherigen — Fahrzeuge, Bedarf, Namen,
   * Zug, Auftrag und Eintreffzeit bleiben (Audit Runde 3, R3-A1).
   */
  async function staerkeAendern() {
    const alt = staerke(kopf.bogen);
    const feld = (name: string, label: string, wert: string) => ({ name, label, vorgabe: wert, zahl: true });
    const zahl = (t: string | undefined) => (/^\s*\d{1,3}\s*$/.test(t ?? "") ? Number(t) : null);
    let eingabe = { fuehrer: String(alt.fuehrer), unterfuehrer: String(alt.unterfuehrer), mannschaft: String(alt.mannschaft) };
    let fehler: string | null = null;
    let f = 0;
    let u = 0;
    let m = 0;
    // Dialog, bis die Zahlen lesbar und plausibel sind: Ein Tippfehler nahm
    // vorher alle Eingaben mit und nannte das Feld nicht, ein Zahlendreher
    // ging ohne Warnung durch (Audit Runde 4, R4-E4).
    for (;;) {
      const w = await frageFelder({
        titel: "Stärke ändern",
        hinweis: (
          <>
            {fehler && <p className="fehler" role="alert">{fehler}</p>}
            <p>
              „{einheitAnzeigename(kopf.bogen.einheit)}", bisher {alt.fuehrer} / {alt.unterfuehrer} / {alt.mannschaft} / {alt.gesamt}.
              Fahrzeuge, Namen, Zug und Auftrag bleiben; verpflegt und untergebracht wird nach der neuen Stärke; die bisherige Meldung wandert in die Historie.
            </p>
          </>
        ),
        felder: [
          feld("fuehrer", "Führer", eingabe.fuehrer),
          feld("unterfuehrer", "Unterführer", eingabe.unterfuehrer),
          feld("mannschaft", "Mannschaft", eingabe.mannschaft),
        ],
        ok: "Stärke übernehmen",
        zeile: (werte) => staerkeSummeZeile(werte, alt.gesamt),
      });
      if (!w) return;
      eingabe = { fuehrer: w.fuehrer ?? "", unterfuehrer: w.unterfuehrer ?? "", mannschaft: w.mannschaft ?? "" };
      const nichtLesbar = (
        [["Führer", eingabe.fuehrer], ["Unterführer", eingabe.unterfuehrer], ["Mannschaft", eingabe.mannschaft]] as const
      )
        .filter(([, t]) => zahl(t) == null)
        .map(([name, t]) => `${name} („${t.trim() || "leer"}")`);
      if (nichtLesbar.length > 0) {
        fehler = `Bitte in jedes Feld eine ganze Zahl von 0 bis 999 eintragen — nicht lesbar: ${nichtLesbar.join(", ")}.`;
        continue;
      }
      f = zahl(eingabe.fuehrer)!;
      u = zahl(eingabe.unterfuehrer)!;
      m = zahl(eingabe.mannschaft)!;
      if (f === alt.fuehrer && u === alt.unterfuehrer && m === alt.mannschaft) return;
      // Dieselbe Warnung wie im Assistenten, dazu die neue Summe neben der alten.
      const gesamt = f + u + m;
      const warnungen = staerkePlausibilitaet({ fuehrer: f, unterfuehrer: u, mannschaft: m, gesamt });
      if (gesamt >= 20 && gesamt >= 3 * Math.max(1, alt.gesamt)) {
        warnungen.push(`Gesamt ${alt.gesamt} → ${gesamt}: mehr als das Dreifache der bisherigen Stärke — stimmt das?`);
      }
      // Die Plausibilität galt nur nach oben: 0 / 0 / 0 nahm eine Einheit mit 8
      // Personen ohne Frage aus Stärke und Verpflegung (R5-E6). Bei Null oder
      // einem Absturz auf unter ein Viertel fragt sie jetzt auch.
      if (alt.gesamt > 0 && (gesamt === 0 || (alt.gesamt >= 4 && gesamt * 4 < alt.gesamt))) {
        warnungen.push(
          `Gesamt ${alt.gesamt} → ${gesamt}: ${gesamt === 0 ? "Die Einheit zählt dann weder in der Stärke noch in der Verpflegung" : "weniger als ein Viertel der bisherigen Stärke"} — stimmt das? Ist die Einheit gar nicht mehr da, bleibt „Abrücken".`,
        );
      }
      if (warnungen.length === 0) break;
      const ja = await frageJaNein({
        titel: "Stimmt die Stärke?",
        text: (
          <>
            <p>Stärke {alt.fuehrer} / {alt.unterfuehrer} / {alt.mannschaft} / {alt.gesamt} → {f} / {u} / {m} / {gesamt}</p>
            <ul>{warnungen.map((x: string) => <li key={x}>{x}</li>)}</ul>
          </>
        ),
        ok: "Ja, so übernehmen",
        abbruch: "Zahlen korrigieren",
        fokus: "abbruch", // Enter ersetzt sonst die Zahlen (R9-D4)
      });
      if (ja) break;
      fehler = null;
    }
    const neu = nurStaerkeUebernehmen(kopf.bogen, { fuehrer: f, unterfuehrer: u, mannschaft: m, gesamt: f + u + m }, stempelZeitpunkt());
    const neueFassung: { fassung: MeldeEintrag | null } = { fassung: null };
    const ok = await gesichert("Stärke ändern", () => {
      const r = meldungAufnehmen(einsatzId, neu, { quelle: "manuell", einheitSchluesselOverride: kopf.einheitSchluessel });
      if (r?.neu) {
        neueFassung.fassung = r.eintrag;
        // Die eigene Handlung gilt, auch nach einer zurückgestellten Uhr (R5-E2).
        fassungObenauf(einsatzId, r.eintrag.id);
        angabenVermerken(einsatzId, r.eintrag.id, kopf); // das Alter der Meldung bleibt (R17-K1)
      }
    }, `Gewünscht war für „${einheitAnzeigename(kopf.bogen.einheit)}": Stärke ${f} / ${u} / ${m} / ${f + u + m} (bisher ${alt.fuehrer} / ${alt.unterfuehrer} / ${alt.mannschaft} / ${alt.gesamt}). Bitte auf dem Meldeblock notieren, Platz schaffen und noch einmal eingeben.`);
    if (!ok) return;
    if (neueFassung.fassung) {
      props.onStaerkeGeaendert?.({
        name: einheitAnzeigename(kopf.bogen.einheit),
        vorher: alt.gesamt,
        nachher: f + u + m,
        eintragId: neueFassung.fassung.id,
      });
    }
    onGeaendert();
  }

  /**
   * Eine fälschlich als „Übung" gemeldete Einheit am Meldekopf auf „Einsatzmeldung" umstellen — und umgekehrt (R14-E1).
   * Vorher half nur „Entfernen" und Neuerfassen oder eine neue Datei vom Absender; die Einheit fehlte so lange in
   * Stärke, Verpflegung und Bedarf der Lage. Wie bei „Stärke ändern…" entsteht eine neue Fassung mit allem Übrigen
   * der bisherigen (Historie, Quittung und „Rückgängig" wie dort); die Rückfrage nennt die Folge für die Summen.
   */
  async function uebungUmstellen() {
    const wirdEinsatz = !!kopf.bogen.uebung;
    const name = einheitAnzeigename(kopf.bogen.einheit);
    const personen = staerke(kopf.bogen).gesamt;
    const personenText = `${personen} ${personen === 1 ? "Person" : "Personen"}`;
    const sicher = await frageJaNein({
      titel: wirdEinsatz ? "Als Einsatzmeldung zählen?" : "Als Übung kennzeichnen?",
      text:
        `„${name}" zählt danach ${wirdEinsatz ? "in Stärke, Verpflegung und Unterbringung mit" : "dort nicht mehr mit"} (${personenText}). ` +
        "Neue Fassung in der Historie; das Alter der Meldung bleibt; „Rückgängig“ nimmt sie zurück.",
      ok: wirdEinsatz ? "Als Einsatzmeldung zählen" : "Als Übung kennzeichnen",
      fokus: "abbruch",
    });
    if (!sicher) return;
    const neu: Erfassungsbogen = JSON.parse(JSON.stringify(kopf.bogen));
    neu.uebung = !wirdEinsatz;
    // Der Stand im Bogen wird neu gestempelt, damit die Fassung eine eigene Kennung bekommt und gilt (ein Zurückstellen
    // auf die Kennzeichnung davor wäre sonst dieselbe Fassung wie die erste); angezeigt wird weiter der Stand des
    // Absenders (`standAbsender`, R17-D5).
    neu.stand = Math.max(stempelZeitpunkt(), kopf.bogen.stand);
    const neueFassung: { fassung: MeldeEintrag | null } = { fassung: null };
    const ok = await gesichert("Kennzeichnung ändern", () => {
      // Die Quelle bleibt („Aus Datei“ bleibt „Aus Datei“); nur Aufteilung und Zusammenführung sind keine Quellen einer Meldung.
      const quelle = kopf.quelle === "aufteilung" || kopf.quelle === "zusammenfuehrung" ? "manuell" : kopf.quelle;
      const r = meldungAufnehmen(einsatzId, neu, { quelle, einheitSchluesselOverride: kopf.einheitSchluessel });
      if (r?.neu) {
        neueFassung.fassung = r.eintrag;
        fassungObenauf(einsatzId, r.eintrag.id);
        angabenVermerken(einsatzId, r.eintrag.id, kopf, true); // Alter bleibt, keine Folgemeldung (R17-K1)
        standAbsenderVermerken(einsatzId, r.eintrag.id, kopf); // Anzeige-Stand bleibt der des Absenders (R17-D5)
      }
    });
    if (!ok) return;
    if (neueFassung.fassung) {
      props.onStaerkeGeaendert?.({
        name,
        vorher: personen,
        nachher: personen,
        eintragId: neueFassung.fassung.id,
        kennzeichnung: wirdEinsatz ? "einsatz" : "uebung",
      });
    }
    onGeaendert();
  }

  /** „Anderer Einsatz?" entscheiden: Der Bogen gehört zur Lage (Marke fällt weg) oder wird wieder geprüft (R17-E4). */
  async function ortGehoert(gilt: boolean) {
    const ok = await gesichert(gilt ? "Ort bestätigen" : "Wieder prüfen", () => {
      ortBilligen(einsatzId, kopf.id, gilt);
    });
    if (ok) onGeaendert();
  }

  async function verschieben() {
    const andere = einsaetzeLaden().filter((s) => s.id !== einsatzId);
    if (andere.length === 0) {
      await zeigeHinweis({ titel: "In anderen Einsatz verschieben", text: "Es gibt keine andere Einsatz-Sammlung auf diesem Gerät." });
      return;
    }
    // Die Folge steht im Dialog, nicht nur die Art klein darunter: Aus einem
    // Einsatz in eine Übung verschoben, fiel die Einheit wortlos aus der Lage
    // (Audit Runde 3, R3-E6).
    const hier = einsaetzeLaden().find((s) => s.id === einsatzId);
    const hierName = hier?.name ?? "";
    const zaehltHier = zaehlt && hier?.art === EinsatzArt.EINSATZ;
    const staerkeText = zaehltHier ? ` — die Lage „${hierName}" verliert ${staerke(kopf.bogen).gesamt} Helfer` : "";
    // Führt das Ziel diese Einheit schon (derselbe Bogen, etwa nach einer Übung
    // am Vortag), wird zusammengeführt statt ersetzt — das steht im Dialog, und
    // „Rückgängig" stellt dann auch die Einträge des Ziels wieder her (R4-E6).
    const schlHier = kopf.einheitSchluessel;
    const imZiel = (s: Einsatzsammlung) => s.eintraege.some((e) => e.einheitSchluessel === schlHier);
    const ziel = await frageWahl({
      titel: "In anderen Einsatz verschieben",
      text: `„${einheitAnzeigename(kopf.bogen.einheit)}" samt Historie, Zeiten und Auftrag aus „${hierName}" verschieben${staerkeText}. Ziel:`,
      wege: andere.map((s) => ({
        wert: s.id,
        label: s.name,
        hinweis:
          `${ART_LABEL[s.art]}${s.ort ? ` · ${s.ort}` : ""} · angelegt ${datumZweistellig(s.angelegt)}` +
          (zaehltHier && s.art !== EinsatzArt.EINSATZ ? ` — als Übung zählt die Einheit in keiner Lage mehr` : "") +
          (imZiel(s) ? " — dort schon gemeldet, wird zusammengeführt" : ""),
      })),
    });
    if (!ziel) return;
    const name = andere.find((s) => s.id === ziel)?.name ?? "";
    const schl = kopf.einheitSchluessel;
    // Stand vor dem Verschieben: die eigenen Einträge der Einheit hier und im Ziel.
    const zielVorher = einsaetzeLaden().find((s) => s.id === ziel);
    const zielEigene = structuredClone((zielVorher?.eintraege ?? []).filter((e) => e.einheitSchluessel === schl));
    const hierIds = new Set((hier?.eintraege ?? []).filter((e) => e.einheitSchluessel === schl).map((e) => e.id));
    if (await gesichert("Verschieben", () => einheitVerschieben(einsatzId, ziel, schl))) {
      onGeaendert();
      // Rückweg mit einem Tipp, wie bei Abrücken und Entfernen (R3-E6).
      const zurueck = await frageJaNein({
        titel: "Verschoben",
        text:
          `„${einheitAnzeigename(kopf.bogen.einheit)}" liegt jetzt in „${name}" und zählt nicht mehr in „${hierName}".` +
          (zielEigene.length > 0 ? ` In „${name}" war sie schon gemeldet; beide Stände sind zusammengeführt.` : ""),
        ok: `Rückgängig — zurück nach „${hierName}"`,
        abbruch: "Alles klar",
      });
      const zurueckholen = () =>
        gesichert("Verschieben rückgängig", () => {
          einheitVerschieben(ziel, einsatzId, schl);
          if (zielEigene.length > 0 && zielVorher) {
            // Was das Ziel schon vorher hatte, geht zurück ins Ziel und aus dieser
            // Sammlung wieder heraus — sonst nähme „Rückgängig" deren eigenen
            // Eintrag mit (R4-E6).
            for (const e of zielEigene) if (!hierIds.has(e.id)) meldungEntfernen(einsatzId, e.id);
            einsatzImportieren({ ...zielVorher, eintraege: zielEigene });
          }
        });
      if (zurueck) {
        if (await zurueckholen()) onGeaendert();
      } else {
        // „Alles klar" ließ im Ausgangs-Einsatz keine Spur: Die Quittung bleibt mit „Rückgängig", bis etwas Neues kommt (R14-D4).
        props.onVerschoben?.({
          name: einheitAnzeigename(kopf.bogen.einheit),
          nach: name,
          zurueck: async () => {
            if (await zurueckholen()) onGeaendert();
          },
          nonce: Date.now(),
        });
      }
    }
  }

  async function entfernen() {
    // Der Rückweg („Rückgängig") hält nur im Arbeitsspeicher: Nach dem Neuladen
    // oder Beenden der App (das Betriebssystem tut es im Hintergrund) ist die
    // Meldung endgültig weg. Das sagt die Rückfrage, samt Stand der Kopien
    // (Audit Runde 4, R4-D3).
    const ids = alle.filter((e) => e.einheitSchluessel === kopf.einheitSchluessel).map((e) => e.id);
    const kopie = letzterStandMit(einsatzId, ids);
    const verschoben = entfernenNummernText(alle, kopf.einheitSchluessel);
    const { bezug, folge: personenFolge } = entfernenBezug(alle, kopf);
    const sicher = await frageJaNein({
      titel: "Meldung entfernen?",
      text: (
        <>
          {/* Der Name steht im ersten Satz, die Folge für die Nummern gleich danach: Bei großer Schrift oder Zoom
              sah man neben dem roten Knopf nur den Anfang (R9-D5, R10-D1). Kurz gehalten, rund 40 Wörter (R10-S3).
              Nummer, Teil und Stärke unterscheiden einen abgeteilten Trupp von seiner Stammeinheit (R14-D1). */}
          <p>
            <strong>{props.nummer != null ? `Nr. ${props.nummer} ` : ""}„{einheitAnzeigename(kopf.bogen.einheit)}" ({bezug}, Stand {standText(kopf.bogen)}) entfernen</strong> — samt Historie.
          </p>
          {personenFolge && (
            <p>
              <strong>Personen:</strong> {personenFolge}
            </p>
          )}
          {verschoben && (
            <p>
              <strong>Nummern ändern sich:</strong> {verschoben}.
            </p>
          )}
          <p>
            „Rückgängig" gilt bis zum Neuladen; danach liegt die Meldung {PAPIERKORB_TAGE} Tage unter „Zuletzt entfernte Meldungen“.{" "}
            {kopie != null
              ? `Kopie: Export oder Weitergabe vom ${exportZeitKurz(kopie)}.`
              : "Noch kein Export und keine Weitergabe davon."}
          </p>
        </>
      ),
      ok: "Meldung entfernen",
      gefahr: true,
    });
    if (!sicher) return;
    // Erst geht die Zeile sichtbar ab, dann erst wird sie weggenommen: bei
    // dreißig gleich gebauten Zeilen ist sonst hinterher nicht zu sehen, ob
    // die richtige ging — und anders als eine Karte im Assistenten ist eine
    // entfernte Meldung nicht wiederherstellbar. Läuft keine Animation
    // (reduzierte Bewegung, verdeckter Tab), nimmt mitAbgang den direkten Weg.
    mitAbgang(zeile.current, () => {
      // ALLE Fassungen der Einheit, nicht nur der Kopf: sonst rückt die ältere
      // Fassung nach, die Einheit bleibt mit veralteter Stärke in der Lage und
      // die Summen steigen sogar (Audit Runde 2, R2-D1). Abgeteilte Teile haben
      // einen eigenen Schlüssel und bleiben.
      const weg = einheitEntfernen(einsatzId, kopf.einheitSchluessel);
      // Die Einträge reisen vollständig zurück an die Ansicht: Sie bietet sie
      // zum Zurückholen an, solange niemand weitergeklickt hat. Für Einsätze
      // gibt es einen Papierkorb, für die einzelne Meldung bisher nichts.
      if (weg.length > 0) onEntfernt?.({ art: "einheit", eintraege: fassungenJeEinheit(weg, kopf.einheitSchluessel), verschoben, bezug });
      onGeaendert();
    });
  }

  /**
   * Diese Fassung gilt (R4-W1) — etwa der nachgereichte Bogen statt der
   * Schnellerfassung oder die richtige von zwei Fassungen derselben Minute.
   * Nichts wird gelöscht: die bisher geltende bleibt in der Historie und
   * lässt sich dort genauso zurückholen.
   */
  async function fassungGilt(r: MeldeEintrag) {
    if (r.id === kopf.id) return;
    const sicher = await frageJaNein({
      titel: "Diese Fassung gilt?",
      text:
        `Für „${einheitAnzeigename(kopf.bogen.einheit)}" gilt dann Stand ${standText(r.bogen)} mit Stärke ${staerkeText(r.bogen)} ` +
        `(${QUELLE_LABEL[r.quelle]}) statt Stand ${standText(kopf.bogen)} mit Stärke ${staerkeText(kopf.bogen)}. ` +
        "Zug, Auftrag und Eintreffzeit bleiben; die bisherige Fassung bleibt in der Historie.",
      ok: "Diese Fassung gilt",
    });
    if (!sicher) return;
    if (await gesichert("Fassung übernehmen", () => fassungGiltSetzen(einsatzId, r.id))) onGeaendert();
  }

  /**
   * Nur eine Fassung verwerfen — etwa eine falsch aufgenommene Folgemeldung.
   * Eigener Weg mit eigener Rückfrage, die sagt, welcher Stand danach gilt;
   * „Entfernen" nimmt dagegen die ganze Einheit (Audit Runde 2, R2-D1).
   */
  async function fassungVerwerfen(r: MeldeEintrag) {
    const gueltig = revs.find((x) => x.id !== r.id);
    if (!gueltig) return;
    const istKopf = r.id === kopf.id;
    const sicher = await frageJaNein({
      titel: "Fassung verwerfen?",
      text:
        `Fassung Stand ${standText(r.bogen)} (Stärke ${staerkeText(r.bogen)}) von „${einheitAnzeigename(kopf.bogen.einheit)}" wird verworfen. ` +
        (istKopf
          ? `Gültig ist dann wieder Stand ${standText(gueltig.bogen)} mit Stärke ${staerkeText(gueltig.bogen)} — samt deren Zeiten und Auftrag.`
          : `Die aktuelle Fassung (Stand ${standText(kopf.bogen)}, Stärke ${staerkeText(kopf.bogen)}) bleibt gültig.`),
      ok: "Fassung verwerfen",
      gefahr: true,
    });
    if (!sicher) return;
    if (
      !(await gesichert("Fassung verwerfen", () => {
        meldungEntfernen(einsatzId, r.id);
        entfernteMerken(einsatzId, [r.id]); // kommt beim Import nicht still zurück (R2-D4)
      }))
    )
      return;
    onEntfernt?.({ art: "fassung", eintraege: [r] });
    onGeaendert();
  }

  return (
    <li
      ref={zeile}
      data-einheit={kopf.einheitSchluessel}
      className={`einheit-zeile${zaehlt ? "" : " gestrichen"}${zu ? " kompakt" : kompakt ? " karte-offen" : ""}`}
      // Prellschutz (R2-G4): Den zweiten Tipp eines Doppeltipps auf „Abrücken" fängt der gesperrte Wechselknopf selbst
      // (`disabled={prellt}`) und die Ortssperre an der Stelle des Tipps (tipp-schutz.ts). Die ganze Karte
      // zu sperren schluckte auch den bewussten Tipp auf „Mehr…" eine halbe Sekunde später (R17-H3).
    >
      <div className="kopfzeile">
        <div className="muster-text">
          {/* Der Name als Überschrift: Mit Vorleseprogramm springt man so von
              Einheit zu Einheit statt durch neun Knöpfe je Karte zu wischen;
              die Knöpfe verweisen über aria-describedby auf ihn, sonst stand
              in der Knopfliste 21× „Abrücken" ohne Einheit (Audit Runde 2,
              R2-M4). Der sichtbare Knopfname bleibt, wie er ist. */}
          <h3 className="muster-name" id={nameId}>
            {/* Laufende Nummer vorn — „Meldung 3" über Funk, auf Blatt und
                Gerät gleich (Audit Runde 2, R2-A6). */}
            {props.nummer != null ? <><span className="meldung-nr">Nr. {props.nummer}</span>{" "}</> : null}
            {einheitAnzeigename(kopf.bogen.einheit)}
            {/* Übungsbögen bleiben auch neben echten Meldungen unübersehbar. */}
            {kopf.bogen.uebung ? <span className="uebung-badge">ÜBUNG</span> : null}
            <AnonymBadge bogen={kopf.bogen} />
            <SignaturWarnung eintrag={kopf} />
            {/* Ohne diese Kennzeichnung stünde dieselbe Einheit nach einer
                Aufteilung zweimal gleichnamig untereinander. */}
            {kopf.teilEtikett ? <span className="teil-badge">{kopf.teilEtikett}</span> : null}
            {kopf.zugEtikett ? <span className="zug-badge"> {kopf.zugEtikett}</span> : null}
            <PapierMarke eintrag={kopf} />
            {aehnlicheKarte ? (
              <span
                className="papier-badge"
                title={`Ähnelt „${einheitAnzeigename(aehnlicheKarte.bogen.einheit)}" (gleicher Ort, Organisation und Typ nicht verschieden). Beide zählen getrennt; ist es dieselbe Einheit, die doppelte Karte unter „Mehr…" entfernen.`}
              >
                ähnelt „{einheitAnzeigename(aehnlicheKarte.bogen.einheit)}" — zählt getrennt
              </span>
            ) : null}
            {/* Was seit der Übernahme dazukam: jünger als 30 Minuten (K2). */}
            {/* Nicht „neu": dasselbe Wort hieß ein paar Zeilen darüber „seit
                dem letzten Export" — nach einem Export trugen alle Karten
                weiter „neu", während die Exportzeile „keine neuen Bögen"
                sagte (Audit Runde 2, R2-A6). */}
            {/* Auch das gebunden an die Kenntnisnahme (R4-K7). Zugeklappt am Telefon
                steht nur „neu": das lange Wort kostete eine eigene Zeile je
                Karte, die Marke war deshalb ganz ausgeblendet — eine eben
                eingetroffene Einheit fiel weniger auf als eine Folgemeldung. */}
            {zaehlt && !warAbgerueckt && (props.ungesehen || (props.frisch && istNeu(kopf))) && !neueFassung ? (
              <span className="neu-badge" title="Vor weniger als 30 Minuten eingetroffen oder seit der letzten Kenntnisnahme eingegangen — unabhängig vom Export">
                {/* „neu" bleibt auch aufgeklappt, solange der Kasten oben die Meldung als neu zählt (R14-S3). */}
                <span className="neu-lang">{props.ungesehen ? "neu · kürzlich eingetroffen" : "kürzlich eingetroffen"}</span>
                <span className="neu-kurz">neu</span>
              </span>
            ) : null}
            {neueFassung ? (
              <span className="fassung-badge" title="Folgemeldung in den letzten 30 Minuten oder noch nicht zur Kenntnis genommen">
                neue Fassung
              </span>
            ) : null}
            {/* Der Zustand als Wort statt über Deckkraft: 55 % drückten Stärke
                und Abrückzeit unter 3:1 (Audit Runde 2, R2-L5). */}
            {!zaehlt ? <span className="status-badge">{abgerueckt ? "abgerückt" : "zusammengeführt"}</span> : null}
          </h3>
          {zu ? (
            // Zugeklappt: eine Zeile mit Stärke und Bedarf — die Fragen beim
            // Gang durch den Bereitstellungsraum („wer ist da, wer braucht
            // was?"). Alles Weitere nach Antippen (R2-K7).
            // Dazu kurze Merkmale statt eigener Zeilen: Folgemeldung mit
            // Stärkeänderung, Auftrag vorhanden, offene Lücken — sonst sah der
            // Zugführer am Telefon erst nach Antippen, wer nachgemeldet hat
            // und wer noch ohne Auftrag ist (Audit Runde 3, R3-K2). Der
            // Bedarf steht dafür in der Kurzform der Tabelle.
            <span className="muster-sub kompakt-zeile">
              <span>Stärke {staerkeText(kopf.bogen)}</span>
              {zaehlt && Date.now() - angabenZeit(kopf) >= VERALTET_MIN * 60_000 && (
                <span className="kompakt-merkmal alter-merkmal warnung-text">⚠ {angabenAlterWort(kopf) === "Stand" ? "Stand " : ""}{alterText(angabenZeit(kopf), Date.now())}</span>
              )}
              {zaehlt && nurSollstaerke(kopf.bogen) && (
                <span className="kompakt-merkmal luecken-merkmal" title="Niemand hat gezählt: Die Zahl ist die Sollstärke der Vorbelegung.">
                  Sollstärke, nicht gemeldet
                </span>
              )}
              {folge && (
                <span className={`kompakt-merkmal folge-merkmal${folge.verlust ? " staerke-verlust" : ""}`} title={`Folgemeldung ${zeitLang(folge.gemeldetAm)}: ${folge.kurz}`}>
                  Folgem. {zeitKurz(folge.gemeldetAm)}
                  {folge.staerkeVorher != null ? ` · ${folge.staerkeVorher} → ${folge.staerkeNachher}` : ""}
                </span>
              )}
              {kopf.rueckkehr && zaehlt && (
                <span className="kompakt-merkmal luecken-merkmal" title={`${rueckkehrText(kopf.rueckkehr)} (durch die Folgemeldung) — zählt wieder mit`}>
                  ⚠ wieder da
                </span>
              )}
              {bedarf.map((m) => (
                <span className={m.dringend && zaehlt ? "bedarf-marke dringend" : "bedarf-marke routine"} key={m.lang} title={m.lang}>{m.kurz}</span>
              ))}
              {zaehlt && bedarfNichtErfasst(kopf.bogen) && (
                <span className="bedarf-marke routine bedarf-nicht-erfasst">Bedarf nicht erfasst</span>
              )}
              {props.fremderOrt && (
                <span className="kompakt-merkmal luecken-merkmal" title={`Bogen nennt als Ort/Auftrag: „${props.fremderOrt}“ — passt das zu dieser Lage? ${ORT_REGEL}`}>
                  ⚠ Anderer Einsatz?
                </span>
              )}
              {neuereMarke(true)}
              {nachgereicht && (
                <span className="kompakt-merkmal luecken-merkmal" title={`Bogen der Einheit (Stand ${standText(nachgereicht.bogen)}) liegt hinter der Schnellerfassung in der Historie`}>
                  ⚠ Bogen nachgereicht
                </span>
              )}
              {bemerkungNeu && (
                <span className="kompakt-merkmal bemerkung-merkmal" title={`Bemerkung der Einheit: ${bemerkung}`}>Bemerkung neu</span>
              )}
              {zeitHinweis && (
                <span className="kompakt-merkmal luecken-merkmal" title={zeitHinweis}>⚠ Zeit prüfen</span>
              )}
              {kopf.notiz && (
                <span className="kompakt-merkmal auftrag-merkmal" title={`Auftrag/Notiz: ${kopf.notiz}`}>
                  {/* Der Inhalt statt eines Hakens (R7-K6). Bis 80 Zeichen steht er ganz da (auf eigener Zeile, die
                      Befristung am Ende gehört zur Entscheidung, R8-K3); darüber „… (mehr)" und der Rest nach dem Aufklappen. */}
                  Auftrag: {kopf.notiz.length > AUFTRAG_KARTE_MAX ? `${kopf.notiz.slice(0, AUFTRAG_KARTE_MAX - 1)}… (mehr)` : kopf.notiz}
                </span>
              )}
              {zaehlt && luecken.length > 0 && (
                <span className="kompakt-merkmal luecken-merkmal" data-oeffnet="luecken" title={luecken.map((p) => p.text).join("\n")}>
                  {lueckenText(luecken.map((p) => p.text))}
                </span>
              )}
            </span>
          ) : (
          <>
          <span className="muster-sub">
            {orgLabel(kopf.bogen.einheit.organisation)} · Stärke {staerkeText(kopf.bogen)}
            {aufgegangen ? " · zusammengeführt" : ""}
            {/* Ungültig steht schon als Marke im Kopf (R3-L2). */}
            {kopf.signatur?.zustand === "gueltig" ? <> · {signaturBadge(kopf)}</> : null}
          </span>
          {/* Wen die Einheit für Rückfragen genannt hat, steht an der Karte, wo der Meldekopf zurückruft (R11-W2). */}
          {/* Die Erklärung der Marke steht im Text, nicht nur im Tooltip, den es am Telefon nicht gibt (R11-A1). */}
          {datenschutzfristAbgelaufen(kopf.bogen, datenschutzZeitpunkt()) && (
            <span className="muster-sub anonym-zeile">{ANONYM_ERKLAERUNG}</span>
          )}
          {zaehlt && Date.now() - angabenZeit(kopf) >= VERALTET_MIN * 60_000 && (
            <span className="muster-sub alter-zeile warnung-text">⚠ {angabenAlterWort(kopf)} {alterText(angabenZeit(kopf), Date.now())}</span>
          )}
          {absenderLabel(kopf.signatur?.absender) && (
            <span className="muster-sub absender-zeile">Absender: <AbsenderKontakt karte={kopf.signatur?.absender} /></span>
          )}
          {/* Die Zeiten der Führungsstelle zuerst, der Absender-Stand nur als
              Zusatz: „eingetroffen 09:40" ist die Zeile fürs Einsatztagebuch,
              „Stand 161923jul26" war die einzige Zeit und sagte nichts über
              das Eintreffen (K2). Beide Zeiten sind korrigierbar — beim
              Nachtragen vom Papier ist der Moment des Abtippens nicht der des
              Eintreffens (Analog-Audit A2). */}
          <span className="muster-sub zeiten-zeile">
            {/* Mit Datum, wie Tabelle und Lageblatt (R2-A6). */}
            eingetroffen {zeitLang(eintreffzeit(kopf))}{" "}
            <button
              aria-describedby={nameId}
              type="button"
              className="link zeit-aendern"
              onClick={() => setZeitEntwurf({ feld: "eintreffen", wert: zuDatetimeLocal(eintreffzeit(kopf)) })}
            >
              ändern
            </button>
            {abgerueckt && (
              <>
                {" · abgerückt"}
                {kopf.abgerueckAm != null ? ` ${zeitLang(kopf.abgerueckAm)}` : " (Abrückzeit nicht bestätigt)"}{" "}
                <button
                  aria-describedby={nameId}
                  type="button"
                  className="link zeit-aendern"
                  onClick={() => setZeitEntwurf({ feld: "abruecken", wert: zuDatetimeLocal(kopf.abgerueckAm ?? Date.now()) })}
                >
                  ändern
                </button>
              </>
            )}
            {" · Stand "}{zeitpunktDeutsch(standDesAbsenders(kopf))}
            {standIstAlt(kopf) && <AltBadge />}
            {" · "}{quelleText(kopf, revs)}
          </span>
          {/* Bleibt stehen, bis die Zeiten zusammenpassen — auch nach einem
              „Abrücken", das vor einer falsch nachgetragenen Eintreffzeit
              liegt (R3-E5). */}
          {zeitHinweis && <span className="muster-sub warnung-text zeit-unstimmig" role="note">⚠ {zeitHinweis}</span>}
          {/* Stand nach dem Eingang: die Uhr dieses Geräts oder die des Absenders geht falsch (R13-A3). */}
          {standLiegtNachEintreffen(kopf) && (
            <span className="muster-sub warnung-text uhr-stand" role="note">⚠ {STAND_NACH_EINTREFFEN_TEXT}</span>
          )}
          {/* Ort/Auftrag des Bogens passt nicht zur Lage (R4-K6): nicht sperren, nur zeigen. */}
          {props.fremderOrt && (
            <span className="muster-sub warnung-text fremder-ort" role="note">
              ⚠ Bogen nennt: „{props.fremderOrt}“ — passt das zu dieser Lage? {ORT_REGEL} Zählt trotzdem mit.{" "}
              <button type="button" className="link" aria-describedby={nameId} onClick={() => void ortGehoert(true)}>
                Gehört zu dieser Lage
              </button>
            </span>
          )}
          {/* Die Entscheidung des Meldekopfs bleibt sichtbar, bis sie zurückgenommen wird (R17-E4). */}
          {!props.fremderOrt && ortIstGebilligt(kopf, revs) && (
            <span className="muster-sub hinweis ort-gebilligt" role="note">
              Ort/Auftrag „{(kopf.bogen.einsatz.ortAuftrag ?? "").trim()}“ vom Meldekopf als zur Lage gehörig bestätigt.{" "}
              <button type="button" className="link" aria-describedby={nameId} onClick={() => void ortGehoert(false)}>
                Wieder prüfen
              </button>
            </span>
          )}
          {/* Nachgereichter Bogen hinter der Schnellerfassung (R4-W1). */}
          {nachgereicht && (
            <span className="muster-sub warnung-text bogen-nachgereicht" role="note">
              ⚠ Bogen der Einheit nachgereicht (Stand {standText(nachgereicht.bogen)}, Stärke {staerkeText(nachgereicht.bogen)}) — es gilt
              noch die Schnellerfassung.{" "}
              <button type="button" className="link" aria-describedby={nameId} onClick={() => void fassungGilt(nachgereicht)}>
                Bogen übernehmen
              </button>
            </span>
          )}
          {/* Später eingetroffene Meldung mit älterem Stand liegt nur in der Historie (R15-E2). */}
          {neuereMarke(false)}
          {/* Sofortbedarf nur, wenn gesetzt — nichts alarmiert, was leer ist (K1). */}
          {bedarf.length > 0 && (
            <span className="muster-sub bedarf-zeile">
              {bedarf.map((m) => (
                // Dringendes kräftig, Kraftstoff als ruhige Routine-Marke
                // (Audit Runde 2, R2-K4).
                // An einer abgerückten oder zusammengeführten Einheit grau:
                // gezählt wird ihr Bedarf nicht, gelb zog er trotzdem den
                // Blick (Audit Runde 3, R3-K7).
                <span className={m.dringend && zaehlt ? "bedarf-marke dringend" : "bedarf-marke routine"} key={m.lang}>{m.lang}</span>
              ))}
            </span>
          )}
          {zaehlt && bedarfNichtErfasst(kopf.bogen) && (
            <span className="muster-sub bedarf-zeile">
              <span className="bedarf-marke routine bedarf-nicht-erfasst">Bedarf nicht erfasst</span>
            </span>
          )}
          {/* Nur Sollplätze, niemand gezählt: als solche kennzeichnen, nicht als
              gewöhnliche Lücke (Audit Runde 2, R2-E2). */}
          {nurSollstaerke(kopf.bogen) && (
            <span className="muster-sub">
              <span className="bedarf-marke">Sollstärke, nicht gemeldet</span>
            </span>
          )}
          {/* Stärke 0: zwischen lauter echten Zahlen fiel „0 / 0 / 0 / 0"
              nicht auf (Audit Runde 3, R3-N1). */}
          {!nurSollstaerke(kopf.bogen) && staerke(kopf.bogen).gesamt === 0 && (
            <span className="muster-sub">
              <span className="staerke-fehlt">Stärke fehlt</span>
            </span>
          )}
          {kopf.notiz && (
            <span className="muster-sub auftrag-notiz">
              Auftrag/Notiz: {kopf.notiz}
            </span>
          )}
          {/* Was die Einheit selbst dazuschreibt, steht dort, wo die Lage
              gelesen wird — „Ölsperre verbraucht, Nachschub nötig" stand nur
              unter „Details" (Audit Runde 3, R3-K3). Lange Texte gekürzt, auf
              Tipp ganz. */}
          {bemerkung && (
            <span className={`muster-sub bemerkung${bemerkungNeu ? " bemerkung-neu" : ""}`}>
              {bemerkungNeu ? "Bemerkung der Einheit (neu): " : "Bemerkung der Einheit: "}
              {bemerkungGanz || bemerkung.length <= BEMERKUNG_KURZ ? bemerkung : `${bemerkung.slice(0, BEMERKUNG_KURZ).trimEnd()} …`}
              {bemerkung.length > BEMERKUNG_KURZ && (
                <>
                  {" "}
                  <button
                    type="button"
                    className="link zeit-aendern"
                    aria-describedby={nameId}
                    aria-expanded={bemerkungGanz}
                    onClick={() => setBemerkungGanz(!bemerkungGanz)}
                  >
                    {bemerkungGanz ? "kürzer" : "ganz zeigen"}
                  </button>
                </>
              )}
            </span>
          )}
          {luecken.length > 0 && (
            <span className="muster-sub">
              <button
                aria-describedby={nameId}
                type="button"
                className="link luecken-marke"
                aria-expanded={lueckenOffen}
                title={luecken.map((p) => p.text).join("\n")}
                onClick={() => setLueckenOffen(!lueckenOffen)}
              >
                {/* Der Inhalt statt „1 Lücke" (R3-K7). */}
                Hinweise: {lueckenText(luecken.map((p) => p.text))}
              </button>
            </span>
          )}
          {qualiPersonen.length > 0 && (
            <span className="muster-sub quali-treffer">
              {qualiPersonen.length}× {qualifikationKurz}:{" "}
              {qualiPersonen
                .map((p) => [p.vorname, p.nachname].filter((t) => t.trim() !== "").join(" ").trim() || "(ohne Namen)")
                .join(", ")}
            </span>
          )}
          {/* Folgemeldung: die Veränderung gehört in die Zeile, nicht erst hinter
              einen Klick — sie ist die Information der Schichtübergabe. */}
          {folge && vorige ? (
            // Wann die Folgemeldung kam, steht vorn: „seit Stand …" stand
            // dauerhaft an jeder nachgemeldeten Einheit, ob die Änderung eine
            // Minute oder sechs Stunden alt war (R3-K1).
            <span className="muster-sub diff-kurz">
              Folgemeldung {zeitLang(folge.gemeldetAm)} (vorher Stand {standText(vorige.bogen)}):{" "}
              <span className={folge.verlust ? "staerke-verlust" : undefined}>{folge.kurz}</span>
            </span>
          ) : kurz && vorige ? (
            <span className="muster-sub diff-kurz">
              seit {standText(vorige.bogen)}: {kurz}
            </span>
          ) : null}
          {/* Die Folgemeldung hat die Einheit aus „abgerückt" zurückgeholt (R5-K1). */}
          {kopf.rueckkehr && zaehlt && (
            <span className="muster-sub warnung-text rueckkehr" role="note">
              ⚠ {rueckkehrText(kopf.rueckkehr)} (durch die Folgemeldung) — zählt wieder mit.{" "}
              <button type="button" className="link" aria-describedby={nameId} onClick={() => void wiederAbruecken()}>
                Wieder abrücken
              </button>
            </span>
          )}
          {kopf.aufgegangenIn && (
            <span className="muster-sub">
              aufgegangen in{" "}
              {zielVonAufgegangen ? einheitAnzeigename(zielVonAufgegangen.bogen.einheit) : "eine andere Meldung"}
              {zielVonAufgegangen?.teilEtikett ? ` (${zielVonAufgegangen.teilEtikett})` : ""}
              {" am "}
              {new Date(kopf.aufgegangenIn.zusammengefuehrtAm).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {kopf.stammtVon && (
            <span className="muster-sub">
              abgeteilt aus {stammt ? einheitAnzeigename(stammt.bogen.einheit) : "einer Meldung"}
              {kopf.stammtVon.teilEtikett ? ` (${kopf.stammtVon.teilEtikett})` : ""}
              {" am "}
              {new Date(kopf.stammtVon.abgeteiltAm).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          </>
          )}
        </div>
      </div>
      {zu && (
        // Die ganze Zeile ist das Tippziel; der Knopf liegt über ihr (siehe
        // .karte-aufklappen in index.html) und trägt den Namen als Bezug.
        <button
          type="button"
          className="karte-aufklappen"
          aria-expanded={false}
          aria-describedby={nameId}
          onClick={(e) => {
            // Der Knopf liegt über der ganzen Zeile. Traf der Tipp die Rückfrage-
            // Marke, zeigt die aufgeklappte Karte die Hinweise gleich im Satz:
            // vorher klappte der erste Tipp nur auf, und der Hinweis stand dort
            // erneut gekürzt, erst ein zweiter Tipp zeigte ihn ganz (R4-N4).
            // Tastatur und Vorlesesoftware (detail 0) klappen nur auf.
            const unter = e.detail > 0 && typeof document.elementsFromPoint === "function" ? document.elementsFromPoint(e.clientX, e.clientY) : [];
            if (unter.some((el) => el instanceof HTMLElement && el.dataset.oeffnet === "luecken")) setLueckenOffen(true);
            setAufgeklappt(true);
          }}
        >
          <span className="nur-sr">Aufklappen: Zeiten, Details und Aktionen</span>
          <span aria-hidden="true">▾</span>
        </button>
      )}
      {!zu && (
      <>
      <div className="vorlage-aktionen">
        {kompakt && (
          <>
            <button type="button" aria-describedby={nameId} aria-expanded={true} onClick={() => setAufgeklappt(false)}>
              Zuklappen
            </button>{" "}
          </>
        )}
        <button type="button" aria-describedby={nameId} onClick={() => setDetails(!details)}>
          {details ? "Details schließen" : "Details"}
        </button>{" "}
        <button
          aria-describedby={nameId}
          type="button"
          onClick={bogenPdf}
          disabled={pdfLaeuft}
          title="Bogen dieser Einheit als PDF — im Browser in einem neuen Tab."
        >
          {pdfLaeuft ? "Bogen wird erzeugt…" : "Bogen als PDF"}
        </button>{" "}
        {vorige && (
          <>
            <button type="button" aria-describedby={nameId} onClick={() => setAenderungen(!aenderungen)}>
              {aenderungen ? "Änderungen schließen" : "Änderungen"}
            </button>{" "}
          </>
        )}
        {/* „Abrücken" und sein Gegenknopf „Wieder anwesend" teilen sich einen
            Platz. Stand der Gegenknopf abgesetzt vor „Entfernen" (D4), rückten
            alle Knöpfe nach dem Abrücken um: unter dem Finger lag dann „Zug
            ändern", und ein Doppeltipp öffnete den Zug-Editor mit Tastatur
            (Audit Runde 2, R2-G4). Unter dem Finger liegt nach dem Tipp
            zuerst die Bestätigung („✓ Abgerückt"), gesperrt für
            ORTSSPERRE_MS, erst danach der Rückweg (R3-S5). */}
        {getauscht != null ? (
          <>
            {/* Ein Knopf, kein Text: So bleibt die Knopfreihe stehen. */}
            <button type="button" ref={wechselKnopf} aria-describedby={nameId} disabled className="wechsel-knopf wechsel-quittiert" title="Bestätigung, kein Knopf — gleich folgt „Wieder anwesend“, falls es ein Versehen war.">
              {getauscht === MeldeStatus.ABGERUECKT ? "✓ Abgerückt" : "✓ Anwesend"}
            </button>{" "}
          </>
        ) : zaehlt ? (
          <>
            <button type="button" ref={wechselKnopf} className="wechsel-knopf" aria-describedby={nameId} disabled={prellt} onClick={() => void statusSetzen(MeldeStatus.ABGERUECKT)}>
              Abrücken
            </button>{" "}
          </>
        ) : (
          <>
            <button type="button" ref={wechselKnopf} className="wechsel-knopf" aria-describedby={nameId} disabled={prellt} onClick={() => void statusSetzen(MeldeStatus.ANWESEND)}>
              Wieder anwesend
            </button>{" "}
          </>
        )}
        <button type="button" aria-describedby={nameId} onClick={() => setZugEntwurf(kopf.zugEtikett ?? "")}>
          {kopf.zugEtikett ? "Zug ändern" : "Zug zuordnen"}
        </button>{" "}
        <button type="button" aria-describedby={nameId} onClick={() => setNotizEntwurf(kopf.notiz ?? "")}>
          {kopf.notiz ? "Auftrag ändern" : "Auftrag/Notiz"}
        </button>{" "}
        {/* Die seltenen, folgenschweren Aktionen hinter „Mehr…": neun Knöpfe
            je Karte machten sie rund 450 px hoch, und beim Scrollen lag
            „Entfernen" überall unter dem Daumen (Audit Runde 2, R2-H9). Ein
            offenes Aufteilen/Zusammenführen hält die Reihe offen. */}
        <button
          type="button"
          aria-describedby={nameId}
          aria-expanded={mehrOffen}
          className="karte-mehr-knopf"
          onClick={() => {
            setMehr(!mehrOffen);
            if (mehrOffen) {
              setAufteilen(false);
              setZusammenfuehren(false);
            }
          }}
        >
          {mehrOffen ? "Weniger" : "Mehr…"}
        </button>
        {/* „Historie" steht hinter „Mehr…" (R12-G3): Sie erscheint erst, wenn die Karte einen Vermerk trägt (nach „Abrücken"),
            und schob als Nachbar „Mehr…" um eine Knopfbreite nach rechts. */}
        {(revs.length > 1 || vermerke.length > 0) && (
          <>
            {" "}
            <button type="button" aria-describedby={nameId} onClick={() => setHistorie(!historie)}>
              {historie ? "Historie schließen" : revs.length > 1 ? `Historie (${revs.length})` : "Historie"}
            </button>
          </>
        )}
      </div>
      {pdfHinweis && <p className="hinweis" role="status">{pdfHinweis}</p>}
      {mehrOffen && (
        <div className="vorlage-aktionen karte-mehr">
          {zaehlt && (
            <>
              <button type="button" aria-describedby={nameId} onClick={() => setAufteilen(!aufteilen)}>
                {aufteilen ? "Aufteilen schließen" : "Aufteilen…"}
              </button>{" "}
            </>
          )}
          {/* Nur anbieten, wenn es überhaupt einen anderen Teil zum Eingliedern gibt. */}
          {zaehlt && geschwister.length > 0 && (
            <>
              <button type="button" aria-describedby={nameId} onClick={() => setZusammenfuehren(!zusammenfuehren)}>
                {zusammenfuehren ? "Zusammenführen schließen" : "Zusammenführen…"}
              </button>{" "}
            </>
          )}
          {zaehlt && (
            <>
              <button type="button" aria-describedby={nameId} onClick={() => void staerkeAendern()}>Stärke ändern…</button>{" "}
              <button type="button" aria-describedby={nameId} onClick={() => void uebungUmstellen()}>
                {kopf.bogen.uebung ? "Als Einsatzmeldung zählen…" : "Als Übung kennzeichnen…"}
              </button>{" "}
            </>
          )}
          <button type="button" aria-describedby={nameId} onClick={() => void verschieben()}>Verschieben…</button>{" "}
          <button type="button" aria-describedby={nameId} className="entfernen" onClick={entfernen}>Entfernen</button>
        </div>
      )}
      {lueckenOffen && luecken.length > 0 && (
        <ul className="luecken-liste">
          {luecken.map((p) => (
            <li key={p.text}>{p.text}</li>
          ))}
        </ul>
      )}
      {aenderungen && vorige && <Aenderungen vorher={vorige.bogen} nachher={kopf.bogen} />}
      {details && <BogenDetails bogen={kopf.bogen} absender={absenderLabel(kopf.signatur?.absender)} absenderKarte={kopf.signatur?.absender} />}
      {zusammenfuehren && geschwister.length > 0 && (
        <ZusammenfuehrenPanel
          ziel={kopf}
          teile={geschwister}
          onAbbrechen={() => setZusammenfuehren(false)}
          onZusammenfuehren={zusammenfuehrenAusfuehren}
        />
      )}
      {aufteilen && (
        <AufteilenPanel
          eintrag={kopf}
          onAbbrechen={() => setAufteilen(false)}
          onAufteilen={aufteilenAusfuehren}
        />
      )}
      {zugEntwurf !== null && (
        <div className="zug-bearbeiten">
          {/* Schon vergebene Züge als Auswahl; die Eingabe wird gegen sie abgeglichen („1.Zug" = „1. Zug", R7-K4). */}
          <datalist id={zugListeId}>
            {vorhandeneZuege(alle.map((e) => e.zugEtikett)).map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
          {vorhandeneZuege(alle.map((e) => e.zugEtikett)).length > 0 && (
            <div className="zug-vorschlaege" role="group" aria-label="Schon vergebene Züge">
              {vorhandeneZuege(alle.map((e) => e.zugEtikett)).map((z) => (
                <button key={z} type="button" aria-describedby={nameId} onClick={() => void zugSpeichern(z)}>
                  {z}
                </button>
              ))}{" "}
            </div>
          )}
          <input
            type="text"
            value={zugEntwurf}
            placeholder="z. B. 2. Zug"
            aria-label="Zug"
            list={zugListeId}
            {...NAMEN_EINGABE}
            autoFocus
            onChange={(e) => setZugEntwurf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void zugSpeichern();
              if (e.key === "Escape") setZugEntwurf(null);
            }}
            onBlur={(e) => inlineVerlassen(e, zugEntwurf, (offen) => void zugSpeichern(undefined, offen), () => setZugEntwurf(null))}
          />{" "}
          <button type="button" aria-describedby={nameId} className="primaer" onClick={() => void zugSpeichern()}>Speichern</button>{" "}
          <button type="button" aria-describedby={nameId} onClick={() => setZugEntwurf(null)}>Abbrechen</button>
        </div>
      )}
      {notizEntwurf !== null && (
        <div className="zug-bearbeiten notiz-bearbeiten">
          <input
            type="text"
            value={notizEntwurf}
            placeholder="z. B. Deichabschnitt Nord ab 14:00"
            aria-label="Auftrag/Notiz"
            {...NAMEN_EINGABE}
            autoFocus
            onChange={(e) => setNotizEntwurf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void notizSpeichern();
              if (e.key === "Escape") setNotizEntwurf(null);
            }}
            onBlur={(e) => inlineVerlassen(e, notizEntwurf, (offen) => void notizSpeichern(offen), () => setNotizEntwurf(null))}
          />{" "}
          <button type="button" aria-describedby={nameId} className="primaer" onClick={() => void notizSpeichern()}>Speichern</button>{" "}
          <button type="button" aria-describedby={nameId} onClick={() => setNotizEntwurf(null)}>Abbrechen</button>
        </div>
      )}
      {zeitEntwurf !== null && (
        <div className="zug-bearbeiten zeit-bearbeiten">
          <label className="feld">
            {zeitEntwurf.feld === "eintreffen" ? "Eingetroffen am" : "Abgerückt am"}
            <input
              type="datetime-local"
              value={zeitEntwurf.wert}
              autoFocus
              onChange={(e) => setZeitEntwurf({ ...zeitEntwurf, wert: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") void zeitSpeichern();
                if (e.key === "Escape") setZeitEntwurf(null);
              }}
            />
          </label>{" "}
          <button type="button" aria-describedby={nameId} className="primaer" onClick={() => void zeitSpeichern()}>Speichern</button>{" "}
          <button type="button" aria-describedby={nameId} onClick={() => setZeitEntwurf(null)}>Abbrechen</button>
        </div>
      )}
      {historie && revs.length > 1 && (
        <ul className="historie">
          {revs.map((r, i) => (
            <HistorieZeile
              key={r.id}
              eintrag={r}
              vorheriger={revs[i + 1]}
              aktuell={i === 0}
              verdraengt={istVerdraengt(r, revs)}
              onVerwerfen={() => void fassungVerwerfen(r)}
              onGilt={i === 0 ? undefined : () => void fassungGilt(r)}
            />
          ))}
        </ul>
      )}
      {/* Verlauf der Führungsstelle: Zug, Auftrag, Zeitkorrektur, Abrücken
          mit Uhrzeit — für Einsatztagebuch und Übergabe (Audit Runde 2, R2-K6). */}
      {historie && vermerke.length > 0 && (
        <>
          <p className="hinweis"><strong>Vermerke der Führungsstelle</strong></p>
          <ul className="historie fuehrungs-vermerke">
            {vermerke.map((v, i) => (
              <li key={i}>{zeitKurz(v.zeit)} {v.text}</li>
            ))}
          </ul>
        </>
      )}
      </>
      )}
    </li>
  );
}
