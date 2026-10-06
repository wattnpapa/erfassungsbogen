/**
 * Anzeigemodus-Umschalter, klappbare Form im Assistenten-Kopf (Audit Runde 2,
 * R2-H7): Auf dem Telefon steht nur der gewählte Modus als Klappknopf im Kopf,
 * die vier Segmente klappen auf. Ausgeblendet wird per CSS — im Baum müssen
 * immer alle vier Segmente stehen, sonst wäre der Umschalter für Tastatur
 * und Vorlesesoftware auf breiten Fenstern (dort ist der Klappknopf
 * unsichtbar) nicht mehr bedienbar.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnzeigeLeistenKnopf, AnzeigeSchalter, ankerInBildmitte } from "./anzeige-schalter";
import { anzeigeModus, NACHT_KOPF_FOND } from "./anzeige-modus";
import { wendeOrgAkzentAn, orgAkzentPalette } from "./org-farben";
import { OrganisationsTyp } from "@bos/eeb-format/model";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

describe("AnzeigeSchalter", () => {
  it("ohne klappbar: vier Segmente, kein Klappknopf", () => {
    render(<AnzeigeSchalter />);
    const gruppe = screen.getByRole("group", { name: "Anzeigemodus" });
    expect(gruppe.querySelectorAll("button")).toHaveLength(4);
    expect(gruppe.querySelector(".anzeige-klappe")).toBeNull();
  });

  it("klappbar: Klappknopf nennt den gewählten Modus und steuert aufgeklappt/zu", async () => {
    const u = userEvent.setup();
    render(<AnzeigeSchalter klappbar />);
    const gruppe = screen.getByRole("group", { name: "Anzeigemodus" });
    const klappe = screen.getByRole("button", { name: /^Anzeigemodus Standard/ });
    expect(klappe.getAttribute("aria-expanded")).toBe("false");
    expect(gruppe.classList.contains("offen")).toBe(false);
    // Alle vier Segmente stehen trotzdem im Baum.
    for (const name of ["Standard", "Dunkel", "Feld", "Nacht"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }

    await u.click(klappe);
    expect(klappe.getAttribute("aria-expanded")).toBe("true");
    expect(gruppe.classList.contains("offen")).toBe(true);

    // Eine Wahl setzt den Modus und klappt wieder zu.
    await u.click(screen.getByRole("button", { name: "Nacht" }));
    expect(anzeigeModus()).toBe("nacht");
    expect(gruppe.classList.contains("offen")).toBe(false);
    expect(screen.getByRole("button", { name: /^Anzeigemodus Nacht/ }).getAttribute("aria-expanded")).toBe("false");
  });
});

/**
 * Browserleiste (Audit Runde 2, R2-L6): Sie trug auch nachts die Kennfarbe —
 * Android färbt damit Status- und Adressleiste ein. Nachts nimmt sie den
 * dunklen Kopf-Ton, sonst die Kennfarbe der Organisation, und das in beiden
 * Reihenfolgen (erst Modus, dann Bogen — und umgekehrt).
 */
describe("theme-color folgt dem Anzeigemodus", () => {
  function metaFarbe(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content;
  }
  beforeEach(() => {
    document.head.querySelector('meta[name="theme-color"]')?.remove();
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = "#12275e";
    document.head.append(meta);
    wendeOrgAkzentAn(undefined);
  });

  it("nachts dunkler Kopf-Ton, beim Zurückschalten wieder die Kennfarbe", async () => {
    const u = userEvent.setup();
    render(<AnzeigeSchalter />);
    wendeOrgAkzentAn(OrganisationsTyp.FEUERWEHR);
    const kennfarbe = orgAkzentPalette(OrganisationsTyp.FEUERWEHR).akzent;
    expect(metaFarbe()).toBe(kennfarbe);

    await u.click(screen.getByRole("button", { name: "Nacht" }));
    expect(metaFarbe()).toBe(NACHT_KOPF_FOND);
    // Ein Bogen, der nachts geöffnet wird, färbt die Leiste nicht zurück.
    wendeOrgAkzentAn(OrganisationsTyp.THW);
    expect(metaFarbe()).toBe(NACHT_KOPF_FOND);

    await u.click(screen.getByRole("button", { name: "Dunkel" }));
    expect(metaFarbe()).toBe(orgAkzentPalette(OrganisationsTyp.THW).akzent);
    wendeOrgAkzentAn(undefined);
    expect(metaFarbe()).toBe("#12275e");
  });
});

describe("theme-color im Dunkel-Modus folgt dem abgedunkelten Kopfbalken (R4-L2)", () => {
  function metaFarbe(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content;
  }
  beforeEach(() => {
    document.head.querySelector('meta[name="theme-color"]')?.remove();
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = "#12275e";
    document.head.append(meta);
    wendeOrgAkzentAn(undefined);
  });

  it("DRK: Standard die Kennfarbe, Dunkel der abgedunkelte Ton, wieder Standard die Kennfarbe", async () => {
    const u = userEvent.setup();
    render(<AnzeigeSchalter />);
    wendeOrgAkzentAn(OrganisationsTyp.DRK);
    const p = orgAkzentPalette(OrganisationsTyp.DRK);
    await u.click(screen.getByRole("button", { name: "Standard" }));
    expect(metaFarbe()).toBe(p.akzent);
    await u.click(screen.getByRole("button", { name: "Dunkel" }));
    expect(p.kopfDunkel).not.toBe(p.akzent);
    expect(metaFarbe()).toBe(p.kopfDunkel);
    // Ein später geöffneter Bogen folgt dem Modus, in dem das Gerät steht.
    wendeOrgAkzentAn(OrganisationsTyp.FEUERWEHR);
    expect(metaFarbe()).toBe(orgAkzentPalette(OrganisationsTyp.FEUERWEHR).kopfDunkel);
    await u.click(screen.getByRole("button", { name: "Feld" }));
    expect(metaFarbe()).toBe(orgAkzentPalette(OrganisationsTyp.FEUERWEHR).akzent);
  });
});

describe("AnzeigeLeistenKnopf (R3-L6)", () => {
  it("klappt die vier Modi auf, wählt mit dem zweiten Tipp und klappt wieder zu", async () => {
    const u = userEvent.setup();
    render(<AnzeigeLeistenKnopf />);
    const knopf = screen.getByRole("button", { name: /^Anzeigemodus Standard – ändern/ });
    expect(screen.queryByRole("group", { name: "Anzeigemodus" })).toBeNull();
    await u.click(knopf);
    expect(knopf.getAttribute("aria-expanded")).toBe("true");
    await u.click(screen.getByRole("button", { name: "Nacht" }));
    expect(anzeigeModus()).toBe("nacht");
    expect(document.documentElement.classList.contains("nacht-modus")).toBe(true);
    expect(screen.queryByRole("group", { name: "Anzeigemodus" })).toBeNull();
    expect(screen.getByRole("button", { name: /^Anzeigemodus Nacht/ })).toBeTruthy();
  });

  it("schließt mit Escape, ohne zu wählen", async () => {
    const u = userEvent.setup();
    render(<AnzeigeLeistenKnopf />);
    await u.click(screen.getByRole("button", { name: /^Anzeigemodus/ }));
    await u.keyboard("{Escape}");
    expect(screen.queryByRole("group", { name: "Anzeigemodus" })).toBeNull();
    expect(anzeigeModus()).toBe("standard");
  });
});

/**
 * Audit Runde 4, R4-L3: Der Anker für „die Stelle bleibt" ist ein kleines
 * Element um die Bildmitte, nicht die ganze Karte, die dort liegt.
 */
describe("ankerInBildmitte (R4-L3)", () => {
  /** Ein Dokument, dessen elementFromPoint je Punkt ein vorbereitetes Element liefert. */
  function szene(treffer: (x: number, y: number) => HTMLElement | null) {
    const dok = document.implementation.createHTMLDocument("t");
    const fenster = { innerWidth: 360, innerHeight: 640, getComputedStyle: () => ({ position: "static" }) } as unknown as Window;
    const el = (hoehe: number, breite = 200): HTMLElement => {
      const e = dok.createElement("div");
      e.getBoundingClientRect = () => ({ width: breite, height: hoehe, top: 0, left: 0, right: breite, bottom: hoehe }) as DOMRect;
      dok.body.appendChild(e);
      return e;
    };
    dok.elementFromPoint = (x, y) => treffer(x, y) ?? dok.body;
    return { dok, fenster, el };
  }

  it("nimmt bei einer Karte in der Mitte das nächste kleine Element darüber oder darunter", () => {
    const s = szene(() => null);
    const karte = s.el(900); // die ganze Personenkarte: 900 px hoch
    const feld = s.el(44);
    s.dok.elementFromPoint = (_x, y) => (y === 320 ? karte : y === 320 + 24 ? feld : s.dok.body);
    expect(ankerInBildmitte(s.dok, s.fenster)).toBe(feld);
  });

  it("bleibt beim kleinen Element in der Mitte", () => {
    const s = szene(() => null);
    const zeile = s.el(30);
    s.dok.elementFromPoint = () => zeile;
    expect(ankerInBildmitte(s.dok, s.fenster)).toBe(zeile);
  });

  it("überspringt fest positionierte Elemente (Leiste, Quittung)", () => {
    const s = szene(() => null);
    const leiste = s.el(60);
    const text = s.el(30);
    (s.fenster as unknown as { getComputedStyle: (e: Element) => { position: string } }).getComputedStyle = (e) => ({
      position: e === leiste ? "fixed" : "static",
    });
    s.dok.elementFromPoint = (_x, y) => (y === 320 ? leiste : text);
    expect(ankerInBildmitte(s.dok, s.fenster)).toBe(text);
  });

  it("fällt auf das Element in der Mitte zurück, wenn nichts Kleines da ist", () => {
    const s = szene(() => null);
    const gross = s.el(900);
    s.dok.elementFromPoint = () => gross;
    expect(ankerInBildmitte(s.dok, s.fenster)).toBe(gross);
  });
});
