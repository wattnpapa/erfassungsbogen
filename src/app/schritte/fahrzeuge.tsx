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
  neuesFahrzeug,
  transportBilanz,
  vokabularFuer,
  vorbelegungGeladen,
} from "../hilfen";
import { fahrzeugSymbolSvg, svgDataUrl } from "../taktische-zeichen-bogen";
import { frageJaNein } from "../dialoge";
import { mitAbgang, useEinzugsstempel } from "../eintrag-bewegung";
import {
  Auswahl,
  Feld,
  Hinweise,
  KennzahlenFeld,
  VokabAuswahl,
  type SchrittProps,
} from "./bausteine";

/**
 * Eingabe der Sitzplatzzahl: leer heißt „Richtwert des Typs gilt", nicht null.
 * Begrenzt auf 0..99 — mehr Plätze hat kein Fahrzeug, und eine verrutschte
 * Ziffernfolge soll die Transportbilanz nicht stillschweigend aufgehen lassen.
 */
function sitzplatzEingabe(eingabe: string): number | undefined {
  const t = eingabe.trim();
  if (t === "") return undefined;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? Math.min(99, Math.max(0, n)) : undefined;
}

function FahrzeugKarte(props: {
  fahrzeug: Fahrzeug;
  org: OrganisationsTyp;
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
  const { fahrzeug: f, org, ovKennzahl, frisch, index, anzahl, aendern, entfernen } = props;
  const bezeichnung = fahrzeugBezeichnung(f, index, org);
  const richtwert = sitzplaetzeRichtwert(f, vokabularFuer(org, "fahrzeug"));
  const karte = useRef<HTMLDivElement>(null);
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
        <img className="fahrzeug-symbol" src={svgDataUrl(fahrzeugSymbolSvg(f, org))} alt="" aria-hidden="true" />
        <Feld titel="Fahrzeugtyp">
          <VokabAuswahl wert={f.typ} aendern={(v) => set({ typ: v })} tabelle={vokabularFuer(org, "fahrzeug")} platzhalter="z. B. MzKW, LF 20" suchbar />
        </Feld>
        <Feld titel="Kennzeichen">
          <input
            value={f.kennzeichen ?? ""}
            onChange={(e) => set({ kennzeichen: e.target.value })}
            placeholder="OL-FW 2041 / THW-84397"
          />
        </Feld>
        <Feld titel="Sitzplätze" schmal>
          {/* Leer = Richtwert des Typs. Der Richtwert steht als Platzhalter
              drin, damit sichtbar ist, womit die Bilanz sonst rechnet — und
              womit man nicht einverstanden ist, wenn man hier etwas einträgt.
              Denselben Fahrzeugtyp gibt es in Baulosen mit unterschiedlicher
              Kabine (FüKomKw 1+2 oder 1+6), deshalb ist der Richtwert nur ein
              Vorschlag. */}
          <input
            type="number"
            min={0}
            max={99}
            inputMode="numeric"
            value={f.sitzplaetze ?? ""}
            placeholder={richtwert != null ? `${richtwert} (Richtwert)` : "unbekannt"}
            title="Sitzplätze inkl. Fahrer/in. Leer lassen = Richtwert des Fahrzeugtyps."
            onChange={(e) => set({ sitzplaetze: sitzplatzEingabe(e.target.value) })}
          />
        </Feld>
        <Feld titel="Ausstattung nach StAN" schmal>
          <Auswahl
            value={f.stanKonform == null ? "na" : f.stanKonform ? "ja" : "nein"}
            onChange={(e) => set({ stanKonform: e.target.value === "na" ? undefined : e.target.value === "ja" })}
          >
            <option value="na">— (nicht anwendbar)</option>
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
              text: "Die erfassten Angaben dieses Fahrzeugs gehen verloren — Typ, Kennzeichen, Funkrufname, Sitzplätze und Änderungen.",
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
            onChange={(e) =>
              set({
                funkrufname: e.target.checked
                  ? {
                      kennwort: org === OrganisationsTyp.THW ? { code: 1 } : {},
                      eigenerStandort: true,
                      teile: ovKennzahl != null ? [ovKennzahl] : [],
                    }
                  : undefined,
              })
            }
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
          <input value={f.aenderungen ?? ""} onChange={(e) => set({ aenderungen: e.target.value || undefined })} />
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
 */
function Transportbilanz({ bogen }: Pick<SchrittProps, "bogen">) {
  const b = transportBilanz(bogen);
  if (bogen.fahrzeuge.length === 0 || b.fehlend > 0) return null;
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

export function SchrittFahrzeuge({ bogen, aendern }: SchrittProps) {
  // Als Objektidentität, nicht als Index: ein Index rutscht beim Löschen einer
  // anderen Karte auf eine bestehende und stempelte sie grundlos ein zweites
  // Mal. Das Bearbeiten der neuen Karte ersetzt das Objekt ohnehin — dann ist
  // der Stempel gelaufen und die Markierung darf weg.
  const [frisch, setFrisch] = useState<Fahrzeug | null>(null);
  const vorlage = fahrzeugVorbelegung(bogen.einheit);
  const ovKennzahl = funkrufOrtsverband(bogen.einheit)?.kennzahl;
  const stanGeladen = vorbelegungGeladen(bogen.fahrzeuge, vorlage);
  return (
    <section className="karte">
      <h2>4. Fahrzeuge</h2>
      <Transportbilanz bogen={bogen} />
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
              if (
                bogen.fahrzeuge.length === 0 ||
                (await frageJaNein({
                  titel: "StAN-Vorbelegung laden?",
                  text: `Die aktuelle Fahrzeugliste (${bogen.fahrzeuge.length} Fahrzeuge) wird durch die ${vorlage.length} Fahrzeuge der StAN ersetzt.`,
                  ok: "Ersetzen",
                }))
              ) {
                aendern({ fahrzeuge: vorlage });
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
      {bogen.fahrzeuge.map((f, i) => (
        <FahrzeugKarte
          key={i}
          fahrzeug={f}
          org={bogen.einheit.organisation}
          ovKennzahl={ovKennzahl}
          frisch={f === frisch}
          index={i}
          anzahl={bogen.fahrzeuge.length}
          aendern={(nf) => aendern({ fahrzeuge: bogen.fahrzeuge.map((x, j) => (j === i ? nf : x)) })}
          entfernen={() => aendern({ fahrzeuge: bogen.fahrzeuge.filter((_, j) => j !== i) })}
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
      <Hinweise hinweise={fahrzeugHinweise(bogen)} />
    </section>
  );
}
