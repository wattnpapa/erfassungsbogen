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

// Der echte Decoder lädt WebAssembly — hier geht es um Kamera, Freigabe und
// Handscanner, nicht ums Lesen; ein Leser, der nie etwas findet, reicht.
vi.mock("./qr-decoder", () => ({ qrLeserLaden: async () => async () => null }));

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
      const video = getUserMedia.mock.lastCall![0].video as MediaTrackConstraints;
      expect(video.deviceId).toEqual({ exact: "vorn" });
      expect(video.facingMode).toBeUndefined();
    });
    expect(localStorage.getItem("eeb-kamera")).toBe("vorn");
  });

  it("fragt die Kamera hochauflösend an, damit dichte Codes lesbar bleiben", async () => {
    // Der Fall aus dem Feld: ein Bogen-QR auf dem Notebook-Bildschirm, den die
    // Kamera-App des Telefons sofort liest. Mit den voreingestellten 640×480
    // entfallen auf ein Modul zu wenige Pixel — der Wunsch muss mit raus.
    const getUserMedia = vi.fn(async (_c: MediaStreamConstraints) => streamAttrappe("hinten"));
    mediaDevicesSetzen({ getUserMedia });

    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);

    await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    const video = getUserMedia.mock.calls[0]![0].video as MediaTrackConstraints;
    expect(video.width).toEqual({ ideal: 1920 });
    expect(video.facingMode).toBe("environment");
    // Der Fokuswunsch gehört in `advanced`: dort übergeht ihn ein Gerät, das
    // ihn nicht kennt, statt die ganze Anfrage abzulehnen.
    expect(video.advanced).toEqual([{ focusMode: "continuous" }]);
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

  it("rät nach einer Weile ohne Treffer zu Abstand und Ultraweitwinkel", async () => {
    // Der Feldfall: Das Bild bleibt unscharf, weil zu nah gehalten wird — die
    // Hauptkamera stellt darunter nicht scharf, die Kamera-App weicht dafür
    // von selbst aufs Ultraweitwinkel aus, eine Webseite darf das nicht. Ohne
    // diesen Rat sucht man den Fehler bei der App statt am Abstand.
    vi.useFakeTimers();
    try {
      mediaDevicesSetzen({
        getUserMedia: vi.fn(async () => streamAttrappe("haupt")),
        enumerateDevices: async () => [
          kameraGeraet("haupt", "Back Camera"),
          kameraGeraet("uww", "Back Ultra Wide Camera"),
        ],
      });

      render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);
      await vi.advanceTimersByTimeAsync(1000);
      expect(screen.queryByText(/Abstand halten/)).toBeNull();

      await vi.advanceTimersByTimeAsync(6000);

      const rat = screen.getByText(/Abstand halten/);
      expect(rat.textContent).toMatch(/Ultraweitwinkel/);
    } finally {
      vi.useRealTimers();
    }
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
