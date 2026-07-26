/**
 * Schritt 5 — Sofortbedarf & Sonstiges: Verpflegung, Betriebsstoff,
 * Unterbringung/Ruhezeit und ein Freitextfeld.
 */

import { PersonalErfassung, staerke, verpflegung } from "../../model";
import { Feld, zahl, type SchrittProps } from "./bausteine";

export function SchrittSofortbedarf({ bogen, aendern }: SchrittProps) {
  const s = bogen.sofortbedarf;
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
      {s && (
        <>
          <div className="zeile">
            <Feld titel="Verpflegung (Personen)" schmal>
              <input type="number" min={0} value={s.verpflegungPersonen} onChange={(e) => aendern({ sofortbedarf: { ...s, verpflegungPersonen: zahl(e.target.value) } })} />
            </Feld>
            {nurStaerke ? (
              <>
                <Feld titel="davon vegetarisch" schmal>
                  <input type="number" min={0} value={vp.vegetarisch} onChange={(e) => setVpManuell({ vegetarisch: zahl(e.target.value) })} />
                </Feld>
                <Feld titel="davon vegan" schmal>
                  <input type="number" min={0} value={vp.vegan} onChange={(e) => setVpManuell({ vegan: zahl(e.target.value) })} />
                </Feld>
              </>
            ) : (
              <Feld titel="Ernährung (aus Personal)" schmal>
                <output className="abgeleitet">{vp.vegetarisch} vegetarisch · {vp.vegan} vegan</output>
              </Feld>
            )}
            <Feld titel="Diesel (l)" schmal>
              <input type="number" min={0} value={s.dieselLiter} onChange={(e) => aendern({ sofortbedarf: { ...s, dieselLiter: zahl(e.target.value) } })} />
            </Feld>
            <Feld titel="Benzin (l)" schmal>
              <input type="number" min={0} value={s.benzinLiter} onChange={(e) => aendern({ sofortbedarf: { ...s, benzinLiter: zahl(e.target.value) } })} />
            </Feld>
            <Feld titel="Gemisch (l)" schmal>
              <input type="number" min={0} value={s.gemischLiter} onChange={(e) => aendern({ sofortbedarf: { ...s, gemischLiter: zahl(e.target.value) } })} />
            </Feld>
          </div>
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
    </section>
  );
}
