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
