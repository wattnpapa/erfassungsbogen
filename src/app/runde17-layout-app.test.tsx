/**
 * Runde 17, Block Layout: Verhalten der ganzen App (jsdom) — Fußleiste und Kopf des Assistenten in der Erfassung für eine
 * Sammlung (H6, M3, N7, L2), Weiter im Takt von 0,6 s (G11) und die gebündelte Meldung bei mehreren unlesbaren Dateien (G13).
 * Die Maße selbst sind im Produktionsbuild gemessen (Bericht); die Stilregeln prüft runde17-layout.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsatzAnlegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";
import { entwurfZuJson } from "./entwurf";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";

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
// Die Landesvorlagen (rund 300 Beispielbögen per Glob) braucht hier niemand; der späte Import risse nach dem Testende ab.
vi.mock("../vokabulare/landesvorlagen", () => ({
  bereichLabel: (s: string) => s,
  bundeslandLabel: (s: string) => s,
  hatLandesvorlagen: () => false,
  landesvorlagenBundeslaender: () => [],
  landesvorlagenGruppen: () => [],
  landesvorlage: () => undefined,
}));

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
});

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

/** Eine angefangene Erfassung für eine Sammlung liegt als Entwurf bereit; die App öffnet sie beim Start. */
function erfassungFuerSammlung(name: string, nurStaerke: boolean) {
  const sammlung = einsatzAnlegen(name, EinsatzArt.EINSATZ);
  const bogen = bogenMitName("Rottweil");
  if (nurStaerke) bogen.personalErfassung = PersonalErfassung.NUR_STAERKE;
  localStorage.setItem(
    "eeb.entwurf.v1",
    entwurfZuJson(bogen, Date.now(), { schritt: 0, fremd: { einsatzId: sammlung.id, beginn: Date.now() } }),
  );
}

/** Die App neu laden: Sie liest den Entwurf beim Start (frische Module, Speicher wie in main.tsx verdrahtet). */
async function kalterStart() {
  vi.resetModules();
  (await import("./speicher-browser")).speicherVerdrahten();
  const { App: AppKalt } = await import("./app");
  render(<AppKalt />);
}

describe("Fußleiste und Kopf der Erfassung für eine Sammlung (R17-H6, M3, N7, L2)", () => {
  beforeEach(() => {
    localStorage.clear();
    tippSchutzZuruecksetzen();
  });

  it("Schnellerfassung: „In Einsatz übernehmen“ ist der Hauptknopf, „Weiter →“ der Nebenknopf; der Name bleibt voll", async () => {
    erfassungFuerSammlung("Hochwasser Deich", true);
    await kalterStart();
    const abschluss = await screen.findByRole("button", { name: "In Einsatz übernehmen" });
    const leiste = document.querySelector("footer.nav")!;
    expect(leiste.classList.contains("uebernehmen-haupt")).toBe(true);
    // Auf schmalen Telefonen blendet das Stylesheet „In Einsatz“ aus und zeigt „Übernehmen“; beide Teile stehen im Knopf.
    expect(abschluss.querySelector(".nav-einsatz")?.textContent).toBe("In Einsatz ");
    expect(abschluss.querySelector(".nav-ue")?.textContent).toBe("übernehmen");
    expect(abschluss.textContent).toBe("In Einsatz übernehmen");
    expect(abschluss.getAttribute("aria-label")).toBe("In Einsatz übernehmen");
    const weiter = within(leiste as HTMLElement).getByRole("button", { name: "Weiter →" });
    expect(weiter.classList.contains("nav-weiter")).toBe(true);
    // „◐“ bleibt im Baum (querformat) — nur das Stylesheet blendet ihn am Telefon aus.
    expect(leiste.querySelector(".anzeige-leiste")).not.toBeNull();
  });

  it("manuelle Aufnahme: Weiter bleibt der Hauptknopf (keine Umkehrung)", async () => {
    erfassungFuerSammlung("Hochwasser Deich", false);
    await kalterStart();
    await screen.findByRole("button", { name: "In Einsatz übernehmen" });
    expect(document.querySelector("footer.nav")!.classList.contains("uebernehmen-haupt")).toBe(false);
  });

  it("der Rücksprung nennt den Einsatznamen; die Marke „Aufnahme für: …“ trägt die Klasse, mit der das Telefon sie ausblendet", async () => {
    erfassungFuerSammlung("Hochwasser Nordwest Musterstadt", false);
    await kalterStart();
    await screen.findByRole("button", { name: "In Einsatz übernehmen" });
    expect(screen.getByRole("button", { name: /‹ Einsatz „Hochwasser Nordwest Musterstadt"/ })).toBeDefined();
    const marke = document.querySelector(".modus-marke.marke-einsatz")!;
    expect(marke.textContent).toBe("Aufnahme für: Hochwasser Nordwest Musterstadt");
  });
});

describe("Weiter im Assistenten im Takt von 0,6 s (R17-G11)", () => {
  beforeEach(() => {
    localStorage.clear();
    tippSchutzZuruecksetzen();
  });

  it("jeder Tipp im Abstand von 0,6 s wechselt den Schritt; der Doppeltipp nach 0,3 s bleibt gesperrt", async () => {
    let jetzt = 1_800_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => jetzt);
    render(<App />);
    const tipp = (el: HTMLElement) =>
      act(() => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 290, clientY: 606, detail: 1 }));
      });
    const schritt = () => screen.getByRole("heading", { level: 2, name: /^\d\. / }).textContent;

    tipp(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await screen.findByRole("heading", { level: 2, name: "1. Einheit" });
    expect(schritt()).toMatch(/^1\./);
    jetzt += 1000; // gelesen, dann „Weiter“ (Sperre der Ansicht: 0,6 s)
    tipp(screen.getByRole("button", { name: "Weiter →" }));
    expect(schritt()).toMatch(/^2\./);
    jetzt += 300; // Doppeltipp
    tipp(screen.getByRole("button", { name: "Weiter →" }));
    expect(schritt()).toMatch(/^2\./);
    // Ab hier im Takt von 0,6 s: Vorher blieb jeder zweite Tipp liegen (Sperre 0,9 s).
    jetzt += 600;
    tipp(screen.getByRole("button", { name: "Weiter →" }));
    expect(schritt()).toMatch(/^3\./);
    jetzt += 600;
    tipp(screen.getByRole("button", { name: "Weiter →" }));
    expect(schritt()).toMatch(/^4\./);
  });
});

describe("Mehrere unlesbare Dateien auf einmal (R17-G13)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("elf gleich defekte Bögen ergeben eine Meldung mit Zahl und Dateinamen statt elf gleicher Absätze", async () => {
    const nutzer = userEvent.setup({ applyAccept: false });
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    await nutzer.type(within(dialog).getByLabelText("Name"), "Stapelprobe");
    await nutzer.click(within(dialog).getByRole("button", { name: "Einsatz anlegen" }));
    await screen.findByRole("heading", { level: 1, name: "Stapelprobe" });

    // Jede Datei trägt einen Bogen ohne Stand: gleiche Ursache, verschiedene Namen.
    const dateien = Array.from({ length: 11 }, (_, i) => {
      const bogen = bogenMitName(`OV Beispiel ${i + 1}`) as unknown as Record<string, unknown>;
      delete bogen.stand;
      return new File([JSON.stringify(bogen)], `bogen-${String(i + 1).padStart(2, "0")}.json`, { type: "application/json" });
    });
    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), dateien);

    const quittung = await waitFor(() => {
      const q = document.querySelector<HTMLElement>(".einlese-quittung");
      expect(q).not.toBeNull();
      return q!;
    });
    const text = quittung.textContent ?? "";
    expect(text).toMatch(/kein Bogen lesbar/);
    expect(text).toMatch(/11 Dateien/);
    expect(text).toContain("„bogen-01.json“");
    // Der Satz steht einmal, nicht elfmal.
    expect(text.match(/kein Bogen lesbar/g)).toHaveLength(1);
    expect(quittung.querySelectorAll("p").length).toBeLessThanOrEqual(5);
  }, 30000);
});
