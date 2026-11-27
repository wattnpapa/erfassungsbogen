/**
 * Sichtschutz „Namen verbergen“ und Screenshot-Sperre.
 *
 * Geprüft wird die Logik im Browser-Teil: Wahl im Gerätespeicher, Klasse auf
 * <html>, Finden gemerkter Namen in Fließtext, Aufdecken per Tipp und
 * Tastatur, Eingabefelder mit Kennzeichen, die Weiche, wo die Sperre überhaupt
 * erscheint. Die nativen Teile (Android, iOS, Electron) laufen hier nicht;
 * für sie bleibt eine Prüfung, dass die Verdrahtung im Quelltext steht.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AUFGEDECKT_MS,
  NAMEN_VERBERGEN_KLASSE,
  gemerkteNamenVergessen,
  namenMerken,
  namenVerbergen,
  namenVerbergenSetzen,
  schreibweisen,
  textMitNamen,
  wendeNamenVerbergenAn,
} from "./namen-verbergen";
import { NamenText, NamenVerbergenSchalter, PersonName, namensFeld } from "./personen-name";

const plattform = { wert: "web" };
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => plattform.wert, isNativePlatform: () => plattform.wert !== "web" },
  registerPlugin: () => ({ setzen: vi.fn(async () => {}), addListener: vi.fn(async () => ({ remove: async () => {} })) }),
}));
const { bildschirmschutzAn, bildschirmschutzArt, bildschirmschutzSetzen } = await import("./bildschirmschutz");

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  gemerkteNamenVergessen();
  plattform.wert = "web";
  delete (globalThis as { eebDesktop?: unknown }).eebDesktop;
  act(() => namenVerbergenSetzen(false));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Wahl „Namen verbergen“", () => {
  it("ist ab Werk aus", () => {
    expect(namenVerbergen()).toBe(false);
    wendeNamenVerbergenAn();
    expect(document.documentElement.classList.contains(NAMEN_VERBERGEN_KLASSE)).toBe(false);
  });

  it("bleibt im Gerätespeicher und setzt die Klasse auf <html>", () => {
    act(() => namenVerbergenSetzen(true));
    expect(namenVerbergen()).toBe(true);
    expect(document.documentElement.classList.contains(NAMEN_VERBERGEN_KLASSE)).toBe(true);
    act(() => namenVerbergenSetzen(false));
    expect(localStorage.getItem("eeb.namen-verbergen.v1")).toBeNull();
    expect(document.documentElement.classList.contains(NAMEN_VERBERGEN_KLASSE)).toBe(false);
  });

  it("der Schalter schaltet und alle Stellen ziehen mit", async () => {
    render(
      <>
        <NamenVerbergenSchalter kurz />
        <PersonName>Meyer, Jan</PersonName>
      </>,
    );
    expect(screen.getByText("Meyer, Jan")).toBeTruthy();
    await userEvent.click(screen.getByRole("checkbox", { name: /Namen verbergen/ }));
    expect(namenVerbergen()).toBe(true);
    expect(screen.getByRole("button", { name: /Name verborgen/ })).toBeTruthy();
  });
});

describe("Namen in Fließtext", () => {
  it("kennt die Schreibweisen der App, einzelne Teile nur ohne zweiten Teil", () => {
    expect(schreibweisen({ vorname: "Jan", nachname: "Meyer" })).toEqual(["Meyer, Jan", "Jan Meyer", "Meyer Jan"]);
    expect(schreibweisen({ vorname: "", nachname: "Koch" })).toEqual(["Koch"]);
    expect(schreibweisen({ vorname: " ", nachname: "" })).toEqual([]);
  });

  it("findet gemerkte Namen, längste Schreibweise zuerst, nur als ganze Wörter", () => {
    namenMerken([{ vorname: "Jan", nachname: "Meyer" }, { vorname: "", nachname: "Ott" }]);
    expect(textMitNamen("Meyer, Jan entfernen?")).toEqual([
      { text: "Meyer, Jan", name: true },
      { text: " entfernen?", name: false },
    ]);
    expect(textMitNamen("Entfernt: Jan Meyer; Ott")).toEqual([
      { text: "Entfernt: ", name: false },
      { text: "Jan Meyer", name: true },
      { text: "; ", name: false },
      { text: "Ott", name: true },
    ]);
    // „Ott“ steckt in „Otto“ und „Gotthard“ — das ist kein Treffer.
    expect(textMitNamen("Otto aus Gotthard")).toEqual([{ text: "Otto aus Gotthard", name: false }]);
    // Ein einzelner Teil eines vollständigen Namens bleibt stehen (Koch, Wagner …).
    expect(textMitNamen("Meyer fährt")).toEqual([{ text: "Meyer fährt", name: false }]);
  });

  it("verträgt Sonderzeichen im Namen", () => {
    namenMerken([{ vorname: "Anna-Lena", nachname: "O'Brien (Gast)" }]);
    expect(textMitNamen("Anna-Lena O'Brien (Gast) fehlt").filter((s) => s.name)).toHaveLength(1);
  });

  it("<NamenText> verdeckt nur mit Sichtschutz", () => {
    namenMerken([{ vorname: "Jan", nachname: "Meyer" }]);
    const { container, rerender } = render(<NamenText>{"Meyer, Jan entfernen?"}</NamenText>);
    expect(container.textContent).toBe("Meyer, Jan entfernen?");
    expect(container.querySelector(".personname")).toBeNull();
    act(() => namenVerbergenSetzen(true));
    rerender(<NamenText>{"Meyer, Jan entfernen?"}</NamenText>);
    expect(container.querySelector(".personname.verdeckt")?.textContent).toBe("Meyer, Jan");
  });
});

describe("<PersonName>", () => {
  it("deckt per Tipp auf und verdeckt nach Ablauf wieder", async () => {
    act(() => namenVerbergenSetzen(true));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const elternTipp = vi.fn();
    render(
      <div onClick={elternTipp}>
        <PersonName>Meyer, Jan</PersonName>
      </div>,
    );
    const knopf = screen.getByRole("button", { name: "Name verborgen, zum Anzeigen antippen" });
    expect(knopf.getAttribute("aria-pressed")).toBe("false");
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(knopf);
    // Der Tipp gehört dem Namen, nicht der Karte darum herum.
    expect(elternTipp).not.toHaveBeenCalled();
    const offen = screen.getByRole("button", { name: "Meyer, Jan" });
    expect(offen.getAttribute("aria-pressed")).toBe("true");
    act(() => vi.advanceTimersByTime(AUFGEDECKT_MS + 10));
    expect(screen.getByRole("button", { name: /Name verborgen/ })).toBeTruthy();
  });

  it("lässt sich mit der Tastatur aufdecken", async () => {
    act(() => namenVerbergenSetzen(true));
    render(<PersonName>Meyer, Jan</PersonName>);
    await userEvent.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/Name verborgen/);
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Meyer, Jan" })).toBeTruthy();
    await userEvent.keyboard(" ");
    expect(screen.getByRole("button", { name: /Name verborgen/ })).toBeTruthy();
  });

  it("still: in Knöpfen nur verdeckt, ohne eigenen Knopf", () => {
    act(() => namenVerbergenSetzen(true));
    render(
      <button type="button">
        <PersonName still>Meyer, Jan</PersonName>
      </button>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button").textContent).toContain("Name verborgen");
  });

  it("ohne Sichtschutz ein schlichter Text", () => {
    render(<PersonName>Meyer, Jan</PersonName>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Meyer, Jan")).toBeTruthy();
  });
});

describe("namensFeld", () => {
  it("kennzeichnet nur gefüllte Felder", () => {
    expect(namensFeld("Jan")).toEqual({ "data-personname": "1" });
    expect(namensFeld("  ")).toEqual({ "data-personname": "0" });
    expect(namensFeld(undefined)).toEqual({ "data-personname": "0" });
  });

  it("das Stylesheet verdeckt gekennzeichnete Felder nur ohne Fokus", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).toContain('.namen-verbergen input[data-personname="1"]:not(:focus)');
    expect(html).toContain('.namen-verbergen textarea[data-personname="1"]:not(:focus)');
    expect(html).toContain(".namen-verbergen .personname.verdeckt");
  });

  it("die Namensfelder der Personal-Erfassung tragen das Kennzeichen", () => {
    const personal = readFileSync("src/app/schritte/personal.tsx", "utf8");
    expect(personal.match(/namensFeld\(p\.vorname\)/g)).toHaveLength(2);
    expect(personal.match(/namensFeld\(p\.nachname\)/g)).toHaveLength(2);
    expect(readFileSync("src/app/schritte/namen-dialog.tsx", "utf8")).toContain("namensFeld(namenText)");
  });
});

describe("Screenshot-Sperre", () => {
  it("ist ab Werk an und merkt sich nur das Abschalten", () => {
    expect(bildschirmschutzAn()).toBe(true);
    bildschirmschutzSetzen(false);
    expect(localStorage.getItem("eeb.bildschirmschutz.v1")).toBe("0");
    expect(bildschirmschutzAn()).toBe(false);
    bildschirmschutzSetzen(true);
    expect(localStorage.getItem("eeb.bildschirmschutz.v1")).toBeNull();
  });

  it("erscheint nur, wo sie wirkt", () => {
    expect(bildschirmschutzArt()).toBeNull(); // Browser
    plattform.wert = "android";
    expect(bildschirmschutzArt()).toBe("sperre");
    plattform.wert = "ios";
    expect(bildschirmschutzArt()).toBe("verdecken");
    plattform.wert = "web";
    const bruecke = { plattform: "linux", bildschirmschutz: vi.fn(async () => {}) };
    (globalThis as { eebDesktop?: unknown }).eebDesktop = bruecke;
    expect(bildschirmschutzArt()).toBeNull(); // Linux kennt keine Sperre
    bruecke.plattform = "win32";
    expect(bildschirmschutzArt()).toBe("sperre");
    bruecke.plattform = "darwin";
    expect(bildschirmschutzArt()).toBe("sperre");
  });

  it("gibt die Wahl an die Desktop-Brücke weiter", async () => {
    const bruecke = { plattform: "win32", bildschirmschutz: vi.fn(async () => {}) };
    (globalThis as { eebDesktop?: unknown }).eebDesktop = bruecke;
    bildschirmschutzSetzen(false);
    await Promise.resolve();
    expect(bruecke.bildschirmschutz).toHaveBeenCalledWith(false);
  });

  it("Desktop: Sperre auf jedem Fenster, Härtung bleibt, Preload nur mit contextBridge", () => {
    const main = readFileSync("electron/main.js", "utf8");
    expect(main).toMatch(/contextIsolation: true,\s+nodeIntegration: false,\s+sandbox: true,/);
    expect(main).toContain('preload: path.join(hier, "preload.cjs")');
    expect(main).toContain("setContentProtection(bildschirmschutz)");
    expect(main).toContain('on("did-create-window"');
    expect(main).toContain('typeof an !== "boolean"');
    const preload = readFileSync("electron/preload.cjs", "utf8");
    expect(preload).toContain("contextBridge.exposeInMainWorld");
    expect(preload).not.toMatch(/require\("(?!electron")/);
  });

  it("Android und iOS: Plugin registriert, Sperre ab Start", () => {
    const aktivitaet = readFileSync("android/app/src/main/java/de/erfassungsbogen/app/MainActivity.java", "utf8");
    expect(aktivitaet).toContain("registerPlugin(Bildschirmschutz.class)");
    expect(aktivitaet).toContain("Bildschirmschutz.anwenden(this, true)");
    expect(readFileSync("android/app/src/main/java/de/erfassungsbogen/app/Bildschirmschutz.java", "utf8")).toContain("FLAG_SECURE");
    expect(readFileSync("ios/App/App/Base.lproj/Main.storyboard", "utf8")).toContain('customClass="AppViewController"');
    expect(readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8").match(/Bildschirmschutz\.swift/g)?.length).toBe(6);
  });
});
