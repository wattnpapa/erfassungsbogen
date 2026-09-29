/**
 * App-seitige Erweiterung der Einsatz-Sammlung um Zeiten und Notizen je Meldung.
 *
 * Der geteilte Kern (`@bos/meldekopf/einsaetze`, Submodul) kennt am Eintrag nur
 * `empfangenAm` — den Zeitpunkt, zu dem das Gerät die Meldung angenommen hat.
 * Die Führungsstelle braucht mehr: Wann ist die Einheit eingetroffen (beim
 * Nachtragen vom Papier NICHT der Moment des Abtippens), wann ist sie
 * abgerückt, und welchen Auftrag hat sie von hier bekommen. Diese Felder
 * werden hier als optionale Zusatzfelder am Eintrag geführt: Die Sammlung wird
 * als JSON gespeichert, der Kern reicht unbekannte Felder unverändert durch
 * (einsaetzeAusJson kopiert die Objekte), und Sammel-PDF sowie
 * Einsatz-Transport tragen sie mit. Kein Schemawechsel im Kern nötig.
 *
 * Fehlt `eingetroffenAm`, gilt `empfangenAm` — so bleiben ältere Sammlungen
 * lesbar (siehe {@link eintreffzeit}).
 */
import {
  MeldeStatus,
  einsaetzeLaden,
  einsaetzePapierkorb,
  einsaetzeSpeichern,
  meldungHinzufuegen,
  type Einsatzsammlung,
  type MeldeEintrag,
  type MeldungAufnahme,
  type MeldungOptionen,
} from "@bos/meldekopf/einsaetze";

declare module "@bos/meldekopf/einsaetze" {
  interface MeldeEintrag {
    /**
     * Wann die Einheit vor Ort eingetroffen ist (Geräteuhr, Date.now()).
     * Vorbelegt mit dem Empfangszeitpunkt, von der Führungsstelle korrigierbar
     * — etwa beim Nachtragen eines Papierstapels. Fehlt = `empfangenAm`.
     */
    eingetroffenAm?: number;
    /** Wann die Einheit abgerückt ist (Date.now()); nur bei Status ABGERUECKT. */
    abgerueckAm?: number;
    /**
     * Auftrag oder Notiz der Führungsstelle zu dieser Einheit („Deichabschnitt
     * Nord ab 14:00"). Bewusst am Eintrag, nicht im Bogen: der Bogen ist die
     * Meldung der Einheit, die Notiz gehört dem Meldekopf.
     */
    notiz?: string;
  }
}

/** Eintreffzeit einer Meldung — korrigierter Wert oder Empfangszeit. */
export function eintreffzeit(e: MeldeEintrag): number {
  return e.eingetroffenAm ?? e.empfangenAm;
}

/** Uhrzeit, bei anderem Tag mit Datum: „09:40" bzw. „26.09., 09:40". */
export function zeitKurz(ms: number, jetzt = Date.now()): string {
  const d = new Date(ms);
  const heute = new Date(jetzt);
  const gleicherTag =
    d.getFullYear() === heute.getFullYear() && d.getMonth() === heute.getMonth() && d.getDate() === heute.getDate();
  const uhr = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return gleicherTag ? uhr : `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}, ${uhr}`;
}

/** Datum und Uhrzeit ausgeschrieben: „27.09.2026, 20:19". */
export function zeitLang(ms: number): string {
  return new Date(ms).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Der Gerätespeicher ist voll (QuotaExceededError o. ä.). Wer schreibt, muss
 * das dem Nutzer sagen — still verloren gehen darf nichts.
 */
export class SpeicherVollFehler extends Error {
  constructor(ursache?: unknown) {
    super(
      "Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll. " +
        "Alte Einsätze in den Papierkorb legen und den Papierkorb leeren, oder vorher eine Sicherung erstellen.",
    );
    this.name = "SpeicherVollFehler";
    (this as { cause?: unknown }).cause = ursache;
  }
}

/** Ist dieser Fehler ein voller Speicher? (Browser nennen ihn unterschiedlich.) */
export function istSpeicherVoll(e: unknown): boolean {
  if (!(e instanceof Error) && typeof e !== "object") return false;
  const name = (e as { name?: string })?.name ?? "";
  const text = (e as { message?: string })?.message ?? "";
  return /quota/i.test(name) || /quota|exceeded/i.test(text) || (e as { code?: number })?.code === 22;
}

/**
 * Alle Sammlungen samt Papierkorb — der Kern exportiert nur die beiden
 * Teillisten, schreibt aber immer die Gesamtliste.
 */
function alleSammlungen(): Einsatzsammlung[] {
  return [...einsaetzeLaden(), ...einsaetzePapierkorb()];
}

/**
 * Gesamtliste schreiben und einen vollen Speicher als {@link SpeicherVollFehler}
 * melden statt ihn als nackte Ausnahme durchzureichen.
 */
export function sammlungenSchreiben(liste: Einsatzsammlung[]): void {
  try {
    einsaetzeSpeichern(liste);
  } catch (e) {
    if (istSpeicherVoll(e)) throw new SpeicherVollFehler(e);
    throw e;
  }
}

/**
 * Prüft, ob die Sammlung nach dem Schreiben wirklich im Speicher steht. Ein
 * `setItem` kann in manchen Browsern still scheitern; darum wird nicht dem
 * Aufruf, sondern dem Speicher geglaubt.
 */
export function eintragGespeichert(einsatzId: string, eintragId: string): boolean {
  return alleSammlungen().some((s) => s.id === einsatzId && s.eintraege.some((e) => e.id === eintragId));
}

function eintragAendern(einsatzId: string, eintragId: string, aendern: (e: MeldeEintrag) => void): void {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  const e = s?.eintraege.find((x) => x.id === eintragId);
  if (!s || !e) return;
  aendern(e);
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
}

/** Eintreffzeit einer Meldung korrigieren (Nachtragen vom Papier). */
export function eintreffzeitSetzen(einsatzId: string, eintragId: string, zeitpunkt: number): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    e.eingetroffenAm = zeitpunkt;
  });
}

/** Abrückzeit einer abgerückten Meldung korrigieren. */
export function abrueckzeitSetzen(einsatzId: string, eintragId: string, zeitpunkt: number): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    e.abgerueckAm = zeitpunkt;
  });
}

/**
 * Status mit Zeitstempel setzen: Abrücken hält den Zeitpunkt fest, „wieder
 * anwesend" nimmt ihn zurück. Ersetzt `meldungStatusSetzen` aus dem Kern
 * überall dort, wo eine Führungskraft den Status von Hand wechselt.
 */
export function statusMitZeitSetzen(
  einsatzId: string,
  eintragId: string,
  status: MeldeStatus,
  zeitpunkt = Date.now(),
): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    e.status = status;
    if (status === MeldeStatus.ABGERUECKT) e.abgerueckAm = zeitpunkt;
    else delete e.abgerueckAm;
    if (status !== MeldeStatus.AUFGEGANGEN) delete e.aufgegangenIn;
  });
}

/** Auftrag/Notiz der Führungsstelle setzen (leer = entfernen). */
export function notizSetzen(einsatzId: string, eintragId: string, notiz: string): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    const t = notiz.trim();
    if (t) e.notiz = t;
    else delete e.notiz;
  });
}

/**
 * Eine Folgemeldung erbt, was die Führungsstelle der Einheit gegeben hat:
 * Eintreffzeit, Auftrag/Notiz, Zug und Teil-Etikett der Vorgängerin derselben
 * Einheit. Sonst stünde jede Folgemeldung als frisch eingetroffen da, und Zug
 * und Auftrag wären mit jeder Fassung weg — still, weil die Karte nur die
 * Stärkeänderung meldet (Audit Runde 2, „Führungssicht", R2-K1). Aufzurufen
 * direkt nach `meldungHinzufuegen`, wenn `neu` war; {@link meldungAufnehmen}
 * erledigt beides.
 */
export function folgemeldungErbt(einsatzId: string, eintragId: string): void {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  const e = s?.eintraege.find((x) => x.id === eintragId);
  if (!s || !e) return;
  const vorgaenger = s.eintraege
    .filter((x) => x.einheitSchluessel === e.einheitSchluessel && x.id !== e.id)
    .sort((a, b) => b.empfangenAm - a.empfangenAm)[0];
  if (!vorgaenger) return;
  let geaendert = false;
  if (e.eingetroffenAm == null) {
    e.eingetroffenAm = eintreffzeit(vorgaenger);
    geaendert = true;
  }
  if (e.notiz == null && vorgaenger.notiz) {
    e.notiz = vorgaenger.notiz;
    geaendert = true;
  }
  if (!e.zugEtikett && vorgaenger.zugEtikett) {
    e.zugEtikett = vorgaenger.zugEtikett;
    geaendert = true;
  }
  if (!e.teilEtikett && vorgaenger.teilEtikett) {
    e.teilEtikett = vorgaenger.teilEtikett;
    geaendert = true;
  }
  if (geaendert) sammlungenSchreiben(liste);
}

/**
 * Ergebnis von {@link meldungAufnehmen}. `erbeFehlt`: die Meldung ist
 * abgelegt, aber Zug, Auftrag und Eintreffzeit der Vorgängerin konnten nicht
 * übernommen werden (Speicher voll) — das muss der Aufrufer sagen.
 */
export type MeldungAufnahmeMitErbe = MeldungAufnahme & { erbeFehlt?: boolean };

/**
 * Bogen als Meldung in eine Sammlung legen — der einzige Weg, den die App
 * dafür nimmt. Scan, Link, Datei, Ordner, Bilderstapel und „In Einsatz
 * aufnehmen" liefen bisher teils am Erbe der Folgemeldung vorbei; dann waren
 * Zug und Auftrag je nach Eingangsweg weg (R2-K1).
 */
export function meldungAufnehmen(
  einsatzId: string,
  bogen: Parameters<typeof meldungHinzufuegen>[1],
  opt: MeldungOptionen = {},
): MeldungAufnahmeMitErbe | null {
  const r = meldungHinzufuegen(einsatzId, bogen, opt);
  if (!r?.neu) return r;
  try {
    folgemeldungErbt(einsatzId, r.eintrag.id);
  } catch {
    return { ...r, erbeFehlt: true };
  }
  return r;
}

/**
 * Wie voll ist der Speicher? Grobe Schätzung über die Länge aller Einträge
 * (UTF-16, zwei Byte je Zeichen) — die Browser nennen ihr Limit nicht, üblich
 * sind rund 5 MB. Rückgabe in Byte; null ohne Speicher.
 */
export function speicherBelegung(): { belegt: number; grenze: number } | null {
  let s: Storage | null;
  try {
    s = globalThis.localStorage ?? null;
  } catch {
    return null;
  }
  if (!s) return null;
  let zeichen = 0;
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k == null) continue;
    zeichen += k.length + (s.getItem(k)?.length ?? 0);
  }
  return { belegt: zeichen * 2, grenze: 5 * 1024 * 1024 };
}

/** „3,8 von 5 MB" */
export function speicherText(b: { belegt: number; grenze: number }): string {
  const mb = (n: number) => (n / (1024 * 1024)).toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return `${mb(b.belegt)} von ${mb(b.grenze)} MB`;
}

/**
 * Eine Einheit samt aller ihrer Fassungen in eine andere Sammlung verschieben
 * (falsche Mappe erwischt — Audit „Fehler und Wiederanlauf", E5). Signatur,
 * Herkunft, Zeiten und Notiz reisen unverändert mit; Fassungen, die im Ziel
 * schon liegen (gleiche Inhalts-ID), werden nicht verdoppelt. Rückgabe: Zahl
 * der verschobenen Fassungen.
 */
export function einheitVerschieben(vonEinsatzId: string, nachEinsatzId: string, einheitSchl: string): number {
  if (vonEinsatzId === nachEinsatzId) return 0;
  const liste = alleSammlungen();
  const von = liste.find((s) => s.id === vonEinsatzId);
  const nach = liste.find((s) => s.id === nachEinsatzId);
  if (!von || !nach) return 0;
  const wandern = von.eintraege.filter((e) => e.einheitSchluessel === einheitSchl);
  if (wandern.length === 0) return 0;
  von.eintraege = von.eintraege.filter((e) => e.einheitSchluessel !== einheitSchl);
  let verschoben = 0;
  for (const e of wandern) {
    if (nach.eintraege.some((x) => x.id === e.id)) continue;
    nach.eintraege.push(e);
    verschoben++;
  }
  const jetzt = Date.now();
  von.geaendert = jetzt;
  nach.geaendert = jetzt;
  sammlungenSchreiben(liste);
  return verschoben;
}

/**
 * Eine Einheit samt ALLER ihrer Fassungen aus einer Sammlung nehmen. Der Kern
 * kennt nur `meldungEntfernen` für einen einzelnen Eintrag; damit fiel bei
 * „Entfernen" nur die neueste Fassung weg, die ältere wurde wieder Kopf und
 * zählte erneut in den Summen — obwohl die Rückfrage „samt Historie" sagt
 * (Audit Runde 2, R2-D1). Gruppiert wird über den exakten Fingerabdruck:
 * abgeteilte Truppteile tragen einen eigenen Schlüssel (`…|teil:n`) und sind
 * eigene Einheiten, sie bleiben stehen. Ein Schreibvorgang für alle Fassungen,
 * damit kein halb entfernter Zustand im Speicher landen kann.
 *
 * Rückgabe: die entfernten Einträge unverändert (Signatur, Herkunft, Zeiten,
 * Notiz, Zug, Etiketten) — für „Rückgängig".
 */
export function einheitEntfernen(einsatzId: string, einheitSchl: string): MeldeEintrag[] {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return [];
  const weg = s.eintraege.filter((e) => e.einheitSchluessel === einheitSchl);
  if (weg.length === 0) return [];
  s.eintraege = s.eintraege.filter((e) => e.einheitSchluessel !== einheitSchl);
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
  return weg;
}
