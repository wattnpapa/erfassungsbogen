/**
 * Runde 21, Block Daten und Texte: Organisation der Schnellerfassung (W2, H2), Fehlerschirm ohne Netz (L2, D2), „Mehr"-Blatt schließt (K2),
 * eine Zählung der Schnellerfassung (A3, W3, E4, H3, G8, M3, L3, N2, O2, S2), Texte bei vollem Speicher (H6, H7, N7, S5, W6, A7),
 * Lageblatt (A8, A10), Pflichtfeld am Reiter (N3), Fachwörter (N6). Die Abläufe der ganzen App stehen in runde21-daten-texte-app.test.tsx.
 */
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail, EinsatzListe } from "./einsaetze-ui";
import { Fehlerfaenger, istLadeFehler } from "./fehlerfaenger";
import { neuePerson, neuerBogen } from "./hilfen";
import { andereOrganisationImOrt, SCHNELL_ORGANISATION_SCHLUESSEL, schnellOrganisationLaden, schnellOrganisationMerken } from "./schnell-organisation";
import { schnellKopfzeile, schnellNummer, SCHNELL_SCHRITTE } from "./schnell-zaehlung";
import { notwegText } from "./einsatz-notweg";
import { loeschenUmfangText } from "./einsatz-geloescht";
import { SpeicherWarnung } from "./speicher-warnung";
import { SPEICHER_GRENZE_ZEICHEN, speicherBelegung } from "./eintrag-zeiten";
import { verpflegungText } from "./auswertung";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

// ---------------------------------------------------------------------------------------- W2, H2 Organisation

describe("R21-W2, H2: Organisation der Schnellerfassung", () => {
  it("merkt die letzte Wahl; ohne Wert oder mit Unsinn bleibt es das THW", () => {
    expect(schnellOrganisationLaden()).toBe(OrganisationsTyp.THW);
    schnellOrganisationMerken(OrganisationsTyp.DRK);
    expect(localStorage.getItem(SCHNELL_ORGANISATION_SCHLUESSEL)).toBe(String(OrganisationsTyp.DRK));
    expect(schnellOrganisationLaden()).toBe(OrganisationsTyp.DRK);
    schnellOrganisationMerken(OrganisationsTyp.FEUERWEHR);
    expect(schnellOrganisationLaden()).toBe(OrganisationsTyp.FEUERWEHR);
    localStorage.setItem(SCHNELL_ORGANISATION_SCHLUESSEL, "9999");
    expect(schnellOrganisationLaden()).toBe(OrganisationsTyp.THW);
    localStorage.setItem(SCHNELL_ORGANISATION_SCHLUESSEL, "kaputt");
    expect(schnellOrganisationLaden()).toBe(OrganisationsTyp.THW);
  });

  it("erkennt eine andere Organisation am Anfang des Orts (DRK, Feuerwehr), aber nicht in Wortteilen", () => {
    expect(andereOrganisationImOrt("DRK Bremen", OrganisationsTyp.THW)).toBe(OrganisationsTyp.DRK);
    expect(andereOrganisationImOrt("Feuerwehr Husum", OrganisationsTyp.THW)).toBe(OrganisationsTyp.FEUERWEHR);
    expect(andereOrganisationImOrt("Freiwillige Feuerwehr Husum", OrganisationsTyp.THW)).toBe(OrganisationsTyp.FEUERWEHR);
    expect(andereOrganisationImOrt("Malteser Hilfsdienst Kiel", OrganisationsTyp.THW)).toBe(OrganisationsTyp.MHD);
    expect(andereOrganisationImOrt("THW Oldenburg", OrganisationsTyp.DRK)).toBe(OrganisationsTyp.THW);
    // Gleiche Organisation, Ort ohne Organisation und Wortteile lösen nichts aus.
    expect(andereOrganisationImOrt("DRK Bremen", OrganisationsTyp.DRK)).toBeUndefined();
    expect(andereOrganisationImOrt("Oldenburg", OrganisationsTyp.THW)).toBeUndefined();
    expect(andereOrganisationImOrt("Drkwalde", OrganisationsTyp.THW)).toBeUndefined();
    expect(andereOrganisationImOrt("FFW", OrganisationsTyp.THW)).toBe(OrganisationsTyp.FEUERWEHR);
    expect(andereOrganisationImOrt("", OrganisationsTyp.THW)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------------------- L2, D2 Fehlerschirm

describe("R21-L2, D2: Fehlerschirm nennt bei fehlendem Netz die Ursache und rät nicht zum Löschen", () => {
  const Bombe = ({ text }: { text: string }): never => {
    throw new TypeError(text);
  };

  it("erkennt nachgeladene Teile, die nicht kamen, an den Meldungen der Browser", () => {
    for (const t of [
      "Unable to preload CSS for /assets/index-Bp0pLAQP.css",
      "Failed to fetch dynamically imported module: https://x/assets/einsaetze-1.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "Load failed",
    ]) {
      expect(istLadeFehler(new TypeError(t)), t).toBe(true);
    }
    expect(istLadeFehler(new TypeError("Cannot read properties of undefined (reading 'code')"))).toBe(false);
  });

  it("zeigt bei einem Ladefehler die Ursache und „Seite neu laden“, ohne Löschempfehlung und ohne „Alle Daten löschen“", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    localStorage.setItem("eeb.einsaetze.v1", "[1]");
    render(<Fehlerfaenger><Bombe text="Unable to preload CSS for /assets/index-x.css" /></Fehlerfaenger>);
    const seite = screen.getByRole("alert");
    expect(seite.textContent).toContain("Ein Teil der App konnte ohne Netz nicht geladen werden");
    expect(seite.textContent).toContain("Deine Daten und dein Einsatz sind unversehrt");
    expect(seite.textContent).toMatch(/Seite neu laden oder online verbinden/);
    expect(screen.getByRole("button", { name: "Seite neu laden" })).toBeTruthy();
    // Kein Rat zum Löschen, auch nicht hinter einem Aufklapper.
    expect(seite.textContent).not.toMatch(/Löschen…|löschen|Endgültig/);
    expect(screen.queryByRole("button", { name: "Endgültig löschen" })).toBeNull();
    expect(localStorage.getItem("eeb.einsaetze.v1")).toBe("[1]");
  });

  it("„Seite neu laden“ lädt neu und behält die zuletzt geöffnete Sammlung, damit der Einsatz danach wieder aufgeht", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    localStorage.setItem("eeb.letzterEinsatz.v1", JSON.stringify({ id: "s1", um: Date.now() }));
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload, assign: vi.fn(), pathname: "/" });
    render(<Fehlerfaenger><Bombe text="Failed to fetch dynamically imported module: x.js" /></Fehlerfaenger>);
    screen.getByRole("button", { name: "Seite neu laden" }).click();
    expect(reload).toHaveBeenCalled();
    expect(localStorage.getItem("eeb.letzterEinsatz.v1")).not.toBeNull();
  });

  it("sagt, wenn das Gerät selbst kein Netz meldet", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<Fehlerfaenger><Bombe text="Load failed" /></Fehlerfaenger>);
    expect(screen.getByRole("alert").textContent).toContain("Das Gerät meldet gerade keine Verbindung");
  });

  it("ein echter Absturz behält den bisherigen Schirm: zuerst neu laden, dann die Löschwege", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<Fehlerfaenger><Bombe text="Cannot read properties of undefined (reading 'code')" /></Fehlerfaenger>);
    const seite = screen.getByRole("alert");
    expect(seite.textContent).not.toContain("ohne Netz");
    expect(screen.getByRole("button", { name: "Neu laden" })).toBeTruthy();
    // Das Löschen ist nicht die erste Empfehlung: „Zuerst neu laden“ steht vor dem Satz zum Löschen eines Einsatzes.
    const text = seite.textContent!;
    expect(text.indexOf("Zuerst neu laden")).toBeGreaterThan(-1);
    expect(text.indexOf("Zuerst neu laden")).toBeLessThan(text.indexOf("Löschen…"));
  });
});

// ---------------------------------------------------------------------------------------- A3 … S2 Zählung

describe("R21-A3, W3, E4, H3, G8, M3, L3, N2, O2, S2: eine Zählung in der Schnellerfassung", () => {
  it("nummeriert die vier Schritte 1 bis 4; Einsatz und Sofortbedarf haben keine Nummer", () => {
    expect(SCHNELL_SCHRITTE.map((s) => schnellNummer(s))).toEqual([1, 2, 3, 4]);
    expect(schnellNummer(1)).toBeUndefined();
    expect(schnellNummer(4)).toBeUndefined();
    const namen = ["Einheit", "Einsatz", "Personal", "Fahrzeuge", "Sofortbedarf", "Übersicht"];
    // Kopfzeile und Nummer sind dieselbe Zahl.
    for (const s of SCHNELL_SCHRITTE) expect(schnellKopfzeile(s, namen)).toContain(`Schritt ${schnellNummer(s)} von 4`);
  });
});

// ---------------------------------------------------------------------------------------- Einsatzansicht

type Props = Parameters<typeof EinsatzDetail>[0];

function Wirt({ id, extra }: { id: string; extra?: Partial<Props> }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  return (
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={() => setEinsatz(einsaetzeLaden().find((s) => s.id === id)!)}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={() => {}}
        onBilderImport={() => {}}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onGeloescht={() => {}}
        {...extra}
      />
      <Dialogschicht />
    </>
  );
}

function bogenOrt(ort: string, aendern?: (b: ReturnType<typeof neuerBogen>) => void) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  aendern?.(b);
  return b;
}

const karteVon = (text: string) => [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes(text))!;

describe("R21-K2: Das „Mehr“-Blatt schließt nach Ort ändern, Stärke ändern und Übung kennzeichnen", () => {
  function lage() {
    const s = einsatzAnlegen("Hochwasser Blatt", EinsatzArt.EINSATZ);
    meldungHinzufuegen(
      s.id,
      bogenOrt("Albstadt", (b) => {
        b.personal = ["Rudolph", "Lang", "Weber"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
      }),
    );
    return s.id;
  }
  const blattOffen = (karte: HTMLElement) => within(karte).queryByRole("button", { name: "Weniger anzeigen" }) !== null;

  it("Als Übung kennzeichnen…", async () => {
    const nutzer = userEvent.setup();
    render(<Wirt id={lage()} />);
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Mehr…" }));
    expect(blattOffen(karteVon("Albstadt"))).toBe(true);
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Als Übung kennzeichnen…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Als Übung kennzeichnen?" })).getByRole("button", { name: "Als Übung kennzeichnen" }));
    await waitFor(() => expect(document.body.textContent).toContain("Rückgängig"));
    expect(blattOffen(karteVon("Albstadt"))).toBe(false);
  });

  it("Stärke ändern…", async () => {
    const nutzer = userEvent.setup();
    render(<Wirt id={lage()} />);
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Stärke ändern…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Stärke ändern']")!;
    const feld = within(dialog).getByLabelText("Mannschaft");
    await nutzer.clear(feld);
    await nutzer.type(feld, "2");
    await nutzer.click(within(dialog).getByRole("button", { name: "Stärke übernehmen" }));
    await waitFor(() => expect(document.querySelector(".quittung-daumen")).not.toBeNull());
    expect(blattOffen(karteVon("Albstadt"))).toBe(false);
  });

  it("Ort der Einheit ändern…", async () => {
    const nutzer = userEvent.setup();
    render(<Wirt id={lage()} />);
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Ort der Einheit ändern…" }));
    const dialog = await screen.findByRole("dialog", { name: "Ort der Einheit ändern" });
    const feld = within(dialog).getByLabelText("Ort der Einheit");
    await nutzer.clear(feld);
    await nutzer.type(feld, "Husum");
    await nutzer.click(within(dialog).getByRole("button", { name: "Ort übernehmen" }));
    await waitFor(() => expect(document.body.textContent).toContain("Name geändert"), { timeout: 5000 });
    await waitFor(() => expect(blattOffen(karteVon("Husum"))).toBe(false));
  });

  it("ein abgebrochener Dialog lässt das Blatt offen (es wurde nichts ausgeführt)", async () => {
    const nutzer = userEvent.setup();
    render(<Wirt id={lage()} />);
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Als Übung kennzeichnen…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Als Übung kennzeichnen?" })).getByRole("button", { name: "Abbrechen" }));
    expect(blattOffen(karteVon("Albstadt"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------- Speicher voll

/** Speicher bis auf wenige Zeichen füllen (die App rechnet mit SPEICHER_GRENZE_ZEICHEN). */
function speicherVollFuellen() {
  const rest = SPEICHER_GRENZE_ZEICHEN - 50 - speicherBelegung()!.belegt;
  localStorage.setItem("fueller", "y".repeat(Math.max(0, rest)));
  expect(speicherBelegung()!.anteil).toBeGreaterThanOrEqual(0.995);
}

describe("R21-H7, S5: Warnzeile bei vollem Speicher", () => {
  it("nennt in zwei kurzen Sätzen, was ist und was jetzt zählt; die Wege stehen hinter „Mehr dazu“", () => {
    const s = einsatzAnlegen("Archiv", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenOrt("Albstadt"));
    speicherVollFuellen();
    render(<SpeicherWarnung stand={1} />);
    const warnung = screen.getByRole("status");
    const kurz = warnung.querySelector(":scope > p")!.textContent!;
    expect(kurz).toBe("⚠ Gerätespeicher ist voll: 100 % — nichts wird mehr gespeichert. Erst sichern.");
    expect(kurz.length).toBeLessThan(100); // bei 360 px höchstens drei Zeilen
    const mehr = warnung.querySelector<HTMLDetailsElement>("details.hinweis-mehr")!;
    expect(mehr.open).toBe(false);
    expect(mehr.textContent).toContain("Platz schafft nur Löschen");
    expect(mehr.textContent).toMatch(/Belegt: 100 % \(/);
  });
});

describe("R21-N7, H7: „Nicht gelöscht“ nennt nur die Knöpfe darunter", () => {
  it("mit Export-Weg: erst sichern, dann „Endgültig löschen…“; mit der Belegung", () => {
    const t = notwegText("Hochwasser", 1, true, false);
    expect(t).toBe(
      "„Hochwasser\" ist nicht gelöscht: Der Speicher dieses Geräts ist voll (zu 100 % belegt), der Papierkorb braucht selbst Platz. Erst sichern, dann „Endgültig löschen…“ (nicht rückholbar).",
    );
    expect(t.split(". ").length).toBeLessThanOrEqual(3);
    // Kein Weg, der nicht als Knopf dasteht.
    expect(t).not.toMatch(/Entfernen|Alle Daten löschen|Papierkorb leeren/);
  });

  it("auf der Startseite heißt der Weg „Einsatz öffnen und sichern“; ohne Sicherungsweg bleibt nur das Löschen", () => {
    expect(notwegText("X", 0.99, true, true)).toContain("Erst den Einsatz öffnen und sichern, dann „Endgültig löschen…“");
    expect(notwegText("X", null, false, false)).toBe(
      "„X\" ist nicht gelöscht: Der Speicher dieses Geräts ist voll, der Papierkorb braucht selbst Platz. „Endgültig löschen…“ schafft Platz (nicht rückholbar).",
    );
  });
});

describe("R21-A7: Einheiten und Meldungen erklären sich", () => {
  it("nennt beide Zahlen, wo sie sich unterscheiden", () => {
    expect(loeschenUmfangText(7, 8)).toBe("7 Einheiten (mit allen früheren Fassungen 8 Meldungen)");
    expect(loeschenUmfangText(7, 7)).toBe("7 Einheiten");
    expect(loeschenUmfangText(1, 1)).toBe("1 Einheit");
    expect(loeschenUmfangText(1, 2)).toBe("1 Einheit (mit allen früheren Fassungen 2 Meldungen)");
  });
});

describe("R21-H6, W6: Einsatz löschen bei vollem Speicher", () => {
  it("Einsatzansicht: gleich die Notweg-Rückfrage, ohne die Zusage „wandert in den Papierkorb“", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Voll", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenOrt("Albstadt"));
    meldungHinzufuegen(s.id, bogenOrt("Biberach"));
    render(<Wirt id={s.id} extra={{ onWeitergeben: vi.fn() }} />);
    speicherVollFuellen();
    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    const notweg = await screen.findByRole("dialog", { name: "Nicht gelöscht" }, { timeout: 5000 });
    expect(screen.queryByRole("dialog", { name: "Einsatz löschen?" })).toBeNull();
    expect(notweg.textContent).toContain("ist nicht gelöscht");
    expect(notweg.textContent).not.toContain("wandert in den Papierkorb");
    expect(within(notweg).getByRole("button", { name: "Erst sichern (Sammel-PDF erzeugen)" })).toBeTruthy();
    expect(einsaetzeLaden()).toHaveLength(1); // nichts gelöscht, nichts im Papierkorb
    // Die zweite Rückfrage erklärt die Zahlen: 2 Einheiten, 2 Meldungen.
    await nutzer.click(within(notweg).getByRole("button", { name: "Endgültig löschen…" }));
    const zweite = await screen.findByRole("dialog", { name: /endgültig löschen\?/ });
    expect(zweite.textContent).toContain("2 Einheiten sind danach weg");
    await nutzer.click(within(zweite).getByRole("button", { name: "Einsatz behalten" }));
    expect(einsaetzeLaden()).toHaveLength(1);
  }, 20000);

  it("Startseite: „Einsatz öffnen und sichern“ steht als erster Weg und öffnet den Einsatz", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Start", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenOrt("Albstadt"));
    const onOeffnen = vi.fn();
    render(
      <>
        <EinsatzListe einsaetze={einsaetzeLaden()} onOeffnen={onOeffnen} onGeaendert={() => {}} />
        <Dialogschicht />
      </>,
    );
    speicherVollFuellen();
    await nutzer.click(screen.getByRole("button", { name: "Löschen…" }));
    const notweg = await screen.findByRole("dialog", { name: "Nicht gelöscht" }, { timeout: 5000 });
    expect(screen.queryByRole("dialog", { name: "Einsatz löschen?" })).toBeNull();
    const namen = within(notweg).getAllByRole("button").map((b) => b.textContent);
    expect(namen[0]).toBe("Einsatz öffnen und sichern");
    expect(namen).toContain("Endgültig löschen…");
    await nutzer.click(within(notweg).getByRole("button", { name: "Einsatz öffnen und sichern" }));
    await waitFor(() => expect(onOeffnen).toHaveBeenCalledTimes(1));
    expect(einsaetzeLaden()).toHaveLength(1);
  }, 20000);

  it("ohne vollen Speicher bleibt es bei der ersten Rückfrage und dem Papierkorb", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Platz", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenOrt("Albstadt"));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    const frage = await screen.findByRole("dialog", { name: "Einsatz löschen?" });
    expect(frage.textContent).toContain("wandert in den Papierkorb");
  });
});

// ---------------------------------------------------------------------------------------- A8, A10, N6

describe("R21-N6: Fachwörter", () => {
  it("Verpflegung ohne Anforderung heißt „kein Bedarf gemeldet“, nicht „keine angefordert“", () => {
    const text = verpflegungText({
      verpflegung: { gesamt: 9, fleisch: 9, vegetarisch: 0, vegan: 0 },
      verpflegungAngefordert: 0,
    });
    expect(text).toBe("Verpflegung: kein Bedarf gemeldet (9 Personen vor Ort)");
  });

  it("die Legende unter der Tabelle unterscheidet „nicht erfasst“ von „kein Bedarf“", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Wörter", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenOrt("Albstadt"));
    meldungHinzufuegen(s.id, bogenOrt("Biberach"));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));
    expect(document.body.textContent).toContain("„Bedarf nicht erfasst“ = bei der Schnellerfassung nicht abgefragt, nicht „kein Bedarf“.");
  });
});
