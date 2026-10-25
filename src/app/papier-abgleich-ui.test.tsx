/**
 * Der Abgleich vom Papier lässt sich von außen öffnen: Der Bericht von
 * „Bögen einlesen…“ trägt den Knopf, damit er nach dem Einlesen im Bild steht
 * (Audit Runde 4, R4-A6).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { meldungAufnehmen, vomPapierMarkieren } from "./eintrag-zeiten";
import { PapierAbgleich } from "./papier-abgleich-ui";
import { Dialogschicht } from "./dialoge";

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

const proto = HTMLElement.prototype as unknown as { scrollIntoView?: (opt?: unknown) => void };
const vorherScroll = proto.scrollIntoView;

beforeEach(() => {
  const mem = new MemStorage();
  // jsdom gibt window.localStorage nur mit Getter her; eine direkte Zuweisung
  // wirft seit Vitest 5. vi.stubGlobal ersetzt die Eigenschaft sauber.
  vi.stubGlobal("localStorage", mem as unknown as Storage);
  speicherhuelleSetzen(mem as unknown as Storage);
});
afterEach(() => {
  vi.unstubAllGlobals();
  if (vorherScroll === undefined) delete proto.scrollIntoView;
  else proto.scrollIntoView = vorherScroll;
});

function bogen(ort: string): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: ort }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 1, unterfuehrer: 0, mannschaft: 3, gesamt: 4 },
    personal: [],
    fahrzeuge: [],
  };
}

describe("PapierAbgleich von außen öffnen (R4-A6)", () => {
  it("ein hochgezählter Anstoß öffnet die Liste und holt sie ins Bild; ohne Anstoß bleibt die Karte zu", () => {
    const gerufen: unknown[] = [];
    proto.scrollIntoView = function (opt?: unknown) { gerufen.push(opt); };
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const ids = ["Ansbach", "Ulm"].map((n) => meldungAufnehmen(s.id, bogen(n), { quelle: "scan" })!.eintrag.id);
    vomPapierMarkieren(s.id, ids, 999);
    const eintraege = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const props = { einsatzId: s.id, eintraege, zuege: [], onGeaendert: () => {} };
    const { rerender } = render(<PapierAbgleich {...props} anstoss={0} />);
    // Zu: nur der Knopf der Karte, keine Liste.
    expect(screen.queryByRole("heading", { name: /Lage vom Papier abgleichen \(2\)/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" })).toBeTruthy();
    rerender(<PapierAbgleich {...props} anstoss={0} />);
    expect(screen.queryByRole("heading", { name: /Lage vom Papier abgleichen \(2\)/ })).toBeNull();
    rerender(<PapierAbgleich {...props} anstoss={1} />);
    expect(screen.getByRole("heading", { name: /Lage vom Papier abgleichen \(2\)/ })).toBeTruthy();
    expect(gerufen).toEqual([{ block: "start" }]);
  });
});

describe("Ein Weg zum Abgleich (R5-N9)", () => {
  it("steht der Knopf schon im Einlese-Bericht, zeigt die Karte keinen zweiten", () => {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const ids = ["Ansbach"].map((n) => meldungAufnehmen(s.id, bogen(n), { quelle: "scan" })!.eintrag.id);
    vomPapierMarkieren(s.id, ids, 999);
    const eintraege = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const props = { einsatzId: s.id, eintraege, zuege: [], onGeaendert: () => {} };
    const { rerender } = render(<PapierAbgleich {...props} knopfImBericht />);
    expect(screen.queryByRole("button", { name: "Lage vom Papier abgleichen…" })).toBeNull();
    expect(screen.getByText(/steht im Bericht darüber/)).toBeTruthy();
    rerender(<PapierAbgleich {...props} knopfImBericht={false} />);
    expect(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" })).toBeTruthy();
  });
});

describe("Eingaben gehen nicht still verloren (R7-S1, R7-G1)", () => {
  function aufbau() {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const ids = ["Ansbach", "Ulm"].map((n) => meldungAufnehmen(s.id, bogen(n), { quelle: "scan" })!.eintrag.id);
    vomPapierMarkieren(s.id, ids, 999);
    const eintraege = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    return { einsatzId: s.id, eintraege, zuege: [], onGeaendert: () => {} };
  }
  beforeEach(() => sessionStorage.clear());

  it("„Später\" schließt nur das Formular; beim Öffnen stehen die Eingaben wieder da", async () => {
    const nutzer = userEvent.setup();
    const props = aufbau();
    render(<PapierAbgleich {...props} />);
    await nutzer.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    const nr = screen.getAllByLabelText(/Nr\. laut Blatt/)[0] as HTMLInputElement;
    await nutzer.type(nr, "77");
    await nutzer.click(screen.getAllByLabelText("abgerückt")[0]!);
    await nutzer.click(screen.getByRole("button", { name: "Später" }));
    // Zu — aber die Karte sagt, dass etwas wartet.
    expect(screen.queryByRole("heading", { name: /Lage vom Papier abgleichen \(2\)/ })).toBeNull();
    expect(screen.getByText(/Angefangene Eingaben für 1 Einheit sind noch da/)).toBeTruthy();
    await nutzer.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    expect((screen.getAllByLabelText(/Nr\. laut Blatt/)[0] as HTMLInputElement).value).toBe("77");
    expect((screen.getAllByLabelText("abgerückt")[0] as HTMLInputElement).checked).toBe(true);
  });

  it("überlebt ein Neuladen (neue Komponente, derselbe Sitzungsspeicher) und die Startseite", async () => {
    const nutzer = userEvent.setup();
    const props = aufbau();
    const erste = render(<PapierAbgleich {...props} />);
    await nutzer.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    await nutzer.type(screen.getAllByLabelText(/Nr\. laut Blatt/)[1]!, "5");
    erste.unmount();
    render(<PapierAbgleich {...props} />);
    expect(screen.getByText(/Angefangene Eingaben für 1 Einheit sind noch da/)).toBeTruthy();
    await nutzer.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    expect((screen.getAllByLabelText(/Nr\. laut Blatt/)[1] as HTMLInputElement).value).toBe("5");
  });

  it("„Später\" liegt eine eigene Zeile unter „Abgleich übernehmen\"; Verwerfen fragt vorher zurück", async () => {
    const nutzer = userEvent.setup();
    const props = aufbau();
    render(
      <>
        <PapierAbgleich {...props} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    const spaeter = screen.getByRole("button", { name: "Später" });
    const uebernehmen = screen.getByRole("button", { name: "Abgleich übernehmen" });
    expect(spaeter.parentElement).not.toBe(uebernehmen.parentElement);
    await nutzer.type(screen.getAllByLabelText(/Nr\. laut Blatt/)[0]!, "3");
    await nutzer.click(screen.getByRole("button", { name: /Eingaben verwerfen/ }));
    const frage = await screen.findByRole("dialog", { name: "Eingaben verwerfen?" });
    expect(frage.textContent).toContain("1 Einheit");
    await nutzer.click(within(frage).getByRole("button", { name: "Verwerfen" }));
    expect(sessionStorage.length).toBe(0);
    expect(screen.queryByRole("heading", { name: /Lage vom Papier abgleichen \(2\)/ })).toBeNull();
  });
});

describe("Nummern beim Abgleich (R8-W1)", () => {
  it("nennt vorher die belegte Nummer und danach alle Einheiten mit alter und neuer Nummer", async () => {
    const nutzer = userEvent.setup({ delay: null });
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    // Bamberg ist digital geführt (Nr. 1, nicht Teil des Abgleichs); Ulm und Albstadt kamen vom Papier.
    meldungAufnehmen(s.id, bogen("Bamberg"), { quelle: "scan" });
    const ids = ["Ulm", "Albstadt"].map((n) => meldungAufnehmen(s.id, bogen(n), { quelle: "scan" })!.eintrag.id);
    vomPapierMarkieren(s.id, ids, 999);
    const eintraege = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    render(
      <>
        <PapierAbgleich einsatzId={s.id} eintraege={eintraege} zuege={[]} onGeaendert={() => {}} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    // Die Eingangsreihenfolge kann bei gleicher Millisekunde wechseln: Die Nummer, die Bamberg gerade trägt, wird gemessen.
    const { meldungsNummern } = await import("./einheiten-tabelle");
    const bamberg = eintraege.find((e) => e.bogen.einheit.hierarchie[0]!.name === "Bamberg")!;
    const nrBamberg = meldungsNummern(eintraege).get(bamberg.einheitSchluessel)!;
    await nutzer.type(screen.getAllByLabelText(/Nr\. laut Blatt/)[0]!, String(nrBamberg));
    await nutzer.click(screen.getByRole("button", { name: "Abgleich übernehmen" }));
    const frage = await screen.findByRole("dialog", { name: "Nummer schon vergeben" });
    expect(frage.textContent).toContain(`Nr. ${nrBamberg} trägt schon`);
    expect(frage.textContent).toContain("Bamberg");
    await nutzer.click(within(frage).getByRole("button", { name: "Übernehmen" }));
    const hinweis = await screen.findByRole("dialog", { name: /Nummern neu vergeben|Abgleich übernommen/ });
    expect(hinweis.textContent).toMatch(new RegExp(`Bamberg[^,]* ${nrBamberg} → \\d`));
    expect(hinweis.textContent).toMatch(/Nummern? änder/);
  });
});
