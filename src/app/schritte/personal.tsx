/**
 * Schritt 3 — Personal: Detail-Karten, Schnelleingabe-Tabelle, Namens-Import
 * und die Meldekopf-Schnellerfassung (nur Stärke).
 */

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  Ernaehrung,
  Geschlecht,
  Kontakt,
  KontaktArt,
  OrganisationsTyp,
  Person,
  PersonalErfassung,
  StaerkeRolle,
  staerke,
  unterbringungMWD,
  verpflegung,
} from "../../model";
import { parseNamen } from "../personal-schnell";
import { stanPersonalVorbelegung } from "../../vokabulare/thw-stan-personal";
import { FE_TEXT, neuePerson, plausibilitaet, vokabularFuer } from "../hilfen";
import { frageJaNein } from "../dialoge";
import {
  Feld,
  Auswahl,
  Hinweise,
  MWD_LEGENDE,
  STAERKE_LEGENDE,
  Stepper,
  VokabListe,
  staerkeVorlesen,
  zahl,
  type SchrittProps,
} from "./bausteine";

function KontakteEditor(props: { kontakte: Kontakt[]; aendern: (k: Kontakt[]) => void; thw: boolean }) {
  const { kontakte, aendern, thw } = props;
  const set = (i: number, p: Partial<Kontakt>) => aendern(kontakte.map((k, j) => (j === i ? { ...k, ...p } : k)));
  return (
    <div>
      {kontakte.map((k, i) => (
        <div className="zeile" key={i}>
          <Feld titel="Art" schmal>
            <Auswahl
              value={k.art}
              onChange={(e) => set(i, { art: Number(e.target.value), emailTemplate: undefined, wert: "" })}
            >
              <option value={KontaktArt.MOBIL}>Mobil</option>
              <option value={KontaktArt.FESTNETZ}>Festnetz</option>
              <option value={KontaktArt.EMAIL}>eMail</option>
            </Auswahl>
          </Feld>
          {k.art === KontaktArt.EMAIL && thw && (
            <label className="inline">
              <input
                type="checkbox"
                checked={k.emailTemplate === 1}
                onChange={(e) => set(i, { emailTemplate: e.target.checked ? 1 : undefined, wert: e.target.checked ? undefined : "" })}
              />
              THW-Standardadresse
            </label>
          )}
          {!(k.art === KontaktArt.EMAIL && k.emailTemplate === 1) && (
            <Feld titel={k.art === KontaktArt.EMAIL ? "Adresse" : "Nummer"}>
              <input
                value={k.wert ?? ""}
                onChange={(e) => set(i, { wert: k.art === KontaktArt.EMAIL ? e.target.value : e.target.value.replace(/\D/g, "") })}
              />
            </Feld>
          )}
          <label className="inline">
            <input type="checkbox" checked={k.dienstlich} onChange={(e) => set(i, { dienstlich: e.target.checked })} />
            dienstlich
          </label>
          <button type="button" onClick={() => aendern(kontakte.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => aendern([...kontakte, { art: KontaktArt.MOBIL, dienstlich: false, wert: "" }])}>
        + Kontakt
      </button>
    </div>
  );
}

function PersonKarte(props: {
  person: Person;
  org: OrganisationsTyp;
  aendern: (p: Person) => void;
  entfernen: () => void;
}) {
  const { person: p, org, aendern, entfernen } = props;
  const set = (patch: Partial<Person>) => aendern({ ...p, ...patch });
  const funktionen = vokabularFuer(org, "funktion");
  return (
    <div className="karte">
      <button type="button" className="entfernen" onClick={entfernen}>Person entfernen</button>
      <div className="zeile">
        <Feld titel="Vorname"><input value={p.vorname} onChange={(e) => set({ vorname: e.target.value })} /></Feld>
        <Feld titel="Nachname"><input value={p.nachname} onChange={(e) => set({ nachname: e.target.value })} /></Feld>
        <Feld titel="Stärkerolle (vor Ort)" schmal>
          <Auswahl value={p.staerkeRolle} onChange={(e) => set({ staerkeRolle: Number(e.target.value) })}>
            <option value={StaerkeRolle.FUEHRER}>Führer/in</option>
            <option value={StaerkeRolle.UNTERFUEHRER}>Unterführer/in</option>
            <option value={StaerkeRolle.MANNSCHAFT}>Mannschaft</option>
          </Auswahl>
        </Feld>
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
        <Feld titel="Fahrerlaubnis" schmal>
          <Auswahl value={p.fahrerlaubnis} onChange={(e) => set({ fahrerlaubnis: Number(e.target.value) })}>
            {Object.entries(FE_TEXT).map(([wert, text]) => (
              <option key={wert} value={wert}>{text}</option>
            ))}
          </Auswahl>
        </Feld>
      </div>
      <Feld titel="Funktionen / Zusatzfunktionen">
        <VokabListe werte={p.funktionen} aendern={(w) => set({ funktionen: w })} tabelle={funktionen} hinzufuegenText="Funktion" />
      </Feld>
      <Feld titel="Weitere Qualifikationen">
        <VokabListe werte={p.zusatzqualifikationen} aendern={(w) => set({ zusatzqualifikationen: w })} tabelle={[]} hinzufuegenText="Qualifikation" />
      </Feld>
      <h3>Erreichbarkeiten</h3>
      <KontakteEditor kontakte={p.kontakte} aendern={(k) => set({ kontakte: k })} thw={org === OrganisationsTyp.THW} />
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
}) {
  const { personal, aendern, fokusNeue, aufNeueFokus } = props;
  const set = (i: number, patch: Partial<Person>) =>
    aendern(personal.map((p, j) => (j === i ? { ...p, ...patch } : p)));

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
    <div className="tabellen-scroll">
      <table className="uebersicht schnell-tabelle">
        <thead>
          <tr><th>Vorname</th><th>Nachname</th><th>Stärkerolle</th><th>Geschlecht</th><th aria-label="Entfernen" /></tr>
        </thead>
        <tbody>
          {personal.map((p, i) => (
            <tr key={i}>
              <td>
                <input
                  value={p.vorname}
                  autoFocus={fokusNeue && i === personal.length - 1}
                  onChange={(e) => set(i, { vorname: e.target.value })}
                  onKeyDown={(e) => enterWeiter(e, i)}
                />
              </td>
              <td>
                <input
                  value={p.nachname}
                  onChange={(e) => set(i, { nachname: e.target.value })}
                  onKeyDown={(e) => enterWeiter(e, i)}
                />
              </td>
              <td>
                {/* In der Tabelle gibt es kein <Feld> — Beschriftung wie beim
                    Entfernen-Knopf mit der Zeilennummer, sonst heißen alle gleich. */}
                <Auswahl
                  beschriftung={`Person ${i + 1}: Stärkerolle`}
                  value={p.staerkeRolle}
                  onChange={(e) => set(i, { staerkeRolle: Number(e.target.value) })}
                >
                  <option value={StaerkeRolle.FUEHRER}>Führer/in</option>
                  <option value={StaerkeRolle.UNTERFUEHRER}>Unterführer/in</option>
                  <option value={StaerkeRolle.MANNSCHAFT}>Mannschaft</option>
                </Auswahl>
              </td>
              <td>
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
              <td>
                <button
                  type="button"
                  aria-label={`Person ${i + 1} entfernen`}
                  onClick={() => aendern(personal.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SchrittPersonal({ bogen, aendern }: SchrittProps) {
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const vorlage = stanPersonalVorbelegung(bogen.einheit.organisation, bogen.einheit.einheitsTyp);
  // Schnelleingabe: Tabellenansicht statt Detail-Karten; `fokusNeue` lässt den
  // Fokus beim Anlegen per Enter in die neue Zeile springen.
  const [schnell, setSchnell] = useState(false);
  const [fokusNeue, setFokusNeue] = useState(false);
  const namenDialog = useRef<HTMLDialogElement>(null);
  const [namenText, setNamenText] = useState("");
  const namenVorschau = parseNamen(namenText);

  function namenUebernehmen() {
    if (namenVorschau.length === 0) return;
    aendern({ personal: [...bogen.personal, ...namenVorschau.map((n) => ({ ...neuePerson(), ...n }))] });
    setSchnell(true); // die frisch eingefügten Namen direkt als Tabelle zeigen
    setNamenText("");
    namenDialog.current?.close();
  }
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);
  const sm = bogen.staerkeManuell ?? { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 };
  const setSm = (p: Partial<typeof sm>) => {
    const neu = { ...sm, ...p };
    neu.gesamt = neu.fuehrer + neu.unterfuehrer + neu.mannschaft;
    aendern({ staerkeManuell: neu });
  };
  const vp = verpflegung(bogen);
  const setVp = (patch: Partial<{ vegetarisch: number; vegan: number }>) =>
    aendern({ verpflegungManuell: { vegetarisch: vp.vegetarisch, vegan: vp.vegan, ...patch } });

  return (
    <section className="karte">
      <h2>3. Personal</h2>
      <p>
        <label className="inline">
          <input
            type="radio"
            name="perfassung"
            checked={!nurStaerke}
            onChange={() => aendern({ personalErfassung: PersonalErfassung.VOLLSTAENDIG, staerkeManuell: undefined, unterbringungManuell: undefined })}
          />
          Personal vollständig erfassen
        </label>
        <label className="inline">
          <input
            type="radio"
            name="perfassung"
            checked={nurStaerke}
            onChange={() => aendern({ personalErfassung: PersonalErfassung.NUR_STAERKE, staerkeManuell: sm })}
          />
          Nur Stärke (Meldekopf-Schnellerfassung)
        </label>
      </p>

      {nurStaerke && (
        <>
          <div className="zeile">
            <Feld titel="Führer" schmal>
              <input type="number" min={0} value={sm.fuehrer} onChange={(e) => setSm({ fuehrer: zahl(e.target.value) })} />
            </Feld>
            <Feld titel="Unterführer" schmal>
              <input type="number" min={0} value={sm.unterfuehrer} onChange={(e) => setSm({ unterfuehrer: zahl(e.target.value) })} />
            </Feld>
            <Feld titel="Mannschaft" schmal>
              <input type="number" min={0} value={sm.mannschaft} onChange={(e) => setSm({ mannschaft: zahl(e.target.value) })} />
            </Feld>
            <Feld titel="Gesamt" schmal>
              <input value={sm.gesamt} readOnly />
            </Feld>
          </div>
          <div className="zeile">
            <label className="inline">
              <input
                type="checkbox"
                checked={bogen.unterbringungManuell != null}
                onChange={(e) => aendern({ unterbringungManuell: e.target.checked ? { m: 0, w: 0, d: 0 } : undefined })}
              />
              Unterbringung M/W/D angeben
            </label>
            {bogen.unterbringungManuell && (
              <>
                {(["m", "w", "d"] as const).map((g) => (
                  <Feld key={g} titel={g.toUpperCase()} schmal>
                    <input
                      type="number"
                      min={0}
                      value={bogen.unterbringungManuell![g]}
                      onChange={(e) => aendern({ unterbringungManuell: { ...bogen.unterbringungManuell!, [g]: zahl(e.target.value) } })}
                    />
                  </Feld>
                ))}
              </>
            )}
          </div>
          <h3>Verpflegung</h3>
          <div className="stepper-zeile">
            <Stepper titel="vegetarisch" wert={vp.vegetarisch} setzen={(n) => setVp({ vegetarisch: n })} />
            <Stepper titel="vegan" wert={vp.vegan} setzen={(n) => setVp({ vegan: n })} />
            <span className="hinweis stepper-rest">
              {vp.vegetarisch + vp.vegan} von {sm.gesamt} vegetarisch/vegan · {Math.max(0, sm.gesamt - vp.vegetarisch - vp.vegan)} sonstige
            </span>
          </div>
          <h3>Führungskraft / Ansprechpartner</h3>
        </>
      )}
      {!nurStaerke && (
        <p className="hinweis">
          Stärke (abgeleitet):{" "}
          <strong title={STAERKE_LEGENDE} aria-label={`Stärke: ${staerkeVorlesen(s)}`}>
            {s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt}
          </strong>
          {" "}<span className="legende">({STAERKE_LEGENDE})</span>
          {" · "}
          <span title={MWD_LEGENDE}>Unterbringung: M {mwd.m} / W {mwd.w} / D {mwd.d}</span>
        </p>
      )}

      <Hinweise hinweise={plausibilitaet(bogen, false)} />

      {!nurStaerke && vorlage.length > 0 && (
        <p>
          <button
            type="button"
            onClick={async () => {
              if (
                bogen.personal.length === 0 ||
                (await frageJaNein({
                  titel: "StAN-Sollplätze laden?",
                  text: `Die aktuelle Personalliste (${bogen.personal.length} Personen) wird durch die ${vorlage.length} Sollplätze der StAN ersetzt.`,
                  ok: "Ersetzen",
                }))
              ) {
                aendern({ personal: vorlage });
              }
            }}
          >
            StAN-Sollplätze laden ({vorlage.length} Personen)
          </button>
        </p>
      )}
      {/* Ansichtswahl: Detail-Karten (alle Felder) oder Schnelleingabe-Tabelle
          (viele Personen zügig erfassen); dazu Mehrzeilen-Import fertiger Listen. */}
      {!nurStaerke && (
        <p className="ansicht-wahl">
          <label className="inline">
            <input type="radio" name="pansicht" checked={!schnell} onChange={() => { setSchnell(false); setFokusNeue(false); }} />
            Detail-Karten
          </label>
          <label className="inline">
            <input type="radio" name="pansicht" checked={schnell} onChange={() => { setSchnell(true); setFokusNeue(false); }} />
            Schnelleingabe (Tabelle)
          </label>
          <button type="button" onClick={() => { setNamenText(""); namenDialog.current?.showModal(); }}>
            Namen einfügen…
          </button>
        </p>
      )}
      {!nurStaerke && schnell ? (
        bogen.personal.length > 0 && (
          <PersonalSchnellTabelle
            personal={bogen.personal}
            aendern={(p) => aendern({ personal: p })}
            fokusNeue={fokusNeue}
            aufNeueFokus={() => setFokusNeue(true)}
          />
        )
      ) : (
        bogen.personal.map((p, i) => (
          <PersonKarte
            key={i}
            person={p}
            org={bogen.einheit.organisation}
            aendern={(np) => aendern({ personal: bogen.personal.map((x, j) => (j === i ? np : x)) })}
            entfernen={() => aendern({ personal: bogen.personal.filter((_, j) => j !== i) })}
          />
        ))
      )}
      <button
        type="button"
        className="primaer"
        onClick={() => {
          setFokusNeue(true);
          aendern({ personal: [...bogen.personal, neuePerson()] });
        }}
      >
        + Person hinzufügen
      </button>

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
        <textarea
          rows={8}
          value={namenText}
          onChange={(e) => setNamenText(e.target.value)}
          placeholder={"Muster, Max\nErika Musterfrau\n…"}
          style={{ width: "100%" }}
        />
        <p>
          <button type="button" className="primaer" disabled={namenVorschau.length === 0} onClick={namenUebernehmen}>
            {namenVorschau.length === 0
              ? "Übernehmen"
              : `${namenVorschau.length} ${namenVorschau.length === 1 ? "Person" : "Personen"} übernehmen`}
          </button>
        </p>
      </dialog>
    </section>
  );
}
