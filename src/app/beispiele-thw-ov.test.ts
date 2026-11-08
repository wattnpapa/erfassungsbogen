import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { THW_STAN_PERSONAL } from "@bos/vokabulare/thw-stan-personal";
import { THW_OV_REGIONALSTRUKTUR } from "@bos/vokabulare/thw-ov-regionalstruktur";
import { THW_OV_ORDNER_LABEL } from "./beispiele-thw-ov-ordner";

// Bestand aus scripts/thw-ov-beispielboegen.mts: alle Einheiten aller OVs,
// gegliedert Landesverband › Regionalstelle › Ortsverband, immer StAN-Stärke.
const WURZEL = "examples/thw/ortsverbaende";
const ordner = (pfad: string) => readdirSync(pfad, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

describe("Beispielbögen aller THW-Ortsverbände", () => {
  const ovs = ordner(WURZEL).flatMap((lv) =>
    ordner(join(WURZEL, lv)).flatMap((rst) => ordner(join(WURZEL, lv, rst)).map((ov) => ({ lv, rst, ov }))),
  );

  it("deckt über 600 Ortsverbände ab und jeder Ordner hat einen Anzeigenamen", () => {
    expect(ovs.length).toBeGreaterThan(600);
    for (const { lv, rst, ov } of ovs) {
      expect(THW_OV_ORDNER_LABEL[lv], lv).toBeTruthy();
      expect(THW_OV_ORDNER_LABEL[rst], rst).toBeTruthy();
      expect(THW_OV_ORDNER_LABEL[ov], ov).toMatch(/^OV /);
    }
  });

  it("jeder Bogen: Übung, StAN-Stärke, OV passt zu Regionalstelle und Landesverband, Dateiname mit ov-", () => {
    let anzahl = 0;
    for (const { lv, rst, ov } of ovs) {
      const verzeichnis = join(WURZEL, lv, rst, ov);
      for (const datei of readdirSync(verzeichnis)) {
        expect(datei, datei).toMatch(/^ov-.+\.json$/);
        const b = JSON.parse(readFileSync(join(verzeichnis, datei), "utf8")) as Erfassungsbogen;
        expect(b.uebung).toBe(true);
        const soll = (THW_STAN_PERSONAL[b.einheit.einheitsTyp.code!] ?? []).reduce((s, p) => s + p.anzahl, 0);
        expect(b.personal.length, datei).toBe(soll);
        const [ovEbene, rstEbene, lvEbene] = b.einheit.hierarchie;
        expect(THW_OV_ORDNER_LABEL[ov]).toBe(`OV ${ovEbene!.name}`);
        expect(THW_OV_REGIONALSTRUKTUR[ovEbene!.name]).toEqual({ regionalstelle: rstEbene!.name, landesverband: lvEbene!.name });
        expect(b.personal.every((p) => p.kontakte.every((k) => (k.wert ?? "").startsWith("555")))).toBe(true);
        anzahl++;
      }
    }
    expect(anzahl).toBeGreaterThan(3000);
  });
});
