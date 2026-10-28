/**
 * Runde 19, Block Speicher: Jede Schreibaktion quittiert erst, wenn das Schreiben gelang (O1 bis O4), dazu die Vermerke von
 * Übergabe und Abschluss gegen den Stand der Lage (D1, W1), Export-Tipp (K4, N2, E1), Startseite (A11, K7, L5) u. a.
 *
 * Der Speicher-Stub verhält sich wie ein echter Browser-Speicher: Er zählt die Zeichen aller Schlüssel und wirft
 * `QuotaExceededError`, sobald ein Schreiben die Grenze überschritte.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuerBogen } from "./hilfen";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht, prellschutzSetzen } from "./dialoge";
import { EinsatzDetail, EinsatzListe } from "./einsaetze-ui";
import { meldungenImPapierkorb } from "./meldungs-papierkorb";
import { abschlussLaden, abschlussSetzen, abschlussKarteText, meldungenSeit } from "./einsatz-abschluss";
import { exportVermerken, lageblattVermerken, vermerkFehltZusatz, vermerkNeuBeginnen, weitergabeVermerken } from "./export-stand";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  prellschutzSetzen(0);
  vi.restoreAllMocks();
});

/** Ab jetzt passen höchstens `spiel` weitere Zeichen in den Speicher (wie bei einem vollen Gerät). */
function speicherVoll(spiel = 0) {
  const echt = Storage.prototype.setItem;
  const belegt = () => {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      n += k.length + (localStorage.getItem(k) ?? "").length;
    }
    return n;
  };
  const grenze = belegt() + spiel;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
    const alt = this.getItem(k);
    const danach = belegt() - (alt == null ? 0 : k.length + alt.length) + k.length + v.length;
    if (danach > grenze) throw new DOMException("voll", "QuotaExceededError");
    return echt.call(this, k, v);
  });
}

function bogenMitName(name: string) {
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

const dialogMit = (titel: string) => document.querySelector<HTMLDialogElement>(`dialog[aria-label='${titel}']`);

async function alphaEntfernenOeffnen(nutzer: ReturnType<typeof userEvent.setup>) {
  const karte = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes("Alpha"))!;
  await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
  await nutzer.click(within(karte).getByRole("button", { name: "Entfernen" }));
  return within(dialogMit("Meldung entfernen?")!).getByRole("button", { name: "Meldung entfernen" });
}

// ------------------------------------------------------------------------------------------------ O1

describe("R19-O1 „Meldung entfernen“ bei vollem Speicher", () => {
  beforeEach(() => localStorage.clear());

  function buehne() {
    const s = einsatzAnlegen("Hochwasser Voll", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    meldungHinzufuegen(s.id, bogenMitName("Beta"));
    return s;
  }

  it("legt den Papierkorb-Eintrag an, bevor die Quittung ihn verspricht", async () => {
    const nutzer = userEvent.setup();
    const s = buehne();
    render(<Wirt id={s.id} />);
    await nutzer.click(await alphaEntfernenOeffnen(nutzer));
    await waitFor(() => expect(document.querySelector(".quittung-daumen")).not.toBeNull());
    expect(document.querySelector(".quittung-daumen")!.textContent).toMatch(/entfernt · Papierkorb/);
    expect(meldungenImPapierkorb(s.id)).toHaveLength(1);
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1);
  });

  it("fragt bei vollem Speicher nach; „Abbrechen“ lässt die Meldung stehen, auch nach dem Neuladen", async () => {
    const nutzer = userEvent.setup();
    const s = buehne();
    render(<Wirt id={s.id} />);
    const bestaetigen = await alphaEntfernenOeffnen(nutzer);
    speicherVoll(0);
    await nutzer.click(bestaetigen);
    const frage = await waitFor(() => {
      const d = dialogMit("Papierkorb voll");
      expect(d).not.toBeNull();
      return d!;
    });
    expect(frage.textContent).toContain("nicht in den Papierkorb");
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
    // „Neu laden“: der Speicher selbst entscheidet.
    expect(einsaetzeLaden().find((x) => x.id === s.id)!.eintraege).toHaveLength(2);
    expect(meldungenImPapierkorb(s.id)).toHaveLength(0);
  });

  it("„Endgültig entfernen“ quittiert ehrlich: nicht im Papierkorb, nur bis zum Neuladen zurückholbar", async () => {
    const nutzer = userEvent.setup();
    const s = buehne();
    render(<Wirt id={s.id} />);
    const bestaetigen = await alphaEntfernenOeffnen(nutzer);
    // Platz für das verkleinerte Einsatz-JSON, aber nicht für den Papierkorb-Eintrag.
    const voll = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === "eeb.meldungen-papierkorb.v1") throw new DOMException("voll", "QuotaExceededError");
      return voll.call(this, k, v);
    });
    await nutzer.click(bestaetigen);
    const frage = await waitFor(() => dialogMit("Papierkorb voll")!);
    await nutzer.click(within(frage).getByRole("button", { name: "Endgültig entfernen" }));
    const leiste = await waitFor(() => {
      const l = document.querySelector<HTMLElement>(".quittung-daumen");
      expect(l).not.toBeNull();
      return l!;
    });
    expect(leiste.textContent).toContain("nur bis Neuladen");
    expect(leiste.textContent).not.toMatch(/· Papierkorb|7 Tage/);
    expect(einsaetzeLaden().find((x) => x.id === s.id)!.eintraege).toHaveLength(1);
    expect(meldungenImPapierkorb(s.id)).toHaveLength(0);
  });
});

// ------------------------------------------------------------------------------------------------ O3

describe("R19-O3 „Einsatz löschen“ bei vollem Speicher", () => {
  beforeEach(() => localStorage.clear());

  it("in der Einsatzansicht: Hinweis „Nicht gelöscht“, der Einsatz bleibt auch nach dem Neuladen", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    const onGeloescht = vi.fn();
    render(<Wirt id={s.id} extra={{ onGeloescht }} />);
    speicherVoll(0);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    await nutzer.click(within(dialogMit("Einsatz löschen?")!).getByRole("button", { name: "In den Papierkorb" }));
    const hinweis = await waitFor(() => dialogMit("Nicht gelöscht")!);
    expect(hinweis.textContent).toMatch(/Speicher/);
    await nutzer.click(within(hinweis).getByRole("button", { name: "Abbrechen" }));
    expect(onGeloescht).not.toHaveBeenCalled();
    expect(einsaetzeLaden()).toHaveLength(1);
  });

  it("bietet bei vollem Speicher „Endgültig löschen“ an und quittiert es ohne Papierkorb-Versprechen", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Platz", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    const onGeloescht = vi.fn();
    render(<Wirt id={s.id} extra={{ onGeloescht }} />);
    speicherVoll(0);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    await nutzer.click(within(dialogMit("Einsatz löschen?")!).getByRole("button", { name: "In den Papierkorb" }));
    const frage = await waitFor(() => dialogMit("Nicht gelöscht")!);
    expect(frage.textContent).toContain("nicht rückholbar");
    await nutzer.click(within(frage).getByRole("button", { name: "Endgültig löschen" }));
    const quittung = await waitFor(() => dialogMit("Endgültig gelöscht")!);
    expect(quittung.textContent).toContain("nicht im Papierkorb");
    await nutzer.click(within(quittung).getAllByRole("button")[0]!);
    await waitFor(() => expect(onGeloescht).toHaveBeenCalledTimes(1));
    expect(einsaetzeLaden()).toHaveLength(0);
  });
});

// ------------------------------------------------------------------------------------------------ O2

describe("R19-O2 Übergabe und Abschluss bei vollem Speicher", () => {
  beforeEach(() => localStorage.clear());

  it("„Einsatz als beendet markieren“ meldet den Fehler und lässt den Einsatz offen", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Abschluss", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    speicherVoll(0);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz als beendet markieren" }));
    const hinweis = await waitFor(() => dialogMit("Einsatz nicht beendet")!);
    expect(hinweis.textContent).toContain("nicht gespeichert");
    expect(abschlussLaden(s.id).beendetAm).toBeUndefined();
    expect(screen.getByRole("button", { name: "Einsatz als beendet markieren" })).toBeDefined();
  });

  it("„Übergabe vermerken“ meldet den Fehler, die Zeile bleibt „noch nicht vermerkt“", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Übergabe", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Übergabe vermerken…" }));
    const eingabe = dialogMit("Übergabe vermerken")!;
    await nutzer.type(within(eingabe).getByRole("textbox"), "Stab Süd");
    speicherVoll(0);
    await nutzer.click(within(eingabe).getByRole("button", { name: "Vermerken" }));
    const hinweis = await waitFor(() => dialogMit("Übergabe nicht vermerkt")!);
    expect(hinweis.textContent).toContain("nicht gespeichert");
    expect(abschlussLaden(s.id).uebergabeAm).toBeUndefined();
    expect(screen.getByText(/Übergabe noch nicht vermerkt/)).toBeDefined();
  });

  it("bei freiem Speicher gilt dasselbe wie bisher: vermerkt, beendet, und das Ergebnis steht an der Stelle des Knopfs", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Frei", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz als beendet markieren" }));
    await waitFor(() => expect(abschlussLaden(s.id).beendetAm).toBeDefined());
    const abschnitt = document.querySelector<HTMLElement>("section.einsatz-abschluss")!;
    // R19-M12: Die Zeile ersetzt den Knopf, sie steht am Ende des Abschnitts statt davor.
    const kinder = [...abschnitt.children];
    const liste = kinder.findIndex((k) => k.classList.contains("abschluss-liste"));
    const zeile = kinder.findIndex((k) => k.classList.contains("einsatz-beendet"));
    expect(liste).toBeGreaterThanOrEqual(0);
    expect(zeile).toBeGreaterThan(liste);
    expect(within(abschnitt).queryByRole("button", { name: "Einsatz als beendet markieren" })).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ O4

describe("R19-O4 Export-Vermerk bei vollem Speicher", () => {
  beforeEach(() => localStorage.clear());

  it("Lageblatt, Weitergabe und Export melden den gescheiterten Vermerk als Zusatz der Quittung", () => {
    const s = einsatzAnlegen("Hochwasser Vermerk", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    const einsatz = einsaetzeLaden()[0]!;
    vermerkNeuBeginnen();
    weitergabeVermerken(einsatz);
    expect(vermerkFehltZusatz()).toBe("");

    speicherVoll(0);
    vermerkNeuBeginnen();
    lageblattVermerken(einsatz);
    expect(vermerkFehltZusatz()).toContain("Vermerk nicht gespeichert (Speicher voll)");
    vermerkNeuBeginnen();
    expect(vermerkFehltZusatz()).toBe("");
    exportVermerken(einsatz, "csv");
    expect(vermerkFehltZusatz()).toContain("Vermerk nicht gespeichert");
  });
});

// ------------------------------------------------------------------------------------------------ D1, W1

describe("R19-D1/W1 Vermerk und Ende gegen den Stand der Lage", () => {
  beforeEach(() => localStorage.clear());

  it("meldungenSeit zählt Einheiten mit Meldung nach dem Vermerk", () => {
    const e = (schl: string, t: number) => ({ einheitSchluessel: schl, empfangenAm: t });
    expect(meldungenSeit([e("a", 10), e("b", 20), e("b", 30)], 15)).toBe(1);
    expect(meldungenSeit([e("a", 10)], 15)).toBe(0);
  });

  it("Übergabe und Ende werden als „nicht mehr aktuell“ gekennzeichnet, wenn danach ein Bogen kam", async () => {
    const s = einsatzAnlegen("Hochwasser Alt", EinsatzArt.EINSATZ);
    const t = Date.now();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(t);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    vi.setSystemTime(t + 5000);
    abschlussSetzen(s.id, { uebergabeAm: t + 5000, uebergabeAn: "", beendetAm: t + 5000 }, [s.id]);
    vi.setSystemTime(t + 10000);
    meldungHinzufuegen(s.id, bogenMitName("Beta"));
    vi.useRealTimers();
    render(<Wirt id={s.id} />);
    const abschnitt = document.querySelector<HTMLElement>("section.einsatz-abschluss")!;
    expect(abschnitt.querySelector(".abschluss-uebergabe")!.textContent).toMatch(/Nicht mehr aktuell: seitdem 1 neue Meldung/);
    expect(abschnitt.querySelector(".abschluss-uebergabe")!.textContent).toContain("ohne Empfänger");
    expect(abschnitt.querySelector(".einsatz-beendet")!.textContent).toMatch(/Nicht mehr aktuell: seitdem 1 neue Meldung/);
    expect(document.querySelector(".einsatz-beendet-kopf")!.textContent).toMatch(/nicht mehr aktuell, seitdem 1 neue Meldung/);
    expect(abschnitt.textContent).toContain("Alle Daten als CSV");
  });

  it("ein Lageblatt-Häkchen wird zu „seitdem 1 neue Meldung“, wenn danach ein Bogen kam", () => {
    const s = einsatzAnlegen("Hochwasser Lage", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    lageblattVermerken(einsaetzeLaden()[0]!);
    meldungHinzufuegen(s.id, bogenMitName("Beta"));
    render(<Wirt id={s.id} />);
    const zeile = [...document.querySelectorAll(".abschluss-liste p")].find((p) => p.textContent!.includes("Lageblatt:"))!;
    expect(zeile.textContent).toMatch(/seitdem 1 neue Meldung, nicht mehr aktuell/);
    expect(zeile.className).toBe("offen");
  });
});

// ------------------------------------------------------------------------------------------------ A11, K7, L5

describe("R19-A11/K7/L5 Startseite zeigt Ende und Übergabe", () => {
  beforeEach(() => localStorage.clear());

  it("abschlussKarteText nennt Ende, Empfänger und Nachzügler", () => {
    const z = (ms: number) => `t${ms}`;
    expect(abschlussKarteText({}, z)).toBe("");
    expect(abschlussKarteText({ beendetAm: 5, uebergabeAm: 6, uebergabeAn: "Stab Rottenburg" }, z)).toBe("beendet t5 · übergeben t6 an Stab Rottenburg");
    expect(abschlussKarteText({ uebergabeAm: 6 }, z)).toContain("(ohne Empfänger)");
    expect(abschlussKarteText({ beendetAm: 5 }, z, [{ einheitSchluessel: "a", empfangenAm: 9 }])).toContain("nicht mehr aktuell, seitdem 1 neue Meldung");
  });

  it("die Karte trägt „beendet“, und der beendete Einsatz steht am Ende der Liste", () => {
    const a = einsatzAnlegen("Erster", EinsatzArt.EINSATZ);
    const b = einsatzAnlegen("Zweiter", EinsatzArt.EINSATZ);
    abschlussSetzen(a.id, { beendetAm: Date.now(), uebergabeAm: Date.now(), uebergabeAn: "Stab Rottenburg" }, [a.id, b.id]);
    render(<EinsatzListe einsaetze={einsaetzeLaden()} onOeffnen={() => {}} onGeaendert={() => {}} />);
    const karten = [...document.querySelectorAll(".karte h2")].map((h) => h.textContent);
    expect(karten.indexOf("Zweiter")).toBeLessThan(karten.indexOf("Erster"));
    const marke = document.querySelector(".einsatz-beendet-karte")!;
    expect(marke.textContent).toMatch(/^beendet .* · übergeben .* an Stab Rottenburg$/);
    expect(marke.closest(".karte")!.querySelector("h2")!.textContent).toBe("Erster");
  });
});
