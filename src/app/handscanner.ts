/**
 * USB-Handscanner („Keyboard-Wedge"): Der Scanner meldet sich als Tastatur an
 * und tippt den QR-Inhalt als sehr schnelle Tastenfolge, werkseitig mit Enter
 * (manche mit Tab) abgeschlossen. Dieses Modul erkennt eine solche Folge an
 * ihrem Tempo und meldet sie als einen Scan.
 *
 * Zwei Einsatzorte, ein Lauscher:
 *  - Im Scanner-Overlay (`streng`): Jedes druckbare Zeichen wird verschluckt,
 *    weil dort nichts anderes Tastatur braucht — sonst sprang die Kamera-
 *    Auswahl bei Buchstaben mit.
 *  - Auf der ganzen Seite (ohne `streng`): Beim Probelauf am Meldekopf lösten
 *    Helfer den Scanner aus, ohne vorher „Bogen scannen…" zu drücken — wie an
 *    jeder Kasse. Dann passierte nichts, oder Firefox öffnete auf das „/" der
 *    Adresse seine Schnellsuche. Deshalb lauscht die App überall, wo kein
 *    Textfeld den Fokus hat: Das erste Zeichen geht noch an die Seite (ein
 *    einzelner Buchstabe bedient etwa ein <select>), ab dem zweiten Zeichen im
 *    Scanner-Tempo ist es ein Scan, und die Tasten erreichen die Seite nicht
 *    mehr — das Enter am Ende drückte sonst den Knopf, der gerade den Fokus hat.
 *
 * Abschluss auch ohne Enter: Nicht jeder Scanner hängt ein Enter an (bei
 * manchen ist das Suffix ab Werk leer). Ein Scan, der im Scanner-Tempo kam
 * und lang genug ist, gilt deshalb nach einer kurzen Stille als fertig —
 * vorher blieb der Puffer liegen und verfiel, und der Scan sah aus, als wäre
 * nichts passiert.
 */

/**
 * Lücke, ab der der Puffer verfällt: Menschliches Tippen hat deutlich größere
 * Lücken als ein Scanner — alles über dieser Pause ist kein Scan mehr.
 */
export const HANDSCANNER_PAUSE_MS = 500;
/**
 * Unter dieser Länge ist es kein Bogen-Payload (der kürzeste Link ist weit
 * länger) — versehentliche Tasten plus Enter lösen so keinen Scan aus.
 */
export const HANDSCANNER_MINDESTLAENGE = 8;
/**
 * Zeichenabstand, den nur ein Scanner schafft: Geräte tippen mit 1–20 ms
 * zwischen den Tasten; kein Mensch hält 50 ms über acht Zeichen durch.
 */
export const HANDSCANNER_TEMPO_MS = 50;
/**
 * Stille nach dem letzten Zeichen, nach der ein Scan im Scanner-Tempo auch
 * ohne Enter als abgeschlossen gilt. Kürzer als die Pause oben, damit die
 * Quittung nicht auf sich warten lässt — und länger als jede Lücke, die ein
 * Scanner zwischen zwei Zeichen lässt.
 */
export const HANDSCANNER_ABSCHLUSS_MS = 250;

export interface HandscannerOptionen {
  /** Ein vollständiger Scan. */
  onScan: (text: string) => void;
  /** Zeichen im laufenden Puffer (Lebenszeichen); 0 nach Abschluss. */
  onZeichen?: (anzahl: number) => void;
  /** Escape — das Overlay schließt. Ohne Angabe bleibt Escape unangetastet. */
  onEscape?: () => void;
  /**
   * true: jedes druckbare Zeichen ohne Modifier wird verschluckt, und auch ein
   * kurzer, mit Enter abgeschlossener Puffer (fremder Code, Etikett) wird
   * gemeldet — das Overlay antwortet darauf mit dem Satz für fremde Codes.
   */
  streng?: boolean;
  /**
   * Soll dieser Tastendruck überhaupt als Scan gelten? Die Seite verneint in
   * Textfeldern (dort tippt jemand) und bei offenen Fenstern.
   */
  zustaendig?: (e: KeyboardEvent) => boolean;
}

/**
 * Lauscher auf `ziel` einhängen (Capture-Phase, damit ein fokussierter Knopf
 * das abschließende Enter nicht als Klick schluckt). Gibt die Funktion zum
 * Aushängen zurück.
 */
export function handscannerLauscher(ziel: Window, opt: HandscannerOptionen): () => void {
  let puffer = "";
  let zuletzt = 0;
  // Kamen bisher alle Zeichen im Scanner-Tempo? Nur dann gilt der Puffer
  // auch ohne Enter als Scan, und nur dann schluckt die Seite die Tasten.
  let imTempo = true;
  let abschlussUhr: ReturnType<typeof setTimeout> | undefined;
  // Nach einem Abschluss durch Stille darf ein verspätetes Enter/Tab des
  // Scanners nicht mehr auf die Seite durchschlagen.
  let nachlaufBis = 0;

  function melden(): void {
    clearTimeout(abschlussUhr);
    const text = puffer;
    puffer = "";
    imTempo = true;
    opt.onZeichen?.(0);
    nachlaufBis = performance.now() + HANDSCANNER_PAUSE_MS;
    opt.onScan(text);
  }

  function beiTaste(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // Kurzbefehle unangetastet lassen
    // Escape vor dem Puffer und ohne ihn anzufassen: Ein Handscanner tippt
    // kein Escape, und ein angefangener Puffer verfällt ohnehin nach der Pause.
    if (e.key === "Escape") {
      if (opt.onEscape) {
        e.preventDefault();
        opt.onEscape();
      }
      return;
    }
    if (e.isComposing) return;
    if (opt.zustaendig && !opt.zustaendig(e)) return;
    const jetzt = performance.now();
    const abstand = jetzt - zuletzt;
    if (abstand > HANDSCANNER_PAUSE_MS) {
      puffer = "";
      imTempo = true;
    }
    // Leertaste nur MITTEN in einem Scan (R17-E7): Am Anfang bedient sie fokussierte Knöpfe, und kein
    // Payload-Zeichensatz (URL, Base41, Base64url) enthält Leerzeichen. Ein fremder Code („hallo welt") soll
    // aber so angezeigt werden, wie er kam — nicht als „hallowelt".
    const leerzeichenImScan = e.key === " " && puffer.length > 0 && (opt.streng || (imTempo && abstand <= HANDSCANNER_TEMPO_MS));
    if (e.key.length === 1 && (e.key !== " " || leerzeichenImScan)) {
      clearTimeout(abschlussUhr);
      if (puffer.length > 0 && abstand > HANDSCANNER_TEMPO_MS) imTempo = false;
      puffer += e.key;
      zuletzt = jetzt;
      opt.onZeichen?.(puffer.length);
      if (opt.streng || (puffer.length >= 2 && imTempo)) e.preventDefault();
      if (imTempo && puffer.length >= HANDSCANNER_MINDESTLAENGE) {
        abschlussUhr = setTimeout(melden, HANDSCANNER_ABSCHLUSS_MS);
      }
      return;
    }
    if (e.key !== "Enter" && e.key !== "Tab") return;
    if (puffer.length >= HANDSCANNER_MINDESTLAENGE || (opt.streng && e.key === "Enter" && puffer.length > 0)) {
      // Ein zu kurzer Code (Etikett, EAN-Rest) bleibt im Overlay nicht bei „n Zeichen …" stehen: Jeder
      // abgeschlossene Scan endet dort mit einem Ergebnis, hier mit dem Satz für fremde Codes (R14-E3).
      e.preventDefault();
      melden();
    } else if (jetzt < nachlaufBis) {
      e.preventDefault();
    }
  }

  ziel.addEventListener("keydown", beiTaste, true);
  return () => {
    clearTimeout(abschlussUhr);
    ziel.removeEventListener("keydown", beiTaste, true);
  };
}

/** Eingabetypen, in denen Tasten nichts eintragen — dort darf der Scan gelten. */
const TASTENFREIE_TYPEN = new Set(["button", "checkbox", "radio", "submit", "reset", "file", "image", "range", "color"]);

/**
 * Gehören Tastendrücke diesem Element? In Text-, Zeit-, Datums- und
 * Zahlfeldern, Textbereichen, Auswahllisten und editierbaren Bereichen tippt
 * oder wählt jemand — der seitenweite Lauscher hält sich dort heraus. Nur die
 * Texteingaben auszunehmen reichte nicht: In einem Zeitfeld (`type="time"`)
 * verschluckte er die Ziffern, sobald sie im Scanner-Tempo kamen (Prüfstand).
 */
export function tastaturGehoertElement(el: Element | null | undefined): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") return !TASTENFREIE_TYPEN.has(((el as HTMLInputElement).getAttribute("type") ?? "text").toLowerCase());
  // `isContentEditable` fehlt in jsdom — das Attribut sagt dasselbe.
  const editierbar = el.getAttribute("contenteditable");
  return (el as HTMLElement).isContentEditable === true || editierbar === "" || editierbar === "true" || editierbar === "plaintext-only";
}

/** Welcher Weg im Scanner-Fenster gewählt ist: Kamera (Vorgabe) oder Handscanner. */
export type ScanWeg = "kamera" | "handscanner";

const SPEICHER_SCANWEG = "eeb-scanweg";

/** Der zuletzt gewählte Weg; ohne Eintrag (und ohne Speicher) die Kamera. */
export function gemerkterScanWeg(): ScanWeg {
  try {
    return localStorage.getItem(SPEICHER_SCANWEG) === "handscanner" ? "handscanner" : "kamera";
  } catch {
    return "kamera";
  }
}

/** Den Weg merken — die Kamera ist die Vorgabe und braucht keinen Eintrag. */
export function merkeScanWeg(weg: ScanWeg): void {
  try {
    if (weg === "kamera") localStorage.removeItem(SPEICHER_SCANWEG);
    else localStorage.setItem(SPEICHER_SCANWEG, weg);
  } catch {
    /* ohne Speicher gilt der Weg nur für dieses Fenster */
  }
}
