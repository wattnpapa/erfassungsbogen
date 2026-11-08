/**
 * Beispielbögen „alle Einheiten aller Ortsverbände" (examples/thw/ortsverbaende/,
 * erzeugt von scripts/thw-ov-beispielboegen.mts) als eigener Baustein.
 *
 * Rund 3.500 Bögen ergeben eine Adressliste von mehreren hundert KB. Im Glob
 * der Fußzeile läge sie in jedem App-Start; hier lädt sie erst, wenn jemand den
 * Beispielbögen-Dialog öffnet (dynamischer Import in fusszeile.tsx). Die Bögen
 * selbst bleiben einzelne Dateien und kommen erst beim Anklicken.
 */

export const THW_OV_BEISPIELE: Record<string, string> = import.meta.glob<string>(
  "../../examples/thw/ortsverbaende/**/*.json",
  { eager: true, query: "?url", import: "default" },
);

export { THW_OV_ORDNER_LABEL } from "./beispiele-thw-ov-ordner";
