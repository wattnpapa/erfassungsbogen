/**
 * Runde 18, Block Inhalte: Oberfläche (jsdom) — Übergabe und Abschluss (A6, A7), Tabelle am Telefon (A5, N9), Stand der Angaben auf
 * der Karte (A2, K1), Erklärung der Nachtrag-Logik (W8, K10), Übersicht (N11, N12), Autokorrektur (H5), Texte der Sammlung (N13),
 * Rückfrage beim Entfernen (A1). Maße und Fokus sind im Produktionsbuild mit Playwright gemessen (siehe Abschlussbericht);
 * jsdom rechnet kein Layout.
 */
import { readFileSync } from "node:fs";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, PersonalErfassung, jetztZeitpunkt, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuePerson, neuerBogen } from "./hilfen";
import { Dialogschicht, prellschutzSetzen } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import AbschlussBlock from "./abschluss-block";
import { abschlussLaden, abschlussSetzen } from "./einsatz-abschluss";
import { weitergabeVermerken } from "./export-stand";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittEinsatz } from "./schritte/einsatz";
import { SchrittSofortbedarf } from "./schritte/sofortbedarf";
import { Uebersicht } from "./schritte/uebersicht";
import { EintreffzeitFeld } from "./nacherfassung";

vi.mock("./pdf", async () => {
  const echt = await vi.importActual<typeof import("./pdf")>("./pdf");
  return { ...echt, pdfErzeugen: async () => {}, einsatzPdfErzeugen: async () => true, einsatzLageblattErzeugen: async () => true };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  prellschutzSetzen(450);
  localStorage.clear();
  sessionStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

function bogen(name: string, mannschaft = 3): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  b.einheit.organisation = OrganisationsTyp.THW;
  b.personalErfassung = PersonalErfassung.NUR_STAERKE;
  b.staerkeManuell = { fuehrer: 1, unterfuehrer: 1, mannschaft, gesamt: 2 + mannschaft };
  b.einsatz.ortAuftrag = "Hochwasser Weser";
  return b;
}

type Props = Parameters<typeof EinsatzDetail>[0];

function Wirt({ id, extra = {} }: { id: string; extra?: Partial<Props> }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  return (
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={() => setEinsatz({ ...einsaetzeLaden().find((s) => s.id === id)! })}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={() => {}}
        onBilderImport={() => {}}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onWeitergeben={() => {}}
        onGeloescht={() => {}}
        {...extra}
      />
      <Dialogschicht />
    </>
  );
}

function telefonSimulieren() {
  window.matchMedia = ((q: string) => ({
    matches: true,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

const karteVon = (name: string) => screen.getAllByRole("listitem").find((li) => li.textContent!.includes(name) && li.querySelector("button"))!;

describe("R18-A6/A7 Block „Übergabe und Abschluss“", () => {
  it("zeigt je Weg, ob er gegangen wurde, vermerkt die Übergabe mit Empfänger", async () => {
    prellschutzSetzen(0);
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    const einsatz = einsaetzeLaden().find((x) => x.id === s.id)!;
    weitergabeVermerken(einsatz);
    const onGeaendert = vi.fn();
    render(
      <>
        <AbschlussBlock einsatz={einsatz} onGeaendert={onGeaendert} />
        <Dialogschicht />
      </>,
    );
    const block = document.querySelector("section.einsatz-abschluss")!;
    expect(block.textContent).toMatch(/✓ Weitergabe-Datei \(Sammel-PDF\): erzeugt/);
    expect(block.textContent).toContain("○ Lageblatt: noch nicht");
    expect(block.textContent).toContain("○ Datensicherung: noch nicht");
    expect(block.textContent).toContain("Übergabe noch nicht vermerkt");

    await nutzer.click(screen.getByRole("button", { name: "Übergabe vermerken…" }));
    const dialog = await screen.findByRole("dialog", { name: "Übergabe vermerken" });
    await nutzer.type(within(dialog).getByLabelText(/^An/), "Stab Oldenburg");
    await nutzer.click(within(dialog).getByRole("button", { name: "Vermerken" }));
    await waitFor(() => expect(abschlussLaden(s.id).uebergabeAn).toBe("Stab Oldenburg"));
    expect(abschlussLaden(s.id).uebergabeAm).toBeTypeOf("number");
    expect(onGeaendert).toHaveBeenCalled();
  });

  it("„Einsatz als beendet markieren“ nennt, was noch offen ist; „Wieder öffnen“ nimmt es zurück", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    render(<Wirt id={s.id} />);
    expect(document.querySelector(".einsatz-beendet-kopf")).toBeNull();
    await nutzer.click(await screen.findByRole("button", { name: "Einsatz als beendet markieren" }));
    const hinweis = document.querySelector(".einsatz-beendet")!;
    expect(hinweis.textContent).toMatch(/^Einsatz beendet .+ — noch offen: Weitergabe-Datei \(Sammel-PDF\), Lageblatt, Übersicht als CSV, Excel-Liste, Datensicherung\./);
    expect(document.querySelector(".einsatz-beendet-kopf")!.textContent).toMatch(/^Einsatz beendet /);
    expect(abschlussLaden(s.id).beendetAm).toBeTypeOf("number");
    await nutzer.click(screen.getByRole("button", { name: "Wieder öffnen" }));
    expect(abschlussLaden(s.id).beendetAm).toBeUndefined();
    expect(document.querySelector(".einsatz-beendet-kopf")).toBeNull();
  });

  it("der Kopf sagt nach dem Vermerk statt „Empfang nicht bestätigt“, wann und an wen übergeben wurde", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    const einsatz = einsaetzeLaden().find((x) => x.id === s.id)!;
    weitergabeVermerken(einsatz, undefined, Date.now() - 60_000);
    abschlussSetzen(s.id, { uebergabeAm: Date.now(), uebergabeAn: "Ablösung" }, [s.id]);
    render(<Wirt id={s.id} />);
    const vermerk = document.querySelector(".weitergabe-vermerk")!;
    expect(vermerk.textContent).toMatch(/Weitergabe-Datei erzeugt .+ — Übergabe vermerkt .+ an Ablösung/);
    expect(vermerk.textContent).not.toContain("Empfang nicht bestätigt");
  });
});

describe("R18-A5/N9 Tabelle am Telefon", () => {
  it("Kernspalten zeigen die Eintreffzeit; das Alter steht als Marke darunter statt in eigener Spalte", () => {
    telefonSimulieren();
    localStorage.setItem("eeb.einheiten-ansicht", "tabelle");
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const alt = bogen("Alt");
    alt.stand = jetztZeitpunkt() - 300;
    meldungHinzufuegen(s.id, alt);
    meldungHinzufuegen(s.id, bogen("Frisch"));
    render(<Wirt id={s.id} />);
    const tabelle = document.querySelector("table.einheiten-tabelle")!;
    const koepfe = [...tabelle.querySelectorAll("thead th")].map((th) => th.textContent!);
    expect(koepfe.some((k) => /^Eingetr\./.test(k))).toBe(true);
    expect(koepfe.some((k) => /^Alter/.test(k))).toBe(false);
    const zeilen = [...tabelle.querySelectorAll("tbody tr")];
    const zelleAlt = zeilen.find((z) => z.textContent!.includes("Alt"))!.querySelector("td.eingetroffen-kern")!;
    expect(zelleAlt.textContent).toMatch(/^\d{2}:\d{2}⚠ Stand vor 5 Std/);
    expect(zelleAlt.querySelector(".alter-marke")).not.toBeNull();
    const zelleFrisch = zeilen.find((z) => z.textContent!.includes("Frisch"))!.querySelector("td.eingetroffen-kern")!;
    expect(zelleFrisch.querySelector(".alter-marke")).toBeNull();
  });

  it("alle Spalten: der Kopf heißt „Alter“, die Werte „vor 5 Min“ bzw. „Stand vor …“", () => {
    localStorage.setItem("eeb.einheiten-ansicht", "tabelle");
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const alt = bogen("Alt");
    alt.stand = jetztZeitpunkt() - 300;
    meldungHinzufuegen(s.id, alt);
    render(<Wirt id={s.id} />);
    const koepfe = [...document.querySelectorAll("table.einheiten-tabelle thead th")].map((th) => th.textContent!);
    expect(koepfe.some((k) => /^Alter/.test(k))).toBe(true);
    expect(koepfe.some((k) => /Meldung vor/.test(k))).toBe(false);
    expect(koepfe.some((k) => /^Stand der Angaben/.test(k))).toBe(true);
    expect(document.querySelector("td.warnung-text")!.textContent).toMatch(/^⚠ Stand vor 5 Std/);
  });
});

describe("R18-W8/K10 Nachtrag: Erklärung hinter „Was heißt das?“", () => {
  it("vor den Knöpfen stehen nur kurze Zeilen; die lange Erklärung ist eingeklappt", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    weitergabeVermerken(einsaetzeLaden().find((x) => x.id === s.id)!);
    render(<Wirt id={s.id} />);
    const umfang = document.querySelector(".export-umfang")!;
    const details = umfang.querySelector("details.export-erklaerung") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.querySelector("summary")!.textContent).toBe("Was heißt das?");
    expect(details.textContent).toContain("Die Weitergabe-Datei geht an die Ablösung oder ins Archiv");
    const sichtbar = umfang.cloneNode(true) as HTMLElement;
    sichtbar.querySelector("details")!.remove();
    expect(sichtbar.textContent!.length).toBeLessThan(260);
    expect(document.body.textContent).not.toContain("Ein Nachtrag für den Stab (PDF, CSV, Excel)");
  });

  it("Nachtrag-Modus: Das Sammel-PDF nennt kurz, dass die Weitergabe-Datei dort nicht zählt", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    weitergabeVermerken(einsaetzeLaden().find((x) => x.id === s.id)!);
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByLabelText("Nur neue Bögen seit dem letzten Export"));
    const zeile = document.querySelector(".export-stand-zeile")!;
    expect(zeile.textContent).toMatch(/für den Stab noch keine Lieferung — alle Bögen sind neu\. Die Weitergabe-Datei vom .+ geht an die Ablösung und zählt hier nicht\./);
  });
});

describe("R18-A2/K1 Stand der Angaben auf der Karte", () => {
  it("nennt nach „Stärke ändern…“ den Stand des Absenders und die Handänderung getrennt", async () => {
    prellschutzSetzen(0);
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const b = bogen("Albstadt", 9);
    b.stand = jetztZeitpunkt() - 150;
    meldungHinzufuegen(s.id, b);
    render(<Wirt id={s.id} />);
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Details" }));
    const standVorher = karteVon("Albstadt").textContent!.match(/Stand der Angaben (\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2})/)?.[1];
    expect(standVorher).toBeDefined();
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: /Stärke ändern/ }));
    const dialog = await screen.findByRole("dialog", { name: "Stärke ändern" });
    const felder = within(dialog).getAllByRole("textbox");
    await nutzer.clear(felder[2]!);
    await nutzer.type(felder[2]!, "4");
    await nutzer.click(within(dialog).getByRole("button", { name: "Stärke übernehmen" }));
    await waitFor(() => expect(karteVon("Albstadt").textContent).toContain("Stärke am Meldekopf geändert"));
    const text = karteVon("Albstadt").textContent!;
    // Der Stand der Angaben bleibt der des Absenders, die Handänderung steht daneben mit eigener Zeit.
    expect(text.match(/Stand der Angaben (\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2})/)?.[1]).toBe(standVorher);
    expect(text).toMatch(/Stärke am Meldekopf geändert \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
    expect(text).toMatch(/⚠ Stand vor 2 Std/);
  });
});

describe("R18-A1 Rückfrage beim Entfernen", () => {
  it("sagt, dass die übrigen Nummern bleiben, und behält sie nach dem Entfernen", async () => {
    prellschutzSetzen(0);
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    for (const n of ["Albstadt", "Biberach", "Crailsheim"]) meldungHinzufuegen(s.id, bogen(n));
    render(<Wirt id={s.id} />);
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Details" }));
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Entfernen" }));
    const dialog = await screen.findByRole("dialog", { name: "Meldung entfernen?" });
    expect(dialog.textContent).toContain("Nr. 1 bleibt frei, die übrigen Nummern (2–3) bleiben — wie auf Lageblatt und Meldeblock");
    expect(dialog.textContent).not.toContain("rücken auf");
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    await waitFor(() => expect([...document.querySelectorAll(".meldung-nr")].map((e) => e.textContent)).toEqual(["Nr. 2", "Nr. 3"]));
  });
});

describe("R18-N11/N12 Übersicht im Assistenten", () => {
  it("nennt fehlende Angaben „nicht eingetragen“ und leere Namenszellen „(offen)“, mit Legende der Rollen", () => {
    const b = neuerBogen();
    b.personal = [neuePerson(), { ...neuePerson(), vorname: "Anna", nachname: "Beispiel" }];
    render(<Uebersicht bogen={b} geheZu={() => {}} neu={() => {}} />);
    const dt = screen.getByText("Uhrzeit Beginn / Ende");
    expect(dt.nextElementSibling!.textContent).toContain("nicht eingetragen / nicht eingetragen");
    expect(dt.nextElementSibling!.textContent).toContain("(optional, nur für eigene Nachweise — Schritt 2)");
    expect(dt.nextElementSibling!.textContent).not.toContain("kommen nicht hierher zurück");
    expect(screen.getByText("Ort / Auftrag").nextElementSibling!.textContent).toBe("nicht eingetragen");
    const zellen = [...document.querySelectorAll("table.uebersicht tbody tr")].map((tr) => (tr.children[2] as HTMLElement).textContent);
    expect(zellen).toContain("(offen)");
    expect(zellen).toContain("Beispiel, Anna");
    expect(document.querySelector(".rollen-legende")!.textContent).toBe("Fü = Führer/in · UFü = Unterführer/in · Ma = Mannschaft");
  });
});

describe("R18-H5 Autokorrektur aus bei Ort, Sonstiges und Zettelangaben", () => {
  const aus = (el: HTMLElement) => {
    expect(el.getAttribute("autocorrect")).toBe("off");
    expect(el.getAttribute("spellcheck")).toBe("false");
  };

  it("Einsatzort / Auftrag (Schritt 2)", () => {
    render(<SchrittBuehne komponente={SchrittEinsatz} />);
    aus(screen.getByLabelText("Einsatzort / Auftrag"));
  });

  it("Sonstiges (Schritt 5)", () => {
    render(<SchrittBuehne komponente={SchrittSofortbedarf} />);
    aus(screen.getByLabelText("Sonstiges (Freitext)"));
  });

  it("Nr. und Zug der Zettelangaben der Schnellerfassung", () => {
    render(<EintreffzeitFeld wert="" onAendern={() => {}} nummer="" onNummer={() => {}} zug="" onZug={() => {}} zuege={[]} />);
    aus(screen.getByLabelText(/^Nr\. laut Zettel/));
    aus(screen.getByLabelText(/^Zug \/ Verband/));
  });
});

describe("R18-N13 Fachwörter der Sammlung", () => {
  it("schreibt „anwesend“ statt „zählend“ und erklärt „Zur Kenntnis genommen“", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    render(<Wirt id={s.id} />);
    expect(document.querySelector("#einheiten-liste")!.textContent).toBe("Einheiten (1 gemeldet · 1 anwesend)");
    expect(document.body.textContent).not.toMatch(/Folgem\./);
  });
});

describe("R18: Stilregeln in index.html", () => {
  const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
  const abschnitt = (() => {
    const von = html.indexOf("/* ===== Runde 18 (Inhalte) ===== */");
    const bis = html.indexOf("/* ===== Ende Runde 18 (Inhalte) ===== */");
    expect(von).toBeGreaterThan(0);
    expect(bis).toBeGreaterThan(von);
    return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
  })();

  it("N8: „Zurück“ trägt sein Wort ab 17 rem; im Schritt 1 ist der gesperrte Knopf unsichtbar", () => {
    expect(abschnitt).toMatch(/@container assistent-nav \(min-width: 17rem\)\s*\{\s*footer\.nav\.assistent-nav > \.nav-zurueck \.nav-wort \{ display: inline; \}/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav > \.nav-zurueck:disabled \{ visibility: hidden; \}/);
  });

  it("W7: Schrittleiste und Legende der Schnellerfassung sind am Telefon eingeklappt", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\)\s*\{[^}]*\.schritte\.schritte-schnell[^}]*display: none/);
  });

  it("A6/A7: die Textverweise des Abschluss-Blocks sind 44 px hoch", () => {
    expect(abschnitt).toMatch(/\.einsatz-abschluss button\.link \{[^}]*min-height: 44px/);
  });
});
