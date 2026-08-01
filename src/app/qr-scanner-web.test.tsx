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

/** Stream-Attrappe: mehr als das Stoppen der Spuren nutzt die Komponente nicht. */
function streamAttrappe(): MediaStream {
  return { getTracks: () => [{ stop: () => {} }] } as unknown as MediaStream;
}

const echteMediaDevices = navigator.mediaDevices;

function mediaDevicesSetzen(wert: unknown): void {
  Object.defineProperty(navigator, "mediaDevices", { value: wert, configurable: true });
}

beforeEach(() => {
  // jsdom kennt kein play(); ohne Ersatz stolpert der Erfolgspfad darüber.
  HTMLMediaElement.prototype.play = vi.fn(async () => {});
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
});
