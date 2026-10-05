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
} from "@bos/eeb-format/model";
import type { ThwOrtsverband } from "@bos/vokabulare/thw-ov";
import { fahrzeugVorbelegung, fahrzeugeMitFunkrufOv } from "../../vokabulare/thw-funkrufname-ort";
import { stanPersonalVorbelegung } from "@bos/vokabulare/thw-stan-personal";
import {
  ORG_OPTIONEN,
  einheitAnzeigename,
  ersteEbene,
  fahrzeugUnbenannt,
  orgLabel,
  personUnbenannt,
  pruefpunkte,
  verpflegungMitziehen,
  vokabText,
  vokabularFuer,
} from "../hilfen";
import { frageJaNein } from "../dialoge";
import { Auswahl, Feld, FREMDE_DATEN, Hinweise, KENNUNG_EINGABE, VokabAuswahl, VorschlagFeld, type SchrittProps } from "./bausteine";

// Die beiden großen Datenpakete laden erst mit Schritt 1, nicht mit dem
// Start-Bundle: das THW-OV-Verzeichnis (~190 KB Quelldaten) und die
// Landesvorlagen, die über ihren eager-Glob sämtliche landesrechtlichen
// Beispielbögen als Daten enthalten (~300 KB). Einmal geladen, bleiben die Module im Cache —
// der useState-Startwert greift dann sofort, ohne Nachlade-Flackern.
type OvDaten = typeof import("@bos/vokabulare/thw-ov") &
  typeof import("@bos/vokabulare/thw-ov-regionalstruktur");
type LandesvorlagenModul = typeof import("../../vokabulare/landesvorlagen");

let ovDatenCache: OvDaten | null = null;
let landesvorlagenCache: LandesvorlagenModul | null = null;

/** THW-OV-Verzeichnis samt Regionalstruktur; lädt nur, wenn `aktiv` (THW gewählt). */
function useOvDaten(aktiv: boolean): OvDaten | null {
  const [daten, setDaten] = useState(ovDatenCache);
  useEffect(() => {
    if (!aktiv || daten) return;
    void Promise.all([
      import("@bos/vokabulare/thw-ov"),
      import("@bos/vokabulare/thw-ov-regionalstruktur"),
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
  /** id des Eingabefelds — Sprungziel einer Rückfrage („Name der Einheit fehlt"). */
  id?: string;
  wert: string;
  platzhalter: string;
  /** OV-Verzeichnis; leer, solange das Datenpaket noch lädt. */
  verzeichnis: readonly ThwOrtsverband[];
  tippen: (wert: string) => void;
  uebernehmen: (ov: ThwOrtsverband) => void;
  /** true: das Feld nimmt das Kürzel auf, nicht den Namen (R2-M6). */
  kennung?: boolean;
}) {
  const { id, wert, platzhalter, verzeichnis, tippen, uebernehmen, kennung } = props;

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
      id={id}
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
      kennung={kennung}
      verlassen={(eingabe) => {
        const e = eingabe.trim();
        if (!e) return;
        // Beim Verlassen nur eindeutig auflösen: das Kürzel, oder ein Name,
        // mit dem kein anderer Ortsverband beginnt. „Neustadt" füllte sonst
        // Kürzel und Telefon von Neustadt (Holstein) ein, obwohl ebenso
        // „Neustadt an der Aisch" oder „… an der Weinstraße" gemeint sein
        // konnte — ohne dass jemand gewählt hatte (Audit Runde 3, R3-S4).
        const klein = e.toLowerCase();
        const gleichAnfang = verzeichnis.filter((o) => o.name.toLowerCase().startsWith(klein));
        const ov =
          verzeichnis.find((o) => o.kurz === e.toUpperCase()) ??
          (gleichAnfang.length === 1 && gleichAnfang[0]!.name === e ? gleichAnfang[0] : undefined);
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

/** Steht in der Ebene etwas, das beim Entfernen verloren ginge? */
function ebeneHatInhalt(h: HierarchieEbene): boolean {
  return !!(h.name.trim() || h.kurz?.trim() || h.telefon?.trim() || h.email?.trim());
}

/** Anzahl-Text „9 Personen, 4 Fahrzeuge" — für Hinweis und Rückfragen zur Vorbelegung. */
function anzahlText(n: number, einzahl: string, mehrzahl: string): string {
  return `${n} ${n === 1 ? einzahl : mehrzahl}`;
}

/**
 * Beispiel im Feld „Organisationsname" passend zur gewählten Organisation.
 * Beim THW stand vorher „z. B. Freiwillige Feuerwehr Wardenburg" (R2-N9).
 */
const ORGANISATIONSNAME_BEISPIEL: Partial<Record<OrganisationsTyp, string>> = {
  [OrganisationsTyp.THW]: "z. B. THW Ortsverband Ulm",
  [OrganisationsTyp.FEUERWEHR]: "z. B. Freiwillige Feuerwehr Wardenburg",
  [OrganisationsTyp.DRK]: "z. B. DRK-Kreisverband Oldenburg-Land",
  [OrganisationsTyp.JUH]: "z. B. Johanniter-Unfall-Hilfe Regionalverband Weser-Ems",
  [OrganisationsTyp.MHD]: "z. B. Malteser Hilfsdienst Oldenburg",
  [OrganisationsTyp.ASB]: "z. B. ASB Regionalverband Oldenburg",
  [OrganisationsTyp.DLRG]: "z. B. DLRG Ortsgruppe Wardenburg",
};

/**
 * Beispiel im Feld „Einheitstyp" passend zur Organisation. Beim THW stand
 * „z. B. Löschzug, SEG Sanität" — zwei Einheiten, die es dort nicht gibt
 * (Audit Runde 3, R3-H7, R3-N6).
 */
const EINHEITSTYP_BEISPIEL: Partial<Record<OrganisationsTyp, string>> = {
  [OrganisationsTyp.THW]: "z. B. Bergungsgruppe, FGr Wasserschaden/Pumpen",
  [OrganisationsTyp.FEUERWEHR]: "z. B. Löschzug, Löschgruppe",
  [OrganisationsTyp.DRK]: "z. B. SEG Sanität, Betreuungszug",
  [OrganisationsTyp.JUH]: "z. B. SEG Sanität, Betreuungszug",
  [OrganisationsTyp.MHD]: "z. B. SEG Sanität, Betreuungszug",
  [OrganisationsTyp.ASB]: "z. B. SEG Sanität, Betreuungszug",
  [OrganisationsTyp.DLRG]: "z. B. Wasserrettungszug, Bootstrupp",
};

export function SchrittEinheit({ bogen, aendern: aendernRoh }: SchrittProps) {
  const e = bogen.einheit;
  // Vorbelegung und Typwechsel verändern die Personalliste — der Verpflegungs-
  // Bedarf in Schritt 5 zieht mit (siehe verpflegungMitziehen).
  const aendern = (patch: Partial<typeof bogen>) => aendernRoh(verpflegungMitziehen(bogen, patch));
  const setE = (p: Partial<Einheit>) => aendern({ einheit: { ...e, ...p } });
  const ebenen = vokabularFuer(e.organisation, "ebene");
  const einheitstypen = vokabularFuer(e.organisation, "einheitstyp");

  // Was von der Vorbelegung noch unausgefüllt im Bogen steht — und ob der
  // gewählte Typ überhaupt eine hat (sonst kämen die leeren Karten von Hand).
  const vorbelegtePersonen = bogen.personal.filter(personUnbenannt).length;
  const vorbelegteFahrzeuge = bogen.fahrzeuge.filter(fahrzeugUnbenannt).length;
  const typHatVorlage =
    stanPersonalVorbelegung(e.organisation, e.einheitsTyp).length > 0 || fahrzeugVorbelegung(e).length > 0;

  /**
   * Einheitstyp setzen — und die Vorbelegung mitnehmen. Vorher füllte die
   * erste Wahl still 9 Sollplätze und 4 Fahrzeuge ein, und ein Wechsel auf
   * den richtigen Typ ließ sie stehen: der Bogen meldete die Summe beider.
   * Jetzt weichen die unbenannten Karten (Namen bzw. Kennzeichen offen) der
   * Vorbelegung des neuen Typs; was schon einen Namen trägt, bleibt. Ein
   * geleerter oder frei getippter Typ hat keine Vorbelegung — dann gehen die
   * unbenannten Karten nur weg.
   */
  function einheitstypSetzen(v: Einheit["einheitsTyp"]) {
    const einheit = { ...e, einheitsTyp: v };
    // Derselbe Code noch einmal (Combobox-Auflösung beim Verlassen): nichts anfassen.
    if (v.code != null && v.code === e.einheitsTyp.code) {
      aendern({ einheit });
      return;
    }
    const personal = [
      ...bogen.personal.filter((p) => !personUnbenannt(p)),
      ...(bogen.personalErfassung === PersonalErfassung.VOLLSTAENDIG ? stanPersonalVorbelegung(e.organisation, v) : []),
    ];
    // Nur Stärke (Meldekopf-Schnellerfassung): keine Soll-Fahrzeuge. Gefragt
    // war die Stärke; vier ungeprüfte Fahrzeuge liefen sonst in die Summe der
    // Lage und als „4 Lücken" auf die Karte (Audit Runde 2, R2-W3).
    const fahrzeuge = [
      ...bogen.fahrzeuge.filter((f) => !fahrzeugUnbenannt(f)),
      ...(bogen.personalErfassung === PersonalErfassung.NUR_STAERKE ? [] : fahrzeugVorbelegung(einheit)),
    ];
    aendern({
      einheit,
      ...(personal.length !== bogen.personal.length || personal.some((p, i) => p !== bogen.personal[i]) ? { personal } : {}),
      ...(fahrzeuge.length !== bogen.fahrzeuge.length || fahrzeuge.some((f, i) => f !== bogen.fahrzeuge[i]) ? { fahrzeuge } : {}),
    });
  }

  /** „Vorbelegung entfernen": nur die unbenannten Karten, benannte bleiben. */
  function vorbelegungEntfernen() {
    aendern({
      personal: bogen.personal.filter((p) => !personUnbenannt(p)),
      fahrzeuge: bogen.fahrzeuge.filter((f) => !fahrzeugUnbenannt(f)),
    });
  }

  /**
   * Organisation wechseln. Einheitstyp und Zugehörigkeit hängen am
   * Vokabular der Organisation und können nicht mitgenommen werden — sie
   * gingen vorher ohne ein Wort verloren, samt der Rufnummern und Postfächer
   * dreier Ebenen. Steht davon etwas im Bogen, wird gefragt und benannt, was
   * verloren geht; bei Abbruch bleibt die Auswahl, wie sie war.
   */
  async function organisationWechseln(organisation: OrganisationsTyp) {
    if (organisation === e.organisation) return;
    const typText = vokabText(e.einheitsTyp, einheitstypen, "kurz").trim();
    const ebenenMitInhalt = e.hierarchie.filter(ebeneHatInhalt);
    const verluste: string[] = [];
    if (typText) verluste.push(`Einheitstyp „${typText}"`);
    if (ebenenMitInhalt.length > 0) {
      const namen = ebenenMitInhalt.map((h) => [vokabText(h.bezeichnung, ebenen, "kurz"), h.name.trim()].filter(Boolean).join(" ") || "Ebene ohne Namen");
      verluste.push(`Zugehörigkeit (${namen.join(", ")}) samt Kürzel, Telefon und E-Mail`);
    }
    if (vorbelegtePersonen > 0 || vorbelegteFahrzeuge > 0) {
      const teile = [
        vorbelegtePersonen > 0 ? anzahlText(vorbelegtePersonen, "vorbelegte Person ohne Namen", "vorbelegte Personen ohne Namen") : "",
        vorbelegteFahrzeuge > 0 ? anzahlText(vorbelegteFahrzeuge, "Fahrzeug ohne Kennzeichen", "Fahrzeuge ohne Kennzeichen") : "",
      ].filter(Boolean);
      verluste.push(teile.join(" und "));
    }
    if (
      verluste.length > 0 &&
      !(await frageJaNein({
        titel: `Organisation auf „${orgLabel(organisation)}" wechseln?`,
        text: `Diese Angaben passen nur zu „${orgLabel(e.organisation)}" und gehen beim Wechsel verloren: ${verluste.join("; ")}. Benannte Personen und Fahrzeuge mit Kennzeichen bleiben erhalten.`,
        ok: "Organisation wechseln",
        gefahr: true,
      }))
    ) {
      return;
    }
    aendern({
      einheit: { ...e, organisation, einheitsTyp: {}, hierarchie: [ersteEbene(organisation)] },
      // Wie beim Leeren des Typs: die Vorbelegung gehört zum alten Typ.
      personal: bogen.personal.filter((p) => !personUnbenannt(p)),
      fahrzeuge: bogen.fahrzeuge.filter((f) => !fahrzeugUnbenannt(f)),
    });
  }
  const ovDaten = useOvDaten(e.organisation === OrganisationsTyp.THW);
  const ovVerzeichnis = ovDaten?.THW_ORTSVERBAENDE ?? [];

  /**
   * OV aus der Vorschlagsliste übernehmen. Mit dem OV steht auch der
   * Ortsteil des Funkrufnamens fest — in Berlin bekommen die schon erfassten
   * Fahrzeuge dabei die OV-Kennzahl („22/51" → „06/22/51").
   */
  function ovUebernehmen(i: number, ov: ThwOrtsverband) {
    if (!ovDaten) return;
    const einheit = { ...e, hierarchie: ovInHierarchieUebernehmen(ovDaten, e.hierarchie, i, ov) };
    const fahrzeuge = fahrzeugeMitFunkrufOv(bogen.fahrzeuge, einheit);
    aendern({ einheit, ...(fahrzeuge === bogen.fahrzeuge ? {} : { fahrzeuge }) });
  }

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
      {/* Der Schnell-Einstieg von der Startseite landet in genau diesem
          sechsschrittigen Assistenten — und sah damit aus wie der volle Bogen.
          Wer eine eintreffende Einheit in zwanzig Sekunden aufnehmen will,
          soll hier lesen, was ihn erwartet, statt es auf Schritt 3 zu
          entdecken. Bewusst „können offen bleiben": Fahrzeuge zählt der
          Meldekopf manchmal doch mit, gesperrt ist nichts. */}
      {bogen.personalErfassung === PersonalErfassung.NUR_STAERKE && (
        <p className="hinweis">
          Schnellerfassung: Es reichen der Name der Einheit hier und die Stärke in Schritt 3 —
          Einsatzdaten, Fahrzeuge und Sofortbedarf können offen bleiben.
        </p>
      )}
      <div className="zeile">
        <Feld titel="Organisation">
          <Auswahl
            value={e.organisation}
            onChange={(ev) => void organisationWechseln(Number(ev.target.value))}
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
            placeholder={ORGANISATIONSNAME_BEISPIEL[e.organisation] ?? "z. B. Name der Organisation"}
          />
        </Feld>
      </div>
      <div className="zeile">
        <Feld titel="Einheitstyp">
          <VokabAuswahl
            wert={e.einheitsTyp}
            aendern={einheitstypSetzen}
            tabelle={einheitstypen}
            platzhalter={EINHEITSTYP_BEISPIEL[e.organisation] ?? "z. B. Löschzug, SEG Sanität"}
            suchbar
          />
        </Feld>
      </div>
      {/* Die Vorbelegung wird angesagt, wo sie ausgelöst wird. Vorher stand
          auf Schritt 1 nichts davon — erst Schritt 3 meldete „7 Personenkarten
          ohne Angaben zählen in die Stärke", ohne zu sagen, woher sie kamen. */}
      {typHatVorlage && (vorbelegtePersonen > 0 || vorbelegteFahrzeuge > 0) && (
        <p className="hinweis vorbelegung-hinweis" role="status">
          Vorbelegt nach StAN:{" "}
          {[
            vorbelegtePersonen > 0 ? `${anzahlText(vorbelegtePersonen, "Person", "Personen")} (Namen offen)` : "",
            vorbelegteFahrzeuge > 0 ? `${anzahlText(vorbelegteFahrzeuge, "Fahrzeug", "Fahrzeuge")} (Kennzeichen offen)` : "",
          ]
            .filter(Boolean)
            .join(", ")}
          . Sie zählen in die Stärke, bis sie ausgefüllt oder entfernt sind; ein anderer Einheitstyp
          ersetzt sie durch seine eigenen Sollplätze.{" "}
          <button type="button" onClick={vorbelegungEntfernen}>Vorbelegung entfernen</button>
        </p>
      )}

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
        <div className="zeile ebenen-zeile" key={i}>
          {/* „mittel" statt „schmal": in 7rem wurde „OV – Ortsverband" mitten
              im Wort abgeschnitten — die Ebene ist die Spalte, an der man die
              Zeile überhaupt erst zuordnet. */}
          <Feld titel={i === 0 ? "Ebene (eigene Einheit)" : "Ebene (übergeordnet)"} klasse="mittel">
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
                id={i === 0 ? "feld-einheit-name" : undefined}
                wert={h.name}
                platzhalter="tippen für Vorschläge…"
                verzeichnis={ovVerzeichnis}
                tippen={(name) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, name } : x)) })}
                uebernehmen={(ov) => ovUebernehmen(i, ov)}
              />
            ) : (
              <input
                id={i === 0 ? "feld-einheit-name" : undefined}
                value={h.name}
                onChange={(ev) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)) })}
              />
            )}
          </Feld>
          {/* Das Kürzel (z. B. THW-OV "OODE") ergibt nur beim THW Sinn; andere Organisationen führen keine solchen Kürzel.
              „Dienststellen-Kürzel (optional)": „Kürzel" allein las ein Neuling als
              irgendeine Abkürzung und tippte „OV OL" — das Beispiel sagt, was gemeint ist. */}
          {e.organisation === OrganisationsTyp.THW && (
            <Feld titel="Dienststellen-Kürzel (optional)" klasse="mittel">
              {h.bezeichnung.code === 1 ? (
                // Viele kennen ihr OV-Kürzel und tippen es ein – dieselbe Vorschlagsliste wie beim OV-Namen.
                <OvVorschlagFeld
                  kennung
                  wert={h.kurz ?? ""}
                  platzhalter="z. B. OODE für OV Oldenburg"
                  verzeichnis={ovVerzeichnis}
                  tippen={(kurz) =>
                    setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, kurz: kurz.toUpperCase() || undefined } : x)) })
                  }
                  uebernehmen={(ov) => ovUebernehmen(i, ov)}
                />
              ) : (
                <input
                  {...KENNUNG_EINGABE}
                  value={h.kurz ?? ""}
                  placeholder="z. B. GOLD für RSt Oldenburg"
                  onChange={(ev) =>
                    setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, kurz: ev.target.value.toUpperCase() || undefined } : x)) })
                  }
                />
              )}
            </Feld>
          )}
          <Feld titel="Telefon" schmal>
            {/* type="tel"/inputMode: auf dem Telefon kommt der Ziffernblock
                zuerst. Ohne das lag die Nummer, die der Meldekopf für den
                Rückruf braucht, hinter einer Tastatur-Umschaltung — und die
                tippt niemand im Regen gern zweimal. Kein type="number":
                Vorwahl-Trennzeichen und führende Null gehören nicht in ein
                Rechenfeld. */}
            <input
              type="tel"
              inputMode="tel"
              // Dienststellenkontakt, nicht der eigene: „tel" bot die private
              // Handynummer des Helfers an (R2-M6).
              {...FREMDE_DATEN}
              value={h.telefon ?? ""}
              onChange={(ev) =>
                setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, telefon: ev.target.value.replace(/\D/g, "") || undefined } : x)) })
              }
            />
          </Feld>
          <Feld titel="E-Mail">
            <input
              type="email"
              inputMode="email"
              {...FREMDE_DATEN}
              value={h.email ?? ""}
              onChange={(ev) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, email: ev.target.value || undefined } : x)) })}
            />
          </Feld>
          {/* Die unterste Ebene ist die Einheit selbst und bleibt stehen. Ihr
              Platz bleibt trotzdem reserviert — sonst stünde die E-Mail-Spalte
              der ersten Zeile um eine Knopfbreite weiter als die darunter. */}
          {i > 0 ? (
            <button
              type="button"
              className="zeilen-knopf"
              aria-label={`Ebene ${[vokabText(h.bezeichnung, ebenen, "kurz"), h.name.trim()].filter(Boolean).join(" ") || i + 1} entfernen`}
              onClick={async () => {
                /* Rückfrage-Regel: eine Ebene mit Namen, Rufnummer oder
                   Postfach verschwindet nicht still — „RB Tübingen" samt
                   Kontakt war mit einem Fehlgriff weg. Eine leere Zeile geht
                   ohne Dialog. */
                const name = [vokabText(h.bezeichnung, ebenen, "kurz"), h.name.trim()].filter(Boolean).join(" ") || `Ebene ${i + 1}`;
                const kontakt = [
                  h.kurz?.trim() && `Kürzel ${h.kurz.trim()}`,
                  h.telefon?.trim() && `Telefon ${h.telefon.trim()}`,
                  h.email?.trim() && `E-Mail ${h.email.trim()}`,
                ].filter(Boolean);
                if (
                  ebeneHatInhalt(h) &&
                  !(await frageJaNein({
                    titel: `${name} entfernen?`,
                    text: `Die Angaben dieser Ebene gehen verloren${kontakt.length > 0 ? ` — ${kontakt.join(", ")}` : ""}.`,
                    ok: "Ebene entfernen",
                    gefahr: true,
                  }))
                ) {
                  return;
                }
                setE({ hierarchie: e.hierarchie.filter((_, j) => j !== i) });
              }}
            >
              ✕
            </button>
          ) : (
            <span className="zeilen-knopf-leer" aria-hidden="true" />
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
      {/* Derselbe Hinweisblock wie im Personal-Schritt, und aus demselben
          Grund: „Name (Pflicht)" konnte man kommentarlos leer lassen und
          „Weiter" drücken — der Fehler fiel erst fünf Schritte später in der
          Übersicht auf, als „(Standort offen)" auf dem Bogen. Gesperrt wird
          weiterhin nichts: wer den OV-Namen gerade nicht weiß, soll
          weiterkommen und ihn nachtragen. Er steht jetzt nur nicht mehr still
          da. */}
      <Hinweise punkte={pruefpunkte(bogen, false)} aktuellerSchritt={0} />
    </section>
  );
}
