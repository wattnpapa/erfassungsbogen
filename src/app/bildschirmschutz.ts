/**
 * Bildschirmschutz der installierten Fassungen: Bildschirmfotos und
 * Bildschirmaufnahmen der App sperren oder, wo das System keine Sperre
 * kennt, den Inhalt während einer Aufnahme verdecken. Ab Werk an, in der
 * Fußzeile abschaltbar (für Fehlermeldungen mit Bild und Schulungsunterlagen).
 *
 * Was je Plattform wirkt:
 *  - Android: FLAG_SECURE auf dem App-Fenster. Bildschirmfotos und -aufnahmen
 *    zeigen eine schwarze Fläche, die Vorschau in der App-Übersicht ist leer.
 *    Nativ: android/…/Bildschirmschutz.java, ab Start gesetzt.
 *  - iOS: Eine Sperre gibt es nicht. Während einer Bildschirmaufnahme,
 *    Spiegelung oder AirPlay-Übertragung deckt eine Fläche den Inhalt ab,
 *    ebenso die Vorschau im App-Umschalter. Ein Bildschirmfoto lässt sich
 *    nur nachträglich erkennen; die App meldet sich dann mit einem Hinweis.
 *    Nativ: ios/App/App/Bildschirmschutz.swift.
 *  - Desktop-App: setContentProtection auf jedem Fenster (electron/main.js).
 *    Unter Windows bleiben die Fenster in Aufnahmen schwarz bzw. fehlen, unter
 *    macOS nur gegenüber Aufnahmewegen, die die Fensterfreigabe beachten.
 *    Unter Linux wirkt es nicht; dort erscheint die Einstellung nicht.
 *  - Browser und PWA: keine Sperre, keine Erkennung. Dort hilft nur der
 *    Sichtschutz „Namen verbergen“ (namen-verbergen.ts).
 */

import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

const SPEICHER_SCHLUESSEL = "eeb.bildschirmschutz.v1";
export const BILDSCHIRMSCHUTZ_EVENT = "eeb-bildschirmschutz";

/** Eigenes Capacitor-Plugin (Android und iOS), eine Methode, ein Ereignis. */
interface BildschirmschutzPlugin {
  setzen(o: { an: boolean }): Promise<void>;
  addListener(ereignis: "bildschirmfoto", rueckruf: () => void): Promise<PluginListenerHandle>;
}
const NativerSchutz = registerPlugin<BildschirmschutzPlugin>("Bildschirmschutz");

/** Was electron/preload.cjs der Seite reicht (contextBridge, nichts sonst). */
export interface DesktopBruecke {
  plattform: string;
  bildschirmschutz(an: boolean): Promise<void>;
}

function desktop(): DesktopBruecke | null {
  const b = (globalThis as { eebDesktop?: DesktopBruecke }).eebDesktop;
  return b && typeof b.bildschirmschutz === "function" ? b : null;
}

export type SchutzArt = "sperre" | "verdecken" | null;

/**
 * Was der Schutz auf diesem Gerät kann: „sperre“ (Android, Desktop unter
 * Windows und macOS), „verdecken“ (iOS) oder nichts (Browser, Linux).
 */
export function bildschirmschutzArt(): SchutzArt {
  const p = Capacitor.getPlatform();
  if (p === "android") return "sperre";
  if (p === "ios") return "verdecken";
  const d = desktop();
  if (d && (d.plattform === "win32" || d.plattform === "darwin")) return "sperre";
  return null;
}

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Ab Werk an; nur ein ausdrückliches Abschalten wird gespeichert. */
export function bildschirmschutzAn(): boolean {
  try {
    return speicher()?.getItem(SPEICHER_SCHLUESSEL) !== "0";
  } catch {
    return true;
  }
}

async function nativSetzen(an: boolean): Promise<void> {
  const art = bildschirmschutzArt();
  if (art == null) return;
  try {
    const d = desktop();
    if (d) await d.bildschirmschutz(an);
    else await NativerSchutz.setzen({ an });
  } catch {
    // Ältere App-Fassung ohne das Plugin: Der Schalter bleibt wirkungslos,
    // die App läuft weiter.
  }
}

export function bildschirmschutzSetzen(an: boolean): void {
  try {
    if (an) speicher()?.removeItem(SPEICHER_SCHLUESSEL);
    else speicher()?.setItem(SPEICHER_SCHLUESSEL, "0");
  } catch {
    // Speicher gesperrt: gilt bis zum nächsten Start.
  }
  void nativSetzen(an);
  window.dispatchEvent(new CustomEvent<boolean>(BILDSCHIRMSCHUTZ_EVENT, { detail: an }));
}

let gestartet = false;

/**
 * Beim Start die Wahl an die native Seite geben. Die Sperre steht dort schon
 * ab dem ersten Bild (Android, Desktop) — hier wird sie nur abgeschaltet, wenn
 * das so gespeichert ist. `beiBildschirmfoto` läuft auf iOS nach einem
 * Bildschirmfoto, solange der Schutz an ist.
 */
export function bildschirmschutzStarten(beiBildschirmfoto?: () => void): void {
  if (gestartet || bildschirmschutzArt() == null) return;
  gestartet = true;
  void nativSetzen(bildschirmschutzAn());
  if (beiBildschirmfoto && Capacitor.getPlatform() === "ios") {
    void NativerSchutz.addListener("bildschirmfoto", () => {
      if (bildschirmschutzAn()) beiBildschirmfoto();
    }).catch(() => {});
  }
}
