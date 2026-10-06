/**
 * Musterung einer Vorlage: „‹ Abbrechen" verwarf abgewählte Personen ohne
 * Rückfrage (Audit Runde 2, R2-D6). Geprüft werden beide Richtungen — ohne
 * Änderung geht es ohne Frage zurück, nach geänderten Haken erst nach „Verwerfen".
 */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht } from "./dialoge";
import { Musterung } from "./vorlagen-ui";
import { neuerBogen, neuePerson } from "./hilfen";
import { vorlageAnlegen, type Vorlage } from "./vorlagen";

function vorlage(): Vorlage {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = "Musterhausen";
  b.personal = ["Berger", "Ahlers", "Voss"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
  return vorlageAnlegen("FGr N Musterhausen", b);
}

function buehne() {
  const onAbbrechen = vi.fn();
  render(
    <>
      <Musterung vorlage={vorlage()} onStart={() => {}} onAbbrechen={onAbbrechen} />
      <Dialogschicht />
    </>,
  );
  return { onAbbrechen };
}

const rueckfrage = () => document.querySelector<HTMLDialogElement>("dialog[aria-label='Musterung verwerfen?']");

describe("Musterung abbrechen (R2-D6)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("geht ohne geänderte Haken ohne Rückfrage zurück", async () => {
    const nutzer = userEvent.setup();
    const { onAbbrechen } = buehne();
    await nutzer.click(screen.getByRole("button", { name: "‹ Abbrechen" }));
    expect(rueckfrage()).toBeNull();
    expect(onAbbrechen).toHaveBeenCalledTimes(1);
  });

  it("fragt nach abgewählten Personen nach; „Weiter mustern“ behält die Haken, „Verwerfen“ geht zurück", async () => {
    const nutzer = userEvent.setup();
    const { onAbbrechen } = buehne();
    await nutzer.click(screen.getByRole("checkbox", { name: /Voss/ }));
    await nutzer.click(screen.getByRole("checkbox", { name: /Ahlers/ }));
    await nutzer.click(screen.getByRole("button", { name: "‹ Abbrechen" }));
    const dialog = rueckfrage()!;
    expect(dialog.textContent).toContain("2 Personen abgewählt");
    expect(dialog.textContent).toContain("Vorlage selbst bleibt unverändert");
    await nutzer.click(within(dialog).getByRole("button", { name: "Weiter mustern" }));
    expect(onAbbrechen).not.toHaveBeenCalled();
    expect((screen.getByRole("checkbox", { name: /Voss/ }) as HTMLInputElement).checked).toBe(false);

    await nutzer.click(screen.getByRole("button", { name: "‹ Abbrechen" }));
    await nutzer.click(within(rueckfrage()!).getByRole("button", { name: "Verwerfen" }));
    expect(onAbbrechen).toHaveBeenCalledTimes(1);
  });
});

describe("Musterung starten (R3-H4, R3-H7)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  function buehneMit(v: Vorlage) {
    const onStart = vi.fn();
    render(
      <>
        <Musterung vorlage={v} onStart={onStart} onAbbrechen={() => {}} />
        <Dialogschicht />
      </>,
    );
    return { onStart };
  }
  const frage = () => document.querySelector<HTMLDialogElement>("dialog[aria-label='Alle aus der Vorlage dabei?']");

  it("sagt, dass alle vorab angehakt sind und Fehlende abgewählt werden", () => {
    buehneMit(vorlage());
    expect(document.body.textContent).toContain("Alle sind vorab angehakt — wer oder was fehlt, antippen und abwählen.");
    expect(document.body.textContent).not.toContain("Anwesende abhaken");
  });

  it("fragt nach, wenn niemand abgewählt wurde; „Zurück zur Liste“ startet nicht", async () => {
    const nutzer = userEvent.setup();
    const { onStart } = buehneMit(vorlage());
    await nutzer.click(screen.getByRole("button", { name: /^Einsatz starten/ }));
    expect(frage()!.textContent).toContain("Gemeldet werden alle 3 Personen der Vorlage");
    await nutzer.click(within(frage()!).getByRole("button", { name: "Zurück zur Liste" }));
    expect(onStart).not.toHaveBeenCalled();

    await nutzer.click(screen.getByRole("button", { name: /^Einsatz starten/ }));
    await nutzer.click(within(frage()!).getByRole("button", { name: "Ja, alle sind da" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  // Audit Runde 4, R4-S5: Ersetzt der Start einen offenen Bogen, fragt die App; „Alle dabei?" steht dann in derselben Rückfrage.
  it("fragt nicht selbst, wenn die App ohnehin zum Ersetzen fragt, und gibt den Satz mit (R4-S5)", async () => {
    const nutzer = userEvent.setup();
    const onStart = vi.fn();
    render(
      <>
        <Musterung vorlage={vorlage()} onStart={onStart} onAbbrechen={() => {}} ersetztBogen />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: /^Einsatz starten/ }));
    expect(frage()).toBeNull();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0]![2]).toMatch(/^Gemeldet werden alle 3 Personen der Vorlage\. Fehlt jemand/);
  });

  it("startet nach dem Abwählen ohne Rückfrage", async () => {
    const nutzer = userEvent.setup();
    const { onStart } = buehneMit(vorlage());
    await nutzer.click(screen.getByRole("checkbox", { name: /Voss/ }));
    await nutzer.click(screen.getByRole("button", { name: "Einsatz starten · 2 Pers · 0 Fz" }));
    expect(frage()).toBeNull();
    expect(onStart.mock.calls[0]![0].personal).toHaveLength(2);
    // Die abgewählte Person reist als Nachzügler mit (R4-W8).
    expect(onStart.mock.calls[0]![1].map((p: { nachname: string }) => p.nachname)).toEqual(["Voss"]);
  });

  it("übernimmt die Bemerkung der Vorlage nur angehakt", async () => {
    const nutzer = userEvent.setup();
    const v = vorlage();
    v.bogen.sonstiges = "2 Sollplätze unbesetzt. Anh in Instandsetzung.";
    const { onStart } = buehneMit(v);
    const kaestchen = screen.getByRole("checkbox", { name: /2 Sollplätze unbesetzt/ }) as HTMLInputElement;
    expect(kaestchen.checked).toBe(false);
    await nutzer.click(screen.getByRole("checkbox", { name: /Voss/ }));
    await nutzer.click(screen.getByRole("button", { name: /^Einsatz starten/ }));
    expect(onStart.mock.calls[0]![0].sonstiges).toBeUndefined();

    cleanup();
    const zweite = buehneMit(v);
    await nutzer.click(screen.getByRole("checkbox", { name: /2 Sollplätze unbesetzt/ }));
    await nutzer.click(screen.getByRole("checkbox", { name: /Voss/ }));
    await nutzer.click(screen.getByRole("button", { name: /^Einsatz starten/ }));
    expect(zweite.onStart.mock.calls[0]![0].sonstiges).toBe("2 Sollplätze unbesetzt. Anh in Instandsetzung.");
  });
});

/**
 * Audit Runde 4, R4-E7: Die Haken einer Musterung überleben ein Neuladen, ein
 * bewusstes Ende der Musterung räumt sie weg.
 */
describe("Musterung nach dem Neuladen (R4-E7)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("stellt die Haken wieder her, wenn dieselbe Vorlage nach einem Neuladen gemustert wird", async () => {
    const nutzer = userEvent.setup();
    const v = vorlage();
    const { unmount } = render(<Musterung vorlage={v} onStart={() => {}} onAbbrechen={() => {}} />);
    await nutzer.click(screen.getByRole("checkbox", { name: /Voss/ }));
    await nutzer.click(screen.getByRole("checkbox", { name: /Ahlers/ }));
    const stand = localStorage.getItem("eeb.musterung.v1")!;
    expect(JSON.parse(stand)).toMatchObject({ vorlageId: v.id, personal: [true, false, false] });
    // Neuladen: die Seite verschwindet, ohne dass Reacts Aufräumen den Stand wegnimmt.
    unmount();
    expect(localStorage.getItem("eeb.musterung.v1")).toBeNull();
    localStorage.setItem("eeb.musterung.v1", stand);

    render(<Musterung vorlage={v} onStart={() => {}} onAbbrechen={() => {}} />);

    expect((screen.getByRole("checkbox", { name: /Berger/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: /Voss/ }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("checkbox", { name: /Ahlers/ }) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText(/Deine Haken von vorhin sind wieder da/)).toBeDefined();
    expect(screen.getByRole("button", { name: /Einsatz starten · 1 Pers/ })).toBeDefined();
  });

  it("ignoriert den Stand einer anderen oder geänderten Vorlage", () => {
    const v = vorlage();
    localStorage.setItem(
      "eeb.musterung.v1",
      JSON.stringify({ vorlageId: v.id, vorlageGeaendert: v.geaendert + 1, personal: [true, false, false], fahrzeuge: [], bedarf: false, bemerkung: false, zeit: Date.now() }),
    );
    render(<Musterung vorlage={v} onStart={() => {}} onAbbrechen={() => {}} />);
    expect((screen.getByRole("checkbox", { name: /Voss/ }) as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByText(/Deine Haken von vorhin/)).toBeNull();
  });

  it("räumt den Stand beim Ende der Musterung weg", async () => {
    const nutzer = userEvent.setup();
    const { onAbbrechen } = buehne();
    expect(localStorage.getItem("eeb.musterung.v1")).not.toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "‹ Abbrechen" }));
    expect(onAbbrechen).toHaveBeenCalled();
    cleanup();
    expect(localStorage.getItem("eeb.musterung.v1")).toBeNull();
  });
});
