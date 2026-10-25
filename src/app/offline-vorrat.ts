/**
 * Fortschritt des Offline-Vorrats und Nachladen der zweiten Stufe.
 *
 * Beim ersten Aufruf stand „⏳ Wird für den Offline-Betrieb geladen" bei
 * schwachem Mobilfunk über eine Minute da, ohne Zahl und ohne Balken (Audit
 * Runde 3, R3-O3). Seitdem ist der Vorrat zweistufig (siehe
 * scripts/precache-aufteilung.ts):
 *
 * 1. **Kern** — lädt der Service Worker. Wie weit er ist, liest die Seite aus
 *    dem Cache-Speicher des Browsers (Cache API) und vergleicht mit dem Umfang
 *    aus `offline-zusatz.json`: „2,1 von 6,7 MB".
 * 2. **Zusatz** — Beispielbögen und Themenseiten. Ist der Service Worker
 *    aktiv, holt die Seite sie nach; der Service Worker legt sie dabei in
 *    seinen Laufzeit-Cache. Was schon da ist, wird übersprungen.
 *
 * Alles hier ist Komfort: schlägt etwas fehl (alter Browser, kein Netz), bleibt
 * es bei der bisherigen Zeile ohne Zahlen.
 */

/** Inhalt von `offline-zusatz.json` (geschrieben von scripts/precache-aufteilung.ts). */
export interface OfflineUmfang {
  kern: { url: string; size: number }[];
  zusatz: { url: string; size: number }[];
}

/** Name der Liste im Build-Verzeichnis (scripts/precache-aufteilung.ts). */
const UMFANG_DATEI = "offline-zusatz.json";

function basis(): string {
  return typeof document !== "undefined" ? document.baseURI : globalThis.location?.href ?? "";
}

function cachesDa(): CacheStorage | null {
  try {
    return typeof caches !== "undefined" ? caches : null;
  } catch {
    return null;
  }
}

/** Liste und Umfang beider Stufen; `null`, wenn nicht erreichbar (Entwicklung, offline vor dem ersten Laden). */
export async function umfangLaden(): Promise<OfflineUmfang | null> {
  try {
    const r = await fetch(new URL(UMFANG_DATEI, basis()), { cache: "no-cache" });
    if (!r.ok) return null;
    const u = (await r.json()) as OfflineUmfang;
    return Array.isArray(u?.kern) && Array.isArray(u?.zusatz) ? u : null;
  } catch {
    return null;
  }
}

/** Pfad einer Cache-Adresse relativ zur App (wie im Manifest), ohne Revisionsparameter. */
export function relativerPfad(adresse: string, basisAdresse = basis()): string {
  const u = new URL(adresse);
  const b = new URL(".", basisAdresse);
  return u.pathname.startsWith(b.pathname) ? decodeURIComponent(u.pathname.slice(b.pathname.length)) : u.pathname;
}

/** Wie viel vom Kern liegt schon im Precache? Bytes nach dem Manifest. */
export async function kernFortschritt(umfang: OfflineUmfang): Promise<{ geladen: number; gesamt: number } | null> {
  const c = cachesDa();
  if (!c) return null;
  const groesse = new Map(umfang.kern.map((e) => [e.url, e.size]));
  const gesamt = umfang.kern.reduce((s, e) => s + e.size, 0);
  const gesehen = new Set<string>();
  try {
    for (const name of await c.keys()) {
      if (!name.startsWith("workbox-precache")) continue;
      const cache = await c.open(name);
      for (const req of await cache.keys()) gesehen.add(relativerPfad(req.url));
    }
  } catch {
    return null;
  }
  let geladen = 0;
  for (const p of gesehen) geladen += groesse.get(p) ?? 0;
  return { geladen: Math.min(geladen, gesamt), gesamt };
}

/** Pause vor dem n-ten erneuten Versuch (n ab 1): 2 s, 4 s, 8 s, 16 s, dann je 20 s (R6-O6: vorher bis 60 s). */
export function nachladePause(versuch: number): number {
  return [2_000, 4_000, 8_000, 16_000][versuch - 1] ?? 20_000;
}

/** So oft wird eine einzelne Datei höchstens versucht, bevor sie aufgegeben wird (etwa ein dauerhaftes 404). */
export const NACHLADE_VERSUCHE_JE_DATEI = 8;

/** Ein Abruf ohne Antwort (Funkloch mit Balken) bricht nach so langer Zeit ab. */
export const NACHLADE_ABRUF_MS = 20_000;

export interface NachladeOptionen {
  /** Pause zwischen den Runden (Test: sofort). */
  schlafen?: (ms: number) => Promise<void>;
  /** Zeitgrenze je Abruf in Millisekunden. */
  abrufMs?: number;
  /**
   * Nach einer Runde mit Fehlschlägen, vor der Pause: die wievielte Wiederholung
   * folgt und in wie vielen Millisekunden. Fortschritt meldet `beiStand`.
   */
  beiHakt?: (lage: { versuch: number; wartetMs: number }) => void;
}

function schlafenStandard(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Abruf mit Zeitgrenze: ein Funkloch, das Verbindungen annimmt und nie antwortet, hält nichts mehr fest. */
async function abrufen(adresse: string, grenzeMs: number): Promise<Response> {
  const regler = typeof AbortController === "function" ? new AbortController() : null;
  const uhr = regler ? setTimeout(() => regler.abort(), grenzeMs) : null;
  try {
    return await fetch(adresse, regler ? { signal: regler.signal } : undefined);
  } finally {
    if (uhr) clearTimeout(uhr);
  }
}

/**
 * Zweite Stufe nachladen. Ruft `beiStand` mit dem Fortschritt auf; endet,
 * wenn alles da ist, `abbruch()` wahr wird oder eine Datei aufgegeben wurde.
 *
 * Wiederholt mit Pause (Audit Runde 5, R5-O2): Vorher beendete der erste
 * Fehlschlag alle vier Arbeiter, und der Zähler stand minutenlang bei „25 von
 * 474", obwohl nichts mehr geladen wurde — ein neuer Versuch kam nur mit einem
 * `online`-Ereignis oder einem Seitenaufruf. Jetzt geht eine Runde über alle
 * offenen Dateien (ein Fehlschlag hält die übrigen nicht auf), danach folgt die
 * Pause 2, 4, 8, 16, 30, dann 60 Sekunden, solange die Seite offen ist. Jeder
 * Abruf hat eine Zeitgrenze. Eine Runde mit Fortschritt setzt die Pause
 * zurück.
 */
export async function zusatzNachladen(
  umfang: OfflineUmfang,
  beiStand: (fertig: number, gesamt: number) => void,
  abbruch: () => boolean = () => false,
  opt: NachladeOptionen = {},
): Promise<{ fertig: number; gesamt: number; aufgegeben: number }> {
  const c = cachesDa();
  const gesamt = umfang.zusatz.length;
  if (!c) return { fertig: 0, gesamt, aufgegeben: 0 };
  const schlafen = opt.schlafen ?? schlafenStandard;
  const grenze = opt.abrufMs ?? NACHLADE_ABRUF_MS;
  let offen: string[] = [];
  let fertig = 0;
  for (const e of umfang.zusatz) {
    const adresse = new URL(e.url, basis()).href;
    if (await c.match(adresse)) fertig++;
    else offen.push(adresse);
  }
  beiStand(fertig, gesamt);
  const versuche = new Map<string, number>();
  let aufgegeben = 0;
  let runde = 0;
  while (offen.length > 0 && !abbruch()) {
    const warteschlange = [...offen];
    const gescheitert: string[] = [];
    const vorher = fertig;
    // Vier gleichzeitig: genug, um die Leitung zu füllen, ohne die laufende
    // Seite auszubremsen.
    const arbeiter = async () => {
      while (warteschlange.length > 0 && !abbruch()) {
        const adresse = warteschlange.shift()!;
        try {
          const r = await abrufen(adresse, grenze);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          await r.arrayBuffer(); // erst vollständig gelesen liegt sie im Cache
          fertig++;
          beiStand(fertig, gesamt);
        } catch {
          const n = (versuche.get(adresse) ?? 0) + 1;
          versuche.set(adresse, n);
          if (n >= NACHLADE_VERSUCHE_JE_DATEI) aufgegeben++;
          else gescheitert.push(adresse);
        }
      }
    };
    await Promise.all([arbeiter(), arbeiter(), arbeiter(), arbeiter()]);
    offen = gescheitert;
    if (offen.length === 0 || abbruch()) break;
    runde = fertig > vorher ? 1 : runde + 1;
    const wartetMs = nachladePause(runde);
    opt.beiHakt?.({ versuch: runde, wartetMs });
    // In kleinen Schritten warten, damit ein Abbruch (Seite geschlossen,
    // Netzwechsel) nicht minutenlang aufgehalten wird.
    for (let gewartet = 0; gewartet < wartetMs && !abbruch(); gewartet += 500) await schlafen(Math.min(500, wartetMs - gewartet));
  }
  return { fertig, gesamt, aufgegeben };
}

/** „2,1" — Megabyte mit einer Nachkommastelle. */
export function mb(bytes: number): string {
  return (bytes / 1_048_576).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
