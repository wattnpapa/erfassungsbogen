/**
 * Debug-Modus: iOS-/Android-Anmutung im Browser vorschauen.
 *
 * Die App stylt sich plattformabhängig über die Klasse `platform-<x>` auf
 * <html> (siehe main.tsx). Im Browser ist das immer `platform-web`, sodass
 * das iOS-/Android-CSS aus index.html nie zu sehen ist. Dieses Modul erlaubt
 * es, die *visuelle* Plattform zu überschreiben – rein fürs Aussehen.
 *
 * Wichtig: Es wird NUR die CSS-Klasse getauscht. Die native
 * Fähigkeitserkennung (istNativ/plattform aus nativ.ts) bleibt unberührt,
 * damit QR-Scan, Teilen usw. weiter den echten Web-Pfad nutzen.
 *
 * Sichtbar nur im Browser und nur, wenn der Debug-Modus aktiv ist:
 * per `?debug` in der URL (wird dauerhaft gemerkt) oder im Vite-Dev-Server.
 */

import { useState } from "react";
import { istNativ, plattform } from "./nativ";

export type VisuellePlattform = "web" | "ios" | "android";

const SPEICHER_PLATTFORM = "eeb-debug-plattform";
const SPEICHER_DEBUG = "eeb-debug";
const SPEICHER_RAHMEN = "eeb-debug-rahmen";

/** localStorage kann in manchen Kontexten werfen (privater Modus). */
function lese(schluessel: string): string | null {
  try {
    return localStorage.getItem(schluessel);
  } catch {
    return null;
  }
}
function schreibe(schluessel: string, wert: string): void {
  try {
    localStorage.setItem(schluessel, wert);
  } catch {
    /* Speichern ist optional. */
  }
}

function istPlattform(wert: string | null): wert is VisuellePlattform {
  return wert === "web" || wert === "ios" || wert === "android";
}

/** Gemerkte Debug-Plattform oder null (dann gilt die echte Plattform). */
function gespeichertePlattform(): VisuellePlattform | null {
  const wert = lese(SPEICHER_PLATTFORM);
  return istPlattform(wert) ? wert : null;
}

/**
 * Ob die Debug-Leiste angezeigt wird: nur im Browser und nur bei aktivem
 * Debug-Modus. `?debug` in der URL schaltet ihn dauerhaft ein.
 */
export function debugAktiv(): boolean {
  if (istNativ()) return false;
  try {
    if (new URL(location.href).searchParams.has("debug")) {
      schreibe(SPEICHER_DEBUG, "1");
      return true;
    }
  } catch {
    /* URL-Parsing scheitert nie im Browser, aber sicher ist sicher. */
  }
  if (lese(SPEICHER_DEBUG) === "1") return true;
  return import.meta.env.DEV;
}

/**
 * Effektive visuelle Plattform: nativ immer die echte, im Browser die
 * gemerkte Debug-Plattform (Vorgabe „web").
 */
export function visuellePlattform(): VisuellePlattform {
  if (istNativ()) {
    const echt = plattform();
    return istPlattform(echt) ? echt : "web";
  }
  return gespeichertePlattform() ?? "web";
}

/** `platform-<x>` auf <html> setzen und alte Plattform-Klassen entfernen. */
export function wendePlattformKlasseAn(p: VisuellePlattform = visuellePlattform()): void {
  const wurzel = document.documentElement;
  wurzel.classList.remove("platform-web", "platform-ios", "platform-android");
  wurzel.classList.add(`platform-${p}`);
}

/** Handy-Rahmen beim Start aus dem Speicher wiederherstellen. */
export function wendeRahmenAn(): void {
  document.documentElement.classList.toggle("debug-rahmen", lese(SPEICHER_RAHMEN) === "1");
}

/**
 * Schwebende Umschaltleiste für den Debug-Modus. Wechselt die visuelle
 * Plattform live (ohne Neuladen) und merkt sie sich. „Rahmen" zeigt die
 * Ansicht zusätzlich in Handy-Breite mit Geräte-Rahmen.
 */
export function DebugLeiste() {
  const [aktuelle, setAktuelle] = useState<VisuellePlattform>(visuellePlattform());
  const [rahmen, setRahmen] = useState<boolean>(() => lese(SPEICHER_RAHMEN) === "1");

  function waehle(p: VisuellePlattform) {
    schreibe(SPEICHER_PLATTFORM, p);
    wendePlattformKlasseAn(p);
    setAktuelle(p);
  }

  function schalteRahmen(an: boolean) {
    schreibe(SPEICHER_RAHMEN, an ? "1" : "0");
    document.documentElement.classList.toggle("debug-rahmen", an);
    setRahmen(an);
  }

  const optionen: { wert: VisuellePlattform; text: string }[] = [
    { wert: "web", text: "Web" },
    { wert: "ios", text: "iOS" },
    { wert: "android", text: "Android" },
  ];

  return (
    <div className="eeb-debug" role="group" aria-label="Debug: Plattform-Vorschau">
      <span className="eeb-debug-titel">Vorschau</span>
      {optionen.map(({ wert, text }) => (
        <button
          key={wert}
          type="button"
          className={`eeb-seg${aktuelle === wert ? " aktiv" : ""}`}
          aria-pressed={aktuelle === wert}
          onClick={() => waehle(wert)}
        >
          {text}
        </button>
      ))}
      <label className="eeb-debug-rahmen">
        <input type="checkbox" checked={rahmen} onChange={(e) => schalteRahmen(e.target.checked)} />
        Rahmen
      </label>
    </div>
  );
}
