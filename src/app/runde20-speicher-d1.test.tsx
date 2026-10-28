/**
 * Runde 20, Block Speicher, R20-D1 (P1): Der Bogen geht beim Schließen, Ersetzen und Zurückholen nicht verloren, auch wenn kein Byte frei
 * ist (jsdom, Speicher mit fester Kapazität). Eigene Datei: Die App-Tests laden die Module neu (`vi.resetModules`), damit der Entwurf beim
 * Laden gelesen wird; das darf die übrigen Tests (nachgeladene Bausteine, Rückfragen) nicht anstecken.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, PersonalErfassung } from "@bos/eeb-format/model";
import { neuePerson, neuerBogen } from "./hilfen";
import { ENTWURF_SCHLUESSEL, entwurfSpeichern, entwurfUeberschreibenErlauben, ersetztenEntwurfAblegen, ersetztenEntwurfLaden } from "./entwurf";

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

const ERSETZT = "eeb.entwurf.ersetzt.v1";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  entwurfUeberschreibenErlauben(); // der Modulzustand „eigener Stand“ soll den nächsten Test nicht als fremdes Löschen deuten
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

function belegung(): number {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    n += k.length + (localStorage.getItem(k) ?? "").length;
  }
  return n;
}

/** Kapazität des Speichers festlegen: Schreiben, das darüber käme, wirft wie der Browser. */
function kapazitaet(grenze: number): void {
  const echt = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
    const alt = this.getItem(k);
    const neu = belegung() - (alt === null ? 0 : k.length + alt.length) + k.length + v.length;
    if (neu > grenze) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    echt.call(this, k, v);
  });
}

function bogenMit(ort: string, leute = 8) {
  const b = neuerBogen();
  b.einheit.organisation = OrganisationsTyp.THW;
  b.einheit.hierarchie[0]!.name = ort;
  b.personalErfassung = PersonalErfassung.VOLLSTAENDIG;
  b.personal = Array.from({ length: leute }, () => neuePerson());
  return b;
}

describe("R20-D1 Ablage des geschlossenen Bogens bei vollem Speicher", () => {
  it("Speicherschicht: voller Speicher, der Bogen zieht vom Entwurfsplatz auf den Rückholplatz um", () => {
    const b = bogenMit("Husum");
    expect(entwurfSpeichern(b, { schritt: 3 })).toBe(true);
    kapazitaet(belegung()); // kein Byte frei
    expect(ersetztenEntwurfAblegen(b, undefined, { ausEntwurf: false })).toBe("voll");
    expect(localStorage.getItem(ERSETZT)).toBeNull();
    expect(localStorage.getItem(ENTWURF_SCHLUESSEL)).not.toBeNull();
    expect(ersetztenEntwurfAblegen(b, undefined, { ausEntwurf: true })).toBe("gemerkt");
    expect(ersetztenEntwurfLaden()?.bogen.einheit.hierarchie[0]!.name).toBe("Husum");
    expect(localStorage.getItem(ENTWURF_SCHLUESSEL)).toBeNull();
  });

  it("Speicherschicht: passt auch der Umzug nicht, bleibt der Entwurf unverändert stehen", () => {
    const b = bogenMit("Husum");
    entwurfSpeichern(b);
    const vorher = localStorage.getItem(ENTWURF_SCHLUESSEL);
    kapazitaet(belegung()); // voll
    // Der freiwerdende Entwurfsplatz fasst etwa einen Bogen; ein größerer passt nicht.
    const gross = bogenMit("Husum", 40);
    expect(ersetztenEntwurfAblegen(gross, undefined, { ausEntwurf: true })).toBe("voll");
    expect(localStorage.getItem(ENTWURF_SCHLUESSEL)).toBe(vorher);
    expect(localStorage.getItem(ERSETZT)).toBeNull();
  });

  async function startseiteMitEntwurf(ort: string) {
    expect(entwurfSpeichern(bogenMit(ort), { schritt: 3 })).toBe(true);
    expect(localStorage.getItem(ENTWURF_SCHLUESSEL)).not.toBeNull();
    vi.resetModules();
    const { App } = await import("./app");
    // Neue Modulinstanz: Prellschutz der Rückfragen und Tipp-Sperre gehören ihr, nicht dem Setup.
    (await import("./dialoge")).prellschutzSetzen(0);
    const schutz = (await import("./tipp-schutz")).tippSchutzZuruecksetzen;
    render(<App />);
    await waitFor(() => expect(document.querySelector(".entwurf-karte")).not.toBeNull());
    return schutz;
  }

  it("App: „Bogen schließen“ bei vollem Speicher legt den Bogen ab (nichts geht verloren)", async () => {
    const tippSchutzZuruecksetzen = await startseiteMitEntwurf("Ablagehausen");
    kapazitaet(belegung());
    const nutzer = userEvent.setup();
    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    const frage = await screen.findByRole("dialog", { name: "Angefangenen Bogen schließen?" });
    tippSchutzZuruecksetzen(); // der Doppeltipp-Schutz gehört zu echten Fingern, hier klickt die Prüfung zweimal an derselben Stelle
    await nutzer.click(within(frage).getByRole("button", { name: "Bogen schließen" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Zuletzt geschlossenen Bogen zurückholen" })).toBeDefined());
    expect(ersetztenEntwurfLaden()?.bogen.einheit.hierarchie[0]!.name).toBe("Ablagehausen");
    expect(localStorage.getItem(ENTWURF_SCHLUESSEL)).toBeNull();
  }, 30000);

  it("App: geht die Ablage nicht, bleibt der Bogen offen und die Meldung nennt den Weg über die Datei", async () => {
    const tippSchutzZuruecksetzen = await startseiteMitEntwurf("Wartehausen");
    const vorher = localStorage.getItem(ENTWURF_SCHLUESSEL);
    // Der Speicher nimmt den Rückholplatz nicht an (gesperrt oder zu klein).
    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === ERSETZT) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      echt.call(this, k, v);
    });
    const nutzer = userEvent.setup();
    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    const frage = await screen.findByRole("dialog", { name: "Angefangenen Bogen schließen?" });
    tippSchutzZuruecksetzen();
    await nutzer.click(within(frage).getByRole("button", { name: "Bogen schließen" }));
    const meldung = await screen.findByRole("dialog", { name: /Nicht geschlossen — Speicher voll/ }, { timeout: 5000 });
    expect(meldung.textContent).toContain("Der Bogen bleibt offen, nichts hat sich geändert");
    expect(within(meldung).getByRole("button", { name: "Bogen als Datei sichern" })).toBeDefined();
    await nutzer.click(within(meldung).getByRole("button", { name: "Bogen bleibt offen" }));
    expect(localStorage.getItem(ENTWURF_SCHLUESSEL)).toBe(vorher);
    expect(localStorage.getItem(ERSETZT)).toBeNull();
    expect(screen.queryByRole("button", { name: "Fortsetzen" })).not.toBeNull();
  }, 30000);
});
