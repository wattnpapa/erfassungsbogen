/**
 * Anonyme Nutzungsmessung (GoatCounter) — ein Treffer pro Kaltstart, auf allen
 * Plattformen: Browser, installierte PWA, iOS-/Android-App und Desktop.
 *
 * GoatCounter setzt keine Cookies, schreibt nichts in den Storage und bildet
 * keine geräteübergreifende ID. Damit greift § 25 TDDDG nicht und es braucht
 * kein Einwilligungs-Banner; die Verarbeitung stützt sich auf Art. 6 Abs. 1
 * lit. f DSGVO (berechtigtes Interesse an Nutzungszahlen).
 *
 * Bewusst OHNE das offizielle count.js: das müsste von gc.zgo.at nachgeladen
 * werden, was unter file:// (Electron) und capacitor:// (iOS/Android) an
 * Origin-/CSP-Regeln scheitert. Wir bauen den Treffer selbst — dieselbe
 * Zähl-URL, dieselben Parameter (p/t/r), derselbe Versandweg (sendBeacon mit
 * Image-Fallback), nur ohne Fremdcode und ohne Bildschirmgröße.
 *
 * Ohne Internet schlägt der Versand still fehl; die App merkt davon nichts.
 */

import { istNativ, plattform } from "./nativ";

const ENDPUNKT = "https://erfassungsbogen.goatcounter.com/count";

/** Widerspruch nach Art. 21 DSGVO; Schlüssel wie im GoatCounter-Original. */
const SCHLUESSEL = "skipgc";

/** Grobe Geräteklasse aus dem User-Agent — nur diese drei Töpfe, kein Fingerprinting. */
function geraet(): "ios" | "android" | "desktop" {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/** Läuft die Web-App als installierte PWA (eigenes Fenster statt Browser-Tab)? */
function alsPwaInstalliert(): boolean {
  const iosSafari = (navigator as { standalone?: boolean }).standalone === true;
  const anzeige =
    typeof window.matchMedia === "function" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches);
  return iosSafari || anzeige;
}

/**
 * Nutzungskanal als Zählpfad. GoatCounter listet Pfade unter „Paths" auf —
 * damit steht die Aufschlüsselung (App/PWA/Browser je Gerät) direkt im
 * Dashboard, ohne dass es dafür ein kostenpflichtiges Feature bräuchte.
 */
export function nutzungsKanal(): { pfad: string; titel: string } {
  if (istNativ()) {
    const p = plattform() === "ios" ? "ios" : "android";
    return { pfad: `/app/${p}`, titel: `App (${p === "ios" ? "iOS" : "Android"})` };
  }
  // Electron lädt das Bundle im Paket über file:// — dort gibt es keine
  // Capacitor-Brücke, aber es ist trotzdem eine installierte Desktop-App.
  if (window.location.protocol === "file:") {
    return { pfad: "/app/desktop", titel: "App (Desktop)" };
  }
  const g = geraet();
  const kanal = alsPwaInstalliert() ? "pwa" : "browser";
  const label = g === "ios" ? "iOS" : g === "android" ? "Android" : "Desktop";
  return { pfad: `/${kanal}/${g}`, titel: `${kanal === "pwa" ? "PWA" : "Browser"} (${label})` };
}

/** Treffer absetzen — erst sendBeacon, sonst Zählpixel. Fehler sind egal. */
function senden(url: string): void {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon && navigator.sendBeacon(url)) return;
  } catch {
    /* sendBeacon von einer CSP blockiert — unten weiter mit dem Pixel. */
  }
  try {
    const bild = new Image();
    // Kein Fehler-Handler nötig: ein fehlgeschlagenes Bild wirft nichts.
    bild.src = url;
  } catch {
    /* Auch das ging nicht — die Zählung entfällt, die App läuft weiter. */
  }
}

/**
 * Einen Start zählen. No-op bei Widerspruch, in der lokalen Entwicklung und
 * überall dort, wo kein Browser-Umfeld existiert.
 */
export function statistikStarten(): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (statistikAbgewaehlt()) return;

  const { pfad, titel } = nutzungsKanal();
  // Lokale Entwicklung nicht mitzählen (Vite-Dev, Electron-Dev gegen localhost).
  // Der Guard gilt NUR für den Browser: Capacitor serviert die installierte App
  // ebenfalls unter "localhost" — die soll und muss gezählt werden.
  const imBrowser = !istNativ() && window.location.protocol !== "file:";
  if (imBrowser && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) return;
  // Bewusst NUR Pfad, Titel und (im Web) Referrer. Kein location.search und
  // kein Fragment: die App transportiert Bogendaten in der URL (#<Payload>),
  // und davon darf nie etwas in der Statistik landen.
  const referrer = imBrowser ? document.referrer : "";
  const url =
    `${ENDPUNKT}?p=${encodeURIComponent(pfad)}` +
    `&t=${encodeURIComponent(titel)}` +
    `&r=${encodeURIComponent(referrer)}`;
  senden(url);
}

export function statistikAbgewaehlt(): boolean {
  try {
    return localStorage.getItem(SCHLUESSEL) === "t";
  } catch {
    // Storage gesperrt (privater Modus, strikte Browser-Einstellung) — dann
    // gibt es auch keinen gespeicherten Widerspruch.
    return false;
  }
}

/** true = nicht mitzählen. Greift ab dem nächsten Start. */
export function statistikAbwaehlen(aus: boolean): void {
  try {
    if (aus) localStorage.setItem(SCHLUESSEL, "t");
    else localStorage.removeItem(SCHLUESSEL);
  } catch {
    /* Storage nicht verfügbar — Einstellung lässt sich nicht sichern. */
  }
}
