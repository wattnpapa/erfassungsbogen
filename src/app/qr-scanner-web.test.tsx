/**
 * Der Weg, den eine Feldmeldung aufgedeckt hat: Auf manchen Android-Browsern
 * kommt gar keine Kamerafrage, weil die Freigabe schon blockiert ist — die App
 * meldete darauf nur „keine Kamera". Getestet wird deshalb, dass jede Ursache
 * ihren eigenen, handlungsfähigen Hinweis bekommt und ein zweiter Anlauf nach
 * nachträglicher Freigabe möglich ist.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QrScannerWeb } from "./qr-scanner-web";

/** Kamerafehler wie im Browser: DOMException mit sprechendem `name`. */
function kameraFehler(name: string): Error {
  const err = new Error(name);
  err.name = name;
  return err;
}

/**
 * Stream-Attrappe: Die Komponente stoppt die Spuren und fragt die Videospur,
 * welche Kamera tatsächlich läuft (für die Auswahl).
 */
function streamAttrappe(deviceId = ""): MediaStream {
  const spur = { stop: () => {}, getSettings: () => ({ deviceId }) };
  return { getTracks: () => [spur], getVideoTracks: () => [spur] } as unknown as MediaStream;
}

/** enumerateDevices()-Eintrag, so knapp wie die Komponente ihn braucht. */
function kameraGeraet(deviceId: string, label: string): MediaDeviceInfo {
  return { kind: "videoinput", deviceId, label, groupId: "g", toJSON: () => ({}) } as MediaDeviceInfo;
}

const echteMediaDevices = navigator.mediaDevices;

function mediaDevicesSetzen(wert: unknown): void {
  Object.defineProperty(navigator, "mediaDevices", { value: wert, configurable: true });
}

beforeEach(() => {
  // jsdom kennt kein play(); ohne Ersatz stolpert der Erfolgspfad darüber.
  HTMLMediaElement.prototype.play = vi.fn(async () => {});
  // Die zuletzt gewählte Kamera überlebt sonst ins nächste Szenario.
  localStorage.clear();
});

afterEach(() => {
  mediaDevicesSetzen(echteMediaDevices);
});

describe("QR-Scanner im Browser", () => {
  it("nennt bei blockierter Freigabe beide Stellen zum Freischalten", async () => {
    mediaDevicesSetzen({ getUserMedia: vi.fn(async () => { throw kameraFehler("NotAllowedError"); }) });

    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);

    await screen.findByText(/blockiert/);
    const dialog = screen.getByRole("dialog", { name: "QR-Code scannen" });
    // Beide Freigabe-Stellen: die im Browser und die im Betriebssystem.
    expect(dialog.textContent).toMatch(/Adresszeile/);
    expect(dialog.textContent).toMatch(/Einstellungen → Apps/);
  });

  it("erkennt einen Browser ohne Kamera-Schnittstelle statt „Zugriff verweigert“", async () => {
    mediaDevicesSetzen(undefined);

    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);

    expect(await screen.findByText(/gibt die Kamera für Webseiten nicht frei/)).toBeTruthy();
  });

  it("versucht es ohne Rückkamera-Vorgabe erneut, wenn nur die Einschränkung scheitert", async () => {
    const getUserMedia = vi.fn()
      .mockRejectedValueOnce(kameraFehler("OverconstrainedError"))
      .mockResolvedValueOnce(streamAttrappe());
    mediaDevicesSetzen({ getUserMedia });

    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);

    await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
    expect(getUserMedia.mock.calls[1]![0]).toEqual({ video: true, audio: false });
    expect(screen.queryByText(/Kamera erneut versuchen/)).toBeNull();
  });

  it("fragt eine blockierte Kamera auf Knopfdruck erneut an", async () => {
    const nutzer = userEvent.setup();
    const getUserMedia = vi.fn()
      .mockRejectedValueOnce(kameraFehler("NotAllowedError"))
      .mockResolvedValueOnce(streamAttrappe());
    mediaDevicesSetzen({ getUserMedia });

    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);
    await screen.findByText(/blockiert/);

    await nutzer.click(screen.getByRole("button", { name: "Kamera erneut versuchen" }));

    await vi.waitFor(() => expect(screen.queryByText(/blockiert/)).toBeNull());
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it("lässt bei mehreren Kameras zwischen Front und Haupt wechseln", async () => {
    const nutzer = userEvent.setup();
    const getUserMedia = vi.fn(async (c: MediaStreamConstraints) => {
      // Ohne Gerätewunsch antwortet die Attrappe wie ein Gerät mit Rückkamera.
      const wunsch = (c.video as { deviceId?: { exact?: string } } | undefined)?.deviceId?.exact;
      return streamAttrappe(wunsch ?? "hinten");
    });
    mediaDevicesSetzen({
      getUserMedia,
      enumerateDevices: async () => [kameraGeraet("hinten", "Surface Camera Rear"), kameraGeraet("vorn", "Surface Camera Front")],
    });

    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);

    const auswahl = await screen.findByRole("combobox", { name: "Kamera" });
    expect((auswahl as HTMLSelectElement).value).toBe("hinten");

    await nutzer.selectOptions(auswahl, "vorn");

    // Gezielt nach Gerät fragen — die Rückkamera-Vorgabe würde die Wahl sonst
    // gleich wieder überstimmen. Und sie überlebt das Schließen des Scanners.
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenLastCalledWith({ video: { deviceId: { exact: "vorn" } }, audio: false });
    });
    expect(localStorage.getItem("eeb-kamera")).toBe("vorn");
  });

  it("zeigt ohne zweite Kamera keine Auswahl", async () => {
    mediaDevicesSetzen({
      getUserMedia: vi.fn(async () => streamAttrappe("eine")),
      enumerateDevices: async () => [kameraGeraet("eine", "Integrated Webcam")],
    });

    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);

    await screen.findByText(/vor die Kamera halten/);
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
