/**
 * Darstellung: Bogeninhalte als Text, wie sie auf dem Papierbogen stehen.
 *
 * Rein rechnend — kein DOM, kein Capacitor, kein Dateizugriff. Damit ist dies
 * der Teil der früheren `hilfen.ts`, den auch das Schwesterprodukt braucht
 * (ADR-003, Baustein `@bos/meldekopf`). `hilfen.ts` reicht die Funktionen
 * unverändert weiter, damit die App ihren gewohnten Einstieg behält.
 */

import {
  EEB_EPOCHE_MS,
  EebZeitpunkt,
  Einheit,
  Fahrerlaubnis,
  Fahrzeug,
  Kontakt,
  KontaktArt,
  OrganisationsTyp,
  Person,
  VokabularWert,
  alleFahrerlaubnisse,
} from "../model";
import {
  FUNKRUF_KENNWOERTER,
  THW_EINHEITSTYPEN,
  THW_FAHRZEUGTYPEN,
  THW_FUNKTIONEN_ALLE,
  type VokabularEintrag,
} from "../vokabulare/thw";
import { hierarchieEbenenFuer } from "../vokabulare/ebenen";

export const ORG_OPTIONEN: { wert: OrganisationsTyp; label: string }[] = [
  { wert: OrganisationsTyp.THW, label: "THW" },
  { wert: OrganisationsTyp.FEUERWEHR, label: "Feuerwehr" },
  { wert: OrganisationsTyp.POLIZEI, label: "Polizei" },
  { wert: OrganisationsTyp.BUNDESPOLIZEI, label: "Bundespolizei" },
  { wert: OrganisationsTyp.DRK, label: "DRK" },
  { wert: OrganisationsTyp.JUH, label: "Johanniter (JUH)" },
  { wert: OrganisationsTyp.MHD, label: "Malteser (MHD)" },
  { wert: OrganisationsTyp.ASB, label: "ASB" },
  { wert: OrganisationsTyp.DLRG, label: "DLRG" },
  { wert: OrganisationsTyp.BUNDESWEHR, label: "Bundeswehr" },
  { wert: OrganisationsTyp.RETTUNGSDIENST, label: "Rettungsdienst" },
  { wert: OrganisationsTyp.SONSTIGE, label: "Sonstige" },
];

export function orgLabel(o: OrganisationsTyp): string {
  return ORG_OPTIONEN.find((e) => e.wert === o)?.label ?? `Organisation #${o}`;
}

/**
 * Vokabulare gelten organisationsspezifisch — Hierarchie-Ebenen gibt es für
 * die meisten Organisationen, die übrigen Tabellen bislang nur beim THW.
 */
export function vokabularFuer(
  org: OrganisationsTyp,
  art: "einheitstyp" | "funktion" | "fahrzeug" | "ebene" | "kennwort",
): VokabularEintrag[] {
  if (art === "kennwort") return FUNKRUF_KENNWOERTER;
  if (art === "ebene") return hierarchieEbenenFuer(org);
  if (org !== OrganisationsTyp.THW) return [];
  switch (art) {
    case "einheitstyp": return THW_EINHEITSTYPEN;
    case "funktion": return THW_FUNKTIONEN_ALLE;
    case "fahrzeug": return THW_FAHRZEUGTYPEN;
  }
}

/**
 * Alphabetische Kopie einer Vokabular-Tabelle für Auswahllisten.
 *
 * Die Tabellen selbst stehen in Code-Reihenfolge — die Codes sind append-only,
 * also landet jede Ergänzung hinten, und die StAN-Nummer sortiert nach
 * Fachbereich statt nach Namen. In einer Klappliste mit 45 Einheitstypen oder
 * 60 Funktionen sucht man so an der falschen Stelle. Sortiert wird nach dem
 * angezeigten Text (Kurzform, bei Gleichstand Name), damit die Liste genau so
 * läuft, wie sie dasteht. Die Codes bleiben unberührt — sie sind das Datenformat.
 */
export function vokabSortiert<T extends VokabularEintrag>(tabelle: T[]): T[] {
  return [...tabelle].sort(
    (a, b) => a.kurz.localeCompare(b.kurz, "de") || a.name.localeCompare(b.name, "de"),
  );
}

export function vokabText(
  v: VokabularWert | undefined,
  tabelle: VokabularEintrag[],
  form: "kurz" | "name" = "kurz",
): string {
  if (!v) return "";
  if (v.code != null) {
    const e = tabelle.find((t) => t.code === v.code);
    return e ? e[form] : `#${v.code}`;
  }
  return v.freitext ?? "";
}

export const FE_TEXT: Record<Fahrerlaubnis, string> = {
  [Fahrerlaubnis.NONE]: "—",
  [Fahrerlaubnis.AM]: "AM",
  [Fahrerlaubnis.A1]: "A1",
  [Fahrerlaubnis.A2]: "A2",
  [Fahrerlaubnis.A]: "A",
  [Fahrerlaubnis.B]: "B",
  [Fahrerlaubnis.BE]: "BE",
  [Fahrerlaubnis.C1]: "C1",
  [Fahrerlaubnis.C1E]: "C1E",
  [Fahrerlaubnis.C]: "C",
  [Fahrerlaubnis.CE]: "CE",
  [Fahrerlaubnis.D1]: "D1",
  [Fahrerlaubnis.D1E]: "D1E",
  [Fahrerlaubnis.D]: "D",
  [Fahrerlaubnis.DE]: "DE",
};

/**
 * Klassen, die eine Klasse mit umfasst — § 6 Abs. 3 FeV plus Vorbesitz
 * (CE gibt es nur mit C und B; die stehen also immer mit auf der Karte).
 * Grundlage des Qualifikationsfilters: wer CE gemeldet hat, ist auch ein
 * Treffer für „Kf B". Jede Klasse enthält sich selbst.
 */
export const FE_EINGESCHLOSSEN: Record<Fahrerlaubnis, readonly Fahrerlaubnis[]> = (() => {
  const F = Fahrerlaubnis;
  const t: Partial<Record<Fahrerlaubnis, readonly Fahrerlaubnis[]>> = {
    [F.NONE]: [],
    [F.AM]: [F.AM],
    [F.A1]: [F.A1, F.AM],
    [F.A2]: [F.A2, F.A1, F.AM],
    [F.A]: [F.A, F.A2, F.A1, F.AM],
    [F.B]: [F.B, F.AM],
  };
  const b = t[F.B]!;
  t[F.BE] = [F.BE, ...b];
  t[F.C1] = [F.C1, ...b];
  t[F.C1E] = [F.C1E, F.C1, F.BE, ...b];
  t[F.C] = [F.C, F.C1, ...b];
  t[F.CE] = [F.CE, F.C, F.C1, F.C1E, F.BE, ...b];
  t[F.D1] = [F.D1, ...b];
  t[F.D1E] = [F.D1E, F.D1, F.BE, ...b];
  t[F.D] = [F.D, F.D1, ...b];
  t[F.DE] = [F.DE, F.D, F.D1, F.D1E, F.BE, ...b];
  return t as Record<Fahrerlaubnis, readonly Fahrerlaubnis[]>;
})();

/** "GrFü / Kf C, SGL" wie auf dem Papierbogen; mehrere Klassen als „Kf B+A". */
export function funktionsText(p: Person, org: OrganisationsTyp): string {
  const tabelle = vokabularFuer(org, "funktion");
  const [grund, ...rest] = p.funktionen.map((f) => vokabText(f, tabelle));
  const klassen = alleFahrerlaubnisse(p);
  const kf = klassen.length > 0 ? `Kf ${klassen.map((k) => FE_TEXT[k]).join("+")}` : "";
  const zusatz = [kf, ...rest].filter(Boolean).join(", ");
  return [grund, zusatz].filter(Boolean).join(" / ");
}

export function kennzeichenText(f: Fahrzeug): string {
  return f.kennzeichen ?? "";
}

/** Erreichbarkeit einer Person wie im Bogenkopf/PDF ("Mobil: … (D)"). */
export function kontaktText(k: Kontakt): string {
  // Alte Bögen konnten statt einer Adresse ein Template tragen (siehe Kontakt).
  if (k.emailTemplate != null) return `eMail: — (${k.dienstlich ? "D" : "P"})`;
  const art = k.art === KontaktArt.EMAIL ? "eMail" : k.art === KontaktArt.MOBIL ? "Mobil" : "Tel";
  return `${art}: ${k.wert ?? ""} (${k.dienstlich ? "D" : "P"})`;
}

export function funkrufText(f: Fahrzeug, standort: string): string {
  if (!f.funkrufname) return "";
  const fr = f.funkrufname;
  const kennwort = vokabText(fr.kennwort, FUNKRUF_KENNWOERTER);
  const ort = fr.eigenerStandort ? standort : (fr.ort ?? "");
  return [kennwort, ort, fr.teile.join("/")].filter(Boolean).join(" ");
}

/**
 * Standort der Einheit = Name der untersten Zugehörigkeits-Ebene
 * ("Oldenburg (NI)"). Speist den Ortsteil des Funkrufnamens.
 */
export function einheitOrt(e: Einheit): string {
  return e.hierarchie[0]?.name.trim() ?? "";
}

/**
 * Anzeigename der Einheit — abgeleitet statt erfasst: Organisation (bzw.
 * Organisationsname), Standort und Einheitstyp, z. B. „THW Oldenburg (NI)
 * FGr K (A)". Ist immer nicht-leer, weil die Organisation stets gesetzt ist.
 */
export function einheitAnzeigename(e: Einheit): string {
  const org = e.organisationName?.trim() || orgLabel(e.organisation);
  const typ = vokabText(e.einheitsTyp, vokabularFuer(e.organisation, "einheitstyp"), "name");
  return [org, einheitOrt(e), typ].filter(Boolean).join(" ");
}

export function datumDeutsch(iso: string): string {
  const [j, m, t] = iso.split("-");
  return `${t}.${m}.${j}`;
}

// Deutsche BOS-Monatskürzel (umlautfrei, daher „mrz" statt „mär").
const ZEITGRUPPE_MONATE = ["jan", "feb", "mrz", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"];

/**
 * NATO-Zeitgruppe (Datum-Zeit-Gruppe) wie bei THWin und im BOS-Schriftverkehr
 * üblich: TThhmm + Monatskürzel + Jahr, z. B. „161039jul26" für 16.07.2026, 10:39.
 * Ohne Zeitzonenbuchstaben — alle Zeiten im Bogen sind lokale Wandzeit.
 */
export function zeitgruppe(z: EebZeitpunkt): string {
  const d = new Date(EEB_EPOCHE_MS + z * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${ZEITGRUPPE_MONATE[d.getUTCMonth()]}${p(d.getUTCFullYear() % 100)}`;
}
