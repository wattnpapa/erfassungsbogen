/**
 * Runde 21, R21-E3: „Ort der Einheit ändern…" prüft den Ort wie die Schnellerfassung und bietet Vorschläge mit Kennung an.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp } from "@bos/eeb-format/model";
import { Dialogschicht } from "./dialoge";
import { neuerBogen } from "./hilfen";
import { ortErfragen, ortVorschlaege } from "./ort-aendern";
import { ovTreffer } from "./schritte/einheit";
import { THW_ORTSVERBAENDE } from "@bos/vokabulare/thw-ov";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function bogen(ort: string, org: OrganisationsTyp = OrganisationsTyp.THW) {
  const b = neuerBogen();
  b.einheit.organisation = org;
  b.einheit.hierarchie[0]!.name = ort;
  return b;
}

describe("R21-E3 Vorschläge zu einem Tippfehler", () => {
  it("„Oldenbrg“ findet über den Wortanfang beide Oldenburg, ein vollständiger Ort braucht keine Hilfe", () => {
    expect(ovTreffer(THW_ORTSVERBAENDE, "Oldenbrg")).toEqual([]); // so zeigte das Feld „Kein Ort mit diesem Namen“, aber keine Liste
    const namen = ortVorschlaege(THW_ORTSVERBAENDE, "Oldenbrg", ovTreffer).map((o) => o.name);
    expect(namen).toEqual(expect.arrayContaining(["Oldenburg (NI)", "Oldenburg in Holstein"]));
    expect(ortVorschlaege(THW_ORTSVERBAENDE, "Oldenburg", ovTreffer).length).toBeGreaterThan(0);
    expect(ortVorschlaege(THW_ORTSVERBAENDE, "Qqqqqqq", ovTreffer)).toEqual([]);
  });
});

describe("R21-E3 ortErfragen", () => {
  async function tippen(nutzer: ReturnType<typeof userEvent.setup>, wert: string) {
    const dialog = await screen.findByRole("dialog", { name: "Ort der Einheit ändern" });
    const feld = within(dialog).getByLabelText("Ort der Einheit");
    await nutzer.clear(feld);
    await nutzer.type(feld, wert);
    await nutzer.click(within(dialog).getByRole("button", { name: "Ort übernehmen" }));
  }

  it("THW, Tippfehler: die Rückfrage nennt, dass der Ort fehlt, und bietet Vorschläge; ein Vorschlag setzt Ort, Kürzel und Kontakt", async () => {
    const nutzer = userEvent.setup();
    render(<Dialogschicht />);
    const antwort = ortErfragen(bogen("Albstadt"), Date.now());
    await tippen(nutzer, "Oldenbrg");
    const frage = await screen.findByRole("dialog", { name: "Ort nicht in der Liste" }, { timeout: 5000 });
    expect(frage.textContent).toContain("Kein Ort mit dem Namen „Oldenbrg\" in der Liste der Ortsverbände");
    const knoepfe = within(frage).getAllByRole("button").map((b) => b.textContent);
    expect(knoepfe).toEqual(expect.arrayContaining(["Oldenburg (NI) (OODE)", "„Oldenbrg\" so übernehmen", "Schreibweise ändern"]));
    await nutzer.click(within(frage).getByRole("button", { name: "Oldenburg (NI) (OODE)" }));
    const ergebnis = (await antwort)!;
    expect(ergebnis.neu.einheit.hierarchie[0]!.name).toBe("Oldenburg (NI)");
    expect(ergebnis.neu.einheit.hierarchie[0]!.kurz).toBe("OODE");
    expect(ergebnis.neuerName).toContain("Oldenburg (NI)");
  }, 20000);

  it("„So übernehmen“ lässt auch einen Ort zu, den es nicht gibt (ein Ortsverband darf frei stehen)", async () => {
    const nutzer = userEvent.setup();
    render(<Dialogschicht />);
    const antwort = ortErfragen(bogen("Albstadt"), Date.now());
    await tippen(nutzer, "Qqqqqqq");
    const frage = await screen.findByRole("dialog", { name: "Ort nicht in der Liste" }, { timeout: 5000 });
    expect(within(frage).getAllByRole("button").map((b) => b.textContent)).toEqual(["„Qqqqqqq\" so übernehmen", "Schreibweise ändern"]);
    await nutzer.click(within(frage).getByRole("button", { name: "„Qqqqqqq\" so übernehmen" }));
    expect((await antwort)!.neu.einheit.hierarchie[0]!.name).toBe("Qqqqqqq");
  }, 20000);

  it("„Schreibweise ändern“ führt zurück ins Feld, mit dem Eingetippten", async () => {
    const nutzer = userEvent.setup();
    render(<Dialogschicht />);
    const antwort = ortErfragen(bogen("Albstadt"), Date.now());
    await tippen(nutzer, "Oldenbrg");
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Ort nicht in der Liste" }, { timeout: 5000 })).getByRole("button", { name: "Schreibweise ändern" }));
    const dialog = await screen.findByRole("dialog", { name: "Ort der Einheit ändern" });
    const feld = within(dialog).getByLabelText("Ort der Einheit") as HTMLInputElement;
    expect(feld.value).toBe("Oldenbrg");
    await nutzer.clear(feld);
    await nutzer.type(feld, "Oldenburg");
    await nutzer.click(within(dialog).getByRole("button", { name: "Ort übernehmen" }));
    // „Oldenburg“ hat Treffer im Verzeichnis: keine weitere Rückfrage.
    expect((await antwort)!.neu.einheit.hierarchie[0]!.name).toBe("Oldenburg");
    expect(screen.queryByRole("dialog", { name: "Ort nicht in der Liste" })).toBeNull();
  }, 20000);

  it("ein bekannter Ort wird ohne Rückfrage übernommen; andere Organisationen kennen kein Verzeichnis und fragen nie", async () => {
    const nutzer = userEvent.setup();
    render(<Dialogschicht />);
    const bekannt = ortErfragen(bogen("Albstadt"), Date.now());
    await tippen(nutzer, "Husum");
    expect((await bekannt)!.neu.einheit.hierarchie[0]!.name).toBe("Husum");

    const drk = ortErfragen(bogen("Albstadt", OrganisationsTyp.DRK), Date.now());
    await tippen(nutzer, "Oldenbrg");
    expect((await drk)!.neu.einheit.hierarchie[0]!.name).toBe("Oldenbrg");
    expect(screen.queryByRole("dialog", { name: "Ort nicht in der Liste" })).toBeNull();
  }, 20000);
});
