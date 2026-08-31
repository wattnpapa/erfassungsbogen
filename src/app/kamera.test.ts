/**
 * Kameraliste: Namen aus den sehr unterschiedlichen System-Labels der
 * Plattformen — sie tragen die Auswahl im Scanner.
 */

import { describe, it, expect } from "vitest";
import { kameraListe, kameraName } from "./kamera";

/** enumerateDevices()-Eintrag, so knapp wie die Funktionen ihn brauchen. */
function geraet(kind: MediaDeviceKind, deviceId: string, label: string): MediaDeviceInfo {
  return { kind, deviceId, label, groupId: "", toJSON: () => ({}) } as MediaDeviceInfo;
}

describe("kameraName", () => {
  it("erkennt die Rückkamera in den Labels von Android, Windows und iOS", () => {
    expect(kameraName("camera2 0, facing back", 0)).toBe("Hauptkamera");
    expect(kameraName("Surface Camera Rear", 0)).toBe("Hauptkamera");
    expect(kameraName("Back Camera", 0)).toBe("Hauptkamera");
  });

  it("erkennt die Frontkamera", () => {
    expect(kameraName("camera2 1, facing front", 1)).toBe("Frontkamera");
    expect(kameraName("Surface Camera Front", 1)).toBe("Frontkamera");
    expect(kameraName("User Facing Camera", 1)).toBe("Frontkamera");
  });

  it("benennt die Objektive der Rückseite einzeln", () => {
    // „Hauptkamera 1/2/3" half niemandem: Gesucht wird auf dem iPhone gezielt
    // das Ultraweitwinkel, weil nur es aus wenigen Zentimetern scharf stellt.
    expect(kameraName("Back Ultra Wide Camera", 0)).toBe("Ultraweitwinkel (Nahaufnahme)");
    expect(kameraName("Back Telephoto Camera", 0)).toBe("Teleobjektiv");
    expect(kameraName("Back Dual Wide Camera", 0)).toBe("Hauptkamera");
  });

  it("behält herstellereigene Namen, wenn keine Blickrichtung drinsteht", () => {
    expect(kameraName("Logitech BRIO", 0)).toBe("Logitech BRIO");
  });

  it("nummeriert namenlose Kameras (Labels gibt es erst nach der Freigabe)", () => {
    expect(kameraName("", 0)).toBe("Kamera 1");
    expect(kameraName("   ", 2)).toBe("Kamera 3");
  });
});

describe("kameraListe", () => {
  it("nimmt nur Videoquellen mit Geräte-ID", () => {
    const liste = kameraListe([
      geraet("audioinput", "mic", "Mikrofon"),
      geraet("videoinput", "cam1", "Integrated Webcam"),
      geraet("videoinput", "", "Kamera ohne ID"),
    ]);
    expect(liste).toEqual([{ id: "cam1", name: "Integrated Webcam" }]);
  });

  it("macht gleichnamige Kameras unterscheidbar", () => {
    const liste = kameraListe([
      geraet("videoinput", "a", "camera2 0, facing back"),
      geraet("videoinput", "b", "camera2 2, facing back"),
      geraet("videoinput", "c", "camera2 1, facing front"),
    ]);
    expect(liste.map((k) => k.name)).toEqual(["Hauptkamera 1", "Hauptkamera 2", "Frontkamera"]);
  });
});
