/**
 * Bildschirmtastatur: Die feste Leiste weicht, solange sie offen ist
 * (Audit Runde 4, R4-G3).
 *
 * Die feste Fußleiste („← Zurück", „◐", „Weiter →", in der Erfassung „In
 * Einsatz übernehmen") liegt über der Vorschlagsliste (z-index 25 gegen 20,
 * R3-S4: der Tipp auf den Knopf sollte nicht den Ortsverband darunter
 * wählen). In der Android-App schrumpft das Fenster über der Tastatur, die
 * Leiste sitzt dann direkt über den Tasten — und über den Vorschlägen: bei
 * 360 × 360 begann sie bei 211 px, die Vorschläge lagen bei 202–445 px, ein
 * Tipp auf den ersten Vorschlag traf „In Einsatz übernehmen".
 *
 * Darum steht auf <html> die Klasse `tastatur-offen`, solange ein Feld mit
 * Texteingabe den Fokus hat UND die sichtbare Höhe deutlich unter der
 * gewohnten liegt; das Stylesheet blendet `footer.nav` dann aus. Beides
 * zusammen, nicht eines allein:
 *  - Nur der Fokus würde die Leiste am Rechner und mit Hardware-Tastatur
 *    verschwinden lassen, wo es keine Tastatur auf dem Bild gibt — und wer im
 *    Feld steht und „Weiter" will, käme nicht mehr hin.
 *  - Nur die Höhe träfe auch Browser-Leisten, Zoom und das Verkleinern eines
 *    Fensters am Rechner.
 *
 * Gemessen wird die kleinere von `window.innerHeight` (Android-App und
 * Browser mit „resizes-content") und `visualViewport.height` (iOS und
 * Chrome-Android mit „resizes-visual"). Maßstab ist die größte Höhe, die
 * dieses Fenster bei dieser Breite je hatte; ein Wechsel der Breite
 * (Drehen) setzt ihn neu. Bei Pinch-Zoom (Skalierung ≠ 1) schrumpft die
 * sichtbare Höhe ohne Tastatur — dann gilt sie nicht als offen.
 */

/** Klasse auf <html>; index.html blendet `footer.nav` damit aus. */
export const TASTATUR_KLASSE = "tastatur-offen";

/** So viel muss die sichtbare Höhe mindestens schrumpfen (px). */
export const MIN_SCHRUMPF_PX = 120;
/** … und mindestens so viel Anteil der gewohnten Höhe. */
export const MIN_SCHRUMPF_ANTEIL = 0.2;

/** Eingabetypen, bei denen eine Bildschirmtastatur erscheint. */
const TEXT_TYPEN = new Set(["text", "search", "tel", "email", "url", "number", "password", ""]);

/** Hat dieses Element eine Texteingabe (und damit auf dem Telefon eine Tastatur)? */
export function istTexteingabe(el: Element | null | undefined): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return !(el as HTMLTextAreaElement).readOnly;
  if (tag === "INPUT") {
    const i = el as HTMLInputElement;
    return !i.readOnly && TEXT_TYPEN.has((i.getAttribute("type") ?? "").toLowerCase());
  }
  return (el as HTMLElement).isContentEditable === true;
}

/**
 * Ist die Tastatur offen? Reine Rechnung, damit sie sich ohne Browser prüfen
 * lässt.
 * @param grundHoehe größte bisher gesehene Höhe bei dieser Fensterbreite
 * @param hoehe      aktuell sichtbare Höhe
 * @param skala      Pinch-Zoom (`visualViewport.scale`), 1 ohne Zoom
 */
export function tastaturOffen(fokusInTexteingabe: boolean, grundHoehe: number, hoehe: number, skala = 1): boolean {
  if (!fokusInTexteingabe) return false;
  if (Math.abs(skala - 1) > 0.05) return false;
  const schrumpf = grundHoehe - hoehe;
  return schrumpf >= Math.max(MIN_SCHRUMPF_PX, grundHoehe * MIN_SCHRUMPF_ANTEIL);
}

/**
 * Das Feld rückt in die obere Hälfte des verbliebenen Bildes, damit die
 * Vorschlagsliste darunter Platz hat: bei 360 px Höhe und dem Feld bei 236 px
 * war nur der erste von drei Vorschlägen im Bild. Nur wenn es tiefer steht;
 * der Rand oben (`scroll-margin-top` in index.html) lässt die Beschriftung
 * stehen.
 */
function feldNachOben(el: Element | null, sichtbareHoehe: number): void {
  const feld = el as HTMLElement | null;
  if (!feld || typeof feld.scrollIntoView !== "function") return;
  if (feld.getBoundingClientRect().bottom <= sichtbareHoehe * 0.5) return;
  try {
    feld.scrollIntoView({ block: "start", behavior: "instant" });
  } catch {
    /* Umgebung ohne Layout */
  }
}

/**
 * Beobachter starten: setzt und entfernt die Klasse auf <html>. Gibt eine
 * Funktion zum Beenden zurück (Tests).
 */
export function tastaturWaechterStarten(
  fenster: Window = window,
  dokument: Document = document,
): () => void {
  const vv = fenster.visualViewport ?? null;
  let breite = fenster.innerWidth;
  let grund = Math.max(fenster.innerHeight, vv?.height ?? 0);
  let offen = false;

  const pruefen = () => {
    const sichtbar = Math.min(fenster.innerHeight, vv?.height ?? fenster.innerHeight);
    if (fenster.innerWidth !== breite) {
      // Gedreht oder in der Größe verändert: der alte Maßstab gilt nicht mehr.
      breite = fenster.innerWidth;
      grund = Math.max(fenster.innerHeight, vv?.height ?? 0);
    } else if (!offen) {
      // Solange die Tastatur zu ist, trägt die Höhe den Maßstab nach oben
      // (Browserleiste eingefahren). Offen darf sie ihn nicht verschieben.
      grund = Math.max(grund, fenster.innerHeight, vv?.height ?? 0);
    }
    const neu = tastaturOffen(istTexteingabe(dokument.activeElement), grund, sichtbar, vv?.scale ?? 1);
    if (neu === offen) return;
    offen = neu;
    dokument.documentElement.classList.toggle(TASTATUR_KLASSE, neu);
    if (neu) feldNachOben(dokument.activeElement, sichtbar);
  };

  // Der Fokus steht beim `focusout` noch auf dem alten Element — erst danach prüfen.
  const spaeter = () => void fenster.setTimeout(pruefen, 0);
  fenster.addEventListener("resize", pruefen);
  vv?.addEventListener("resize", pruefen);
  dokument.addEventListener("focusin", spaeter);
  dokument.addEventListener("focusout", spaeter);
  return () => {
    fenster.removeEventListener("resize", pruefen);
    vv?.removeEventListener("resize", pruefen);
    dokument.removeEventListener("focusin", spaeter);
    dokument.removeEventListener("focusout", spaeter);
    dokument.documentElement.classList.remove(TASTATUR_KLASSE);
  };
}
