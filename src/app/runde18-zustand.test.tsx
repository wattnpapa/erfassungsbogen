/**
 * Runde 18, Block Zustand: Tipp-Sperre lässt Gegenhandlungen durch (W3, E1, H4, G3, S3, D2, N1), Quittungsleiste (H1, H2, S2, N2,
 * D5, W1, D6, A8), Papierkorb der entfernten Meldungen (E3, E4, H3, G1, D1, K11), O1, D8, D3, D4, E5, E6, S5, S6, S7/H6.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht, frageJaNein, frageWahl, prellschutzSetzen } from "./dialoge";
import { DaumenQuittung, QUITTUNG_ENDE_NACH_MS } from "./daumen-quittung";
import { PRELLSCHUTZ_MS, istSichereGegenhandlung, ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";
import { stelleHalten } from "./eintrag-bewegung";
import { telefonBereinigen } from "./telefon-eingabe";
import { parseNamen, telefonAbtrennen } from "./personal-schnell";

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = html.slice(html.indexOf("/* ===== Runde 18 (Zustand) ===== */"), html.indexOf("/* ===== Ende Runde 18 (Zustand) ===== */"));

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  prellschutzSetzen(0);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function tipp(el: Element, x = 100, y = 300) {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1 }));
}

// ------------------------------------------------------------------------------------------------ Tipp-Sperre

describe("R18-W3/E1/H4/G3/S3/D2/N1 Sichere Gegenhandlungen sind nie gesperrt", () => {
  it("erkennt „Abbrechen“, „Rückgängig“, „Zurück“, „Schließen“ und „✕“, aber nicht „Zurückholen“ oder „Bogen schließen“", () => {
    const knopf = (text: string, attr?: string) => {
      const b = document.createElement("button");
      b.textContent = text;
      if (attr) b.setAttribute(attr, "");
      return b;
    };
    for (const t of ["Abbrechen", "Rückgängig", "← Zurück", "Zurück", "Schließen", "✕", "Verstanden"]) {
      expect(istSichereGegenhandlung(knopf(t)), t).toBe(true);
    }
    expect(istSichereGegenhandlung(knopf("Irgendwas", "data-sicher"))).toBe(true);
    for (const t of ["Zurückholen", "Bogen schließen", "Meldung entfernen", "Weiter →", "Abrücken"]) {
      expect(istSichereGegenhandlung(knopf(t)), t).toBe(false);
    }
  });

  it("die Ortssperre schluckt „Rückgängig“ und „Abbrechen“ am selben Ort nicht, einen anderen Knopf schon", () => {
    const rueck = document.createElement("button");
    rueck.textContent = "Rückgängig";
    const weg = document.createElement("button");
    weg.textContent = "Wieder anwesend";
    document.body.append(rueck, weg);
    const rueckGetroffen = vi.fn();
    const wegGetroffen = vi.fn();
    rueck.addEventListener("click", rueckGetroffen);
    weg.addEventListener("click", wegGetroffen);
    tipp(weg, 200, 500); // der auslösende Tipp
    ortSperren(2000);
    tipp(rueck, 202, 502); // sofort danach an derselben Stelle
    expect(rueckGetroffen).toHaveBeenCalledTimes(1);
    expect(document.getElementById("tipp-moment")).toBeNull();
    tipp(weg, 202, 502);
    expect(wegGetroffen).toHaveBeenCalledTimes(1); // nur der erste, auslösende Tipp
    expect(document.getElementById("tipp-moment")?.hidden).toBe(false); // der verworfene zeigt „Einen Moment …"
    rueck.remove();
    weg.remove();
  });

  it("die Quittungsleiste: „Rückgängig“ nimmt den allerersten Tipp an, auch unter dem Finger des auslösenden Tipps", async () => {
    const zurueck = vi.fn();
    const knopf = document.createElement("button");
    knopf.textContent = "Abrücken";
    document.body.append(knopf);
    tipp(knopf, 200, 500);
    render(
      <DaumenQuittung prellschutz onRueckgaengig={zurueck} onSchliessen={() => {}}>
        Abgerückt
      </DaumenQuittung>,
    );
    tipp(screen.getByRole("button", { name: "Rückgängig" }), 200, 500);
    expect(zurueck).toHaveBeenCalledTimes(1);
    knopf.remove();
  });

  it("Rückfrage: „Abbrechen“ schließt schon 100 ms nach dem Öffnen, die zerstörende Antwort ist gedämpft und sagt „Einen Moment …“", async () => {
    prellschutzSetzen(450);
    render(<Dialogschicht />);
    const antwort = frageJaNein({ titel: "Einsatz löschen?", text: "?", ok: "In den Papierkorb", gefahr: true });
    const dialog = await screen.findByRole("dialog", { name: "Einsatz löschen?" });
    const ok = within(dialog).getByRole("button", { name: "In den Papierkorb" });
    // Sichtbar gesperrt: gedämpft und für Hilfstechnik als gesperrt gemeldet.
    expect(ok.className).toContain("wartet");
    expect(ok.getAttribute("aria-disabled")).toBe("true");
    // Der verworfene Tipp zeigt sich.
    tipp(ok, 100, 400);
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(document.getElementById("tipp-moment")?.hidden).toBe(false);
    // „Abbrechen“ dagegen: sofort wirksam.
    tipp(within(dialog).getByRole("button", { name: "Abbrechen" }), 100, 450);
    await expect(antwort).resolves.toBe(false);
  });

  it("Rückfrage: nach der Sperrzeit (R18: 0,65 s statt 0,8 s) ist die Antwort frei und nicht mehr gedämpft", async () => {
    prellschutzSetzen(350);
    render(<Dialogschicht />);
    void frageJaNein({ titel: "Meldung entfernen?", text: "?", ok: "Meldung entfernen", gefahr: true });
    const dialog = await screen.findByRole("dialog", { name: "Meldung entfernen?" });
    const ok = within(dialog).getByRole("button", { name: "Meldung entfernen" });
    expect(ok.className).toContain("wartet");
    await waitFor(() => expect(ok.className).not.toContain("wartet"), { timeout: 1500 });
    expect(ok.getAttribute("aria-disabled")).toBeNull();
  });

  it("Rückfrage mit Wahl: „Abbrechen“ ist von Anfang an wirksam", async () => {
    prellschutzSetzen(350);
    render(<Dialogschicht />);
    const antwort = frageWahl({ titel: "Welche?", text: "?", wege: [{ wert: "a", label: "A" }, { wert: "b", label: "B", gefahr: true }] });
    const dialog = await screen.findByRole("dialog", { name: "Welche?" });
    tipp(within(dialog).getByRole("button", { name: "Abbrechen" }));
    await expect(antwort).resolves.toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ Quittungsleiste

describe("R18-S2/H1/W1/N2/D5/D6/A8 Quittungsleiste", () => {
  it("steht bis QUITTUNG_ENDE_NACH_MS mit vollem Text und verschwindet dann ganz", () => {
    vi.useFakeTimers();
    const zu = vi.fn();
    const lang = "Entfernt: Meldung Nr. 1 „THW Albstadt Zugtrupp Technischer Zug“ (4 Personen). Die Einheiten Nr. 2–3 rücken auf und heißen danach Nr. 1–2.";
    render(
      <DaumenQuittung onRueckgaengig={() => {}} onSchliessen={zu}>
        {lang}
      </DaumenQuittung>,
    );
    // R19: kompakt und kurz (8 bis 10 s) statt 30 s; „Details“ verlängert (runde19-fuss-quittung.test.tsx).
    expect(QUITTUNG_ENDE_NACH_MS).toBeGreaterThanOrEqual(8_000);
    expect(QUITTUNG_ENDE_NACH_MS).toBeLessThanOrEqual(10_000);
    act(() => void vi.advanceTimersByTime(QUITTUNG_ENDE_NACH_MS - 100));
    expect(screen.getByRole("status").textContent).toContain(lang);
    expect(zu).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(zu).toHaveBeenCalledTimes(1);
  });

  it("CSS: kein Zeilenlimit mehr, Umbruch statt Quetschen, „Rückgängig“ und „✕“ mindestens 12 px auseinander", () => {
    expect(abschnitt).toMatch(/\.quittung-daumen > \.quittung-text \{[^}]*-webkit-line-clamp: unset/);
    expect(abschnitt).toMatch(/\.quittung-daumen[^{]*\{ flex-wrap: wrap/);
    const luecke = /\.quittung-knoepfe \{ gap: (\d+)px/.exec(abschnitt);
    expect(Number(luecke?.[1])).toBeGreaterThanOrEqual(12);
  });
});


describe("R18-D3/D4 Dialog „Alle Daten löschen“", () => {
  it("CSS: „Endgültig löschen“ und „Abbrechen“ liegen mindestens 24 px auseinander", () => {
    const m = /dialog \.dialog-entscheidung > \.aktionen \{ gap: (\d+)px; row-gap: (\d+)px/.exec(abschnitt);
    expect(Number(m?.[1])).toBeGreaterThanOrEqual(24);
    expect(Number(m?.[2])).toBeGreaterThanOrEqual(24);
  });
  it("Quelle: Die Folge „noch kein Export …“ steht als Kurzzeile oben, vor der festen Knopfleiste", () => {
    const quelle = readFileSync(`${process.cwd()}/src/app/fusszeile.tsx`, "utf8");
    expect(quelle.indexOf('className="loesch-kurz"')).toBeGreaterThan(0);
    expect(quelle.indexOf('className="loesch-kurz"')).toBeLessThan(quelle.indexOf('className="dialog-entscheidung"'));
  });
});

describe("R18-A8 Nach dem Entfernen bleibt die Ansicht an der Stelle der Karte", () => {
  it("stelleHalten rollt zurück, wenn die Stelle außerhalb des Bildes liegt, und lässt eine sichtbare Stelle stehen", () => {
    const rollen = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(640);
    vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => { f(0); return 1; });
    const y = vi.spyOn(window, "scrollY", "get");
    y.mockReturnValue(2651); // Ansicht 600 px unter der Liste (Exportbereich)
    stelleHalten(2162);
    expect(rollen).toHaveBeenCalledWith({ top: 2066, behavior: "auto" });
    rollen.mockClear();
    y.mockReturnValue(2000); // die Stelle (2162) liegt im Bild, nicht unter der Quittungsleiste
    stelleHalten(2162);
    expect(rollen).not.toHaveBeenCalled();
    stelleHalten(null);
    expect(rollen).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

// ------------------------------------------------------------------------------------------------ E6

describe("R18-E6 Telefonfeld: der Hinweis nennt die entfernten Zeichen unverändert", () => {
  it("„abc 12x“ → „abc“ und „x“ getrennt, nicht „abcx“", () => {
    const r = telefonBereinigen("abc 12x");
    expect(r.wert).toBe("12");
    expect(r.hinweis).toBe('Nur Ziffern übernommen („abc", „x" entfernt).');
  });
  it("ein einzelnes fremdes Stück bleibt wie bisher", () => {
    expect(telefonBereinigen("0441 abc").hinweis).toBe('Nur Ziffern übernommen („abc" entfernt).');
  });
});

// ------------------------------------------------------------------------------------------------ S7 / H6

describe("R18-H6 Rufnummer mitten in der Zeile mit Funktion dahinter", () => {
  it("„Jürgen Weber +49 171 9876543 ZTrFü“ → Name, Nummer und Funktion getrennt", () => {
    expect(telefonAbtrennen("Jürgen Weber +49 171 9876543 ZTrFü")).toEqual({ zeile: "Jürgen Weber", telefon: "+49 171 9876543", funktion: "ZTrFü" });
    const [p] = parseNamen("Jürgen Weber +49 171 9876543 ZTrFü");
    expect(p).toMatchObject({ vorname: "Jürgen", nachname: "Weber", funktion: "ZTrFü", telefon: "+49 171 9876543", unsicher: true });
  });
  it("ein Funktionskürzel mit bekannter Rolle bringt die Rolle mit", () => {
    const [p] = parseNamen("Hans Meier 0171 1234567 GrFü");
    expect(p).toMatchObject({ funktion: "GrFü", telefon: "0171 1234567" });
    expect(p!.rolle).toBeDefined();
  });
  it("ein Nachname hinter der Nummer wird keine Funktion", () => {
    expect(telefonAbtrennen("Hans 0171 1234567 Müller")).toEqual({ zeile: "Hans 0171 1234567 Müller" });
  });
  it("die Nummer am Zeilenende bleibt wie bisher", () => {
    expect(telefonAbtrennen("Kevin Meier 0171 1234567")).toEqual({ zeile: "Kevin Meier", telefon: "0171 1234567" });
  });
});

// ------------------------------------------------------------------------------------------------ Prellschutz-Konstante

describe("R18 Sperrzeiten", () => {
  it("der Prellschutz der Karten bleibt bei 0,6 s (Abrücken ↔ Wieder anwesend), die Rückfragen sind kürzer geworden", () => {
    expect(PRELLSCHUTZ_MS).toBe(600);
  });
});
