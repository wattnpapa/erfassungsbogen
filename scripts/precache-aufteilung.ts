/**
 * Offline-Vorrat in zwei Stufen (Audit Runde 3, R3-O3).
 *
 * Bisher lud der Service Worker beim ersten Aufruf alles (552 Dateien,
 * 10,7 MB) und war erst danach aktiv — bei schwachem Mobilfunk über eine
 * Minute ohne jeden Fortschritt. Die Hälfte davon braucht der Bogen gar nicht:
 * rund 440 Beispielbögen (je eine JSON-Datei) und die Themen-/Länderseiten.
 *
 * - **Kern** (Workbox-Precache, Bedingung für „offline bereit"): App-Shell,
 *   alle JS-Bausteine (PDF, QR-Decoder, Landesvorlagen), Schrift, Bilder,
 *   Blanko-Vordruck und die Seiten, die die App selbst verlinkt (Anleitung,
 *   Vorlage, Datenschutz, Impressum).
 * - **Zusatz** (nach der Aktivierung von der Seite nachgeladen, Laufzeit-
 *   Cache `eeb-zusatz`): Beispielbögen und übrige Begleitseiten. Die Liste
 *   schreibt der Build nach `offline-zusatz.json`; dort steht auch der Umfang
 *   des Kerns, damit die Startseite beim Laden einen Fortschritt zeigen kann.
 */

export interface VorratEintrag {
  url: string;
  revision?: string | null;
  size: number;
}

/** Was die Startseite aus `offline-zusatz.json` liest. */
export interface OfflineUmfang {
  kern: { url: string; size: number }[];
  zusatz: { url: string; size: number }[];
}

export const ZUSATZ_DATEI = "offline-zusatz.json";
export const ZUSATZ_CACHE = "eeb-zusatz";

/** Seiten, die die App selbst verlinkt oder die offline zur Hand sein müssen. */
const KERN_SEITEN = new Set(["index.html", "anleitung.html", "vorlage.html", "datenschutz.html", "impressum.html", "404.html"]);

/** Gehört die Datei (Pfad wie im Precache-Manifest) in die zweite Stufe? */
export function istZusatz(url: string): boolean {
  // Beispielbögen: per Glob als URL eingebunden (examples/**/*.json).
  if (/^assets\/[^/]+\.json$/.test(url)) return true;
  // Themen- und Länderseiten im Wurzelverzeichnis.
  if (/^[^/]+\.html$/.test(url) && !KERN_SEITEN.has(url)) return true;
  return false;
}

export function vorratAufteilen(eintraege: VorratEintrag[]): { kern: VorratEintrag[]; umfang: OfflineUmfang } {
  const kern: VorratEintrag[] = [];
  const zusatz: VorratEintrag[] = [];
  for (const e of eintraege) (istZusatz(e.url) ? zusatz : kern).push(e);
  return {
    kern,
    umfang: {
      kern: kern.map((e) => ({ url: e.url, size: e.size })),
      zusatz: zusatz.map((e) => ({ url: e.url, size: e.size })),
    },
  };
}
