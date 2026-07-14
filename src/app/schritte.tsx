/**
 * Assistenten-Schritte und Gesamtübersicht der SPA.
 * Schritte: Einheit → Einsatz → Personal → Fahrzeuge → Sofortbedarf → Übersicht.
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  Erfassungsbogen,
  Einheit,
  Einsatz,
  Ernaehrung,
  Fahrzeug,
  Geschlecht,
  HierarchieEbene,
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
  verpflegung,
  zeitpunktAusIso,
  zeitpunktZuIso,
} from "../model";
import { vorlageAnlegen } from "./vorlagen";
import type { VokabularEintrag } from "../vokabulare/thw";
import { THW_ORTSVERBAENDE, type ThwOrtsverband } from "../vokabulare/thw-ov";
import {
  THW_OV_REGIONALSTRUKTUR,
  THW_REGIONALSTELLEN_KONTAKT,
  THW_LANDESVERBAENDE_KONTAKT,
} from "../vokabulare/thw-ov-regionalstruktur";
import { stanFahrzeugVorbelegung } from "../vokabulare/thw-stan-fahrzeuge";
import { stanPersonalVorbelegung } from "../vokabulare/thw-stan-personal";
import {
  FE_TEXT,
  ORG_OPTIONEN,
  QrSatz,
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
import { signaturLabel, type SignaturStatus } from "../signatur";
import {
  geraeteKurzform,
  geraeteOeffentlichHex,
  geraeteSchluesselSicherstellen,
  signierenAktiv,
  signierenSetzen,
} from "./geraete-schluessel";
import { istNativ, textTeilen } from "./nativ";

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

/**
 * Großer, touch-freundlicher Zähler (− / Zahl / +) für die Erfassung ohne
 * Tastatur am Tablet. Werte bleiben ≥ min; direkte Zahleneingabe bleibt möglich.
 */
function Stepper(props: { titel: string; wert: number; setzen: (n: number) => void; min?: number }) {
  const min = props.min ?? 0;
  const setze = (n: number) => props.setzen(Math.max(min, n));
  return (
    <div className="stepper-feld">
      <span className="stepper-titel">{props.titel}</span>
      <div className="stepper">
        <button
          type="button"
          aria-label={`${props.titel}: verringern`}
          disabled={props.wert <= min}
          onClick={() => setze(props.wert - 1)}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          value={props.wert}
          aria-label={props.titel}
          onChange={(e) => setze(zahl(e.target.value))}
        />
        <button type="button" aria-label={`${props.titel}: erhöhen`} onClick={() => setze(props.wert + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

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

/**
 * OV-Namensfeld mit eigener Vorschlagsliste aus dem OV-Verzeichnis. Bewusst
 * keine native <datalist>: Safari/iOS zeigt deren Vorschläge praktisch nicht.
 * Auswahl übernimmt Kürzel + Kontaktdaten; ein direkt eingetipptes Kürzel
 * ("OODE") wird beim Verlassen des Felds aufgelöst.
 */
/**
 * Setzt in der Hierarchie die (erste) Ebene mit `code` auf `name`; hängt sie
 * sonst an. Übergebene Kontaktfelder (Telefon/E-Mail) werden mitgeschrieben.
 */
function ebeneNameSetzen(
  hierarchie: HierarchieEbene[],
  code: number,
  name: string,
  kontakt?: { telefon?: string; email?: string },
): HierarchieEbene[] {
  const felder = {
    name,
    ...(kontakt?.telefon ? { telefon: kontakt.telefon } : {}),
    ...(kontakt?.email ? { email: kontakt.email } : {}),
  };
  const idx = hierarchie.findIndex((h) => h.bezeichnung.code === code);
  if (idx >= 0) return hierarchie.map((h, j) => (j === idx ? { ...h, ...felder } : h));
  return [...hierarchie, { bezeichnung: { code }, ...felder }];
}

/**
 * Übernimmt einen OV in die OV-Zeile `i` (Name + Kontaktdaten) und füllt,
 * soweit bekannt, Regionalstelle (Ebene 2) und Landesverband (Ebene 3) mit.
 */
function ovInHierarchieUebernehmen(hierarchie: HierarchieEbene[], i: number, ov: ThwOrtsverband): HierarchieEbene[] {
  let neu = hierarchie.map((h, j) =>
    j === i
      ? { ...h, name: ov.name, kurz: ov.kurz || undefined, telefon: ov.telefon.replace(/\D/g, "") || undefined, email: ov.email || undefined }
      : h,
  );
  const struktur = THW_OV_REGIONALSTRUKTUR[ov.name];
  if (struktur) {
    const rst = THW_REGIONALSTELLEN_KONTAKT[struktur.regionalstelle];
    const lv = THW_LANDESVERBAENDE_KONTAKT[struktur.landesverband];
    neu = ebeneNameSetzen(neu, 2, struktur.regionalstelle, rst && { telefon: rst.telefon.replace(/\D/g, ""), email: rst.email });
    neu = ebeneNameSetzen(neu, 3, struktur.landesverband, lv && { telefon: lv.telefon.replace(/\D/g, ""), email: lv.email });
  }
  return neu;
}

function OvNamensFeld(props: { name: string; tippen: (name: string) => void; uebernehmen: (ov: ThwOrtsverband) => void }) {
  const { name, tippen, uebernehmen } = props;
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);

  const suche = name.trim().toLowerCase();
  const treffer =
    offen && suche
      ? THW_ORTSVERBAENDE.filter(
          (o) => o.name.toLowerCase().includes(suche) || o.kurz.toLowerCase().startsWith(suche) || o.ort.toLowerCase().startsWith(suche),
        )
          .sort((a, b) => Number(b.name.toLowerCase().startsWith(suche)) - Number(a.name.toLowerCase().startsWith(suche)))
          .slice(0, 8)
      : [];

  const waehlen = (ov: ThwOrtsverband) => {
    uebernehmen(ov);
    setOffen(false);
  };

  return (
    <span className="autocomplete">
      <input
        value={name}
        placeholder="tippen für Vorschläge…"
        onChange={(ev) => {
          tippen(ev.target.value);
          setOffen(true);
          setAktiv(0);
        }}
        onKeyDown={(ev) => {
          if (treffer.length === 0) return;
          if (ev.key === "ArrowDown") {
            ev.preventDefault();
            setAktiv((aktiv + 1) % treffer.length);
          } else if (ev.key === "ArrowUp") {
            ev.preventDefault();
            setAktiv((aktiv + treffer.length - 1) % treffer.length);
          } else if (ev.key === "Enter") {
            ev.preventDefault();
            waehlen(treffer[aktiv]);
          } else if (ev.key === "Escape") {
            setOffen(false);
          }
        }}
        onBlur={() => {
          setOffen(false);
          const eingabe = name.trim();
          const ov = THW_ORTSVERBAENDE.find((o) => o.kurz === eingabe.toUpperCase() || o.name === eingabe);
          if (ov) uebernehmen(ov);
        }}
      />
      {treffer.length > 0 && (
        <ul className="vorschlaege">
          {treffer.map((o, k) => (
            // onMouseDown statt onClick, damit die Auswahl vor dem blur greift
            <li
              key={o.name}
              className={k === aktiv ? "aktiv" : undefined}
              onMouseDown={(ev) => {
                ev.preventDefault();
                waehlen(o);
              }}
            >
              {o.name}
              <small>
                {o.kurz} · {o.plz} {o.ort}
              </small>
            </li>
          ))}
        </ul>
      )}
    </span>
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
            aendern={(v) => {
              // StAN-Fahrzeuge und -Sollplätze vorbelegen, solange noch nichts erfasst ist
              const fahrzeuge = bogen.fahrzeuge.length === 0 ? stanFahrzeugVorbelegung(e.organisation, v) : [];
              const personal =
                bogen.personal.length === 0 && bogen.personalErfassung === PersonalErfassung.VOLLSTAENDIG
                  ? stanPersonalVorbelegung(e.organisation, v)
                  : [];
              aendern({
                einheit: { ...e, einheitsTyp: v },
                ...(fahrzeuge.length > 0 ? { fahrzeuge } : {}),
                ...(personal.length > 0 ? { personal } : {}),
              });
            }}
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
            {e.organisation === OrganisationsTyp.THW && h.bezeichnung.code === 1 ? (
              <OvNamensFeld
                name={h.name}
                tippen={(name) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, name } : x)) })}
                uebernehmen={(ov) => setE({ hierarchie: ovInHierarchieUebernehmen(e.hierarchie, i, ov) })}
              />
            ) : (
              <input
                value={h.name}
                onChange={(ev) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)) })}
              />
            )}
          </Feld>
          <Feld titel="Kürzel" schmal>
            <input
              value={h.kurz ?? ""}
              placeholder="OODE"
              onChange={(ev) =>
                setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, kurz: ev.target.value.toUpperCase() || undefined } : x)) })
              }
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
        <Feld titel="Ernährung" schmal>
          <select value={p.ernaehrung} onChange={(e) => set({ ernaehrung: Number(e.target.value) })}>
            <option value={Ernaehrung.FLEISCH}>Fleisch</option>
            <option value={Ernaehrung.VEGETARISCH}>Vegetarisch</option>
            <option value={Ernaehrung.VEGAN}>Vegan</option>
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
  const vorlage = stanPersonalVorbelegung(bogen.einheit.organisation, bogen.einheit.einheitsTyp);
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
          Stärke (abgeleitet): <strong>{s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt}</strong> · Unterbringung: M {mwd.m} / W {mwd.w} / D {mwd.d}
        </p>
      )}

      <Hinweise bogen={bogen} />

      {!nurStaerke && vorlage.length > 0 && (
        <p>
          <button
            type="button"
            onClick={() => {
              if (bogen.personal.length === 0 || window.confirm("Aktuelle Personalliste durch die StAN-Sollplätze ersetzen?")) {
                aendern({ personal: vorlage });
              }
            }}
          >
            StAN-Sollplätze laden ({vorlage.length} Personen)
          </button>
        </p>
      )}
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
    </section>
  );
}

// ---------------------------------------------------- Schritt Sofortbedarf

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
      <p className="inline">
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
      </p>
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
  onVorlageGespeichert?: (name: string) => void;
  /** Signaturstatus des importierten Transports (Herkunft), falls der Bogen gescannt wurde. */
  signatur?: SignaturStatus | null;
  /** Gesetzt, wenn der Bogen für eine Einsatz-Sammlung erfasst wird (Meldekopf/Zugführer). */
  sammelAktion?: { label: string; onUebernehmen: () => void };
}) {
  const { bogen, geheZu, neu } = props;

  function alsVorlageSpeichern() {
    const name = window.prompt("Als Vorlage speichern unter:", bogen.einheit.name || "Vorlage");
    if (name == null) return;
    const v = vorlageAnlegen(name, bogen);
    props.onVorlageGespeichert?.(v.name);
  }

  const [qr, setQr] = useState<QrSatz | null>(null);
  const [fehler, setFehler] = useState("");
  const [pdfLaeuft, setPdfLaeuft] = useState(false);
  // QR signieren (Geräteschlüssel). Voreinstellung aus dem Gerätespeicher.
  const [signieren, setSignieren] = useState(() => signierenAktiv());
  const [schluesselKurz, setSchluesselKurz] = useState<string | null>(null);
  const org = bogen.einheit.organisation;
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);
  const vp = verpflegung(bogen);

  useEffect(() => {
    let aktiv = true;
    (async () => {
      try {
        // Bei aktivem Signieren den (ggf. neu erzeugten) Geräteschlüssel nutzen.
        const privat = signieren ? await geraeteSchluesselSicherstellen() : null;
        if (privat) geraeteKurzform().then((k) => aktiv && setSchluesselKurz(k));
        const q = await qrErzeugen(bogen, privat);
        if (aktiv) setQr(q);
      } catch (e) {
        if (aktiv) setFehler(`QR-Code: ${e instanceof Error ? e.message : e}`);
      }
    })();
    return () => {
      aktiv = false;
    };
  }, [bogen, signieren]);

  function signierenUmschalten(an: boolean) {
    setSignieren(an);
    signierenSetzen(an);
  }

  async function schluesselTeilen() {
    const hex = await geraeteOeffentlichHex();
    if (!hex) return;
    const text = `EEB-Signaturschlüssel (öffentlich)\nKurzform: ${schluesselKurz ?? ""}\n${hex}`;
    if (istNativ()) {
      await textTeilen("eeb-signaturschluessel.txt", text);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(hex);
      setFehler(""); // kein Fehler; Rückmeldung via Titel/alert unnötig
      window.alert(`Öffentlicher Schlüssel in die Zwischenablage kopiert:\n\n${hex}`);
    } else {
      window.prompt("Öffentlicher Schlüssel (kopieren):", hex);
    }
  }

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
            {props.sammelAktion && (
              <button type="button" className="primaer" onClick={props.sammelAktion.onUebernehmen}>
                {props.sammelAktion.label}
              </button>
            )}{" "}
            <button type="button" className={props.sammelAktion ? "" : "primaer"} onClick={pdf} disabled={pdfLaeuft}>
              {pdfLaeuft ? "PDF wird erstellt…" : "PDF erzeugen"}
            </button>{" "}
            <button type="button" onClick={() => bogenSpeichern(bogen)}>Als Datei speichern</button>{" "}
            <button type="button" onClick={alsVorlageSpeichern}>Als Vorlage speichern</button>{" "}
            <button type="button" onClick={() => window.confirm("Aktuellen Bogen verwerfen?") && neu()}>Neuer Bogen</button>
          </span>
        </div>
        {fehler && <p className="fehler">{fehler}</p>}
        {props.signatur && props.signatur.zustand !== "unsigniert" && (
          <p className={`signatur-herkunft ${props.signatur.zustand}`} role="status">
            Empfangen als: <strong>{signaturLabel(props.signatur)}</strong>
            {props.signatur.zustand === "gueltig"
              ? " — Herkunft belegt (nicht die Identität des Absenders)."
              : " — die Daten passen nicht zur Signatur."}
          </p>
        )}
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
              <dd>{h.name}{h.kurz ? ` (${h.kurz})` : ""}{h.telefon ? ` · ${h.telefon}` : ""}{h.email ? ` · ${h.email}` : ""}</dd>
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
        <div className="tabellen-scroll">
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
        </div>
      ))}

      {abschnitt(`Fahrzeuge (${bogen.fahrzeuge.length})`, 3, (
        <div className="tabellen-scroll">
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
        </div>
      ))}

      {abschnitt("Sofortbedarf & Sonstiges", 4, (
        <dl className="paare">
          <dt>Verpflegung</dt>
          <dd>{bogen.sofortbedarf ? `${bogen.sofortbedarf.verpflegungPersonen} Personen, davon ${vp.vegetarisch} vegetarisch, ${vp.vegan} vegan` : "—"}</dd>
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
          qr.segmentiert ? (
            <>
              <p className="hinweis">
                Bogen zu groß für einen Code — in {qr.teile.length} Teile aufgeteilt. Alle Teile
                nacheinander scannen; die App setzt sie zusammen. Auch auf der letzten PDF-Seite.
              </p>
              <div className="qr-teile">
                {qr.teile.map((t) => (
                  <figure key={t.teilNr}>
                    <img src={t.datenUrl} alt={`EEB2-QR-Code Teil ${t.teilNr} von ${t.anzahl}`} />
                    <figcaption>Teil {t.teilNr} / {t.anzahl}</figcaption>
                  </figure>
                ))}
              </div>
              <p className="hinweis">
                {qr.zeichen} Zeichen · je ≤ QR-Version {qr.version} (ECC M){signieren ? " · signiert (EEB2S)" : ""}
              </p>
            </>
          ) : (
            <>
              <img src={qr.teile[0]!.datenUrl} alt="EEB2-QR-Code" />
              <p className="hinweis">
                {qr.zeichen} Zeichen · QR-Version {qr.version} (ECC M)
                {signieren ? " · signiert (EEB2S)" : ""} — öffnet beim Scannen mit der Kamera die App; dieser Code steht auch auf der letzten PDF-Seite.
              </p>
            </>
          )

        ) : (
          <p className="hinweis">QR-Code wird erzeugt…</p>
        )}
        <div className="signatur-optionen">
          <label>
            <input
              type="checkbox"
              checked={signieren}
              onChange={(e) => signierenUmschalten(e.target.checked)}
            />{" "}
            QR mit Geräteschlüssel signieren (Ed25519, +97 Byte)
          </label>
          {signieren && (
            <p className="hinweis">
              Dieses Gerät: <strong>{schluesselKurz ?? "Schlüssel wird erzeugt…"}</strong>
              {schluesselKurz && (
                <>
                  {" · "}
                  <button type="button" className="link" onClick={schluesselTeilen}>
                    öffentlichen Schlüssel anzeigen/teilen
                  </button>
                </>
              )}
              <br />
              Belegt Herkunft/Integrität, nicht die Identität — der private Schlüssel bleibt auf dem Gerät.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
