/**
 * Startbündel verkleinern (Runde 20): Einsatzansicht und taktische Zeichen
 * werden nachgeladen. Geprüft wird mit frischem Modulspeicher, also so wie beim
 * ersten Aufruf im Browser — das Setup der Oberflächentests lädt beide sonst vor.
 *
 *  - Bis zum Laden steht eine Fläche gleicher Höhe da (kein Layoutsprung,
 *    als „wird geladen" gekennzeichnet); danach rendert die Komponente.
 *  - Die Startmodule ziehen die nachgeladenen Brocken nicht wieder statisch herein.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { EinsatzArt, einsatzAnlegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";

// Der erste Import der Einsatzansicht mit frischem Modulspeicher übersetzt ihren ganzen Baum neu und braucht einige Sekunden.
vi.setConfig({ testTimeout: 40_000 });

beforeEach(() => {
  vi.resetModules();
});

describe("Einsatzliste und Einsatzansicht laden nach", () => {
  it("die Liste hält bis zum Laden Platz für ihre Karten und zeigt dann den Einsatz", async () => {
    const s = einsatzAnlegen("Hochwasser Elbe", EinsatzArt.EINSATZ, "Dömitz");
    const { EinsatzListe } = await import("./einsaetze-lazy");
    render(<EinsatzListe einsaetze={[s]} onOeffnen={() => {}} onGeaendert={() => {}} />);

    const flaeche = screen.getByRole("status", { name: "Einsatzansicht wird geladen" });
    expect(flaeche.getAttribute("aria-busy")).toBe("true");
    expect(flaeche.style.getPropertyValue("--karten")).toBe("1");
    expect(flaeche.className).toBe("einsatz-laedt");

    expect(await screen.findByText(/Hochwasser Elbe/, {}, { timeout: 20000 })).toBeTruthy();
    expect(screen.queryByRole("status", { name: "Einsatzansicht wird geladen" })).toBeNull();
  });

  it("die Detailansicht hält bis zum Laden eine Bildschirmhöhe frei und rendert dann", async () => {
    const s = einsatzAnlegen("Sturmschäden", EinsatzArt.EINSATZ, "Celle");
    const { EinsatzDetail } = await import("./einsaetze-lazy");
    render(
      <EinsatzDetail
        einsatz={s}
        onZurueck={() => {}}
        onGeaendert={() => {}}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={() => {}}
        onBilderImport={() => {}}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onGeloescht={() => {}}
      />,
    );
    const flaeche = screen.getByRole("status", { name: "Einsatzansicht wird geladen" });
    expect(flaeche.className).toBe("einsatz-laedt detail");
    expect(await screen.findByText(/Sturmschäden/, {}, { timeout: 20000 })).toBeTruthy();
    expect(screen.queryByRole("status", { name: "Einsatzansicht wird geladen" })).toBeNull();
  });

  it("nach dem ersten Laden erscheint die Liste ohne erneutes Warten", async () => {
    const s = einsatzAnlegen("Übung Nord", EinsatzArt.UEBUNG, "Hannover");
    const { EinsatzListe, einsatzUiLaden } = await import("./einsaetze-lazy");
    await einsatzUiLaden();
    render(<EinsatzListe einsaetze={[s]} onOeffnen={() => {}} onGeaendert={() => {}} />);
    expect(screen.queryByRole("status", { name: "Einsatzansicht wird geladen" })).toBeNull();
    expect(screen.getByText(/Übung Nord/)).toBeTruthy();
  });
});

describe("Taktische Zeichen laden nach", () => {
  it("bis zur Sammlung steht ein unsichtbares Quadrat da, danach das Zeichen der Einheit", async () => {
    const { EinheitZeichen } = await import("./zeichen-bild");
    const bogen = neuerBogen();
    const { container } = render(<EinheitZeichen einheit={bogen.einheit} className="einheit-avatar" aria-hidden="true" />);
    const bild = container.querySelector("img")!;
    expect(bild.dataset.zeichen).toBe("laedt");
    expect(bild.style.visibility).toBe("hidden");
    expect(bild.className).toBe("einheit-avatar");
    expect(bild.getAttribute("src")).toContain("viewBox%3D%220%200%20256%20256%22");

    await waitFor(() => expect(container.querySelector("img")!.dataset.zeichen).toBe("geladen"));
    const fertig = container.querySelector("img")!;
    expect(fertig.style.visibility).toBe("");
    expect(decodeURIComponent(fertig.getAttribute("src")!)).toContain("<svg");
  });

  it("ein Fahrzeugzeichen erscheint nach dem Laden; ein zweites ist sofort da", async () => {
    const { FahrzeugZeichen, zeichenLaden } = await import("./zeichen-bild");
    const bogen = neuerBogen();
    const fahrzeug = bogen.fahrzeuge[0] ?? { typ: undefined, kennzeichen: "", funkrufname: "" };
    const erstes = render(<FahrzeugZeichen fahrzeug={fahrzeug as never} org={bogen.einheit.organisation} className="fahrzeug-symbol" />);
    await waitFor(() => expect(erstes.container.querySelector("img")!.dataset.zeichen).toBe("geladen"));
    await zeichenLaden();
    const zweites = render(<FahrzeugZeichen fahrzeug={fahrzeug as never} org={bogen.einheit.organisation} className="fahrzeug-symbol" />);
    expect(zweites.container.querySelector("img")!.dataset.zeichen).toBe("geladen");
  });
});

describe("Startmodule ziehen die nachgeladenen Brocken nicht statisch herein", () => {
  const lesen = (pfad: string) => readFileSync(new URL(pfad, import.meta.url), "utf8");
  const statischeImporte = (quelle: string) => [...quelle.matchAll(/^import\s+(?!type\b)[^;]*?from\s+"([^"]+)";/gms)].map((t) => t[1]);

  it.each(["./app.tsx", "./fusszeile.tsx", "./schritte/uebersicht.tsx", "./schritte/fahrzeuge.tsx"])("%s importiert weder Einsatzansicht noch Zeichensammlung statisch", (datei) => {
    const importe = statischeImporte(lesen(datei));
    expect(importe).not.toContain("./einsaetze-ui");
    expect(importe).not.toContain("./taktische-zeichen-bogen");
    expect(importe).not.toContain("../taktische-zeichen-bogen");
    expect(importe.some((i) => i!.includes("taktische-zeichen/"))).toBe(false);
  });

  it("die Platzhalterfläche hat ihre Höhe im CSS der index.html (Karten und 70 vh)", () => {
    const css = readFileSync("index.html", "utf8");
    expect(css).toMatch(/\.einsatz-laedt \{[^}]*min-height: calc\(var\(--karten, 1\)/);
    expect(css).toMatch(/\.einsatz-laedt\.detail \{ min-height: 70vh; \}/);
  });

  it("die Konstanten der Einsatzansicht stehen im kleinen Modul, die Ansicht führt sie unverändert aus", async () => {
    const klein = await import("./einsaetze-konstanten");
    const gross = await import("./einsaetze-ui");
    expect(gross.ART_LABEL).toBe(klein.ART_LABEL);
    expect(gross.PAPIERKORB_OEFFNEN).toBe(klein.PAPIERKORB_OEFFNEN);
  });
});
