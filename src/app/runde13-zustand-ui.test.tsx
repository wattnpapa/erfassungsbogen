/**
 * Runde 13, Block Zustand: Verhalten in der Oberfläche (jsdom) — Einsatzbeginn entfernen (D1), Absenderkarte leeren (D2),
 * Aufteilen ohne Rest (D3), Schnellerfassung (S2), Eingabe beim Verlassen der Karte (S3), Doppeltipp beim
 * Sammel-PDF (G1), „Neu laden“ im Update-Hinweis (O4), Ersetzen einer Vorlage (D4).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { neuePerson, neuerBogen } from "./hilfen";
import { LagemonitorBlock } from "./lagemonitor-ui";
import { einsatzbeginnLaden, einsatzbeginnSetzen } from "./lagemonitor-beginn";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import { absenderkarteLaden, absenderkarteSpeichern } from "./absenderkarte";
import { AufteilenPanel } from "./aufteilen-ui";
import { Uebersicht } from "./schritte/uebersicht";
import { vorlageAnlegen, vorlagenLaden } from "./vorlagen";
import { arbeiten, arbeitetZuruecksetzen } from "./arbeitet";
import { ausgabeSperreSetzen, ausgabeSperreZuruecksetzen } from "./ausgabe-sperre";
import { WebUpdateBanner } from "./aktualisierung";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittSofortbedarf } from "./schritte/sofortbedarf";
import { SchrittFahrzeuge } from "./schritte/fahrzeuge";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

function einsatzMit(namen: string[]) {
  const angelegt = einsatzAnlegen("Hochwasser Wardenburg", EinsatzArt.EINSATZ);
  for (const n of namen) meldungHinzufuegen(angelegt.id, bogenMitName(n));
  return angelegt.id;
}

type Props = Parameters<typeof EinsatzDetail>[0];

function ansicht(einsatzId: string, extra: Partial<Props> = {}) {
  return render(
    <>
      <EinsatzDetail
        einsatz={einsaetzeLaden().find((s) => s.id === einsatzId)!}
        onZurueck={() => {}}
        onGeaendert={() => {}}
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
    </>,
  );
}

describe("R13-D1 Einsatzbeginn entfernen fragt nach", () => {
  beforeEach(() => localStorage.clear());

  it("„Beginn entfernen“ nennt den Wert; „Beginn behalten“ ändert nichts, die Bestätigung entfernt ihn", async () => {
    const nutzer = userEvent.setup();
    const einsatzId = "e-beginn";
    const beginn = new Date(2026, 9, 25, 18, 30).getTime();
    expect(einsatzbeginnSetzen(einsatzId, beginn, [einsatzId])).toBe(true);
    render(
      <>
        <LagemonitorBlock einsatzId={einsatzId} alleIds={[einsatzId]} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Beginn entfernen" }));
    const frage = await screen.findByRole("dialog", { name: "Einsatzbeginn entfernen?" });
    expect(frage.textContent).toContain("18:30 Uhr");
    expect(frage.textContent).toContain("nicht mehr gespeichert");
    expect(einsatzbeginnLaden(einsatzId)).toBe(beginn); // noch unverändert, solange gefragt wird

    await nutzer.click(within(frage).getByRole("button", { name: "Beginn behalten" }));
    expect(einsatzbeginnLaden(einsatzId)).toBe(beginn);

    await nutzer.click(screen.getByRole("button", { name: "Beginn entfernen" }));
    const zweite = await screen.findByRole("dialog", { name: "Einsatzbeginn entfernen?" });
    await nutzer.click(within(zweite).getByRole("button", { name: "Beginn entfernen" }));
    expect(einsatzbeginnLaden(einsatzId)).toBeNull();
    expect(screen.queryByRole("button", { name: "Beginn entfernen" })).toBeNull();
  });
});

describe("R13-D2 Absenderkarte mit leeren Feldern übernehmen", () => {
  beforeEach(() => localStorage.clear());

  it("fragt wie „Angaben entfernen…“ nach, statt still zu löschen", async () => {
    const nutzer = userEvent.setup();
    absenderkarteSpeichern({ name: "Max Muster", telefon: "01711234567" });
    const gespeichert = vi.fn();
    render(
      <>
        <AbsenderkarteFeld karte={absenderkarteLaden()} onGespeichert={gespeichert} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "ändern" }));
    await nutzer.clear(screen.getByLabelText("Name"));
    await nutzer.clear(screen.getByLabelText("Telefon"));
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));

    const frage = await screen.findByRole("dialog", { name: "Absenderangaben entfernen?" });
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect(gespeichert).not.toHaveBeenCalled();
    expect(absenderkarteLaden().name).toBe("Max Muster");

    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Absenderangaben entfernen?" })).getByRole("button", { name: "Angaben entfernen" }));
    expect(gespeichert).toHaveBeenCalledTimes(1);
    expect(absenderkarteLaden()).toEqual({});
  });

  it("ohne gespeicherte Karte schließt „Übernehmen“ mit leeren Feldern ohne Frage", async () => {
    const nutzer = userEvent.setup();
    const gespeichert = vi.fn();
    render(
      <>
        <AbsenderkarteFeld karte={{}} startOffen onGespeichert={gespeichert} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(gespeichert).not.toHaveBeenCalled();
  });
});

describe("R13-D3 Aufteilen mit allen Personen", () => {
  beforeEach(() => localStorage.clear());

  function panel() {
    const b = bogenMitName("Wardenburg");
    b.personal = [
      { ...neuePerson(), nachname: "Muster", vorname: "Max" },
      { ...neuePerson(), nachname: "Beispiel", vorname: "Eva" },
    ];
    b.fahrzeuge = [{ typ: { code: 3 } }]; // bleibt beim Rest: der Kern lässt „alle Personen“ dann zu
    const id = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ).id;
    meldungHinzufuegen(id, b);
    const eintrag = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!;
    const onAufteilen = vi.fn();
    render(
      <>
        <AufteilenPanel eintrag={eintrag} onAbbrechen={() => {}} onAufteilen={onAufteilen} />
        <Dialogschicht />
      </>,
    );
    return onAufteilen;
  }

  it("warnt, dass nichts übrig bleibt; „Zurück zur Auswahl“ teilt nicht, „Trotzdem aufteilen“ schon", async () => {
    const nutzer = userEvent.setup();
    const onAufteilen = panel();
    await nutzer.type(screen.getByLabelText("Bezeichnung des abgeteilten Teils"), "Alle");
    await nutzer.click(screen.getByRole("checkbox", { name: "Muster, Max" }));
    await nutzer.click(screen.getByRole("checkbox", { name: "Beispiel, Eva" }));
    await nutzer.click(screen.getByRole("button", { name: "Aufteilen" }));

    const frage = await screen.findByRole("dialog", { name: "Es bleibt niemand übrig" });
    await nutzer.click(within(frage).getByRole("button", { name: "Zurück zur Auswahl" }));
    expect(onAufteilen).not.toHaveBeenCalled();

    await nutzer.click(screen.getByRole("button", { name: "Aufteilen" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Es bleibt niemand übrig" })).getByRole("button", { name: "Trotzdem aufteilen" }));
    expect(onAufteilen).toHaveBeenCalledTimes(1);
  });

  it("teilt ohne Rückfrage, wenn jemand übrig bleibt", async () => {
    const nutzer = userEvent.setup();
    const onAufteilen = panel();
    await nutzer.type(screen.getByLabelText("Bezeichnung des abgeteilten Teils"), "Fachberater");
    await nutzer.click(screen.getByRole("checkbox", { name: "Muster, Max" }));
    await nutzer.click(screen.getByRole("button", { name: "Aufteilen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onAufteilen).toHaveBeenCalledTimes(1);
  });
});

describe("R13-D4 Ersetzen einer Vorlage nennt auch Ort/Auftrag und Sofortbedarf", () => {
  beforeEach(() => localStorage.clear());

  it("die Rückfrage führt den Unterschied beim Auftrag auf", async () => {
    const nutzer = userEvent.setup();
    const alt = bogenMitName("OV Test");
    const v = vorlageAnlegen("OV Test", alt);
    // Die gespeicherte Vorlage trägt einen Auftrag (ältere Vorlagen oder von Hand eingespielt).
    const roh = JSON.parse(localStorage.getItem("eeb.vorlagen.v1")!) as Array<{ id: string; bogen: Erfassungsbogen }>;
    roh.find((x) => x.id === v.id)!.bogen.einsatz.ortAuftrag = "Auftrag ALT wichtig";
    localStorage.setItem("eeb.vorlagen.v1", JSON.stringify(roh));
    expect(vorlagenLaden()[0]!.bogen.einsatz.ortAuftrag).toBe("Auftrag ALT wichtig");

    render(
      <>
        <Uebersicht bogen={bogenMitName("OV Test")} geheZu={() => {}} neu={() => {}} onVorlageGespeichert={() => {}} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Als Vorlage speichern" }));
    const frage = await screen.findByRole("dialog", { name: "Als Vorlage speichern" });
    const feld = within(frage).getByRole("textbox");
    await nutzer.clear(feld);
    await nutzer.type(feld, "OV Test");
    await nutzer.click(within(frage).getByRole("button", { name: "Vorlage speichern" }));
    const gleich = await screen.findByRole("dialog", { name: "Vorlage mit diesem Namen vorhanden" });
    expect(gleich.textContent).toContain("Weitere Unterschiede");
    expect(gleich.textContent).toContain("Ort/Auftrag: „Auftrag ALT wichtig\" → „leer\"");
  });
});

describe("R13-S2 Schnellerfassung ohne Einsatz: Ablegen kommt zuerst", () => {
  function schnell(mitAblegen: boolean) {
    const b = bogenMitName("Kiel");
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.staerkeManuell = { fuehrer: 1, unterfuehrer: 2, mannschaft: 6, gesamt: 9 };
    const ablegen = vi.fn();
    render(
      <>
        <Uebersicht bogen={b} geheZu={() => {}} neu={() => {}} onInEinsatzAufnehmen={mitAblegen ? ablegen : undefined} />
        <Dialogschicht />
      </>,
    );
    return ablegen;
  }

  it("der erste, hervorgehobene Knopf legt in die Sammlung ab; „Bogen übergeben…“ steht dahinter mit Erklärung", async () => {
    const nutzer = userEvent.setup();
    const ablegen = schnell(true);
    const knoepfe = [...document.querySelectorAll<HTMLButtonElement>(".uebersicht-aktionen button")];
    expect(knoepfe[0]!.textContent).toBe("In Einsatz-Sammlung ablegen…");
    expect(knoepfe[0]!.className).toContain("primaer");
    expect(knoepfe[1]!.textContent).toBe("Bogen übergeben…");
    expect(knoepfe[1]!.className).not.toContain("primaer");
    expect(document.querySelector(".schnell-hinweis")!.textContent).toContain("Meldung einer fremden Einheit");
    await nutzer.click(knoepfe[0]!);
    expect(ablegen).toHaveBeenCalledTimes(1);
  });

  it("ohne Ablegen-Weg bleibt „Bogen übergeben…“ der erste Knopf", () => {
    schnell(false);
    const erster = document.querySelector<HTMLButtonElement>(".uebersicht-aktionen button")!;
    expect(erster.textContent).toBe("Bogen übergeben…");
    expect(document.querySelector(".schnell-hinweis")).toBeNull();
  });
});

describe("R13-S3 Eingabe in den Karten-Feldern überlebt das Verlassen der Ansicht", () => {
  beforeEach(() => localStorage.clear());

  it("Auftrag/Notiz wird gesichert, wenn die Karte ohne Fokuswechsel verschwindet (Browser-Zurück)", async () => {
    const nutzer = userEvent.setup();
    const einsatzId = einsatzMit(["Wardenburg"]);
    ansicht(einsatzId);
    await nutzer.click(screen.getByRole("button", { name: "Auftrag/Notiz" }));
    await nutzer.type(screen.getByLabelText("Auftrag/Notiz"), "Pumpen Keller Nord, Abschnitt 2");
    expect(einsaetzeLaden()[0]!.eintraege[0]!.notiz).toBeUndefined();

    cleanup(); // Ansicht verlassen, ohne dass das Feld den Fokus verliert

    expect(einsaetzeLaden()[0]!.eintraege[0]!.notiz).toBe("Pumpen Keller Nord, Abschnitt 2");
  });

  it("Zug wird gesichert; ein leeres Feld ändert nichts", async () => {
    const nutzer = userEvent.setup();
    const einsatzId = einsatzMit(["Wardenburg"]);
    ansicht(einsatzId);
    await nutzer.click(screen.getByRole("button", { name: "Zug zuordnen" }));
    await nutzer.type(screen.getByLabelText("Zug"), "1. Zug");
    cleanup();
    expect(einsaetzeLaden()[0]!.eintraege[0]!.zugEtikett).toBe("1. Zug");

    // Zweite Runde mit leerem Feld: nichts wird gelöscht.
    ansicht(einsatzId);
    await nutzer.click(screen.getByRole("button", { name: /Zug/ }));
    cleanup();
    expect(einsaetzeLaden()[0]!.eintraege[0]!.zugEtikett).toBe("1. Zug");
  });

  it("eine in einem anderen Fenster entfernte Einheit bleibt entfernt (nichts wird neu angelegt)", async () => {
    const nutzer = userEvent.setup();
    const einsatzId = einsatzMit(["Wardenburg", "Hatten"]);
    ansicht(einsatzId);
    const karte = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes("Hatten"))!;
    await nutzer.click(within(karte).getByRole("button", { name: "Auftrag/Notiz" }));
    await nutzer.type(within(karte).getByLabelText("Auftrag/Notiz"), "Pumpen Nord");
    const vorher = einsaetzeLaden()[0]!.eintraege.length;
    cleanup();
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(vorher);
  });
});

describe("R13-G1 Doppeltipp auf „Einsatz weitergeben / sichern“", () => {
  beforeEach(() => {
    localStorage.clear();
    ausgabeSperreSetzen(2000);
  });
  afterEach(() => {
    ausgabeSperreSetzen(0);
    ausgabeSperreZuruecksetzen();
    arbeitetZuruecksetzen();
  });

  /** Klick mit fester Ereigniszeit: Der Finger tippte zu diesem Zeitpunkt, bearbeitet wird der Tipp später. */
  function tipp(knopf: HTMLElement, zeit: number) {
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "timeStamp", { value: zeit });
    fireEvent(knopf, ev);
  }

  it("ein zweiter Tipp während der Erzeugung erzeugt keine zweite Datei, auch wenn er erst danach bearbeitet wird", async () => {
    const einsatzId = einsatzMit(["Wardenburg"]);
    let fertig!: () => void;
    const erzeugen = vi.fn(() => arbeiten("weitergeben", () => new Promise<void>((r) => (fertig = r))));
    ansicht(einsatzId, { onWeitergeben: () => void erzeugen() });
    const knopf = () => screen.getByRole("button", { name: /^Einsatz (weitergeben|wird erzeugt)/ });

    tipp(knopf(), performance.now() - 1);
    await waitFor(() => expect(knopf().textContent).toBe("Einsatz wird erzeugt…"));
    expect(knopf().getAttribute("aria-busy")).toBe("true");
    expect((knopf() as HTMLButtonElement).disabled).toBe(true);

    const zweiterTipp = performance.now(); // 150 ms nach dem ersten, mitten in der Erzeugung
    await waitFor(() => expect(fertig).toBeTypeOf("function")); // die Aktion läuft erst nach dem ersten Bild
    fertig();
    await waitFor(() => expect(knopf().textContent).toMatch(/^Einsatz weitergeben \/ sichern/));

    tipp(knopf(), zweiterTipp); // der verspätet bearbeitete Doppeltipp
    expect(erzeugen).toHaveBeenCalledTimes(1);
  });
});

describe("R13-E1 Sofortbedarf: Satz und gespeicherter Wert passen zusammen", () => {
  function bedarf() {
    const b = neuerBogen();
    b.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    render(<SchrittBuehne komponente={SchrittSofortbedarf} bogen={b} />);
    return screen.getByLabelText("Diesel (l)") as HTMLInputElement;
  }

  it("beim Tippen von „5O“ nennt der Satz, dass 5 weitergilt", async () => {
    const nutzer = userEvent.setup();
    const diesel = bedarf();
    await nutzer.type(diesel, "5O");
    const meldungen = document.querySelector(".zahl-meldungen")!;
    expect(meldungen.textContent).toContain("„5O“ ist keine Zahl — nicht übernommen. Es gilt weiter 5.");
    await nutzer.tab();
    expect(diesel.value).toBe("5"); // das Feld zeigt, was gespeichert ist — wie der Satz sagt
  });

  it("beim Einfügen von „5O“ in ein leeres Feld gilt weiter 0", async () => {
    const nutzer = userEvent.setup();
    const diesel = bedarf();
    await nutzer.click(diesel);
    await nutzer.paste("5O");
    expect(document.querySelector(".zahl-meldungen")!.textContent).toContain("Es gilt weiter 0.");
    await nutzer.tab();
    expect(diesel.value).toBe("0");
  });
});

describe("R13-O4 „Neu laden“ im Update-Hinweis", () => {
  it("rendert nichts, solange keine neue Version wartet (Banner erscheint erst auf Meldung des Service Workers)", () => {
    render(<WebUpdateBanner />);
    expect(document.querySelector(".update-banner")).toBeNull();
  });
});
