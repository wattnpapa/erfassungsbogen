/**
 * Parser für die Mehrzeilen-Namenseingabe der Personal-Schnelleingabe:
 * Wer eine fertige Liste hat (Alarm-Nachricht, Tabelle, Notizzettel), fügt
 * sie als Text ein — eine Person je Zeile — statt jede Person einzeln
 * anzulegen. Reine Funktion, damit sie unit-testbar bleibt.
 */

import { KontaktArt, StaerkeRolle, type Kontakt, type Person } from "@bos/eeb-format/model";
import { telefonBereinigen } from "./telefon-eingabe";

/** Kontakt zur Rufnummer einer eingefügten Zeile: Mobilnummern (015x, 016x, 017x) als Mobil, sonst Festnetz; dienstlich (R17-H5). */
export function kontaktAusNummer(roh: string): Kontakt | null {
  const wert = telefonBereinigen(roh).wert;
  if (wert.replace(/\D/g, "").length < 6) return null;
  const mobil = /^(\+49|0049|0)1[567]/.test(wert);
  return { art: mobil ? KontaktArt.MOBIL : KontaktArt.FESTNETZ, dienstlich: true, wert };
}

/** Ein erkannter Name; weitere Personendaten werden anschließend erfasst. */
export interface NamensEintrag {
  vorname: string;
  nachname: string;
  /** Erkanntes Funktionskürzel der Zeile („ZFhr", „GrFü") — roh, ungedeutet. */
  funktion?: string;
  /** Aus der Funktion abgeleitete Stärke-Rolle; fehlt = Mannschaft (Vorgabe). */
  rolle?: StaerkeRolle;
  /**
   * Die Reihenfolge Vor-/Nachname ist geraten: Vor dem ersten Komma standen mehrere Wörter („Lena Nowak,
   * Zugführerin, 0171 99") — vermutlich „Vorname Nachname, Funktion" statt „Nachname, Vorname" (R11-E4).
   * Die Vorschau zeigt „Reihenfolge prüfen".
   */
  unsicher?: boolean;
  /** Rufnummer am Zeilenende oder in einer Tabellenspalte, roh wie eingefügt („0171 1234567"); gehört nicht zum Namen (R17-H5). */
  telefon?: string;
}

/** Wie Zeilen ohne Komma gelesen werden: „Vorname Nachname" (Vorgabe) oder „Nachname Vorname" (R17-E1, R17-N1). */
export type NamenReihenfolge = "vorname" | "nachname";

export interface NamenOptionen {
  /** Lesart der Zeilen ohne Komma; Vorgabe `"vorname"`. */
  reihenfolge?: NamenReihenfolge;
  /**
   * Jede Zeile ohne Komma mit mehreren Wörtern trägt „Reihenfolge prüfen", weil die Lesart noch niemand bestätigt hat.
   * Die Vorschau nimmt die Marke weg, sobald der Helfer die Lesart gewählt hat (R17-E1).
   */
  pruefen?: boolean;
}

/**
 * Namensbestandteile, die zum Nachnamen gehören („von der Heide", „van Berg", „de la Cruz"): Sie standen im
 * Vornamen und ordneten die Person unter dem falschen Buchstaben ein (R11-E4).
 */
const NAMENSPRAEFIX = new Set([
  "von", "vom", "zu", "zum", "zur", "van", "vander", "ver", "de", "der", "den", "des", "di", "da", "dos", "du", "la", "le",
  "ten", "ter", "op", "af", "al", "el", "bin", "ibn",
]);

/** Wörter am Ende der Vornamen, die Präfix des Nachnamens sind, an den Nachnamen hängen. */
function mitPraefix(vornamen: string[], nachname: string): { vorname: string; nachname: string } {
  let ende = vornamen.length;
  let name = nachname;
  while (ende > 1 && NAMENSPRAEFIX.has(vornamen[ende - 1]!.toLowerCase())) {
    name = `${vornamen[ende - 1]} ${name}`;
    ende--;
  }
  return { vorname: vornamen.slice(0, ende).join(" "), nachname: name };
}

/**
 * Funktionskürzel → Stärke-Rolle.
 *
 * Eingefügte Listen tragen die Funktion fast immer mit („Meyer, Jens, ZFhr").
 * Ohne diese Zuordnung landete das Kürzel im Vornamen und jede Person zählte
 * als Mannschaft: Aus einem Zugführer und drei Helfern wurde 0/0/4/4 — die
 * falsche Zahl reist über den Ausdruck bis in die Summe der Führungsstelle.
 *
 * Die Liste bleibt bewusst kurz und wörtlich: Erkannt wird, was in BOS-Listen
 * üblich ist; alles andere bleibt Mannschaft und steht als Funktionstext an der
 * Person, statt geraten zu werden. Verglichen wird kleingeschrieben und ohne
 * Punkte, Schrägstriche und Bindestriche.
 */
const ROLLE_KUERZEL: ReadonlyArray<readonly [RegExp, StaerkeRolle]> = [
  [/^(zfhr|zfu|zfue|zugfuhrer|zugfuehrer|zgfhr|efhr|einsatzleiter|el|ofuehrer|ortsbeauftragter|ob)$/, StaerkeRolle.FUEHRER],
  [/^(grfhr|grfu|grfue|gruppenfuhrer|gruppenfuehrer|trfhr|trfu|truppfuhrer|truppfuehrer|zugtrfhr|ztrfhr)$/, StaerkeRolle.UNTERFUEHRER],
];

/** Vergleichsform: klein, ohne Umlaute, ohne Trenn- und Satzzeichen. */
function kuerzelSchluessel(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z]/g, "");
}

/** Wörter, die in einer Tabellenspalte eher eine Funktion als einen Vornamen meinen (R16-E1). */
const FUNKTIONSWORT = /^(helfer(in)?|mannschaft|helfende|(kraft)?fahrer(in)?|maschinist(in)?|sanitäter(in)?|bediener(in)?|[a-zäöü]*f(ü|ue)hrer(in)?)$/i;

function istFunktionswort(text: string): boolean {
  return rolleAusFunktion(text) != null || FUNKTIONSWORT.test(text.trim());
}

/** Stärke-Rolle zu einem Funktionskürzel — `undefined`, wenn nichts passt. */
export function rolleAusFunktion(funktion: string): StaerkeRolle | undefined {
  const schluessel = kuerzelSchluessel(funktion);
  if (!schluessel) return undefined;
  return ROLLE_KUERZEL.find(([muster]) => muster.test(schluessel))?.[1];
}

/**
 * Text → Namensliste. Je Zeile eine Person, zwei gängige Schreibweisen:
 *  - „Nachname, Vorname"  (Komma trennt)
 *  - „Vorname [weitere Vornamen] Nachname"  (letztes Wort ist der Nachname)
 * Ein einzelnes Wort wird als Nachname übernommen. Leerzeilen entfallen.
 *
 * Ein drittes, kommagetrenntes Feld gilt als Funktion („Meyer, Jens, ZFhr")
 * und wird nicht mehr in den Vornamen gezogen; ist das Kürzel bekannt, bringt
 * es die Stärke-Rolle mit (siehe {@link rolleAusFunktion}).
 */
export function parseNamen(text: string, opt: NamenOptionen = {}): NamensEintrag[] {
  return text
    .split(/\r?\n/)
    .map((zeile) => zeile.trim())
    .filter(Boolean)
    .map((zeile): NamensEintrag => {
      const mitNummer = telefonAbtrennen(zeile);
      let eintrag = ohneTelefon(mitNummer.zeile, opt);
      // Funktion hinter der Nummer (R18-H6): Sie zählt wie eine Funktion am Zeilenende, die Reihenfolge der Namenswörter ist geraten.
      if (mitNummer.funktion && !eintrag.funktion) {
        eintrag = {
          ...eintrag,
          funktion: mitNummer.funktion,
          rolle: eintrag.rolle ?? rolleAusFunktion(mitNummer.funktion),
          ...(eintrag.vorname ? { unsicher: true } : {}),
        };
      }
      const telefon = mitNummer.telefon ?? eintrag.telefon;
      return telefon ? { ...eintrag, telefon } : eintrag;
    });
}

/** Rufnummer am Zeilenende: Ziffern mit üblichen Trennzeichen, mindestens sechs Ziffern, hinter Leerraum oder Trenner. */
const TELEFON_ENDE = /(?:^|[\s,;|]+)(\+?\d[\d\s\-/().]{4,}\d)\s*$/;

/** Hinten stehende Rufnummer abtrennen (R17-H5): „Kevin Meier 0171 1234567" ist „Kevin Meier" mit Nummer, nicht ein Name mit Ziffern. */
export function telefonAbtrennen(zeile: string): { zeile: string; telefon?: string; funktion?: string } {
  if (zeile.includes("\t") || zeile.includes(";")) return { zeile };
  const m = TELEFON_ENDE.exec(zeile);
  if (m) {
    const nummer = m[1]!;
    if (nummer.replace(/\D/g, "").length < 6) return { zeile };
    const rest = zeile.slice(0, m.index).replace(/[\s,;|]+$/, "");
    return /\p{L}/u.test(rest) ? { zeile: rest, telefon: nummer.trim() } : { zeile };
  }
  // „Jürgen Weber +49 171 9876543 ZTrFü": Name, Rufnummer, dann die Funktion (R18-H6). Nur ein Wort, das wie ein Kürzel oder eine
  // Funktion aussieht, zählt als Funktion; „Hans 0171 1234567 Müller" bleibt eine Zeile, die keine Mitte-Nummer kennt.
  const mitte = TELEFON_MITTE.exec(zeile);
  if (!mitte) return { zeile };
  const nummer = mitte[1]!;
  const wort = mitte[2]!;
  if (nummer.replace(/\D/g, "").length < 6) return { zeile };
  if (!(istFunktionswort(wort) || /^\p{Lu}\p{L}*\p{Lu}\p{L}*$/u.test(wort))) return { zeile };
  const rest = zeile.slice(0, mitte.index).replace(/[\s,;|]+$/, "");
  return /\p{L}/u.test(rest) ? { zeile: rest, telefon: nummer.trim(), funktion: wort } : { zeile };
}

/** Rufnummer in der Mitte: hinter ihr steht nur noch ein Wort (die Funktion). */
const TELEFON_MITTE = /(?:^|[\s,;|]+)(\+?\d[\d\s\-/().]{4,}\d)\s+(\p{L}[\p{L}\-./]{0,14})\s*$/u;

/** Eine Zeile ohne hinten stehende Rufnummer lesen (Tabellenzeilen tragen ihre Nummer in einer Spalte). */
function ohneTelefon(zeile: string, opt: NamenOptionen): NamensEintrag {
  // Aus einer Tabelle kopiert: Spalte 1 ist der Name, die nächste Spalte ohne Ziffern die Funktion, weitere
  // Spalten bleiben außen vor. Sonst wurde „Hans Müller⇥GrFü" zu Nachname „GrFü" (R11-H4).
  // Auch Semikolon (deutsches CSV) trennt Spalten (R16-E1). Steht in Spalte 1 nur ein Wort und folgt eine
  // Spalte, die keine Funktion ist, sind es die Spalten „Nachname, Vorname[, Funktion]" („Meier⇥Klaus⇥Führer").
  if (/[\t;]/.test(zeile)) {
    const [name = "", ...spalten] = zeile.split(/[\t;]+/).map((s) => s.trim().replace(/^"(.*)"$/, "$1")).filter(Boolean);
    const zweite = spalten[0];
    const alsVorname =
      zweite != null && !/\s/.test(name) && !name.includes(",") && !/\d/.test(zweite) && !istFunktionswort(zweite);
    const uebrige = alsVorname ? spalten.slice(1) : spalten;
    const funktion = uebrige.find((s) => !/\d/.test(s));
    // Eine Spalte nur aus Ziffern und Trennzeichen mit mindestens sechs Ziffern ist die Rufnummer (R17-H5).
    const telefon = uebrige.find((s) => /^\+?[\d\s\-/().]+$/.test(s) && s.replace(/\D/g, "").length >= 6);
    const eintrag: NamensEintrag = alsVorname ? { nachname: name, vorname: zweite } : zeileLesen(name, opt);
    const mitFunktion = funktion ? { ...eintrag, funktion, rolle: eintrag.rolle ?? rolleAusFunktion(funktion) } : eintrag;
    return telefon ? { ...mitFunktion, telefon } : mitFunktion;
  }
  // Kürzel VOR dem Namen („GrFü Maier, Klaus", „TrFü Anna Schulz") wurde
  // bisher Teil des Nachnamens (Audit Runde 2, R2-N2). Nur bekannte
  // Führungskürzel zählen — ein Doppelname bleibt ein Name.
  const erstes = zeile.split(/\s+/)[0] ?? "";
  const rest = zeile.slice(erstes.length).trim();
  const vorangestellt = rest && !/,$/.test(erstes) ? rolleAusFunktion(erstes) : undefined;
  if (vorangestellt != null) {
    const eintrag = zeileLesen(rest, opt);
    return { ...eintrag, funktion: eintrag.funktion ?? erstes, rolle: eintrag.rolle ?? vorangestellt };
  }
  return zeileLesen(zeile, opt);
}

/** Namensteil ohne Komma lesen: „Vorname [weitere Vornamen] Nachname" oder, auf Wunsch, „Nachname Vorname[n]". */
function nameOhneKomma(teile: string[], opt: NamenOptionen): { vorname: string; nachname: string } {
  if (teile.length === 1) return { vorname: "", nachname: teile[0]! };
  if (opt.reihenfolge === "nachname") {
    // Vorangestellte Präfixe gehören zum Nachnamen: „von der Heide Anna" (R17-E1).
    let ende = 1;
    while (ende < teile.length - 1 && NAMENSPRAEFIX.has(teile[ende - 1]!.toLowerCase())) ende++;
    return { nachname: teile.slice(0, ende).join(" "), vorname: teile.slice(ende).join(" ") };
  }
  return mitPraefix(teile.slice(0, -1), teile[teile.length - 1]!);
}

/** Eine Zeile ohne vorangestelltes Kürzel lesen (siehe {@link parseNamen}). */
function zeileLesen(zeile: string, opt: NamenOptionen = {}): NamensEintrag {
  const komma = zeile.indexOf(",");
  if (komma >= 0) {
    const rest = zeile.slice(komma + 1);
    const zweites = rest.indexOf(",");
    let vorname = (zweites >= 0 ? rest.slice(0, zweites) : rest).trim();
    let funktion = zweites >= 0 ? rest.slice(zweites + 1).trim() : "";
    // „Lisa Meier, Fahrer": Hinter dem Komma steht kein Vorname, sondern eine Funktion; vor dem Komma steht der ganze Name
    // (R17-S7). Die Lesart der Wörter davor folgt der gewählten Reihenfolge und trägt „Reihenfolge prüfen".
    if (!funktion && vorname !== "" && !/\s/.test(vorname) && istFunktionswort(vorname)) {
      const namenTeile = zeile.slice(0, komma).trim().split(/\s+/);
      const gelesen = nameOhneKomma(namenTeile, opt);
      return {
        ...gelesen,
        funktion: vorname,
        rolle: rolleAusFunktion(vorname),
        ...(namenTeile.length > 1 ? { unsicher: true } : {}),
      };
    }
    // „Meier, Klaus - Gruppenführer": Der Zusatz nach Gedankenstrich oder Schrägstrich ist die Funktion (R16-E1).
    const zusatz = /\s+[-–—/]\s+/.exec(vorname);
    if (zusatz && !funktion) {
      funktion = vorname.slice(zusatz.index + zusatz[0].length).trim();
      vorname = vorname.slice(0, zusatz.index).trim();
    }
    const nachname = zeile.slice(0, komma).trim();
    const woerter = nachname.split(/\s+/);
    // „Lena Nowak, Zugführerin": zwei Wörter vor dem Komma, die nicht zu einem Präfixnamen gehören (R11-E4).
    const unsicher = woerter.length > 1 && !woerter.slice(0, -1).every((w) => NAMENSPRAEFIX.has(w.toLowerCase()));
    return {
      nachname,
      vorname,
      ...(funktion ? { funktion, rolle: rolleAusFunktion(funktion) } : {}),
      ...(unsicher ? { unsicher: true } : {}),
    };
  }
  let teile = zeile.split(/\s+/);
  if (teile.length === 1) return { vorname: "", nachname: teile[0]! };
  // „Mustermann Max Truppführer": ein Funktionswort am Ende ist kein Nachname (R16-E1).
  const letztes = teile[teile.length - 1]!;
  // Ein bekanntes Kürzel („GrFü") genügt schon hinter einem einzigen Namenswort: „Meier GrFü" ist nicht Nachname „GrFü".
  const funktion = teile.length >= 3 ? (istFunktionswort(letztes) ? letztes : undefined) : rolleAusFunktion(letztes) != null ? letztes : undefined;
  if (funktion) teile = teile.slice(0, -1);
  const gelesen = nameOhneKomma(teile, opt);
  const mehrere = teile.length > 1;
  // Mit Funktion am Ende bleiben zwei Wörter, deren Reihenfolge geraten ist: Vorschau „prüfen". Ohne Funktion gilt
  // „Vorname [weitere Vornamen] Nachname" bzw. die gewählte Reihenfolge; solange die niemand bestätigt hat (`pruefen`),
  // trägt jede Zeile mit mehreren Wörtern die Marke (R17-E1, R17-N1).
  if (funktion) return { ...gelesen, funktion, rolle: rolleAusFunktion(funktion), ...(mehrere ? { unsicher: true } : {}) };
  return opt.pruefen && mehrere ? { ...gelesen, unsicher: true } : gelesen;
}

/** Warum eine Zeile nicht nach einem Namen aussieht – der tatsächliche Grund für den Hinweistext (R16-E1). */
export function namenVerdachtGruende(zeilen: readonly { vorname: string; nachname: string }[]): string {
  const text = zeilen.map((n) => `${n.vorname} ${n.nachname}`).join(" ");
  const gruende = [
    /\d/.test(text) && "Ziffern",
    /[()[\]{}]/.test(text) && "Klammern",
    /[;<>]/.test(text) && "Sonderzeichen",
    zeilen.some((n) => !/\p{L}/u.test(`${n.vorname}${n.nachname}`)) && "keine Buchstaben",
  ].filter(Boolean);
  return gruende.join(", ") || "Sonderzeichen";
}

/** Ergebnis von {@link namenEinsetzen}: neue Liste und je eingefügter Person der Platz. */
export interface Einsetzung {
  personal: Person[];
  /** Je eingefügter Person: Index des gefüllten Sollplatzes, `null` = hinten angehängt. */
  plaetze: (number | null)[];
}

/**
 * Eingefügte Namen in die leeren Plätze der Liste setzen, statt die Plätze zu
 * ersetzen. Vorher fielen alle unbenannten Sollplätze weg — mit ihnen die
 * Funktionen GrFü und TrFü, und aus 0/2/7/9 wurde 0/0/2/2 (Audit Runde 2,
 * R2-N2). Jetzt:
 *  - Eine Zeile mit Führungsrolle („Maier, Klaus, GrFü") nimmt den ersten
 *    freien Platz derselben Rolle, sonst den ersten freien überhaupt.
 *  - Eine Zeile ohne Funktion nimmt den nächsten freien Platz der Reihe
 *    nach — der erste Name landet also auf dem ersten Sollplatz (GrFü).
 *  - Funktionen und Rolle des Platzes bleiben, es sei denn, die Zeile bringt
 *    eigene mit. Sind alle Plätze belegt, wird hinten angehängt.
 */
export function namenEinsetzen(
  personal: Person[],
  neue: Person[],
  istFrei: (p: Person) => boolean,
): Einsetzung {
  const liste = [...personal];
  const frei = liste.map((p, i) => (istFrei(p) ? i : -1)).filter((i) => i >= 0);
  const plaetze: (number | null)[] = [];
  // Wer eine Funktion mitbringt, sucht sich seinen Platz zuerst: den mit derselben Funktion („GrFü" auf den Sollplatz „GrFü"),
  // sonst den ersten mit derselben Rolle. Sonst nahm eine Zeile ohne Funktion vor ihm den Platz „GrFü", und „Hans Meier GrFü"
  // landete auf „TrFü" (R17-S7). Die übrigen füllen die verbleibenden Plätze in der Reihenfolge der Zeilen.
  const gleicheFunktion = (platz: Person, n: Person) =>
    platz.funktionen.some((f) => n.funktionen.some((g) => (f.code != null && f.code === g.code) || (f.freitext != null && f.freitext.toLowerCase() === g.freitext?.toLowerCase())));
  const vorgemerkt = new Map<number, number>();
  const uebrig = [...frei];
  neue.forEach((n, i) => {
    if (n.funktionen.length === 0) return;
    const platz = uebrig.find((j) => gleicheFunktion(liste[j]!, n)) ?? uebrig.find((j) => liste[j]!.staerkeRolle === n.staerkeRolle);
    if (platz == null) return;
    vorgemerkt.set(i, platz);
    uebrig.splice(uebrig.indexOf(platz), 1);
  });
  for (const [i, n] of neue.entries()) {
    const eigeneFunktion = n.funktionen.length > 0;
    const wahl = vorgemerkt.get(i) ?? uebrig.shift();
    if (wahl == null) {
      liste.push(n);
      plaetze.push(null);
      continue;
    }
    const platz = liste[wahl]!;
    liste[wahl] = {
      ...platz,
      vorname: n.vorname,
      nachname: n.nachname,
      ...(eigeneFunktion ? { funktionen: n.funktionen, staerkeRolle: n.staerkeRolle } : {}),
      ...(n.kontakte.length > 0 ? { kontakte: n.kontakte } : {}),
    };
    plaetze.push(wahl);
  }
  return { personal: liste, plaetze };
}
