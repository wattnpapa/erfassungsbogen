/**
 * Der Abgang darf erst nach der Rückfrage laufen. Andersherum stünde die
 * Karte bei „Abbrechen" unsichtbar in der Liste: die Abgangs-Animation hält
 * ihren Endzustand (`forwards`), und weggenommen wurde nichts.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AbgangKnopf, Kartenstapel } from "./kartenstapel";

function Karte(props: { bestaetigen?: () => Promise<boolean>; onAusfuehren: () => void }) {
  return (
    <Kartenstapel className="karte">
      <AbgangKnopf bestaetigen={props.bestaetigen} onAusfuehren={props.onAusfuehren}>
        Löschen
      </AbgangKnopf>
    </Kartenstapel>
  );
}

describe("AbgangKnopf", () => {
  it("nimmt die Karte weg, wenn keine Rückfrage nötig ist", async () => {
    const nutzer = userEvent.setup();
    const wegnehmen = vi.fn();
    render(<Karte onAusfuehren={wegnehmen} />);

    await nutzer.click(screen.getByRole("button", { name: "Löschen" }));

    expect(wegnehmen).toHaveBeenCalledTimes(1);
  });

  it("lässt die Karte unberührt, wenn die Rückfrage abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    const wegnehmen = vi.fn();
    render(<Karte bestaetigen={async () => false} onAusfuehren={wegnehmen} />);

    await nutzer.click(screen.getByRole("button", { name: "Löschen" }));

    expect(wegnehmen).not.toHaveBeenCalled();
    // Entscheidend: auch der Abgang darf nicht gelaufen sein.
    expect(document.querySelector(".karte")!.classList.contains("geht")).toBe(false);
  });

  it("nimmt die Karte nach bestätigter Rückfrage weg", async () => {
    const nutzer = userEvent.setup();
    const wegnehmen = vi.fn();
    render(<Karte bestaetigen={async () => true} onAusfuehren={wegnehmen} />);

    await nutzer.click(screen.getByRole("button", { name: "Löschen" }));

    expect(wegnehmen).toHaveBeenCalledTimes(1);
  });
});

describe("Kartenstapel", () => {
  it("stempelt nur die Karte ein, die gerade dazukam", () => {
    const { container } = render(
      <>
        <Kartenstapel className="karte">alt</Kartenstapel>
        <Kartenstapel className="karte" frisch>neu</Kartenstapel>
      </>,
    );
    const karten = [...container.querySelectorAll("section.karte")];
    expect(karten.map((k) => k.classList.contains("kommt"))).toEqual([false, true]);
  });
});
