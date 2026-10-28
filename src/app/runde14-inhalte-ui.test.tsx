/**
 * Runde 14, Block Inhalte: Verhalten in der Oberfläche — D2 (Stapel nach „Aufteilen"), H1 (Link ohne Sammlung),
 * N3 (Schnellerfassung).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsatzAnlegen, meldungAufteilen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { neuePerson, neuerBogen } from "./hilfen";
import { Uebersicht } from "./schritte/uebersicht";
import { Dialogschicht } from "./dialoge";

vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => true,
  einsatzLageblattErzeugen: async () => true,
  blankoPdfErzeugen: async () => true,
}));
vi.mock("./nativ", async () => {
  const echt = await vi.importActual<typeof import("./nativ")>("./nativ");
  return {
    istNativ: () => false,
    plattform: () => "web",
    imWebBrowser: () => true,
    bogenLinksEmpfangen: () => () => {},
    qrScannen: async () => "",
    binaerTeilen: async () => {},
    linkTeilen: async () => {},
    textTeilen: async () => {},
    shareSheetVerfuegbar: () => false,
    nahbereichDienst: echt.nahbereichDienst,
    pdfEinbettbar: () => true,
  };
});
vi.mock("./pdf-qr", () => ({ qrTexteAusPdfBytes: async () => [] }));

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
});

function bogenMitPersonen(namen: string[]): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = "Sinsheim";
  b.personal = namen.map((n) => ({ ...neuePerson(), vorname: n, nachname: `Nach${n}` }));
  return b;
}

async function quittungNachUpload(bogen: Erfassungsbogen): Promise<string> {
  const nutzer = userEvent.setup({ applyAccept: false });
  render(<App />);
  await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
  await screen.findByRole("heading", { level: 1, name: "Hochwasser Weser" });
  await nutzer.upload(
    screen.getByLabelText("Dateien wählen…"),
    new File([JSON.stringify(bogen)], "sinsheim.json", { type: "application/json" }),
  );
  const q = await waitFor(() => {
    const el = document.querySelector<HTMLElement>(".einlese-quittung");
    expect(el).not.toBeNull();
    return el!;
  });
  return q.textContent ?? "";
}

describe("R14-D2 „Bögen einlesen…“ nach „Aufteilen“: die abgeteilten Personen zählen nicht still doppelt", () => {
  it("die Quittung nennt den Trupp, die doppelten Namen und den Weg zur Korrektur", async () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const ganz = bogenMitPersonen(["Anna", "Bert", "Clara", "Dirk", "Eva", "Finn", "Gerd", "Hans", "Ina", "Jan", "Kai"]);
    const r = meldungHinzufuegen(s.id, ganz)!;
    meldungAufteilen(s.id, r.eintrag.id, { teilEtikett: "Trupp 2", personal: [7, 8, 9, 10], fahrzeuge: [] });
    const neuer = structuredClone(ganz);
    neuer.stand += 5; // neuere Fassung mit allen elf Personen, auch den vier des Trupps

    const text = await quittungNachUpload(neuer);

    expect(text).toMatch(/Trupp 2 \(4 Personen\) ist abgeteilt/);
    expect(text).toContain("NachHans, Hans");
    expect(text).toMatch(/zählen jetzt doppelt/);
    expect(text).toMatch(/Zusammenführen/);
  }, 30000);

  it("ohne abgeteilten Trupp bleibt die Quittung ohne diesen Satz", async () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const ganz = bogenMitPersonen(["Anna", "Bert"]);
    meldungHinzufuegen(s.id, ganz);
    const neuer = structuredClone(ganz);
    neuer.stand += 5;

    const text = await quittungNachUpload(neuer);

    expect(text).not.toMatch(/abgeteilt/);
  }, 30000);
});

describe("R14-H1 Empfangene Meldung ohne Sammlung auf dem Gerät", () => {
  const gueltig = { zustand: "gueltig", pubkey: "ca849419", kurzform: "ca84 9419" } as const;

  function uebersicht(signatur: Parameters<typeof Uebersicht>[0]["signatur"]) {
    const ablegen = vi.fn();
    render(
      <>
        <Uebersicht bogen={neuerBogen()} geheZu={() => {}} neu={() => {}} signatur={signatur} onInEinsatzAufnehmen={ablegen} />
        <Dialogschicht />
      </>,
    );
    return { ablegen };
  }

  it("der Hauptknopf ist „In Einsatz-Sammlung ablegen…“, die Mängel sind Hinweise an die Einheit", async () => {
    const { ablegen } = uebersicht(gueltig);
    const haupt = document.querySelector<HTMLElement>(".uebersicht-aktionen > button.primaer")!;
    expect(haupt.textContent).toBe("In Einsatz-Sammlung ablegen…");
    expect(document.querySelector(".schnell-hinweis")!.textContent).toMatch(/Meldung einer fremden Einheit/);
    expect(document.querySelector(".schnell-hinweis")!.textContent).toMatch(/eigenen Bogen dieses Geräts/);
    const liste = document.querySelector<HTMLElement>(".vollstaendigkeit")!;
    expect(liste.textContent).toMatch(/Hinweise an die Einheit \(\d+\)/);
    expect(liste.textContent).not.toMatch(/antippen zum Beheben/);
    expect(within(liste).queryAllByRole("button")).toHaveLength(0);
    await userEvent.setup().click(haupt);
    expect(ablegen).toHaveBeenCalledTimes(1);
  });

  it("der eigene (unsignierte) Bogen behält „Bogen übergeben…“ und die Mängelliste zum Beheben", () => {
    uebersicht(null);
    const haupt = document.querySelector<HTMLElement>(".uebersicht-aktionen > button.primaer")!;
    expect(haupt.textContent).toBe("Bogen übergeben…");
    expect(document.querySelector(".vollstaendigkeit")!.textContent).toMatch(/antippen zum Beheben/);
    expect(document.querySelector(".schnell-hinweis")).toBeNull();
  });
});

describe("R14-N3 Schnellerfassung: kein Haken für Schritte, die es nicht gibt", () => {
  it("zeigt nur die vier Schritte der Schnellerfassung, ohne Strich und ohne Haken für Entfallenes (R21-E4)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: /Einheit schnell erfassen/ }));
    const leiste = await screen.findByRole("navigation", { name: "Schritte" });
    const knoepfe = within(leiste).getAllByRole("button");
    expect(knoepfe.map((k) => k.textContent!.replace(/\s+/g, " ").trim().slice(0, 2))).toEqual(["1.", "2.", "3.", "4."]);
    for (const k of knoepfe) {
      expect(k.getAttribute("title")).not.toBe("Entfällt in der Schnellerfassung");
      expect(k.textContent).not.toContain("✓");
    }
  }, 30000);
});
