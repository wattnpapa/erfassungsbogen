/**
 * Gemeinsames Setup der Oberflächentests (Projekt „oberflaeche").
 *
 * Räumt nach jedem Test das DOM und den Gerätespeicher auf — die App legt
 * Entwürfe, Vorlagen, Einsätze und die Absenderkarte im localStorage ab; ohne
 * Aufräumen würde ein Test den nächsten vorbelegen.
 */

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { dialogeZuruecksetzen } from "../app/dialoge";

// Älteres jsdom kennt <dialog> nur als Element, nicht seine Methoden. Die App
// öffnet damit den Übergabe-, Namens- und Einsatzwahl-Dialog sowie alle
// Rückfragen (src/app/dialoge.tsx); ohne Ersatz bricht jeder Klick darauf ab.
// Nachgebildet wird nur, was die App nutzt: das `open`-Attribut, der
// Rückgabewert und das `close`-Ereignis.
// Node ab Version 26 legt `localStorage` und `sessionStorage` selbst als Getter
// auf `globalThis` — ohne `--localstorage-file` liefern sie `undefined`. Vitest
// überschreibt vorhandene Getter beim Einhängen der jsdom-Globals nicht, also
// bleibt der Speicher hier leer statt zu fehlen, und jedes `localStorage.clear()`
// wirft. Unter Node 24 (siehe .nvmrc) existiert die Eigenschaft gar nicht und
// jsdom setzt seine eigene ein; dann greift der Ersatz unten nicht.
function speicherErsetzen(name: "localStorage" | "sessionStorage") {
  if ((globalThis as Record<string, unknown>)[name] != null) return;
  const inhalt = new Map<string, string>();
  const ersatz: Storage = {
    get length() {
      return inhalt.size;
    },
    key: (stelle) => [...inhalt.keys()][stelle] ?? null,
    getItem: (schluessel) => inhalt.get(String(schluessel)) ?? null,
    setItem: (schluessel, wert) => {
      inhalt.set(String(schluessel), String(wert));
    },
    removeItem: (schluessel) => {
      inhalt.delete(String(schluessel));
    },
    clear: () => {
      inhalt.clear();
    },
  };
  Object.defineProperty(globalThis, name, { value: ersatz, configurable: true, writable: true });
}

speicherErsetzen("localStorage");
speicherErsetzen("sessionStorage");

const dialog = window.HTMLDialogElement?.prototype as HTMLDialogElement | undefined;
if (dialog && typeof dialog.showModal !== "function") {
  dialog.show = function () {
    this.setAttribute("open", "");
  };
  dialog.showModal = function () {
    this.setAttribute("open", "");
  };
  dialog.close = function (rueckgabe?: string) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    if (rueckgabe != null) this.returnValue = rueckgabe;
    this.dispatchEvent(new Event("close"));
  };
}

afterEach(() => {
  cleanup();
  // Eine unbeantwortete Rückfrage überlebt das Abräumen des DOM — ohne
  // Zurücksetzen zeigt der nächste Test sie statt seiner eigenen.
  dialogeZuruecksetzen();
  localStorage.clear();
  sessionStorage.clear();
});
