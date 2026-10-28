/**
 * Runde 20, Block Speicher, Inhalte: K2 („nicht erfasst“ überall dasselbe Wort, Vorbehalt im Block „Bedarf gesamt“ des gedruckten Blatts),
 * W4 (Satz zu älteren Ständen nennt beide Stände).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen, neuePerson } from "./hilfen";
import { einsatzPdfDokument } from "./pdf-dokument";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";

vi.mock("./pdf", () => ({ meldungPdfAnzeigen: async () => {} }));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function texte(node: unknown, acc: string[] = []): string[] {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => texte(n, acc));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => texte(v, acc));
  return acc;
}

const QR = {
  teile: [{ datenUrl: "data:image/png;base64,QR", url: "https://x.example/#T", teilNr: 1, anzahl: 1, version: 7 }],
  segmentiert: false,
  zeichen: 1,
  version: 7,
  vollUrl: "https://x.example/#T",
  stufen: 1,
  weitergeleitet: false,
};

/** Schnellerfassung: nur die Stärke, niemand hat den Bedarf gefragt. */
function schnell(ort: string, gesamt: number): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  b.personalErfassung = PersonalErfassung.NUR_STAERKE;
  b.staerkeManuell = { fuehrer: 0, unterfuehrer: 0, mannschaft: gesamt, gesamt };
  return b;
}

describe("R20-K2 „nicht erfasst“ im gedruckten Block „Bedarf gesamt“", () => {
  it("setzt den Vorbehalt vor jede Summe, die auf unerfassten Einheiten beruht, und nennt keine Ernährung", () => {
    const t = texte(einsatzPdfDokument("Lage", [{ bogen: schnell("Ulm", 40), qr: QR }, { bogen: schnell("Weinsberg", 38), qr: QR }]).content).join("\n");
    expect(t).toContain("Bedarf gesamt (2 Einheiten, 78 Personen)");
    // Jede Zeile des Blocks trägt den Vorbehalt „bei 2 von 2 Einheiten nicht erfasst“.
    const vorbehalte = t.match(/\(bei 2 von 2 Einheiten nicht erfasst\)/g) ?? [];
    expect(vorbehalte.length).toBeGreaterThanOrEqual(4);
    // „78 Fleisch / 0 vegetarisch / 0 vegan“ behauptet eine Ernährungsangabe, die niemand erhoben hat.
    expect(t).not.toContain("78 Fleisch");
    expect(t).toContain("(Ernährung nicht erfasst)");
    expect(t).toMatch(/Unterbringung angefordert:[\s\S]*keine \(bei 2 von 2 Einheiten nicht erfasst\)/);
  });

  it("ohne unerfasste Einheiten bleibt der Block, wie er war", () => {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Crailsheim";
    b.personal = Array.from({ length: 3 }, (_, i) => ({ ...neuePerson(), nachname: `P${i}`, vorname: "X" }));
    const t = texte(einsatzPdfDokument("Lage", [{ bogen: b, qr: QR }]).content).join("\n");
    expect(t).not.toMatch(/nicht erfasst/);
  });
});

describe("R20-K2 Details und Tabelle sagen dasselbe Wort", () => {
  it("die Details einer schnell erfassten Einheit zeigen „nicht erfasst“ statt „—“", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Detail", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, schnell("Ulm", 40));
    render(
      <>
        <EinsatzDetail
          einsatz={einsaetzeLaden().find((x) => x.id === s.id)!}
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
        />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Details" }));
    const ueberschrift = [...document.querySelectorAll("h4")].find((h) => (h.textContent ?? "").startsWith("Sofortbedarf"))!;
    const liste = ueberschrift.nextElementSibling as HTMLElement;
    const paare = [...liste.querySelectorAll("dt")].filter((dt) => /^(Verpflegung|Betriebsstoff|Unterbringung \/ Ruhezeit)$/.test(dt.textContent ?? ""));
    expect(paare).toHaveLength(3);
    for (const dt of paare) expect(dt.nextElementSibling!.textContent).toBe("nicht erfasst");
  });
});
