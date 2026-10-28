/**
 * Runde 19, Block Fußleiste und Quittung: „In Einsatz übernehmen" ganz im Knopf (K1, M1, O5, G1, H1, A4, W2, S1), kompakte
 * Quittungsleiste (A3, E5, H6, K5, M4, N12, O6, S4, G4, D4, L6, W12, K12, G5, D5), Tipp-Sperre mit Rückmeldung am Knopf (E1, N2,
 * K4, W11, S5, L3), L4, E9, Scanner ohne Kamera (L2, M5, G9, S10).
 *
 * Die Maße stammen aus Messungen im Produktionsbuild mit Playwright (Chromium, Touch, 320 bis 844 px, Standard und Feld); jsdom
 * rechnet kein Layout. Hier stehen das Verhalten (Zustände, Zeiten, Texte, Sperren) und die Stilregeln in index.html.
 */
import { readFileSync } from "node:fs";
import { useState } from "react";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht, frageWahl, prellschutzSetzen } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { DaumenQuittung, QUITTUNG_DETAILS_ENDE_NACH_MS, QUITTUNG_ENDE_NACH_MS } from "./daumen-quittung";
import { kenntnisVermerken } from "./export-stand";
import { neuerBogen } from "./hilfen";
import { ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";
import { App } from "./app";

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 19 (Fußleiste und Quittung) =====");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 19 (Fußleiste und Quittung) =====", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  prellschutzSetzen(0);
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = "";
});

function tipp(el: Element, x = 100, y = 300) {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1 }));
}

function rechteck(breite: number, hoehe = 44, oben = 0): DOMRect {
  return { x: 0, y: oben, top: oben, left: 0, right: breite, bottom: oben + hoehe, width: breite, height: hoehe, toJSON: () => ({}) } as DOMRect;
}

// ------------------------------------------------------------------------------------------------ Fußleiste

describe("R19-K1/M1/O5/G1/H1/A4/W2/S1 „In Einsatz übernehmen“ steht ganz im Knopf", () => {
  it("Stilregeln: Umbruch statt Überlauf, Spalte nie unter dem längsten Wort, „In Einsatz“ auch auf der schmalsten Leiste sichtbar", () => {
    expect(abschnitt).toMatch(/grid-template-columns:\s*auto minmax\(min-content, 1fr\) auto/);
    expect(abschnitt).toMatch(/\.uebernehmen\s*\{[^}]*display:\s*block;\s*white-space:\s*normal;[^}]*min-width:\s*min-content/);
    expect(abschnitt).toMatch(/\.nav-einsatz\s*\{\s*display:\s*inline;\s*\}/);
    // „← Zurück" wird auf schmaler Leiste zum Pfeil, damit die Leiste einzeilig bleibt; „Weiter →" bleibt ein Ziel von 44 px.
    expect(abschnitt).toMatch(/@container assistent-nav \(max-width: 22rem\)[^}]*\.nav-zurueck \.nav-wort\s*\{\s*display:\s*none/);
    expect(abschnitt).toMatch(/\.nav-weiter\s*\{\s*min-width:\s*calc\(44px \+ var\(--ziel\)\)/);
  });

  it("der Knopf trägt den vollen Namen und beide Wortteile (der CSS-Umbruch braucht beide im Text)", async () => {
    localStorage.clear();
    render(<App />);
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Fußleiste", EinsatzArt.EINSATZ);
    expect(s.id).toBeTruthy();
    cleanup();
    render(<App />);
    await nutzer.click(await screen.findByRole("button", { name: /Öffnen/ }));
    await nutzer.click(await screen.findByRole("button", { name: /Einheit manuell erfassen/ }));
    const dialog = document.querySelector("dialog[open]");
    if (dialog) await nutzer.click(within(dialog as HTMLElement).getAllByRole("button")[0]!);
    const knopf = await screen.findByRole("button", { name: "In Einsatz übernehmen" });
    expect(knopf.querySelector(".nav-einsatz")?.textContent).toBe("In Einsatz ");
    expect(knopf.querySelector(".nav-ue")?.textContent).toBe("übernehmen");
  });
});

// ------------------------------------------------------------------------------------------------ Quittungsleiste

describe("R19-A3/E5/H6/K5/M4/N12/O6/S4/G4/D4/L6/W12 kompakte Quittungsleiste", () => {
  const lang = "Entfernt: Meldung Nr. 1 „THW Albstadt Zugtrupp Technischer Zug“ (4 Personen). Nr. 1 bleibt frei. 7 Tage im Papierkorb unter der Liste.";

  it("zeigt die Kurzfassung, der volle Satz steht für Vorleser da; „Details“ zeigt ihn, „Weniger“ nimmt ihn zurück", async () => {
    const nutzer = userEvent.setup();
    render(
      <DaumenQuittung kurz="Nr. 1 entfernt · Papierkorb" onRueckgaengig={() => {}} onSchliessen={() => {}}>
        {lang}
      </DaumenQuittung>,
    );
    const text = document.querySelector(".quittung-text")!;
    expect(text.querySelector("[aria-hidden='true']")?.textContent).toBe("Nr. 1 entfernt · Papierkorb");
    expect(text.querySelector(".nur-sr")?.textContent).toBe(lang);
    const details = screen.getByRole("button", { name: "Details" });
    expect(details.getAttribute("aria-expanded")).toBe("false");
    await nutzer.click(details);
    const offen = screen.getByRole("button", { name: "Weniger" });
    expect(offen.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector(".quittung-daumen")!.className).toContain("quittung-offen");
    expect(document.querySelector(".quittung-text")!.textContent).toContain(lang);
    expect(document.querySelector(".quittung-text [aria-hidden='true']")).toBeNull();
    await nutzer.click(offen);
    expect(document.querySelector(".quittung-daumen")!.className).not.toContain("quittung-offen");
  });

  it("ohne Kurzfassung steht der volle Text da und es gibt kein „Details“", () => {
    render(<DaumenQuittung onSchliessen={() => {}}>Zug „1. Zug“ gesetzt: 5 Einheiten</DaumenQuittung>);
    expect(screen.queryByRole("button", { name: "Details" })).toBeNull();
    expect(document.querySelector(".quittung-text")!.textContent).toContain("Zug „1. Zug“ gesetzt: 5 Einheiten");
  });

  it("verschwindet nach 8 bis 10 s ganz; wer „Details“ aufklappt, hat 30 s", () => {
    expect(QUITTUNG_ENDE_NACH_MS).toBeGreaterThanOrEqual(8_000);
    expect(QUITTUNG_ENDE_NACH_MS).toBeLessThanOrEqual(10_000);
    expect(QUITTUNG_DETAILS_ENDE_NACH_MS).toBeGreaterThan(QUITTUNG_ENDE_NACH_MS);
    vi.useFakeTimers();
    const zu = vi.fn();
    render(
      <DaumenQuittung kurz="Nr. 1 entfernt" onRueckgaengig={() => {}} onSchliessen={zu}>
        {lang}
      </DaumenQuittung>,
    );
    act(() => void vi.advanceTimersByTime(QUITTUNG_ENDE_NACH_MS - 100));
    expect(zu).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(zu).toHaveBeenCalledTimes(1);
  });

  it("nach „Details“ läuft die längere Frist, nicht die kurze", () => {
    vi.useFakeTimers();
    const zu = vi.fn();
    render(
      <DaumenQuittung kurz="Nr. 1 entfernt" onRueckgaengig={() => {}} onSchliessen={zu}>
        {lang}
      </DaumenQuittung>,
    );
    act(() => void vi.advanceTimersByTime(QUITTUNG_ENDE_NACH_MS - 1_000));
    act(() => void screen.getByRole("button", { name: "Details" }).click());
    act(() => void vi.advanceTimersByTime(5_000));
    expect(zu).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(QUITTUNG_DETAILS_ENDE_NACH_MS));
    expect(zu).toHaveBeenCalledTimes(1);
  });

  it("„Rückgängig“, „✕“ und „Details“ nimmt auch der erste Tipp an der Stelle des auslösenden Tipps an (nie gesperrt)", () => {
    const zurueck = vi.fn();
    const knopf = document.createElement("button");
    knopf.textContent = "Entfernen";
    document.body.append(knopf);
    tipp(knopf, 200, 500);
    render(
      <DaumenQuittung kurz="Nr. 1 entfernt" onRueckgaengig={zurueck} onSchliessen={() => {}}>
        {lang}
      </DaumenQuittung>,
    );
    act(() => tipp(screen.getByRole("button", { name: "Details" }), 200, 500));
    expect(document.getElementById("tipp-moment")).toBeNull();
    expect(screen.getByRole("button", { name: "Weniger" })).toBeDefined();
    act(() => tipp(screen.getByRole("button", { name: "Rückgängig" }), 200, 500));
    expect(zurueck).toHaveBeenCalledTimes(1);
  });

  it("Stilregeln: eine Zeile mit Knöpfen, bündig unten am Telefon, 24 px zwischen „Rückgängig“ und „✕“, „Details“ als Ziel von 44 px", () => {
    expect(abschnitt).toMatch(/\.quittung-daumen > \.quittung-knoepfe\s*\{\s*gap:\s*24px/);
    expect(abschnitt).toMatch(/\.quittung-daumen:not\(\.quittung-offen\)\s*\{[^}]*flex-wrap:\s*nowrap/);
    expect(abschnitt).toMatch(/@media \(max-width: 35\.99rem\)\s*\{\s*:root:root:root:root \.quittung-daumen\s*\{[^}]*left:\s*0;\s*right:\s*0;[^}]*bottom:\s*0;/);
    const polster = /button\.quittung-details\s*\{[^}]*padding:\s*(\d+)px (\d+)px;\s*margin:\s*-(\d+)px/.exec(abschnitt);
    expect(Number(polster?.[1])).toBeGreaterThanOrEqual(12); // 2 × 14 + Zeile ≥ 44
    expect(Number(polster?.[3])).toBe(Number(polster?.[1])); // das Polster verändert die Zeilenhöhe nicht
  });
});

type Props = Parameters<typeof EinsatzDetail>[0];

function Wirt({ id }: { id: string }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  const p: Props = {
    einsatz,
    onZurueck: () => {},
    onGeaendert: () => setEinsatz(einsaetzeLaden().find((s) => s.id === id)!),
    onScannen: () => {},
    onManuell: () => {},
    onDateiImport: () => {},
    onBilderImport: () => {},
    onExport: () => {},
    onCsvExport: () => {},
    onCsvDetailExport: () => {},
    onOldenburgExport: () => {},
    onSammelPdf: () => {},
    onGeloescht: () => {},
  };
  return (
    <>
      <EinsatzDetail {...p} />
      <Dialogschicht />
    </>
  );
}

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

describe("R19-A3/K5/O6/S4 Quittungen der Einsatzansicht nennen eine Kurzfassung mit Nummer und Fundort", () => {
  it("„Entfernen“: Kurzfassung „Nr. n entfernt · Papierkorb“, der volle Satz (Nummern, 7 Tage) hinter „Details“", async () => {
    const nutzer = userEvent.setup();
    prellschutzSetzen(0);
    const s = einsatzAnlegen("Hochwasser Kurz", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    meldungHinzufuegen(s.id, bogenMitName("Beta"));
    render(<Wirt id={s.id} />);
    const karte = [...document.querySelectorAll<HTMLElement>("li.einheit-zeile")].find((k) => k.textContent!.includes("Alpha"))!;
    await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    const leiste = await waitFor(() => {
      const l = document.querySelector<HTMLElement>(".quittung-daumen");
      expect(l).not.toBeNull();
      return l!;
    });
    expect(leiste.querySelector("[aria-hidden='true']")?.textContent).toMatch(/^Nr\. \d+ entfernt · Papierkorb$/);
    expect(leiste.textContent).toContain("7 Tage im Papierkorb unter der Liste");
    await nutzer.click(within(leiste).getByRole("button", { name: "Details" }));
    expect(leiste.querySelector(".quittung-text")!.textContent).toMatch(/Entfernt: Meldung Nr\. \d+ „.*Alpha/);
  });
});

describe("R19-G5 „Zur Kenntnis genommen“ lässt die Seite nicht springen", () => {
  it("rollt um die Höhe des verschwundenen Kastens zurück, damit das Element dahinter an derselben Stelle bleibt", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Kenntnis", EinsatzArt.EINSATZ);
    kenntnisVermerken(einsaetzeLaden().find((x) => x.id === s.id)!);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    meldungHinzufuegen(s.id, bogenMitName("Beta"));
    render(<Wirt id={s.id} />);
    const kasten = document.querySelector(".stapel-eingang");
    expect(kasten).not.toBeNull();
    const anker = kasten!.nextElementSibling ?? kasten!.previousElementSibling;
    expect(anker).not.toBeNull();
    // Der Anker liegt 520 px weiter oben, sobald der Kasten weg ist.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      if (this === anker) return rechteck(300, 40, document.querySelector(".stapel-eingang") ? 700 : 180);
      return rechteck(0, 0, 0);
    });
    const rollen = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    await nutzer.click(screen.getByRole("button", { name: "Zur Kenntnis genommen" }));
    expect(document.querySelector(".stapel-eingang")).toBeNull();
    expect(rollen).toHaveBeenCalledWith(0, -520);
  });
});

// ------------------------------------------------------------------------------------------------ Tipp-Sperre

describe("R19-E1/N2/K4/W11/S5/L3 Tipp-Sperre zeigt ihren Grund am Knopf", () => {
  it("ein verworfener Tipp auf einen breiten Knopf zeigt „Einen Moment …“ auf dem Knopf, nicht als Pille", () => {
    const knopf = document.createElement("button");
    knopf.textContent = "Übersicht als CSV";
    document.body.append(knopf);
    vi.spyOn(knopf, "getBoundingClientRect").mockReturnValue(rechteck(240));
    tipp(document.body, 100, 100); // der auslösende Tipp
    ortSperren(1200, { x: 100, y: 100 });
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    tipp(knopf, 100, 100);
    expect(getroffen).not.toHaveBeenCalled();
    expect(knopf.getAttribute("data-tipp-gesperrt")).toBe("text");
    expect(knopf.getAttribute("data-tipp-text")).toBe("Einen Moment …");
    expect(document.getElementById("tipp-moment")?.hidden ?? true).toBe(true); // keine Pille über dem Finger
  });

  it("auf einem schmalen Ziel bleibt die Pille mit „Einen Moment …“", () => {
    const knopf = document.createElement("button");
    knopf.textContent = "Abrücken";
    document.body.append(knopf);
    vi.spyOn(knopf, "getBoundingClientRect").mockReturnValue(rechteck(48));
    ortSperren(1200, { x: 100, y: 100 });
    tipp(knopf, 100, 100);
    expect(knopf.getAttribute("data-tipp-gesperrt")).toBe("");
    expect(knopf.hasAttribute("data-tipp-text")).toBe(false);
    expect(document.getElementById("tipp-moment")?.hidden).toBe(false);
    expect(document.getElementById("tipp-moment")?.textContent).toBe("Einen Moment …");
  });

  it("Stilregeln: Grund in Text- und Flächenfarbe auf dem Knopf, Antworten in der Wartezeit nicht mehr gedämpft, Streifen statt Dimmen", () => {
    expect(abschnitt).toMatch(/button\[data-tipp-gesperrt="text"\]::after\s*\{[^}]*content:\s*attr\(data-tipp-text\)[^}]*background:\s*var\(--text\);\s*color:\s*var\(--flaeche\)/);
    expect(abschnitt).toMatch(/dialog\.abfrage button\.wartet\s*\{\s*opacity:\s*1;\s*border-style:\s*dashed/);
    expect(abschnitt).toMatch(/dialog\.abfrage button\.wartet::before\s*\{[^}]*animation:\s*wartet-lauf var\(--wartet-ms/);
  });

  it("eine Rückfrage sperrt die zerstörende Antwort sichtbar (Streifen mit Sperrzeit), nie die sichere „Stärke eintragen“", async () => {
    prellschutzSetzen(350);
    render(<Dialogschicht />);
    const antwort = frageWahl({
      titel: "Stärke fehlt",
      text: "?",
      wege: [
        { wert: "eintragen", label: "Stärke eintragen", sicher: true },
        { wert: "null", label: "Trotzdem mit Stärke 0 übernehmen", gefahr: true },
      ],
    });
    const dialog = await screen.findByRole("dialog", { name: "Stärke fehlt" });
    const gefahr = within(dialog).getByRole("button", { name: "Trotzdem mit Stärke 0 übernehmen" });
    expect(gefahr.className).toContain("wartet");
    expect(gefahr.getAttribute("aria-disabled")).toBe("true");
    expect(gefahr.style.getPropertyValue("--wartet-ms")).toBe("650ms");
    const sicher = within(dialog).getByRole("button", { name: "Stärke eintragen" });
    expect(sicher.className).not.toContain("wartet");
    expect(sicher.getAttribute("aria-disabled")).toBeNull();
    expect(sicher.hasAttribute("data-sicher")).toBe(true);
    tipp(sicher, 100, 400);
    expect(document.getElementById("tipp-moment")).toBeNull();
    sicher.click();
    await expect(antwort).resolves.toBe("eintragen");
  });
});

// ------------------------------------------------------------------------------------------------ L4, E9, Scanner

describe("R19-L4 Rand von „Ort eintragen…“ in der Ansicht „Dunkel“", () => {
  it("hat einen hellen Rand (über 3 : 1 zum blauen Band)", () => {
    const farbe = /\.dunkel-modus \.seiten-kopf \.titelzeile \.kopf-aendern\s*\{\s*border-color:\s*(#[0-9a-f]{6})/i.exec(abschnitt)?.[1];
    expect(farbe).toBeDefined();
    const leuchtdichte = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const kontrast = (a: string, b: string) => {
      const [x, y] = [leuchtdichte(a), leuchtdichte(b)];
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    expect(kontrast(farbe!, "#12275e")).toBeGreaterThanOrEqual(3);
    expect(kontrast(farbe!, "#171a21")).toBeGreaterThanOrEqual(3); // Fläche des Knopfs
  });
});

describe("R19-E9 Statusmarke im Schrittband", () => {
  it("heißt „fehlt“ statt „offen“ und ist mindestens 12 px groß", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(await screen.findByRole("button", { name: /Neuen Bogen erstellen/ }));
    await nutzer.type(await screen.findByLabelText(/Ort der Einheit/), "Musterstadt");
    const marken = [...document.querySelectorAll(".schritte .schritt-status")].map((m) => m.textContent);
    expect(marken).toContain("fehlt");
    expect(marken).not.toContain("offen");
    expect(abschnitt).toMatch(/\.schritte button\.status-begonnen \.schritt-status\s*\{\s*font-size:\s*max\(0\.7em, 12px\)/);
  });
});

describe("R19-L2/M5/G9/S10 Scanner ohne Kamera", () => {
  it("Stilregeln: Anleitung kompakt, Handscanner-Weg in der Mitte, quer der Weg am Telefon zuerst und einspaltig darüber", () => {
    expect(abschnitt).toMatch(/\.scanner-handscanner \.scanner-schritte li:first-child\s*\{\s*display:\s*none/);
    expect(abschnitt).toMatch(/grid-template-areas:\s*"bild bild" "titel titel" "schritte lampe" "hinweise lampe"/);
    expect(abschnitt).toMatch(/\.scanner-handscanner > \.scanner-bildweg\s*\{\s*grid-area:\s*bild/);
    expect(abschnitt).toMatch(/@media \(max-width: 22\.5rem\)\s*\{\s*\.scanner > \.scanner-aktionen > button/);
  });
});
