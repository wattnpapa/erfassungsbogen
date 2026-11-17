/**
 * Übungsbögen „alle Einheiten aller Ortsverbände" (examples/thw/ortsverbaende/,
 * erzeugt von scripts/thw-ov-beispielboegen.mts) als eigener Baustein.
 *
 * Rund 3.500 Bögen ergeben eine Adressliste von mehreren hundert KB. Im Glob
 * der Fußzeile läge sie in jedem App-Start; hier lädt sie erst, wenn jemand den
 * Übungsbögen-Dialog öffnet (dynamischer Import in fusszeile.tsx). Die Bögen
 * selbst bleiben einzelne Dateien und kommen erst beim Anklicken.
 */

export const THW_OV_BEISPIELE: Record<string, string> = import.meta.glob<string>(
  "../../examples/thw/ortsverbaende/**/*.json",
  { eager: true, query: "?url", import: "default" },
);

export { THW_OV_ORDNER_LABEL } from "./beispiele-thw-ov-ordner";

/**
 * Ebenso nachgeladen: Übungsbögen realer Wachen (Ortsfeuerwehren und Standorte
 * der Hilfsorganisationen in Niedersachsen) mit ihren Fahrzeugen nach
 * bos-fahrzeuge.info, erzeugt von scripts/bos-fahrzeuge-nds-beispielboegen.mts.
 * Über tausend Dateien — dieselbe Lage wie bei den Ortsverbänden.
 */
export const BOS_WACHEN_BEISPIELE: Record<string, string> = import.meta.glob<string>(
  ["../../examples/*/niedersachsen/ortsfeuerwehren/**/*.json", "../../examples/*/niedersachsen/standorte/**/*.json"],
  { eager: true, query: "?url", import: "default" },
);

export { BOS_ORDNER_LABEL } from "./beispiele-bos-ordner";
