/**
 * Gemeinsames Setup der Oberflächentests (Projekt „oberflaeche").
 *
 * Räumt nach jedem Test das DOM und den Gerätespeicher auf — die App legt
 * Entwürfe, Vorlagen, Einsätze und die Absenderkarte im localStorage ab; ohne
 * Aufräumen würde ein Test den nächsten vorbelegen.
 */

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom (29) kennt <dialog> nur als Element, nicht seine Methoden. Die App
// öffnet damit den Übergabe-, Namens- und Einsatzwahl-Dialog; ohne Ersatz
// bricht jeder Klick darauf ab. Nachgebildet wird nur, was die App nutzt:
// das `open`-Attribut und das `close`-Ereignis.
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
  localStorage.clear();
  sessionStorage.clear();
});
