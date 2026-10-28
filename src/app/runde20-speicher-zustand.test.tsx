/**
 * Runde 20, Block Speicher, Zustand: Verhalten bei vollem Gerätespeicher (jsdom, Speicher mit fester Kapazität).
 * Die Ablage des geschlossenen Bogens (R20-D1) steht in runde20-speicher-d1.test.tsx.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuerBogen } from "./hilfen";

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
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

function belegung(): number {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    n += k.length + (localStorage.getItem(k) ?? "").length;
  }
  return n;
}

/** Kapazität des Speichers festlegen: Schreiben, das darüber käme, wirft wie der Browser. */
function kapazitaet(grenze: number): void {
  const echt = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
    const alt = this.getItem(k);
    const neu = belegung() - (alt === null ? 0 : k.length + alt.length) + k.length + v.length;
    if (neu > grenze) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    echt.call(this, k, v);
  });
}

// R20-D1 (Ablage des geschlossenen Bogens) steht in runde20-speicher-d1.test.tsx.

// ------------------------------------------------------------------------------------------------ Einsatzansicht

import { useState } from "react";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, einsatzLoeschen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { LagemonitorBlock } from "./lagemonitor-ui";
import { einsatzbeginnLaden, einsatzbeginnSetzen } from "./lagemonitor-beginn";
import { meldungAufnehmen } from "./eintrag-zeiten";
import { platzRat, sammlungZuruecksetzen, SpeicherVollFehler, speicherVollMeldung } from "./eintrag-zeiten";
import { sicherungErstellen, sicherungQuittungText, sicherungVermerkFehlte, SICHERUNG_EREIGNIS } from "./sicherung";
import { nummernHinweisLaden, nummernHinweisLoeschen, nummernHinweisMerken } from "./nummern-hinweis";
import { bemerkungKurz } from "./pdf-dokument";
import { lageblattVermerken } from "./export-stand";
import { nichtGespeichert } from "./abschluss-block";

function bogenName(name: string) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

type Props = Parameters<typeof EinsatzDetail>[0];

function Wirt({ id, extra }: { id: string; extra?: Partial<Props> }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  return (
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={() => setEinsatz(einsaetzeLaden().find((s) => s.id === id) ?? einsatz)}
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

const dialogMit = (titel: string | RegExp) =>
  [...document.querySelectorAll<HTMLDialogElement>("dialog[open]")].find((d) => (typeof titel === "string" ? d.getAttribute("aria-label") === titel : titel.test(d.getAttribute("aria-label") ?? "")));

describe("R20-W1 „Endgültig löschen“ im Notweg bei vollem Speicher", () => {
  it("löscht nicht mit einem Tipp: eine zweite Rückfrage nennt die Folge, „Einsatz behalten“ lässt alles stehen", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Notweg", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenName("Albstadt"));
    meldungHinzufuegen(s.id, bogenName("Biberach"));
    const sichern = vi.fn();
    render(<Wirt id={s.id} extra={{ onWeitergeben: sichern }} />);
    kapazitaet(belegung()); // voll: Schreiben, das mehr braucht als vorher da war, scheitert

    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Einsatz löschen?" })).getByRole("button", { name: "In den Papierkorb" }));
    const notweg = await screen.findByRole("dialog", { name: "Nicht gelöscht" }, { timeout: 5000 }); // der Notweg wird nachgeladen
    // Kein Knopf, der mit einem Tipp löscht: „Endgültig löschen…“ führt weiter, der Hauptweg sichert zuerst.
    const namen = within(notweg).getAllByRole("button").map((b) => b.textContent);
    expect(namen).toEqual(expect.arrayContaining(["Erst sichern (Sammel-PDF erzeugen)", "Endgültig löschen…", "Einsatz behalten"]));
    expect(namen).not.toContain("Endgültig löschen");
    expect(einsaetzeLaden()).toHaveLength(1);

    // „Endgültig löschen…“ nennt in einer zweiten Rückfrage die Folge; noch ist nichts gelöscht.
    await nutzer.click(within(notweg).getByRole("button", { name: "Endgültig löschen…" }));
    const zweite = await screen.findByRole("dialog", { name: /endgültig löschen\?/ });
    expect(zweite.textContent).toContain("2 Meldungen sind danach weg — nicht im Papierkorb, nicht rückholbar");
    expect(zweite.textContent).toContain("Es gibt noch keinen Export: das wäre die einzige Kopie");
    expect(einsaetzeLaden()).toHaveLength(1);
    await nutzer.click(within(zweite).getByRole("button", { name: "Einsatz behalten" }));
    expect(einsaetzeLaden()).toHaveLength(1);

    // „Erst sichern“ erzeugt die Datei und löscht nichts.
    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Einsatz löschen?" })).getByRole("button", { name: "In den Papierkorb" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Nicht gelöscht" }, { timeout: 5000 })).getByRole("button", { name: "Erst sichern (Sammel-PDF erzeugen)" }));
    expect(sichern).toHaveBeenCalledTimes(1);
    expect(einsaetzeLaden()).toHaveLength(1);

    // Erst die bewusste Bestätigung der zweiten Rückfrage löscht, und dann ohne Papierkorb.
    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Einsatz löschen?" })).getByRole("button", { name: "In den Papierkorb" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Nicht gelöscht" }, { timeout: 5000 })).getByRole("button", { name: "Endgültig löschen…" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: /endgültig löschen\?/ })).getByRole("button", { name: "Ja, endgültig löschen" }));
    await waitFor(() => expect(einsaetzeLaden()).toHaveLength(0));
  }, 30000);
});

describe("R20-O3 Nach einem Speicherfehler bleibt der getippte Text im Feld", () => {
  it("Auftrag/Notiz und Zug zuordnen: das Feld bleibt mit dem Text offen, der Dialog ist schnell zu", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Text", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenName("Crailsheim"));
    render(<Wirt id={s.id} />);
    kapazitaet(belegung());

    await nutzer.click(screen.getByRole("button", { name: "Auftrag/Notiz" }));
    await nutzer.type(screen.getByLabelText("Auftrag/Notiz"), "Pumpen Keller Nord");
    await nutzer.click(screen.getByRole("button", { name: "Speichern" }));
    const fehler = await screen.findByRole("dialog", { name: "Auftrag/Notiz" });
    expect(fehler.textContent).toContain("Der Text bleibt im Feld stehen");
    expect(fehler.textContent).toContain("Pumpen Keller Nord");
    await nutzer.click(within(fehler).getByRole("button", { name: "Alles klar" }));
    expect((screen.getByLabelText("Auftrag/Notiz") as HTMLInputElement).value).toBe("Pumpen Keller Nord");
    expect(einsaetzeLaden()[0]!.eintraege[0]!.notiz).toBeUndefined();
    // Es folgt kein zweiter Dialog aus dem Fokuswechsel (kein Dialog-Kreislauf).
    expect(document.querySelectorAll("dialog[open]")).toHaveLength(0);

    await nutzer.click(screen.getByRole("button", { name: "Zug zuordnen" }));
    await nutzer.type(screen.getByLabelText("Zug"), "2. Zug");
    const speichernKnoepfe = screen.getAllByRole("button", { name: "Speichern" });
    await nutzer.click(speichernKnoepfe[speichernKnoepfe.length - 1]!);
    const fehler2 = await screen.findByRole("dialog", { name: "Zug zuordnen" });
    expect(fehler2.textContent).toContain("2. Zug");
    await nutzer.click(within(fehler2).getByRole("button", { name: "Alles klar" }));
    expect((screen.getByLabelText("Zug") as HTMLInputElement).value).toBe("2. Zug");
  }, 30000);
});

describe("R20-H13/N9 Texte bei vollem Speicher", () => {
  it("nennt nur Wege, die es im jetzigen Zustand gibt, und die Belegung", () => {
    // Leerer Papierkorb, kein Einsatz: weder „Papierkorb leeren“ noch „Einsatz löschen“.
    const leer = platzRat();
    expect(leer).not.toMatch(/Papierkorb leeren|Einsatz endgültig löschen/);
    expect(leer).toContain("Alle Daten löschen");
    // Ein Einsatz im Papierkorb und einer in der Liste: beide Wege stehen da, der Papierkorb mit Zahl.
    einsatzAnlegen("Hochwasser Rat", EinsatzArt.EINSATZ);
    const weg = einsatzAnlegen("Hochwasser Weg", EinsatzArt.EINSATZ);
    einsatzLoeschen(weg.id); // in den Papierkorb, wie die Einsatzansicht es tut
    const rat = platzRat();
    expect(rat).toContain("den Papierkorb leeren (1 Einsatz)");
    expect(rat).toContain("einen gesicherten Einsatz endgültig löschen");
    expect(rat.startsWith("Erst sichern")).toBe(true);
    expect(new SpeicherVollFehler().message).toMatch(/^Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll \(zu \d+ % belegt\)\. Erst sichern/);
    expect(speicherVollMeldung(2)).toContain(rat);
  });

  it("die Dialoge „Übergabe nicht vermerkt“ & Co. nennen den Weg, der im jetzigen Zustand besteht (N9)", async () => {
    render(<Dialogschicht />);
    einsatzAnlegen("Hochwasser Eins", EinsatzArt.EINSATZ);
    nichtGespeichert("Übergabe nicht vermerkt", "Die Übergabe");
    const d = await screen.findByRole("dialog", { name: "Übergabe nicht vermerkt" });
    // Kein Papierkorb zu leeren: dieser Weg steht nicht da; „einen gesicherten Einsatz endgültig löschen“ gibt es.
    expect(d.textContent).toContain("Nichts hat sich geändert");
    expect(d.textContent).not.toContain("Papierkorb leeren");
    expect(d.textContent).toContain("einen gesicherten Einsatz endgültig löschen");
  });

  it("„Abrücken“ bei vollem Speicher nennt Nr. und Namen der Einheit vor dem Grund und bleibt kurz", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Abruecken", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenName("Husum"));
    render(<Wirt id={s.id} />);
    kapazitaet(belegung());
    await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
    const d = await screen.findByRole("dialog", { name: "Abrücken" });
    // Zwei Sätze vorn (was nicht geschah, der eine Weg), der lange Rat steht hinter „Mehr dazu“.
    const vorn = d.querySelector("p")!.textContent!;
    expect(vorn).toBe("Nr. 1 „THW Husum\" ist nicht als abgerückt vermerkt. Der Speicher ist voll — erst sichern (Einsatz weitergeben / sichern).");
    expect(vorn.length).toBeLessThan(150); // höchstens vier Zeilen am 360-px-Telefon
    const mehr = d.querySelector<HTMLDetailsElement>("details.hinweis-mehr")!;
    expect(mehr.open).toBe(false);
    expect(mehr.textContent).toContain("Speichern fehlgeschlagen");
    expect(d.textContent).not.toMatch(/Verkleinern|ins Papierkorb-Legen/);
  }, 30000);
});

describe("R20-H14 „Zur Kenntnis genommen“ bei vollem Speicher", () => {
  it("zeigt keine Erfolgsquittung mit „Rückgängig“, wenn nichts gespeichert wurde", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Kenntnis", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenName("Zeitz"));
    const r = render(<Wirt id={s.id} />);
    for (const n of ["Weinsberg", "Albstadt"]) meldungHinzufuegen(s.id, bogenName(n));
    r.rerender(<Wirt key="neu" id={s.id} />); // neu seit der letzten Kenntnisnahme
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("voll", "QuotaExceededError");
    });
    await nutzer.click(within(document.querySelector<HTMLElement>(".stapel-eingang")!).getByRole("button", { name: "Zur Kenntnis genommen" }));
    const d = await screen.findByRole("dialog", { name: "Kenntnisnahme nicht gespeichert" });
    await nutzer.click(within(d).getByRole("button", { name: "Alles klar" }));
    expect(screen.queryByRole("button", { name: "Zur Kenntnis genommen rückgängig machen" })).toBeNull();
    expect(document.body.textContent).not.toMatch(/Zur Kenntnis genommen: \d+ Einheiten/);
  }, 30000);
});

describe("R20-S1/N4/H2 Quittungsleiste nach der Aufnahme von Hand", () => {
  it("zeigt Nummer und Namen am Bildrand, „Rückgängig“ nimmt die Einheit wieder heraus", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Aufnahme", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenName("Albstadt"));
    const r = meldungAufnehmen(s.id, bogenName("Husum"), { quelle: "manuell" })!;
    render(<Wirt id={s.id} extra={{ eingang: { schluessel: r.eintrag.einheitSchluessel, nonce: 1 } }} />);
    const leiste = await waitFor(() => {
      const l = document.querySelector<HTMLElement>(".quittung-daumen");
      expect(l).not.toBeNull();
      return l!;
    });
    expect(leiste.textContent).toMatch(/Nr\. 2 „THW Husum“ abgelegt/);
    await nutzer.click(within(leiste).getByRole("button", { name: "Aufnahme rückgängig machen" }));
    await waitFor(() => expect(einsaetzeLaden()[0]!.eintraege.map((e) => e.bogen.einheit.hierarchie[0]!.name)).toEqual(["Albstadt"]), { timeout: 5000 });
    expect(document.body.textContent).toMatch(/Aufnahme zurückgenommen: Nr\. 2 „THW Husum"/);
  }, 30000);
});

describe("R20-W5 Quittung „Zug zugeordnet“ nennt die Zahl der Einheiten in der Kurzfassung", () => {
  it("steht als „Zug „1. Zug“: 2 Einheiten“ in der sichtbaren Leiste", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Zug", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenName("Zeitz"));
    const r = render(<Wirt id={s.id} />);
    for (const n of ["Albstadt", "Biberach"]) meldungHinzufuegen(s.id, bogenName(n));
    r.rerender(<Wirt key="neu" id={s.id} />); // zwei Einheiten neu seit der letzten Kenntnisnahme
    const gruppe = document.querySelector<HTMLElement>(".stapel-eingang .zug-schnell")!;
    await nutzer.type(gruppe.querySelector<HTMLInputElement>("input")!, "1. Zug");
    await nutzer.click(within(gruppe).getByRole("button", { name: "Zuordnen" }));
    const leiste = await waitFor(() => {
      const l = document.querySelector<HTMLElement>(".quittung-daumen");
      expect(l).not.toBeNull();
      return l!;
    });
    expect(leiste.textContent).toMatch(/Zug „1\. Zug“: 2 Einheiten/);
  }, 30000);
});

describe("R20-D2 Einsatzbeginn im Feld überschrieben: Leiste mit „Rückgängig“", () => {
  it("die Quittungsleiste nennt den alten Beginn und holt ihn zurück", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Beginn", EinsatzArt.EINSATZ);
    const alt = new Date(2026, 9, 28, 7, 7).getTime();
    einsatzbeginnSetzen(s.id, alt, [s.id]);
    render(<LagemonitorBlock einsatzId={s.id} alleIds={[s.id]} />);
    fireEvent.change(document.querySelector<HTMLInputElement>("input[type='datetime-local']")!, { target: { value: "2026-10-27T20:00" } });
    const leiste = await waitFor(() => {
      const l = document.querySelector<HTMLElement>(".quittung-daumen");
      expect(l).not.toBeNull();
      return l!;
    });
    expect(leiste.textContent).toMatch(/Beginn war 07:07 Uhr/);
    await nutzer.click(within(leiste).getByRole("button", { name: "Alten Einsatzbeginn zurückholen" }));
    expect(einsatzbeginnLaden(s.id)).toBe(alt);
  }, 30000);
});

describe("R20-O2 Sicherung bei vollem Speicher und Übergabe-Liste", () => {
  it("meldet den fehlenden Vermerk wie die Exporte und zeichnet Ansichten neu", () => {
    const gehoert = vi.fn();
    window.addEventListener(SICHERUNG_EREIGNIS, gehoert);
    sicherungErstellen();
    expect(sicherungVermerkFehlte()).toBe(false);
    expect(sicherungQuittungText("x.json", false, false)).not.toContain("Vermerk");
    kapazitaet(belegung());
    sicherungErstellen(new Date(Date.now() * 10)); // ein Zeichen länger als der gespeicherte Zeitpunkt: passt nicht mehr hinein
    expect(sicherungVermerkFehlte()).toBe(true);
    expect(sicherungQuittungText("x.json", false, sicherungVermerkFehlte())).toContain("Vermerk nicht gespeichert (Speicher voll)");
    expect(gehoert).toHaveBeenCalledTimes(2);
    window.removeEventListener(SICHERUNG_EREIGNIS, gehoert);
  });
});

describe("R20-D3 Nummernwechsel beim Zusammenführen", () => {
  it("der Hinweis bleibt gemerkt, bis er quittiert oder ein neues Lageblatt vermerkt wird", () => {
    const s = einsatzAnlegen("Hochwasser Nummern", EinsatzArt.EINSATZ);
    expect(nummernHinweisLaden(s.id)).toBeNull();
    expect(nummernHinweisMerken(s.id, "2 Nummern geändert — Lageblatt neu drucken.")).toBe(true);
    expect(nummernHinweisLaden(s.id)).toContain("2 Nummern geändert");
    nummernHinweisLoeschen(s.id);
    expect(nummernHinweisLaden(s.id)).toBeNull();
    // Ein neues Lageblatt trägt die geltenden Nummern: der Hinweis hat seinen Zweck erfüllt.
    nummernHinweisMerken(s.id, "1 Nummer geändert — Lageblatt neu drucken.");
    lageblattVermerken(einsaetzeLaden().find((x) => x.id === s.id)!);
    expect(nummernHinweisLaden(s.id)).toBeNull();
  });

  it("„Zusammenführen rückgängig“ setzt die Sammlung auf den früheren Stand", () => {
    const s = einsatzAnlegen("Hochwasser Zurueck", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenName("Ansbach"));
    const vorher = structuredClone(einsaetzeLaden().find((x) => x.id === s.id)!);
    meldungHinzufuegen(s.id, bogenName("Sinsheim"));
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(2);
    sammlungZuruecksetzen(vorher);
    expect(einsaetzeLaden()[0]!.eintraege.map((e) => e.bogen.einheit.hierarchie[0]!.name)).toEqual(["Ansbach"]);
  });
});

describe("R20-A5 Lageblatt kürzt die Bemerkung nicht mitten im Satz", () => {
  it("schneidet an der Satzgrenze, ohne „… nicht …“ stehen zu lassen", () => {
    const frei = "2 Sollplätze unbesetzt. Anh Plane/Spriegel in Instandsetzung — nicht mit ausgerückt.";
    const kurz = bemerkungKurz(frei, 70);
    expect(kurz).toBe("(2 Sollplätze unbesetzt. … Rest: Sammel-PDF)");
    expect(bemerkungKurz("2 Helfer über StAN-Soll (Reserve aktiviert). PKW OV zusätzlich über Staffelkommandant angefordert", 70)).toBe(
      "(2 Helfer über StAN-Soll [Reserve aktiviert]. … Rest: Sammel-PDF)",
    );
    // Ohne Satzgrenze: an der Wortgrenze, und ein Endwort wie „nicht“ bleibt nicht allein zurück.
    const ohne = bemerkungKurz("Anhänger Plane und Spriegel in der Instandsetzung bei der Werkstatt, weil er nicht mit ausgerückt ist", 70);
    expect(ohne).not.toMatch(/ nicht … Rest/);
    expect(ohne.endsWith("… Rest: Sammel-PDF)")).toBe(true);
  });
});

describe("R20-L4 Lagemonitor: Übungsmeldungen, die nicht zählen, bewegen die Lage nicht", () => {
  it("keine „Eingetroffen“-Zeile für Übungseinheiten in einem Einsatz", async () => {
    const { lagebild } = await import("./lagemonitor");
    const s = einsatzAnlegen("Hochwasser Uebung", EinsatzArt.EINSATZ);
    const b = bogenName("Karlsruhe");
    b.uebung = true;
    meldungHinzufuegen(s.id, b);
    const bild = lagebild(einsaetzeLaden().find((x) => x.id === s.id)!);
    expect(bild.einheiten).toHaveLength(0);
    expect(bild.uebungenDaneben).toBe(1);
    expect(bild.bewegungen).toHaveLength(0);
    // Dieselbe Meldung in einer Übungs-Sammlung bewegt die Lage.
    const u = einsatzAnlegen("Übung Weser", EinsatzArt.UEBUNG);
    meldungHinzufuegen(u.id, b);
    expect(lagebild(einsaetzeLaden().find((x) => x.id === u.id)!).bewegungen.map((x) => x.art)).toEqual(["Eingetroffen"]);
  });
});

describe("R20-O1 Tipp-Sperre am Knopf", () => {
  it("der Grund „Schon getippt“ ist kurz genug für jeden Knopf, der ihn trägt", () => {
    const quelle = readFileSync(`${process.cwd()}/src/app/einsaetze-ui.tsx`, "utf8");
    const m = /tippVerworfenZeigen\(ereignis\.nativeEvent, "([^"]+)"\)/.exec(quelle);
    expect(m).not.toBeNull();
    // Der Knopf trägt den Text ab 104 px Breite (tipp-schutz.ts, KNOPF_TEXT_MIN_PX); „Einen Moment …“ (14 Zeichen) passt dort.
    expect(m![1]!.length).toBeLessThanOrEqual(14);
  });
});

