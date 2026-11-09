/**
 * Runde 21, Block Daten und Texte, Abläufe der ganzen App (jsdom): Organisation der Schnellerfassung (W2, H2), eine Zählung (A3 …),
 * Pflichtfeld am Reiter (N3), „Entwurf wiederhergestellt“ nur einmal (A5), Platz für die Speicherzeile (A9), „Bogen schließen“ bei
 * vollem Speicher (H6). Jeder Test lädt die App neu (`vi.resetModules`), weil sie den Entwurf beim Laden des Moduls liest.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsatzAnlegen } from "@bos/meldekopf/einsaetze";
import { neuePerson, neuerBogen } from "./hilfen";
import { entwurfSpeichern, entwurfUeberschreibenErlauben } from "./entwurf";
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
// Die Landesvorlagen (rund 300 Beispielbögen per Glob) braucht hier niemand; ihr später Import riss in CI-Lauf 458
// nach dem Testende ab (EnvironmentTeardownError, wie in runde17-layout-app.test.tsx).
vi.mock("../vokabulare/landesvorlagen", () => ({
  bereichLabel: (s: string) => s,
  bundeslandLabel: (s: string) => s,
  hatLandesvorlagen: () => false,
  landesvorlagenBundeslaender: () => [],
  landesvorlagenGruppen: () => [],
  landesvorlage: () => undefined,
}));

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

describe("R21-A3 … S2: Kopf, Überschrift, Reiter und Rücklink zählen gleich", () => {

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
