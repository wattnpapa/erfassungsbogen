/**
 * Schritt 1 — Einheit: Organisation, Einheitstyp, Landesvorlagen und die
 * Hierarchie der Kontaktstellen (beim THW mit OV-Vorschlagsliste).
 */

import { useState } from "react";
import {
  Einheit,
  HierarchieEbene,
  OrganisationsTyp,
  PersonalErfassung,
} from "../../model";
import { THW_ORTSVERBAENDE, type ThwOrtsverband } from "../../vokabulare/thw-ov";
import {
  THW_OV_REGIONALSTRUKTUR,
  THW_REGIONALSTELLEN_KONTAKT,
  THW_LANDESVERBAENDE_KONTAKT,
} from "../../vokabulare/thw-ov-regionalstruktur";
import { stanFahrzeugVorbelegung } from "../../vokabulare/thw-stan-fahrzeuge";
import { stanPersonalVorbelegung } from "../../vokabulare/thw-stan-personal";
import {
  bundeslandLabel,
  hatLandesvorlagen,
  landesvorlage,
  landesvorlagenBundeslaender,
  landesvorlagenEinheiten,
} from "../../vokabulare/landesvorlagen";
import { ORG_OPTIONEN, einheitAnzeigename, ersteEbene, vokabularFuer } from "../hilfen";
import { frageJaNein } from "../dialoge";
import { Feld, VokabAuswahl, type SchrittProps } from "./bausteine";

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

/**
 * OV-Namensfeld mit eigener Vorschlagsliste aus dem OV-Verzeichnis. Bewusst
 * keine native <datalist>: Safari/iOS zeigt deren Vorschläge praktisch nicht.
 * Auswahl übernimmt Kürzel + Kontaktdaten; ein direkt eingetipptes Kürzel
 * ("OODE") wird beim Verlassen des Felds aufgelöst.
 */
function OvVorschlagFeld(props: {
  wert: string;
  platzhalter: string;
  tippen: (wert: string) => void;
  uebernehmen: (ov: ThwOrtsverband) => void;
}) {
  const { wert, platzhalter, tippen, uebernehmen } = props;
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);

  const suche = wert.trim().toLowerCase();
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
        value={wert}
        placeholder={platzhalter}
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
            const ov = treffer[aktiv];
            if (ov) waehlen(ov);
          } else if (ev.key === "Escape") {
            setOffen(false);
          }
        }}
        onBlur={() => {
          setOffen(false);
          const eingabe = wert.trim();
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

// Organisationen mit eigener oder ohne Vorbelegungslogik: THW hat die
// code-basierte StAN-Vorbelegung, Polizei/Bundespolizei/Bundeswehr sollen keine
// Landesvorlagen bekommen (bewusste Vorgabe).
const OHNE_LANDESVORLAGEN: OrganisationsTyp[] = [
  OrganisationsTyp.THW,
  OrganisationsTyp.POLIZEI,
  OrganisationsTyp.BUNDESPOLIZEI,
  OrganisationsTyp.BUNDESWEHR,
];

export function SchrittEinheit({ bogen, aendern }: SchrittProps) {
  const e = bogen.einheit;
  const setE = (p: Partial<Einheit>) => aendern({ einheit: { ...e, ...p } });
  const ebenen = vokabularFuer(e.organisation, "ebene");

  // Landesvorlagen (KatS-Beispielbögen der Bundesländer) für Schritt 1.
  const [vorlageBundesland, setVorlageBundesland] = useState("");
  const [vorlageEinheit, setVorlageEinheit] = useState("");
  const zeigeLandesvorlagen =
    !OHNE_LANDESVORLAGEN.includes(e.organisation) && hatLandesvorlagen(e.organisation);
  const vorlagenBundeslaender = zeigeLandesvorlagen ? landesvorlagenBundeslaender(e.organisation) : [];
  // Nach Organisationswechsel kann das gemerkte Bundesland unpassend sein.
  const aktBundesland = vorlagenBundeslaender.includes(vorlageBundesland) ? vorlageBundesland : "";
  const vorlagenEinheiten = aktBundesland ? landesvorlagenEinheiten(e.organisation, aktBundesland) : [];
  const aktEinheit = vorlagenEinheiten.includes(vorlageEinheit) ? vorlageEinheit : "";

  async function landesvorlageAnwenden(name: string) {
    const v = landesvorlage(e.organisation, aktBundesland, name);
    if (!v) return;
    const hatDaten = bogen.personal.length > 0 || bogen.fahrzeuge.length > 0;
    if (
      hatDaten &&
      !(await frageJaNein({
        titel: "Landesvorlage anwenden?",
        text: `Personal (${bogen.personal.length}) und Fahrzeuge (${bogen.fahrzeuge.length}) im Bogen werden durch „${name}" ersetzt.`,
        ok: "Ersetzen",
      }))
    ) {
      return;
    }
    setVorlageEinheit(name);
    aendern({
      einheit: { ...e, einheitsTyp: v.einheitsTyp },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: v.personal,
      fahrzeuge: v.fahrzeuge,
    });
  }

  return (
    <section className="karte">
      <h2>1. Einheit</h2>
      <div className="zeile">
        <Feld titel="Organisation">
          <select
            value={e.organisation}
            onChange={(ev) => {
              const organisation = Number(ev.target.value);
              setE({ organisation, einheitsTyp: {}, hierarchie: [ersteEbene(organisation)] });
            }}
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
      </div>

      {zeigeLandesvorlagen && (
        <>
          <div className="zeile">
            <Feld titel="Landesvorlage – Bundesland">
              <select
                value={aktBundesland}
                onChange={(ev) => {
                  setVorlageBundesland(ev.target.value);
                  setVorlageEinheit("");
                }}
              >
                <option value="">– Bundesland wählen –</option>
                {vorlagenBundeslaender.map((b) => (
                  <option key={b} value={b}>{bundeslandLabel(b)}</option>
                ))}
              </select>
            </Feld>
            <Feld titel="Landesvorlage – Einheit">
              <select
                value={aktEinheit}
                disabled={!aktBundesland}
                onChange={(ev) => {
                  if (ev.target.value) void landesvorlageAnwenden(ev.target.value);
                }}
              >
                <option value="">{aktBundesland ? "– Einheit wählen –" : "erst Bundesland wählen"}</option>
                {vorlagenEinheiten.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Feld>
          </div>
          <p className="hinweis">
            Nach dem Vorbild der Katastrophenschutz-Stärke des Bundeslands: Einheitstyp,
            Stärkeplätze (Namen offen) und Fahrzeuge werden vorbelegt und lassen sich anschließend anpassen.
          </p>
        </>
      )}

      <h3>Zugehörigkeit / Kontaktstellen</h3>
      <p className="hinweis">
        Die unterste Ebene ist die eigene Einheit. Aus ihrem Namen, der Organisation und dem
        Einheitstyp bildet sich die Bezeichnung auf dem Bogen: <b>{einheitAnzeigename(e)}</b>
      </p>
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
          <Feld titel={i === 0 ? "Name (Pflicht)" : "Name"}>
            {e.organisation === OrganisationsTyp.THW && h.bezeichnung.code === 1 ? (
              <OvVorschlagFeld
                wert={h.name}
                platzhalter="tippen für Vorschläge…"
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
          {/* Das Kürzel (z. B. THW-OV "OODE") ergibt nur beim THW Sinn; andere Organisationen führen keine solchen Kürzel. */}
          {e.organisation === OrganisationsTyp.THW && (
            <Feld titel="Kürzel" schmal>
              {h.bezeichnung.code === 1 ? (
                // Viele kennen ihr OV-Kürzel und tippen es ein – dieselbe Vorschlagsliste wie beim OV-Namen.
                <OvVorschlagFeld
                  wert={h.kurz ?? ""}
                  platzhalter="OODE"
                  tippen={(kurz) =>
                    setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, kurz: kurz.toUpperCase() || undefined } : x)) })
                  }
                  uebernehmen={(ov) => setE({ hierarchie: ovInHierarchieUebernehmen(e.hierarchie, i, ov) })}
                />
              ) : (
                <input
                  value={h.kurz ?? ""}
                  placeholder="OODE"
                  onChange={(ev) =>
                    setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, kurz: ev.target.value.toUpperCase() || undefined } : x)) })
                  }
                />
              )}
            </Feld>
          )}
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
          {/* Die unterste Ebene ist die Einheit selbst und bleibt stehen. */}
          {i > 0 && (
            <button type="button" onClick={() => setE({ hierarchie: e.hierarchie.filter((_, j) => j !== i) })}>✕</button>
          )}
        </div>
      ))}
      <p>
        <button type="button" onClick={() => setE({ hierarchie: [...e.hierarchie, { bezeichnung: {}, name: "" }] })}>
          + Ebene hinzufügen
        </button>{" "}
        {e.organisation === OrganisationsTyp.THW && e.hierarchie.length === 1 && (
          <button
            type="button"
            onClick={() => {
              const ov = e.hierarchie[0] ?? ersteEbene(e.organisation);
              setE({
                // Die schon erfasste unterste Ebene bleibt als OV erhalten.
                hierarchie: [
                  { ...ov, bezeichnung: { code: 1 } },
                  { bezeichnung: { code: 2 }, name: "" },
                  { bezeichnung: { code: 3 }, name: "" },
                ],
              });
            }}
          >
            OV/RB/LV-Vorlage
          </button>
        )}
      </p>
    </section>
  );
}
