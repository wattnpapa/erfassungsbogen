/**
 * Schritt 3 — Personal: Detail-Karten, Schnelleingabe-Tabelle, Namens-Import
 * und die Meldekopf-Schnellerfassung (nur Stärke).
 */

import { Fragment, Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { DaumenQuittung } from "../daumen-quittung";
import { ortSperren } from "../tipp-schutz";
import { useZahlQuittung } from "../quittung";
import { mitAbgang, useEinzugsstempel } from "../eintrag-bewegung";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  Kontakt,
  KontaktArt,
  OrganisationsTyp,
  Einheit,
  type Erfassungsbogen,
  Person,
  PersonalErfassung,
  StaerkeRolle,
  type VokabularWert,
  alleFahrerlaubnisse,
  staerke,
  unterbringungMWD,
  verpflegung,
} from "@bos/eeb-format/model";
import { berufText, qualifikationenUndBerufe, zusatzqualifikationenAus } from "../beruf";
import { SOLL_NICHT_GEMELDET } from "../soll-text";
import { stanPersonalVorbelegung } from "@bos/vokabulare/thw-stan-personal";
import { haeufigeFunktionen } from "../haeufige-funktionen";
import {
  FE_TEXT,
  neuePerson,
  personBezeichnung,
  personLeer,
  personUnbenannt,
  pruefpunkte,
  verpflegungMitziehen,
  verschoben,
  vokabText,
  vokabularFuer,
  vorbelegungGeladen,
} from "../hilfen";
import { mwdText } from "../auswertung";
import { frageJaNein, frageWahl } from "../dialoge";
import { TelefonFeld } from "./telefon-feld";
import { nachzueglerFuer } from "../vorlage-nachzuegler";
import { TabellenScroll } from "../tabellen-scroll";
import {
  Feld,
  FREMDE_DATEN,
  NAMEN_EINGABE,
  Auswahl,
  Hinweise,
  MWD_LEGENDE,
  STAERKE_LEGENDE,
  Stepper,
  ZahlFeld,
  VokabListe,
  type FreitextVorschlag,
  staerkeVorlesen,
  type SchrittProps,
} from "./bausteine";
import { OvVorschlagFeld, useOvDaten } from "./einheit";
import type { ThwOrtsverband } from "@bos/vokabulare/thw-ov";

// Inhalt des Fensters „Namen einfügen…": Zerleger, Vorschau und Beispielnamen laden nach und bleiben aus dem Startbündel.
const NamenInhalt = lazy(() => import("./namen-dialog"));

/** Rollen-Beschriftung für die Einfüge-Vorschau — dieselben Wörter wie im Auswahlfeld. */
export const ROLLE_LABEL: Record<StaerkeRolle, string> = {
  [StaerkeRolle.FUEHRER]: "Führer/in",
  [StaerkeRolle.UNTERFUEHRER]: "Unterführer/in",
  [StaerkeRolle.MANNSCHAFT]: "Mannschaft",
};

// Die Berufsliste (3512 Bezeichnungen, ~145 KB Quelldaten) hängt nicht im
// Start-Bundle: sie wird erst gebraucht, wenn jemand Personal im Detail erfasst.
// Dasselbe gilt für die DLRG-Ausbildungskennzahlen, die nur eine von zwölf
// Organisationen betreffen. Einmal geladen bleibt das Modul im Cache, der
// useState-Startwert greift dann sofort — ohne Nachlade-Flackern.
let berufeCache: readonly FreitextVorschlag[] | null = null;
let dlrgQualiCache: readonly FreitextVorschlag[] | null = null;

/**
 * Tipphilfe für die weiteren Qualifikationen: bei der DLRG deren
 * Ausbildungskennzahlen (401, 715, 1011 …), sonst nichts — beim THW gehören
 * hier nur Qualifikationen aus THWin hinein, die als Freitext kommen. Die
 * Berufe standen früher mit in dieser Liste; sie haben jetzt ein eigenes Feld
 * (useBerufVorschlaege), weil ein Meldekopf „Elektroniker/in" nicht neben
 * „Sprechfunk" lesen will (Rückmeldung aus einem THW-Ortsverband).
 */
function useQualiVorschlaege(aktiv: boolean, org: OrganisationsTyp): readonly FreitextVorschlag[] {
  const dlrg = org === OrganisationsTyp.DLRG;
  const [dlrgQuali, setDlrgQuali] = useState(dlrgQualiCache);
  useEffect(() => {
    if (!aktiv || !dlrg || dlrgQuali) return;
    void import("@bos/vokabulare/dlrg-qualifikationen").then((m) => {
      dlrgQualiCache = m.DLRG_QUALIFIKATIONEN;
      setDlrgQuali(dlrgQualiCache);
    });
  }, [aktiv, dlrg, dlrgQuali]);
  return useMemo(() => (dlrg ? (dlrgQuali ?? []) : []), [dlrg, dlrgQuali]);
}

/** Tipphilfe für das Berufsfeld: die Berufsbezeichnungen aus KldB und BERUFENET, für alle Organisationen. */
function useBerufVorschlaege(aktiv: boolean): readonly FreitextVorschlag[] {
  const [berufe, setBerufe] = useState(berufeCache);
  useEffect(() => {
    if (!aktiv || berufe) return;
    void import("@bos/vokabulare/berufe").then((m) => {
      berufeCache = m.BERUFE;
      setBerufe(berufeCache);
    });
  }, [aktiv, berufe]);
  return berufe ?? [];
}

/**
 * Satz für die Rückfrage beim Entfernen der ERSTEN Person (R11-D3): Sie ist die Ansprechperson, bei ihr fragt der
 * Meldekopf nach. Nennt, wer danach an ihre Stelle rückt und ob der Bogen dann noch eine Rückrufnummer trägt.
 */
export function ansprechWechselSatz(personal: Person[]): string {
  const kopf = "Sie ist die Ansprechperson (erste Person der Liste) — bei ihr fragt der Meldekopf nach.";
  const naechste = personal[1];
  if (!naechste) return `${kopf} Danach gibt es keine Ansprechperson und keine Rückrufnummer auf dem Bogen.`;
  const hatNummer = naechste.kontakte.some((k) => (k.wert ?? "").trim() !== "");
  return `${kopf} Danach gilt ${personBezeichnung(naechste, 1)} als Ansprechperson${
    hatNummer ? " (mit Erreichbarkeit)." : " — OHNE Erreichbarkeit: der Bogen hätte dann keine Rückrufnummer."
  }`;
}

function KontakteEditor(props: { kontakte: Kontakt[]; aendern: (k: Kontakt[]) => void }) {
  const { kontakte, aendern } = props;
  const set = (i: number, p: Partial<Kontakt>) => aendern(kontakte.map((k, j) => (j === i ? { ...k, ...p } : k)));
  return (
    <div className="kontakte">
      {kontakte.map((k, i) => (
        <div className="zeile" key={i}>
          <Feld titel="Art" schmal>
            <Auswahl
              value={k.art}
              onChange={async (e) => {
                const neu = Number(e.target.value);
                const wert = k.wert?.trim() ?? "";
                const vonOderNachEmail = (k.art === KontaktArt.EMAIL) !== (neu === KontaktArt.EMAIL);
                // Mobil ↔ Festnetz ist nur eine Beschriftung: die Nummer bleibt (R11-E2).
                if (!vonOderNachEmail || !wert) {
                  set(i, { art: neu, ...(vonOderNachEmail ? { emailTemplate: undefined, wert: "" } : {}) });
                  return;
                }
                // Von oder nach E-Mail passt der Wert nicht mehr zum Feld: nicht still leeren (R11-E2).
                if (
                  await frageJaNein({
                    titel: `Art ändern — ${k.art === KontaktArt.EMAIL ? "Adresse" : "Nummer"} ${wert} geht verloren?`,
                    text: `Die ${k.art === KontaktArt.EMAIL ? "Adresse" : "Nummer"} ${wert} passt nicht zur Art „${
                      neu === KontaktArt.EMAIL ? "E-Mail" : neu === KontaktArt.FESTNETZ ? "Festnetz" : "Mobil"
                    }“ und wird aus dem Feld entfernt. Die Zeile bleibt, das Feld ist danach leer.`,
                    ok: "Art ändern, Wert entfernen",
                    abbruch: "Art behalten",
                    gefahr: true,
                    fokus: "abbruch",
                  })
                ) {
                  set(i, { art: neu, emailTemplate: undefined, wert: "" });
                }
              }}
            >
              <option value={KontaktArt.MOBIL}>Mobil</option>
              <option value={KontaktArt.FESTNETZ}>Festnetz</option>
              <option value={KontaktArt.EMAIL}>E-Mail</option>
            </Auswahl>
          </Feld>
          <Feld titel={k.art === KontaktArt.EMAIL ? "Adresse" : "Nummer"}>
            {/* Tastatur nach Kontaktart: Ziffernblock für Mobil/Festnetz,
                E-Mail-Tastatur für die Adresse. Dieselbe Regel wie bei den
                Kontaktstellen der Einheit — das hier ist die Nummer, über die
                die Gegenstelle zurückfragt. */}
            {k.art === KontaktArt.EMAIL ? (
              <input
                type="email"
                inputMode="email"
                {...FREMDE_DATEN}
                value={k.wert ?? ""}
                onChange={(e) => set(i, { emailTemplate: undefined, wert: e.target.value })}
              />
            ) : (
              // Führendes „+" bleibt, entfernte Zeichen und eine zweite Nummer werden genannt (R11-E3).
              <TelefonFeld wert={k.wert} setzen={(wert) => set(i, { emailTemplate: undefined, wert })} />
            )}
          </Feld>
          <label className="inline">
            <input type="checkbox" checked={k.dienstlich} onChange={(e) => set(i, { dienstlich: e.target.checked })} />
            dienstlich
          </label>
          {/* Rückfrage-Regel: die Rufnummer ist die Angabe, über die der
              Meldekopf zurückruft — sie verschwindet nicht durch einen
              Fehlgriff. Eine leere Zeile geht ohne Dialog. */}
          <button
            type="button"
            aria-label={`Erreichbarkeit ${k.wert?.trim() || `${i + 1} (leer)`} entfernen`}
            onClick={async () => {
              const wert = k.wert?.trim() ?? "";
              if (
                wert &&
                !(await frageJaNein({
                  titel: `Erreichbarkeit ${wert} entfernen?`,
                  text: `Die ${k.art === KontaktArt.EMAIL ? "Adresse" : "Nummer"} ${wert} wird aus dem Bogen entfernt.`,
                  ok: "Erreichbarkeit entfernen",
                  gefahr: true,
                }))
              ) {
                return;
              }
              aendern(kontakte.filter((_, j) => j !== i));
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => aendern([...kontakte, { art: KontaktArt.MOBIL, dienstlich: false, wert: "" }])}>
        {kontakte.length > 0 ? "+ Kontakt" : "+ Erreichbarkeit"}
      </button>
    </div>
  );
}

/**
 * Wer „Kraftfahrer" als Funktion sucht, findet nur die ADR-Zusätze — die
 * Funktionsliste führt den reinen Kraftfahrer absichtlich nicht, weil die
 * Fahrerlaubnisklasse im eigenen Feld steht und dort schon „Kf" bedeutet (so
 * zählt sie der Meldekopf-Filter, so steht sie im PDF). Aus der Rückmeldung
 * eines Ortsverbands: „habe nur Kraftfahrer mit ADR gefunden, das hat bei uns
 * nur einer". Der Hinweis erscheint genau bei dieser Suche und zeigt den Weg;
 * er greift auch bei „Fahrer", „Führerschein", „Fahrerlaubnis" und „Lkw".
 */
export function kraftfahrerHinweis(suche: string): string | undefined {
  const s = suche.trim().toLowerCase();
  if (!/^kf\b|kraftfahr|fahrer|führerschein|fuehrerschein|\blkw\b/.test(s)) return undefined;
  return `Kraftfahrer/in ohne Gefahrgut: die Klasse im Feld „Fahrerlaubnis" dieser Person eintragen — das gilt am Meldekopf als Kf. Hier stehen nur die ADR-Zusätze.`;
}

/**
 * Fahrerlaubnis mit Mehrfachauswahl: die erste Klasse wie bisher (inkl. „—"),
 * dahinter je weiterer Klasse eine eigene Auswahl mit ✕ und ein „+"-Knopf.
 * Nötig, weil sich nicht alle Klassen gegenseitig einschließen — CE deckt BE
 * ab, aber B + A (Pkw und Krad) sind nur als zwei Einträge abbildbar.
 */
/**
 * Dienststelle der Person (THW: Ortsverband). Vorbelegt mit der Dienststelle
 * der Einheit aus Schritt 1 — Hoya: eine Einheit aus Helfern mehrerer OVs, und
 * nur wer aus einem ANDEREN OV kommt, trägt hier etwas ein. Gespeichert wird
 * deshalb nur die Abweichung (`Person.dienststelle`); ein Feld, das die
 * Dienststelle der Einheit zeigt oder leer ist, lässt das Modell unberührt,
 * und ein Wechsel des OV in Schritt 1 zieht die unveränderten Personen mit.
 * Während des Tippens hält ein Entwurf das Feld, sonst spränge es beim Leeren
 * sofort auf die Vorbelegung zurück.
 */
/** Nur die Abweichung von der Dienststelle der Einheit zählt; leer oder gleich heißt „wie die Einheit". */
function abweichendeDienststelle(wert: string, einheitsDienststelle: string): string | undefined {
  const w = wert.trim();
  return w && w !== einheitsDienststelle.trim() ? wert : undefined;
}

function DienststelleFeld(props: {
  person: Person;
  set: (patch: Partial<Person>) => void;
  einheitsDienststelle: string;
  index: number;
  org: OrganisationsTyp;
  /** THW-OV-Verzeichnis für die Vorschläge; leer bei anderen Organisationen oder solange es lädt. */
  ovVerzeichnis: readonly ThwOrtsverband[];
}) {
  const { person: p, set, einheitsDienststelle, org, ovVerzeichnis } = props;
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const vorgabe = einheitsDienststelle.trim();
  const abweichend = (wert: string) => abweichendeDienststelle(wert, vorgabe);
  const wert = entwurf ?? p.dienststelle ?? vorgabe;
  return (
    <div className="zeile">
      <Feld titel="Dienststelle">
        {org === OrganisationsTyp.THW ? (
          /* Beim THW sind alle Ortsverbände bekannt: dieselben Vorschläge wie
             in Schritt 1 (Hoya: „ist nur ein Freitextfeld, es kommen nicht
             die Vorschläge"). Ein gewählter Eintrag setzt den OV-Namen. */
          <OvVorschlagFeld
            id={`feld-dienststelle-${props.index}`}
            wert={wert}
            platzhalter={vorgabe ? "" : "wie die Einheit (Schritt 1)"}
            verzeichnis={ovVerzeichnis}
            tippen={(v) => {
              setEntwurf(v);
              set({ dienststelle: abweichend(v) });
            }}
            uebernehmen={(ov) => {
              setEntwurf(null);
              set({ dienststelle: abweichend(ov.name) });
            }}
            verlassen={() => setEntwurf(null)}
          />
        ) : (
          <input
            id={`feld-dienststelle-${props.index}`}
            {...FREMDE_DATEN}
            {...NAMEN_EINGABE}
            value={wert}
            placeholder={vorgabe ? undefined : "wie die Einheit (Schritt 1)"}
            onChange={(e) => {
              setEntwurf(e.target.value);
              set({ dienststelle: abweichend(e.target.value) });
            }}
            onBlur={() => setEntwurf(null)}
          />
        )}
      </Feld>
      {/* Was gilt, steht dran — sonst sieht die Vorbelegung aus wie etwas, das jemand eingetragen hat. */}
      <span className="hinweis dienststelle-zusatz">
        {p.dienststelle ? `abweichend von der Einheit${vorgabe ? ` (${vorgabe})` : ""}` : "wie die Einheit — nur ändern, wenn die Person aus einer anderen Dienststelle kommt"}
      </span>
    </div>
  );
}

function FahrerlaubnisFeld(props: { person: Person; set: (patch: Partial<Person>) => void }) {
  const { person: p, set } = props;
  const weitere = p.weitereFahrerlaubnisse ?? [];
  const uebernehmen = (haupt: Fahrerlaubnis, rest: Fahrerlaubnis[]) => {
    // Dubletten, „—" und die Hauptklasse raus; leer → Feld weglassen, damit
    // der Bogen im QR die alte Schema-Version behält (transportSchemaVersion).
    const bereinigt = [...new Set(rest)].filter((k) => k !== Fahrerlaubnis.NONE && k !== haupt);
    set({
      fahrerlaubnis: haupt,
      weitereFahrerlaubnisse: haupt !== Fahrerlaubnis.NONE && bereinigt.length > 0 ? bereinigt : undefined,
    });
  };
  // Vorschlag für „+": die erste noch nicht abgedeckte Klasse — praktisch
  // meist A (Krad), die häufigste Zweitklasse neben B/C/CE.
  const belegt = new Set(alleFahrerlaubnisse(p));
  const frei = Object.keys(FE_TEXT)
    .map(Number)
    .filter((k) => k !== Fahrerlaubnis.NONE && !belegt.has(k));
  const naechste = frei.includes(Fahrerlaubnis.A) ? Fahrerlaubnis.A : frei[0];
  return (
    <Feld titel="Fahrerlaubnis" schmal klasse="fahrerlaubnis">
      <Auswahl value={p.fahrerlaubnis} onChange={(e) => uebernehmen(Number(e.target.value), weitere)}>
        {Object.entries(FE_TEXT).map(([wert, text]) => (
          <option key={wert} value={wert}>{text}</option>
        ))}
      </Auswahl>
      {weitere.map((k, i) => (
        <span className="inline" key={i}>
          <Auswahl
            beschriftung={`Weitere Fahrerlaubnisklasse ${i + 1}`}
            value={k}
            onChange={(e) =>
              uebernehmen(p.fahrerlaubnis, weitere.map((w, j) => (j === i ? Number(e.target.value) : w)))
            }
          >
            {Object.entries(FE_TEXT)
              .filter(([wert]) => Number(wert) !== Fahrerlaubnis.NONE)
              .map(([wert, text]) => (
                <option key={wert} value={wert}>{text}</option>
              ))}
          </Auswahl>
          <button
            type="button"
            aria-label={`Fahrerlaubnisklasse ${FE_TEXT[k]} entfernen`}
            onClick={() => uebernehmen(p.fahrerlaubnis, weitere.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </span>
      ))}
      {p.fahrerlaubnis !== Fahrerlaubnis.NONE && naechste != null && (
        <button
          type="button"
          title="Weitere Klasse, die die vorhandenen nicht einschließen (z. B. B + A)"
          onClick={() => uebernehmen(p.fahrerlaubnis, [...weitere, naechste])}
        >
          + Klasse
        </button>
      )}
    </Feld>
  );
}

/**
 * Die Reihenfolge der Personalliste ist Inhalt, nicht Anzeige: die erste Person
 * steht im PDF als Ansprechpartner/in. Wer eine Vertretung erfasst, legt sie
 * unten an und braucht sie oben — daher an jedem Eintrag ein Griff nach oben
 * und einer nach unten, in beiden Ansichten derselbe.
 *
 * Kein Ziehen mit der Maus: der Bogen wird am Einsatzort auf dem Telefon
 * ausgefüllt, oft mit Handschuh, und Drag-and-drop gibt es weder für die
 * Tastatur noch für den Screenreader ohne eigenen Ersatzweg.
 *
 * `gruppe` trennt die Knopfsätze beider Ansichten im DOM — nach dem Verschieben
 * sucht der Fokus seinen Knopf über `data-sortier` an der neuen Stelle.
 */
function SortierKnoepfe(props: {
  index: number;
  anzahl: number;
  gruppe: "karte" | "zeile";
  verschieben: (von: number, nach: number, gruppe: "karte" | "zeile", art: "hoch" | "runter") => void;
}) {
  const { index, anzahl, gruppe, verschieben } = props;
  if (anzahl < 2) return null;
  return (
    <span className="sortieren">
      <button
        type="button"
        data-sortier={`${gruppe}-${index}-hoch`}
        disabled={index === 0}
        aria-label={`Person ${index + 1} nach oben`}
        title={index === 1 ? "Nach oben — die erste Person gilt als erreichbar für Rückfragen" : "Nach oben"}
        onClick={() => verschieben(index, index - 1, gruppe, "hoch")}
      >
        ▲
      </button>
      <button
        type="button"
        data-sortier={`${gruppe}-${index}-runter`}
        disabled={index === anzahl - 1}
        aria-label={`Person ${index + 1} nach unten`}
        title="Nach unten"
        onClick={() => verschieben(index, index + 1, gruppe, "runter")}
      >
        ▼
      </button>
      {/* Feste Plätze (R5-G4): „⇑" steht in jeder Zeile an derselben Stelle,
          in der ersten gesperrt statt weggelassen. Vorher stand dort bei
          x 233 „▼" und in den Zeilen darunter „⇑" — ein Tipp auf die Stelle
          des eben gedrückten Knopfs tat etwas anderes. Ohne diesen Weg braucht
          die zwölfte Person elf Klicks nach oben — und genau die zuletzt
          angelegte Vertretung gehört dorthin. */}
      <button
        type="button"
        disabled={index === 0}
        aria-label={`Person ${index + 1} an die erste Stelle`}
        title={index === 0 ? "Steht schon an erster Stelle" : "An die erste Stelle — gilt im PDF und in der Meldung als erreichbar für Rückfragen"}
        onClick={() => verschieben(index, 0, gruppe, "hoch")}
      >
        ⇑
      </button>
    </span>
  );
}

function PersonKarte(props: {
  person: Person;
  org: OrganisationsTyp;
  /** Tipphilfe für „Weitere Qualifikationen" (DLRG-Kennzahlen; sonst leer). */
  vorschlaege: readonly FreitextVorschlag[];
  /** Tipphilfe für das Berufsfeld (Berufsbezeichnungen). */
  berufVorschlaege: readonly FreitextVorschlag[];
  /** Häufigste Funktionen der Einheit — das leere Funktionsfeld bietet sie zum Antippen an (R2-G5). */
  haeufigeFunktionen: readonly VokabularWert[];
  /** Gerade hinzugefügt: die Karte stempelt sich einmal ein. */
  frisch?: boolean;
  /** Von „+ Person hinzufügen": Geschlecht und Ernährung sind noch Vorgaben (R4-H4). */
  neueVorgabe?: boolean;
  /** Stelle in der Liste und Listenlänge — für die Umsortier-Knöpfe. */
  index: number;
  anzahl: number;
  /** Erste Person eines vollständig erfassten Bogens: sie meldet der Empfänger an. */
  ansprech?: boolean;
  /** Meldekopf-Schnellerfassung: die Karte zählt nicht in die Stärke — das steht dran. */
  nichtGezaehlt?: boolean;
  /** Bei der ersten Person: Satz für die Rückfrage vor dem Entfernen — wer danach Ansprechperson ist (R11-D3). */
  ansprechSatz?: string;
  /** Dienststelle der Einheit (Schritt 1) — Vorbelegung des Felds „Dienststelle" je Person. */
  einheitsDienststelle: string;
  /** THW-OV-Verzeichnis für die Dienststellen-Vorschläge (leer bei anderen Organisationen). */
  ovVerzeichnis: readonly ThwOrtsverband[];
  aendern: (p: Person) => void;
  /** `ort`: Stelle des Tipps auf „Person entfernen" (Bildschirm), sofern getippt. */
  entfernen: (ort?: { x: number; y: number }) => void;
  verschieben: (von: number, nach: number, gruppe: "karte" | "zeile", art: "hoch" | "runter") => void;
}) {
  const { person: p, org, vorschlaege, berufVorschlaege, haeufigeFunktionen, frisch, neueVorgabe, index, anzahl, ansprech, nichtGezaehlt, aendern, entfernen, verschieben } = props;
  const karte = useRef<HTMLDivElement>(null);
  useEinzugsstempel(karte, frisch);
  // Eine neue Person ist ungefragt „M" und „Fleisch": Die Vorgabe sah wie eine
  // Angabe aus, und beide Werte fließen in Unterbringung und Verpflegung. Bis
  // jemand die Auswahl berührt, ist sie als „bitte wählen" gekennzeichnet
  // (Audit Runde 4, R4-H4). Einen Merker im Bogen gibt es nicht (das Format
  // bleibt), darum gilt das je Karte und Sitzung.
  const [vorgabe, setVorgabe] = useState({ geschlecht: !!neueVorgabe, ernaehrung: !!neueVorgabe });
  const bezeichnung = personBezeichnung(p, index);
  const set = (patch: Partial<Person>) => aendern({ ...p, ...patch });
  const funktionen = vokabularFuer(org, "funktion");
  const { qualifikationen, berufe } = qualifikationenUndBerufe(p);
  return (
    <div className="karte eintrag" ref={karte} data-person-index={index}>
      {/* Kopf des Eintrags: wer die Person ist und welche Stärkerolle sie vor
          Ort ausfüllt — die einzige Auskunft, nach der man in einer Liste von
          zwölf Personen sucht. Sie steht darum allein in der breitesten Zeile,
          nicht als drittes von sechs gleich schmalen Feldern. */}
      {/* Laufende Nummer sichtbar, nicht nur im aria-label: Solange noch keine
          Namen stehen, sind zwölf Karten optisch identisch — beim Nachtragen
          und beim Entfernen traf der Griff dann die falsche. Sie nennt die
          Stelle in der Liste, also genau das, was die Sortierknöpfe daneben
          verändern. */}
      {/* Die Sollstelle (GrFü, TrFü …) steht im Kopf, vor dem Namensfeld: Sie
          stand als Chip unter Geschlecht und Fahrerlaubnis, und Namen landeten
          auf der falschen Stelle (Audit Runde 2, R2-N8). */}
      <p className="eintrag-nr" aria-hidden="true">
        Person {index + 1} von {anzahl}
        {platzText(p, org) !== ROLLE_LABEL[p.staerkeRolle] && ` · ${platzText(p, org)}`}
        {nichtGezaehlt && " · nicht gezählt"}
      </p>
      <div className="zeile eintrag-kopf">
        {/* Die Person auf dem Bogen, nicht der Gerätebesitzer: ohne
            autocomplete schlug das Telefon für jede Person den eigenen Namen
            vor (R2-M6). */}
        <Feld titel="Vorname"><input {...FREMDE_DATEN} value={p.vorname} onChange={(e) => set({ vorname: e.target.value })} /></Feld>
        <Feld titel="Nachname"><input {...FREMDE_DATEN} value={p.nachname} onChange={(e) => set({ nachname: e.target.value })} /></Feld>
        {/* „Zählt als" statt „Stärkerolle (vor Ort)": das Feld entscheidet,
            in welcher Spalte der Stärkemeldung die Person landet — genau das
            sagt die Beschriftung. „(vor Ort)" las sich wie eine Ortsangabe. */}
        <Feld titel="Zählt als" klasse="mittel">
          <Auswahl value={p.staerkeRolle} onChange={(e) => set({ staerkeRolle: Number(e.target.value) })}>
            <option value={StaerkeRolle.FUEHRER}>Führer/in</option>
            <option value={StaerkeRolle.UNTERFUEHRER}>Unterführer/in</option>
            <option value={StaerkeRolle.MANNSCHAFT}>Mannschaft</option>
          </Auswahl>
        </Feld>
        {/* Ohne die Marke ist die Reihenfolge eine stumme Regel: im PDF steht
            die erste Person als Ansprechpartner/in, in der Liste sieht man ihr
            das nicht an. Erst damit wird das Umsortieren daneben verständlich.
            „Erreichbar für Rückfragen" sagt, wozu — „Ansprechpartner/in" war
            ein Etikett ohne Aussage, ob es einen oder mehrere geben darf. */}
        {/* Ohne Rahmen: Als graues Kästchen sah die Marke wie ein Schalter
            aus, und die Regel dahinter stand nur im Tooltip, den es auf dem
            Telefon nicht gibt (R3-N5). Die Regel steht darum sichtbar unter
            dem Kopf. */}
        {ansprech && (
          <span className="ansprech-marke">
            <span aria-hidden="true">☎ </span>Erreichbar für Rückfragen
          </span>
        )}
        <SortierKnoepfe index={index} anzahl={anzahl} gruppe="karte" verschieben={verschieben} />
        <button
          type="button"
          className="entfernen"
          aria-label={`${bezeichnung} entfernen`}
          onClick={async (e) => {
            // Die Stelle des Fingers — nach der Rückfrage zählt sonst nur der
            // Tipp auf „Person entfernen" im Dialog (R3-D3).
            const ort = e.detail > 0 ? { x: e.clientX, y: e.clientY } : undefined;
            /* Rückfrage nur, wenn etwas verloren geht: eine eben danebengetippte
               leere Karte verschwindet sofort, eine ausgefüllte erst nach
               Bestätigung. Ohne diese Rückfrage war das Löschen die einzige
               zerstörende Aktion der App, die still ausführte — „Neuer Bogen"
               und „Entwurf verwerfen" fragen beide, und ein Dutzend Felder einer
               Person wiegt nicht weniger. Der Name steht in der Frage, weil die
               Liste zwölf gleich aussehende Karten führen kann. */
            if (!personLeer(p) && !(await frageJaNein({
              titel: `${bezeichnung} entfernen?`,
              text: `Die Angaben dieser Person werden entfernt — Name, Funktionen, Qualifikationen und Erreichbarkeiten. „Rückgängig“ in der Leiste unten holt sie zurück.${props.ansprechSatz ? ` ${props.ansprechSatz}` : ""}`,
              ok: "Person entfernen",
              gefahr: true,
            }))) {
              return;
            }
            mitAbgang(karte.current, () => entfernen(ort));
          }}
        >
          Person entfernen
        </button>
      </div>
      {ansprech && (
        <p className="hinweis ansprech-regel" id={`ansprech-regel-${index}`}>
          Die erste Person der Liste steht im PDF und in der Meldung als Ansprechperson — bei ihr fragt der Meldekopf nach.
          {anzahl > 1 && " Eine andere Person mit ▲/▼ an die erste Stelle setzen."}
        </p>
      )}
      {/* Rumpf des Eintrags in zwei Spalten, sobald die Karte breit genug ist:
          links die feststehenden Merkmale der Person, rechts, was sie kann und
          wie man sie erreicht. Untereinander gestapelt braucht eine Person auf
          dem Desktop zehn Zeilen bei halb leerer rechter Kartenhälfte — bei
          zwölf Personen scrollt der Zugführer durch viereinhalb Bildschirme
          Weißraum. Die Lesefolge bleibt dieselbe: erst links, dann rechts. */}
      <div className="person-koerper">
        <div className="person-merkmale">
          <div className="zeile">
            <Feld titel="Geschlecht" schmal>
              <Auswahl
                id={`feld-geschlecht-${props.index}`}
                value={p.geschlecht}
                className={vorgabe.geschlecht ? "vorgabe-offen" : undefined}
                onFocus={() => setVorgabe((v) => ({ ...v, geschlecht: false }))}
                onChange={(e) => {
                  setVorgabe((v) => ({ ...v, geschlecht: false }));
                  set({ geschlecht: Number(e.target.value) });
                }}
              >
                <option value={Geschlecht.M}>M</option>
                <option value={Geschlecht.W}>W</option>
                <option value={Geschlecht.D}>D</option>
              </Auswahl>
            </Feld>
            <Feld titel="Ernährung" schmal>
              <Auswahl
                value={p.ernaehrung}
                className={vorgabe.ernaehrung ? "vorgabe-offen" : undefined}
                onFocus={() => setVorgabe((v) => ({ ...v, ernaehrung: false }))}
                onChange={(e) => {
                  setVorgabe((v) => ({ ...v, ernaehrung: false }));
                  set({ ernaehrung: Number(e.target.value) });
                }}
              >
                <option value={Ernaehrung.FLEISCH}>Fleisch</option>
                <option value={Ernaehrung.VEGETARISCH}>Vegetarisch</option>
                <option value={Ernaehrung.VEGAN}>Vegan</option>
              </Auswahl>
            </Feld>
            <FahrerlaubnisFeld person={p} set={set} />
          </div>
          <DienststelleFeld person={p} set={set} einheitsDienststelle={props.einheitsDienststelle} index={index} org={org} ovVerzeichnis={props.ovVerzeichnis} />
          {(vorgabe.geschlecht || vorgabe.ernaehrung) && (
            <p className="hinweis warnung-text vorgabe-hinweis" role="status">
              {vorgabe.geschlecht && vorgabe.ernaehrung
                ? "Geschlecht und Ernährung sind nur vorbelegt (M, Fleisch) — bitte wählen."
                : vorgabe.geschlecht
                  ? "Geschlecht ist nur vorbelegt (M) — bitte wählen."
                  : "Ernährung ist nur vorbelegt (Fleisch) — bitte wählen."}{" "}
              Beides zählt in Unterbringung und Verpflegung.
            </p>
          )}
        </div>
        <div className="person-faehigkeiten">
          <Feld titel="Funktionen / Zusatzfunktionen">
            <VokabListe
              werte={p.funktionen}
              aendern={(w) => set({ funktionen: w })}
              tabelle={funktionen}
              hinzufuegenText="Funktion"
              suchhinweis={kraftfahrerHinweis}
              haeufige={haeufigeFunktionen}
            />
          </Feld>
          {/* Zusatzqualifikationen kennen kein Code-Vokabular: Lehrgang oder
              externe Berechtigung wandern als Freitext in den Bogen (THW: die
              Qualifikationen aus THWin); die DLRG-Ausbildungskennzahlen dienen
              als Tipphilfe. Berufe stehen darunter in einem eigenen Feld und
              landen mit dem Präfix „Beruf: " im selben Bogenfeld (beruf.ts) —
              so bleibt das Transportformat unverändert. */}
          <Feld titel="Weitere Qualifikationen">
            <VokabListe
              werte={qualifikationen}
              aendern={(w) => set({ zusatzqualifikationen: zusatzqualifikationenAus(w, berufe) })}
              tabelle={[]}
              freitextVorschlaege={vorschlaege}
              hinzufuegenText="Qualifikation"
            />
          </Feld>
          <Feld titel="Berufe">
            <VokabListe
              werte={berufe.map((b) => ({ freitext: berufText(b) }))}
              aendern={(w) => set({ zusatzqualifikationen: zusatzqualifikationenAus(qualifikationen, w) })}
              tabelle={[]}
              freitextVorschlaege={berufVorschlaege}
              hinzufuegenText="Beruf"
            />
          </Feld>
          {/* Die Überschrift trägt erst, wenn etwas darunter steht: bei zwölf
              Personen ohne hinterlegte Nummer sind es zwölf fette Zeilen, die
              nichts melden. Ohne Einträge sagt der Knopf selbst, worum es geht. */}
          {p.kontakte.length > 0 && <h3>Erreichbarkeiten</h3>}
          <KontakteEditor kontakte={p.kontakte} aendern={(k) => set({ kontakte: k })} />
        </div>
      </div>
    </div>
  );
}

/**
 * Schnelleingabe-Tabelle: eine Zeile je Person mit den Kernfeldern. Enter in
 * der letzten Zeile legt die nächste Person an (Fokus springt mit) — für den
 * Zugführer, der 12 Namen hintereinander erfasst, ohne 12 Karten aufzuklappen.
 * Details (Funktionen, Kontakte …) bleiben in der Kartenansicht.
 */
function PersonalSchnellTabelle(props: {
  personal: Person[];
  aendern: (p: Person[]) => void;
  fokusNeue: boolean;
  aufNeueFokus: () => void;
  verschieben: (von: number, nach: number, gruppe: "karte" | "zeile", art: "hoch" | "runter") => void;
  /** Nach dem Entfernen einer Zeile: Quittung mit „Rückgängig" (R2-G1). */
  entfernt: (person: Person, index: number, bezeichnung: string) => void;
  org: OrganisationsTyp;
  /** Dienststelle der Einheit (Schritt 1) — Platzhalter der Spalte „Dienststelle". */
  einheitsDienststelle: string;
  /** THW-OV-Verzeichnis für die Dienststellen-Vorschläge (leer bei anderen Organisationen). */
  ovVerzeichnis: readonly ThwOrtsverband[];
}) {
  const { personal, aendern, fokusNeue, aufNeueFokus, verschieben, entfernt, org, einheitsDienststelle, ovVerzeichnis } = props;
  const set = (i: number, patch: Partial<Person>) =>
    aendern(personal.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  /**
   * Dieselbe Rückfrage wie in der Karte, aus demselben Grund — und in der
   * Tabelle wiegt sie mehr: Qualifikationen und Erreichbarkeiten sieht man
   * hier gar nicht, und der Knopf liegt am rechten Rand neben den
   * Sortierpfeilen. Eine leere Zeile geht weiterhin ohne Dialog.
   */
  async function zeileEntfernen(i: number) {
    const p = personal[i]!;
    const bezeichnung = personBezeichnung(p, i);
    if (
      !personLeer(p) &&
      !(await frageJaNein({
        titel: `${bezeichnung} entfernen?`,
        text: `Die Angaben dieser Person werden entfernt — Name, Funktionen, Qualifikationen und Erreichbarkeiten. „Rückgängig“ in der Leiste unten holt sie zurück.${i === 0 ? ` ${ansprechWechselSatz(personal)}` : ""}`,
        ok: "Person entfernen",
        gefahr: true,
      }))
    ) {
      return;
    }
    aendern(personal.filter((_, j) => j !== i));
    if (!personLeer(p)) entfernt(p, i, bezeichnung);
  }

  /**
   * Eingabetaste in der Kurz-Liste: „Weiter" führt zum nächsten Feld der Zeile (vom Vornamen zum
   * Nachnamen), im letzten Feld der Zeile zum ersten der nächsten Zeile, in der letzten Zeile zu einer
   * neuen Person. Vorher sprang sie in der Spalte nach unten, während die Tastaturtaste „Weiter" zum
   * Nachnamen versprach — der Nachname landete bei der nächsten Person (R10-G1). Das Zielfeld wird
   * markiert, damit Getipptes nicht an einen vorhandenen Wert angehängt wird.
   */
  function enterWeiter(e: ReactKeyboardEvent, i: number) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const feld = e.target as HTMLInputElement;
    const zeile = feld.closest("tr");
    // Die Dienststelle (Nebenfeld, meist Vorbelegung) gehört nicht in die Kette: Enter im Nachnamen führt
    // weiter zur nächsten Zeile, wie es die Tastatur verspricht.
    const felder = zeile
      ? Array.from(zeile.querySelectorAll<HTMLInputElement>("input")).filter((f) => !f.closest("[data-nebenfeld]"))
      : [];
    const stelle = felder.indexOf(feld);
    const fokussieren = (el: HTMLInputElement | null | undefined) => {
      el?.focus();
      el?.select?.();
    };
    if (stelle >= 0 && stelle < felder.length - 1) {
      fokussieren(felder[stelle + 1]);
      return;
    }
    if (i === personal.length - 1) {
      aufNeueFokus();
      aendern([...personal, neuePerson()]);
      return;
    }
    fokussieren(zeile?.nextElementSibling?.querySelector<HTMLInputElement>("input"));
  }

  return (
    <TabellenScroll titel="Personal-Schnelleingabe">
      {/* Rollen ausdrücklich: auf dem Telefon legt index.html jede Zeile als
          Raster aus (R4-H2) — Browser verlieren dann die Tabellen-Semantik. */}
      <table className="uebersicht schnell-tabelle" role="table">
        <thead role="rowgroup">
          <tr role="row"><th role="columnheader">Stelle</th><th role="columnheader">Vorname</th><th role="columnheader">Nachname</th><th role="columnheader">Zählt als</th><th role="columnheader">Geschlecht</th><th role="columnheader">Dienststelle</th><th role="columnheader" aria-label="Reihenfolge" /><th role="columnheader" aria-label="Entfernen" /></tr>
        </thead>
        <tbody role="rowgroup">
          {personal.map((p, i) => (
            <tr key={i} role="row">
              {/* Die Sollstelle als erste Spalte: In der Tabelle fehlte die
                  Funktion ganz, und Namen gerieten auf die falsche Stelle (R2-N8). */}
              <td className="stelle" role="cell">{platzText(p, org)}</td>
              <td role="cell">
                {/* Name wie bei den Auswahlfeldern der Zeile: ohne ihn sagte
                    der Vorleser nur den Wert an, ein leeres Feld hieß bloß
                    „Bearbeitungsfeld" — Vor- und Nachname gerieten vertauscht
                    auf den Bogen (Audit Runde 2, R2-M5). */}
                <input
                  aria-label={`Person ${i + 1}: Vorname`}
                  placeholder="Vorname"
                  {...FREMDE_DATEN}
                  value={p.vorname}
                  autoFocus={fokusNeue && i === personal.length - 1}
                  onChange={(e) => set(i, { vorname: e.target.value })}
                  onKeyDown={(e) => enterWeiter(e, i)}
                />
              </td>
              <td role="cell">
                <input
                  aria-label={`Person ${i + 1}: Nachname`}
                  placeholder="Nachname"
                  {...FREMDE_DATEN}
                  value={p.nachname}
                  onChange={(e) => set(i, { nachname: e.target.value })}
                  onKeyDown={(e) => enterWeiter(e, i)}
                />
              </td>
              <td role="cell">
                {/* In der Tabelle gibt es kein <Feld> — Beschriftung wie beim
                    Entfernen-Knopf mit der Zeilennummer, sonst heißen alle gleich. */}
                <Auswahl
                  beschriftung={`Person ${i + 1}: Zählt als`}
                  value={p.staerkeRolle}
                  onChange={(e) => set(i, { staerkeRolle: Number(e.target.value) })}
                >
                  <option value={StaerkeRolle.FUEHRER}>Führer/in</option>
                  <option value={StaerkeRolle.UNTERFUEHRER}>Unterführer/in</option>
                  <option value={StaerkeRolle.MANNSCHAFT}>Mannschaft</option>
                </Auswahl>
              </td>
              <td role="cell">
                <Auswahl
                  beschriftung={`Person ${i + 1}: Geschlecht`}
                  value={p.geschlecht}
                  onChange={(e) => set(i, { geschlecht: Number(e.target.value) })}
                >
                  <option value={Geschlecht.M}>M</option>
                  <option value={Geschlecht.W}>W</option>
                  <option value={Geschlecht.D}>D</option>
                </Auswahl>
              </td>
              <td role="cell" data-nebenfeld="1">
                {/* Nur die Abweichung wird gespeichert (siehe DienststelleFeld); leer heißt „wie die Einheit". */}
                {org === OrganisationsTyp.THW ? (
                  <OvVorschlagFeld
                    beschriftung={`Person ${i + 1}: Dienststelle`}
                    wert={p.dienststelle ?? ""}
                    platzhalter={einheitsDienststelle.trim() || "wie die Einheit"}
                    verzeichnis={ovVerzeichnis}
                    tippen={(w) => set(i, { dienststelle: abweichendeDienststelle(w, einheitsDienststelle) })}
                    uebernehmen={(ov) => set(i, { dienststelle: abweichendeDienststelle(ov.name, einheitsDienststelle) })}
                  />
                ) : (
                  <input
                    aria-label={`Person ${i + 1}: Dienststelle`}
                    placeholder={einheitsDienststelle.trim() || "wie die Einheit"}
                    {...FREMDE_DATEN}
                    {...NAMEN_EINGABE}
                    value={p.dienststelle ?? ""}
                    onChange={(e) => set(i, { dienststelle: abweichendeDienststelle(e.target.value, einheitsDienststelle) })}
                    onKeyDown={(e) => enterWeiter(e, i)}
                  />
                )}
              </td>
              {/* Die Reihenfolge entscheidet, wer als Ansprechpartner/in gilt —
                  in der Tabelle sieht man die Liste ganz, hier wird sie sortiert. */}
              <td className="sortier-spalte" role="cell">
                <SortierKnoepfe index={i} anzahl={personal.length} gruppe="zeile" verschieben={verschieben} />
              </td>
              {/* Klasse „entfernen" wie in der Karte: sie rückt den Knopf von
                  den Sortierpfeilen ab (CSS in index.html) — ein Fehlgriff
                  auf „nach unten" darf nicht auf dem Löschen landen. */}
              <td role="cell">
                <button
                  type="button"
                  className="entfernen"
                  aria-label={`${personBezeichnung(p, i)} entfernen`}
                  onClick={() => void zeileEntfernen(i)}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TabellenScroll>
  );
}

/**
 * Personen, die schon etwas tragen (Name oder Erreichbarkeit). Eingefügte
 * Namen ersetzen die unbenannten Zeilen — etwa die Sollplätze einer
 * Vorlage —, statt sich dahinter zu stellen; Ausgefülltes bleibt unangetastet.
 */
export function benannte(personal: Person[]): Person[] {
  return personal.filter((p) => !personUnbenannt(p));
}

/** Kurzbeschreibung eines Sollplatzes für die Namensvorschau: Funktion, sonst Rolle. */
export function platzText(p: Person, org: OrganisationsTyp): string {
  const funktion = p.funktionen
    .map((f) => vokabText(f, vokabularFuer(org, "funktion"), "kurz"))
    .filter(Boolean)
    .join(", ");
  return funktion || ROLLE_LABEL[p.staerkeRolle];
}


/**
 * Ab dieser Personenzahl beginnt die Liste als Kurz-Liste statt als Karten (R5-H2). Die Grenze
 * lag bei 12; neun Karten messen 14 000 px, zwölf 18 700 (R7-H6) — ab acht Personen ist die
 * Kurz-Liste die Voreinstellung, die Karten bleiben einen Tipp entfernt.
 */
const VIELE_PERSONEN = 7;

/** Rückweg nach einer Handlung, die Erfasstes wegnimmt – siehe {@link SchrittPersonal}. */
type Rueckweg =
  | { art: "liste"; text: string; personal: Person[] }
  | { art: "person"; entfernte: { person: Person; index: number; name: string }[]; nonce: number };

/**
 * Der Rückweg überlebt den Wechsel des Schritts und das Neuladen (Audit Runde 6, R6-S4, R6-D4):
 * „Rückgängig" nach „Person entfernen" verschwand mit „Weiter →" und „←", die entfernte
 * Person war dann nirgends mehr zu holen. Er liegt im Sitzungsspeicher dieses Tabs (nicht in
 * `localStorage`, nicht in der Datensicherung, weg mit dem Schließen des Tabs; „Alle Daten
 * löschen" leert ihn mit) und gilt für 15 Minuten und nur für dieselbe Einheit.
 */
const WEG_SCHLUESSEL = "eeb.personal.rueckweg";
const WEG_FRIST_MS = 15 * 60 * 1000;

interface GemerkterWeg {
  rueckweg: Rueckweg;
  einheit: string;
  /**
   * Fingerabdruck der Liste NACH der Handlung – ändert sie sich, gilt der Rückweg nach einem
   * Neuladen oder Schrittwechsel nicht mehr. Bei einer entfernten Person genügen die Namen: Ein
   * anderer Bogen mit derselben Einheit bekommt so keinen fremden „Rückgängig"-Knopf.
   */
  danach?: string;
  zeit: number;
}

function abdruck(r: Rueckweg, personal: readonly Person[]): string {
  return r.art === "liste" ? JSON.stringify(personal) : JSON.stringify(personal.map((p) => [p.vorname, p.nachname]));
}

function wegSichern(r: Rueckweg | null, einheit: Einheit, personal: readonly Person[]): void {
  try {
    const sitzung = globalThis.sessionStorage;
    if (!sitzung) return;
    if (!r) {
      sitzung.removeItem(WEG_SCHLUESSEL);
      return;
    }
    const gemerkt: GemerkterWeg = {
      rueckweg: r,
      einheit: JSON.stringify(einheit),
      danach: abdruck(r, personal),
      zeit: Date.now(),
    };
    sitzung.setItem(WEG_SCHLUESSEL, JSON.stringify(gemerkt));
  } catch {
    /* gesperrt oder voll – dann gilt der Rückweg nur bis zum Schrittwechsel, wie bisher */
  }
}

/**
 * Den gemerkten Rückweg entfernen: Wer „Person entfernen" gesagt und den Bogen danach verworfen,
 * geschlossen oder übergeben hat, soll Name, Funktionen und Rufnummer nicht im Sitzungsspeicher
 * des Tabs zurücklassen (R7-O5).
 */
export function personalRueckwegVergessen(): void {
  try {
    globalThis.sessionStorage?.removeItem(WEG_SCHLUESSEL);
  } catch {
    /* gesperrt – dann liegt auch nichts darin */
  }
}

function wegLesen(einheit: Einheit, personal: readonly Person[], jetzt = Date.now()): Rueckweg | null {
  try {
    const roh = globalThis.sessionStorage?.getItem(WEG_SCHLUESSEL);
    if (!roh) return null;
    const g = JSON.parse(roh) as Partial<GemerkterWeg>;
    // Abgelaufen oder von einer anderen Einheit: nicht nur ignorieren, sondern entfernen (R7-O5).
    if (typeof g.zeit !== "number" || jetzt - g.zeit > WEG_FRIST_MS || g.einheit !== JSON.stringify(einheit)) {
      personalRueckwegVergessen();
      return null;
    }
    if (!g.rueckweg) return null;
    if (g.danach !== abdruck(g.rueckweg, personal)) return null;
    return g.rueckweg;
  } catch {
    return null;
  }
}

export function SchrittPersonal({ bogen, aendern: aendernRoh }: SchrittProps) {
  /**
   * Rückweg nach einer Handlung, die Erfasstes wegnimmt: Person entfernen,
   * Namen einfügen, Sollplätze laden. Eine gelöschte Person nahm Name,
   * Funktionen und Erreichbarkeit ohne jeden Rückweg mit — und ein Doppeltipp
   * genügte (Audit Runde 2, R2-G1, R2-N2).
   *
   * Ganze Liste (`liste`): Jede weitere Änderung verwirft den Rückweg, damit
   * „Rückgängig" nie spätere Eingaben mitnimmt; die Quittung steht oben bei
   * den Knöpfen, die sie auslösen.
   *
   * Eine Person (`person`): R2-G1 setzte die Quittung an die Stelle der
   * entfernten Karte — an deren Oberkante, „Person entfernen" sitzt aber
   * unten an der rund 600 px hohen Karte; die Quittung lag oberhalb des
   * Bilds und verfiel mit der nächsten Eingabe (Audit Runde 3, R3-G1,
   * R3-D3). Jetzt steht sie als Leiste im Daumenbereich über „Weiter →" und
   * bleibt bis ✕, bis zum nächsten Entfernen oder bis der Schritt verlassen
   * wird. „Rückgängig" fügt die Person an ihrer alten Stelle wieder ein und
   * lässt alles später Eingetragene stehen.
   */
  const [rueckweg, setRueckweg] = useState<Rueckweg | null>(() => wegLesen(bogen.einheit, bogen.personal));
  useEffect(() => {
    wegSichern(rueckweg, bogen.einheit, bogen.personal);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur bei Änderung des Rückwegs (Liste/Einheit gehören zum Zeitpunkt der Handlung)
  }, [rueckweg]);
  // Quittung des Zurückholens (ohne weiteren Rückweg, wie in der Einsatzansicht).
  const [zurueckgeholt, setZurueckgeholt] = useState<{ text: string; nonce: number } | null>(null);
  // Rückweg nach „Personal vollständig erfassen", wenn dabei eingetragene Zahlen der Schnellerfassung verworfen wurden (R10-E1).
  const [zahlenWeg, setZahlenWeg] = useState<{
    vorher: Pick<Erfassungsbogen, "personalErfassung" | "staerkeManuell" | "unterbringungManuell" | "verpflegungManuell">;
    text: string;
    nonce: number;
  } | null>(null);
  // Jede Änderung hier kann die Stärke verschieben — der Verpflegungs-Bedarf
  // in Schritt 5 zieht mit, solange er der Stärke entsprach (verpflegungMitziehen).
  const aendern = (patch: Partial<typeof bogen>) => {
    setRueckweg((r) => (r?.art === "person" ? r : null));
    aendernRoh(verpflegungMitziehen(bogen, patch));
  };
  /** Liste ändern und den vorigen Stand als Rückweg anbieten. */
  const aendernMitRueckweg = (personal: Person[], text: string) => {
    const vorher = bogen.personal;
    aendern({ personal });
    setZurueckgeholt(null);
    setRueckweg({ art: "liste", text, personal: vorher });
  };
  /**
   * Eine Person ist weg: Rückweg in der Daumenleiste. Wird in einer Reihe eine
   * zweite entfernt, bleibt die erste mit im Rückweg: „Rückgängig" holt alle
   * zurück, die seit der Leiste entfernt wurden (R5-S3). Vorher gab es nur die
   * letzte zurück, und die zuerst entfernte war verloren.
   */
  const personEntfernt = (person: Person, index: number, bezeichnung: string) => {
    setZurueckgeholt(null);
    setRueckweg((r) => {
      const vorige = r?.art === "person" ? r.entfernte : [];
      return { art: "person", entfernte: [...vorige, { person, index, name: bezeichnung }], nonce: Date.now() };
    });
  };
  /** „Entfernt: Name" bzw. „2 Personen (Name, Name)". */
  const entferntText = (entfernte: { name: string }[]) =>
    entfernte.length === 1 ? entfernte[0]!.name : `${entfernte.length} Personen (${entfernte.map((e) => e.name).join("; ")})`;
  // Wechsel der Ansprechperson (Platz 1) durch ▲/⇑/▼: Quittung mit „Rückgängig", solange die Liste so steht (R17-D2).
  const [ansprechWechsel, setAnsprechWechsel] = useState<{ vorher: Person[]; danach: string; name: string; nonce: number } | null>(null);
  const ansprechWeg = ansprechWechsel && JSON.stringify(bogen.personal) === ansprechWechsel.danach ? ansprechWechsel : null;
  const rueckgaengig = () => {
    if (!rueckweg) return;
    if (rueckweg.art === "liste") {
      aendern({ personal: rueckweg.personal });
      return;
    }
    // In umgekehrter Reihenfolge einsetzen: Jeder Index galt für die Liste
    // zum Zeitpunkt seiner Entfernung.
    const liste = [...bogen.personal];
    let letzteStelle = 0;
    for (const { person, index } of [...rueckweg.entfernte].reverse()) {
      letzteStelle = Math.min(index, liste.length);
      liste.splice(letzteStelle, 0, person);
    }
    const erste = rueckweg.entfernte[0]!;
    setRueckweg(null);
    setFrischeKarte(erste.person);
    setZurueckgeholt({
      text:
        rueckweg.entfernte.length === 1
          ? `Zurückgeholt: ${erste.name} (wieder Person ${letzteStelle + 1})`
          : `Zurückgeholt: ${entferntText(rueckweg.entfernte)}`,
      nonce: Date.now(),
    });
    aendernRoh(verpflegungMitziehen(bogen, { personal: liste }));
  };
  const quittung = rueckweg?.art === "liste" && (
    <p className="meldung rueckweg" role="status">
      {rueckweg.text}{" "}
      <button type="button" onClick={rueckgaengig}>Rückgängig</button>
    </p>
  );
  // Nach dem Entfernen in der Kartenansicht rückt die nächste Karte an die
  // Stelle der entfernten — ihr „Person entfernen" lag dann fast genau unter
  // dem Finger (R3-G1, R3-D3). Die Ansicht beginnt darum mit dem Anfang der
  // nachgerückten Karte (Name), und die alte Fingerstelle nimmt kurz keinen
  // Tipp an.
  const [nachEntfernen, setNachEntfernen] = useState<{ index: number; ort?: { x: number; y: number } } | null>(null);
  useLayoutEffect(() => {
    if (!nachEntfernen) return;
    setNachEntfernen(null);
    const { index, ort } = nachEntfernen;
    if (ort) ortSperren(undefined, ort);
    const ziel =
      document.querySelector<HTMLElement>(`[data-person-index="${index}"]`) ??
      document.querySelector<HTMLElement>(`[data-person-index="${index - 1}"]`);
    if (!ziel) return;
    const oben = ziel.getBoundingClientRect().top;
    const frei = 8;
    try {
      window.scrollBy(0, Math.round(oben - frei));
      // Liegt „Person entfernen" der nachgerückten Karte (breite Karte, quer)
      // trotzdem unter der alten Fingerstelle, rückt die Karte tiefer.
      const knopf = ort && ziel.querySelector<HTMLElement>("button.entfernen")?.getBoundingClientRect();
      if (ort && knopf && knopf.height > 0 && knopf.top < ort.y + 50 && knopf.bottom > ort.y - 50) {
        window.scrollBy(0, -Math.round(ort.y + 50 - knopf.top));
      }
    } catch {
      /* Testumgebung ohne Layout */
    }
  }, [nachEntfernen]);
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  /** Neue Person ans Ende — in der Kartenansicht samt Sprung dorthin, in der Tabelle mit Fokus in der neuen Zeile. */
  function personObenHinzufuegen() {
    const neu = neuePerson();
    setFokusNeue(true);
    setFrischeKarte(neu);
    setVorgabeKarte(neu);
    if (!schnell) setZurNeuen(bogen.personal.length);
    aendern({ personal: [...bogen.personal, neu] });
  }
  // Bei „Einsatz vorbereiten" abgewählt, jetzt doch dabei: ein Tipp statt die
  // Person mit Funktion, Fahrerlaubnis und Erreichbarkeit neu einzugeben (R4-W8).
  const nachzuegler = nachzueglerFuer(bogen);
  async function ausVorlageErgaenzen() {
    const wahl = await frageWahl({
      titel: "Aus der Vorlage ergänzen",
      text: "Diese Personen wurden bei „Einsatz vorbereiten“ abgewählt. Wer kommt nach?",
      wege: nachzuegler.map((p, i) => ({
        wert: String(i),
        label: personBezeichnung(p, i),
        ...(p.funktionen.length > 0 || p.kontakte.length > 0 ? { hinweis: "mit Funktion und Erreichbarkeit aus der Vorlage" } : {}),
      })),
      abbruch: "Abbrechen",
    });
    if (wahl == null) return;
    const person = nachzuegler[Number(wahl)];
    if (!person) return;
    const neu = structuredClone(person);
    setFrischeKarte(neu);
    if (!schnell) setZurNeuen(bogen.personal.length);
    aendern({ personal: [...bogen.personal, neu] });
  }
  const vorlage = stanPersonalVorbelegung(bogen.einheit.organisation, bogen.einheit.einheitsTyp);
  const stanGeladen = vorbelegungGeladen(bogen.personal, vorlage);
  const funktionsauswahl = haeufigeFunktionen(bogen.einheit.organisation, vorlage, bogen.personal);
  const unbenannte = bogen.personal.filter(personUnbenannt).length;
  /** Entfernt nur Karten ohne Namen und Erreichbarkeit — ohne Rückfrage, mit Rückweg. */
  const vorbelegungWegnehmen = () => {
    const nach = benannte(bogen.personal);
    // Mit Rückweg und Stärke vorher → nachher: Die Plätze trugen
    // Geschlecht und Ernährung (Audit Runde 4, R4-D4).
    aendernMitRueckweg(
      nach,
      `Vorbelegung entfernt: ${unbenannte === 1 ? "1 Person" : `${unbenannte} Personen`} — Stärke ${staerke(bogen).gesamt} → ${staerke({ personal: nach, staerkeManuell: bogen.staerkeManuell }).gesamt}.`,
    );
  };
  // Schnelleingabe: Tabellenansicht statt Detail-Karten; `fokusNeue` lässt den
  // Fokus beim Anlegen per Enter in die neue Zeile springen.
  // Ab 13 Personen beginnt die Liste mit der Kurz-Liste: Als Karten sind 38
  // Personen 88 Bildschirme hoch (R5-H2), als Zeilen rund ein Siebtel davon.
  const [schnell, setSchnell] = useState(() => bogen.personal.length > VIELE_PERSONEN && bogen.personalErfassung !== PersonalErfassung.NUR_STAERKE);
  const [fokusNeue, setFokusNeue] = useState(false);
  // Objektidentität statt Index — siehe fahrzeuge.tsx: ein Index rutscht beim
  // Löschen einer anderen Karte auf eine bestehende.
  const [frischeKarte, setFrischeKarte] = useState<Person | null>(null);
  // Die zuletzt von „+ Person hinzufügen" angelegte Karte: Geschlecht und Ernährung sind dort Vorgaben (R4-H4).
  const [vorgabeKarte, setVorgabeKarte] = useState<Person | null>(null);
  // „+ Person hinzufügen" oben: nach dem Anlegen zur neuen Karte springen.
  const [zurNeuen, setZurNeuen] = useState<number | null>(null);
  useEffect(() => {
    if (zurNeuen == null) return;
    setZurNeuen(null);
    const karte = document.querySelector<HTMLElement>(`[data-person-index="${zurNeuen}"]`);
    if (!karte) return;
    karte.scrollIntoView?.({ block: "start" });
    karte.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  }, [zurNeuen]);
  // Nur die Detail-Karten zeigen Qualifikationen; die Schnelltabelle nicht.
  const vorschlaege = useQualiVorschlaege(!nurStaerke && !schnell, bogen.einheit.organisation);
  const berufVorschlaege = useBerufVorschlaege(!nurStaerke && !schnell);
  // OV-Verzeichnis für die Dienststelle je Person (THW): dieselben Vorschläge wie in Schritt 1.
  const ovDaten = useOvDaten(bogen.einheit.organisation === OrganisationsTyp.THW);
  const ovVerzeichnis = ovDaten?.THW_ORTSVERBAENDE ?? [];
  // Nach dem Verschieben wandert der Fokus mit der Person. Ohne das zeigt der
  // gerade gedrückte Knopf auf die Nachbarperson, die nachgerückt ist: der
  // zweite Klick hebt dann die falsche. Gemerkt wird die Zielstelle, der
  // Effekt sucht den Knopf, wenn die Liste neu steht.
  const [fokusSortierung, setFokusSortierung] = useState<string | null>(null);
  /** Höhe des gedrückten Knopfs im Bild – die verschobene Person soll unter dem Finger bleiben (R6-G5). */
  const sortierAnker = useRef<number | null>(null);
  const namenDialog = useRef<HTMLDialogElement>(null);
  // Der Inhalt des Fensters „Namen einfügen…" (Zerleger, Vorschau, Beispielnamen) lädt nach und bleibt aus dem Startbündel;
  // sein Zustand (die eingefügte Liste) lebt dort, solange der Schritt offen ist.
  const namenUebernehmen = (personal: Person[], text: string) => {
    aendernMitRueckweg(personal, text);
    namenDialog.current?.close();
  };
  const beispielnamenUebernehmen = (personal: Person[]) => {
    aendern({ personal });
    setSchnell(true);
    namenDialog.current?.close();
  };
  useEffect(() => {
    if (fokusSortierung == null) return;
    setFokusSortierung(null);
    const ersatz = fokusSortierung.endsWith("hoch") ? "runter" : "hoch";
    const knopf = (wahl: string) => document.querySelector<HTMLButtonElement>(`[data-sortier="${wahl}"]`);
    // Am Listenrand ist der gedrückte Knopf gesperrt — dann den anderen nehmen,
    // damit der Fokus nicht auf den Seitenanfang zurückfällt.
    const ziel = knopf(fokusSortierung);
    const nehmen = ziel && !ziel.disabled ? ziel : knopf(fokusSortierung.replace(/(hoch|runter)$/, ersatz));
    nehmen?.focus({ preventScroll: true });
    // Die Person ist mit dem Tausch gewandert, der Finger blieb: Die Ansicht rollt um die
    // Strecke mit, sodass ihre Knopfreihe wieder an der Fingerstelle steht (R6-G5).
    const vorher = sortierAnker.current;
    sortierAnker.current = null;
    if (nehmen && vorher != null) {
      const diff = nehmen.getBoundingClientRect().top - vorher;
      if (Math.abs(diff) > 1) {
        try {
          window.scrollBy(0, diff);
        } catch {
          /* Testumgebung ohne Layout */
        }
      }
    }
  }, [fokusSortierung]);

  /**
   * Eine Person an eine andere Stelle setzen. `gruppe` und `art` sagen nur, wo
   * der Fokus danach hingehört (Karte oder Tabellenzeile, oberer oder unterer
   * Knopf) — die Liste selbst kennt keine Ansichten.
   */
  function personVerschieben(von: number, nach: number, gruppe: "karte" | "zeile", art: "hoch" | "runter") {
    if (nach < 0 || nach >= bogen.personal.length) return;
    // Nach dem Tausch liegt unter dem Finger oft der Knopf der Nachbarperson;
    // ein Nachtipp schob sie zurück, und die Reihenfolge war wieder die alte
    // (R5-G4). Die Stelle nimmt kurz nichts an, der Tipp zeigt „Einen Moment …".
    ortSperren();
    sortierAnker.current = document.querySelector<HTMLElement>(`[data-sortier="${gruppe}-${von}-${art}"]`)?.getBoundingClientRect().top ?? null;
    const danach = verschoben(bogen.personal, von, nach);
    aendern({ personal: danach });
    // Wer an Platz 1 steht, ist die Ansprechperson (PDF, Meldekopf): Ein Wechsel dorthin wird gesagt und lässt sich
    // mit einem Tipp zurücknehmen — „⇑" liegt 4 px neben „▼" und „✕" (R17-D2, R17-S5).
    if ((von === 0 || nach === 0) && danach[0] && danach[0] !== bogen.personal[0]) {
      setAnsprechWechsel({ vorher: bogen.personal, danach: JSON.stringify(danach), name: personBezeichnung(danach[0], 0), nonce: Date.now() });
    }
    setFokusSortierung(`${gruppe}-${nach}-${art}`);
  }

  const s = staerke(bogen);
  /* Die abgeleitete Stärke rechnet sich weit oben in der Liste neu, während der
     Blick unten in einer Personenkarte steht. Sie quittiert deshalb dieselbe
     Änderung wie ihre Zwillingszahl in der Stärke-Leiste der Einsatz-Sammlung
     — eine Auskunft, eine Behandlung. Der Schlüssel umfasst alle vier Werte:
     ein Rollenwechsel verschiebt Führer und Mannschaft, ohne die Gesamtzahl
     anzurühren. */
  const staerkeQuittung = useZahlQuittung<HTMLElement>(
    `${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}`,
  );
  const mwd = unterbringungMWD(bogen);
  const sm = bogen.staerkeManuell ?? { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 };
  const gesamtQuittung = useZahlQuittung<HTMLInputElement>(sm.gesamt);
  const setSm = (p: Partial<typeof sm>) => {
    const neu = { ...sm, ...p };
    neu.gesamt = neu.fuehrer + neu.unterfuehrer + neu.mannschaft;
    aendern({ staerkeManuell: neu });
  };
  const vp = verpflegung(bogen);
  const setVp = (patch: Partial<{ vegetarisch: number; vegan: number }>) =>
    aendern({ verpflegungManuell: { vegetarisch: vp.vegetarisch, vegan: vp.vegan, ...patch } });
  const vegSumme = vp.vegetarisch + vp.vegan;

  /**
   * Auf „Nur Stärke" umschalten. Vorher setzte der Wechsel die gemeldete
   * Stärke auf 0/0/0/0, während die erfassten Personen darunter stehen
   * blieben — der Bogen ging so an den Meldekopf, und dort zählte die Einheit
   * nicht. Jetzt starten Stärke, Unterbringung und Verpflegung mit den aus
   * den Karten abgeleiteten Zahlen; steht schon Personal im Bogen, wird
   * vorher gesagt, was der Wechsel bedeutet. Die Namen bleiben in jedem Fall.
   */
  async function aufNurStaerke() {
    const erfasst = bogen.personal.filter((p) => !personLeer(p)).length;
    // „Erfasst" sind Personen mit Namen oder Erreichbarkeit; vorbelegte Sollplätze (StAN) sind Plätze,
    // keine erfassten Personen — „2 erfasste Personen" neben Stärke 9 las sich als Widerspruch (R10-N1, R10-H4).
    const benannt = bogen.personal.filter((p) => !personUnbenannt(p)).length;
    const plaetze = bogen.personal.length - benannt;
    const abgeleitet = staerke({ personal: bogen.personal });
    const startet = `${abgeleitet.fuehrer} / ${abgeleitet.unterfuehrer} / ${abgeleitet.mannschaft} / ${abgeleitet.gesamt}`;
    const frage =
      benannt === 0
        ? `Keine Person mit Namen, nur ${plaetze === 1 ? "1 vorbelegter Platz" : `${plaetze} vorbelegte Plätze`} nach Einheitstyp. Die Stärke wird von Hand geführt und startet mit diesen Sollzahlen ${startet}; die Plätze zählen nicht mehr mit.`
        : `${benannt === 1 ? "1 erfasste Person zählt" : `${benannt} erfasste Personen zählen`}${plaetze > 0 ? ` (dazu ${plaetze === 1 ? "1 vorbelegter Platz" : `${plaetze} vorbelegte Plätze`})` : ""} dann nicht mehr einzeln — die Stärke wird von Hand geführt und startet mit ${startet}. Die Namen bleiben als Erreichbarkeiten erhalten.`;
    if (
      erfasst > 0 &&
      !(await frageJaNein({
        titel: "Nur die Stärke melden?",
        text: frage,
        ok: "Nur Stärke melden",
        // R8-H2: wie die anderen Rückfragen — der Fokus liegt auf der Wahl, die nichts verändert.
        fokus: "abbruch",
      }))
    ) {
      return;
    }
    const vpAbgeleitet = verpflegung({ personal: bogen.personal });
    aendern({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      staerkeManuell: abgeleitet,
      ...(bogen.personal.length > 0
        ? {
            unterbringungManuell: unterbringungMWD({ personal: bogen.personal }),
            verpflegungManuell: { vegetarisch: vpAbgeleitet.vegetarisch, vegan: vpAbgeleitet.vegan },
          }
        : {}),
    });
  }

  /**
   * Zurück auf „Personal vollständig erfassen". Die manuellen Zahlen gehören zur Schnellerfassung — in
   * der Vollerfassung zählen wieder die Karten, auch bei der Verpflegung (sonst überdeckte die manuelle
   * Aufteilung die Ernährungsangaben der Personen). Stehen eigene Zahlen da, die nicht der Ableitung aus
   * den Karten entsprechen, fragt der Wechsel vorher (wie in der Gegenrichtung) und bietet danach
   * „Rückgängig" (R10-E1).
   */
  async function aufVollstaendig() {
    const vorher = {
      personalErfassung: bogen.personalErfassung,
      staerkeManuell: bogen.staerkeManuell,
      unterbringungManuell: bogen.unterbringungManuell,
      verpflegungManuell: bogen.verpflegungManuell,
    };
    const karten = staerke({ personal: bogen.personal });
    const m = bogen.staerkeManuell;
    const eigeneStaerke = !!m && (m.fuehrer !== karten.fuehrer || m.unterfuehrer !== karten.unterfuehrer || m.mannschaft !== karten.mannschaft);
    const mwdKarten = unterbringungMWD({ personal: bogen.personal });
    const u = bogen.unterbringungManuell;
    const eigeneMwd = !!u && (u.m !== mwdKarten.m || u.w !== mwdKarten.w || u.d !== mwdKarten.d);
    const vpKarten = verpflegung({ personal: bogen.personal });
    const v = bogen.verpflegungManuell;
    const eigeneVp = !!v && (v.vegetarisch !== vpKarten.vegetarisch || v.vegan !== vpKarten.vegan);
    const verloren = [
      eigeneStaerke ? `Stärke ${m!.fuehrer} / ${m!.unterfuehrer} / ${m!.mannschaft} / ${m!.gesamt}` : "",
      eigeneMwd ? `Geschlecht ${u!.m} m / ${u!.w} w / ${u!.d} d` : "",
      eigeneVp ? `Verpflegung ${v!.vegetarisch} vegetarisch / ${v!.vegan} vegan` : "",
    ].filter(Boolean);
    if (verloren.length > 0) {
      const ja = await frageJaNein({
        titel: "Eingetragene Zahlen verwerfen?",
        text: `Diese Zahlen gehen verloren: ${verloren.join("; ")}. Es zählen wieder die Personenkarten: ${karten.fuehrer} / ${karten.unterfuehrer} / ${karten.mannschaft} / ${karten.gesamt}. Gleich danach holt „Rückgängig“ die Zahlen zurück.`,
        ok: "Zahlen verwerfen",
        abbruch: "Zahlen behalten",
        fokus: "abbruch",
      });
      if (!ja) return;
    }
    aendern({
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      staerkeManuell: undefined,
      unterbringungManuell: undefined,
      verpflegungManuell: undefined,
    });
    if (verloren.length > 0) setZahlenWeg({ vorher, text: verloren.join("; "), nonce: Date.now() });
  }

  // Die Wahl steht in der Schnellerfassung hinter den Zählern, nicht davor (R19-H3: Zähler ohne Vorspann).
  const modusWahl = (
    <p>
      <label className="inline">
        <input
          type="radio"
          name="perfassung"
          checked={!nurStaerke}
          onChange={() => void aufVollstaendig()}
        />
        Personal vollständig erfassen
      </label>
      <label className="inline">
        <input
          type="radio"
          name="perfassung"
          checked={nurStaerke}
          onChange={() => void aufNurStaerke()}
        />
        Nur Stärke (Meldekopf-Schnellerfassung)
      </label>
    </p>
  );

  return (
    <section className="karte">
      <h2>3. Personal</h2>
      {/* Der Assistent fragt Personal vor Fahrzeugen, das Papier hat sie in
          umgekehrter Reihenfolge — wer abtippt, blättert sonst (R4-A8). */}
      {!nurStaerke && (
        <>
          <p className="hinweis">Vom Papier abtippen? Auf dem Blatt stehen die Fahrzeuge oben, das Personal darunter: erst Schritt 4.</p>
          {modusWahl}
        </>
      )}
      {/* „Meldekopf-Schnellerfassung“ nennt eine Funktion des anderen Geräts; wer seinen
          eigenen Bogen ausfüllt, braucht sie nicht (R5-N7). */}
      {!nurStaerke && (
        <p className="hinweis">
          „Nur Stärke“ meldet nur die Zahlen, ohne Namen; die Fahrzeuge folgen in Schritt 4 — gedacht für den Meldekopf, der eine
          Einheit im Stehen aufnimmt. Für den eigenen Bogen „Personal vollständig erfassen“ lassen.
        </p>
      )}

      {nurStaerke && (
        <>
          {/* Zähler statt nackter Zahlenfelder — dieselbe Bauart wie bei der
              Verpflegung darunter. Es sind die Zahlen, um die es in dieser
              Ansicht überhaupt geht: Der Meldekopf nimmt eine eintreffende
              Einheit im Stehen auf, oft mit Handschuh, und zählt sie durch.
              Tippen bleibt möglich (das Feld in der Mitte ist eins), nötig ist
              es nicht mehr. */}
          {/* Die Zahlen starten mit der Vorbelegung nach Einheitstyp (StAN). Wer vom Zettel mit „+"
              aufbaut, addiert sonst zur Sollstärke (Audit Runde 6, R6-A8). */}
          {/* Gebunden an die Gleichheit der Zahlen, nicht an leere Karten: Bei „Bergungsgruppe" tragen
              zwei Karten schon Funktionen, und der Hinweis fehlte (R7-A1). */}
          {bogen.personal.length > 0 &&
            bogen.personal.every(personUnbenannt) &&
            (() => {
              const soll = staerke({ personal: bogen.personal });
              return soll.fuehrer === sm.fuehrer && soll.unterfuehrer === sm.unterfuehrer && soll.mannschaft === sm.mannschaft;
            })() && (
              <p className="hinweis warnung-text">
                Vorgabe nach Einheitstyp (Sollstärke): {SOLL_NICHT_GEMELDET}. Mit der gezählten Stärke überschreiben, nicht dazuzählen.
              </p>
            )}
          <div className="stepper-zeile">
            <Stepper titel="Führer" wert={sm.fuehrer} setzen={(n) => setSm({ fuehrer: n })} />
            <Stepper titel="Unterführer" wert={sm.unterfuehrer} setzen={(n) => setSm({ unterfuehrer: n })} />
            <Stepper titel="Mannschaft" wert={sm.mannschaft} setzen={(n) => setSm({ mannschaft: n })} />
            <Feld titel="Gesamt" schmal>
              {/* Errechnet, nicht getippt: die Summe zieht nach, während der
                  Blick noch im Feld daneben steht — sie quittiert das. */}
              <input ref={gesamtQuittung} value={sm.gesamt} readOnly />
            </Feld>
          </div>
          {modusWahl}
          <div className="zeile">
            <label className="inline">
              <input
                type="checkbox"
                checked={bogen.unterbringungManuell != null}
                onChange={(e) => aendern({ unterbringungManuell: e.target.checked ? { m: 0, w: 0, d: 0 } : undefined })}
              />
              Aufteilung nach Geschlecht angeben (für Unterbringung, WC/Dusche)
            </label>
            {bogen.unterbringungManuell && (
              <>
                {/* Zähler wie bei der Stärke darüber: derselbe Vorgang, dieselbe
                    Bedienung — drei Tippfelder unter drei Zählern wären genau
                    die Ungleichbehandlung, die hier abgestellt wurde. */}
                {/* Ausgeschrieben: „M" stand als Zähler direkt unter
                    „Mannschaft" (R3-N3). */}
                {([["m", "männlich"], ["w", "weiblich"], ["d", "divers"]] as const).map(([g, titel]) => (
                  <Stepper
                    key={g}
                    titel={titel}
                    wert={bogen.unterbringungManuell![g]}
                    setzen={(n) => aendern({ unterbringungManuell: { ...bogen.unterbringungManuell!, [g]: n } })}
                  />
                ))}
              </>
            )}
          </div>
          <h3>Verpflegung</h3>
          <div className="stepper-zeile">
            <Stepper titel="vegetarisch" wert={vp.vegetarisch} setzen={(n) => setVp({ vegetarisch: n })} />
            <Stepper titel="vegan" wert={vp.vegan} setzen={(n) => setVp({ vegan: n })} />
            {/* „1 von 0 vegetarisch" ist keine Auskunft, sondern ein Widerspruch —
                der wird benannt, statt als Bruch dazustehen. */}
            <span className="hinweis stepper-rest">
              {vegSumme > sm.gesamt
                ? `${vegSumme} vegetarisch/vegan — mehr als die Gesamtstärke ${sm.gesamt}`
                : `${vegSumme} von ${sm.gesamt} vegetarisch/vegan · ${sm.gesamt - vegSumme} sonstige`}
            </span>
          </div>
          <h3>Führungskraft / erreichbar für Rückfragen</h3>
          {/* Die Karten stehen unter den Zählern und sehen aus wie gezählt —
              sind es aber nicht. Das muss dranstehen, sonst liest sich
              „Stärke 4" über vier Karten als bestätigt. */}
          {/* Getrennt nach eingetragenen Personen und vorbelegten Plätzen: „Diese 9 Personen zählen nicht
              in die Stärke" über einer eingetragenen Person und acht leeren Plätzen las sich im Probelauf
              als „die soll doch zählen — und wieso 9, ich habe nur eine?". Die Zahl oben ist die Stärke,
              die Karten sind Erreichbarkeiten; die leeren Plätze gehen direkt hier weg. */}
          {bogen.personal.length > 0 && (() => {
            const benannt = bogen.personal.length - unbenannte;
            return (
              <div className="hinweis nur-staerke-erreichbar">
                {benannt > 0 ? (
                  <p>
                    Die Stärke ist allein die Zahl oben — {benannt === 1 ? "die Person hier wird" : `die ${benannt} Personen hier werden`} nicht
                    dazugerechnet. Hier steht nur, wen der Meldekopf bei Rückfragen erreicht (Name, Telefon).
                    {" "}{benannt === 1 ? "Gehört sie zur Einheit, zählt sie" : "Gehören sie zur Einheit, zählen sie"} in der Zahl oben mit.
                  </p>
                ) : (
                  <p>
                    {unbenannte === 1 ? "Diese Karte ist ein vorbelegter Platz" : `Diese ${unbenannte} Karten sind vorbelegte Plätze`} nach
                    Einheitstyp ohne Namen, keine erfassten Personen — die Stärke ist allein die Zahl oben. Wer für Rückfragen erreichbar
                    ist, trägt hier Name und Telefon ein.
                  </p>
                )}
                {unbenannte > 0 && (
                  <p>
                    {benannt > 0 && (unbenannte === 1
                      ? "Die weitere Karte ist ein vorbelegter Platz nach Einheitstyp ohne Namen — hier ohne Bedeutung. "
                      : `Die weiteren ${unbenannte} Karten sind vorbelegte Plätze nach Einheitstyp ohne Namen — hier ohne Bedeutung. `)}
                    <button type="button" onClick={vorbelegungWegnehmen}>
                      Vorbelegung entfernen ({unbenannte === 1 ? "1 Person ohne Namen" : `${unbenannte} Personen ohne Namen`})
                    </button>
                  </p>
                )}
              </div>
            );
          })()}
        </>
      )}
      {!nurStaerke && (
        <p className="hinweis">
          Stärke (abgeleitet):{" "}
          <strong
            ref={staerkeQuittung}
            title={STAERKE_LEGENDE}
            aria-label={`Stärke: ${staerkeVorlesen(s)}`}
          >
            {s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt}
          </strong>
          {" "}<span className="legende">({STAERKE_LEGENDE})</span>
          {" · "}
          {/* Ausgeschrieben: „M" heißt in derselben Zeile schon Mannschaft (R3-N3). */}
          <span title={MWD_LEGENDE}>Geschlecht: {mwdText(mwd)}</span>
        </p>
      )}

      {/* Schritt-Index 2 = Personal (siehe SCHRITTE in app.tsx): nur die
          Punkte dieses Schritts; Zugehörigkeit und Ort/Auftrag stehen dort,
          wo man sie behebt, und gesammelt in der Übersicht. */}
      <Hinweise punkte={pruefpunkte(bogen, false)} aktuellerSchritt={2} />
      {/* Der Weg zur Behebung steht an der Warnung (R8-W4): Der Knopf unter der Liste lag fünf
          Bildschirme tiefer. Gleiche Handlung, mit Rückweg. */}
      {!nurStaerke && unbenannte > 0 && bogen.personal.some(personLeer) && (
        <p>
          <button type="button" onClick={vorbelegungWegnehmen}>
            Vorbelegung entfernen ({unbenannte === 1 ? "1 Person ohne Namen" : `${unbenannte} Personen ohne Namen`})
          </button>
        </p>
      )}

      {/* Ansichtswahl: Detail-Karten (alle Felder) oder Schnelleingabe-Tabelle
          (viele Personen zügig erfassen); dazu Mehrzeilen-Import fertiger Listen. */}
      {!nurStaerke && (
        <p className="ansicht-wahl">
          <label className="inline">
            <input type="radio" name="pansicht" checked={!schnell} onChange={() => { setSchnell(false); setFokusNeue(false); }} />
            Alle Angaben (Karten)
          </label>
          <label className="inline">
            <input type="radio" name="pansicht" checked={schnell} onChange={() => { setSchnell(true); setFokusNeue(false); }} />
            Kurz-Liste (Tabelle)
          </label>
          {/* Der häufige Fall im Einsatz: eine Person kommt nach. Unten am
              Ende der Liste lag „+ Person hinzufügen" bei zehn Personen 18
              Bildschirme tief (Audit Runde 3, R3-H6). Von hier springt die
              Ansicht auf die neue Person, der Cursor steht im Vornamen. */}
          {bogen.personal.length >= 2 && (
            <button type="button" aria-label="+ Person hinzufügen (springt zur neuen Person)" onClick={personObenHinzufuegen}>
              + Person hinzufügen
            </button>
          )}
          <button type="button" onClick={() => namenDialog.current?.showModal()}>
            Namen einfügen…
          </button>
          {nachzuegler.length > 0 && (
            <button type="button" onClick={() => void ausVorlageErgaenzen()}>
              Aus der Vorlage ergänzen… ({nachzuegler.length})
            </button>
          )}
        </p>
      )}
      {/* Die Karten sind die lange Wahl: Wer viele Personen hat und in den Karten
          steht, bekommt den kürzeren Weg genannt (R5-H2). */}
      {!nurStaerke && !schnell && bogen.personal.length > VIELE_PERSONEN && (
        <p className="hinweis viele-personen">
          Viele Personen — die Kurz-Liste (eine Zeile je Person) zeigt mehr auf einmal.
        </p>
      )}
      {/* Die Regel zur ersten Person stand in der Kurz-Liste nur im Tooltip von „⇑“, den es
          auf dem Telefon nicht gibt (R5-N8). */}
      {!nurStaerke && bogen.personal.length >= 2 && (
        <p className="hinweis ansprech-regel">
          Die erste Person ist die Ansprechperson (erreichbar für Rückfragen). „⇑“ setzt eine Person ganz nach oben — und damit an diese Stelle.
        </p>
      )}
      {quittung}
      {!nurStaerke && schnell ? (
        bogen.personal.length > 0 && (
          <PersonalSchnellTabelle
            personal={bogen.personal}
            aendern={(p) => aendern({ personal: p })}
            fokusNeue={fokusNeue}
            aufNeueFokus={() => setFokusNeue(true)}
            verschieben={personVerschieben}
            entfernt={personEntfernt}
            org={bogen.einheit.organisation}
            einheitsDienststelle={bogen.einheit.hierarchie[0]?.name ?? ""}
            ovVerzeichnis={ovVerzeichnis}
          />
        )
      ) : (
        bogen.personal.map((p, i) => (
          <Fragment key={i}>
          <PersonKarte
            key={i}
            person={p}
            org={bogen.einheit.organisation}
            vorschlaege={vorschlaege}
            berufVorschlaege={berufVorschlaege}
            haeufigeFunktionen={funktionsauswahl}
            frisch={p === frischeKarte}
            neueVorgabe={p === vorgabeKarte}
            index={i}
            anzahl={bogen.personal.length}
            ansprech={!nurStaerke && i === 0}
            ansprechSatz={!nurStaerke && i === 0 ? ansprechWechselSatz(bogen.personal) : undefined}
            einheitsDienststelle={bogen.einheit.hierarchie[0]?.name ?? ""}
            ovVerzeichnis={ovVerzeichnis}
            nichtGezaehlt={nurStaerke}
            verschieben={personVerschieben}
            aendern={(np) => aendern({ personal: bogen.personal.map((x, j) => (j === i ? np : x)) })}
            entfernen={(ort) => {
              const rest = bogen.personal.filter((_, j) => j !== i);
              if (personLeer(p)) aendern({ personal: rest });
              else {
                aendern({ personal: rest });
                personEntfernt(p, i, personBezeichnung(p, i));
                setNachEntfernen({ index: i, ort });
              }
            }}
          />
          </Fragment>
        ))
      )}
      {rueckweg?.art === "person" && (
        <DaumenQuittung key={`person:${rueckweg.nonce}`} onRueckgaengig={rueckgaengig} onSchliessen={() => setRueckweg(null)}>
          <strong>Entfernt:</strong> {entferntText(rueckweg.entfernte)}
        </DaumenQuittung>
      )}
      {ansprechWeg && !rueckweg && !zahlenWeg && (
        <DaumenQuittung
          key={`ansprech:${ansprechWeg.nonce}`}
          prellschutz
          onRueckgaengig={() => {
            setAnsprechWechsel(null);
            aendernRoh(verpflegungMitziehen(bogen, { personal: ansprechWeg.vorher }));
          }}
          rueckgaengigName="Wechsel der Ansprechperson rückgängig machen"
          onSchliessen={() => setAnsprechWechsel(null)}
        >
          <strong>Neue Ansprechperson:</strong> {ansprechWeg.name}
        </DaumenQuittung>
      )}
      {zahlenWeg && (
        <DaumenQuittung
          key={`zahlen:${zahlenWeg.nonce}`}
          onRueckgaengig={() => {
            aendern(zahlenWeg.vorher);
            setZahlenWeg(null);
          }}
          onSchliessen={() => setZahlenWeg(null)}
        >
          <strong>Zahlen verworfen:</strong> {zahlenWeg.text}
        </DaumenQuittung>
      )}
      {zurueckgeholt && !rueckweg && !zahlenWeg && (
        <DaumenQuittung key={`zurueck:${zurueckgeholt.nonce}`} onSchliessen={() => setZurueckgeholt(null)}>
          {zurueckgeholt.text}
        </DaumenQuittung>
      )}
      <button
        type="button"
        className="primaer"
        // Wie der Knopf über der Liste (R5-H3): Die neue Karte erscheint ÜBER dem
        // Knopf, den man gerade gedrückt hat — der Blick liegt unten. Die Ansicht
        // springt zu ihr, und der Cursor steht im Vornamen; vorher blieb der
        // Fokus auf diesem Knopf, 700 px unter dem Bild.
        onClick={personObenHinzufuegen}
      >
        + Person hinzufügen
      </button>

      {/* Vorbelegungs-Knöpfe unter der Liste: oben schoben sie das erste
          Namensfeld rund 900 px tief (R2-N8). */}
      {/* Der Rückweg zur Vorbelegung aus Schritt 1: entfernt nur Karten ohne
          Namen und Erreichbarkeit — deshalb ohne Rückfrage (Rückfrage-Regel:
          verloren geht nichts Erfasstes). Was jemand ausgefüllt hat, bleibt. */}
      {/* Nur ein Weg (R13-N2): Steht der Knopf schon an der Warnung oben oder im „Nur Stärke"-Hinweis, entfällt er hier. */}
      {!nurStaerke && unbenannte > 0 && !bogen.personal.some(personLeer) && (
        <p>
          <button type="button" onClick={vorbelegungWegnehmen}>
            Vorbelegung entfernen ({unbenannte === 1 ? "1 Person ohne Namen" : `${unbenannte} Personen ohne Namen`})
          </button>
        </p>
      )}

      {!nurStaerke && vorlage.length > 0 && (
        <p>
          <button
            type="button"
            disabled={stanGeladen}
            title={
              stanGeladen
                ? "Die Sollplätze der StAN stehen schon genau so in der Liste — es gäbe nichts zu ersetzen."
                : undefined
            }
            onClick={async () => {
              // Die Rückfrage nennt, was verloren geht: „ersetzt" las niemand
              // als „deine eingetragenen Namen werden gelöscht" — und weil die
              // Stärke gleich blieb, fiel der Verlust nicht auf (R2-N2).
              const namen = bogen.personal.filter((p) => !personUnbenannt(p)).map((p, i) => personBezeichnung(p, i));
              if (
                bogen.personal.length === 0 ||
                (await frageJaNein({
                  titel: "StAN-Sollplätze laden?",
                  text:
                    `Die aktuelle Personalliste (${bogen.personal.length} Personen) wird durch die ${vorlage.length} Sollplätze der StAN ersetzt.` +
                    (namen.length > 0
                      ? ` Dabei ${namen.length === 1 ? "geht 1 eingetragener Name" : `gehen ${namen.length} eingetragene Namen`} verloren: ${namen.slice(0, 5).join(", ")}${namen.length > 5 ? " …" : ""}.`
                      : ""),
                  ok: namen.length > 0 ? "Ersetzen, Namen löschen" : "Ersetzen",
                  gefahr: namen.length > 0,
                }))
              ) {
                aendernMitRueckweg(vorlage, `StAN-Sollplätze geladen${namen.length > 0 ? ` — ${namen.length} Namen entfernt` : ""}.`);
              }
            }}
          >
            StAN-Sollplätze laden ({vorlage.length} Personen)
          </button>
          {/* Der Titel allein reicht nicht: auf dem Telefon gibt es kein
              Mauszeiger-Fähnchen, und ein grauer Knopf ohne Begründung liest
              sich wie ein Fehler. */}
          {stanGeladen && (
            <span className="hinweis"> Schon geladen — die {vorlage.length} Sollplätze stehen unten in der Liste.</span>
          )}
        </p>
      )}

      <dialog ref={namenDialog} aria-label="Namen einfügen">
        <div className="kopfzeile">
          <h2>Namen einfügen</h2>
          <button type="button" onClick={() => namenDialog.current?.close()}>Schließen</button>
        </div>
        <p className="hinweis">
          Eine Person je Zeile — als „Nachname, Vorname" oder „Vorname Nachname".
          Praktisch, wenn die Liste schon existiert (Nachricht, Tabelle, Zettel):
          einfach hier hineinkopieren.
        </p>
        {/* Liste, Vorschau, Reihenfolge und Beispielnamen laden nach (namen-dialog.tsx). */}
        <Suspense fallback={<p className="hinweis" role="status">Wird geladen …</p>}>
          <NamenInhalt bogen={bogen} onUebernehmen={namenUebernehmen} onBeispiele={beispielnamenUebernehmen} />
        </Suspense>
      </dialog>
    </section>
  );
}
