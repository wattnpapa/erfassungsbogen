/**
 * Anonyme Reichweitenmessung (GoatCounter) — ausschließlich für die im Browser
 * aufgerufene Web-App auf erfassungsbogen.app.
 *
 * GoatCounter setzt keine Cookies, schreibt nichts in den Storage und bildet
 * keine geräteübergreifende ID. Damit greift § 25 TDDDG nicht und es braucht
 * kein Einwilligungs-Banner; die Verarbeitung stützt sich auf Art. 6 Abs. 1
 * lit. f DSGVO (berechtigtes Interesse an Reichweitenzahlen).
 *
 * Bewusst NICHT eingebunden in der nativen App (Capacitor iOS/Android) und im
 * Electron-Build: die laufen vollständig lokal, und ein Feld-Werkzeug soll im
 * Einsatz keine Verbindung nach außen aufbauen — das steht so auch in der
 * Datenschutzerklärung (public/datenschutz.html).
 */

import { istNativ } from "./nativ";

const ENDPUNKT = "https://erfassungsbogen.goatcounter.com/count";
const SKRIPT = "https://gc.zgo.at/count.js";

declare global {
  interface Window {
    goatcounter?: { path?: () => string; allow_local?: boolean };
  }
}

/**
 * Zählpixel laden, wenn wir im echten Web laufen. Fehler werden geschluckt:
 * Statistik darf den App-Start nie blockieren (Adblocker, kein Netz, DNS aus).
 */
export function statistikStarten(): void {
  if (istNativ()) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  // Nur über http(s) — nicht unter file:// (Electron) oder capacitor://.
  if (!/^https?:$/.test(window.location.protocol)) return;
  // Lokale Entwicklung nicht mitzählen.
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) return;
  // Kein zweites Skript, falls diese Funktion doppelt läuft (StrictMode).
  if (document.querySelector("script[data-goatcounter]")) return;

  // Pfad explizit auf location.pathname festnageln: Die App transportiert
  // Bogendaten im URL-Fragment (#<Payload>) und Vorlagen-Links im Query-Teil.
  // GoatCounter würde den Hash zwar ohnehin nicht senden, aber hier ist es
  // festgeschrieben — es darf nie ein Bogeninhalt in der Statistik landen.
  window.goatcounter = { path: () => window.location.pathname };

  if (statistikAbgewaehlt()) return;

  const skript = document.createElement("script");
  skript.async = true;
  skript.src = SKRIPT;
  skript.dataset.goatcounter = ENDPUNKT;
  skript.addEventListener("error", () => {
    /* Zählung fehlgeschlagen — die App interessiert das nicht. */
  });
  document.head.appendChild(skript);
}

/**
 * Widerspruch nach Art. 21 DSGVO. "skipgc" ist der von GoatCounter selbst
 * ausgewertete Schlüssel — count.js zählt damit auch dann nicht, wenn das
 * Skript aus einem Cache heraus doch noch geladen wird.
 */
const SCHLUESSEL = "skipgc";

export function statistikAbgewaehlt(): boolean {
  try {
    return localStorage.getItem(SCHLUESSEL) === "t";
  } catch {
    // Storage gesperrt (privater Modus, strikte Browser-Einstellung) — dann
    // gibt es auch keinen gespeicherten Widerspruch.
    return false;
  }
}

/** true = nicht mitzählen. Greift beim nächsten Start der App. */
export function statistikAbwaehlen(aus: boolean): void {
  try {
    if (aus) localStorage.setItem(SCHLUESSEL, "t");
    else localStorage.removeItem(SCHLUESSEL);
  } catch {
    /* Storage nicht verfügbar — Einstellung lässt sich nicht sichern. */
  }
}
