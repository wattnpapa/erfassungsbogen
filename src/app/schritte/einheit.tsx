/**
 * Schritt 1 — Einheit: Organisation, Einheitstyp, Landesvorlagen und die
 * Hierarchie der Kontaktstellen (beim THW mit OV-Vorschlagsliste).
 */

import { Fragment, useEffect, useState, type ReactNode } from "react";
import {
  Einheit,
  Ernaehrung,
  Geschlecht,
  HierarchieEbene,
  OrganisationsTyp,
  PersonalErfassung,
  staerke,
  type Fahrzeug,
  type Person,
} from "@bos/eeb-format/model";
import type { ThwOrtsverband } from "@bos/vokabulare/thw-ov";
import { fahrzeugVorbelegung, fahrzeugeMitFunkrufOv } from "../../vokabulare/thw-funkrufname-ort";
import { stanPersonalVorbelegung } from "@bos/vokabulare/thw-stan-personal";
import {
  ORG_OPTIONEN,
  bogenHatInhalt,
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
import { DaumenQuittung } from "../daumen-quittung";
import { EBENE_WEG_SCHLUESSEL, rueckwegHolen, rueckwegMerken } from "../rueckweg-sitzung";
import { vorbelegungWegLesen, vorbelegungWegSichern, zustandsAbdruck, type VorbelegungWeg } from "../vorbelegung-rueckweg";
import { Auswahl, Feld, FREMDE_DATEN, Hinweise, KENNUNG_EINGABE, NAMEN_EINGABE, VokabAuswahl, VorschlagFeld, type SchrittProps } from "./bausteine";
import { TelefonFeld } from "./telefon-feld";
import { ortAnzeige, sucheForm } from "../schreibweise";
import { emailProblem, emailSatz } from "../email-pruefung";

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

/** THW-OV-Verzeichnis samt Regionalstruktur; lädt nur, wenn `aktiv` (THW gewählt). Auch Schritt 3 nutzt es (Dienststelle je Person). */
export function useOvDaten(aktiv: boolean): OvDaten | null {
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

/** Steht im Ortsfeld nicht mehr der Ort, der zuletzt aus dem Verzeichnis ergänzt wurde (R11-E1)? */
export function ortGeaendert(aktuell: string, ergaenzt: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  return norm(aktuell) !== norm(ergaenzt);
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
 * Der Ortsverband, den ein Text nennt („THW Ortsverband Ulm“ → Ulm) — der
 * längste Name des Verzeichnisses, der als ganzes Wort darin steht. Wer den
 * Ortsverband in das Feld „Organisationsname“ tippt, bekam weder Kürzel noch
 * Kontakte noch übergeordnete Stellen (Audit Runde 4, R4-N5).
 */
/**
 * Weicht Rolle oder Funktion einer unbenannten Karte von der Vorbelegung des
 * Typs ab? Gibt es keine Vorbelegung (Typ geleert oder frei getippt), zählt
 * jede gesetzte Rolle oder Funktion als von Hand gesetzt (Audit Runde 5, R5-D5).
 */
function rolleOderFunktionGeaendert(p: Person, soll: readonly Person[]): boolean {
  const schluessel = (x: Person) => `${x.staerkeRolle}|${JSON.stringify(x.funktionen)}`;
  if (soll.length === 0) return p.staerkeRolle !== 0 || p.funktionen.length > 0;
  return !soll.some((x) => schluessel(x) === schluessel(p));
}

export function ovImText(verzeichnis: ThwOrtsverband[], text: string): ThwOrtsverband | undefined {
  const t = text.trim().toLowerCase();
  if (t.length < 4) return undefined;
  let beste: ThwOrtsverband | undefined;
  for (const o of verzeichnis) {
    const n = o.name.trim().toLowerCase();
    if (n.length < 3 || (beste && beste.name.length >= n.length)) continue;
    const roh = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Als ganzes Wort: „Ulm“ steht auch in „Neu-Ulm“, aber „Neu-Ulm“ ist der längere Treffer.
    if (new RegExp(`(^|[^a-zäöüß])${roh}($|[^a-zäöüß])`).test(t)) beste = o;
  }
  return beste;
}

/** Die Vorschläge zu einer Eingabe (höchstens acht) — auch für den Hinweis nach dem Verlassen des Feldes (R16-E4). */
export function ovTreffer(verzeichnis: readonly ThwOrtsverband[], wert: string): ThwOrtsverband[] {
  const suche = sucheForm(wert);
  return suche
    ? verzeichnis
        .filter((o) => sucheForm(o.name).includes(suche) || sucheForm(o.kurz).startsWith(suche) || sucheForm(o.ort).startsWith(suche))
        .sort((a, b) => Number(sucheForm(b.name).startsWith(suche)) - Number(sucheForm(a.name).startsWith(suche)))
        .slice(0, 8)
    : [];
}

/** Satz zu einem Ortsverband-Namen ohne Kürzel: mehrdeutig („mehrere Orte heißen so") oder nicht im Verzeichnis (R16-E4). */
export function ovFreiHinweis(name: string, treffer: readonly ThwOrtsverband[]): string {
  if (treffer.length === 0) {
    return `„${name}" ist nicht im OV-Verzeichnis — Vorschlag antippen, sonst fehlen Kürzel, Telefon und E-Mail. Ein Ortsverband, den es dort nicht gibt, darf so stehen bleiben.`;
  }
  const namen = treffer.slice(0, 3).map((o) => o.name).join(", ") + (treffer.length > 3 ? " …" : "");
  return treffer.length === 1
    ? `„${name}" meint vielleicht ${namen} — Vorschlag antippen, sonst fehlen Kürzel, Telefon und E-Mail.`
    : `„${name}" kann mehrere Ortsverbände meinen (${namen}) — Vorschlag antippen, sonst fehlen Kürzel, Telefon und E-Mail.`;
}

/**
 * OV-Namensfeld mit Vorschlagsliste aus dem OV-Verzeichnis. Auswahl übernimmt
 * Kürzel + Kontaktdaten; ein direkt eingetipptes Kürzel ("OODE") wird beim
 * Verlassen des Felds aufgelöst.
 */
export function OvVorschlagFeld(props: {
  /** id des Eingabefelds — Sprungziel einer Rückfrage („Name der Einheit fehlt"). */
  id?: string;
  /** Zugänglicher Name, wo kein <Feld> ihn liefert (Tabellenzelle). */
  beschriftung?: string;
  wert: string;
  platzhalter: string;
  /** OV-Verzeichnis; leer, solange das Datenpaket noch lädt. */
  verzeichnis: readonly ThwOrtsverband[];
  tippen: (wert: string) => void;
  uebernehmen: (ov: ThwOrtsverband) => void;
  /** Beim Verlassen eindeutig aufgelöst (nicht gewählt) — der Aufrufer sagt es an (R3-S4). */
  aufgeloest?: (ov: ThwOrtsverband) => void;
  /** true: das Feld nimmt das Kürzel auf, nicht den Namen (R2-M6). */
  kennung?: boolean;
  /** Beim Verlassen des Felds, vor der Auflösung — etwa um einen Tipp-Entwurf zu verwerfen. */
  verlassen?: (wert: string) => void;
}) {
  const { id, beschriftung, wert, platzhalter, verzeichnis, tippen, uebernehmen, aufgeloest, kennung, verlassen } = props;

  // Beide Seiten gefaltet (R11-H1): „Hassmersheim" und „Muellheim" finden „Haßmersheim" und „Müllheim".
  // Bindestrich und Leerzeichen gleich (R13-H2): „Neu Ulm" findet „Neu-Ulm".
  const treffer = ovTreffer(verzeichnis, wert);
  // R11-N2: steht das Kürzel schon da und ist der einzige Vorschlag, wiederholt die Liste nur den Eintrag und verdeckt Telefon und E-Mail.
  const nurEintrag = !!kennung && treffer.length === 1 && treffer[0]!.kurz === wert.trim().toUpperCase();
  const gezeigt = nurEintrag ? [] : treffer;

  return (
    <VorschlagFeld
      id={id}
      beschriftung={beschriftung}
      wert={wert}
      platzhalter={platzhalter}
      treffer={gezeigt}
      schluessel={(o) => o.name}
      zeile={(o) => (
        <>
          {o.name}
          <small>
            {o.kurz} · {o.plz} {ortAnzeige(o.ort)}
          </small>
        </>
      )}
      tippen={tippen}
      waehlen={uebernehmen}
      kennung={kennung}
      keineTreffer={kennung ? undefined : "Kein Ort mit diesem Namen in der Liste — Schreibweise prüfen. Ein Ortsverband, den es dort nicht gibt, darf so stehen bleiben."}
      verlassen={(eingabe) => {
        verlassen?.(eingabe);
        const e = eingabe.trim();
        if (!e) return;
        // Beim Verlassen nur eindeutig auflösen: das Kürzel, oder ein Name,
        // mit dem kein anderer Ortsverband beginnt. „Neustadt" füllte sonst
        // Kürzel und Telefon von Neustadt (Holstein) ein, obwohl ebenso
        // „Neustadt an der Aisch" oder „… an der Weinstraße" gemeint sein
        // konnte — ohne dass jemand gewählt hatte (Audit Runde 3, R3-S4).
        const klein = sucheForm(e);
        const gleichAnfang = verzeichnis.filter((o) => sucheForm(o.name).startsWith(klein));
        // Ohne Groß-/Kleinschreibung: „ulm" gehörte zu „Ulm", blieb aber Freitext
        // ohne Kürzel und Kontakt (Audit Runde 4, R4-H1); ohne Umlaut-Unterschiede (R11-H1).
        const ov =
          verzeichnis.find((o) => o.kurz === e.toUpperCase()) ??
          (gleichAnfang.length === 1 && sucheForm(gleichAnfang[0]!.name) === klein ? gleichAnfang[0] : undefined);
        if (ov) (aufgeloest ?? uebernehmen)(ov);
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
  // Kein Ortsverband als Beispiel: Wer ihn hier eintrug, ließ unten das Pflichtfeld
  // der Ebene „OV“ leer, und Kürzel, Telefon, RB und LV fehlten (R4-N5).
  [OrganisationsTyp.THW]: "meist leer – OV unten eintragen",
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
  [OrganisationsTyp.THW]: "z. B. Bergungsgruppe, FGr WP",
  [OrganisationsTyp.FEUERWEHR]: "z. B. Löschzug, Löschgruppe",
  [OrganisationsTyp.DRK]: "z. B. SEG Sanität, Betreuungszug",
  [OrganisationsTyp.JUH]: "z. B. SEG Sanität, Betreuungszug",
  [OrganisationsTyp.MHD]: "z. B. SEG Sanität, Betreuungszug",
  [OrganisationsTyp.ASB]: "z. B. SEG Sanität, Betreuungszug",
  [OrganisationsTyp.DLRG]: "z. B. Wasserrettungszug, Bootstrupp",
};

/** Schnellerfassung (R19-E3, S2, O7): alles außer Ort und Typ steht hinter einem Aufklapper. */
function SchnellMehr({ children }: { children?: ReactNode }) {
  return (
    <details className="schnell-mehr">
      <summary>Organisation, Ebene, Kontakt (optional)</summary>
      {children}
    </details>
  );
}

export function SchrittEinheit({ bogen, aendern: aendernRoh, ortFokus = false }: SchrittProps & { ortFokus?: boolean }) {
  const e = bogen.einheit;
  const schnell = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const Mehr = schnell ? SchnellMehr : Fragment;
  // Schnell- und manuelle Erfassung für eine Sammlung (R11-M1): Das einzige Pflichtfeld liegt sonst zwei Bildschirme
  // unter dem Kopf. Beim Öffnen (nur solange der Ort noch leer ist, nicht beim Zurückblättern) steht der Fokus dort.
  useEffect(() => {
    if (!ortFokus || (bogen.einheit.hierarchie[0]?.name ?? "").trim() !== "") return;
    const feld = document.getElementById("feld-einheit-name");
    // R16-M1: Die Seite bleibt am Anfang (Kopf, Marke „Aufnahme für: …", „1. Einheit"); der Fokus springt nicht mehr hinunter.
    try {
      window.scrollTo(0, 0);
    } catch {
      /* Testumgebung ohne Layout */
    }
    feld?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Vorbelegung und Typwechsel verändern die Personalliste — der Verpflegungs-
  // Bedarf in Schritt 5 zieht mit (siehe verpflegungMitziehen).
  // Jede weitere Änderung verwirft den Rückweg der Vorbelegung, damit
  // „Rückgängig" nie spätere Eingaben mitnimmt (wie in Schritt 3).
  const aendern = (patch: Partial<typeof bogen>) => {
    setVorbelegungWeg(null);
    aendernRoh(verpflegungMitziehen(bogen, patch));
  };
  /**
   * Rückweg nach dem Wegnehmen unbenannter Sollplätze („Vorbelegung
   * entfernen", Wechsel des Einheitstyps): Die Plätze trugen Geschlecht,
   * Ernährung und „Zählt als", ohne dass es irgendwo stand, und mit ihnen
   * fiel die Stärke — still (Audit Runde 4, R4-D4). Die Leiste im
   * Daumenbereich nennt, was ging und wie sich die Stärke änderte.
   *
   * Der Stand zu Beginn bleibt erhalten, solange nichts anderes geändert wird:
   * Wer den Typ erst leert und dann einen neuen tippt, geht über mehrere
   * Schritte, und „Rückgängig" soll zum Anfang zurück, nicht zum Zwischenstand.
   */
  const [vorbelegungWeg, setVorbelegungWegRoh] = useState<VorbelegungWeg | null>(() => vorbelegungWegLesen(bogen));
  // Mit Sitzungsspeicher dahinter: Der Rückweg überlebt ein Neuladen (R5-D5).
  const setVorbelegungWeg = (v: VorbelegungWeg | null | ((alt: VorbelegungWeg | null) => VorbelegungWeg | null)) => {
    setVorbelegungWegRoh((alt) => {
      const neu = typeof v === "function" ? v(alt) : v;
      vorbelegungWegSichern(neu);
      return neu;
    });
  };
  /** `aendern` mit Rückweg, wenn dabei unbenannte Sollplätze weggehen (oder schon eine Leiste steht). */
  function aendernMitVorbelegungWeg(
    patch: Partial<typeof bogen>,
    titel: string,
    immer = false,
    /** Mit Angabe ersetzt der neue Schritt Titel und Ziel einer schon stehenden Leiste; der Rückweg bleibt der erste Stand. */
    aktualisieren?: (alt: VorbelegungWeg) => string | undefined,
  ) {
    if (immer || vorbelegtePersonen > 0 || vorbelegteFahrzeuge > 0) {
      const teile = [
        vorbelegtePersonen > 0 ? anzahlText(vorbelegtePersonen, "Person", "Personen") : "",
        vorbelegteFahrzeuge > 0 ? anzahlText(vorbelegteFahrzeuge, "Fahrzeug", "Fahrzeuge") : "",
      ].filter(Boolean);
      const mitAngaben = bogen.personal.filter(
        (p) => personUnbenannt(p) && (p.geschlecht !== Geschlecht.M || p.ernaehrung !== Ernaehrung.FLEISCH),
      ).length;
      // Rolle oder Funktion, die von der Vorbelegung des Typs abweicht: Von Hand
      // gesetzt, auch wenn Name und Rufnummer noch fehlen (R5-D5).
      const soll = stanPersonalVorbelegung(e.organisation, e.einheitsTyp);
      const mitRolle = bogen.personal.filter((p) => personUnbenannt(p) && rolleOderFunktionGeaendert(p, soll)).length;
      const zusatz = [
        mitAngaben > 0 ? `${mitAngaben} mit Geschlecht oder Ernährung` : "",
        mitRolle > 0 ? `${mitRolle} mit geänderter Rolle oder Funktion` : "",
      ].filter(Boolean);
      const neu = {
        kopf: teile.length > 0 ? `${titel}: ${teile.join(", ")}${zusatz.length > 0 ? ` (${zusatz.join(", ")})` : ""}` : titel,
        vor: staerke(bogen).gesamt,
        personal: bogen.personal,
        fahrzeuge: bogen.fahrzeuge,
        einheit: e,
        nonce: Date.now(),
        danach: zustandsAbdruck(patch.personal ?? bogen.personal, patch.fahrzeuge ?? bogen.fahrzeuge),
      };
      setVorbelegungWeg((alt) =>
        alt && aktualisieren ? { ...alt, kopf: neu.kopf, ziel: aktualisieren(alt), nonce: neu.nonce, danach: neu.danach } : (alt ?? neu),
      );
    }
    aendernRoh(verpflegungMitziehen(bogen, patch));
  }
  /**
   * Rückweg nach „Ebene entfernen“ (R9-D3): Person und Fahrzeug haben „Rückgängig“, die Ebene mit Kürzel,
   * Telefon und E-Mail hatte keins. Wie dort überlebt er Schrittwechsel und Neuladen (15 Minuten, solange
   * die Ebenen so bleiben, Sitzungsspeicher des Tabs).
   */
  type EbenenWeg = { ebene: HierarchieEbene; index: number; name: string; nonce: number };
  const [ebenenWeg, setEbenenWegRoh] = useState<EbenenWeg | null>(() => rueckwegHolen<EbenenWeg>(EBENE_WEG_SCHLUESSEL, JSON.stringify(bogen.einheit.hierarchie)));
  const setEbenenWeg = (w: EbenenWeg | null, danach: HierarchieEbene[] = e.hierarchie) => {
    setEbenenWegRoh(w);
    rueckwegMerken(EBENE_WEG_SCHLUESSEL, w, JSON.stringify(danach));
  };
  function ebeneZurueck() {
    if (!ebenenWeg) return;
    const liste = [...e.hierarchie];
    liste.splice(Math.min(ebenenWeg.index, liste.length), 0, ebenenWeg.ebene);
    setEbenenWeg(null);
    setE({ hierarchie: liste });
  }
  function vorbelegungZurueck() {
    if (!vorbelegungWeg) return;
    const { personal, fahrzeuge, einheit } = vorbelegungWeg;
    aendernRoh(verpflegungMitziehen(bogen, { personal, fahrzeuge, einheit }));
    setVorbelegungWeg(null);
  }
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
    // Der Rückweg der Vorbelegung bleibt dabei stehen: Wer „Rückgängig" tippt,
    // nimmt den Fokus aus dem Feld, und das Verlassen löst denselben Typ noch
    // einmal auf — das darf die Leiste nicht schon vor dem Tipp wegnehmen (R4-D4).
    if (v.code != null && v.code === e.einheitsTyp.code) {
      aendernRoh(verpflegungMitziehen(bogen, { einheit }));
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
    aendernMitVorbelegungWeg(
      {
        einheit,
        ...(personal.length !== bogen.personal.length || personal.some((p, i) => p !== bogen.personal[i]) ? { personal } : {}),
        ...(fahrzeuge.length !== bogen.fahrzeuge.length || fahrzeuge.some((f, i) => f !== bogen.fahrzeuge[i]) ? { fahrzeuge } : {}),
      },
      "Vorbelegung des bisherigen Typs ersetzt",
    );
  }

  /** „Vorbelegung entfernen": nur die unbenannten Karten, benannte bleiben. */
  function vorbelegungEntfernen() {
    aendernMitVorbelegungWeg(
      {
        personal: bogen.personal.filter((p) => !personUnbenannt(p)),
        fahrzeuge: bogen.fahrzeuge.filter((f) => !fahrzeugUnbenannt(f)),
      },
      "Vorbelegung entfernt",
    );
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
    const kennwoerter = [
      ...new Set(
        bogen.fahrzeuge
          .filter((f) => !fahrzeugUnbenannt(f) && f.funkrufname)
          .map((f) => vokabText(f.funkrufname!.kennwort, vokabularFuer(e.organisation, "kennwort"), "kurz").trim())
          .filter(Boolean),
      ),
    ];
    if (
      verluste.length > 0 &&
      !(await frageJaNein({
        titel: `Organisation auf „${orgLabel(organisation)}" wechseln?`,
        text: `Diese Angaben passen nur zu „${orgLabel(e.organisation)}" und gehen beim Wechsel verloren: ${verluste.join("; ")}. Benannte Personen und Fahrzeuge mit Kennzeichen bleiben erhalten${
          kennwoerter.length > 0
            ? `, auch ihre Funkrufnamen mit dem bisherigen Kennwort (${kennwoerter.join(", ")}) — das stimmt bei „${orgLabel(organisation)}" meist nicht und lässt sich in Schritt 4 ändern`
            : ""
        }. Direkt danach bietet „Rückgängig" den alten Stand an.`,
        ok: "Organisation wechseln",
        gefahr: true,
      }))
    ) {
      return;
    }
    // Mit Rückweg (R7-E5): die Leiste im Daumenbereich stellt Organisation, Typ
    // und Zugehörigkeit samt Vorbelegung wieder her.
    aendernMitVorbelegungWeg(
      {
        einheit: { ...e, organisation, einheitsTyp: {}, hierarchie: [ersteEbene(organisation)] },
        // Wie beim Leeren des Typs: die Vorbelegung gehört zum alten Typ.
        personal: bogen.personal.filter((p) => !personUnbenannt(p)),
        fahrzeuge: bogen.fahrzeuge.filter((f) => !fahrzeugUnbenannt(f)),
      },
      `Organisation auf „${orgLabel(organisation)}" gewechselt (Einheitstyp und Zugehörigkeit zurückgesetzt)`,
      true,
      // R12-N2: Die Zeile nennt die letzte Wahl und, wohin „Rückgängig“ führt (der Stand vor dem ersten Wechsel).
      (alt) =>
        alt.einheit.organisation === organisation ? undefined : `Rückgängig stellt „${orgLabel(alt.einheit.organisation)}" wieder her.`,
    );
  }
  // Welches Namensfeld der Zugehörigkeit gerade den Fokus hat (Hinweis „nicht im Verzeichnis" erst danach).
  const [nameImFokus, setNameImFokus] = useState<number | null>(null);
  const ovDaten = useOvDaten(e.organisation === OrganisationsTyp.THW);
  const ovVerzeichnis = ovDaten?.THW_ORTSVERBAENDE ?? [];
  // Der Ortsverband steht im „Organisationsnamen“, die Ebene „OV“ ist leer (R4-N5).
  const eigeneEbene = e.hierarchie[0];
  const ovImNamen =
    e.organisation === OrganisationsTyp.THW && eigeneEbene?.bezeichnung.code === 1 && !eigeneEbene.name.trim()
      ? ovImText(ovVerzeichnis, e.organisationName ?? "")
      : undefined;
  /** „Als Ortsverband eintragen“: die Ebene füllen; der Organisationsname geht, wenn er nur den OV nannte. */
  function ovAusOrganisationsname(ov: ThwOrtsverband) {
    if (!ovDaten) return;
    const text = e.organisationName ?? "";
    const rest = text
      .replace(new RegExp(ov.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
      .replace(/\b(THW|Ortsverband|OV)\b/gi, "")
      .replace(/[\s\-–,.]+/g, " ")
      .trim();
    const einheit = {
      ...e,
      organisationName: rest ? e.organisationName : undefined,
      hierarchie: ovInHierarchieUebernehmen(ovDaten, e.hierarchie, 0, ov),
    };
    const fahrzeuge = fahrzeugeMitFunkrufOv(bogen.fahrzeuge, einheit);
    aendern({ einheit, ...(fahrzeuge === bogen.fahrzeuge ? {} : { fahrzeuge }) });
  }

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

  /**
   * Beim Verlassen eindeutig aufgelöst — nicht gewählt: „Ulm" getippt füllte
   * Kürzel, Telefon, E-Mail, Regionalstelle und Landesverband, ohne dass es
   * jemand sah (Audit Runde 3, R3-S4). Die App sagt es jetzt an und bietet
   * „Rückgängig"; der getippte Name bleibt dabei stehen.
   */
  const [ergaenzt, setErgaenzt] = useState<{ i: number; ov: ThwOrtsverband; vorher: typeof e; fahrzeuge: typeof bogen.fahrzeuge } | null>(null);
  function ovAufgeloest(i: number, ov: ThwOrtsverband) {
    // Schon übernommen (Kürzel steht): nichts erneut füllen, nichts ansagen.
    if (e.hierarchie[i]?.kurz === ov.kurz) return;
    setErgaenzt({ i, ov, vorher: e, fahrzeuge: bogen.fahrzeuge });
    ovUebernehmen(i, ov);
  }
  function ergaenzungZuruecknehmen() {
    if (!ergaenzt) return;
    const { i, vorher, fahrzeuge } = ergaenzt;
    const jetzt = e.hierarchie[i];
    aendern({
      einheit: { ...vorher, hierarchie: vorher.hierarchie.map((x, j) => (j === i && jetzt ? { ...x, name: jetzt.name } : x)) },
      fahrzeuge,
    });
    setErgaenzt(null);
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

  const alleHinweise = pruefpunkte(bogen, false);
  const mailPunkt = (adresse?: string) => (emailProblem(adresse) ? alleHinweise.find((p) => p.schritt === 0 && p.text.includes(emailSatz(adresse))) : undefined);
  const imFeld = new Set(e.hierarchie.map((h) => mailPunkt(h.email)?.text));
  /** „Ort der Einheit" (bzw. „Name" der übergeordneten Ebene) samt den Hinweisen darunter; in der Schnellerfassung steht er ganz oben (R19-E3). */
  const ortBlock = (h: (typeof e.hierarchie)[number], i: number) => (
    <>
      {/* Nur zum Beobachten des Fokus: Der Hinweis „nicht im Verzeichnis" kommt
          erst, wenn das Namensfeld verlassen ist. */}
      <span
        style={{ display: "contents" }}
        onFocusCapture={() => setNameImFokus(i)}
        onBlurCapture={() => setNameImFokus((z) => (z === i ? null : z))}
      >
      <Feld titel={i === 0 ? "Ort der Einheit (Pflicht)" : "Name"}>
        {e.organisation === OrganisationsTyp.THW && h.bezeichnung.code === 1 ? (
          <OvVorschlagFeld
            id={i === 0 ? "feld-einheit-name" : undefined}
            wert={h.name}
            platzhalter="tippen für Vorschläge…"
            verzeichnis={ovVerzeichnis}
            tippen={(name) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, name } : x)) })}
            uebernehmen={(ov) => {
              setErgaenzt(null);
              ovUebernehmen(i, ov);
            }}
            aufgeloest={(ov) => ovAufgeloest(i, ov)}
          />
        ) : (
          <input
            {...NAMEN_EINGABE}
            autoComplete="off" // Ortsnamen und Dienststellen: keine Autokorrektur, keine Vorschläge aus anderen Formularen (R16-H2)
            id={i === 0 ? "feld-einheit-name" : undefined}
            value={h.name}
            onChange={(ev) => setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)) })}
          />
        )}
      </Feld>
      </span>
      {/* Direkt unter dem Namensfeld, das ergänzt hat — dort liegt der Blick. */}
      {ergaenzt && ergaenzt.i === i && e.hierarchie[ergaenzt.i]?.kurz === ergaenzt.ov.kurz && (
        ortGeaendert(h.name, ergaenzt.ov.name) ? (
          // Der Ort wurde nach der Ergänzung geändert (R11-E1): Kürzel, Telefon, E-Mail, RB und LV
          // stammen noch vom zuerst gewählten Ortsverband — das sagt die Zeile statt „ergänzt".
          <p className="hinweis warnung-text ov-ergaenzt ov-ort-geaendert" role="status">
            Ort geändert — Kürzel, Telefon und E-Mail{e.hierarchie.length > 1 ? " und die übergeordneten Ebenen" : ""} stammen noch
            von {ergaenzt.ov.name} ({ergaenzt.ov.kurz}).{" "}
            <button type="button" className="link" onClick={ergaenzungZuruecknehmen}>
              Angaben von {ergaenzt.ov.name} entfernen
            </button>
          </p>
        ) : (
          <p className="hinweis ov-ergaenzt" role="status">
            Aus dem OV-Verzeichnis ergänzt: {ergaenzt.ov.name} ({ergaenzt.ov.kurz}) mit Telefon und E-Mail
            {e.hierarchie.length > 1 ? ", dazu die übergeordneten Ebenen" : ""}.{" "}
            <button type="button" className="link" onClick={ergaenzungZuruecknehmen}>Rückgängig</button>
          </p>
        )
      )}
      {/* Ein OV-Name ohne Kürzel ist Freitext: nicht aus dem Verzeichnis, ohne
          Telefon und E-Mail (Audit Runde 4, R4-H1). Erst nach dem Verlassen
          des Namensfelds, nicht schon beim Tippen. */}
      {e.organisation === OrganisationsTyp.THW &&
        h.bezeichnung.code === 1 &&
        ovVerzeichnis.length > 0 &&
        h.name.trim() &&
        !h.kurz?.trim() &&
        nameImFokus !== i && (
          <p className="hinweis warnung-text ov-frei-hinweis" role="status">
            {ovFreiHinweis(h.name.trim(), ovTreffer(ovVerzeichnis, h.name))}
          </p>
        )}
    </>
  );
  const typZeile = (
    <div className="zeile">
      <Feld titel="Einheitstyp">
        <VokabAuswahl
          wert={e.einheitsTyp}
          aendern={einheitstypSetzen}
          tabelle={einheitstypen}
          platzhalter={EINHEITSTYP_BEISPIEL[e.organisation] ?? "z. B. Löschzug, SEG Sanität"}
          suchbar
          freitextHinweis
        />
      </Feld>
    </div>
  );
  // Die Vorbelegung wird angesagt, wo sie ausgelöst wird. Vorher stand auf Schritt 1 nichts davon — erst Schritt 3 meldete
  // „7 Personenkarten ohne Angaben zählen in die Stärke", ohne zu sagen, woher sie kamen.
  const vorbelegungHinweis =
    typHatVorlage && (vorbelegtePersonen > 0 || vorbelegteFahrzeuge > 0) ? (
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
    ) : null;

  return (
    <section className={`karte${schnell ? " schnell-einheit" : ""}`}>
      <h2>1. Einheit</h2>
      {/* Schnellerfassung (R19-E3, S2, O7, G11, M7, N4): Der Ort — das einzige Pflichtfeld — steht als erstes Feld, dann der Typ;
          der Rest („kann offen bleiben") liegt hinter dem Aufklapper. */}
      {schnell && e.hierarchie[0] && ortBlock(e.hierarchie[0], 0)}
      {schnell && typZeile}
      {schnell && vorbelegungHinweis}
      <Mehr>
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
            {...NAMEN_EINGABE}
            value={e.organisationName ?? ""}
            autoComplete="off"
            onChange={(ev) => setE({ organisationName: ev.target.value || undefined })}
            placeholder={ORGANISATIONSNAME_BEISPIEL[e.organisation] ?? "z. B. Name der Organisation"}
          />
        </Feld>
      </div>
      {ovImNamen && (
        <p className="hinweis ov-im-namen" role="status">
          „{ovImNamen.name}“ ist ein Ortsverband und gehört unter „Zugehörigkeit“: Dort ergänzen sich Kürzel, Telefon,
          Regionalstelle und Landesverband.{" "}
          <button type="button" onClick={() => ovAusOrganisationsname(ovImNamen)}>
            Als Ortsverband „{ovImNamen.name}“ eintragen
          </button>
        </p>
      )}
      {!schnell && typZeile}
      {!schnell && vorbelegungHinweis}

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
        Aus Ort der Einheit, Organisation und Einheitstyp bildet sich die Bezeichnung auf dem Bogen: <b>{einheitAnzeigename(e)}</b>
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
          {!(schnell && i === 0) && ortBlock(h, i)}
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
                  uebernehmen={(ov) => {
                    setErgaenzt(null);
                    ovUebernehmen(i, ov);
                  }}
                  aufgeloest={(ov) => ovAufgeloest(i, ov)}
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
            {/* Dienststellenkontakt, nicht der eigene: „tel" bot die private
                Handynummer des Helfers an (R2-M6). Führendes „+" bleibt, entfernte Zeichen und eine
                zweite Nummer werden genannt, eine zu kurze Nummer fragt nach (R11-E3). */}
            <TelefonFeld
              wert={h.telefon}
              setzen={(telefon) =>
                setE({ hierarchie: e.hierarchie.map((x, j) => (j === i ? { ...x, telefon: telefon || undefined } : x)) })
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
          {/* R19-E4: Die Rückfrage zur Adresse steht direkt unter dem Feld, nicht erst unter allen Ebenen. */}
          {mailPunkt(h.email) && <Hinweise punkte={[mailPunkt(h.email)!]} aktuellerSchritt={0} />}
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
                    text: `Die Angaben dieser Ebene werden entfernt${kontakt.length > 0 ? ` — ${kontakt.join(", ")}` : ""}. „Rückgängig“ in der Leiste unten holt sie zurück — auch nach „Weiter“ oder Neuladen, 15 Minuten lang.`,
                    ok: "Ebene entfernen",
                    gefahr: true,
                  }))
                ) {
                  return;
                }
                const danach = e.hierarchie.filter((_, j) => j !== i);
                setE({ hierarchie: danach });
                if (ebeneHatInhalt(h)) setEbenenWeg({ ebene: h, index: i, name, nonce: Date.now() }, danach);
              }}
            >
              ✕
            </button>
          ) : (
            <span className="zeilen-knopf-leer" aria-hidden="true" />
          )}
        </div>
      ))}
      {/* R4-G4: Zwei Knöpfe, die Verschiedenes tun („+ übergeordnete Ebene" und
          die OV/RB/LV-Vorlage), standen ohne Lücke übereinander — ein grober
          Tipp lud die falsche Ebene. Jetzt mit 12 px Abstand. */}
      <p className="knopfreihe">
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
        </button>
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
            Regionalbereich und Landesverband anlegen
          </button>
        )}
      </p>
      </Mehr>
      {/* Derselbe Hinweisblock wie im Personal-Schritt, und aus demselben
          Grund: „Ort der Einheit (Pflicht)" konnte man kommentarlos leer lassen und
          „Weiter" drücken — der Fehler fiel erst fünf Schritte später in der
          Übersicht auf, als „(Standort offen)" auf dem Bogen. Gesperrt wird
          weiterhin nichts: wer den OV-Namen gerade nicht weiß, soll
          weiterkommen und ihn nachtragen. Er steht jetzt nur nicht mehr still
          da. */}
      {/* R19-N14: Warnungen erst nach der ersten Eingabe; der leere Schritt 1 zeigte schon zwei gelbe Kästen. */}
      <Hinweise punkte={bogenHatInhalt(bogen) ? alleHinweise.filter((p) => !imFeld.has(p.text)) : []} aktuellerSchritt={0} />
      {ebenenWeg && !vorbelegungWeg && (
        <DaumenQuittung key={`ebene:${ebenenWeg.nonce}`} onRueckgaengig={ebeneZurueck} onSchliessen={() => setEbenenWeg(null)}>
          <strong>Entfernt:</strong> {ebenenWeg.name}
        </DaumenQuittung>
      )}
      {vorbelegungWeg && (
        <DaumenQuittung key={`vorbelegung:${vorbelegungWeg.nonce}`} onRueckgaengig={vorbelegungZurueck} onSchliessen={() => setVorbelegungWeg(null)}>
          {vorbelegungWeg.kopf}
          {vorbelegungWeg.vor !== staerke(bogen).gesamt && ` — Stärke ${vorbelegungWeg.vor} → ${staerke(bogen).gesamt}`}.
          {vorbelegungWeg.ziel && ` ${vorbelegungWeg.ziel}`}
        </DaumenQuittung>
      )}
    </section>
  );
}
