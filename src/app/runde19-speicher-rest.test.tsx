/**
 * Runde 19, Block Speicher, Rest: D2, D3, D8, D9, W10, S12, S13, K4/N2/E1, A2, K8, N6, M12/H11/E11/N13.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuerBogen } from "./hilfen";
import { prellschutzSetzen } from "./dialoge";
import { arbeitetZuruecksetzen } from "./arbeitet";
import { ORTSSPERRE_RADIUS_PX, ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  prellschutzSetzen(0);
  arbeitetZuruecksetzen();
  vi.restoreAllMocks();
});

function bogenMitName(name: string, uebung = false) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  if (uebung) b.uebung = true;
  return b;
}

describe("R19-E1 „Abbrechen“ in einer Rückfrage gibt die Stelle des öffnenden Knopfs frei", () => {
  const tipp = (el: Element, x: number, y: number) =>
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1 }));

  it("der erneute Tipp auf „Entfernen“ gleich nach „Abbrechen“ kommt an", () => {
    tippSchutzZuruecksetzen();
    const entfernen = document.createElement("button");
    entfernen.textContent = "Entfernen";
    const getroffen = vi.fn();
    entfernen.addEventListener("click", getroffen);
    const dialog = document.createElement("dialog");
    dialog.className = "abfrage";
    dialog.setAttribute("open", "");
    const abbrechen = document.createElement("button");
    abbrechen.textContent = "Abbrechen";
    dialog.append(abbrechen);
    document.body.append(entfernen, dialog);

    tipp(entfernen, 100, 300); // öffnet die Rückfrage
    ortSperren(1200, { x: 100, y: 300 }, { nurAusserhalbRueckfrage: true });
    tipp(abbrechen, 100, 500);
    dialog.remove();
    tipp(entfernen, 100 + ORTSSPERRE_RADIUS_PX / 4, 300); // 0,9 s später, derselbe Ort
    expect(getroffen).toHaveBeenCalledTimes(2);
    entfernen.remove();
  });
});

// ------------------------------------------------------------------------------------------------ D8

describe("R19-D8 Der Rückholplatz fasst einen Bogen: der alte kann vorher als Datei gesichert werden", () => {
  it("die Rückfrage bietet „vorher als Datei sichern“ neben „endgültig löschen“", async () => {
    localStorage.clear();
    const nutzer = userEvent.setup();
    const { entwurfZuJson } = await import("./entwurf");
    localStorage.setItem("eeb.entwurf.v1", entwurfZuJson(bogenMitName("Zweiter"), Date.now() - 60_000));
    localStorage.setItem("eeb.entwurf.ersetzt.v1", entwurfZuJson(bogenMitName("Eigener"), Date.now() - 120_000));
    vi.resetModules();
    const { App } = await import("./app");
    render(<App />);
    await nutzer.click(await screen.findByRole("button", { name: "Neuen Bogen erstellen" }));
    const frage = await screen.findByRole("dialog", { name: "Neuen Bogen anfangen?" });
    expect(frage.textContent).toMatch(/THW Eigener.*wird dabei endgültig gelöscht: Er fasst nur einen Bogen/);
    expect(within(frage).getByRole("button", { name: /den alten Bogen vorher als Datei sichern/ })).toBeDefined();
    expect(within(frage).getByRole("button", { name: /alten Bogen endgültig löschen/ })).toBeDefined();
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Eigener");
  }, 20000);
});
