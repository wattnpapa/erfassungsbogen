/**
 * Schritt 5 — Sofortbedarf & Sonstiges: Verpflegung, Betriebsstoff,
 * Unterbringung/Ruhezeit und ein Freitextfeld.
 */

import { PersonalErfassung, staerke, verpflegung } from "@bos/eeb-format/model";
import { pruefpunkte } from "../hilfen";
import { useState } from "react";
import { Feld, Hinweise, ZahlEingabe, zahlBegrenzung, type SchrittProps } from "./bausteine";

export function SchrittSofortbedarf({ bogen, aendern }: SchrittProps) {
  const s = bogen.sofortbedarf;
  // Welches Feld zuletzt begrenzt wurde — „−40 l" würde sonst still zu 0 (R7-E6).
  const [grenze, setGrenze] = useState<{ feld: string; text: string } | null>(null);
  const merkeGrenze = (feld: string, eingabe: string) => {
    const text = zahlBegrenzung(eingabe, { min: 0 });
    setGrenze((alt) => (text ? { feld, text } : alt?.feld === feld ? null : alt));
  };
  const gesamt = staerke(bogen).gesamt;
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const vp = verpflegung(bogen);
  const setVpManuell = (patch: Partial<{ vegetarisch: number; vegan: number }>) =>
    aendern({ verpflegungManuell: { vegetarisch: vp.vegetarisch, vegan: vp.vegan, ...patch } });
  return (
    <section className="karte">
      <h2>5. Sofortbedarf & Sonstiges</h2>
      <label className="inline">
        <input
          type="checkbox"
          checked={s != null}
          onChange={(e) =>
            aendern({
              sofortbedarf: e.target.checked
                ? { verpflegungPersonen: gesamt, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false }
                : undefined,
            })
          }
        />
        Sofortbedarf erfassen
      </label>
      {/* Was darunter fällt, vor dem Anhaken: Ein Neuling wusste es erst danach (R4-N6). */}
      {!s && (
        <p className="hinweis">Verpflegung, Betriebsstoff (Diesel, Benzin, Gemisch), Unterbringung, Ruhezeit — nur anhaken, wenn die Einheit etwas anfordert.</p>
      )}
      {s && (
        <>
          <div className="zeile">
            <Feld titel="Verpflegung (Personen)" schmal>
              <ZahlEingabe min={0} wert={s.verpflegungPersonen} setzen={(n, text) => { merkeGrenze("verpflegungPersonen", text); aendern({ sofortbedarf: { ...s, verpflegungPersonen: n } }); }} />
            </Feld>
            {nurStaerke ? (
              <>
                <Feld titel="davon vegetarisch" schmal>
                  <ZahlEingabe min={0} wert={vp.vegetarisch} setzen={(n) => setVpManuell({ vegetarisch: n })} />
                </Feld>
                <Feld titel="davon vegan" schmal>
                  <ZahlEingabe min={0} wert={vp.vegan} setzen={(n) => setVpManuell({ vegan: n })} />
                </Feld>
              </>
            ) : (
              <Feld titel="Ernährung (aus Personal)" schmal>
                <output className="abgeleitet">{vp.vegetarisch} vegetarisch · {vp.vegan} vegan</output>
              </Feld>
            )}
            <Feld titel="Diesel (l)" schmal>
              <ZahlEingabe min={0} wert={s.dieselLiter} setzen={(n, text) => { merkeGrenze("dieselLiter", text); aendern({ sofortbedarf: { ...s, dieselLiter: n } }); }} />
            </Feld>
            <Feld titel="Benzin (l)" schmal>
              <ZahlEingabe min={0} wert={s.benzinLiter} setzen={(n, text) => { merkeGrenze("benzinLiter", text); aendern({ sofortbedarf: { ...s, benzinLiter: n } }); }} />
            </Feld>
            <Feld titel="Gemisch (l)" schmal>
              <ZahlEingabe min={0} wert={s.gemischLiter} setzen={(n, text) => { merkeGrenze("gemischLiter", text); aendern({ sofortbedarf: { ...s, gemischLiter: n } }); }} />
            </Feld>
          </div>
          {grenze && (
            <p className="hinweis warnung-text" role="status">
              {grenze.text}
            </p>
          )}
          {/* Eine Angabe, ein Ort: der Bedarf folgt der Stärke (verpflegungMitziehen
              in hilfen.ts), solange er ihr entspricht — wer bewusst abweicht,
              behält seine Zahl. Das muss dranstehen, sonst wundert man sich,
              warum die Zahl mal mitgeht und mal nicht. */}
          <p className="hinweis">
            Verpflegung ist aus der Stärke vorbelegt und zieht mit ihr mit; abweichend eintragen,
            wenn mehr oder weniger bestellt wird.
          </p>
          <p>
            <label className="inline">
              <input type="checkbox" checked={s.unterbringung} onChange={(e) => aendern({ sofortbedarf: { ...s, unterbringung: e.target.checked } })} />
              Unterbringung
            </label>
            <label className="inline">
              <input type="checkbox" checked={s.ruhezeitErforderlich} onChange={(e) => aendern({ sofortbedarf: { ...s, ruhezeitErforderlich: e.target.checked } })} />
              Ruhezeit erforderlich
            </label>
          </p>
        </>
      )}
      <Feld titel="Sonstiges (Freitext)">
        <textarea rows={3} value={bogen.sonstiges ?? ""} onChange={(e) => aendern({ sonstiges: e.target.value || undefined })} />
      </Feld>
      {/* Schritt-Index 4 = Sofortbedarf (siehe SCHRITTE in app.tsx): „Diesel
          99 999 l" fiel vorher erst in der Übersicht auf — wenn überhaupt. */}
      <Hinweise punkte={pruefpunkte(bogen, false)} aktuellerSchritt={4} />
    </section>
  );
}
