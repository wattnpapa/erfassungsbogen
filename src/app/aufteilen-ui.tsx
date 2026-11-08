/**
 * Auswahlfeld „Bogen aufteilen" — klappt in der Einheitenkarte des Einsatzes
 * auf (wie Details und Historie), statt ein Fenster zu öffnen: Ankreuzlisten
 * für Personal und Fahrzeuge sind auf dem Telefon in der Karte besser zu
 * bedienen als in einem modalen Dialog.
 *
 * Reine Eingabe und Vorschau; gerechnet wird in aufteilen.ts, geschrieben in
 * einsaetze.ts.
 */

import { useEffect, useRef, useState } from "react";
import { PersonalErfassung, staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import { aufteilungFehler, teileBogen, type AufteilungsWahl, type TeilStaerke } from "@bos/meldekopf/aufteilen";
import { MeldeStatus, type AufteilungOptionen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { frageJaNein } from "./dialoge";
import { funktionsText, kennzeichenText, vokabText, vokabularFuer } from "./hilfen";
import { Auswahl, useZahlEingabe, ZahlMeldung } from "./schritte/bausteine";

/** Kurzfassung „0 / 1 / 8 / 9 · 2 Fzg" für die Vorschau beider Hälften. */
function bilanz(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} // ${s.gesamt} · ${b.fahrzeuge.length} Fzg`;
}

/**
 * Bleibt in der Restmeldung niemand übrig (Stärke 0)? Bleiben nur Fahrzeuge, ist der Rest ohne Personen — auch das ist
 * eine Meldung „Stärke 0" (R13-D3). Sind weder Personen noch Fahrzeuge übrig, lässt der Kern die Auswahl gar nicht zu.
 */
export function restLeer(rest: Erfassungsbogen): boolean {
  return staerke(rest).gesamt === 0;
}

export const REST_LEER_TITEL = "Es bleibt niemand übrig";
export const REST_LEER_TEXT =
  "Alle Personen gehen in den abgeteilten Teil. Die bisherige Meldung bliebe mit Stärke 0 stehen, zählt als Einheit mit, " +
  "und ein Bedarf bliebe bei ihr. Zum Umbenennen oder Verlagern nicht alle auswählen.";

/** Zahl, die mitgeht: Komma gerundet, Minus abgelehnt, Obergrenze genannt (R9-E1). */
function StaerkeFeld(props: { label: string; wert: number; hoechstens: number; setzen: (n: number) => void }) {
  const { eingabe, meldung } = useZahlEingabe(props.wert, (n) => props.setzen(n ?? 0), { min: 0, max: props.hoechstens, einheit: "Personen" });
  return (
    <label className="feld">
      {props.label} (von {props.hoechstens})
      <input {...eingabe} />
      <ZahlMeldung meldung={meldung} />
    </label>
  );
}

function AnkreuzZeile(props: { an: boolean; umschalten: () => void; name: string; sub?: string }) {
  return (
    <label className="muster-zeile">
      {/* `aria-label`: ohne ihn zählt die Nebenzeile (Funktion, Kennzeichen) zum
          zugänglichen Namen — die Vorlesesoftware nennt dann „Rudolph, Johannes
          Zugführer" als Feldnamen. Die Nebenzeile bleibt sichtbar. */}
      <input type="checkbox" aria-label={props.name} checked={props.an} onChange={props.umschalten} />
      <span className="muster-text">
        <span className="muster-name">{props.name}</span>
        {props.sub && <span className="muster-sub">{props.sub}</span>}
      </span>
    </label>
  );
}

export function AufteilenPanel(props: {
  eintrag: MeldeEintrag;
  onAbbrechen: () => void;
  onAufteilen: (wahl: AufteilungsWahl, opt: AufteilungOptionen) => void;
}) {
  const { eintrag, onAbbrechen, onAufteilen } = props;
  const bogen = eintrag.bogen;
  const org = bogen.einheit.organisation;
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const ganz = staerke(bogen);

  const kopf = useRef<HTMLHeadingElement>(null);
  // Das Formular öffnet unter dem Knopf — am Telefon unterhalb des Bildes, ein zweiter Tipp schloss es wieder (R15-E4):
  // Überschrift an den oberen Bildrand rollen, damit das erste Feld im Bild steht.
  useEffect(() => {
    kopf.current?.focus({ preventScroll: true });
    kopf.current?.scrollIntoView?.({ block: "start" });
  }, []);
  const [teilEtikett, setTeilEtikett] = useState("");
  const [personal, setPersonal] = useState<number[]>([]);
  const [fahrzeuge, setFahrzeuge] = useState<number[]>([]);
  const [teilStaerke, setTeilStaerke] = useState<TeilStaerke>({ fuehrer: 0, unterfuehrer: 0, mannschaft: 0 });
  const [unterbringung, setUnterbringung] = useState({ m: 0, w: 0, d: 0 });
  const [verpflegung, setVerpflegung] = useState({ vegetarisch: 0, vegan: 0 });
  const [abgerueckt, setAbgerueckt] = useState(false);
  const [zug, setZug] = useState(eintrag.zugEtikett ?? "");

  const zeigeUnterbringung = nurStaerke && bogen.unterbringungManuell != null;
  const zeigeVerpflegung = nurStaerke && bogen.verpflegungManuell != null;

  const wahl: AufteilungsWahl = {
    teilEtikett,
    personal,
    fahrzeuge,
    staerke: nurStaerke ? teilStaerke : undefined,
    unterbringung: zeigeUnterbringung ? unterbringung : undefined,
    verpflegung: zeigeVerpflegung ? verpflegung : undefined,
  };
  const fehler = aufteilungFehler(bogen, wahl);
  // Vorschau nur, wenn die Auswahl trägt — teileBogen wirft sonst.
  const vorschau = fehler ? null : teileBogen(bogen, wahl, bogen.stand);

  function umschalten(liste: number[], setzen: (l: number[]) => void, i: number) {
    setzen(liste.includes(i) ? liste.filter((x) => x !== i) : [...liste, i]);
  }

  function staerkeFeld(label: string, wert: number, hoechstens: number, setzen: (n: number) => void) {
    return <StaerkeFeld label={label} wert={wert} hoechstens={hoechstens} setzen={setzen} />;
  }

  return (
    <div className="aufteilen-panel">
      {/* Fokus auf die Überschrift statt ins Textfeld: keine Bildschirmtastatur vor der Personenliste (R11-G2). */}
      <h4 tabIndex={-1} ref={kopf}>Aufteilen</h4>
      <p className="hinweis">
        Wer und was geht weg? Der Rest bleibt als diese Einheit bestehen und bekommt eine neue Meldung;
        der abgeteilte Teil zählt ab sofort getrennt in den Summen.
      </p>

      <label className="feld">
        Bezeichnung des abgeteilten Teils
        <input
          type="text"
          value={teilEtikett}
          placeholder="z. B. Fachberater"
          onChange={(e) => setTeilEtikett(e.target.value)}
        />
      </label>

      {nurStaerke ? (
        <>
          <h5>Stärke, die mitgeht</h5>
          <p className="hinweis">
            Für diese Einheit sind nur Zahlen gemeldet, keine Namen — der Rest bekommt die Differenz.
          </p>
          <div className="zeile">
            {staerkeFeld("Führer", teilStaerke.fuehrer, ganz.fuehrer, (n) =>
              setTeilStaerke({ ...teilStaerke, fuehrer: n }),
            )}
            {staerkeFeld("Unterführer", teilStaerke.unterfuehrer, ganz.unterfuehrer, (n) =>
              setTeilStaerke({ ...teilStaerke, unterfuehrer: n }),
            )}
            {staerkeFeld("Mannschaft", teilStaerke.mannschaft, ganz.mannschaft, (n) =>
              setTeilStaerke({ ...teilStaerke, mannschaft: n }),
            )}
          </div>
          {zeigeUnterbringung && (
            <div className="zeile">
              {staerkeFeld("Unterbringung männlich", unterbringung.m, bogen.unterbringungManuell!.m, (n) =>
                setUnterbringung({ ...unterbringung, m: n }),
              )}
              {staerkeFeld("weiblich", unterbringung.w, bogen.unterbringungManuell!.w, (n) =>
                setUnterbringung({ ...unterbringung, w: n }),
              )}
              {staerkeFeld("divers", unterbringung.d, bogen.unterbringungManuell!.d, (n) =>
                setUnterbringung({ ...unterbringung, d: n }),
              )}
            </div>
          )}
          {zeigeVerpflegung && (
            <div className="zeile">
              {staerkeFeld("Vegetarisch", verpflegung.vegetarisch, bogen.verpflegungManuell!.vegetarisch, (n) =>
                setVerpflegung({ ...verpflegung, vegetarisch: n }),
              )}
              {staerkeFeld("Vegan", verpflegung.vegan, bogen.verpflegungManuell!.vegan, (n) =>
                setVerpflegung({ ...verpflegung, vegan: n }),
              )}
            </div>
          )}
          {bogen.personal.length > 0 && (
            <>
              <h5>Ansprechpartner:innen, die mitgehen</h5>
              {bogen.personal.map((p, i) => (
                <AnkreuzZeile
                  key={i}
                  an={personal.includes(i)}
                  umschalten={() => umschalten(personal, setPersonal, i)}
                  name={`${p.nachname}${p.nachname && p.vorname ? ", " : ""}${p.vorname}`}
                  sub={funktionsText(p, org)}
                />
              ))}
            </>
          )}
        </>
      ) : (
        <>
          <h5>Personal, das mitgeht ({personal.length} von {bogen.personal.length})</h5>
          {bogen.personal.length === 0 && <p className="hinweis">Kein Personal erfasst.</p>}
          {bogen.personal.map((p, i) => (
            <AnkreuzZeile
              key={i}
              an={personal.includes(i)}
              umschalten={() => umschalten(personal, setPersonal, i)}
              name={`${p.nachname}${p.nachname && p.vorname ? ", " : ""}${p.vorname}`}
              sub={funktionsText(p, org)}
            />
          ))}
        </>
      )}

      <h5>Fahrzeuge, die mitgehen ({fahrzeuge.length} von {bogen.fahrzeuge.length})</h5>
      {bogen.fahrzeuge.length === 0 && <p className="hinweis">Keine Fahrzeuge erfasst.</p>}
      {bogen.fahrzeuge.map((f, i) => (
        <AnkreuzZeile
          key={i}
          an={fahrzeuge.includes(i)}
          umschalten={() => umschalten(fahrzeuge, setFahrzeuge, i)}
          name={vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "Fahrzeug"}
          sub={kennzeichenText(f)}
        />
      ))}

      <div className="zeile">
        <label className="feld">
          Verbleib des abgeteilten Teils
          <Auswahl
            beschriftung="Verbleib des abgeteilten Teils"
            value={abgerueckt ? "ab" : "da"}
            onChange={(e) => setAbgerueckt(e.target.value === "ab")}
          >
            <option value="da">bleibt im Einsatz</option>
            <option value="ab">ist abgerückt</option>
          </Auswahl>
        </label>
        <label className="feld">
          Zug des abgeteilten Teils
          <input
            type="text"
            value={zug}
            placeholder="ohne Zug"
            onChange={(e) => setZug(e.target.value)}
          />
        </label>
      </div>

      {/* Kraftstoff ist nicht sinnvoll teilbar und bleibt darum ganz beim Rest —
          das gehört gesagt, bevor jemand die Zahl später vermisst. */}
      {bogen.sofortbedarf && (
        <p className="hinweis">
          Kraftstoff bleibt beim Rest; die Verpflegungszahl zieht mit der Stärke um. Beides lässt sich
          in beiden Meldungen nachträglich richtigstellen.
        </p>
      )}

      {vorschau ? (
        <p className="aufteilen-vorschau">
          <strong>Rest:</strong> {bilanz(vorschau.rest)}
          {" — "}
          <strong>{teilEtikett.trim()}:</strong> {bilanz(vorschau.abgeteilt)}
        </p>
      ) : (
        <p className="hinweis aufteilen-fehler">{fehler}</p>
      )}

      <div className="vorlage-aktionen">
        <button
          type="button"
          className="primaer"
          disabled={fehler != null}
          onClick={async () => {
            // R13-D3: Wer alles auswählt, will meist umbenennen oder verlagern — der Rest bliebe leer stehen.
            if (vorschau && restLeer(vorschau.rest)) {
              const weiter = await frageJaNein({
                titel: REST_LEER_TITEL,
                text: REST_LEER_TEXT,
                ok: "Trotzdem aufteilen",
                abbruch: "Zurück zur Auswahl",
                fokus: "abbruch",
              });
              if (!weiter) return;
            }
            onAufteilen(wahl, {
              status: abgerueckt ? MeldeStatus.ABGERUECKT : MeldeStatus.ANWESEND,
              zugEtikett: zug,
            });
          }}
        >
          Aufteilen
        </button>{" "}
        <button type="button" onClick={onAbbrechen}>Abbrechen</button>
      </div>
    </div>
  );
}
