/**
 * Assistenten-Schritte und Gesamtübersicht der SPA.
 * Schritte: Einheit → Einsatz → Personal → Fahrzeuge → Sofortbedarf → Übersicht.
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  Erfassungsbogen,
  Einheit,
  Einsatz,
  Fahrzeug,
  Geschlecht,
  Kontakt,
  KontaktArt,
  OrganisationsTyp,
  Person,
  PersonalErfassung,
  StaerkeRolle,
  VokabularWert,
  datumAusIso,
  datumZuIso,
  staerke,
  unterbringungMWD,
  zeitpunktAusIso,
  zeitpunktZuIso,
} from "../model";
import type { VokabularEintrag } from "../vokabulare/thw";
import {
  FE_TEXT,
  ORG_OPTIONEN,
  QrInfo,
  bogenSpeichern,
  datumDeutsch,
  funkrufText,
  funktionsText,
  kennzeichenText,
  neuePerson,
  neuesFahrzeug,
  orgLabel,
  plausibilitaet,
  qrErzeugen,
  vokabText,
  vokabularFuer,
} from "./hilfen";
import { pdfErzeugen } from "./pdf";

export type SchrittProps = {
  bogen: Erfassungsbogen;
  aendern: (patch: Partial<Erfassungsbogen>) => void;
};

// -------------------------------------------------------------- Bausteine

function VokabAuswahl(props: {
  wert: VokabularWert;
  aendern: (v: VokabularWert) => void;
  tabelle: VokabularEintrag[];
  platzhalter: string;
}) {
  const { wert, aendern, tabelle, platzhalter } = props;
  if (tabelle.length === 0) {
    return (
      <input
        value={wert.freitext ?? ""}
        onChange={(e) => aendern({ freitext: e.target.value })}
        placeholder={platzhalter}
      />
    );
  }
  const istFrei = wert.code == null;
  return (
    <span style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
      <select
        value={istFrei ? "frei" : String(wert.code)}
        onChange={(e) => {
          const v = e.target.value;
          aendern(v === "frei" ? { freitext: "" } : { code: Number(v) });
        }}
      >
        <option value="frei">Freitext…</option>
        {tabelle.map((t) => (
          <option key={t.code} value={t.code}>
            {t.kurz} – {t.name}
          </option>
        ))}
      </select>
      {istFrei && (
        <input
          value={wert.freitext ?? ""}
          onChange={(e) => aendern({ freitext: e.target.value })}
          placeholder={platzhalter}
        />
      )}
    </span>
  );
}

function VokabListe(props: {
  werte: VokabularWert[];
  aendern: (w: VokabularWert[]) => void;
  tabelle: VokabularEintrag[];
  hinzufuegenText: string;
}) {
  const { werte, aendern, tabelle, hinzufuegenText } = props;
  return (
    <span className="chips">
      {werte.map((w, i) => (
        <span key={i} className="chip">
          {w.code != null ? (tabelle.find((t) => t.code === w.code)?.kurz ?? `#${w.code}`) : w.freitext}
          <button type="button" onClick={() => aendern(werte.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      <select
        value=""
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          if (v === "frei") {
            const t = window.prompt(`${hinzufuegenText} (Freitext):`);
            if (t) aendern([...werte, { freitext: t }]);
          } else {
            aendern([...werte, { code: Number(v) }]);
          }
          e.target.value = "";
        }}
      >
        <option value="">{hinzufuegenText}…</option>
        {tabelle.map((t) => (
          <option key={t.code} value={t.code}>
            {t.kurz} – {t.name}
          </option>
        ))}
        <option value="frei">Freitext…</option>
      </select>
    </span>
  );
}

function Feld(props: { titel: string; schmal?: boolean; children: ReactNode }) {
  return (
    <label className={`feld${props.schmal ? " schmal" : ""}`}>
      {props.titel}
      {props.children}
    </label>
  );
}

const zahl = (s: string): number => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Plausibilitätshinweise (nicht blockierend). */
function Hinweise({ bogen }: { bogen: Erfassungsbogen }) {
  return (
    <>
      {plausibilitaet(bogen).map((h) => (
        <p key={h} className="warnung">⚠ {h}</p>
      ))}
    </>
  );
}

/**
 * Eingabefeld für Funkruf-Kennzahlen ("18/13").
 * Lokaler Text-Zustand, damit Trennzeichen beim Tippen erhalten bleiben —
 * geparst wird im Hintergrund (je Teil 0–255, wie im QR-Format).
 */
function KennzahlenFeld(props: { teile: number[]; aendern: (t: number[]) => void }) {
  const [text, setText] = useState(props.teile.join("/"));
  return (
    <input
      value={text}
      placeholder="18/13"
      onChange={(e) => {
        setText(e.target.value);
        props.aendern(
          e.target.value
            .split(/[^0-9]+/)
            .filter(Boolean)
            .map((n) => Math.min(255, zahl(n))),
        );
      }}
    />
  );
}

// --------------------------------------------------------- Schritt Einheit

export function SchrittEinheit({ bogen, aendern }: SchrittProps) {
  const e = bogen.einheit;
  const setE = (p: Partial<Einheit>) => aendern({ einheit: { ...e, ...p } });
  const ebenen = vokabularFuer(e.organisation, "ebene");

  return (
    <section className="karte">
      <h2>1. Einheit</h2>
      <div className="zeile">
        <Feld titel="Organisation">
          <select
            value={e.organisation}
            onChange={(ev) => setE({ organisation: Number(ev.target.value), einheitsTyp: {}, hierarchie: [] })}
          >
            {ORG_OPTIONEN.map((o) => (
              <option key={o.wert} value={o.wert}>{o.label}</option>
            ))}
          </select>
        </Feld>
        <Feld titel={`Organisationsname${e.organisation === OrganisationsTyp.SONSTIGE ? " (Pflicht)" : " (optional)"}`}>
          <input
            value={e.organisationName ?? ""}
            onChange={(ev) => setE({ organisationName: ev.target.value || undefined })}
            placeholder="z. B. Freiwillige Feuerwehr Wardenburg"
          />
        </Feld>
      </div>
      <div className="zeile">
        <Feld titel="Einheitstyp">
          <VokabAuswahl
            wert={e.einheitsTyp}
            aendern={(v) => setE({ einheitsTyp: v })}
            tabelle={vokabularFuer(e.organisation, "einheitstyp")}
            platzhalter="z. B. Löschzug, SEG Sanität"
          />
        </Feld>
        <Feld titel="Name der Einheit">
          <input
            value={e.name}
            onChange={(ev) => setE({ name: ev.target.value })}
            placeholder="z. B. OV Oldenburg - Ni"
          />
        </Feld>
      </div>

      <h3>Zugehörigkeit / Kontaktstellen</h3>
      {e.hierarchie.map((h, i) => (
        <div className="zeile" key={i}>
          <Feld titel="Ebene" schmal>
            <VokabAuswahl
              wert={h.bezeichnung}
              aendern={(v) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, bezeichnung: v } : x)) })}
              tabelle={ebenen}
              platzhalter="z. B. Landkreis"
            />
          </Feld>
          <Feld titel="Name">
            <input
              value={h.name}
              onChange={(ev) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)) })}
            />
          </Feld>
          <Feld titel="Telefon" schmal>
            <input
              value={h.telefon ?? ""}
              onChange={(ev) =>
                setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, telefon: ev.target.value.replace(/\D/g, "") || undefined } : x)) })
              }
            />
          </Feld>
          <Feld titel="eMail">
            <input
              value={h.email ?? ""}
              onChange={(ev) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, email: ev.target.value || undefined } : x)) })}
            />
          </Feld>
          <button type="button" onClick={() => setE({ hierarchie: e.hierarchie.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <p>
        <button type="button" onClick={() => setE({ hierarchie: [...e.hierarchie, { bezeichnung: {}, name: "" }] })}>
          + Ebene hinzufügen
        </button>{" "}
        {e.organisation === OrganisationsTyp.THW && e.hierarchie.length === 0 && (
          <button
            type="button"
            onClick={() =>
              setE({
                hierarchie: [
                  { bezeichnung: { code: 1 }, name: "" },
                  { bezeichnung: { code: 2 }, name: "" },
                  { bezeichnung: { code: 3 }, name: "" },
                ],
              })
            }
          >
            OV/RB/LV-Vorlage
          </button>
        )}
      </p>
    </section>
  );
}

// --------------------------------------------------------- Schritt Einsatz

export function SchrittEinsatz({ bogen, aendern }: SchrittProps) {
  const ez = bogen.einsatz;
  const setEz = (p: Partial<Einsatz>) => aendern({ einsatz: { ...ez, ...p } });
  const jetztLokal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  return (
    <section className="karte">
      <h2>2. Einsatz</h2>
      <div className="zeile">
        <Feld titel="Zeitraum von" schmal>
          <input type="date" value={datumZuIso(ez.zeitraumVon)} onChange={(e) => setEz({ zeitraumVon: datumAusIso(e.target.value) })} />
        </Feld>
        <Feld titel="Zeitraum bis" schmal>
          <input type="date" value={datumZuIso(ez.zeitraumBis)} onChange={(e) => setEz({ zeitraumBis: datumAusIso(e.target.value) })} />
        </Feld>
        <Feld titel="Einsatzort / Auftrag">
          <input value={ez.ortAuftrag} onChange={(e) => setEz({ ortAuftrag: e.target.value })} placeholder="z. B. Fernmeldebauübung Kabelblitz" />
        </Feld>
      </div>
      <div className="zeile">
        <span className="inline">
          <input
            type="checkbox"
            checked={ez.einsatzbeginn != null}
            onChange={(e) => setEz({ einsatzbeginn: e.target.checked ? zeitpunktAusIso(jetztLokal()) : undefined })}
          />
          Einsatzbeginn
        </span>
        {ez.einsatzbeginn != null && (
          <input type="datetime-local" value={zeitpunktZuIso(ez.einsatzbeginn)} onChange={(e) => setEz({ einsatzbeginn: zeitpunktAusIso(e.target.value) })} />
        )}
        <span className="inline">
          <input
            type="checkbox"
            checked={ez.einsatzende != null}
            onChange={(e) => setEz({ einsatzende: e.target.checked ? zeitpunktAusIso(jetztLokal()) : undefined })}
          />
          Einsatzende
        </span>
        {ez.einsatzende != null && (
          <input type="datetime-local" value={zeitpunktZuIso(ez.einsatzende)} onChange={(e) => setEz({ einsatzende: zeitpunktAusIso(e.target.value) })} />
        )}
      </div>
    </section>
  );
}

// -------------------------------------------------------- Schritt Personal

function KontakteEditor(props: { kontakte: Kontakt[]; aendern: (k: Kontakt[]) => void; thw: boolean }) {
  const { kontakte, aendern, thw } = props;
  const set = (i: number, p: Partial<Kontakt>) => aendern(kontakte.map((k, j) => (j === i ? { ...k, ...p } : k)));
  return (
    <div>
      {kontakte.map((k, i) => (
        <div className="zeile" key={i}>
          <Feld titel="Art" schmal>
            <select
              value={k.art}
              onChange={(e) => set(i, { art: Number(e.target.value), emailTemplate: undefined, wert: "" })}
            >
              <option value={KontaktArt.MOBIL}>Mobil</option>
              <option value={KontaktArt.FESTNETZ}>Festnetz</option>
              <option value={KontaktArt.EMAIL}>eMail</option>
            </select>
          </Feld>
          {k.art === KontaktArt.EMAIL && thw && (
            <span className="inline">
              <input
                type="checkbox"
                checked={k.emailTemplate === 1}
                onChange={(e) => set(i, { emailTemplate: e.target.checked ? 1 : undefined, wert: e.target.checked ? undefined : "" })}
              />
              THW-Standardadresse
            </span>
          )}
          {!(k.art === KontaktArt.EMAIL && k.emailTemplate === 1) && (
            <Feld titel={k.art === KontaktArt.EMAIL ? "Adresse" : "Nummer"}>
              <input
                value={k.wert ?? ""}
                onChange={(e) => set(i, { wert: k.art === KontaktArt.EMAIL ? e.target.value : e.target.value.replace(/\D/g, "") })}
              />
            </Feld>
          )}
          <span className="inline">
            <input type="checkbox" checked={k.dienstlich} onChange={(e) => set(i, { dienstlich: e.target.checked })} />
            dienstlich
          </span>
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
          <select value={p.staerkeRolle} onChange={(e) => set({ staerkeRolle: Number(e.target.value) })}>
            <option value={StaerkeRolle.FUEHRER}>Führer/in</option>
            <option value={StaerkeRolle.UNTERFUEHRER}>Unterführer/in</option>
            <option value={StaerkeRolle.MANNSCHAFT}>Mannschaft</option>
          </select>
        </Feld>
        <Feld titel="Geschlecht" schmal>
          <select value={p.geschlecht} onChange={(e) => set({ geschlecht: Number(e.target.value) })}>
            <option value={Geschlecht.M}>M</option>
            <option value={Geschlecht.W}>W</option>
            <option value={Geschlecht.D}>D</option>
          </select>
        </Feld>
        <Feld titel="Fahrerlaubnis" schmal>
          <select value={p.fahrerlaubnis} onChange={(e) => set({ fahrerlaubnis: Number(e.target.value) })}>
            {Object.entries(FE_TEXT).map(([wert, text]) => (
              <option key={wert} value={wert}>{text}</option>
            ))}
          </select>
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

export function SchrittPersonal({ bogen, aendern }: SchrittProps) {
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);
  const sm = bogen.staerkeManuell ?? { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 };
  const setSm = (p: Partial<typeof sm>) => {
    const neu = { ...sm, ...p };
    neu.gesamt = neu.fuehrer + neu.unterfuehrer + neu.mannschaft;
    aendern({ staerkeManuell: neu });
  };

  return (
    <section className="karte">
      <h2>3. Personal</h2>
      <p>
        <span className="inline">
          <input
            type="radio"
            name="perfassung"
            checked={!nurStaerke}
            onChange={() => aendern({ personalErfassung: PersonalErfassung.VOLLSTAENDIG, staerkeManuell: undefined, unterbringungManuell: undefined })}
          />
          Personal vollständig erfassen
        </span>
        <span className="inline">
          <input
            type="radio"
            name="perfassung"
            checked={nurStaerke}
            onChange={() => aendern({ personalErfassung: PersonalErfassung.NUR_STAERKE, staerkeManuell: sm })}
          />
          Nur Stärke (Meldekopf-Schnellerfassung)
        </span>
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
            <span className="inline">
              <input
                type="checkbox"
                checked={bogen.unterbringungManuell != null}
                onChange={(e) => aendern({ unterbringungManuell: e.target.checked ? { m: 0, w: 0, d: 0 } : undefined })}
              />
              Unterbringung M/W/D angeben
            </span>
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
          <h3>Führungskraft / Ansprechpartner</h3>
        </>
      )}
      {!nurStaerke && (
        <p className="hinweis">
          Stärke (abgeleitet): <strong>{s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt}</strong> · Unterbringung: M {mwd.m} / W {mwd.w} / D {mwd.d}
        </p>
      )}

      <Hinweise bogen={bogen} />

      {bogen.personal.map((p, i) => (
        <PersonKarte
          key={i}
          person={p}
          org={bogen.einheit.organisation}
          aendern={(np) => aendern({ personal: bogen.personal.map((x, j) => (j === i ? np : x)) })}
          entfernen={() => aendern({ personal: bogen.personal.filter((_, j) => j !== i) })}
        />
      ))}
      <button type="button" className="primaer" onClick={() => aendern({ personal: [...bogen.personal, neuePerson()] })}>
        + Person hinzufügen
      </button>
    </section>
  );
}

// ------------------------------------------------------- Schritt Fahrzeuge

function FahrzeugKarte(props: {
  fahrzeug: Fahrzeug;
  org: OrganisationsTyp;
  aendern: (f: Fahrzeug) => void;
  entfernen: () => void;
}) {
  const { fahrzeug: f, org, aendern, entfernen } = props;
  const set = (patch: Partial<Fahrzeug>) => aendern({ ...f, ...patch });
  const istThwKz = f.thwKennzeichen != null;
  return (
    <div className="karte">
      <button type="button" className="entfernen" onClick={entfernen}>Fahrzeug entfernen</button>
      <div className="zeile">
        <Feld titel="Fahrzeugtyp">
          <VokabAuswahl wert={f.typ} aendern={(v) => set({ typ: v })} tabelle={vokabularFuer(org, "fahrzeug")} platzhalter="z. B. MzKW, LF 20" />
        </Feld>
        <Feld titel="Kennzeichen-Art" schmal>
          <select
            value={istThwKz ? "thw" : "frei"}
            onChange={(e) =>
              e.target.value === "thw"
                ? set({ thwKennzeichen: 0, kennzeichenFreitext: undefined })
                : set({ thwKennzeichen: undefined, kennzeichenFreitext: "" })
            }
          >
            <option value="thw">THW-Nummer</option>
            <option value="frei">Kennzeichen</option>
          </select>
        </Feld>
        {istThwKz ? (
          <Feld titel="THW-Nummer (nur Ziffern)" schmal>
            <input
              value={f.thwKennzeichen || ""}
              onChange={(e) => set({ thwKennzeichen: zahl(e.target.value.replace(/\D/g, "")) })}
              placeholder="84397"
            />
          </Feld>
        ) : (
          <Feld titel="Kennzeichen" schmal>
            <input value={f.kennzeichenFreitext ?? ""} onChange={(e) => set({ kennzeichenFreitext: e.target.value })} placeholder="OL-FW 2041" />
          </Feld>
        )}
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
  return (
    <section className="karte">
      <h2>4. Fahrzeuge</h2>
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
    </section>
  );
}

// ---------------------------------------------------- Schritt Sofortbedarf

export function SchrittSofortbedarf({ bogen, aendern }: SchrittProps) {
  const s = bogen.sofortbedarf;
  const gesamt = staerke(bogen).gesamt;
  return (
    <section className="karte">
      <h2>5. Sofortbedarf & Sonstiges</h2>
      <p className="inline">
        <input
          type="checkbox"
          checked={s != null}
          onChange={(e) =>
            aendern({
              sofortbedarf: e.target.checked
                ? { verpflegungPersonen: gesamt, davonVegetarisch: 0, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false }
                : undefined,
            })
          }
        />
        Sofortbedarf erfassen
      </p>
      {s && (
        <>
          <div className="zeile">
            <Feld titel="Verpflegung (Personen)" schmal>
              <input type="number" min={0} value={s.verpflegungPersonen} onChange={(e) => aendern({ sofortbedarf: { ...s, verpflegungPersonen: zahl(e.target.value) } })} />
            </Feld>
            <Feld titel="davon vegetarisch" schmal>
              <input type="number" min={0} value={s.davonVegetarisch} onChange={(e) => aendern({ sofortbedarf: { ...s, davonVegetarisch: zahl(e.target.value) } })} />
            </Feld>
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
            <span className="inline">
              <input type="checkbox" checked={s.unterbringung} onChange={(e) => aendern({ sofortbedarf: { ...s, unterbringung: e.target.checked } })} />
              Unterbringung
            </span>
            <span className="inline">
              <input type="checkbox" checked={s.ruhezeitErforderlich} onChange={(e) => aendern({ sofortbedarf: { ...s, ruhezeitErforderlich: e.target.checked } })} />
              Ruhezeit erforderlich
            </span>
          </p>
        </>
      )}
      <Feld titel="Sonstiges (Freitext)">
        <textarea rows={3} value={bogen.sonstiges ?? ""} onChange={(e) => aendern({ sonstiges: e.target.value || undefined })} />
      </Feld>
    </section>
  );
}

// --------------------------------------------------------------- Übersicht

export function Uebersicht(props: {
  bogen: Erfassungsbogen;
  geheZu: (schritt: number) => void;
  neu: () => void;
}) {
  const { bogen, geheZu, neu } = props;
  const [qr, setQr] = useState<QrInfo | null>(null);
  const [fehler, setFehler] = useState("");
  const [pdfLaeuft, setPdfLaeuft] = useState(false);
  const org = bogen.einheit.organisation;
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);

  useEffect(() => {
    let aktiv = true;
    qrErzeugen(bogen)
      .then((q) => aktiv && setQr(q))
      .catch((e) => aktiv && setFehler(`QR-Code: ${e instanceof Error ? e.message : e}`));
    return () => {
      aktiv = false;
    };
  }, [bogen]);

  async function pdf() {
    setPdfLaeuft(true);
    setFehler("");
    try {
      await pdfErzeugen(bogen);
    } catch (e) {
      setFehler(`PDF: ${e instanceof Error ? e.message : e}`);
    } finally {
      setPdfLaeuft(false);
    }
  }

  const abschnitt = (titel: string, schritt: number, inhalt: ReactNode) => (
    <section className="karte" key={titel}>
      <div className="kopfzeile">
        <h2>{titel}</h2>
        <button type="button" onClick={() => geheZu(schritt)}>Bearbeiten</button>
      </div>
      {inhalt}
    </section>
  );

  return (
    <>
      <section className="karte">
        <div className="kopfzeile">
          <h2>Gesamtübersicht</h2>
          <span>
            <button type="button" className="primaer" onClick={pdf} disabled={pdfLaeuft}>
              {pdfLaeuft ? "PDF wird erstellt…" : "PDF erzeugen"}
            </button>{" "}
            <button type="button" onClick={() => bogenSpeichern(bogen)}>Als Datei speichern</button>{" "}
            <button type="button" onClick={() => window.confirm("Aktuellen Bogen verwerfen?") && neu()}>Neuer Bogen</button>
          </span>
        </div>
        {fehler && <p className="fehler">{fehler}</p>}
        <Hinweise bogen={bogen} />
        <p>
          <strong>{orgLabel(org)}</strong>
          {" · "}{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "(Einheitstyp offen)"}
          {" · "}{bogen.einheit.name || "(Name offen)"}
        </p>
        <p>
          Stärke: <strong>{s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt}</strong>
          {" · "}Unterbringung: M {mwd.m} / W {mwd.w} / D {mwd.d}
        </p>
      </section>

      {abschnitt("Einheit", 0, (
        <dl className="paare">
          <dt>Organisation</dt><dd>{orgLabel(org)}{bogen.einheit.organisationName ? ` — ${bogen.einheit.organisationName}` : ""}</dd>
          <dt>Einheitstyp</dt><dd>{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "—"}</dd>
          <dt>Name</dt><dd>{bogen.einheit.name || "—"}</dd>
          {bogen.einheit.hierarchie.map((h, i) => (
            <span key={i} style={{ display: "contents" }}>
              <dt>{vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene"}</dt>
              <dd>{h.name}{h.telefon ? ` · ${h.telefon}` : ""}{h.email ? ` · ${h.email}` : ""}</dd>
            </span>
          ))}
        </dl>
      ))}

      {abschnitt("Einsatz", 1, (
        <dl className="paare">
          <dt>Zeitraum</dt><dd>{datumDeutsch(datumZuIso(bogen.einsatz.zeitraumVon))} – {datumDeutsch(datumZuIso(bogen.einsatz.zeitraumBis))}</dd>
          <dt>Ort / Auftrag</dt><dd>{bogen.einsatz.ortAuftrag || "—"}</dd>
          <dt>Beginn / Ende</dt>
          <dd>
            {bogen.einsatz.einsatzbeginn != null ? zeitpunktZuIso(bogen.einsatz.einsatzbeginn).replace("T", " ") : "—"}
            {" / "}
            {bogen.einsatz.einsatzende != null ? zeitpunktZuIso(bogen.einsatz.einsatzende).replace("T", " ") : "—"}
          </dd>
        </dl>
      ))}

      {abschnitt(`Personal (${bogen.personal.length})`, 2, (
        <table className="uebersicht">
          <thead>
            <tr><th>Funktion / Zusatzfunktion</th><th>Name, Vorname</th><th>Erreichbarkeit</th></tr>
          </thead>
          <tbody>
            {bogen.personal.map((p, i) => (
              <tr key={i}>
                <td>{funktionsText(p, org) || "—"}</td>
                <td>{p.nachname}{p.nachname && p.vorname ? ", " : ""}{p.vorname}</td>
                <td>
                  {p.kontakte
                    .map((k) =>
                      k.emailTemplate === 1
                        ? "eMail: Standard (D)"
                        : `${k.art === KontaktArt.EMAIL ? "eMail" : k.art === KontaktArt.MOBIL ? "Mobil" : "Tel"}: ${k.wert ?? ""} (${k.dienstlich ? "D" : "P"})`,
                    )
                    .join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      {abschnitt(`Fahrzeuge (${bogen.fahrzeuge.length})`, 3, (
        <table className="uebersicht">
          <thead>
            <tr><th>Typ</th><th>Kennzeichen</th><th>Funkrufname</th><th>StAN</th><th>Änderungen</th></tr>
          </thead>
          <tbody>
            {bogen.fahrzeuge.map((f, i) => (
              <tr key={i}>
                <td>{vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "—"}</td>
                <td>{kennzeichenText(f)}</td>
                <td>{funkrufText(f, bogen.einheit.name)}</td>
                <td>{f.stanKonform == null ? "—" : f.stanKonform ? "ja" : "nein"}</td>
                <td>{f.aenderungen ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      {abschnitt("Sofortbedarf & Sonstiges", 4, (
        <dl className="paare">
          <dt>Verpflegung</dt>
          <dd>{bogen.sofortbedarf ? `${bogen.sofortbedarf.verpflegungPersonen} Personen, davon vegetarisch ${bogen.sofortbedarf.davonVegetarisch}` : "—"}</dd>
          <dt>Betriebsstoff</dt>
          <dd>
            {bogen.sofortbedarf
              ? `${bogen.sofortbedarf.dieselLiter} l Diesel / ${bogen.sofortbedarf.benzinLiter} l Benzin / ${bogen.sofortbedarf.gemischLiter} l Gemisch`
              : "—"}
          </dd>
          <dt>Unterbringung / Ruhezeit</dt>
          <dd>{bogen.sofortbedarf ? `${bogen.sofortbedarf.unterbringung ? "Unterbringung" : "keine Unterbringung"} · ${bogen.sofortbedarf.ruhezeitErforderlich ? "Ruhezeit erforderlich" : "keine Ruhezeit"}` : "—"}</dd>
          <dt>Sonstiges</dt><dd>{bogen.sonstiges || "—"}</dd>
        </dl>
      ))}

      <section className="karte qr-box">
        <h2>QR-Code (Offline-Transport)</h2>
        {qr ? (
          <>
            <img src={qr.datenUrl} alt="EEB2-QR-Code" />
            <p className="hinweis">{qr.bytes} Bytes · QR-Version {qr.version} (ECC M) — dieser Code steht auch auf der letzten PDF-Seite.</p>
          </>
        ) : (
          <p className="hinweis">QR-Code wird erzeugt…</p>
        )}
      </section>
    </>
  );
}
