/**
 * Schritt 3 — Personal: Detail-Karten, Schnelleingabe-Tabelle, Namens-Import
 * und die Meldekopf-Schnellerfassung (nur Stärke).
 */

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
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
  Person,
  PersonalErfassung,
  StaerkeRolle,
  type VokabularWert,
  alleFahrerlaubnisse,
  staerke,
  unterbringungMWD,
  verpflegung,
} from "@bos/eeb-format/model";
import { namenEinsetzen, parseNamen } from "../personal-schnell";
import { beispielPersonen } from "../beispielnamen";
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
import { nachzueglerFuer } from "../vorlage-nachzuegler";
import { TabellenScroll } from "../tabellen-scroll";
import {
  Feld,
  FREMDE_DATEN,
  Auswahl,
  Hinweise,
  MWD_LEGENDE,
  STAERKE_LEGENDE,
  Stepper,
  VokabListe,
  type FreitextVorschlag,
  staerkeVorlesen,
  zahl,
  type SchrittProps,
} from "./bausteine";

/** Rollen-Beschriftung für die Einfüge-Vorschau — dieselben Wörter wie im Auswahlfeld. */
const ROLLE_LABEL: Record<StaerkeRolle, string> = {
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
 * Tipphilfe für die Zusatzqualifikationen: für alle die Berufsbezeichnungen,
 * bei der DLRG davor deren Ausbildungskennzahlen (401, 715, 1011 …) — die
 * Fachliste steht vorn, weil sie bei gleichwertigem Treffer die gemeinte ist
 * und mit 56 Einträgen gegen 700 Berufe sonst untergeht.
 */
function useQualiVorschlaege(aktiv: boolean, org: OrganisationsTyp): readonly FreitextVorschlag[] {
  const dlrg = org === OrganisationsTyp.DLRG;
  const [berufe, setBerufe] = useState(berufeCache);
  const [dlrgQuali, setDlrgQuali] = useState(dlrgQualiCache);
  useEffect(() => {
    if (!aktiv || berufe) return;
    void import("@bos/vokabulare/berufe").then((m) => {
      berufeCache = m.BERUFE;
      setBerufe(berufeCache);
    });
  }, [aktiv, berufe]);
  useEffect(() => {
    if (!aktiv || !dlrg || dlrgQuali) return;
    void import("@bos/vokabulare/dlrg-qualifikationen").then((m) => {
      dlrgQualiCache = m.DLRG_QUALIFIKATIONEN;
      setDlrgQuali(dlrgQualiCache);
    });
  }, [aktiv, dlrg, dlrgQuali]);
  return useMemo(
    () => [...(dlrg ? (dlrgQuali ?? []) : []), ...(berufe ?? [])],
    [dlrg, dlrgQuali, berufe],
  );
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
              onChange={(e) => set(i, { art: Number(e.target.value), emailTemplate: undefined, wert: "" })}
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
            <input
              type={k.art === KontaktArt.EMAIL ? "email" : "tel"}
              inputMode={k.art === KontaktArt.EMAIL ? "email" : "tel"}
              {...FREMDE_DATEN}
              value={k.wert ?? ""}
              onChange={(e) =>
                set(i, {
                  emailTemplate: undefined,
                  wert: k.art === KontaktArt.EMAIL ? e.target.value : e.target.value.replace(/\D/g, ""),
                })
              }
            />
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
      {index > 0 && (
        /* Ohne diesen Weg braucht die zwölfte Person elf Klicks nach oben —
           und genau die zuletzt angelegte Vertretung gehört dorthin. */
        <button
          type="button"
          aria-label={`Person ${index + 1} an die erste Stelle`}
          title="An die erste Stelle — gilt im PDF und in der Meldung als erreichbar für Rückfragen"
          onClick={() => verschieben(index, 0, gruppe, "hoch")}
        >
          ⇑
        </button>
      )}
    </span>
  );
}

function PersonKarte(props: {
  person: Person;
  org: OrganisationsTyp;
  vorschlaege: readonly FreitextVorschlag[];
  /** Häufigste Funktionen der Einheit — das leere Funktionsfeld bietet sie zum Antippen an (R2-G5). */
  haeufigeFunktionen: readonly VokabularWert[];
  /** Gerade hinzugefügt: die Karte stempelt sich einmal ein. */
  frisch?: boolean;
  /** Stelle in der Liste und Listenlänge — für die Umsortier-Knöpfe. */
  index: number;
  anzahl: number;
  /** Erste Person eines vollständig erfassten Bogens: sie meldet der Empfänger an. */
  ansprech?: boolean;
  /** Meldekopf-Schnellerfassung: die Karte zählt nicht in die Stärke — das steht dran. */
  nichtGezaehlt?: boolean;
  aendern: (p: Person) => void;
  /** `ort`: Stelle des Tipps auf „Person entfernen" (Bildschirm), sofern getippt. */
  entfernen: (ort?: { x: number; y: number }) => void;
  verschieben: (von: number, nach: number, gruppe: "karte" | "zeile", art: "hoch" | "runter") => void;
}) {
  const { person: p, org, vorschlaege, haeufigeFunktionen, frisch, index, anzahl, ansprech, nichtGezaehlt, aendern, entfernen, verschieben } = props;
  const karte = useRef<HTMLDivElement>(null);
  useEinzugsstempel(karte, frisch);
  const bezeichnung = personBezeichnung(p, index);
  const set = (patch: Partial<Person>) => aendern({ ...p, ...patch });
  const funktionen = vokabularFuer(org, "funktion");
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
              text: "Die erfassten Angaben dieser Person gehen verloren — Name, Funktionen, Qualifikationen und Erreichbarkeiten.",
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
              <Auswahl value={p.geschlecht} onChange={(e) => set({ geschlecht: Number(e.target.value) })}>
                <option value={Geschlecht.M}>M</option>
                <option value={Geschlecht.W}>W</option>
                <option value={Geschlecht.D}>D</option>
              </Auswahl>
            </Feld>
            <Feld titel="Ernährung" schmal>
              <Auswahl value={p.ernaehrung} onChange={(e) => set({ ernaehrung: Number(e.target.value) })}>
                <option value={Ernaehrung.FLEISCH}>Fleisch</option>
                <option value={Ernaehrung.VEGETARISCH}>Vegetarisch</option>
                <option value={Ernaehrung.VEGAN}>Vegan</option>
              </Auswahl>
            </Feld>
            <FahrerlaubnisFeld person={p} set={set} />
          </div>
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
          {/* Zusatzqualifikationen kennen kein Code-Vokabular: Beruf, Lehrgang oder
              externe Berechtigung wandern als Freitext in den Bogen. Die
              Berufsbezeichnungen aus KldB und BERUFENET und die
              DLRG-Ausbildungskennzahlen dienen nur als Tipphilfe. */}
          <Feld titel="Weitere Qualifikationen">
            <VokabListe
              werte={p.zusatzqualifikationen}
              aendern={(w) => set({ zusatzqualifikationen: w })}
              tabelle={[]}
              freitextVorschlaege={vorschlaege}
              hinzufuegenText="Qualifikation"
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
}) {
  const { personal, aendern, fokusNeue, aufNeueFokus, verschieben, entfernt, org } = props;
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
        text: "Die erfassten Angaben dieser Person gehen verloren — Name, Funktionen, Qualifikationen und Erreichbarkeiten.",
        ok: "Person entfernen",
        gefahr: true,
      }))
    ) {
      return;
    }
    aendern(personal.filter((_, j) => j !== i));
    if (!personLeer(p)) entfernt(p, i, bezeichnung);
  }

  function enterWeiter(e: ReactKeyboardEvent, i: number) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (i === personal.length - 1) {
      aufNeueFokus();
      aendern([...personal, neuePerson()]);
      return;
    }
    // Nicht letzte Zeile: in derselben Spalte eine Zeile nach unten.
    const zelle = (e.target as HTMLElement).closest("td");
    const zeile = zelle?.parentElement;
    if (!zelle || !zeile) return;
    const spalte = Array.from(zeile.children).indexOf(zelle);
    const naechste = zeile.nextElementSibling?.children[spalte]?.querySelector<HTMLElement>("input, select");
    naechste?.focus();
  }

  return (
    <TabellenScroll titel="Personal-Schnelleingabe">
      {/* Rollen ausdrücklich: auf dem Telefon legt index.html jede Zeile als
          Raster aus (R4-H2) — Browser verlieren dann die Tabellen-Semantik. */}
      <table className="uebersicht schnell-tabelle" role="table">
        <thead role="rowgroup">
          <tr role="row"><th role="columnheader">Stelle</th><th role="columnheader">Vorname</th><th role="columnheader">Nachname</th><th role="columnheader">Zählt als</th><th role="columnheader">Geschlecht</th><th role="columnheader" aria-label="Reihenfolge" /><th role="columnheader" aria-label="Entfernen" /></tr>
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
function benannte(personal: Person[]): Person[] {
  return personal.filter((p) => !personUnbenannt(p));
}

/** Kurzbeschreibung eines Sollplatzes für die Namensvorschau: Funktion, sonst Rolle. */
function platzText(p: Person, org: OrganisationsTyp): string {
  const funktion = p.funktionen
    .map((f) => vokabText(f, vokabularFuer(org, "funktion"), "kurz"))
    .filter(Boolean)
    .join(", ");
  return funktion || ROLLE_LABEL[p.staerkeRolle];
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
  type Rueckweg =
    | { art: "liste"; text: string; personal: Person[] }
    | { art: "person"; name: string; person: Person; index: number; nonce: number };
  const [rueckweg, setRueckweg] = useState<Rueckweg | null>(null);
  // Quittung des Zurückholens (ohne weiteren Rückweg, wie in der Einsatzansicht).
  const [zurueckgeholt, setZurueckgeholt] = useState<{ text: string; nonce: number } | null>(null);
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
  /** Eine Person ist weg: Rückweg in der Daumenleiste. */
  const personEntfernt = (person: Person, index: number, bezeichnung: string) => {
    setZurueckgeholt(null);
    setRueckweg({ art: "person", name: bezeichnung, person, index, nonce: Date.now() });
  };
  const rueckgaengig = () => {
    if (!rueckweg) return;
    if (rueckweg.art === "liste") {
      aendern({ personal: rueckweg.personal });
      return;
    }
    const liste = [...bogen.personal];
    const stelle = Math.min(rueckweg.index, liste.length);
    liste.splice(stelle, 0, rueckweg.person);
    setRueckweg(null);
    setFrischeKarte(rueckweg.person);
    setZurueckgeholt({ text: `Zurückgeholt: ${rueckweg.name} (wieder Person ${stelle + 1})`, nonce: Date.now() });
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
  // Schnelleingabe: Tabellenansicht statt Detail-Karten; `fokusNeue` lässt den
  // Fokus beim Anlegen per Enter in die neue Zeile springen.
  const [schnell, setSchnell] = useState(false);
  const [fokusNeue, setFokusNeue] = useState(false);
  // Objektidentität statt Index — siehe fahrzeuge.tsx: ein Index rutscht beim
  // Löschen einer anderen Karte auf eine bestehende.
  const [frischeKarte, setFrischeKarte] = useState<Person | null>(null);
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
  // Nach dem Verschieben wandert der Fokus mit der Person. Ohne das zeigt der
  // gerade gedrückte Knopf auf die Nachbarperson, die nachgerückt ist: der
  // zweite Klick hebt dann die falsche. Gemerkt wird die Zielstelle, der
  // Effekt sucht den Knopf, wenn die Liste neu steht.
  const [fokusSortierung, setFokusSortierung] = useState<string | null>(null);
  const namenDialog = useRef<HTMLDialogElement>(null);
  const [namenText, setNamenText] = useState("");
  const namenVorschau = parseNamen(namenText);
  // Dubletten kennzeichnen — in der Liste selbst und gegenüber schon
  // erfassten Personen. Übernommen werden sie trotzdem (zwei gleichnamige
  // Helfer gibt es), aber nicht unbemerkt (Audit „Fehler", E6).
  const namensSchluessel = (v: string, n: string) => `${n.trim().toLowerCase()}|${v.trim().toLowerCase()}`;
  const schonErfasst = new Set(bogen.personal.map((p) => namensSchluessel(p.vorname, p.nachname)));
  const vorschauDoppelt = namenVorschau.map((n, i) => {
    const k = namensSchluessel(n.vorname, n.nachname);
    return schonErfasst.has(k) || namenVorschau.findIndex((m) => namensSchluessel(m.vorname, m.nachname) === k) < i;
  });
  const anzahlDoppelt = vorschauDoppelt.filter(Boolean).length;
  // Wohin jeder Name kommt — freie Sollplätze zuerst (R2-N2). Die Vorschau
  // zeigt es, bevor übernommen wird.
  const vorschauPlaetze = namenEinsetzen(bogen.personal, namenVorschau.map(personAusZeile), personUnbenannt).plaetze;
  // Anzahl für den Beispielnamen-Generator (nur Übungsbögen). Vorgabe 9:
  // Trupp bis Gruppe, die häufigste Größenordnung in Übungslagen.
  const [beispielAnzahl, setBeispielAnzahl] = useState(9);

  /**
   * Eingefügte Zeile → Person. Das Funktionsfeld wandert in die Funktionsliste
   * (als Vokabeleintrag, wenn das Kürzel im Vokabular der Organisation steht,
   * sonst als Freitext) und bringt die Stärke-Rolle mit — ohne das zählte ein
   * eingefügter Zugführer als Mannschaft.
   */
  function personAusZeile(n: (typeof namenVorschau)[number]) {
    const person = { ...neuePerson(), vorname: n.vorname, nachname: n.nachname };
    if (n.rolle != null) person.staerkeRolle = n.rolle;
    if (n.funktion) {
      const tabelle = vokabularFuer(bogen.einheit.organisation, "funktion");
      const gesucht = n.funktion.toLowerCase();
      const treffer = tabelle.find(
        (v) => v.kurz?.toLowerCase() === gesucht || v.name.toLowerCase() === gesucht,
      );
      person.funktionen = [treffer ? { code: treffer.code } : { freitext: n.funktion }];
    }
    return person;
  }

  function namenUebernehmen() {
    if (namenVorschau.length === 0) return;
    const { personal, plaetze } = namenEinsetzen(bogen.personal, namenVorschau.map(personAusZeile), personUnbenannt);
    const eingesetzt = plaetze.filter((x) => x != null).length;
    aendernMitRueckweg(
      personal,
      `${namenVorschau.length} ${namenVorschau.length === 1 ? "Name" : "Namen"} übernommen` +
        (eingesetzt > 0 ? ` — ${eingesetzt} davon in freie Sollplätze.` : "."),
    );
    setSchnell(true); // die frisch eingefügten Namen direkt als Tabelle zeigen
    setNamenText("");
    namenDialog.current?.close();
  }

  function beispielnamenUebernehmen() {
    const anzahl = Math.max(1, Math.min(99, beispielAnzahl));
    const bestand = benannte(bogen.personal);
    aendern({ personal: [...bestand, ...beispielPersonen(anzahl, bestand)] });
    setSchnell(true);
    namenDialog.current?.close();
  }
  useEffect(() => {
    if (fokusSortierung == null) return;
    setFokusSortierung(null);
    const ersatz = fokusSortierung.endsWith("hoch") ? "runter" : "hoch";
    const knopf = (wahl: string) => document.querySelector<HTMLButtonElement>(`[data-sortier="${wahl}"]`);
    // Am Listenrand ist der gedrückte Knopf gesperrt — dann den anderen nehmen,
    // damit der Fokus nicht auf den Seitenanfang zurückfällt.
    const ziel = knopf(fokusSortierung);
    (ziel && !ziel.disabled ? ziel : knopf(fokusSortierung.replace(/(hoch|runter)$/, ersatz)))?.focus();
  }, [fokusSortierung]);

  /**
   * Eine Person an eine andere Stelle setzen. `gruppe` und `art` sagen nur, wo
   * der Fokus danach hingehört (Karte oder Tabellenzeile, oberer oder unterer
   * Knopf) — die Liste selbst kennt keine Ansichten.
   */
  function personVerschieben(von: number, nach: number, gruppe: "karte" | "zeile", art: "hoch" | "runter") {
    if (nach < 0 || nach >= bogen.personal.length) return;
    aendern({ personal: verschoben(bogen.personal, von, nach) });
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
    const abgeleitet = staerke({ personal: bogen.personal });
    if (
      erfasst > 0 &&
      !(await frageJaNein({
        titel: "Nur die Stärke melden?",
        text: `${erfasst === 1 ? "1 erfasste Person zählt" : `${erfasst} erfasste Personen zählen`} dann nicht mehr einzeln — die Stärke wird von Hand geführt und startet mit ${abgeleitet.fuehrer} / ${abgeleitet.unterfuehrer} / ${abgeleitet.mannschaft} / ${abgeleitet.gesamt}. Die Namen bleiben als Erreichbarkeiten erhalten.`,
        ok: "Nur Stärke melden",
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

  return (
    <section className="karte">
      <h2>3. Personal</h2>
      <p>
        <label className="inline">
          <input
            type="radio"
            name="perfassung"
            checked={!nurStaerke}
            onChange={() =>
              // Die manuellen Zahlen gehören zur Schnellerfassung — zurück in
              // der Vollerfassung zählen wieder die Karten, auch bei der
              // Verpflegung (sonst überdeckte die manuelle Aufteilung die
              // Ernährungsangaben der Personen).
              aendern({
                personalErfassung: PersonalErfassung.VOLLSTAENDIG,
                staerkeManuell: undefined,
                unterbringungManuell: undefined,
                verpflegungManuell: undefined,
              })
            }
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

      {nurStaerke && (
        <>
          {/* Zähler statt nackter Zahlenfelder — dieselbe Bauart wie bei der
              Verpflegung darunter. Es sind die Zahlen, um die es in dieser
              Ansicht überhaupt geht: Der Meldekopf nimmt eine eintreffende
              Einheit im Stehen auf, oft mit Handschuh, und zählt sie durch.
              Tippen bleibt möglich (das Feld in der Mitte ist eins), nötig ist
              es nicht mehr. */}
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
          {bogen.personal.length > 0 && (
            <p className="hinweis">
              {bogen.personal.length === 1 ? "Diese Person zählt" : `Diese ${bogen.personal.length} Personen zählen`} nicht in die
              Stärke — die steht oben von Hand. Hier stehen nur die Erreichbarkeiten für Rückfragen.
            </p>
          )}
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
          <button type="button" onClick={() => { setNamenText(""); namenDialog.current?.showModal(); }}>
            Namen einfügen…
          </button>
          {nachzuegler.length > 0 && (
            <button type="button" onClick={() => void ausVorlageErgaenzen()}>
              Aus der Vorlage ergänzen… ({nachzuegler.length})
            </button>
          )}
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
            haeufigeFunktionen={funktionsauswahl}
            frisch={p === frischeKarte}
            index={i}
            anzahl={bogen.personal.length}
            ansprech={!nurStaerke && i === 0}
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
          <strong>Entfernt:</strong> {rueckweg.name}
        </DaumenQuittung>
      )}
      {zurueckgeholt && !rueckweg && (
        <DaumenQuittung key={`zurueck:${zurueckgeholt.nonce}`} onSchliessen={() => setZurueckgeholt(null)}>
          {zurueckgeholt.text}
        </DaumenQuittung>
      )}
      <button
        type="button"
        className="primaer"
        onClick={() => {
          setFokusNeue(true);
          // Die neue Karte erscheint ÜBER dem Knopf, den man gerade gedrückt
          // hat — der Blick liegt unten. Der Stempel sagt, wohin er soll.
          const neu = neuePerson();
          setFrischeKarte(neu);
          aendern({ personal: [...bogen.personal, neu] });
        }}
      >
        + Person hinzufügen
      </button>

      {/* Vorbelegungs-Knöpfe unter der Liste: oben schoben sie das erste
          Namensfeld rund 900 px tief (R2-N8). */}
      {/* Der Rückweg zur Vorbelegung aus Schritt 1: entfernt nur Karten ohne
          Namen und Erreichbarkeit — deshalb ohne Rückfrage (Rückfrage-Regel:
          verloren geht nichts Erfasstes). Was jemand ausgefüllt hat, bleibt. */}
      {unbenannte > 0 && (
        <p>
          <button
            type="button"
            onClick={() => aendern({ personal: benannte(bogen.personal) })}
          >
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
        {/* Sichtbare Beschriftung statt nur Platzhalter: der verschwand mit
            der ersten Eingabe, und mit ihm der Name des Felds (R2-M5). */}
        <label className="feld">
          Namensliste (eine Person je Zeile)
          <textarea
            rows={8}
            value={namenText}
            onChange={(e) => setNamenText(e.target.value)}
            placeholder={"Muster, Max\nErika Musterfrau\n…"}
            style={{ width: "100%" }}
          />
        </label>
        {/* Vorschau: Wer welche Rolle bekommt, entscheidet über die gemeldete
            Stärke — das darf nicht erst im fertigen Bogen auffallen. */}
        {namenVorschau.length > 0 && (
          <ul className="namen-vorschau">
            {namenVorschau.map((n, i) => (
              <li key={i}>
                {[n.nachname, n.vorname].filter(Boolean).join(", ")}
                {n.funktion ? ` · ${n.funktion}` : ""}
                {" · "}
                <strong>
                  {vorschauPlaetze[i] != null
                    ? `→ Platz ${vorschauPlaetze[i]! + 1}: ${platzText(bogen.personal[vorschauPlaetze[i]!]!, bogen.einheit.organisation)}`
                    : ROLLE_LABEL[n.rolle ?? StaerkeRolle.MANNSCHAFT]}
                </strong>
                {vorschauDoppelt[i] && <span className="uebung-badge">doppelt</span>}
              </li>
            ))}
          </ul>
        )}
        {anzahlDoppelt > 0 && (
          <p className="warnung" role="status">
            {anzahlDoppelt === 1 ? "Ein Name steht" : `${anzahlDoppelt} Namen stehen`} doppelt — in der Liste oder
            schon im Bogen. Übernommen werden sie trotzdem; wenn es dieselbe Person ist, die Zeile vorher löschen.
          </p>
        )}
        <p>
          <button type="button" className="primaer" disabled={namenVorschau.length === 0} onClick={namenUebernehmen}>
            {namenVorschau.length === 0
              ? "Übernehmen"
              : `${namenVorschau.length} ${namenVorschau.length === 1 ? "Person" : "Personen"} übernehmen`}
          </button>
        </p>
        {/* Beispielnamen nur bei Übungsbögen (Haken in Schritt 2): im echten
            Einsatz existiert dieser Weg gar nicht erst — künstliche Daten
            lassen sich dort auch nicht versehentlich erzeugen. */}
        {bogen.uebung && (
          <>
            <h3>Beispielnamen (Übung)</h3>
            <p className="hinweis">
              Erzeugt erkennbar fiktive Personen mit zufälligem Namen, Geschlecht, Ernährung
              und Fahrerlaubnis; Führungs- und Unterführerplätze werden passend zur Stärke verteilt.
            </p>
            <div className="zeile">
              <Feld titel="Anzahl" schmal>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={beispielAnzahl}
                  onChange={(e) => setBeispielAnzahl(zahl(e.target.value))}
                />
              </Feld>
              <button type="button" onClick={beispielnamenUebernehmen}>
                Beispielpersonen einfügen
              </button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
