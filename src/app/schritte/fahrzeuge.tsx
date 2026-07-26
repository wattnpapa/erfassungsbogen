/**
 * Schritt 4 — Fahrzeuge: Typ, Kennzeichen, Funkrufname und StAN-Vorbelegung.
 */

import { Fahrzeug, OrganisationsTyp } from "../../model";
import { stanFahrzeugVorbelegung } from "../../vokabulare/thw-stan-fahrzeuge";
import { fahrzeugHinweise, neuesFahrzeug, vokabularFuer } from "../hilfen";
import { fahrzeugSymbolSvg, svgDataUrl } from "../taktische-zeichen";
import {
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
          <select
            value={f.stanKonform == null ? "na" : f.stanKonform ? "ja" : "nein"}
            onChange={(e) => set({ stanKonform: e.target.value === "na" ? undefined : e.target.value === "ja" })}
          >
            <option value="na">— (nicht anwendbar)</option>
            <option value="ja">ja</option>
            <option value="nein">nein</option>
          </select>
        </Feld>
      </div>
      <div className="zeile">
        <span className="inline">
          <input
            type="checkbox"
            checked={f.funkrufname != null}
            onChange={(e) =>
              set({ funkrufname: e.target.checked ? { kennwort: org === OrganisationsTyp.THW ? { code: 1 } : {}, eigenerStandort: true, teile: [] } : undefined })
            }
          />
          Funkrufname
        </span>
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
            <span className="inline">
              <input
                type="checkbox"
                checked={f.funkrufname.eigenerStandort}
                onChange={(e) => set({ funkrufname: { ...f.funkrufname!, eigenerStandort: e.target.checked, ort: e.target.checked ? undefined : "" } })}
              />
              eigener Standort
            </span>
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

export function SchrittFahrzeuge({ bogen, aendern }: SchrittProps) {
  const vorlage = stanFahrzeugVorbelegung(bogen.einheit.organisation, bogen.einheit.einheitsTyp);
  return (
    <section className="karte">
      <h2>4. Fahrzeuge</h2>
      {vorlage.length > 0 && (
        <p>
          <button
            type="button"
            onClick={() => {
              if (bogen.fahrzeuge.length === 0 || window.confirm("Aktuelle Fahrzeugliste durch die StAN-Vorbelegung ersetzen?")) {
                aendern({ fahrzeuge: vorlage });
              }
            }}
          >
            StAN-Vorbelegung laden ({vorlage.length} Fahrzeuge)
          </button>
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
