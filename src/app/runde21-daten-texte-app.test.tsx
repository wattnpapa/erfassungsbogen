/**
 * Runde 21, Block Daten und Texte, Abläufe der ganzen App (jsdom): Organisation der Schnellerfassung (W2, H2), eine Zählung (A3 …),
 * Pflichtfeld am Reiter (N3), „Entwurf wiederhergestellt“ nur einmal (A5), Platz für die Speicherzeile (A9), „Bogen schließen“ bei
 * vollem Speicher (H6). Jeder Test lädt die App neu (`vi.resetModules`), weil sie den Entwurf beim Laden des Moduls liest.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen } from "@bos/meldekopf/einsaetze";
import { einheitAnzeigename, neuePerson, neuerBogen } from "./hilfen";
import { entwurfSpeichern, entwurfUeberschreibenErlauben } from "./entwurf";
import { SCHNELL_ORGANISATION_SCHLUESSEL } from "./schnell-organisation";
import { SPEICHER_GRENZE_ZEICHEN, speicherBelegung } from "./eintrag-zeiten";

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  entwurfUeberschreibenErlauben();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

const statisch = await import("./app");

/**
 * Die App rendern. Liegt ein Entwurf im Speicher, werden die Module neu geladen (die App liest ihn beim Laden); sonst genügt die
 * Instanz, die das Testsetup verdrahtet hat (Speicherhülle, nachgeladene Brocken).
 */
async function appStarten() {
  if (localStorage.getItem("eeb.entwurf.v1") === null) {
    const { tippSchutzZuruecksetzen } = await import("./tipp-schutz");
    render(<statisch.App />);
    return { tippSchutzZuruecksetzen };
  }
  vi.resetModules();
  const { App } = await import("./app");
  (await import("./dialoge")).prellschutzSetzen(0);
  (await import("./speicher-browser")).speicherVerdrahten();
  const tippSchutzZuruecksetzen = (await import("./tipp-schutz")).tippSchutzZuruecksetzen;
  render(<App />);
  return { tippSchutzZuruecksetzen };
}

const ortFeld = () => screen.getByLabelText("Ort der Einheit (Pflicht)");
const orgFeld = () => screen.getByLabelText("Organisation") as HTMLSelectElement;

describe("R21-W2, H2: Schnellerfassung, Organisation sichtbar und nie still THW", () => {
  it("steht im ersten Bild, nicht im Aufklapper, und wird mit der letzten Wahl vorbelegt", async () => {
    const nutzer = userEvent.setup();
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    const feld = orgFeld();
    expect(feld.closest("details.schnell-mehr")).toBeNull(); // sichtbar, nicht unter „Organisation, Ebene, Kontakt (optional)“
    expect(feld.value).toBe(String(OrganisationsTyp.THW)); // erste Nutzung: THW, aber sichtbar
    await nutzer.selectOptions(feld, String(OrganisationsTyp.DRK));
    expect(localStorage.getItem(SCHNELL_ORGANISATION_SCHLUESSEL)).toBe(String(OrganisationsTyp.DRK));
    expect(orgFeld().value).toBe(String(OrganisationsTyp.DRK));

    // Eine neue Schnellerfassung beginnt mit DRK.
    cleanup();
    localStorage.removeItem("eeb.entwurf.v1");
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    expect(orgFeld().value).toBe(String(OrganisationsTyp.DRK));
  }, 30000);

  it("„DRK Bremen“ wird als DRK abgelegt, nicht als „THW DRK Bremen“ (Test mit DRK)", async () => {
    const nutzer = userEvent.setup();
    const einsatz = einsatzAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Einheit schnell erfassen — für welche Sammlung?" })).getByRole("button", { name: /Für „Sammelhausen" erfassen/ }));
    await nutzer.selectOptions(orgFeld(), String(OrganisationsTyp.DRK));
    await nutzer.type(ortFeld(), "Bremen");
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Stärke fehlt" })).getByRole("button", { name: "Trotzdem mit Stärke 0 übernehmen" }));
    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
    const bogen = einsaetzeLaden().find((x) => x.id === einsatz.id)!.eintraege[0]!.bogen;
    expect(bogen.einheit.organisation).toBe(OrganisationsTyp.DRK);
    expect(einheitAnzeigename(bogen.einheit)).toBe("DRK Bremen");
    expect(document.body.textContent).not.toContain("THW DRK");
  }, 30000);

  it("„Feuerwehr Husum“ bei Organisation THW: die Zeile fragt und stellt auf Feuerwehr um, nichts geschieht still", async () => {
    const nutzer = userEvent.setup();
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    await nutzer.type(ortFeld(), "Feuerwehr Husum");
    await nutzer.tab(); // das Feld verlassen
    const hinweis = await waitFor(() => {
      const p = document.querySelector<HTMLElement>("p.organisation-im-ort");
      expect(p).not.toBeNull();
      return p!;
    });
    expect(hinweis.textContent).toContain("klingt nach Feuerwehr");
    expect(hinweis.textContent).toContain("die Organisation steht auf THW");
    expect(orgFeld().value).toBe(String(OrganisationsTyp.THW)); // noch unverändert
    await nutzer.click(within(hinweis).getByRole("button", { name: "Auf Feuerwehr stellen" }));
    expect(orgFeld().value).toBe(String(OrganisationsTyp.FEUERWEHR));
    expect((ortFeld() as HTMLInputElement).value).toBe("Husum"); // der Ort geht beim Umstellen nicht verloren, die Organisation steht nicht doppelt
    expect(document.querySelector("p.organisation-im-ort")).toBeNull();
    expect(localStorage.getItem(SCHNELL_ORGANISATION_SCHLUESSEL)).toBe(String(OrganisationsTyp.FEUERWEHR));
  }, 30000);
});

describe("R21-A3 … S2: Kopf, Überschrift, Reiter und Rücklink zählen gleich", () => {
  it("Schnellerfassung: „Schritt n von 4“ im Kopf, Überschrift „n.“, vier Reiter, Rücklink in der Übersicht", async () => {
    const nutzer = userEvent.setup();
    const einsatz = einsatzAnlegen("Zählhausen", EinsatzArt.EINSATZ);
    void einsatz;
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Einheit schnell erfassen — für welche Sammlung?" })).getByRole("button", { name: /Für „Zählhausen" erfassen/ }));
    await nutzer.type(ortFeld(), "Schnellhausen");
    const kopf = () => document.querySelector(".schritte-schnell-kurz")!.textContent!;
    const ueberschrift = () => document.querySelector("main h2")!.textContent!;
    const reiter = () => [...document.querySelectorAll(".schritte button")].map((b) => b.textContent!.replace(/\s+/g, " ").trim());
    expect(kopf()).toBe("Schritt 1 von 4: Einheit");
    expect(ueberschrift()).toBe("1. Einheit");
    expect(reiter().map((t) => t.slice(0, 2))).toEqual(["1.", "2.", "3.", "4."]);
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    expect(kopf()).toBe("Schritt 2 von 4: Personal");
    expect(ueberschrift()).toBe("2. Personal");
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    expect(kopf()).toBe("Schritt 3 von 4: Fahrzeuge");
    expect(ueberschrift()).toBe("3. Fahrzeuge");
    // Der Reiter trägt dieselbe Nummer und denselben Namen wie die Überschrift.
    expect(screen.getByRole("button", { name: /^3\. Fahrzeuge/ }).getAttribute("aria-current")).toBe("step");
    await nutzer.click(screen.getByRole("button", { name: "Zur Übersicht →" }));
    expect(screen.getByRole("button", { name: "← Zurück zu Schritt 3 (Fahrzeuge)" })).toBeDefined();
    expect(kopf()).toBe("Schritt 4 von 4: Übersicht");
  }, 30000);

  it("Rückfrage „Stärke fehlt“ springt zum Personal, ohne eine Nummer zu nennen, die es in der Schnellerfassung nicht gibt", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Rückfragehausen", EinsatzArt.EINSATZ);
    void s;
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Einheit schnell erfassen — für welche Sammlung?" })).getByRole("button", { name: /Für „Rückfragehausen" erfassen/ }));
    await nutzer.type(ortFeld(), "Nullhausen");
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
    const frage = await screen.findByRole("dialog", { name: "Stärke fehlt" });
    expect(frage.textContent).not.toMatch(/3\. Personal/);
    expect(frage.textContent).toContain("Springt zum Personal.");
    await nutzer.click(within(frage).getByRole("button", { name: "Stärke eintragen" }));
    expect(await screen.findByRole("heading", { level: 2, name: "2. Personal" })).toBeDefined();
  }, 30000);

  it("der volle Bogen zählt weiter 1 bis 6", async () => {
    const nutzer = userEvent.setup();
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    expect([...document.querySelectorAll(".schritte button")].map((b) => b.textContent!.trim().slice(0, 2))).toEqual(["1.", "2.", "3.", "4.", "5.", "6."]);
  }, 30000);
});

describe("R21-N3: Pflichtfeld „Ort der Einheit“ am Reiter", () => {
  it("Reiter 1 trägt „fehlt“, sobald man Schritt 1 ohne Ort verlassen hat, und verliert es mit dem Ort", async () => {
    const nutzer = userEvent.setup();
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    const reiter1 = () => screen.getAllByRole("button").find((b) => /^1\. Einheit/.test(b.getAttribute("aria-label") ?? b.textContent ?? ""))!;
    expect(reiter1().textContent).not.toContain("fehlt"); // auf Schritt 1 selbst: kein Vorwurf vor der Eingabe
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    await screen.findByRole("heading", { level: 2, name: "2. Einsatz" });
    expect(reiter1().textContent).toContain("fehlt");
    expect(reiter1().getAttribute("aria-label")).toContain("hier fehlt noch etwas");
    await nutzer.click(reiter1());
    await nutzer.type(ortFeld(), "Husum");
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    await screen.findByRole("heading", { level: 2, name: "2. Einsatz" });
    // Mit Ort, aber ohne Typ: weiter „fehlt“ (begonnen) – vorher ohne Ort stand dort nichts.
    expect(reiter1().textContent).toContain("fehlt");
  }, 30000);
});

describe("R21-A5: „Entwurf wiederhergestellt“ steht im Assistenten nur einmal", () => {
  /** Eine angefangene Erfassung für eine Sammlung öffnet nach dem Neuladen gleich den Assistenten (ohne Startseite). */
  function erfassungAblegen(ort: string, mitInhalt = true) {
    const einsatz = einsatzAnlegen("Wiederhausen", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = ort;
    if (mitInhalt) b.personal = [{ ...neuePerson(), vorname: "A", nachname: "Beispiel" }];
    expect(entwurfSpeichern(b, { schritt: 0, fremd: { einsatzId: einsatz.id, beginn: Date.now() } })).toBe(true);
  }
  const hinweis = () => [...document.querySelectorAll("main p.meldung")].find((p) => p.textContent!.includes("Entwurf vom"));

  it("erscheint beim Wiederöffnen und ist nach dem ersten Schritt weg, auch beim Zurückgehen", async () => {
    const nutzer = userEvent.setup();
    erfassungAblegen("Husum");
    await appStarten();
    await screen.findByRole("heading", { level: 2, name: "1. Einheit" });
    await waitFor(() => expect(hinweis()).toBeDefined());
    expect(hinweis()!.textContent).toContain("Die Aufnahme läuft dort weiter, wo du warst.");
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    await waitFor(() => expect(hinweis()).toBeUndefined());
    await nutzer.click(screen.getByRole("button", { name: "← Zurück" }));
    expect(hinweis()).toBeUndefined(); // kommt nicht auf jedem Schritt wieder
  }, 30000);

  it("ist nach der ersten Eingabe weg", async () => {
    const nutzer = userEvent.setup();
    erfassungAblegen("Husum");
    await appStarten();
    await waitFor(() => expect(hinweis()).toBeDefined());
    await nutzer.type(ortFeld(), "x");
    await waitFor(() => expect(hinweis()).toBeUndefined());
  }, 30000);

  it("ein leerer Entwurf zeigt den Hinweis gar nicht", async () => {
    erfassungAblegen("", false);
    await appStarten();
    await screen.findByRole("heading", { level: 2, name: "1. Einheit" });
    expect(hinweis()).toBeUndefined();
  }, 30000);
});

describe("R21-A9: Die Speicherzeile hat ihren Platz von Anfang an", () => {
  it("ein leerer, verborgener Platz wird beim Speichern zur Zeile „gespeichert“, die Zahl der Zeilen im Kopf bleibt gleich", async () => {
    const nutzer = userEvent.setup();
    await appStarten();
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    const platz = document.querySelector<HTMLElement>("header .autosave")!;
    expect(platz).not.toBeNull();
    expect(platz.classList.contains("autosave-leer")).toBe(true);
    expect(platz.getAttribute("aria-hidden")).toBe("true");
    expect(platz.textContent!.replace(/ /g, "")).toBe(""); // nichts Gesprochenes, nichts Behauptetes
    const kopf = platz.closest("header")!;
    const vorher = kopf.querySelectorAll(".autosave").length;
    await nutzer.type(ortFeld(), "Husum");
    await waitFor(() => expect(kopf.querySelector(".autosave:not(.autosave-leer)")?.textContent).toMatch(/✓ gespeichert/), { timeout: 5000 });
    expect(kopf.querySelectorAll(".autosave")).toHaveLength(vorher);
  }, 30000);
});

describe("R21-H6: „Bogen schließen“ bei vollem Speicher", () => {
  it("die erste Frage verspricht die Startseite nicht, sondern sagt, dass das Ablegen scheitern kann", async () => {
    const nutzer = userEvent.setup();
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Ablagehausen";
    b.personal = [{ ...neuePerson(), vorname: "A", nachname: "Beispiel" }];
    expect(entwurfSpeichern(b, { schritt: 3 })).toBe(true);
    const { tippSchutzZuruecksetzen } = await appStarten();
    await waitFor(() => expect(document.querySelector(".entwurf-karte")).not.toBeNull());
    const rest = SPEICHER_GRENZE_ZEICHEN - 50 - speicherBelegung()!.belegt;
    localStorage.setItem("fueller", "y".repeat(Math.max(0, rest)));
    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    const frage = await screen.findByRole("dialog", { name: "Angefangenen Bogen schließen?" });
    expect(frage.textContent).toContain("Der Speicher dieses Geräts ist voll");
    expect(frage.textContent).toContain("bleibt er offen und nichts ändert sich");
    expect(frage.textContent).not.toContain("bleibt auf der Startseite");
    tippSchutzZuruecksetzen();
  }, 30000);

  it("bei freiem Speicher bleibt die bisherige Zusage", async () => {
    const nutzer = userEvent.setup();
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Ablagehausen";
    b.personal = [{ ...neuePerson(), vorname: "A", nachname: "Beispiel" }];
    expect(entwurfSpeichern(b, { schritt: 3 })).toBe(true);
    await appStarten();
    await waitFor(() => expect(document.querySelector(".entwurf-karte")).not.toBeNull());
    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    const frage = await screen.findByRole("dialog", { name: "Angefangenen Bogen schließen?" });
    expect(frage.textContent).not.toContain("Der Speicher dieses Geräts ist voll");
  }, 30000);
});
