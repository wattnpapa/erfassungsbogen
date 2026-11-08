/**
 * Erklärfilm auf der Startseite: Zählung der Filmereignisse (GoatCounter) und
 * Ausblenden ohne Netz. Die Zählung selbst (URL, Widerspruch, lokale
 * Entwicklung) prüft statistik.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, cleanup } from "@testing-library/react";

const gezaehlt = vi.hoisted(() => [] as string[]);
vi.mock("./statistik", () => ({ ereignisZaehlen: (e: string) => gezaehlt.push(e) }));

import { Erklaerfilm } from "./app";

function video(container: HTMLElement): HTMLVideoElement {
  const v = container.querySelector("video");
  if (!v) throw new Error("kein <video>");
  return v;
}

/** Abspielposition setzen — jsdom kennt keine echte Wiedergabe. */
function position(v: HTMLVideoElement, zeit: number, dauer = 324) {
  Object.defineProperty(v, "duration", { configurable: true, get: () => dauer });
  Object.defineProperty(v, "currentTime", { configurable: true, get: () => zeit });
  fireEvent.timeUpdate(v);
}

describe("Erklärfilm auf der Startseite", () => {
  beforeEach(() => {
    gezaehlt.length = 0;
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("lädt erst beim Abspielen und bringt Untertitel mit", () => {
    const { container } = render(<Erklaerfilm />);
    const v = video(container);
    expect(v.getAttribute("preload")).toBe("none");
    expect(v.getAttribute("poster")).toBe("video/erklaerfilm.jpg");
    expect(container.querySelector('track[kind="subtitles"]')?.getAttribute("src")).toBe("video/erklaerfilm.vtt");
  });

  it("zählt Start, Hälfte und Ende je Seitenaufruf genau einmal", () => {
    const { container } = render(<Erklaerfilm />);
    const v = video(container);
    fireEvent.play(v);
    fireEvent.pause(v);
    fireEvent.play(v); // Weiterspielen zählt nicht noch einmal
    position(v, 100);
    expect(gezaehlt).toEqual(["erklaerfilm-start"]);
    position(v, 170);
    position(v, 30); // zurückgespult …
    position(v, 200); // … und wieder über die Hälfte
    fireEvent.ended(v);
    fireEvent.ended(v);
    expect(gezaehlt).toEqual(["erklaerfilm-start", "erklaerfilm-haelfte", "erklaerfilm-ende"]);
  });

  it("verschwindet ohne Netz und kommt mit Netz zurück", () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const { container } = render(<Erklaerfilm />);
    expect(container.querySelector(".erklaerfilm")).not.toBeNull();
    online.mockReturnValue(false);
    act(() => void window.dispatchEvent(new Event("offline")));
    expect(container.querySelector(".erklaerfilm")).toBeNull();
    online.mockReturnValue(true);
    act(() => void window.dispatchEvent(new Event("online")));
    expect(container.querySelector(".erklaerfilm")).not.toBeNull();
  });

  it("verschwindet, wenn der Film nicht laden kann (WLAN ohne Internet)", () => {
    const { container } = render(<Erklaerfilm />);
    fireEvent.error(container.querySelector("source")!);
    expect(container.querySelector(".erklaerfilm")).toBeNull();
  });
});
