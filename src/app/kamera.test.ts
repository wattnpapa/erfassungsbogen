/**
 * Kameraliste: Namen aus den sehr unterschiedlichen System-Labels der
 * Plattformen — sie tragen die Auswahl im Scanner.
 */

import { describe, it, expect } from "vitest";
import { kameraListe, kameraName, suchAusschnitt } from "./kamera";

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

/**
 * Dekodier-Ausschnitt: der Suchrahmen in Kamerapixeln. Die Zahlen sind ein
 * iPhone im Hochformat (Kamera 1080×1920, Bildschirm 390×844, Rahmen
 * 65 vw = 253 px mittig) — der Fall aus der Feldmeldung „Handy scannt
 * Handydisplay nicht“.
 */
describe("suchAusschnitt", () => {
  const video = { breite: 1080, hoehe: 1920 };
  const anzeige = { x: 0, y: 0, width: 390, height: 844 };
  const rahmen = { x: 68.5, y: 295.5, width: 253, height: 253 };

  it("rechnet den Rahmen bei object-fit: cover in Kamerapixel um", () => {
    const a = suchAusschnitt(video, anzeige, rahmen, 1);
    // Maßstab: die Höhe füllt den Kasten (844/1920 = 0,4396) → 253 px ≈ 575 Kamerapixel.
    expect(a.breite).toBeGreaterThanOrEqual(575);
    expect(a.breite).toBeLessThanOrEqual(577);
    expect(a.hoehe).toBe(a.breite);
    // mittig im Bild
    expect(a.x + a.breite / 2).toBeCloseTo(540, -1);
    expect(a.y + a.hoehe / 2).toBeCloseTo(960, -1);
  });

  it("weitet den Ausschnitt um die Zugabe und bleibt im Bild", () => {
    const a = suchAusschnitt(video, anzeige, rahmen, 1.3);
    expect(a.breite).toBeGreaterThan(740);
    expect(a.x).toBeGreaterThanOrEqual(0);
    expect(a.x + a.breite).toBeLessThanOrEqual(1080);
    // Bei absurder Zugabe: am Bildrand gekappt, nie darüber hinaus
    const b = suchAusschnitt(video, anzeige, rahmen, 10);
    expect(b).toEqual({ x: 0, y: expect.any(Number), breite: 1080, hoehe: expect.any(Number) });
    expect(b.y + b.hoehe).toBeLessThanOrEqual(1920);
  });

  it("nimmt am Notebook (Querformat, Rahmen an der Höhe) ebenfalls die Rahmenmitte", () => {
    // 1280×720-Kamera in 1440×900 (Maßstab 1,25 über die Höhe: 900/720), Rahmen 55 vh = 495 px.
    const a = suchAusschnitt({ breite: 1280, hoehe: 720 }, { x: 0, y: 0, width: 1440, height: 900 }, { x: 472.5, y: 202.5, width: 495, height: 495 }, 1);
    expect(a.breite).toBe(396);
    expect(a.x + a.breite / 2).toBeCloseTo(640, -1);
  });

  it("liefert ohne Rahmen das ganze Bild", () => {
    expect(suchAusschnitt(video, anzeige, undefined)).toEqual({ x: 0, y: 0, breite: 1080, hoehe: 1920 });
    expect(suchAusschnitt(video, anzeige, { x: 0, y: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0, breite: 1080, hoehe: 1920 });
  });
});
