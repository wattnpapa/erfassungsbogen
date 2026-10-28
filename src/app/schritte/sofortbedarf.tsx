/**
 * Schritt 5 — Sofortbedarf & Sonstiges: Verpflegung, Betriebsstoff,
 * Unterbringung/Ruhezeit und ein Freitextfeld.
 */

import { PersonalErfassung, staerke, verpflegung, type Sofortbedarf } from "@bos/eeb-format/model";
import { pruefpunkte } from "../hilfen";
import { frageJaNein } from "../dialoge";
import { freitextQrHinweis } from "../qr-posten";
import { HOECHST_LITER, HOECHST_PERSONEN } from "../zahl-eingabe";
import { useCallback, useEffect, useRef, useState } from "react";
import { Feld, Hinweise, NAMEN_EINGABE, useZahlEingabe, ZahlMeldung, ZahlMeldungsSenke, type SchrittProps } from "./bausteine";

/** Was beim Ausschalten verloren ginge: leer, wenn nichts Eigenes dahintersteht. */
export function sofortbedarfAngaben(s: Sofortbedarf, vorbelegung: number): string[] {
  const t: string[] = [];
  if (s.verpflegungPersonen !== vorbelegung) t.push(`Verpflegung ${s.verpflegungPersonen}`);
  if (s.dieselLiter > 0) t.push(`Diesel ${s.dieselLiter} l`);
  if (s.benzinLiter > 0) t.push(`Benzin ${s.benzinLiter} l`);
  if (s.gemischLiter > 0) t.push(`Gemisch ${s.gemischLiter} l`);
  if (s.unterbringung) t.push("Unterbringung");
  if (s.ruhezeitErforderlich) t.push("Ruhezeit");
  return t;
}

/** Die gesammelten Sätze der Zahlenfelder unter der Feldzeile (R10-M4). */
const ZAHL_MELDUNGEN_ID = "sofortbedarf-meldungen";

/** Ein Zahlenfeld des Sofortbedarfs: Liter und Personen, ganze Zahlen, Satz bei Rundung oder Minus (R9-E1). */
function BedarfZahl(props: { wert: number; setzen: (n: number) => void; einheit: string; leerMeldung?: string }) {
  const { eingabe, meldung } = useZahlEingabe(props.wert, (n) => props.setzen(n ?? 0), {
    min: 0,
    max: props.einheit === "Liter" ? HOECHST_LITER : HOECHST_PERSONEN,
    einheit: props.einheit,
    leerMeldung: props.leerMeldung,
  });
  return (
    <>
      <input {...eingabe} aria-describedby={meldung ? ZAHL_MELDUNGEN_ID : undefined} />
      <ZahlMeldung meldung={meldung} />
    </>
  );
}

export function SchrittSofortbedarf({ bogen, aendern }: SchrittProps) {
  const s = bogen.sofortbedarf;
  // Sätze zu gerundeten oder abgelehnten Zahlen: gesammelt über die volle Breite unter den Feldern (R10-M4, R10-G3).
  const [zahlMeldungen, setZahlMeldungen] = useState<Record<string, string>>({});
  const meldungenBlock = useRef<HTMLDivElement>(null);
  const meldungenStand = Object.values(zahlMeldungen).join("|");
  // Erscheint oder ändert sich ein Satz, rollt er (knapp) ins Bild: Er steht unter der Feldzeile, nicht unter dem Feld.
  useEffect(() => {
    if (meldungenStand) meldungenBlock.current?.scrollIntoView?.({ block: "nearest" });
  }, [meldungenStand]);
  const meldungMelden = useCallback((feld: string, text: string) => {
    setZahlMeldungen((alt) => {
      if ((alt[feld] ?? "") === text) return alt;
      if (!text) {
        const { [feld]: _weg, ...rest } = alt;
        return rest;
      }
      return { ...alt, [feld]: text };
    });
  }, []);
  const gesamt = staerke(bogen).gesamt;
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const vp = verpflegung(bogen);
  const setVpManuell = (patch: Partial<{ vegetarisch: number; vegan: number }>) =>
    aendern({ verpflegungManuell: { vegetarisch: vp.vegetarisch, vegan: vp.vegan, ...patch } });
  /**
   * Ausschalten verwirft die Angaben dahinter. Stehen eigene Zahlen oder Haken da, fragt der Schalter
   * vorher — ein Doppeltipp mit Handschuh setzte sonst Diesel, Benzin, Gemisch, Unterbringung und
   * Ruhezeit ohne Rückfrage auf null (R9-D1). Die Rückfrage hat den Fokus auf „Abbrechen".
   */
  async function umschalten(an: boolean) {
    if (an) {
      aendern({
        sofortbedarf: { verpflegungPersonen: gesamt, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
      });
      return;
    }
    const angaben = s ? sofortbedarfAngaben(s, gesamt) : [];
    if (angaben.length > 0) {
      const ja = await frageJaNein({
        titel: "Sofortbedarf entfernen?",
        text: `Diese Angaben gehen verloren: ${angaben.join(", ")}. Die Verpflegung kommt beim erneuten Anhaken wieder aus der Stärke.`,
        ok: "Sofortbedarf entfernen",
        abbruch: "Behalten",
        gefahr: true,
      });
      if (!ja) return;
    }
    aendern({ sofortbedarf: undefined });
  }
  return (
    <section className="karte">
      <h2>5. Sofortbedarf & Sonstiges</h2>
      <label className="inline">
        <input type="checkbox" checked={s != null} onChange={(e) => void umschalten(e.target.checked)} />
        Sofortbedarf erfassen
      </label>
      {/* Was darunter fällt, vor dem Anhaken: Ein Neuling wusste es erst danach (R4-N6). */}
      {!s && (
        <p className="hinweis">Verpflegung, Betriebsstoff (Diesel, Benzin, Gemisch), Unterbringung, Ruhezeit — nur anhaken, wenn die Einheit etwas anfordert.</p>
      )}
      {s && (
        <>
          <ZahlMeldungsSenke.Provider value={meldungMelden}>
          <div className="zeile">
            <Feld titel="Verpflegung (Personen)" schmal>
              <BedarfZahl
                wert={s.verpflegungPersonen}
                einheit="Personen"
                leerMeldung={`Leer gilt als 0 — keine Verpflegung angefordert. Wie die Stärke wären ${gesamt}.`}
                setzen={(n) => aendern({ sofortbedarf: { ...s, verpflegungPersonen: n } })}
              />
            </Feld>
            {nurStaerke ? (
              <>
                <Feld titel="davon vegetarisch" schmal>
                  <BedarfZahl wert={vp.vegetarisch} einheit="Personen" setzen={(n) => setVpManuell({ vegetarisch: n })} />
                </Feld>
                <Feld titel="davon vegan" schmal>
                  <BedarfZahl wert={vp.vegan} einheit="Personen" setzen={(n) => setVpManuell({ vegan: n })} />
                </Feld>
              </>
            ) : (
              <Feld titel="Ernährung (aus Personal)" schmal>
                <output className="abgeleitet nur-anzeige">
                  {s.verpflegungPersonen > 0
                    ? `${vp.vegetarisch} vegetarisch · ${vp.vegan} vegan`
                    : `Verpflegung nicht angefordert (Personal: ${vp.vegetarisch} vegetarisch · ${vp.vegan} vegan)`}
                </output>
              </Feld>
            )}
            <Feld titel="Diesel (l)" schmal>
              <BedarfZahl wert={s.dieselLiter} einheit="Liter" setzen={(n) => aendern({ sofortbedarf: { ...s, dieselLiter: n } })} />
            </Feld>
            <Feld titel="Benzin (l)" schmal>
              <BedarfZahl wert={s.benzinLiter} einheit="Liter" setzen={(n) => aendern({ sofortbedarf: { ...s, benzinLiter: n } })} />
            </Feld>
            <Feld titel="Gemisch (l)" schmal>
              <BedarfZahl wert={s.gemischLiter} einheit="Liter" setzen={(n) => aendern({ sofortbedarf: { ...s, gemischLiter: n } })} />
            </Feld>
          </div>
          </ZahlMeldungsSenke.Provider>
          {Object.keys(zahlMeldungen).length > 0 && (
            <div className="zahl-meldungen" id={ZAHL_MELDUNGEN_ID} role="status" ref={meldungenBlock}>
              {Object.entries(zahlMeldungen).map(([feld, text]) => (
                <p key={feld}>
                  <strong>{feld}:</strong> {text}
                </p>
              ))}
            </div>
          )}
          {/* Eine Angabe, ein Ort: der Bedarf folgt der Stärke (verpflegungMitziehen
              in hilfen.ts), solange er ihr entspricht — wer bewusst abweicht,
              behält seine Zahl. Das muss dranstehen, sonst wundert man sich,
              warum die Zahl mal mitgeht und mal nicht. */}
          <p className="hinweis">
            Verpflegung ist aus der Stärke vorbelegt und zieht mit ihr mit; abweichend eintragen,
            wenn mehr oder weniger bestellt wird. Alle Mengen in ganzen Zahlen — ein Komma wird gerundet und genannt.
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
        {/* Fachwörter und Kürzel („Nachschub MzKW", „FGr"): Autokorrektur und Rechtschreibprüfung aus (R18-H5). */}
        <textarea rows={3} value={bogen.sonstiges ?? ""} onChange={(e) => aendern({ sonstiges: e.target.value || undefined })} {...NAMEN_EINGABE} />
      </Feld>
      {/* Ab 500 Zeichen: Der Text kostet QR-Teile (R11-E5). */}
      {freitextQrHinweis(bogen.sonstiges) && (
        <p className="hinweis warnung-text freitext-qr-hinweis" role="status">
          {freitextQrHinweis(bogen.sonstiges)}
        </p>
      )}
      {/* Schritt-Index 4 = Sofortbedarf (siehe SCHRITTE in app.tsx): „Diesel
          99 999 l" fiel vorher erst in der Übersicht auf — wenn überhaupt. */}
      <Hinweise punkte={pruefpunkte(bogen, false)} aktuellerSchritt={4} />
    </section>
  );
}
