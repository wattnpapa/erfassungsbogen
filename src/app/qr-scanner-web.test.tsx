/**
 * Der Weg, den eine Feldmeldung aufgedeckt hat: Auf manchen Android-Browsern
 * kommt gar keine Kamerafrage, weil die Freigabe schon blockiert ist — die App
 * meldete darauf nur „keine Kamera". Getestet wird deshalb, dass jede Ursache
 * ihren eigenen, handlungsfähigen Hinweis bekommt und ein zweiter Anlauf nach
 * nachträglicher Freigabe möglich ist.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("nimmt einen USB-Handscanner (Tastatur-Wedge) auch ohne Kamera an", async () => {
    // Der harte Fall aus der Praxis: PC ohne Webcam-Freigabe, Scanner am USB.
    mediaDevicesSetzen(undefined);
    const onErgebnis = vi.fn();

    render(<QrScannerWeb onErgebnis={onErgebnis} onAbbruch={() => {}} />);
    await screen.findByText(/mit dem USB-Handscanner scannen/);

    const url = "https://erfassungsbogen.app/#0ABC$*-/:XYZ";
    for (const zeichen of url) fireEvent.keyDown(window, { key: zeichen });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onErgebnis).toHaveBeenCalledExactlyOnceWith(url);
  });

  it("zeigt ohne Kamera den Handscanner-Weg samt Lebenszeichen", async () => {
    // Ohne Kamerabild ist die Zeichen-Rückmeldung der einzige Beleg, dass der
    // Scanner am Rechner ankommt — sonst wirkt der schwarze Bildschirm tot.
    mediaDevicesSetzen(undefined);

    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);
    await screen.findByText(/mit dem USB-Handscanner scannen/);
    expect(screen.getByRole("status").textContent).toMatch(/warte auf den Handscanner/i);

    for (const zeichen of "https:") fireEvent.keyDown(window, { key: zeichen });

    expect(screen.getByRole("status").textContent).toMatch(/Handscanner erkannt — 6 Zeichen/);
  });

  it("zeigt ohne Kamera auch den Sammelstand eines mehrteiligen Bogens", async () => {
    // Ohne Kamerabild gab es für einen angenommenen Teil bisher keine Anzeige:
    // Teil 1 von 4 sah aus wie ein verschluckter Scan.
    mediaDevicesSetzen(undefined);

    render(
      <QrScannerWeb
        onErgebnis={() => {}}
        onAbbruch={() => {}}
        fortschritt="Teil 1 von 4 gescannt — es fehlen noch die Teile 2, 3 und 4."
        teile={[{ teilNr: 1, anzahl: 4, id: 7, chunk: new Uint8Array([1]) }]}
      />,
    );

    expect(await screen.findByText(/Teil 1 von 4 gescannt/)).toBeTruthy();
  });

  it("wertet langsames menschliches Tippen nicht als Scan", async () => {
    mediaDevicesSetzen(undefined);
    const onErgebnis = vi.fn();
    // Uhr-Attrappe: zwischen menschlichen Tasten liegen >500 ms.
    let uhr = 0;
    const now = vi.spyOn(performance, "now").mockImplementation(() => (uhr += 600));

    try {
      render(<QrScannerWeb onErgebnis={onErgebnis} onAbbruch={() => {}} />);
      await screen.findByText(/mit dem USB-Handscanner scannen/);

      for (const zeichen of "https://erfassungsbogen.app/#0ABC") fireEvent.keyDown(window, { key: zeichen });
      fireEvent.keyDown(window, { key: "Enter" });
    } finally {
      now.mockRestore();
    }

    expect(onErgebnis).not.toHaveBeenCalled();
  });

  it("lässt Enter ohne Scan-Puffer für die Knöpfe durch", async () => {
    mediaDevicesSetzen(undefined);
    const onErgebnis = vi.fn();

    render(<QrScannerWeb onErgebnis={onErgebnis} onAbbruch={() => {}} />);
    await screen.findByText(/mit dem USB-Handscanner scannen/);

    // fireEvent liefert false, wenn preventDefault() gerufen wurde.
    expect(fireEvent.keyDown(window, { key: "Enter" })).toBe(true);
    expect(onErgebnis).not.toHaveBeenCalled();
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
