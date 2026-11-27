/**
 * Sichtschutz „Namen verbergen“: Personennamen erscheinen in der Oberfläche
 * als Balken und werden erst auf Antippen (oder per Tastatur) für kurze Zeit
 * aufgedeckt. Gedacht für Bildschirmfotos, Bildschirmfreigaben, Beamer und
 * Blicke über die Schulter: Was nicht auf dem Bildschirm steht, landet auch
 * nicht in der Fotogalerie. Ab Werk aus.
 *
 * Wirkt nur auf die Darstellung. Der Bogen selbst, PDF, Ausdruck, CSV, XLSX,
 * Link und QR-Code bleiben unverändert — wer exportiert, braucht die Namen.
 *
 * Technisch: eine Klasse auf <html> (`namen-verbergen`), das Styling steht in
 * index.html. Die Wahl liegt im Gerätespeicher, gleiches Muster wie der
 * Anzeigemodus (anzeige-modus.ts).
 *
 * Daneben eine Merkliste der Namen, die in dieser Sitzung in einem Bogen
 * standen. Rückfragen, Hinweise und Quittungen setzen Namen in Fließtext
 * („Meyer, Jan entfernen?“); `textMitNamen` findet sie dort wieder. Die Liste
 * lebt nur im Arbeitsspeicher und wächst nur: Auch die Quittung „Entfernt:
 * Meyer, Jan“ nennt einen Namen, der im Bogen schon nicht mehr steht.
 */

const SPEICHER_SCHLUESSEL = "eeb.namen-verbergen.v1";
/** Klasse auf <html>; index.html blendet damit Namen als Balken ein. */
export const NAMEN_VERBERGEN_KLASSE = "namen-verbergen";
/** Eigenes Event, damit alle Schalter und Namensstellen synchron bleiben. */
export const NAMEN_VERBERGEN_EVENT = "eeb-namen-verbergen";
/** So lange bleibt ein aufgedeckter Name sichtbar (ms). */
export const AUFGEDECKT_MS = 15_000;

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function namenVerbergen(): boolean {
  try {
    return speicher()?.getItem(SPEICHER_SCHLUESSEL) === "1";
  } catch {
    return false;
  }
}

function anwenden(an: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(NAMEN_VERBERGEN_KLASSE, an);
}

export function namenVerbergenSetzen(an: boolean): void {
  try {
    if (an) speicher()?.setItem(SPEICHER_SCHLUESSEL, "1");
    else speicher()?.removeItem(SPEICHER_SCHLUESSEL);
  } catch {
    // Speicher voll oder gesperrt: gilt dann nur für diese Sitzung.
  }
  aktuell = an;
  anwenden(an);
  window.dispatchEvent(new CustomEvent<boolean>(NAMEN_VERBERGEN_EVENT, { detail: an }));
}

let aktuell: boolean | null = null;

/** Stand für React (useSyncExternalStore); liest den Speicher nur einmal. */
export function namenVerbergenStand(): boolean {
  if (aktuell == null) aktuell = namenVerbergen();
  return aktuell;
}

export function namenVerbergenAbonnieren(rueckruf: () => void): () => void {
  window.addEventListener(NAMEN_VERBERGEN_EVENT, rueckruf);
  return () => window.removeEventListener(NAMEN_VERBERGEN_EVENT, rueckruf);
}

/** Beim App-Start die gespeicherte Wahl anwenden (vor dem ersten Render). */
export function wendeNamenVerbergenAn(): void {
  aktuell = namenVerbergen();
  anwenden(aktuell);
}

/* ------------------------------------------------------------------ */
/* Namen in Fließtext                                                  */
/* ------------------------------------------------------------------ */

interface NamensTeile {
  vorname: string;
  nachname: string;
}

const gemerkt = new Set<string>();
let muster: RegExp | null = null;

/**
 * Die Schreibweisen, in denen die App eine Person in Texten nennt:
 * „Nachname, Vorname“ (personBezeichnung, stammName), „Vorname Nachname“
 * (Namensliste, Vorlagen) und, wenn nur ein Teil steht, dieser Teil.
 * Einzelne Teile eines vollständigen Namens zählen bewusst nicht: „Koch“
 * oder „Wagner“ stehen sonst auch als Funktion oder Beruf im Text.
 */
export function schreibweisen(p: NamensTeile): string[] {
  const v = p.vorname.trim();
  const n = p.nachname.trim();
  if (v && n) return [`${n}, ${v}`, `${v} ${n}`, `${n} ${v}`];
  const einzeln = v || n;
  return einzeln ? [einzeln] : [];
}

/** Namen für die Suche in Texten vormerken (Bogen, Personalstamm, Vorlage). */
export function namenMerken(personen: readonly NamensTeile[]): void {
  let neu = false;
  for (const p of personen) {
    for (const s of schreibweisen(p)) {
      // Ein einzelner Buchstabe („A.“) träfe jedes zweite Wort.
      if (s.length < 2 || gemerkt.has(s)) continue;
      gemerkt.add(s);
      neu = true;
    }
  }
  if (neu) muster = null;
}

/** Nur für Tests: Merkliste leeren. */
export function gemerkteNamenVergessen(): void {
  gemerkt.clear();
  muster = null;
}

function suchmuster(): RegExp | null {
  if (gemerkt.size === 0) return null;
  if (muster) return muster;
  // Längste zuerst: „Meyer, Jan“ vor „Meyer“, sonst bliebe „, Jan“ stehen.
  const teile = [...gemerkt]
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  muster = new RegExp(`(?<![\\p{L}\\p{N}])(?:${teile.join("|")})(?![\\p{L}\\p{N}])`, "gu");
  return muster;
}

export type TextStueck = { text: string; name: boolean };

/**
 * Zerlegt einen Text in Stücke mit und ohne gemerkten Namen. Ohne Treffer
 * kommt der Text als ein Stück zurück.
 */
export function textMitNamen(text: string): TextStueck[] {
  const m = suchmuster();
  if (!m || !text) return [{ text, name: false }];
  const stuecke: TextStueck[] = [];
  let stelle = 0;
  m.lastIndex = 0;
  for (const treffer of text.matchAll(m)) {
    const i = treffer.index ?? 0;
    if (i > stelle) stuecke.push({ text: text.slice(stelle, i), name: false });
    stuecke.push({ text: treffer[0], name: true });
    stelle = i + treffer[0].length;
  }
  if (stelle < text.length) stuecke.push({ text: text.slice(stelle), name: false });
  return stuecke.length > 0 ? stuecke : [{ text, name: false }];
}
