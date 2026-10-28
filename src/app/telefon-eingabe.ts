/**
 * Telefonfelder ehrlich behandeln (R11-E3).
 *
 * Die Felder behalten nur Ziffern. Das ging bisher still: „+49 171 …" verlor das Pluszeichen („49171…" ist aus
 * dem Inland nicht wählbar), „0171 1234567 / 0441 99" wurde zu einer einzigen Ziffernfolge, und zu kurze Nummern
 * fielen nicht auf. Jetzt bleibt ein führendes „+" erhalten, eine zweite Nummer wird nicht in die erste
 * hineingezogen (und genannt), entfernte Zeichen werden angesagt, und eine auffällig kurze Nummer bekommt den
 * „stimmt das?"-Hinweis nach dem Verlassen des Feldes.
 */

export interface TelefonEingabe {
  /** Der Wert, der gespeichert wird: Ziffern, ggf. mit führendem „+". */
  wert: string;
  /** Satz für den Helfer, wenn etwas entfernt oder abgetrennt wurde; sonst leer. */
  hinweis: string;
  /** Die entfernten Stücke dieser Eingabe, wie im Hinweis („abc 12x" → „abc", „x"); fehlt, wenn nichts entfernt wurde (R19-E12). */
  entfernt?: string[];
}

/** Trenner zwischen zwei Nummern: Komma, Semikolon, senkrechter Strich, Schrägstrich, „oder", „und". */
const TRENNER = /\s*(?:[,;|]|\/|\boder\b|\bund\b)\s*/giu;
/** Unter so vielen Ziffern fragt die App nach („0171 12"). */
export const TELEFON_MIN_ZIFFERN = 7;

const ziffern = (s: string): string => s.replace(/\D/gu, "");

/** Der Ziffernteil einer Eingabe samt führendem „+" (nur am Anfang, sonst fiele es mitten in der Nummer an). */
function nurNummer(teil: string): string {
  const plus = teil.trimStart().startsWith("+");
  const z = ziffern(teil);
  return plus ? `+${z}` : z;
}

/** Wo beginnt eine zweite Nummer? Index des Trenners und Ende des Trenners; `undefined`, wenn es nur eine ist. */
function zweiteNummer(roh: string): { von: number; bis: number } | undefined {
  for (const m of roh.matchAll(TRENNER)) {
    const von = m.index ?? 0;
    const bis = von + m[0].length;
    const davor = ziffern(roh.slice(0, von)).length;
    // „0441/99887": der Schrägstrich hinter der Vorwahl trennt keine Nummern.
    const mindestens = m[0].includes("/") ? 7 : 5;
    if (davor >= mindestens && /^[+\d(]/u.test(roh.slice(bis))) return { von, bis };
  }
  return undefined;
}

/** Bereinigt das, was in ein Telefonfeld getippt oder eingefügt wurde. */
export function telefonBereinigen(roh: string): TelefonEingabe {
  const z = zweiteNummer(roh);
  const ersteRoh = z ? roh.slice(0, z.von) : roh;
  const rest = z ? roh.slice(z.bis) : "";
  // „0441 123456 App 12": Ziffern hinter einem Zusatz mit Buchstaben gehören nicht zur Nummer; sie würden sonst an
  // sie anwachsen („044112345612", R16-E3). Der Zusatz wird genannt statt angehängt.
  const zusatz = /^(\+?[^\p{L}\d]*\d[^\p{L}]*?)\s*(\p{L}.*)$/u.exec(ersteRoh.trimStart());
  const zusatzMitZiffern = zusatz != null && /\d/u.test(zusatz[2]!);
  const erste = zusatzMitZiffern ? zusatz[1]! : ersteRoh;
  let wert = nurNummer(erste);
  const saetze: string[] = [];
  // „+49 (0) 171 …": Nach der Landesvorwahl entfällt die Null (R12-E1); sonst ist die Nummer nicht wählbar.
  const ohneNull = wert.replace(/^(\+49|0049)0(?=\d)/u, "$1");
  const nullEntfernt = ohneNull !== wert;
  wert = ohneNull;
  // Entfernt wurde, was weder Ziffer noch übliche Schreibweise noch das führende „+" ist („0441 abc").
  // Die entfernten Stücke stehen unverändert und in der Reihenfolge der Eingabe da („abc 12x" → „abc", „x"), nicht zu
  // „abcx" zusammengezogen (R18-E6).
  const fremdTeile = [...erste.trimStart().replace(/^\+/u, "").matchAll(/[^\d\s\-–/().+]+/gu)].map((m) => m[0]);
  const fremd = fremdTeile.join("");
  if (zusatzMitZiffern) {
    saetze.push(`Übernommen: ${wert} — „${zusatz[2]!.trim()}" gehört nicht zur Nummer und wurde nicht angehängt. Stimmt die Nummer?`);
  } else if (fremd) saetze.push(`Nur Ziffern übernommen („${fremdTeile.join('", „')}" entfernt).`);
  else if (/\+/u.test(erste.trimStart().slice(1))) saetze.push("Das „+“ gilt nur am Anfang; es wurde entfernt.");
  if (nullEntfernt) saetze.push("Die „0“ nach der Landesvorwahl entfernt (nicht mitwählen).");
  if (z && ziffern(rest)) {
    saetze.push(
      `Zweite Nummer „${rest.trim()}" nicht übernommen — eine Nummer je Zeile, weitere über „+ Kontakt“ anlegen.`,
    );
  }
  return { wert, hinweis: saetze.join(" "), ...(fremd && !zusatzMitZiffern ? { entfernt: fremdTeile } : {}) };
}

/** Zustand des zeichenweisen Tippens: `undefined` = normal, sonst der Text, der hinter einem Trenner getippt wurde. */
export type TelefonRest = string | undefined;

export interface TelefonTipp extends TelefonEingabe {
  rest: TelefonRest;
}

/** Ein einzelner Trenner, wie ihn die Bildschirmtastatur als eigenes Zeichen liefert. */
const EIN_TRENNER = /^\s*[,;|/]\s*$/u;
/** Ein einzelner Buchstabe hinter einer vollständigen Nummer: „oder", „und", „(Handy)" — auch das beginnt etwas Neues. */
const EIN_BUCHSTABE = /^\s*\p{L}\s*$/u;

/**
 * Wie `telefonBereinigen`, aber für das zeichenweise Tippen (R12-E1). Die Bildschirmtastatur liefert „/" und die
 * folgenden Ziffern einzeln; das Feld zeigt nur Ziffern, der Trenner wäre also schon weg, wenn die nächste Ziffer
 * kommt, und die zweite Nummer verschmölze mit der ersten. Darum merkt sich der Aufrufer (`rest`), dass hinter
 * einer vollständigen Nummer ein Trenner getippt wurde; alles Weitere landet nicht im Feld, sondern im Hinweis.
 */
export function telefonTippen(vorher: string | undefined, roh: string, rest: TelefonRest): TelefonTipp {
  const alt = vorher ?? "";
  const dazu = roh.startsWith(alt) ? roh.slice(alt.length) : undefined;
  if (rest !== undefined && dazu !== undefined && dazu !== "") {
    const neu = rest + dazu;
    return { wert: alt, hinweis: zweiteNummerSatz(neu), rest: neu };
  }
  if (rest === undefined && dazu !== undefined && (EIN_TRENNER.test(dazu) || EIN_BUCHSTABE.test(dazu))) {
    const mindestens = dazu.includes("/") || EIN_BUCHSTABE.test(dazu) ? 7 : 5;
    if (ziffern(alt).length >= mindestens) {
      const anfang = EIN_BUCHSTABE.test(dazu) ? dazu : "";
      return { wert: alt, hinweis: zweiteNummerSatz(anfang), rest: anfang };
    }
  }
  return { ...telefonBereinigen(roh), rest: undefined };
}

function zweiteNummerSatz(rest: string): string {
  const t = rest.trim();
  if (!t) {
    return "Hinter dem Trenner folgt eine zweite Nummer? Sie wird nicht übernommen — eine Nummer je Zeile, weitere über „+ Kontakt“ anlegen.";
  }
  return ziffern(t)
    ? `Zweite Nummer „${t}" nicht übernommen — eine Nummer je Zeile, weitere über „+ Kontakt“ anlegen.`
    : `Nach der Nummer folgt „${t}" — nicht übernommen. Eine Nummer je Zeile, weitere über „+ Kontakt“ anlegen.`;
}

/** Länger als jede Telefonnummer (E.164: höchstens 15 Ziffern). */
export const TELEFON_MAX_ZIFFERN = 15;

/** Satz für eine auffällig kurze Nummer (nach dem Verlassen des Feldes); leer, wenn sie passt oder leer ist. */
export function telefonKurzHinweis(wert: string | undefined): string {
  const n = ziffern(wert ?? "").length;
  if (n > TELEFON_MAX_ZIFFERN) {
    return `${n} Ziffern — länger als jede Telefonnummer, stimmt die Nummer? Der Meldekopf ruft hier zurück.`;
  }
  if (n === 0 || n >= TELEFON_MIN_ZIFFERN) return "";
  return `Nur ${n} Ziffer${n === 1 ? "" : "n"} — stimmt die Nummer? Der Meldekopf ruft hier zurück.`;
}

/**
 * Nummer für Tabellenprogramme: Eine reine Ziffernfolge wandelt Excel in eine Zahl und streicht die führende
 * Null (R11-E7). Mit „Tel. " davor bleibt sie Text, wie die Kontakte der Personen („Mobil: 0171 …").
 */
export function telefonAlsTabellenText(wert: string | undefined): string {
  const w = wert?.trim() ?? "";
  return /^\+?\d+$/u.test(w) ? `Tel. ${w}` : w;
}
