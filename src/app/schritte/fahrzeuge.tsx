/**
 * Schritt 4 — Fahrzeuge: Typ, Kennzeichen, Funkrufname und StAN-Vorbelegung.
 */

import { Fahrzeug, OrganisationsTyp } from "../../model";
import { stanFahrzeugVorbelegung } from "../../vokabulare/thw-stan-fahrzeuge";
import { fahrzeugHinweise, neuesFahrzeug, transportBilanz, vokabularFuer, vorbelegungGeladen } from "../hilfen";
import { fahrzeugSymbolSvg, svgDataUrl } from "../taktische-zeichen";
import { frageJaNein } from "../dialoge";
import {
  Auswahl,
  Feld,
  Hinweise,
  KennzahlenFeld,
  VokabAuswahl,
  type SchrittProps,
} from "./bausteine";

function FahrzeugKarte(props: {
  fahrzeug: Fahrzeug;
  org: OrganisationsTyp;
  aendern: (f: Fahrzeug) => void;
  entfernen: () => void;
}) {
  const { fahrzeug: f, org, aendern, entfernen } = props;
  const set = (patch: Partial<Fahrzeug>) => aendern({ ...f, ...patch });
  return (
    <div className="karte">
      <button type="button" className="entfernen" onClick={entfernen}>Fahrzeug entfernen</button>
      {/* Taktisches Zeichen (DV 102) wie auf dem PDF — bestätigt die Typauswahl auf einen Blick. */}
      <img className="fahrzeug-symbol" src={svgDataUrl(fahrzeugSymbolSvg(f, org))} alt="" aria-hidden="true" />
      <div className="zeile">
        <Feld titel="Fahrzeugtyp">
          <VokabAuswahl wert={f.typ} aendern={(v) => set({ typ: v })} tabelle={vokabularFuer(org, "fahrzeug")} platzhalter="z. B. MzKW, LF 20" />
        </Feld>
        <Feld titel="Kennzeichen">
          <input
            value={f.kennzeichen ?? ""}
            onChange={(e) => set({ kennzeichen: e.target.value })}
            placeholder="OL-FW 2041 / THW-84397"
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
      </div>
      <div className="zeile">
        <label className="inline">
          <input
            type="checkbox"
            checked={f.funkrufname != null}
            onChange={(e) =>
              set({ funkrufname: e.target.checked ? { kennwort: org === OrganisationsTyp.THW ? { code: 1 } : {}, eigenerStandort: true, teile: [] } : undefined })
            }
          />
          Funkrufname
        </label>
        {f.funkrufname && (
          <>
            <Feld titel="Kennwort" schmal>
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
  const vorlage = stanFahrzeugVorbelegung(bogen.einheit.organisation, bogen.einheit.einheitsTyp);
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
          aendern={(nf) => aendern({ fahrzeuge: bogen.fahrzeuge.map((x, j) => (j === i ? nf : x)) })}
          entfernen={() => aendern({ fahrzeuge: bogen.fahrzeuge.filter((_, j) => j !== i) })}
        />
      ))}
      <button type="button" className="primaer" onClick={() => aendern({ fahrzeuge: [...bogen.fahrzeuge, neuesFahrzeug()] })}>
        + Fahrzeug hinzufügen
      </button>
      <Hinweise hinweise={fahrzeugHinweise(bogen)} />
    </section>
  );
}
