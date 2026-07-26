/**
 * Vergleich zweier Fassungen desselben Bogens — „was hat sich seit der letzten
 * Meldung geändert?". Für die Schichtübergabe am Meldekopf ist das die eigentlich
 * interessante Information: die Historie zeigt Stände, der Diff zeigt Bewegung
 * (Stärke 12 → 9, Fahrzeug abgemeldet, Ruhezeit jetzt erforderlich).
 *
 * Reine Logik ohne Persistenz/Anzeige — vergleicht zwei Erfassungsbögen und
 * liefert bereits anzeigefertige Texte (Zahlen wie im Bogen formatiert), damit
 * App-Ansicht und spätere Ausgaben denselben Wortlaut zeigen.
 *
 * Zuordnung beim Positionsvergleich (Heuristik, wie beim Einheiten-Fingerabdruck):
 *  - Personen über „Nachname, Vorname"; Namensgleiche werden der Reihe nach
 *    gepaart, Überzählige gelten als Zu-/Abgang.
 *  - Fahrzeuge über das Kennzeichen (das bleibt beim Fahrzeug), ersatzweise über
 *    Typ + Funkrufname. Ein nachgetragenes Kennzeichen erscheint daher als
 *    Abgang + Zugang statt als Änderung — bewusst, weil nicht entscheidbar.
 */

import {
  PersonalErfassung,
  StaerkeRolle,
  datumZuIso,
  staerke,
  unterbringungMWD,
  zeitpunktZuIso,
  type Erfassungsbogen,
  type Fahrzeug,
  type OrganisationsTyp,
  type Person,
} from "../model";
import {
  datumDeutsch,
  einheitAnzeigename,
  einheitOrt,
  funkrufText,
  funktionsText,
  kontaktText,
  vokabText,
  vokabularFuer,
} from "./hilfen";

/** Ein geändertes Feld mit Vorher/Nachher — beide Seiten bereits als Anzeigetext. */
export interface WertAenderung {
  feld: string;
  vorher: string;
  nachher: string;
}

export interface BogenDiff {
  /** Führer/Unterführer/Mannschaft/Gesamt, nur die tatsächlich geänderten Zeilen. */
  staerke: WertAenderung[];
  personalZugang: string[];
  personalAbgang: string[];
  personalGeaendert: WertAenderung[];
  fahrzeugeZugang: string[];
  fahrzeugeAbgang: string[];
  fahrzeugeGeaendert: WertAenderung[];
  /** Sofortbedarf: Verpflegung, Kraftstoff, Unterbringung, Ruhezeit. */
  bedarf: WertAenderung[];
  /** Auftrag, Zeitraum, Erfassungsart, Sonstiges. */
  sonstiges: WertAenderung[];
  /** Gesamtzahl der Positionen; 0 = inhaltlich unverändert. */
  anzahl: number;
}

/** Feldname der Gesamtstärke — Ankerpunkt für die Kurzfassung. */
export const FELD_GESAMTSTAERKE = "Gesamtstärke";

const ROLLE_TEXT: Record<StaerkeRolle, string> = {
  [StaerkeRolle.FUEHRER]: "Führer",
  [StaerkeRolle.UNTERFUEHRER]: "Unterführer",
  [StaerkeRolle.MANNSCHAFT]: "Mannschaft",
};

function norm(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Sammelt eine Änderung ein, wenn sich die Anzeigetexte unterscheiden. */
function wenGeaendert(ziel: WertAenderung[], feld: string, vorher: string, nachher: string): void {
  if (vorher !== nachher) ziel.push({ feld, vorher, nachher });
}

function jaNein(b: boolean): string {
  return b ? "ja" : "nein";
}

function zeitText(z: number | undefined): string {
  return z != null ? zeitpunktZuIso(z).replace("T", " ") : "—";
}

// ------------------------------------------------------------------- Personal

/** „Müller, Hans" — leerer Name bleibt kenntlich statt zu verschwinden. */
function personName(p: Person): string {
  const name = [p.nachname.trim(), p.vorname.trim()].filter(Boolean).join(", ");
  return name || "Ohne Namen";
}

/** Rolle + Funktion(en) einer Person, wie in der Übersicht („Unterführer · GrFü / Kf C"). */
function personRolleText(p: Person, org: OrganisationsTyp): string {
  return [ROLLE_TEXT[p.staerkeRolle], funktionsText(p, org)].filter(Boolean).join(" · ");
}

function personKontaktText(p: Person): string {
  return p.kontakte.map(kontaktText).join(" · ") || "—";
}

function personZeile(p: Person, org: OrganisationsTyp): string {
  return `${personName(p)} (${personRolleText(p, org)})`;
}

// ------------------------------------------------------------------ Fahrzeuge

function fahrzeugTypText(f: Fahrzeug, org: OrganisationsTyp): string {
  return vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "Fahrzeug";
}

function fahrzeugZeile(f: Fahrzeug, org: OrganisationsTyp): string {
  const kz = f.kennzeichen?.trim();
  return `${fahrzeugTypText(f, org)}${kz ? ` (${kz})` : ""}`;
}

/**
 * Zuordnungsschlüssel eines Fahrzeugs: Kennzeichen bevorzugt (bleibt am
 * Fahrzeug, auch wenn Typ oder Funkrufname korrigiert werden), sonst
 * Typ + Funkrufname.
 */
function fahrzeugSchluessel(f: Fahrzeug, org: OrganisationsTyp, standort: string): string {
  const kz = norm(f.kennzeichen);
  if (kz) return `kz:${kz}`;
  return `typ:${norm(fahrzeugTypText(f, org))}|${norm(funkrufText(f, standort))}`;
}

// ------------------------------------------------------------ Paarung (rein)

function gruppiere<T>(liste: T[], schluessel: (t: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const t of liste) {
    const k = schluessel(t);
    const vorhanden = map.get(k);
    if (vorhanden) vorhanden.push(t);
    else map.set(k, [t]);
  }
  return map;
}

interface Paarung<T> {
  /** Positionen, die es in beiden Fassungen gibt — in der Reihenfolge des Auftretens. */
  paare: { vorher: T; nachher: T }[];
  zugang: T[];
  abgang: T[];
}

/**
 * Paart zwei Listen über einen Schlüssel. Mehrfach vorkommende Schlüssel
 * (Namensgleiche, zwei gleiche Fahrzeugtypen ohne Kennzeichen) werden der Reihe
 * nach gepaart; die überzähligen zählen als Zu- bzw. Abgang.
 */
function paare<T>(vorher: T[], nachher: T[], schluessel: (t: T) => string): Paarung<T> {
  const alt = gruppiere(vorher, schluessel);
  const neu = gruppiere(nachher, schluessel);
  const p: Paarung<T> = { paare: [], zugang: [], abgang: [] };
  for (const [k, neueListe] of neu) {
    const alteListe = alt.get(k) ?? [];
    for (let i = 0; i < neueListe.length; i++) {
      const a = alteListe[i];
      if (a) p.paare.push({ vorher: a, nachher: neueListe[i]! });
      else p.zugang.push(neueListe[i]!);
    }
  }
  for (const [k, alteListe] of alt) {
    const neueListe = neu.get(k) ?? [];
    for (let i = neueListe.length; i < alteListe.length; i++) p.abgang.push(alteListe[i]!);
  }
  return p;
}

// ------------------------------------------------------------------- Diff

/**
 * Änderungen von `vorher` nach `nachher` (ältere → neuere Fassung derselben
 * Einheit). Der Meldestand selbst ist kein Diff-Eintrag — er steht in der
 * Historie darüber.
 */
export function bogenDiff(vorher: Erfassungsbogen, nachher: Erfassungsbogen): BogenDiff {
  const org = nachher.einheit.organisation;
  const d: BogenDiff = {
    staerke: [],
    personalZugang: [],
    personalAbgang: [],
    personalGeaendert: [],
    fahrzeugeZugang: [],
    fahrzeugeAbgang: [],
    fahrzeugeGeaendert: [],
    bedarf: [],
    sonstiges: [],
    anzahl: 0,
  };

  // Stärke — zählt auch dann verlässlich, wenn eine Fassung im Meldekopf-Modus
  // (nur Zahlen) und die andere mit Einzelpersonal erfasst wurde.
  const sv = staerke(vorher);
  const sn = staerke(nachher);
  wenGeaendert(d.staerke, "Führer", `${sv.fuehrer}`, `${sn.fuehrer}`);
  wenGeaendert(d.staerke, "Unterführer", `${sv.unterfuehrer}`, `${sn.unterfuehrer}`);
  wenGeaendert(d.staerke, "Mannschaft", `${sv.mannschaft}`, `${sn.mannschaft}`);
  wenGeaendert(d.staerke, FELD_GESAMTSTAERKE, `${sv.gesamt}`, `${sn.gesamt}`);

  // Personal
  const pp = paare(vorher.personal, nachher.personal, (p) => norm(personName(p)));
  d.personalZugang = pp.zugang.map((p) => personZeile(p, org));
  d.personalAbgang = pp.abgang.map((p) => personZeile(p, org));
  for (const { vorher: a, nachher: b } of pp.paare) {
    const name = personName(b);
    wenGeaendert(d.personalGeaendert, `${name} — Funktion`, personRolleText(a, org), personRolleText(b, org));
    wenGeaendert(d.personalGeaendert, `${name} — Erreichbarkeit`, personKontaktText(a), personKontaktText(b));
  }

  // Fahrzeuge
  const ortAlt = einheitOrt(vorher.einheit);
  const ortNeu = einheitOrt(nachher.einheit);
  const fp = paare(
    vorher.fahrzeuge.map((f) => ({ f, schl: fahrzeugSchluessel(f, org, ortAlt) })),
    nachher.fahrzeuge.map((f) => ({ f, schl: fahrzeugSchluessel(f, org, ortNeu) })),
    (x) => x.schl,
  );
  d.fahrzeugeZugang = fp.zugang.map((x) => fahrzeugZeile(x.f, org));
  d.fahrzeugeAbgang = fp.abgang.map((x) => fahrzeugZeile(x.f, org));
  for (const { vorher: a, nachher: b } of fp.paare) {
    const name = fahrzeugZeile(b.f, org);
    wenGeaendert(d.fahrzeugeGeaendert, `${name} — Typ`, fahrzeugTypText(a.f, org), fahrzeugTypText(b.f, org));
    wenGeaendert(d.fahrzeugeGeaendert, `${name} — Kennzeichen`, a.f.kennzeichen ?? "—", b.f.kennzeichen ?? "—");
    wenGeaendert(
      d.fahrzeugeGeaendert,
      `${name} — Funkrufname`,
      funkrufText(a.f, ortAlt) || "—",
      funkrufText(b.f, ortNeu) || "—",
    );
    wenGeaendert(
      d.fahrzeugeGeaendert,
      `${name} — StAN/Norm`,
      a.f.stanKonform == null ? "—" : jaNein(a.f.stanKonform),
      b.f.stanKonform == null ? "—" : jaNein(b.f.stanKonform),
    );
    wenGeaendert(d.fahrzeugeGeaendert, `${name} — Änderungen`, a.f.aenderungen || "—", b.f.aenderungen || "—");
  }

  // Sofortbedarf
  const bv = vorher.sofortbedarf;
  const bn = nachher.sofortbedarf;
  const zahl = (n: number | undefined, einheit: string) => (n == null ? "—" : `${n} ${einheit}`);
  wenGeaendert(d.bedarf, "Verpflegung", zahl(bv?.verpflegungPersonen, "Personen"), zahl(bn?.verpflegungPersonen, "Personen"));
  wenGeaendert(d.bedarf, "Diesel", zahl(bv?.dieselLiter, "l"), zahl(bn?.dieselLiter, "l"));
  wenGeaendert(d.bedarf, "Benzin", zahl(bv?.benzinLiter, "l"), zahl(bn?.benzinLiter, "l"));
  wenGeaendert(d.bedarf, "Gemisch", zahl(bv?.gemischLiter, "l"), zahl(bn?.gemischLiter, "l"));
  wenGeaendert(
    d.bedarf,
    "Unterbringung angefordert",
    bv ? jaNein(bv.unterbringung) : "—",
    bn ? jaNein(bn.unterbringung) : "—",
  );
  wenGeaendert(
    d.bedarf,
    "Ruhezeit erforderlich",
    bv ? jaNein(bv.ruhezeitErforderlich) : "—",
    bn ? jaNein(bn.ruhezeitErforderlich) : "—",
  );
  const uv = unterbringungMWD(vorher);
  const un = unterbringungMWD(nachher);
  wenGeaendert(d.bedarf, "Unterbringung M/W/D", `M ${uv.m} / W ${uv.w} / D ${uv.d}`, `M ${un.m} / W ${un.w} / D ${un.d}`);

  // Auftrag & Sonstiges
  wenGeaendert(d.sonstiges, "Einheit", einheitAnzeigename(vorher.einheit), einheitAnzeigename(nachher.einheit));
  wenGeaendert(d.sonstiges, "Ort / Auftrag", vorher.einsatz.ortAuftrag || "—", nachher.einsatz.ortAuftrag || "—");
  wenGeaendert(
    d.sonstiges,
    "Zeitraum",
    `${datumDeutsch(datumZuIso(vorher.einsatz.zeitraumVon))} – ${datumDeutsch(datumZuIso(vorher.einsatz.zeitraumBis))}`,
    `${datumDeutsch(datumZuIso(nachher.einsatz.zeitraumVon))} – ${datumDeutsch(datumZuIso(nachher.einsatz.zeitraumBis))}`,
  );
  wenGeaendert(d.sonstiges, "Einsatzbeginn", zeitText(vorher.einsatz.einsatzbeginn), zeitText(nachher.einsatz.einsatzbeginn));
  wenGeaendert(d.sonstiges, "Einsatzende", zeitText(vorher.einsatz.einsatzende), zeitText(nachher.einsatz.einsatzende));
  wenGeaendert(
    d.sonstiges,
    "Erfassung",
    vorher.personalErfassung === PersonalErfassung.NUR_STAERKE ? "nur Stärke" : "vollständig",
    nachher.personalErfassung === PersonalErfassung.NUR_STAERKE ? "nur Stärke" : "vollständig",
  );
  wenGeaendert(d.sonstiges, "Sonstiges", vorher.sonstiges || "—", nachher.sonstiges || "—");

  d.anzahl =
    d.staerke.length +
    d.personalZugang.length +
    d.personalAbgang.length +
    d.personalGeaendert.length +
    d.fahrzeugeZugang.length +
    d.fahrzeugeAbgang.length +
    d.fahrzeugeGeaendert.length +
    d.bedarf.length +
    d.sonstiges.length;
  return d;
}

/**
 * Alle Änderungen als flache Textzeilen — für Ausgaben ohne eigenes Layout
 * (PDF-Spalte, CSV). Reihenfolge wie in der App: Stärke, Personal, Fahrzeuge,
 * Bedarf, Sonstiges. `max` deckelt die Liste; die letzte Zeile weist dann auf
 * die Restmenge hin, damit eine Tabellenzelle nicht überläuft.
 */
export function diffZeilen(d: BogenDiff, max = Infinity): string[] {
  const wert = (a: WertAenderung) => `${a.feld}: ${a.vorher} → ${a.nachher}`;
  const zeilen = [
    ...d.staerke.map(wert),
    ...d.personalZugang.map((z) => `Personal neu: ${z}`),
    ...d.personalAbgang.map((z) => `Personal abgemeldet: ${z}`),
    ...d.personalGeaendert.map(wert),
    ...d.fahrzeugeZugang.map((z) => `Fahrzeug neu: ${z}`),
    ...d.fahrzeugeAbgang.map((z) => `Fahrzeug abgemeldet: ${z}`),
    ...d.fahrzeugeGeaendert.map(wert),
    ...d.bedarf.map(wert),
    ...d.sonstiges.map(wert),
  ];
  if (zeilen.length <= max) return zeilen;
  return [...zeilen.slice(0, max - 1), `… und ${plural(zeilen.length - (max - 1), "weitere Änderung", "weitere Änderungen")}`];
}

function plural(n: number, eins: string, mehrere: string): string {
  return `${n} ${n === 1 ? eins : mehrere}`;
}

/**
 * Einzeiler für die Einheitenliste — das, was in der Übergabe zuerst zählt:
 * Stärkeveränderung und Fahrzeug-Zu-/Abgänge, sonst die reine Anzahl.
 * Leerer String, wenn sich nichts geändert hat.
 */
export function diffKurzfassung(d: BogenDiff): string {
  if (d.anzahl === 0) return "";
  const teile: string[] = [];
  const gesamt = d.staerke.find((a) => a.feld === FELD_GESAMTSTAERKE);
  if (gesamt) teile.push(`Stärke ${gesamt.vorher} → ${gesamt.nachher}`);
  if (d.fahrzeugeZugang.length > 0) teile.push(`${plural(d.fahrzeugeZugang.length, "Fahrzeug", "Fahrzeuge")} dazu`);
  if (d.fahrzeugeAbgang.length > 0) teile.push(`${plural(d.fahrzeugeAbgang.length, "Fahrzeug", "Fahrzeuge")} abgemeldet`);
  if (teile.length === 0) teile.push(plural(d.anzahl, "Änderung", "Änderungen"));
  return teile.join(" · ");
}
