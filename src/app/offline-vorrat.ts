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

/**
 * Zweite Stufe nachladen. Ruft `beiStand` mit dem Fortschritt auf; endet,
 * wenn alles da ist, `abbruch()` wahr wird oder das Netz fehlt.
 */
export async function zusatzNachladen(
  umfang: OfflineUmfang,
  beiStand: (fertig: number, gesamt: number) => void,
  abbruch: () => boolean = () => false,
): Promise<{ fertig: number; gesamt: number }> {
  const c = cachesDa();
  const gesamt = umfang.zusatz.length;
  if (!c) return { fertig: 0, gesamt };
  const offen: string[] = [];
  let fertig = 0;
  for (const e of umfang.zusatz) {
    const adresse = new URL(e.url, basis()).href;
    if (await c.match(adresse)) fertig++;
    else offen.push(adresse);
  }
  beiStand(fertig, gesamt);
  let netzWeg = false;
  // Vier gleichzeitig: genug, um die Leitung zu füllen, ohne die laufende
  // Seite auszubremsen.
  const arbeiter = async () => {
    while (offen.length > 0 && !netzWeg && !abbruch()) {
      const adresse = offen.shift()!;
      try {
        const r = await fetch(adresse);
        if (r.ok) {
          await r.arrayBuffer(); // erst vollständig gelesen liegt sie im Cache
          fertig++;
          beiStand(fertig, gesamt);
        }
      } catch {
        netzWeg = true;
      }
    }
  };
  await Promise.all([arbeiter(), arbeiter(), arbeiter(), arbeiter()]);
  return { fertig, gesamt };
}

/** „2,1" — Megabyte mit einer Nachkommastelle. */
export function mb(bytes: number): string {
  return (bytes / 1_048_576).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
