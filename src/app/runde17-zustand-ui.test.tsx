/**
 * Runde 17, Block Zustand: Verhalten in der Oberfläche (jsdom) — Handscanner-Echo (E7), Zurück nach dem Neuladen (S2),
 * Fokus im Feld „Ort" (S4), „Rückgängig" bei „Zahlen stimmen, so gezählt" (S1), Papierkorb für entfernte Meldungen (E2, D6),
 * aufgeklappte Karte nach dem Neuladen (E5, O2, S10, W5), „Anderer Einsatz?" entscheiden (E4), Quittung mit Zeitablauf (S8),
 * StAN-Vorbelegung mit Rückgängig (D1), Ansprechperson (D2, S5), „Namen einfügen…" (E1, N1, H5, S7), Weitergabe-Datei (E3).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import { stanFahrzeugVorbelegung } from "@bos/vokabulare/thw-stan-fahrzeuge";
import { EinsatzArt, bogenInhaltsId, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { Dialogschicht, frageFelder, fokusIndex } from "./dialoge";
import { EINGANG_QUITTUNG_MS, EinsatzDetail, PAPIERKORB_TAGE, kopfAenderungText } from "./einsaetze-ui";
import { neuePerson, neuerBogen, neuesFahrzeug, vokabularFuer } from "./hilfen";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittFahrzeuge, eigeneAngaben } from "./schritte/fahrzeuge";
import { SchrittPersonal } from "./schritte/personal";
import { handscannerLauscher } from "./handscanner";
import { verlaufRestUeberspringen } from "./app";
import { KARTE_OFFEN_SCHLUESSEL, karteOffenMerken, karteWarOffen, STELLE_MAX_ALTER_MS } from "./ansicht-stelle";
import {
  MELDUNGEN_PAPIERKORB_MAX,
  MELDUNGEN_PAPIERKORB_SCHLUESSEL,
  MELDUNGEN_PAPIERKORB_TAGE,
  meldungAusPapierkorb,
  meldungInPapierkorb,
  meldungenImPapierkorb,
} from "./meldungs-papierkorb";
import { gezaehltWegBeobachten, gezaehltWegFuer, gezaehltWegMerken, gezaehltWegVergessen } from "./gezaehlt-weg";
import { ortBilligen, ortIstGebilligt } from "./ort-gebilligt";
import { abweichenderOrt } from "./einheiten-tabelle";
import { standAbsenderVermerken, standDesAbsenders } from "./stand-absender";
import { weitergabeVermerken } from "./export-stand";

vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => true,
  einsatzLageblattErzeugen: async () => true,
  blankoPdfErzeugen: async () => true,
  meldungPdfAnzeigen: async () => {},
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  gezaehltWegVergessen();
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

const karteVon = (name: string) => [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes(name))!;
const leisten = () => [...document.querySelectorAll<HTMLElement>(".quittung-daumen")];

function einsatzMit(namen: string[], art = EinsatzArt.EINSATZ, aendern?: (b: Erfassungsbogen, name: string) => void) {
  const s = einsatzAnlegen("Hochwasser Zustand", art);
  for (const n of namen) meldungHinzufuegen(s.id, bogenMitName(n, (b) => aendern?.(b, n)));
  return s.id;
}

// ------------------------------------------------------------------------------------------------ E7

describe("R17-E7 Handscanner: das Echo bleibt unverändert", () => {
  it("nimmt Leerzeichen mitten im Scan mit, am Anfang nicht", () => {
    vi.useFakeTimers();
    let t = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => (t += 5));
    const gescannt: string[] = [];
    const aus = handscannerLauscher(window, { onScan: (s) => gescannt.push(s), streng: true });
    const taste = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true, bubbles: true }));
    taste(" "); // vor dem ersten Zeichen: gehört der Seite (Knopf bedienen)
    for (const z of "hallo welt") taste(z);
    taste("Enter");
    aus();
    vi.restoreAllMocks();
    expect(gescannt).toEqual(["hallo welt"]);
  });
});

// ------------------------------------------------------------------------------------------------ S2

describe("R17-S2 Zurück nach dem Neuladen im Einsatz verlässt die App nicht", () => {
  const ansicht = (zeigeStart: boolean, extra = {}) => ({ zeigeStart, einsatz: null, scanner: false, muster: false, ...extra });
  it("überspringt den Rest der Zeit vor dem Neuladen nur auf der Startseite", () => {
    const rest = { lauf: "alter-aufruf" };
    // Auf der Startseite (R11-E8): überspringen.
    expect(verlaufRestUeberspringen(rest, ansicht(true), "neuer-aufruf")).toBe(true);
    expect(verlaufRestUeberspringen(rest, null, "neuer-aufruf")).toBe(true);
    // Im Einsatz (liegt auf der Startseite: zeigeStart) oder im Assistenten: der vorige Eintrag ist das Ziel.
    expect(verlaufRestUeberspringen(rest, ansicht(true, { einsatz: "e1" }), "neuer-aufruf")).toBe(false);
    expect(verlaufRestUeberspringen(rest, ansicht(false), "neuer-aufruf")).toBe(false);
    // Scanner und Musterung sind keine Startseite.
    expect(verlaufRestUeberspringen(rest, ansicht(true, { scanner: true }), "neuer-aufruf")).toBe(false);
    expect(verlaufRestUeberspringen(rest, ansicht(true, { muster: true }), "neuer-aufruf")).toBe(false);
    // Ein Eintrag dieses Aufrufs ist kein Rest.
    expect(verlaufRestUeberspringen({ lauf: "neuer-aufruf" }, ansicht(true), "neuer-aufruf")).toBe(false);
  });
});

// ------------------------------------------------------------------------------------------------ S4

describe("R17-S4 „Ort eintragen…“ setzt den Cursor in das Feld „Ort“", () => {
  it("fokusIndex wählt das markierte Feld, sonst das erste", () => {
    expect(fokusIndex([{ name: "a", label: "A" }, { name: "b", label: "B", fokus: true }])).toBe(1);
    expect(fokusIndex([{ name: "a", label: "A" }, { name: "b", label: "B" }])).toBe(0);
  });

  it("der Dialog fokussiert das markierte Feld", async () => {
    render(<Dialogschicht />);
    let antwort: Promise<Record<string, string> | null> | undefined;
    act(() => {
      antwort = frageFelder({
        titel: "Einsatz bearbeiten",
        felder: [
          { name: "name", label: "Name", vorgabe: "Hochwasser Test" },
          { name: "ort", label: "Ort / Auftrag (optional)", optional: true, fokus: true },
        ],
      });
    });
    const ort = await screen.findByLabelText("Ort / Auftrag (optional)");
    await waitFor(() => expect(document.activeElement).toBe(ort));
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    await expect(antwort).resolves.toBeNull();
  });

  it("die Quittung nennt Alt und Neu", () => {
    expect(kopfAenderungText({ name: "Hochwasser Test", ort: "" }, "Hochwasser Test", "Flensburg")).toBe("Ort (leer) → „Flensburg“".replace(/[“”]/g, '"'));
    expect(kopfAenderungText({ name: "A", ort: "X" }, "B", "X")).toBe('Name „A" → „B"');
    expect(kopfAenderungText({ name: "A", ort: "X" }, "B", "Y")).toBe('Name „A" → „B" · Ort „X" → „Y"');
  });

  it("„Ort eintragen…“ im Einsatz landet im Ortsfeld, der Name bleibt", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha"]);
    render(<Wirt id={id} />);
    await nutzer.click(screen.getByRole("button", { name: "Ort eintragen…" }));
    const ort = await screen.findByLabelText("Ort / Auftrag (optional)");
    await waitFor(() => expect(document.activeElement).toBe(ort));
    await nutzer.keyboard("Flensburg");
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    const s = einsaetzeLaden().find((x) => x.id === id)!;
    expect(s.name).toBe("Hochwasser Zustand");
    expect(s.ort).toBe("Flensburg");
    await waitFor(() => expect(leisten()[0]?.textContent).toMatch(/Einsatz geändert: Ort \(leer\) → „Flensburg"/));
  });
});

// ------------------------------------------------------------------------------------------------ S1

describe("R17-S1 „Zahlen stimmen, so gezählt“ hat die Quittung mit „Rückgängig“", () => {
  it("der Merker erreicht eine schon geöffnete Einsatzansicht (sie öffnet, bevor das Ablegen zu Ende ist)", async () => {
    const id = einsatzMit(["Alpha"]);
    render(<Wirt id={id} />);
    expect(leisten().some((l) => /Als gezählt übernommen/.test(l.textContent!))).toBe(false);
    const soll = bogenMitName("Alpha", (b) => {
      b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    });
    act(() => {
      gezaehltWegMerken({ einsatzId: id, eintragId: bogenInhaltsId(bogenMitName("Alpha")), name: "Alpha", soll });
    });
    await waitFor(() => expect(leisten().some((l) => /Als gezählt übernommen: „Alpha"/.test(l.textContent!))).toBe(true));
    expect(screen.getByRole("button", { name: "Rückgängig — wieder als Sollstärke führen" })).toBeDefined();
    // Schließen vergisst den Merker (die Leiste nimmt Tipps erst nach dem Prellschutz an).
    const zu = screen.getByRole("button", { name: "Quittung schließen" });
    await waitFor(() => expect(zu.getAttribute("aria-disabled")).toBeNull(), { timeout: 2500 });
    fireEvent.click(zu);
    await waitFor(() => expect(gezaehltWegFuer(id)).toBeNull());
  });

  it("der Merker meldet sich bei Beobachtern und nach dem Vergessen", () => {
    const stand: (string | null)[] = [];
    const aus = gezaehltWegBeobachten(() => stand.push(gezaehltWegFuer("e1")?.name ?? null));
    gezaehltWegMerken({ einsatzId: "e1", eintragId: "x", name: "Alpha", soll: bogenMitName("Alpha") });
    gezaehltWegVergessen();
    aus();
    gezaehltWegMerken({ einsatzId: "e1", eintragId: "x", name: "Beta", soll: bogenMitName("Beta") });
    expect(stand).toEqual(["Alpha", null]);
  });

  it("Sollstärke-Einheiten stehen im Listenkopf getrennt von den gemeldeten", () => {
    const id = einsatzMit(["Alpha", "Beta"], EinsatzArt.EINSATZ, (b, n) => {
      if (n === "Beta") {
        b.personalErfassung = PersonalErfassung.NUR_STAERKE;
        b.staerkeManuell = { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 };
      }
    });
    render(<Wirt id={id} />);
    // Beta trägt unbenannte Sollplätze nur, wenn die Vorbelegung welche brachte; sonst zählt sie nicht als Sollstärke.
    const kopf = document.querySelector("#einheiten-liste")!.textContent!;
    expect(kopf).toMatch(/^Einheiten \(\d+ gemeldet( · \d+ nur Sollstärke)? · \d+ anwesend\)$/);
  });
});

// ------------------------------------------------------------------------------------------------ E2 / D6

describe("R17-E2/D6 Entfernte Meldungen liegen im Papierkorb der Sammlung", () => {
  it("legt, holt und räumt auf: Frist, Höchstzahl, unbekannte Sammlungen", () => {
    const id = einsatzMit(["Alpha"]);
    const e = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!;
    const t0 = Date.parse("2026-10-27T18:00:00Z");
    expect(meldungInPapierkorb(id, { art: "einheit", eintraege: [e], nummer: 2, bezug: "9 Personen" }, t0)).toBe(true);
    const liste = meldungenImPapierkorb(id, t0 + 1000);
    expect(liste).toHaveLength(1);
    expect(liste[0]).toMatchObject({ name: "THW Alpha", nummer: 2, bezug: "9 Personen", art: "einheit", entferntAm: t0 });
    // Nach der Frist ist sie weg; vorher noch da.
    expect(meldungenImPapierkorb(id, t0 + (MELDUNGEN_PAPIERKORB_TAGE - 1) * 86_400_000)).toHaveLength(1);
    expect(meldungenImPapierkorb(id, t0 + (MELDUNGEN_PAPIERKORB_TAGE + 1) * 86_400_000)).toHaveLength(0);
    // Herausnehmen über die Kennung eines Eintrags.
    meldungAusPapierkorb(id, [e.id], t0 + 2000);
    expect(meldungenImPapierkorb(id, t0 + 3000)).toHaveLength(0);
    expect(localStorage.getItem(MELDUNGEN_PAPIERKORB_SCHLUESSEL)).toBeNull();
    // Höchstens MAX je Sammlung.
    for (let i = 0; i < MELDUNGEN_PAPIERKORB_MAX + 3; i++) meldungInPapierkorb(id, { art: "einheit", eintraege: [e] }, t0 + i);
    expect(meldungenImPapierkorb(id, t0 + 100)).toHaveLength(MELDUNGEN_PAPIERKORB_MAX);
    // Eine Sammlung, die es nicht mehr gibt, fällt beim nächsten Schreiben heraus.
    meldungInPapierkorb("gibt-es-nicht", { art: "einheit", eintraege: [e] }, t0);
    expect(meldungenImPapierkorb("gibt-es-nicht", t0)).toHaveLength(0);
  });

  it("nach „Meldung entfernen“ und geschlossener Leiste (Neuladen) holt „Zurückholen“ die Meldung samt Historie", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta"]);
    const { unmount } = render(<Wirt id={id} />);
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    expect(dialog.textContent).toMatch(/liegt die Meldung 7 Tage unter „Zuletzt entfernte Meldungen“/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege).toHaveLength(1));
    // Die Ablage läuft über ein nachgeladenes Modul.
    await waitFor(() => expect(meldungenImPapierkorb(id)).toHaveLength(1));

    // „Neuladen“: die Leiste im Arbeitsspeicher ist weg (✕), der Papierkorb im Speicher bleibt.
    await nutzer.click(await screen.findByRole("button", { name: "Quittung schließen" }));
    unmount();
    cleanup();
    render(<Wirt id={id} />);
    expect(leisten()).toHaveLength(0);
    // Der Block lädt nach (React.lazy): erst die Vorprüfung, dann der Inhalt.
    await waitFor(() => expect(document.querySelector("details.meldungen-papierkorb")).not.toBeNull());
    const block = document.querySelector<HTMLDetailsElement>("details.meldungen-papierkorb")!;
    expect(block.querySelector("summary")!.textContent).toMatch(/Zuletzt entfernte Meldungen \(1\) — 7 Tage zurückholbar/);
    expect(block.textContent).toContain("Alpha");
    await nutzer.click(within(block).getByRole("button", { name: "Zurückholen" }));
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege).toHaveLength(2));
    await waitFor(() => expect(meldungenImPapierkorb(id)).toHaveLength(0));
    await waitFor(() => expect(document.querySelector("details.meldungen-papierkorb")).toBeNull());
    expect(document.body.textContent).toMatch(/Meldung „.*Alpha.*" zurückgeholt/);
  });

  it("„Endgültig löschen…“ fragt nach und räumt den Papierkorb", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta"]);
    const e = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!;
    meldungInPapierkorb(id, { art: "einheit", eintraege: [e] });
    render(<Wirt id={id} />);
    await waitFor(() => expect(document.querySelector("details.meldungen-papierkorb")).not.toBeNull());
    const block = document.querySelector<HTMLDetailsElement>("details.meldungen-papierkorb")!;
    await nutzer.click(within(block).getByRole("button", { name: "Endgültig löschen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung endgültig löschen?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Endgültig löschen" }));
    await waitFor(() => expect(meldungenImPapierkorb(id)).toHaveLength(0));
  });

  it("der Rückgängig-Weg der Leiste nimmt die Meldung auch aus dem Papierkorb", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta"]);
    render(<Wirt id={id} />);
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    const rueck = await screen.findByRole("button", { name: "Rückgängig" });
    await waitFor(() => expect(rueck.getAttribute("aria-disabled")).toBeNull(), { timeout: 2500 });
    await nutzer.click(rueck);
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege).toHaveLength(2));
    await waitFor(() => expect(meldungenImPapierkorb(id)).toHaveLength(0));
  });

  it("die Tage im Rückfragetext und im Modul stimmen überein", () => {
    expect(PAPIERKORB_TAGE).toBe(MELDUNGEN_PAPIERKORB_TAGE);
  });
});

// ------------------------------------------------------------------------------------------------ E5 / O2 / S10 / W5

describe("R17-E5/O2/S10/W5 Die aufgeklappte Karte bleibt nach dem Neuladen offen", () => {
  it("merkt sich die zuletzt aufgeklappte Karte je Sammlung, mit Frist", () => {
    const t0 = 1_000_000;
    karteOffenMerken("e1", "thw|alpha", true, t0);
    expect(karteWarOffen("e1", "thw|alpha", t0 + 1000)).toBe(true);
    expect(karteWarOffen("e1", "thw|beta", t0 + 1000)).toBe(false);
    expect(karteWarOffen("e2", "thw|alpha", t0 + 1000)).toBe(false);
    expect(karteWarOffen("e1", "thw|alpha", t0 + STELLE_MAX_ALTER_MS + 1)).toBe(false);
    // Zuklappen einer anderen Karte lässt die gemerkte stehen; die gemerkte selbst zuklappen vergisst sie.
    karteOffenMerken("e1", "thw|beta", false, t0);
    expect(karteWarOffen("e1", "thw|alpha", t0 + 1000)).toBe(true);
    karteOffenMerken("e1", "thw|alpha", false, t0);
    expect(sessionStorage.getItem(KARTE_OFFEN_SCHLUESSEL)).toBeNull();
  });

  it("Telefon: Aufklappen merkt, ein neues Rendern (Neuladen) öffnet dieselbe Karte wieder", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q === "(max-width: 600px)", media: q, addEventListener: () => {}, removeEventListener: () => {} }));
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta", "Gamma"]);
    const { unmount } = render(<Wirt id={id} />);
    await nutzer.click(within(karteVon("Beta")).getByRole("button", { name: /Aufklappen/ }));
    expect(within(karteVon("Beta")).getByRole("button", { name: "Zuklappen" })).toBeDefined();
    unmount();
    cleanup();
    render(<Wirt id={id} />);
    // Beta ist wieder offen, die übrigen sind zu.
    expect(within(karteVon("Beta")).getByRole("button", { name: "Zuklappen" })).toBeDefined();
    expect(within(karteVon("Alpha")).queryByRole("button", { name: "Zuklappen" })).toBeNull();
    // Zuklappen vergisst sie.
    await nutzer.click(within(karteVon("Beta")).getByRole("button", { name: "Zuklappen" }));
    expect(karteWarOffen(id, einsaetzeLaden().find((s) => s.id === id)!.eintraege.find((e) => e.bogen.einheit.hierarchie[0]!.name === "Beta")!.einheitSchluessel)).toBe(false);
  });
});

// ------------------------------------------------------------------------------------------------ E4

describe("R17-E4 „Anderer Einsatz?“ lässt sich je Einheit entscheiden", () => {
  /** Vier Einheiten: drei in Ulm, eine mit fremdem Auftrag. */
  function lage() {
    const s = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    einsatzKopfOrt(s.id, "Ulm Donau");
    for (const n of ["Alpha", "Beta"]) meldungHinzufuegen(s.id, bogenMitName(n, (b) => { b.einsatz.ortAuftrag = "Hochwasser Ulm Donau"; }));
    meldungHinzufuegen(s.id, bogenMitName("Gamma", (b) => { b.einsatz.ortAuftrag = "Waldbrand Cottbus"; }));
    return s.id;
  }
  function einsatzKopfOrt(id: string, ort: string) {
    const liste = einsaetzeLaden();
    liste.find((s) => s.id === id)!.ort = ort;
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify(liste));
  }

  it("abweichenderOrt kennt die Bestätigung, auch bei einer Folgemeldung mit gleichem Text", () => {
    const id = lage();
    const s = einsaetzeLaden().find((x) => x.id === id)!;
    const gamma = s.eintraege.find((e) => e.bogen.einheit.hierarchie[0]!.name === "Gamma")!;
    expect(abweichenderOrt(gamma, s, s.eintraege)).toBe("Waldbrand Cottbus");
    expect(ortBilligen(id, gamma.id)).toBe(true);
    const danach = einsaetzeLaden().find((x) => x.id === id)!;
    const g2 = danach.eintraege.find((e) => e.id === gamma.id)!;
    expect(g2.ortGebilligt).toBe("Waldbrand Cottbus");
    expect(abweichenderOrt(g2, danach, danach.eintraege)).toBeNull();
    expect(ortIstGebilligt(g2, danach.eintraege)).toBe(true);
    // Ein anderer Text zur selben Einheit (spätere Fassung) weckt die Marke wieder.
    const spaeter: MeldeEintrag = { ...g2, id: "spaeter", empfangenAm: g2.empfangenAm + 1, ortGebilligt: undefined, bogen: { ...g2.bogen, einsatz: { ...g2.bogen.einsatz, ortAuftrag: "Sturm Dresden" } } };
    expect(abweichenderOrt(spaeter, danach, [...danach.eintraege, spaeter])).toBe("Sturm Dresden");
    // Zurücknehmen.
    ortBilligen(id, gamma.id, false);
    const zurueck = einsaetzeLaden().find((x) => x.id === id)!;
    expect(abweichenderOrt(zurueck.eintraege.find((e) => e.id === gamma.id)!, zurueck, zurueck.eintraege)).toBe("Waldbrand Cottbus");
  });

  it("die Karte bietet „Gehört zu dieser Lage“; danach fällt die Marke weg und ein Vermerk bleibt", async () => {
    const nutzer = userEvent.setup();
    const id = lage();
    render(<Wirt id={id} />);
    const karte = karteVon("Gamma");
    expect(karte.textContent).toContain("Bogen nennt: „Waldbrand Cottbus“");
    await nutzer.click(within(karte).getByRole("button", { name: "Gehört zu dieser Lage" }));
    await waitFor(() => expect(karteVon("Gamma").textContent).not.toContain("Bogen nennt: „Waldbrand Cottbus“"));
    expect(karteVon("Gamma").textContent).toMatch(/vom Meldekopf als zur Lage gehörig bestätigt/);
    await nutzer.click(within(karteVon("Gamma")).getByRole("button", { name: "Wieder prüfen" }));
    await waitFor(() => expect(karteVon("Gamma").textContent).toContain("Bogen nennt: „Waldbrand Cottbus“"));
  });
});

// ------------------------------------------------------------------------------------------------ S8

describe("R17-S8 „Zuletzt abgelegt … jetzt n Einheiten“ steht nicht über Stunden", () => {
  it("verschwindet nach EINGANG_QUITTUNG_MS", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    const id = einsatzMit(["Alpha"]);
    const e = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!;
    render(<Wirt id={id} extra={{ eingang: { schluessel: e.einheitSchluessel, nonce: 1 } }} />);
    expect(document.querySelector(".eingang-quittung")?.textContent).toMatch(/Zuletzt (abgelegt|eingelesen): (Nr\. \d+ )?„.*Alpha".*jetzt 1 Einheit/);
    await act(async () => {
      vi.advanceTimersByTime(EINGANG_QUITTUNG_MS - 60_000);
    });
    expect(document.querySelector(".eingang-quittung")).not.toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(3 * 60_000);
    });
    expect(document.querySelector(".eingang-quittung")).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ D5

describe("R17-D5 Der Stand des Absenders bleibt sichtbar", () => {
  it("die Fassung der Kennzeichnung trägt den Stand der Vorgängerin", () => {
    const id = einsatzMit(["Alpha"]);
    const alt = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!;
    const neu = meldungHinzufuegen(id, { ...alt.bogen, uebung: true, stand: alt.bogen.stand + 15 })!.eintrag;
    expect(standDesAbsenders(neu)).toBe(alt.bogen.stand + 15);
    expect(standAbsenderVermerken(id, neu.id, alt)).toBe(true);
    const gespeichert = einsaetzeLaden().find((s) => s.id === id)!.eintraege.find((e) => e.id === neu.id)!;
    expect(gespeichert.standAbsender).toBe(alt.bogen.stand);
    expect(standDesAbsenders(gespeichert)).toBe(alt.bogen.stand);
    // Eine weitere Umstellung erbt den Stand der Absenderin, nicht den der Zwischenfassung.
    expect(standDesAbsenders({ bogen: { ...alt.bogen, stand: 99_999_999 }, standAbsender: gespeichert.standAbsender })).toBe(alt.bogen.stand);
  });

  it("die Karte zeigt nach „Als Übung kennzeichnen…“ weiter den Stand des Absenders", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha"], EinsatzArt.EINSATZ, (b) => {
      b.stand = b.stand - 120;
    });
    const vorher = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!.bogen.stand;
    render(<Wirt id={id} />);
    const stand = () => karteVon("Alpha").textContent!.match(/Stand der Angaben (\d\d\.\d\d\.\d{4}, \d\d:\d\d)/)?.[1];
    const davor = stand();
    expect(davor).toBeDefined();
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Als Übung kennzeichnen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Als Übung kennzeichnen?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Als Übung kennzeichnen" }));
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege).toHaveLength(2));
    const neu = einsaetzeLaden().find((s) => s.id === id)!.eintraege.find((e) => e.bogen.uebung)!;
    expect(neu.bogen.stand).toBeGreaterThan(vorher); // gestempelt, damit die Fassung gilt …
    expect(neu.standAbsender).toBe(vorher); // … angezeigt wird der Stand des Absenders
    await waitFor(() => expect(stand()).toBe(davor));
  });
});

// ------------------------------------------------------------------------------------------------ D1

describe("R17-D1 „StAN-Vorbelegung laden“ nennt die Folgen und hat ein Rückgängig", () => {
  function stanStart() {
    const typ = vokabularFuer(OrganisationsTyp.THW, "einheitstyp").find((e) => stanFahrzeugVorbelegung(OrganisationsTyp.THW, { code: e.code }).length > 0)!;
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: typ.code };
    start.fahrzeuge = [
      { ...neuesFahrzeug(), kennzeichen: "THW-80125" },
      { ...neuesFahrzeug(), kennzeichen: "THW-80126", aenderungen: "Tauchpumpe" },
    ];
    return start;
  }

  it("eigeneAngaben zählt Kennzeichen, Sondergerät und mehr", () => {
    expect(eigeneAngaben([])).toBe("");
    expect(eigeneAngaben([neuesFahrzeug()])).toBe("");
    expect(eigeneAngaben(stanStart().fahrzeuge)).toBe("Kennzeichen THW-80125, THW-80126; 1 Sondergerät/Änderung");
  });

  it("die Rückfrage nennt die Kennzeichen; „Rückgängig“ stellt die Liste mit Kennzeichen wieder her", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={stanStart()} />);
    await nutzer.click(screen.getByRole("button", { name: /^StAN-Vorbelegung laden/ }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='StAN-Vorbelegung laden?']")!;
    expect(dialog.textContent).toMatch(/Verloren gehen dabei deine Eingaben: Kennzeichen THW-80125, THW-80126; 1 Sondergerät\/Änderung\./);
    expect(dialog.textContent).toMatch(/„Rückgängig“ in der Leiste unten stellt die bisherige Liste wieder her/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Ersetzen" }));
    expect((screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[]).some((f) => f.value === "THW-80125")).toBe(false);
    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/^StAN-Vorbelegung geladen: 2 bisherige Fahrzeuge ersetzt/);
    const rueck = within(leiste).getByRole("button", { name: "Rückgängig" });
    await waitFor(() => expect(rueck.getAttribute("aria-disabled")).toBeNull(), { timeout: 2500 });
    await nutzer.click(rueck);
    await waitFor(() => expect((screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[]).map((f) => f.value)).toEqual(["THW-80125", "THW-80126"]));
    expect(document.body.textContent).toMatch(/Zurückgeholt: die 2 bisherigen Fahrzeuge samt Kennzeichen/);
  });

  it("eine Liste ohne eigene Eingaben wird ohne Rückweg ersetzt", async () => {
    const nutzer = userEvent.setup();
    const start = stanStart();
    start.fahrzeuge = [neuesFahrzeug()];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);
    await nutzer.click(screen.getByRole("button", { name: /^StAN-Vorbelegung laden/ }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='StAN-Vorbelegung laden?']")!;
    expect(dialog.textContent).not.toMatch(/Verloren gehen/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Ersetzen" }));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ D2 / S5

describe("R17-D2/S5 „⇑“ sagt, wer jetzt Ansprechperson ist", () => {
  function startMitPersonen() {
    const b = neuerBogen();
    b.personal = ["Lehmann", "Krause", "Schulz", "Brandt"].map((n) => ({ ...neuePerson(), nachname: n, vorname: "X" }));
    return b;
  }

  it("meldet die neue Ansprechperson mit Rückgängig; ▲ weiter unten in der Liste schweigt", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={startMitPersonen()} />);
    const namen = () => (screen.getAllByLabelText("Nachname") as HTMLInputElement[]).map((f) => f.value);
    expect(namen()).toEqual(["Lehmann", "Krause", "Schulz", "Brandt"]);
    // Platz 3 nach oben auf Platz 2: Ansprechperson bleibt.
    await nutzer.click(screen.getByRole("button", { name: "Person 3 nach oben" }));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: /^Person 4 an die erste Stelle/ }));
    expect(namen()[0]).toBe("Brandt");
    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/^Neue Ansprechperson: .*Brandt/);
    const rueck = within(leiste).getByRole("button", { name: "Wechsel der Ansprechperson rückgängig machen" });
    await waitFor(() => expect(rueck.getAttribute("aria-disabled")).toBeNull(), { timeout: 2500 });
    await nutzer.click(rueck);
    await waitFor(() => expect(namen()).toEqual(["Lehmann", "Schulz", "Krause", "Brandt"]));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ E1 / N1 / H5 / S7

describe("R17-E1/N1/H5/S7 „Namen einfügen…“ in der Oberfläche", () => {
  async function dialogOeffnen(nutzer: ReturnType<typeof userEvent.setup>) {
    render(<SchrittBuehne komponente={SchrittPersonal} />);
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    return document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
  }

  it("Zeilen ohne Komma tragen die Prüfmarke, bis die Reihenfolge gewählt ist; die Wahl dreht die Lesart", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Schmidt Anna Maria\nMeier Karl\nMüller, Hans");
    expect(within(dialog).getAllByText("Reihenfolge prüfen")).toHaveLength(2);
    expect(within(dialog).getByText(/2 Zeilen ohne Komma lese ich als \(bitte bestätigen\)/)).toBeDefined();
    // R18-S7: keine Vorauswahl, „Übernehmen" gesperrt und mit Grund; die Vorschau zeigt „Vorname Nachname" wie eingegeben.
    expect((within(dialog).getByRole("radio", { name: "Vorname Nachname" }) as HTMLInputElement).checked).toBe(false);
    expect((within(dialog).getByRole("radio", { name: "Nachname Vorname" }) as HTMLInputElement).checked).toBe(false);
    expect(within(dialog).getByRole("button", { name: "3 Personen übernehmen" }).hasAttribute("disabled")).toBe(true);
    expect(dialog.textContent).toContain("„Übernehmen“ geht erst, wenn oben gewählt ist");
    expect(dialog.textContent).toContain("Schmidt Anna Maria");
    await nutzer.click(within(dialog).getByRole("radio", { name: "Nachname Vorname" }));
    expect(within(dialog).queryAllByText("Reihenfolge prüfen")).toHaveLength(0);
    expect(dialog.textContent).toContain("Anna Maria Schmidt");
    expect(dialog.textContent).toContain("Karl Meier");
    expect(dialog.textContent).toContain("Hans Müller");
    expect(dialog.textContent).not.toContain("„Übernehmen“ geht erst");
    await nutzer.click(within(dialog).getByRole("button", { name: "3 Personen übernehmen" }));
    const nachnamen = (screen.getAllByLabelText("Nachname") as HTMLInputElement[]).map((f) => f.value);
    expect(nachnamen).toEqual(expect.arrayContaining(["Schmidt", "Meier", "Müller"]));
  });

  it("auch die Bestätigung der Vorgabe nimmt die Marke weg", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Karl Meier");
    expect(within(dialog).getAllByText("Reihenfolge prüfen")).toHaveLength(1);
    await nutzer.click(within(dialog).getByRole("radio", { name: "Vorname Nachname" }));
    expect(within(dialog).queryAllByText("Reihenfolge prüfen")).toHaveLength(0);
  });

  it("Rufnummer am Zeilenende: „Kevin Meier“ wird übernommen, die Nummer wird sein Kontakt", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Kevin Meier 0171 1234567");
    expect(dialog.textContent).toContain("Kevin Meier");
    expect(dialog.textContent).toContain("Tel. 0171 1234567");
    expect(within(dialog).queryByText("kein Name?")).toBeNull();
    await nutzer.click(within(dialog).getByRole("radio", { name: "Vorname Nachname" })); // R18-S7
    await nutzer.click(within(dialog).getByRole("button", { name: "1 Person übernehmen" }));
    expect((screen.getAllByLabelText("Nachname") as HTMLInputElement[]).map((f) => f.value)).toContain("Meier");
  });

  it("„Lisa Meier, Fahrer“ → Vorname Lisa, Nachname Meier, Funktion Fahrer", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Lisa Meier, Fahrer");
    expect(dialog.textContent).toContain("Lisa Meier · Fahrer");
  });

  it("R18-H6: „Jürgen Weber +49 171 9876543 ZTrFü“ → Name, Funktion und Nummer getrennt, die Funktion nicht als Nachname", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Jürgen Weber +49 171 9876543 ZTrFü");
    expect(dialog.textContent).toContain("Jürgen Weber · ZTrFü · Tel. +49 171 9876543");
    expect(within(dialog).queryByText("kein Name?")).toBeNull();
    await nutzer.click(within(dialog).getByRole("radio", { name: "Vorname Nachname" }));
    await nutzer.click(within(dialog).getByRole("button", { name: "1 Person übernehmen" }));
    expect((screen.getAllByLabelText("Nachname") as HTMLInputElement[]).map((f) => f.value)).toContain("Weber");
  });
});

// ------------------------------------------------------------------------------------------------ E3

describe("R17-E3 Weitergabe-Datei und Sammel-PDF an den Stab sind unterscheidbar", () => {
  it("nach der Weitergabe sagt die Statuszeile, dass für den Stab noch keine Lieferung vorliegt", () => {
    const id = einsatzMit(["Alpha", "Beta"]);
    weitergabeVermerken(einsaetzeLaden().find((s) => s.id === id)!);
    meldungHinzufuegen(id, bogenMitName("Gamma"));
    render(<Wirt id={id} extra={{ onWeitergeben: () => {}, exportUmfang: "neue", onExportUmfang: () => {}, onStandAusWeitergabe: () => {} }} />);
    const zeile = [...document.querySelectorAll<HTMLElement>(".export-stand-zeile")].find((z) => z.textContent!.startsWith("Sammel-PDF an den Stab"))!;
    expect(zeile.textContent).toMatch(/für den Stab noch keine Lieferung — alle Bögen sind neu/);
    // R18-W8/K10: gekürzt; die Erklärung steht hinter „Was heißt das?“.
    expect(zeile.textContent).toMatch(/Weitergabe-Datei vom .* geht an die Ablösung und zählt hier nicht/);
    expect(within(zeile).getByRole("button", { name: "Ab dieser Weitergabe rechnen" })).toBeDefined();
  });
});
