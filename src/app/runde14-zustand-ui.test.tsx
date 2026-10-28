/**
 * Runde 14, Block Zustand: Verhalten in der Oberfläche (jsdom) — Zug für mehrere Einheiten mit Quittung und Rückgängig
 * (D3/G2/H2), Verschieben mit Quittung (D4), Übung ↔ Einsatzmeldung (E1), Entfernen eines Trupps (D1), Marke „neu" (S3),
 * Kontaktzeilen (S4), Altersangaben im Minutentakt (O1), Datensicherung (H4), Telefon der Absenderkarte (E5),
 * Beispieldaten beim Abwählen von „Übung" (E6), Handscanner mit kurzem Code (E3).
 */
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungAufteilen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail, LetzteMeldungZeit } from "./einsaetze-ui";
import { neuePerson, neuerBogen } from "./hilfen";
import { kenntnisVermerken } from "./export-stand";
import { Fusszeile } from "./fusszeile";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import { absenderkarteLaden } from "./absenderkarte";
import { beispielMerken } from "./beispiel-herkunft";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittEinsatz } from "./schritte/einsatz";
import { QrScannerWeb } from "./qr-scanner-web";
import { geltendeJeEinheit } from "./fassung-vorrang";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});

function bogenMitName(name: string, aendern?: (b: Erfassungsbogen) => void): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  aendern?.(b);
  return b;
}

type Props = Parameters<typeof EinsatzDetail>[0];

/** Detailansicht wie in der App: nach jeder Änderung (`onGeaendert`) mit dem neuen Speicherstand. */
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

/** Einsatz, in dem schon „zur Kenntnis genommen" ist; die danach aufgenommenen Einheiten sind neu. */
function einsatzMitNeuen(namen: string[], art = EinsatzArt.EINSATZ, aendern?: (b: Erfassungsbogen, name: string) => void) {
  const s = einsatzAnlegen("Hochwasser Zug", art);
  kenntnisVermerken(einsaetzeLaden().find((x) => x.id === s.id)!);
  for (const n of namen) meldungHinzufuegen(s.id, bogenMitName(n, (b) => aendern?.(b, n)));
  return s.id;
}

/** Die Quittungsleiste nimmt ihre Knöpfe erst nach dem Prellschutz an (daumen-quittung.tsx). */
async function bereit(knopf: HTMLElement) {
  // Seit R16-D1 trägt die Leiste im Prellschutz `aria-disabled` statt `disabled` (ein Tipp sagt „Einen Moment …").
  await waitFor(() => expect((knopf as HTMLButtonElement).disabled || knopf.getAttribute("aria-disabled") === "true").toBe(false), { timeout: 2500 });
}

const zuegeJeEinheit =(id: string) => einsaetzeLaden().find((s) => s.id === id)!.eintraege.map((e) => e.zugEtikett);
const karteVon = (name: string) => [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes(name))!;

describe("R14-G2/H2/D3 Zug für mehrere Einheiten: Quittung mit Rückgängig", () => {
  it("„Zuordnen“ quittiert mit Zug und Zahl; Rückgängig stellt „ohne Zug“ und das Feld wieder her", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["Alpha", "Beta", "Gamma"]);
    render(<Wirt id={id} />);
    const gruppe = screen.getByRole("group", { name: "Zug zuordnen" });
    expect(gruppe.textContent).toContain("Zug für 3 Einheiten ohne Zug:");
    await nutzer.type(within(gruppe).getByLabelText("Zug für diese Einheiten"), "3.Zug");
    await nutzer.click(within(gruppe).getByRole("button", { name: "Zuordnen" }));

    expect(zuegeJeEinheit(id)).toEqual(["3. Zug", "3. Zug", "3. Zug"]);
    // Die Zeile ist weg, an ihrer Stelle quittiert die Leiste mit der Zahl.
    expect(screen.queryByRole("group", { name: "Zug zuordnen" })).toBeNull();
    const rueck = await screen.findByRole("button", { name: "Zug-Zuordnung rückgängig machen" });
    const leiste = rueck.closest(".daumen-quittung, [role=status], div")!;
    expect(document.body.textContent).toContain("Zug „3. Zug“ gesetzt:");
    expect(document.body.textContent).toContain("3 Einheiten");
    expect(leiste).toBeTruthy();

    await bereit(rueck);
    await nutzer.click(rueck);
    await waitFor(() => expect(zuegeJeEinheit(id)).toEqual([undefined, undefined, undefined]));
    expect(screen.getByRole("group", { name: "Zug zuordnen" }).textContent).toContain("Zug für 3 Einheiten ohne Zug:");
    expect(document.body.textContent).toContain("Zug „3. Zug“ wieder entfernt: 3 Einheiten.");
    expect(screen.queryByRole("button", { name: "Zug-Zuordnung rückgängig machen" })).toBeNull();
  });

  it("Rückgängig nimmt nur zurück, was noch diesen Zug trägt", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["Alpha", "Beta"]);
    render(<Wirt id={id} />);
    const gruppe = screen.getByRole("group", { name: "Zug zuordnen" });
    await nutzer.type(within(gruppe).getByLabelText("Zug für diese Einheiten"), "1. Zug");
    await nutzer.click(within(gruppe).getByRole("button", { name: "Zuordnen" }));
    const rueck = await screen.findByRole("button", { name: "Zug-Zuordnung rückgängig machen" });
    // Zwischen Zuordnen und Rückgängig ändert jemand den Zug einer Einheit.
    const karte = karteVon("Beta");
    await nutzer.click(within(karte).getByRole("button", { name: "Zug ändern" }));
    // Die Karte-Handlung ersetzt die Quittung (R14-D3) — das Rückgängig der Zuordnung ist weg, der Zug von Beta bleibt.
    const feld = within(karte).getByLabelText("Zug");
    await nutzer.clear(feld);
    await nutzer.type(feld, "2. Zug");
    await nutzer.click(within(karte).getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Zug-Zuordnung rückgängig machen" })).toBeNull());
    expect(rueck.isConnected).toBe(false);
    expect(zuegeJeEinheit(id).sort()).toEqual(["1. Zug", "2. Zug"]);
  });
});

describe("R14-D3 Eine ältere Quittung bleibt nicht neben einer neueren Handlung stehen", () => {
  it("„Zur Kenntnis genommen“ weicht, sobald an einer Karte Zug oder Auftrag gesetzt wird", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["Alpha", "Beta"]);
    render(<Wirt id={id} />);
    await nutzer.click(screen.getByRole("button", { name: "Zur Kenntnis genommen" }));
    const rueckKenntnis = await screen.findByRole("button", { name: "Zur Kenntnis genommen rückgängig machen" });
    expect(rueckKenntnis).toBeTruthy();

    const karte = karteVon("Alpha");
    await nutzer.click(within(karte).getByRole("button", { name: "Auftrag/Notiz" }));
    await nutzer.type(within(karte).getByLabelText("Auftrag/Notiz"), "Pumpen Nord");
    await nutzer.click(within(karte).getByRole("button", { name: "Speichern" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Zur Kenntnis genommen rückgängig machen" })).toBeNull());
    expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege.some((e) => e.notiz === "Pumpen Nord")).toBe(true);
  });
});

describe("R14-D4 Verschieben: Rückgängig bleibt nach „Alles klar“ erreichbar", () => {
  it("nach „Alles klar“ steht eine Quittung mit „Rückgängig“ im Ausgangs-Einsatz", async () => {
    const nutzer = userEvent.setup();
    const ziel = einsatzAnlegen("Bereitstellungsraum", EinsatzArt.EINSATZ);
    const id = einsatzMitNeuen(["Crailsheim"]);
    render(<Wirt id={id} />);
    const karte = karteVon("Crailsheim");
    await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Verschieben…" }));
    const wahl = document.querySelector<HTMLDialogElement>("dialog[aria-label='In anderen Einsatz verschieben']")!;
    await nutzer.click(within(wahl).getByRole("button", { name: /Bereitstellungsraum/ }));
    const ergebnis = await waitFor(() => document.querySelector<HTMLDialogElement>("dialog[aria-label='Verschoben']")!);
    await nutzer.click(within(ergebnis).getByRole("button", { name: "Alles klar" }));

    expect(einsaetzeLaden().find((s) => s.id === ziel.id)!.eintraege).toHaveLength(1);
    expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege).toHaveLength(0);
    const rueck = await screen.findByRole("button", { name: /^Verschieben rückgängig machen/ });
    expect(document.body.textContent).toContain("Verschoben:");
    expect(document.body.textContent).toContain("liegt jetzt in „Bereitstellungsraum“");

    await bereit(rueck);
    await nutzer.click(rueck);
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege).toHaveLength(1));
    expect(einsaetzeLaden().find((s) => s.id === ziel.id)!.eintraege).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /^Verschieben rückgängig machen/ })).toBeNull();
  });
});

describe("R14-E1 Übung ↔ Einsatzmeldung an der Karte umstellen", () => {
  function zaehlerEinheiten(): number {
    const felder = [...document.querySelectorAll(".staerke-leiste > div")];
    const f = felder.find((d) => d.querySelector("span")!.textContent === "Gesamt")!;
    return Number(f.querySelector("strong")!.textContent);
  }

  it("macht aus der Übungsmeldung eine zählende, nennt die Folge, und Rückgängig stellt die Übung wieder her", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["Albstadt"], EinsatzArt.EINSATZ, (b) => {
      b.uebung = true;
      b.personal = Array.from({ length: 4 }, (_, i) => ({ ...neuePerson(), nachname: `P${i}`, vorname: "X" }));
    });
    render(<Wirt id={id} />);
    expect(zaehlerEinheiten()).toBe(0);
    expect(document.body.textContent).toContain("1 Übungsmeldung nicht gezählt");

    const karte = karteVon("Albstadt");
    await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Als Einsatzmeldung zählen…" }));
    const frage = await screen.findByRole("dialog", { name: "Als Einsatzmeldung zählen?" });
    expect(frage.textContent).toContain("4 Personen");
    expect(frage.textContent).toContain("zählen");
    await nutzer.click(within(frage).getByRole("button", { name: "Als Einsatzmeldung zählen" }));

    await waitFor(() => expect(zaehlerEinheiten()).toBe(4));
    expect(geltendeJeEinheit(einsaetzeLaden().find((s) => s.id === id)!.eintraege)[0]!.bogen.uebung).toBeFalsy();
    expect(document.body.textContent).toContain("Zählt jetzt als Einsatzmeldung");
    // Die Änderungen gegenüber der Vorfassung nennen die Kennzeichnung als eigene Zeile.
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Änderungen" }));
    expect(karteVon("Albstadt").textContent).toContain("Kennzeichnung Übung → Einsatzmeldung");

    await bereit(screen.getByRole("button", { name: /Rückgängig/ }));
    await nutzer.click(screen.getByRole("button", { name: /Rückgängig/ }));
    await waitFor(() => expect(zaehlerEinheiten()).toBe(0));
    expect(geltendeJeEinheit(einsaetzeLaden().find((s) => s.id === id)!.eintraege)[0]!.bogen.uebung).toBe(true);
    expect(document.body.textContent).toContain("ist wieder als Übung gekennzeichnet");
  });

  it("umgekehrt: „Als Übung kennzeichnen…“ nimmt die Einheit aus den Summen", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["Biberach"], EinsatzArt.EINSATZ, (b) => {
      b.personal = Array.from({ length: 3 }, (_, i) => ({ ...neuePerson(), nachname: `Q${i}`, vorname: "Y" }));
    });
    render(<Wirt id={id} />);
    expect(zaehlerEinheiten()).toBe(3);
    const karte = karteVon("Biberach");
    await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Als Übung kennzeichnen…" }));
    const frage = await screen.findByRole("dialog", { name: "Als Übung kennzeichnen?" });
    await nutzer.click(within(frage).getByRole("button", { name: "Als Übung kennzeichnen" }));
    await waitFor(() => expect(zaehlerEinheiten()).toBe(0));
    expect(document.body.textContent).toContain("Jetzt als Übung gekennzeichnet");
  });
});

describe("R14-D1 Entfernen: die Rückfrage unterscheidet den Trupp von der Stammeinheit", () => {
  it("nennt Nummer, „Trupp 2“, Stärke und den Verbleib der Personen; die Quittung nennt den Teil", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Sinsheim", (b) => {
      b.personal = Array.from({ length: 11 }, (_, i) => ({ ...neuePerson(), nachname: `Person${i}`, vorname: "Max" }));
    }));
    const kopf = einsaetzeLaden()[0]!.eintraege[0]!;
    meldungAufteilen(s.id, kopf.id, { teilEtikett: "Trupp 2", personal: [0, 1, 2, 3], fahrzeuge: [] }, {});
    render(<Wirt id={s.id} />);
    const teilKarte = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes("Trupp 2"))!;
    await nutzer.click(within(teilKarte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(teilKarte).getByRole("button", { name: "Entfernen" }));
    const frage = await screen.findByRole("dialog", { name: "Meldung entfernen?" });
    expect(frage.textContent).toMatch(/Nr\. \d „.*Sinsheim.*" \(Teil „Trupp 2", 4 Personen, Stand/);
    expect(frage.textContent).toContain("Diese 4 Personen zählen danach nirgends mehr");
    expect(frage.textContent).toContain("Zusammenführen");
    await nutzer.click(within(frage).getByRole("button", { name: "Meldung entfernen" }));
    await waitFor(() => expect(document.body.textContent).toContain('Teil „Trupp 2", 4 Personen)'));
  });
});

describe("R14-S3 Marke „neu“ bleibt aufgeklappt, solange der Kasten die Meldung zählt", () => {
  it("die lange Marke nennt „neu“ und das Alter; ohne Kenntnisnahme-Bezug steht nur „kürzlich eingetroffen“", async () => {
    const id = einsatzMitNeuen(["Alpha"]);
    render(<Wirt id={id} />);
    const marke = karteVon("Alpha").querySelector(".neu-badge")!;
    expect(marke.querySelector(".neu-lang")!.textContent).toBe("neu · kürzlich eingetroffen");
    expect(marke.querySelector(".neu-kurz")!.textContent).toBe("neu");
    expect(document.body.textContent).toContain("Neu seit dem letzten Mal (1)");
  });
});

describe("R14-S4 Kontaktzeilen in den Details", () => {
  it("Telefon und Adresse stehen je in einer eigenen Zeile, ohne „·“ am Zeilenrand, mit Umbruchstellen", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["Müllheim"], EinsatzArt.EINSATZ, (b) => {
      const h = b.einheit.hierarchie[0]!;
      h.telefon = "0761 123456";
      h.email = "Poststelle.RSt_Freiburg@thw.de";
    });
    render(<Wirt id={id} />);
    const karte = karteVon("Müllheim");
    await nutzer.click(within(karte).getByRole("button", { name: "Details" }));
    const zeilen = [...karte.querySelectorAll(".bogen-details .kontakt-zeile")];
    expect(zeilen).toHaveLength(2);
    expect(zeilen[0]!.textContent).toBe("Telefon der Dienststelle: 0761 123456"); // R20-K3
    expect(zeilen[1]!.textContent).toBe("E-Mail der Dienststelle: Poststelle.RSt_Freiburg@thw.de");
    expect(zeilen[1]!.querySelectorAll("wbr").length).toBe(3);
    const dd = zeilen[0]!.parentElement!;
    expect(dd.textContent).not.toContain(" · ");
  });
});

describe("R14-O1 Altersangaben laufen im Minutentakt mit", () => {
  it("„gerade eben“ wird ohne Berührung zu „vor 1 Std“, und die Warnmarke erscheint von selbst", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(new Date(2026, 9, 26, 9, 25, 0));
    const s = einsatzAnlegen("Hochwasser Alter", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    const kopf = () => document.body.textContent ?? "";
    expect(kopf()).toContain("(gerade eben)");
    expect(kopf()).not.toContain("älter als 1 Std");

    act(() => {
      vi.advanceTimersByTime(70_000);
    });
    expect(kopf()).toContain("vor 1 Min");
    expect(kopf()).not.toContain("(gerade eben)");

    act(() => {
      vi.advanceTimersByTime(61 * 60_000);
    });
    expect(kopf()).toContain("älter als 1 Std");
  });

  it("die Startseite rechnet das Alter ebenfalls neu, auch bei Rückkehr in die App", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(new Date(2026, 9, 26, 9, 25, 0));
    const s = einsatzAnlegen("Hochwasser Start", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<LetzteMeldungZeit s={einsaetzeLaden().find((x) => x.id === s.id)!} />);
    expect(document.body.textContent).toContain("gerade eben");
    // Das Gerät lag gesperrt: Die Uhr ging weiter, kein Takt kam — erst die Rückkehr in die App zeichnet neu.
    vi.setSystemTime(new Date(2026, 9, 26, 12, 25, 0));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(document.body.textContent).toContain("vor 3 Std");
  });
});

describe("R14-H4 Datensicherung: Fehlermeldung und Quittung widersprechen sich nicht", () => {
  it("nach einer falschen Datei und einer erfolgreichen Sicherung steht nur die Quittung, direkt unter den Knöpfen", async () => {
    const nutzer = userEvent.setup();
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    render(
      <>
        <Fusszeile onBogenOeffnen={async () => true} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Datensicherung" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Datensicherung']")!;
    const feld = dialog.querySelector<HTMLInputElement>('input[type="file"]')!;
    await nutzer.upload(feld, new File(["{}"], "junk.json", { type: "application/json" }));
    expect(await within(dialog).findByRole("alert")).toBeTruthy();

    await nutzer.click(within(dialog).getByRole("button", { name: "Sicherung erstellen…" }));
    await waitFor(() => expect(within(dialog).queryByRole("alert")).toBeNull());
    const quittung = dialog.querySelector(".sicherung-quittung")!;
    expect(quittung.textContent).toContain("erzeugt");
    // Direkt hinter den Knöpfen, vor dem Hinweis „Einspielen ersetzt …“.
    const knoepfe = dialog.querySelector(".aktionen")!;
    expect(knoepfe.nextElementSibling).toBe(quittung);
  });
});

describe("R14-E5 Telefon der Absenderkarte: Rückfrage wie bei der E-Mail", () => {
  function karte(onGespeichert = vi.fn()) {
    render(
      <>
        <AbsenderkarteFeld karte={absenderkarteLaden()} onGespeichert={onGespeichert} startOffen />
        <Dialogschicht />
      </>,
    );
    return onGespeichert;
  }

  it("„0170 abc“ fragt nach; „Nummer prüfen“ speichert nichts, „Trotzdem übernehmen“ speichert die bereinigte Nummer", async () => {
    const nutzer = userEvent.setup();
    const gespeichert = karte();
    await nutzer.type(screen.getByLabelText("Name"), "Max Muster");
    await nutzer.type(screen.getByLabelText("Telefon"), "0170 abc");
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    const frage = await screen.findByRole("dialog", { name: "Telefonnummer übernehmen?" });
    expect(frage.textContent).toContain("abc");
    expect(frage.textContent).toContain('Gespeichert würde: „0170"');
    await nutzer.click(within(frage).getByRole("button", { name: "Nummer prüfen" }));
    expect(gespeichert).not.toHaveBeenCalled();
    expect(absenderkarteLaden().telefon).toBeUndefined();

    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    const zweite = await screen.findByRole("dialog", { name: "Telefonnummer übernehmen?" });
    await nutzer.click(within(zweite).getByRole("button", { name: "Trotzdem übernehmen" }));
    expect(gespeichert).toHaveBeenCalledTimes(1);
    expect(absenderkarteLaden().telefon).toBe("0170");
  });

  it("zwei Nummern in einem Feld: die zweite wird genannt; eine saubere Nummer fragt nicht", async () => {
    const nutzer = userEvent.setup();
    const gespeichert = karte();
    await nutzer.type(screen.getByLabelText("Name"), "Max Muster");
    await nutzer.type(screen.getByLabelText("Telefon"), "0171 1234567 / 0441 99887");
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    const frage = await screen.findByRole("dialog", { name: "Telefonnummer übernehmen?" });
    expect(frage.textContent).toContain("Zweite Nummer");
    await nutzer.click(within(frage).getByRole("button", { name: "Nummer prüfen" }));
    await nutzer.clear(screen.getByLabelText("Telefon"));
    await nutzer.type(screen.getByLabelText("Telefon"), "0171 1234567");
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    expect(screen.queryByRole("dialog", { name: "Telefonnummer übernehmen?" })).toBeNull();
    expect(gespeichert).toHaveBeenCalledTimes(1);
    expect(absenderkarteLaden().telefon).toBe("0171 1234567");
  });
});

describe("R14-E6 „Dies ist eine Übung“ abwählen, solange Namen aus dem Beispiel im Bogen stehen", () => {
  function bogenAusBeispiel() {
    const b = neuerBogen();
    b.uebung = true;
    b.personal = [
      { ...neuePerson(), nachname: "Lang", vorname: "Sabine" },
      { ...neuePerson(), nachname: "Sommer", vorname: "Sandra" },
    ];
    return b;
  }

  it("fragt nach; „Übung beibehalten“ lässt den Haken, „Trotzdem als Einsatz“ nimmt ihn heraus", async () => {
    const nutzer = userEvent.setup();
    const b = bogenAusBeispiel();
    beispielMerken(b);
    render(<SchrittBuehne komponente={SchrittEinsatz} bogen={b} />);
    const haken = screen.getByLabelText("Dies ist eine Übung") as HTMLInputElement;
    expect(haken.checked).toBe(true);
    await nutzer.click(haken);
    const frage = await screen.findByRole("dialog", { name: "Beispieldaten im Bogen" });
    expect(frage.textContent).toContain("2 Personen („Lang, Sabine“, „Sommer, Sandra“)");
    await nutzer.click(within(frage).getByRole("button", { name: "Übung beibehalten" }));
    expect((screen.getByLabelText("Dies ist eine Übung") as HTMLInputElement).checked).toBe(true);

    await nutzer.click(screen.getByLabelText("Dies ist eine Übung"));
    const zweite = await screen.findByRole("dialog", { name: "Beispieldaten im Bogen" });
    await nutzer.click(within(zweite).getByRole("button", { name: "Trotzdem als Einsatz" }));
    await waitFor(() => expect((screen.getByLabelText("Dies ist eine Übung") as HTMLInputElement).checked).toBe(false));
  });

  it("ein Bogen mit eigenen Namen fragt nicht", async () => {
    const nutzer = userEvent.setup();
    const b = bogenAusBeispiel();
    beispielMerken(b);
    b.personal = [{ ...neuePerson(), nachname: "Echt", vorname: "Erika" }];
    render(<SchrittBuehne komponente={SchrittEinsatz} bogen={b} />);
    await nutzer.click(screen.getByLabelText("Dies ist eine Übung"));
    expect(screen.queryByRole("dialog", { name: "Beispieldaten im Bogen" })).toBeNull();
    expect((screen.getByLabelText("Dies ist eine Übung") as HTMLInputElement).checked).toBe(false);
  });
});

describe("R14-E3 Handscanner: ein kurzer Code endet mit einem Ergebnis", () => {
  it("„ab“ + Enter meldet den Scan, statt bei „2 Zeichen …“ stehen zu bleiben", async () => {
    const ergebnis = vi.fn();
    render(<QrScannerWeb onErgebnis={ergebnis} onAbbruch={() => {}} fortschritt="" />);
    // Ohne Kamera steht der Handscanner-Weg da; die Lauscher hängen unabhängig davon am Fenster.
    fireEvent.keyDown(window, { key: "a" });
    fireEvent.keyDown(window, { key: "b" });
    await waitFor(() => expect(document.body.textContent).toMatch(/Handscanner erkannt — 2 Zeichen/));
    fireEvent.keyDown(window, { key: "Enter" });
    expect(ergebnis).toHaveBeenCalledWith("ab");
    await waitFor(() => expect(document.body.textContent).not.toMatch(/Handscanner erkannt/));
  });

  it("Enter ohne Zeichen tut nichts, ein langer Code geht wie bisher durch", () => {
    const ergebnis = vi.fn();
    render(<QrScannerWeb onErgebnis={ergebnis} onAbbruch={() => {}} fortschritt="" />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(ergebnis).not.toHaveBeenCalled();
    for (const z of "https://example.org/x") fireEvent.keyDown(window, { key: z });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(ergebnis).toHaveBeenCalledWith("https://example.org/x");
  });
});
