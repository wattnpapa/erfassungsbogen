/**
 * Die Stapel-Quittung stand unter der Einheitenliste, bei 360 × 640 rund
 * 1 200 px unter dem Bild — wer ein Foto einlas, sah nicht, was ankam
 * (Audit Runde 2, R2-A2). Geprüft wird, dass sie sich ins Bild holt, den
 * Fokus nimmt und gemerkte Teile verwerfen lässt.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StapelQuittung } from "./stapel-quittung";
import { LAGE_ABGLEICH_KURZ, STIFT_HINWEIS, TeileMerker } from "./qr-stapel";

const proto = HTMLElement.prototype as unknown as { scrollIntoView?: (opt?: unknown) => void };
const vorher = proto.scrollIntoView;
afterEach(() => {
  if (vorher === undefined) delete proto.scrollIntoView;
  else proto.scrollIntoView = vorher;
});

describe("StapelQuittung", () => {
  it("holt den Bericht beim Erscheinen ins Bild und setzt den Fokus darauf", () => {
    const gerufen: unknown[] = [];
    proto.scrollIntoView = function (opt?: unknown) { gerufen.push(opt); };
    const { rerender } = render(<StapelQuittung stand="" onAbbrechen={() => {}} bericht={[]} onSchliessen={() => {}} />);
    expect(gerufen).toHaveLength(0);
    rerender(
      <StapelQuittung stand="" onAbbrechen={() => {}} bericht={["1 Bild gelesen — 1 Bogen aufgenommen."]} onSchliessen={() => {}} />,
    );
    expect(gerufen).toEqual([{ block: "nearest" }]);
    const karte = screen.getByRole("region", { name: "Stapel eingelesen" });
    expect(document.activeElement).toBe(karte);
  });

  it("holt die Fortschrittszeile beim Start ins Bild — nicht bei jedem Bild erneut", () => {
    const gerufen: unknown[] = [];
    proto.scrollIntoView = function (opt?: unknown) { gerufen.push(opt); };
    const { rerender } = render(<StapelQuittung stand="0 von 3 Bildern gelesen…" onAbbrechen={() => {}} bericht={[]} onSchliessen={() => {}} />);
    rerender(<StapelQuittung stand="1 von 3 Bildern gelesen…" onAbbrechen={() => {}} bericht={[]} onSchliessen={() => {}} />);
    expect(gerufen).toHaveLength(1);
  });

  it("bietet „Gemerkte Teile verwerfen“ nur an, wenn Teile gemerkt sind", () => {
    const merker = new TeileMerker();
    const verwerfen = vi.spyOn(merker, "verwerfen");
    const schliessen = vi.fn();
    vi.spyOn(merker, "anzahl").mockReturnValue(1);
    render(<StapelQuittung stand="" onAbbrechen={() => {}} bericht={["x"]} onSchliessen={schliessen} merker={merker} />);
    fireEvent.click(screen.getByRole("button", { name: "Gemerkte Teile verwerfen" }));
    expect(verwerfen).toHaveBeenCalled();
    expect(schliessen).toHaveBeenCalled();
  });

  it("ohne gemerkte Teile nur „Schließen“", () => {
    render(<StapelQuittung stand="" onAbbrechen={() => {}} bericht={["x"]} onSchliessen={() => {}} merker={new TeileMerker()} />);
    expect(screen.queryByRole("button", { name: "Gemerkte Teile verwerfen" })).toBeNull();
  });

  it("Abgleich-Knopf steht im Bericht — vor den langen Hinweisen, damit er im Bild bleibt (R4-A6)", () => {
    const abgleich = vi.fn();
    render(
      <StapelQuittung
        stand=""
        onAbbrechen={() => {}}
        bericht={["19 Bilder gelesen — 8 Bögen aufgenommen.", "10 Bilder ohne QR-Code (s-01.png, …) — Bogen- und Übersichtsseiten tragen keinen.", STIFT_HINWEIS, LAGE_ABGLEICH_KURZ]}
        onSchliessen={() => {}}
        onAbgleich={abgleich}
      />,
    );
    const knopf = screen.getByRole("button", { name: "Lage vom Papier abgleichen…" });
    const befund = screen.getByText("19 Bilder gelesen — 8 Bögen aufgenommen.");
    const hinweis = screen.getByText(STIFT_HINWEIS);
    // Reihenfolge im Dokument: Ergebnis, Knopf, Hinweise.
    expect(befund.compareDocumentPosition(knopf) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(knopf.compareDocumentPosition(hinweis) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(knopf);
    expect(abgleich).toHaveBeenCalledTimes(1);
  });

  it("ohne Abgleich (nichts aufgenommen oder nichts vom Papier) kein Knopf", () => {
    render(<StapelQuittung stand="" onAbbrechen={() => {}} bericht={["2 Bilder gelesen — 0 Bögen aufgenommen."]} onSchliessen={() => {}} onAbgleich={() => {}} />);
    expect(screen.queryByRole("button", { name: "Lage vom Papier abgleichen…" })).toBeNull();
  });
});
