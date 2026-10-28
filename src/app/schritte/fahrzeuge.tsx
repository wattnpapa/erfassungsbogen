/**
 * Schritt 4 — Fahrzeuge: Typ, Kennzeichen, Funkrufname und StAN-Vorbelegung.
 */

import { useRef, useState } from "react";
import { Fahrzeug, OrganisationsTyp } from "@bos/eeb-format/model";
import { sitzplaetzeRichtwert } from "@bos/vokabulare/sitzplaetze";
import { fahrzeugVorbelegung, funkrufOrtsverband } from "../../vokabulare/thw-funkrufname-ort";
import {
  fahrzeugBezeichnung,
  fahrzeugHinweise,
  fahrzeugLeer,
  fahrzeugUnbenannt,
  neuesFahrzeug,
  ortOhneZusatz,
  transportBilanz,
  vokabText,
  vokabularFuer,
  vorbelegungGeladen,
} from "../hilfen";
import { FahrzeugZeichen } from "../zeichen-bild";
import { frageJaNein } from "../dialoge";
import { kennzeichenHinweis, kennzeichenSchreibweise } from "../schreibweise";
import { einheitOrt } from "@bos/meldekopf/darstellung";
import { mitAbgang, useEinzugsstempel } from "../eintrag-bewegung";
import { DaumenQuittung } from "../daumen-quittung";
import { FAHRZEUG_WEG_SCHLUESSEL, funkrufHolen, funkrufMerken, rueckwegHolen, rueckwegMerken } from "../rueckweg-sitzung";
import {
  Auswahl,
  Feld,
  Hinweise,
  KennzahlenFeld,
  KENNUNG_EINGABE,
  NAMEN_EINGABE,
  VokabAuswahl,
  useZahlEingabe,
  type SchrittProps,
} from "./bausteine";

function FahrzeugKarte(props: {
  fahrzeug: Fahrzeug;
  org: OrganisationsTyp;
  /** Standort der Einheit aus Schritt 1 — erklärt „eigener Standort". */
  standort: string;
  /** Berlin: Kennzahl des eigenen OV, die im Funkrufnamen vorn steht. */
  ovKennzahl?: number;
  /** Gerade hinzugefügt: die Karte stempelt sich einmal ein. */
  frisch?: boolean;
  /** Stelle in der Liste und Listenlänge — benennt die Karte, solange kein Typ steht. */
  index: number;
  anzahl: number;
  aendern: (f: Fahrzeug) => void;
  entfernen: () => void;
}) {
  const { fahrzeug: f, org, standort, ovKennzahl, frisch, index, anzahl, aendern, entfernen } = props;
  const bezeichnung = fahrzeugBezeichnung(f, index, org);
  const richtwert = sitzplaetzeRichtwert(f, vokabularFuer(org, "fahrzeug"));
  const typLang = f.typ.code != null ? vokabText(f.typ, vokabularFuer(org, "fahrzeug"), "name") : "";
  const karte = useRef<HTMLDivElement>(null);
  // „Stimmt das?" zum THW-Kennzeichen erst nach dem Verlassen des Felds, nicht während des Tippens (R15-E5).
  const [kennzeichenFertig, setKennzeichenFertig] = useState(false);
  const kennzeichenFrage = kennzeichenFertig ? kennzeichenHinweis(f.kennzeichen ?? "") : null;
  // Sitzplätze: Komma gerundet, Minus abgelehnt, Obergrenze genannt — nie still eine andere Zahl (R9-E1).
  const sitz = useZahlEingabe(f.sitzplaetze, (n) => aendern({ ...f, sitzplaetze: n }), { min: 0, max: 99, leer: true, einheit: "Plätze" });
  const grenzeText = sitz.meldung;
  // Zuletzt ausgeschalteter Funkrufname dieser Karte (R9-D1).
  // Zusätzlich im Sitzungsspeicher dieses Tabs: überlebt Schrittwechsel und Neuladen (R10-D2, R10-E2).
  const funkrufMerker = useRef<Fahrzeug["funkrufname"]>(undefined);
  const merkerFp = JSON.stringify(f.typ);
  useEinzugsstempel(karte, frisch);
  const set = (patch: Partial<Fahrzeug>) => aendern({ ...f, ...patch });
  return (
    <div className="karte eintrag" ref={karte}>
      {/* Laufende Nummer sichtbar, wie in der Personenkarte: ohne Typ und
          Kennzeichen sind frische Karten nicht auseinanderzuhalten. */}
      <p className="eintrag-nr" aria-hidden="true">Fahrzeug {index + 1} von {anzahl}</p>
      {/* Kopf des Eintrags: Zeichen, Typ und Kennzeichen sagen, welches Fahrzeug
          das ist; alles Weitere ist Beschreibung. Das taktische Zeichen (DV 102)
          steht als Glied der Kopfzeile darin statt als Float daneben — sonst
          setzte die Kopflinie erst rechts vom Zeichen an. Der Löschknopf steht
          am Ende der Zeile, beim Umbruch hinter dem Kennzeichen statt darüber. */}
      <div className="zeile eintrag-kopf">
        <FahrzeugZeichen fahrzeug={f} org={org} className="fahrzeug-symbol" aria-hidden="true" />
        <Feld titel="Fahrzeugtyp">
          <VokabAuswahl wert={f.typ} aendern={(v) => set({ typ: v })} tabelle={vokabularFuer(org, "fahrzeug")} platzhalter="z. B. MzKW, LF 20" suchbar />
          {/* R12-N3: Das Feld kürzt lange Typen am Ende („…Lastkraftwagen I“); die Langform steht darunter ungekürzt. */}
          {typLang && (
            <small className="hinweis typ-langform" data-testid="typ-langform">
              {typLang}
            </small>
          )}
        </Feld>
        <Feld titel="Kennzeichen">
          <input
            {...KENNUNG_EINGABE}
            id={`feld-kennzeichen-${index}`}
            value={f.kennzeichen ?? ""}
            onChange={(e) => set({ kennzeichen: e.target.value })}
            // R12-N7: Beim Verlassen Großschreibung und Trennstrich („thw 80101“ → „THW-80101“).
            onFocus={() => setKennzeichenFertig(false)}
            onBlur={(e) => {
              const roh = e.target.value;
              const schoen = kennzeichenSchreibweise(roh);
              if (roh !== "" && schoen !== roh) set({ kennzeichen: schoen });
              setKennzeichenFertig(true);
            }}
            // Beispiel der eigenen Organisation, mit „z. B." — das feste
            // „OL-FW 2041 / THW-84397" sah wie ein eingetragener Wert aus und
            // wurde ausgelassen (Audit Runde 2, R2-N9).
            placeholder={org === OrganisationsTyp.THW ? "z. B. THW-84397" : "z. B. OL-FW 2041"}
          />
          {kennzeichenFrage && (
            <small className="hinweis warnung-text kennzeichen-frage" role="status">
              {kennzeichenFrage}
            </small>
          )}
        </Feld>
        <Feld titel="Sitzplätze" schmal>
          {/* Leer = Richtwert des Typs. Der Richtwert steht als Platzhalter
              drin, damit sichtbar ist, womit die Bilanz sonst rechnet — und
              womit man nicht einverstanden ist, wenn man hier etwas einträgt.
              Denselben Fahrzeugtyp gibt es in Baulosen mit unterschiedlicher
              Kabine (FüKomKw 1+2 oder 1+6), deshalb ist der Richtwert nur ein
              Vorschlag. */}
          <input
            {...sitz.eingabe}
            id={`feld-sitzplaetze-${index}`}
            // „Richtw.“ statt „Richtwert“: im 112 px schmalen Feld stand sonst „3 (Richtwert,“ abgeschnitten (R12-N3).
            placeholder={richtwert != null ? `${richtwert} (Richtw.)` : "unbekannt"}
            title="Sitzplätze inkl. Fahrer/in. Leer lassen = Richtwert des Fahrzeugtyps."
            aria-describedby={grenzeText ? `grenze-sitzplaetze-${index}` : undefined}
          />
          {/* Die Begrenzung auf 0 bis 99 wird genannt, statt still einen anderen Wert zu setzen (R7-E6). */}
          {grenzeText && (
            <small className="hinweis warnung-text" id={`grenze-sitzplaetze-${index}`} role="status">
              {grenzeText}
            </small>
          )}
        </Feld>
        <Feld titel="Ausstattung nach StAN" schmal>
          <Auswahl
            value={f.stanKonform == null ? "na" : f.stanKonform ? "ja" : "nein"}
            onChange={(e) => set({ stanKonform: e.target.value === "na" ? undefined : e.target.value === "ja" })}
          >
            {/* Kurz, damit der Vorgabewert im schmalen Feld ganz zu lesen ist („— (nicht a", R8-N7); k. A. = keine Angabe. */}
            <option value="na" title="keine Angabe / nicht anwendbar">— k. A.</option>
            <option value="ja">ja</option>
            <option value="nein">nein</option>
          </Auswahl>
        </Feld>
        <button
          type="button"
          className="entfernen"
          aria-label={`${bezeichnung} entfernen`}
          onClick={async () => {
            /* Dieselbe Rückfrage wie bei der Personenkarte, aus demselben
               Grund — und nur, wenn etwas verloren geht: eine leere Karte
               verschwindet ohne Dialog. */
            if (!fahrzeugLeer(f) && !(await frageJaNein({
              titel: `${bezeichnung} entfernen?`,
              text: "Die erfassten Angaben dieses Fahrzeugs werden entfernt — Typ, Kennzeichen, Funkrufname, Sitzplätze und Änderungen. „Rückgängig“ in der Leiste unten holt es zurück — auch nach „Weiter“ oder Neuladen, 15 Minuten lang.",
              ok: "Fahrzeug entfernen",
              gefahr: true,
            }))) {
              return;
            }
            mitAbgang(karte.current, entfernen);
          }}
        >
          Fahrzeug entfernen
        </button>
      </div>
      <div className="zeile">
        <label className="inline">
          <input
            type="checkbox"
            checked={f.funkrufname != null}
            onChange={(e) => {
              // Ausschalten blendet aus, die Angaben bleiben in der Karte erhalten: Beim erneuten Anhaken
              // stehen Kennwort, Ort und Kennzahlen (71/25) wieder da — ein Doppeltipp verlor sie (R9-D1).
              if (!e.target.checked) {
                funkrufMerker.current = f.funkrufname;
                funkrufMerken(index, f.funkrufname ?? null, merkerFp);
                set({ funkrufname: undefined });
                return;
              }
              set({
                funkrufname: funkrufMerker.current ?? funkrufHolen<NonNullable<Fahrzeug["funkrufname"]>>(index, merkerFp) ?? {
                  kennwort: org === OrganisationsTyp.THW ? { code: 1 } : {},
                  eigenerStandort: true,
                  teile: ovKennzahl != null ? [ovKennzahl] : [],
                },
              });
            }}
          />
          Funkrufname
        </label>
        {f.funkrufname && (
          <>
            {/* „mittel": Kennwörter wie „Heros – Heros" wurden in 7rem abgeschnitten. */}
            <Feld titel="Kennwort" klasse="mittel">
              <VokabAuswahl
                wert={f.funkrufname.kennwort}
                aendern={(v) => set({ funkrufname: { ...f.funkrufname!, kennwort: v } })}
                tabelle={vokabularFuer(org, "kennwort")}
                platzhalter="Kennwort"
              />
            </Feld>
            <label className="inline">
              <input
                type="checkbox"
                checked={f.funkrufname.eigenerStandort}
                onChange={(e) => set({ funkrufname: { ...f.funkrufname!, eigenerStandort: e.target.checked, ort: e.target.checked ? undefined : "" } })}
              />
              eigener Standort
            </label>
            {/* Ohne Erklärung blieb offen, was der Haken tut (R2-N9). Als
                eigene Zeile unter dem Kästchen: In der Beschriftung brach sie
                „eigener / Standor / t" um (R3-N6). */}
            <p className="hinweis funkruf-standort">
              Ort im Funkrufnamen = Ort der Einheit{standort ? ` (${standort})` : " aus Schritt 1"}
            </p>
            {!f.funkrufname.eigenerStandort && (
              <Feld titel="Ort" schmal>
                <input value={f.funkrufname.ort ?? ""} onChange={(e) => set({ funkrufname: { ...f.funkrufname!, ort: e.target.value } })} />
              </Feld>
            )}
            <Feld titel="Kennzahlen (z. B. 18/13)" schmal>
              <KennzahlenFeld
                teile={f.funkrufname.teile}
                aendern={(t) => set({ funkrufname: { ...f.funkrufname!, teile: t } })}
              />
            </Feld>
          </>
        )}
        <Feld titel="Änderungen bzw. Sondergerät">
          <input value={f.aenderungen ?? ""} onChange={(e) => set({ aenderungen: e.target.value || undefined })} {...NAMEN_EINGABE} />
        </Feld>
      </div>
    </div>
  );
}

/**
 * Sitzplätze gegen Stärke — die Rechnung, die sonst niemand macht. Steht auch
 * dann da, wenn sie aufgeht: beim Streichen eines Fahrzeugs sieht man sofort,
 * was das für die Anfahrt bedeutet. Reicht es nicht, übernimmt der Hinweis am
 * Ende der Seite (fahrzeugHinweise) — sonst stünde dasselbe zweimal.
 *
 * Erst, wenn es etwas zu rechnen gibt: mindestens ein Fahrzeug mit Typ oder
 * Sitzplatzzahl. Vorher erschrak „Sitzplätze: 0 für 1 Person — 1 Fahrzeug
 * ohne hinterlegte Sitzplatzzahl" schon bei einer leeren, eben angelegten Karte.
 */
function Transportbilanz({ bogen }: Pick<SchrittProps, "bogen">) {
  const b = transportBilanz(bogen);
  const rechenbar = bogen.fahrzeuge.some((f) => f.typ.code != null || !!f.typ.freitext?.trim() || f.sitzplaetze != null);
  if (!rechenbar || b.fehlend > 0) return null;
  return (
    <p className="hinweis">
      Sitzplätze: <strong>{b.plaetze}</strong> für {b.benoetigt}{" "}
      {b.benoetigt === 1 ? "Person" : "Personen"}
      {b.unbekannt > 0
        ? ` — ${b.unbekannt} ${b.unbekannt === 1 ? "Fahrzeug" : "Fahrzeuge"} ohne hinterlegte Sitzplatzzahl, die Rechnung ist unvollständig.`
        : " (Richtwerte je Fahrzeugtyp, ohne Anhänger)."}
    </p>
  );
}

/**
 * Was die Fahrzeugliste an eigenen Eingaben trägt — das, was „StAN-Vorbelegung laden" überschreibt (R17-D1):
 * Kennzeichen (mit Wortlaut), Funkrufnamen, Sitzplatzangaben, Sondergerät und Angaben zur StAN-Ausstattung. Leer, wenn nichts da ist.
 */
export function eigeneAngaben(liste: readonly Fahrzeug[]): string {
  const kennzeichen = liste.map((f) => f.kennzeichen?.trim()).filter((k): k is string => !!k);
  const zaehl = (n: number, einzahl: string, mehrzahl: string) => (n === 0 ? null : n === 1 ? `1 ${einzahl}` : `${n} ${mehrzahl}`);
  return [
    kennzeichen.length > 0 ? `Kennzeichen ${kennzeichen.join(", ")}` : null,
    zaehl(liste.filter((f) => f.funkrufname != null).length, "Funkrufname", "Funkrufnamen"),
    zaehl(liste.filter((f) => f.sitzplaetze != null).length, "Sitzplatzangabe", "Sitzplatzangaben"),
    zaehl(liste.filter((f) => !!f.aenderungen?.trim()).length, "Sondergerät/Änderung", "Sondergeräte/Änderungen"),
    zaehl(liste.filter((f) => f.stanKonform != null).length, "Angabe zur StAN-Ausstattung", "Angaben zur StAN-Ausstattung"),
  ]
    .filter((t): t is string => t != null)
    .join("; ");
}

export function SchrittFahrzeuge({ bogen, aendern }: SchrittProps) {
  // Als Objektidentität, nicht als Index: ein Index rutscht beim Löschen einer
  // anderen Karte auf eine bestehende und stempelte sie grundlos ein zweites
  // Mal. Das Bearbeiten der neuen Karte ersetzt das Objekt ohnehin — dann ist
  // der Stempel gelaufen und die Markierung darf weg.
  const [frisch, setFrisch] = useState<Fahrzeug | null>(null);
  // Rückweg nach „Fahrzeug entfernen", wie bei Personen (Audit Runde 3,
  // R3-D4): Die Rückfrage nannte Typ und Kennzeichen, danach gab es keinen
  // Weg zurück. „Rückgängig" setzt das Fahrzeug an seine alte Stelle und
  // lässt später Eingetragenes stehen; die Leiste bleibt bis ✕, bis zum
  // nächsten Entfernen oder bis der Schritt verlassen wird.
  //
  // Derselbe Rückweg trägt auch „Vorbelegung entfernen" (R3-N2): Dort gehen
  // mehrere Fahrzeuge auf einmal, jedes kommt an seine alte Stelle zurück.
  //
  // Der Rückweg liegt zusätzlich im Sitzungsspeicher dieses Tabs und überlebt Schrittwechsel und
  // Neuladen (15 Minuten, solange die Fahrzeugliste so bleibt), wie bei Personen (R9-D3).
  type Rueckweg = { eintraege: { fahrzeug: Fahrzeug; index: number }[]; text: string; name: string; nonce: number; /** Die ganze bisherige Liste nach „StAN-Vorbelegung laden" (R17-D1). */ ersetzt?: Fahrzeug[] };
  const [rueckweg, setRueckwegRoh] = useState<Rueckweg | null>(() =>
    rueckwegHolen<Rueckweg>(FAHRZEUG_WEG_SCHLUESSEL, JSON.stringify(bogen.fahrzeuge)),
  );
  /** `danach`: die Fahrzeugliste nach dem Entfernen — nur dann gilt der Rückweg nach dem Neuladen noch. */
  const setRueckweg = (r: Rueckweg | null, danach: Fahrzeug[] = bogen.fahrzeuge) => {
    setRueckwegRoh(r);
    rueckwegMerken(FAHRZEUG_WEG_SCHLUESSEL, r, JSON.stringify(danach));
  };
  const [zurueckgeholt, setZurueckgeholt] = useState<{ text: string; nonce: number } | null>(null);
  const rueckgaengig = () => {
    if (!rueckweg) return;
    if (rueckweg.ersetzt) {
      const alt = rueckweg.ersetzt;
      setRueckweg(null);
      setFrisch(null);
      setZurueckgeholt({ text: `Zurückgeholt: ${alt.length === 1 ? "das bisherige Fahrzeug" : `die ${alt.length} bisherigen Fahrzeuge`} samt Kennzeichen`, nonce: Date.now() });
      aendern({ fahrzeuge: alt });
      return;
    }
    const liste = [...bogen.fahrzeuge];
    // Aufsteigend einsetzen: Jede Stelle bezieht sich auf die Liste vor dem
    // Entfernen, in der die früheren Einträge schon wieder stehen.
    for (const { fahrzeug, index } of [...rueckweg.eintraege].sort((a, b) => a.index - b.index)) {
      liste.splice(Math.min(index, liste.length), 0, fahrzeug);
    }
    setRueckweg(null);
    const [einziges] = rueckweg.eintraege;
    setFrisch(rueckweg.eintraege.length === 1 && einziges ? einziges.fahrzeug : null);
    setZurueckgeholt({ text: `Zurückgeholt: ${rueckweg.name}`, nonce: Date.now() });
    aendern({ fahrzeuge: liste });
  };
  /**
   * „Vorbelegung entfernen": nur Fahrzeuge, an denen außer der Vorbelegung
   * nichts eingetragen ist (kein Kennzeichen, kein Sondergerät, keine
   * Sitzplätze). Vorher nahm der Knopf alles ohne Kennzeichen mit, samt
   * Sondergerät, ohne Rückfrage und ohne Rückweg (Audit Runde 3, R3-N2).
   */
  const vorbelegungEntfernen = () => {
    const weg = bogen.fahrzeuge.flatMap((fahrzeug, index) => (fahrzeugUnbenannt(fahrzeug) ? [{ fahrzeug, index }] : []));
    if (weg.length === 0) return;
    aendern({ fahrzeuge: bogen.fahrzeuge.filter((f) => !fahrzeugUnbenannt(f)) });
    const [erstes] = weg;
    const name = weg.length === 1 && erstes ? fahrzeugBezeichnung(erstes.fahrzeug, erstes.index, bogen.einheit.organisation) : `${weg.length} Fahrzeuge der Vorbelegung`;
    setZurueckgeholt(null);
    setRueckweg({ eintraege: weg, text: "Vorbelegung entfernt:", name, nonce: Date.now() }, bogen.fahrzeuge.filter((f) => !fahrzeugUnbenannt(f)));
  };
  const vorlage = fahrzeugVorbelegung(bogen.einheit);
  const ovKennzahl = funkrufOrtsverband(bogen.einheit)?.kennzahl;
  const stanGeladen = vorbelegungGeladen(bogen.fahrzeuge, vorlage);
  const unbenannte = bogen.fahrzeuge.filter(fahrzeugUnbenannt).length;
  const mitInhaltOhneKennzeichen = bogen.fahrzeuge.filter((f) => !f.kennzeichen?.trim() && !fahrzeugUnbenannt(f)).length;
  return (
    <section className="karte">
      <h2>4. Fahrzeuge</h2>
      <Transportbilanz bogen={bogen} />
      {bogen.fahrzeuge.map((f, i) => (
        <FahrzeugKarte
          key={i}
          fahrzeug={f}
          org={bogen.einheit.organisation}
          standort={ortOhneZusatz(einheitOrt(bogen.einheit))}
          ovKennzahl={ovKennzahl}
          frisch={f === frisch}
          index={i}
          anzahl={bogen.fahrzeuge.length}
          aendern={(nf) => aendern({ fahrzeuge: bogen.fahrzeuge.map((x, j) => (j === i ? nf : x)) })}
          entfernen={() => {
            aendern({ fahrzeuge: bogen.fahrzeuge.filter((_, j) => j !== i) });
            if (fahrzeugLeer(f)) return;
            setZurueckgeholt(null);
            setRueckweg(
              { eintraege: [{ fahrzeug: f, index: i }], text: "Entfernt:", name: fahrzeugBezeichnung(f, i, bogen.einheit.organisation), nonce: Date.now() },
              bogen.fahrzeuge.filter((_, j) => j !== i),
            );
          }}
        />
      ))}
      <button
        type="button"
        className="primaer"
        onClick={() => {
          // Die neue Karte erscheint ÜBER dem Knopf, den man gerade gedrückt
          // hat — der Blick liegt unten. Der Stempel sagt, wohin er soll.
          const neu = neuesFahrzeug();
          setFrisch(neu);
          aendern({ fahrzeuge: [...bogen.fahrzeuge, neu] });
        }}
      >
        + Fahrzeug hinzufügen
      </button>
      {/* Vorbelegungs-Knöpfe unter der Liste, wie in Schritt 3 (R2-N8): Oben
          war „Vorbelegung entfernen" der erste und größte Knopf des Schritts
          und wurde als „Vorschläge ausblenden" gelesen (R3-N2). Der Rückweg
          zur Vorbelegung aus Schritt 1 entfernt nur Fahrzeuge ohne eigene
          Angaben — deshalb ohne Rückfrage, aber mit „Rückgängig". */}
      {unbenannte > 0 && (
        <p>
          <button type="button" onClick={vorbelegungEntfernen}>
            Vorbelegung entfernen ({unbenannte === 1 ? "1 Fahrzeug ohne eigene Angaben" : `${unbenannte} Fahrzeuge ohne eigene Angaben`})
          </button>
          {mitInhaltOhneKennzeichen > 0 && (
            <span className="hinweis">
              {" "}
              {mitInhaltOhneKennzeichen === 1 ? "Ein Fahrzeug ohne Kennzeichen bleibt" : `${mitInhaltOhneKennzeichen} Fahrzeuge ohne Kennzeichen bleiben`} —
              dort ist schon Sondergerät oder eine Sitzplatzzahl eingetragen.
            </span>
          )}
        </p>
      )}
      {vorlage.length > 0 && (
        <p>
          <button
            type="button"
            disabled={stanGeladen}
            title={
              stanGeladen
                ? "Die Fahrzeuge der StAN stehen schon genau so in der Liste — es gäbe nichts zu ersetzen."
                : undefined
            }
            onClick={async () => {
              const alt = bogen.fahrzeuge;
              const eigene = eigeneAngaben(alt);
              if (
                alt.length === 0 ||
                (await frageJaNein({
                  titel: "StAN-Vorbelegung laden?",
                  text: `Die aktuelle Fahrzeugliste (${alt.length} Fahrzeuge) wird durch die ${vorlage.length} Fahrzeuge der StAN ersetzt.${eigene ? ` Verloren gehen dabei deine Eingaben: ${eigene}.` : ""} „Rückgängig“ in der Leiste unten stellt die bisherige Liste wieder her.`,
                  ok: "Ersetzen",
                }))
              ) {
                aendern({ fahrzeuge: vorlage });
                // Ersetzen mit Rückweg wie Entfernen (R17-D1): die ganze bisherige Liste, samt Kennzeichen.
                if (!alt.every(fahrzeugLeer)) {
                  setZurueckgeholt(null);
                  setRueckweg({ eintraege: [], ersetzt: alt, text: "StAN-Vorbelegung geladen:", name: `${alt.length === 1 ? "1 bisheriges Fahrzeug" : `${alt.length} bisherige Fahrzeuge`} ersetzt`, nonce: Date.now() }, vorlage);
                }
              }
            }}
          >
            StAN-Vorbelegung laden ({vorlage.length} Fahrzeuge)
          </button>
          {stanGeladen && (
            <span className="hinweis"> Schon geladen — die {vorlage.length} Fahrzeuge stehen unten in der Liste.</span>
          )}
        </p>
      )}
      <Hinweise hinweise={fahrzeugHinweise(bogen)} />
      {rueckweg && (
        <DaumenQuittung key={`fahrzeug:${rueckweg.nonce}`} onRueckgaengig={rueckgaengig} onSchliessen={() => setRueckweg(null)}>
          <strong>{rueckweg.text}</strong> {rueckweg.name}
        </DaumenQuittung>
      )}
      {zurueckgeholt && !rueckweg && (
        <DaumenQuittung key={`zurueck:${zurueckgeholt.nonce}`} onSchliessen={() => setZurueckgeholt(null)}>
          {zurueckgeholt.text}
        </DaumenQuittung>
      )}
    </section>
  );
}
