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
