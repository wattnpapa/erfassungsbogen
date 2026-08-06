/**
 * Schritt 1 — Einheit: Organisation, Einheitstyp, Landesvorlagen und die
 * Hierarchie der Kontaktstellen (beim THW mit OV-Vorschlagsliste).
 */

import { useEffect, useState } from "react";
import {
  Einheit,
  HierarchieEbene,
  OrganisationsTyp,
  PersonalErfassung,
} from "../../model";
import type { ThwOrtsverband } from "../../vokabulare/thw-ov";
import { stanFahrzeugVorbelegung } from "../../vokabulare/thw-stan-fahrzeuge";
import { stanPersonalVorbelegung } from "../../vokabulare/thw-stan-personal";
import { ORG_OPTIONEN, einheitAnzeigename, ersteEbene, vokabularFuer } from "../hilfen";
import { frageJaNein } from "../dialoge";
import { Auswahl, Feld, VokabAuswahl, VorschlagFeld, type SchrittProps } from "./bausteine";

// Die beiden großen Datenpakete laden erst mit Schritt 1, nicht mit dem
// Start-Bundle: das THW-OV-Verzeichnis (~190 KB Quelldaten) und die
// Landesvorlagen, die über ihren eager-Glob sämtliche landesrechtlichen
// Beispielbögen als Daten enthalten (~300 KB). Einmal geladen, bleiben die Module im Cache —
// der useState-Startwert greift dann sofort, ohne Nachlade-Flackern.
type OvDaten = typeof import("../../vokabulare/thw-ov") &
  typeof import("../../vokabulare/thw-ov-regionalstruktur");
type LandesvorlagenModul = typeof import("../../vokabulare/landesvorlagen");

let ovDatenCache: OvDaten | null = null;
let landesvorlagenCache: LandesvorlagenModul | null = null;

/** THW-OV-Verzeichnis samt Regionalstruktur; lädt nur, wenn `aktiv` (THW gewählt). */
function useOvDaten(aktiv: boolean): OvDaten | null {
  const [daten, setDaten] = useState(ovDatenCache);
  useEffect(() => {
    if (!aktiv || daten) return;
    void Promise.all([
      import("../../vokabulare/thw-ov"),
      import("../../vokabulare/thw-ov-regionalstruktur"),
    ]).then(([ov, struktur]) => {
      ovDatenCache = { ...ov, ...struktur };
      setDaten(ovDatenCache);
    });
  }, [aktiv, daten]);
  return daten;
}

function useLandesvorlagen(): LandesvorlagenModul | null {
  const [modul, setModul] = useState(landesvorlagenCache);
  useEffect(() => {
    if (modul) return;
    void import("../../vokabulare/landesvorlagen").then((m) => {
      landesvorlagenCache = m;
      setModul(m);
    });
  }, [modul]);
  return modul;
}

/**
 * Setzt in der Hierarchie die (erste) Ebene mit `code` auf `name`; hängt sie
 * sonst an. Übergebene Felder (Kürzel, Telefon, E-Mail) werden mitgeschrieben.
 */
function ebeneNameSetzen(
  hierarchie: HierarchieEbene[],
  code: number,
  name: string,
  kontakt?: { kurz?: string; telefon?: string; email?: string },
): HierarchieEbene[] {
  const felder = {
    name,
    ...(kontakt?.kurz ? { kurz: kontakt.kurz } : {}),
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
function ovInHierarchieUebernehmen(daten: OvDaten, hierarchie: HierarchieEbene[], i: number, ov: ThwOrtsverband): HierarchieEbene[] {
  let neu = hierarchie.map((h, j) =>
    j === i
      ? { ...h, name: ov.name, kurz: ov.kurz || undefined, telefon: ov.telefon.replace(/\D/g, "") || undefined, email: ov.email || undefined }
      : h,
  );
  const struktur = daten.THW_OV_REGIONALSTRUKTUR[ov.name];
  if (struktur) {
    const rst = daten.THW_REGIONALSTELLEN_KONTAKT[struktur.regionalstelle];
    const lv = daten.THW_LANDESVERBAENDE_KONTAKT[struktur.landesverband];
    neu = ebeneNameSetzen(neu, 2, struktur.regionalstelle, rst && { kurz: rst.kurz, telefon: rst.telefon.replace(/\D/g, ""), email: rst.email });
    neu = ebeneNameSetzen(neu, 3, struktur.landesverband, lv && { kurz: lv.kurz, telefon: lv.telefon.replace(/\D/g, ""), email: lv.email });
  }
  return neu;
}

/**
 * OV-Namensfeld mit Vorschlagsliste aus dem OV-Verzeichnis. Auswahl übernimmt
 * Kürzel + Kontaktdaten; ein direkt eingetipptes Kürzel ("OODE") wird beim
 * Verlassen des Felds aufgelöst.
 */
function OvVorschlagFeld(props: {
  wert: string;
  platzhalter: string;
  /** OV-Verzeichnis; leer, solange das Datenpaket noch lädt. */
  verzeichnis: readonly ThwOrtsverband[];
  tippen: (wert: string) => void;
  uebernehmen: (ov: ThwOrtsverband) => void;
}) {
  const { wert, platzhalter, verzeichnis, tippen, uebernehmen } = props;

  const suche = wert.trim().toLowerCase();
  const treffer = suche
    ? verzeichnis
        .filter(
          (o) => o.name.toLowerCase().includes(suche) || o.kurz.toLowerCase().startsWith(suche) || o.ort.toLowerCase().startsWith(suche),
        )
        .sort((a, b) => Number(b.name.toLowerCase().startsWith(suche)) - Number(a.name.toLowerCase().startsWith(suche)))
        .slice(0, 8)
    : [];

  return (
    <VorschlagFeld
      wert={wert}
      platzhalter={platzhalter}
      treffer={treffer}
      schluessel={(o) => o.name}
      zeile={(o) => (
        <>
          {o.name}
          <small>
            {o.kurz} · {o.plz} {o.ort}
          </small>
        </>
      )}
      tippen={tippen}
      waehlen={uebernehmen}
      verlassen={(eingabe) => {
        const e = eingabe.trim();
        const ov = verzeichnis.find((o) => o.kurz === e.toUpperCase() || o.name === e);
        if (ov) uebernehmen(ov);
      }}
    />
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
  const ovDaten = useOvDaten(e.organisation === OrganisationsTyp.THW);
  const ovVerzeichnis = ovDaten?.THW_ORTSVERBAENDE ?? [];

  // Landesvorlagen (KatS-Beispielbögen der Bundesländer) für Schritt 1.
  const lvModul = useLandesvorlagen();
  const [vorlageBundesland, setVorlageBundesland] = useState("");
  const [vorlageEinheit, setVorlageEinheit] = useState("");
  const zeigeLandesvorlagen =
    lvModul !== null && !OHNE_LANDESVORLAGEN.includes(e.organisation) && lvModul.hatLandesvorlagen(e.organisation);
  const vorlagenBundeslaender = lvModul && zeigeLandesvorlagen ? lvModul.landesvorlagenBundeslaender(e.organisation) : [];
  // Nach Organisationswechsel kann das gemerkte Bundesland unpassend sein.
  const aktBundesland = vorlagenBundeslaender.includes(vorlageBundesland) ? vorlageBundesland : "";
  // Nach Regelwerk gruppiert: unter derselben Organisation und demselben
  // Bundesland stehen z. B. KatS-StAN und Landes-Feuerwehrverordnung nebeneinander.
  const vorlagenGruppen = lvModul && aktBundesland ? lvModul.landesvorlagenGruppen(e.organisation, aktBundesland) : [];
  const vorlagenEinheiten = vorlagenGruppen.flatMap((g) => g.namen);
  const aktEinheit = vorlagenEinheiten.includes(vorlageEinheit) ? vorlageEinheit : "";

  async function landesvorlageAnwenden(name: string) {
    const v = lvModul?.landesvorlage(e.organisation, aktBundesland, name);
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
          <Auswahl
            value={e.organisation}
            onChange={(ev) => {
              const organisation = Number(ev.target.value);
              setE({ organisation, einheitsTyp: {}, hierarchie: [ersteEbene(organisation)] });
            }}
          >
            {ORG_OPTIONEN.map((o) => (
              <option key={o.wert} value={o.wert}>{o.label}</option>
            ))}
          </Auswahl>
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
            suchbar
          />
        </Feld>
      </div>

      {lvModul && zeigeLandesvorlagen && (
        <>
          <div className="zeile">
            <Feld titel="Landesvorlage – Bundesland">
              <Auswahl
                value={aktBundesland}
                onChange={(ev) => {
                  setVorlageBundesland(ev.target.value);
                  setVorlageEinheit("");
                }}
              >
                <option value="">– Bundesland wählen –</option>
                {vorlagenBundeslaender.map((b) => (
                  <option key={b} value={b}>{lvModul.bundeslandLabel(b)}</option>
                ))}
              </Auswahl>
            </Feld>
            <Feld titel="Landesvorlage – Einheit">
              <Auswahl
                value={aktEinheit}
                disabled={!aktBundesland}
                onChange={(ev) => {
                  if (ev.target.value) void landesvorlageAnwenden(ev.target.value);
                }}
              >
                <option value="">{aktBundesland ? "– Einheit wählen –" : "erst Bundesland wählen"}</option>
                {vorlagenGruppen.map((g) => (
                  <optgroup key={g.bereich} label={lvModul.bereichLabel(g.bereich)}>
                    {g.namen.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </optgroup>
                ))}
              </Auswahl>
            </Feld>
          </div>
          <p className="hinweis">
            Nach dem Vorbild der Einheiten des Bundeslands (Katastrophenschutz-Stärke,
            Feuerwehrverordnung, Verbandsgliederung): Einheitstyp, Stärkeplätze (Namen offen) und
            Fahrzeuge werden vorbelegt und lassen sich anschließend anpassen.
          </p>
        </>
      )}

      <h3>Zugehörigkeit / Kontaktstellen</h3>
      <p className="hinweis">
        Die erste Ebene ist die eigene Einheit, jede weitere Zeile die nächsthöhere Stelle
        {ebenen.length > 0 && <> ({ebenen.map((v) => v.name).join(" → ")})</>}.
        Aus Name, Organisation und Einheitstyp bildet sich die Bezeichnung auf dem Bogen: <b>{einheitAnzeigename(e)}</b>
      </p>
      {e.hierarchie.map((h, i) => (
        <div className="zeile" key={i}>
          <Feld titel={i === 0 ? "Ebene (eigene Einheit)" : "Ebene (übergeordnet)"} schmal>
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
                verzeichnis={ovVerzeichnis}
                tippen={(name) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, name } : x)) })}
                uebernehmen={(ov) => ovDaten && setE({ hierarchie: ovInHierarchieUebernehmen(ovDaten, e.hierarchie, i, ov) })}
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
                  platzhalter="z. B. OODE"
                  verzeichnis={ovVerzeichnis}
                  tippen={(kurz) =>
                    setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, kurz: kurz.toUpperCase() || undefined } : x)) })
                  }
                  uebernehmen={(ov) => ovDaten && setE({ hierarchie: ovInHierarchieUebernehmen(ovDaten, e.hierarchie, i, ov) })}
                />
              ) : (
                <input
                  value={h.kurz ?? ""}
                  placeholder="z. B. OODE"
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
          <Feld titel="E-Mail">
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
        <button
          type="button"
          onClick={() => {
            // Nächsthöhere Ebene vorbelegen: Codes steigen mit der Hierarchie
            // (s. vokabulare/ebenen.ts), also die erste noch über allen
            // erfassten Codes liegende Stufe. Bei Freitext-Ebenen bleibt offen.
            const hoechste = Math.max(0, ...e.hierarchie.map((h) => h.bezeichnung.code ?? 0));
            const naechste = ebenen.find((v) => v.code > hoechste);
            setE({ hierarchie: [...e.hierarchie, { bezeichnung: naechste ? { code: naechste.code } : {}, name: "" }] });
          }}
        >
          + übergeordnete Ebene
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
