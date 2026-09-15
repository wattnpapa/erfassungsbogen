import { describe, it, expect } from "vitest";
import { Einheit, OrganisationsTyp } from "@bos/eeb-format/model";
import { funkrufText } from "../app/hilfen";
import {
  fahrzeugVorbelegung,
  fahrzeugeMitFunkrufOv,
  funkrufOrtsverband,
} from "./thw-funkrufname-ort";

function einheit(name: string, kurz?: string, org = OrganisationsTyp.THW): Einheit {
  return {
    organisation: org,
    einheitsTyp: { code: 4 }, // Bergungsgruppe → Teileinheit 22
    hierarchie: [{ bezeichnung: { code: 1 }, name, ...(kurz ? { kurz } : {}) }],
  };
}

const gkw = {
  typ: { freitext: "GKW" },
  funkrufname: { kennwort: { code: 1 }, eigenerStandort: true, teile: [22, 51] },
};

describe("Großstadtregelung der Funkrufnamen", () => {
  it("erkennt den OV am Kürzel und am Namen, auch ohne Bindestrich", () => {
    expect(funkrufOrtsverband(einheit("Berlin Steglitz-Zehlendorf", "OSTZ"))?.kennzahl).toBe(6);
    expect(funkrufOrtsverband(einheit("Hamburg Wandsbek", "OHHW"))?.kennzahl).toBe(5);
    expect(funkrufOrtsverband(einheit("Berlin Steglitz-Zehlendorf"))?.kennzahl).toBe(6);
    expect(funkrufOrtsverband(einheit("berlin mitte"))?.kennzahl).toBe(1);
    expect(funkrufOrtsverband(einheit("Oldenburg - Ni", "OODE"))).toBeUndefined();
    // Der Ortsteil ist eine THW-Regel; eine Feuerwehr in Berlin bleibt unberührt.
    expect(funkrufOrtsverband(einheit("Berlin Mitte", "OBEM", OrganisationsTyp.FEUERWEHR))).toBeUndefined();
  });

  it("spricht auf die Stadt, mit dem OV als führender Kennzahl", () => {
    expect(funkrufText(gkw, einheit("Berlin Steglitz-Zehlendorf", "OSTZ"))).toBe("Heros Berlin 06/22/51");
    expect(funkrufText(gkw, einheit("Berlin Lichtenberg", "OLIC"))).toBe("Heros Berlin 11/22/51");
  });

  it("schreibt die OV-Zahl in Hamburg und Köln einstellig, in Berlin zweistellig", () => {
    // In der Großstadtregelung steht Berlin als 01…12, Hamburg als 1…7,
    // Köln als 4/7/10 — die Schreibweise gehört zur Zahl.
    expect(funkrufText(gkw, einheit("Hamburg-Harburg", "OHHH"))).toBe("Heros Hamburg 7/22/51");
    expect(funkrufText(gkw, einheit("Hamburg Mitte", "OHHM"))).toBe("Heros Hamburg 1/22/51");
    expect(funkrufText(gkw, einheit("Köln Nord-West", "OKNW"))).toBe("Heros Köln 4/22/51");
    expect(funkrufText(gkw, einheit("Köln-Ost", "OKOT"))).toBe("Heros Köln 10/22/51");
  });

  it("lässt München und Bremen beim OV-Namen — die Regelung nennt dort keine Zahl", () => {
    expect(funkrufOrtsverband(einheit("München-Ost", "OMUO"))).toBeUndefined();
    expect(funkrufText(gkw, einheit("Bremen Nord", "OHBN"))).toBe("Heros Bremen Nord 22/51");
  });

  it("lässt Funkrufnamen außerhalb Berlins unverändert", () => {
    expect(funkrufText(gkw, einheit("Oldenburg - Ni", "OODE"))).toBe("Heros Oldenburg - Ni 22/51");
  });

  it("rührt einen fremden Standort und eine schon vollständige Kennzahlenfolge nicht an", () => {
    const berlin = einheit("Berlin Steglitz-Zehlendorf", "OSTZ");
    const fremd = { ...gkw, funkrufname: { kennwort: { code: 1 }, eigenerStandort: false, ort: "Potsdam", teile: [22, 51] } };
    expect(funkrufText(fremd, berlin)).toBe("Heros Potsdam 22/51");
    const ausAnderemOv = { ...gkw, funkrufname: { ...gkw.funkrufname, teile: [11, 22, 51] } };
    expect(funkrufText(ausAnderemOv, berlin)).toBe("Heros Berlin 11/22/51");
  });

  it("belegt die StAN-Fahrzeuge in der Großstadt mit der OV-Kennzahl vor", () => {
    const b = fahrzeugVorbelegung(einheit("Berlin Neukölln", "ONKO"));
    expect(b.find((f) => f.funkrufname)?.funkrufname?.teile[0]).toBe(8);
    const ol = fahrzeugVorbelegung(einheit("Oldenburg - Ni", "OODE"));
    expect(ol.find((f) => f.funkrufname)?.funkrufname?.teile).toEqual([22, 51]);
  });

  it("ergänzt die Kennzahl in schon erfassten Fahrzeugen, gibt sonst dieselbe Liste zurück", () => {
    const berlin = einheit("Berlin Pankow", "OPKW");
    const liste = [gkw, { typ: { freitext: "MTW" } }];
    const ergaenzt = fahrzeugeMitFunkrufOv(liste, berlin);
    expect(ergaenzt[0]?.funkrufname?.teile).toEqual([3, 22, 51]);
    expect(ergaenzt[1]).toBe(liste[1]);
    expect(fahrzeugeMitFunkrufOv(ergaenzt, berlin)).toBe(ergaenzt);
    expect(fahrzeugeMitFunkrufOv(liste, einheit("Oldenburg - Ni", "OODE"))).toBe(liste);
  });
});
