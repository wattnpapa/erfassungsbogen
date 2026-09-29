/**
 * Der Papierkorb von Einsätzen und Vorlagen — die einzigen Stellen der App, an
 * denen etwas endgültig verschwindet.
 *
 * Beide Wege hängen an einer Rückfrage, und beide Richtungen müssen halten: Ein
 * „Endgültig löschen", das nach dem Bestätigen nichts löscht, verliert nichts —
 * ein Abbruch, der trotzdem löscht, verliert fremde Personendaten. Geprüft wird
 * darum nicht der Klick, sondern der Gerätespeicher danach.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail, EinsatzListe } from "./einsaetze-ui";
import { VorlagenListe } from "./vorlagen-ui";
import {
  EinsatzArt,
  einsaetzeLaden,
  einsaetzePapierkorb,
  einsatzAnlegen,
  einsatzLoeschen,
} from "@bos/meldekopf/einsaetze";
import { vorlageAnlegen, vorlageLoeschen, vorlagenLaden, vorlagenPapierkorb } from "./vorlagen";
import { neuerBogen } from "./hilfen";

/** Rückfrage-Fenster zum Titel — die Dialogschicht zeichnet eines zur Zeit. */
const rueckfrage = (titel: string) => document.querySelector<HTMLDialogElement>(`dialog[aria-label='${titel}']`)!;

describe("Papierkorb der Einsätze", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /** Einsatz anlegen, in den Papierkorb legen und die Liste zeigen. */
  function buehne() {
    const s = einsatzAnlegen("Hochwasser Wardenburg", EinsatzArt.EINSATZ, "Wardenburg");
    einsatzLoeschen(s.id);
    render(
      <>
        <EinsatzListe einsaetze={einsaetzeLaden()} onOeffnen={() => {}} onGeaendert={() => {}} />
        <Dialogschicht />
      </>,
    );
    return s;
  }

  it("löscht einen Einsatz endgültig, wenn die Rückfrage bejaht wird", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: /^Papierkorb \(1\)/ }));
    await nutzer.click(screen.getByRole("button", { name: "Endgültig löschen…" }));
    await nutzer.click(
      within(rueckfrage("Einsatz endgültig löschen?")).getByRole("button", { name: "Endgültig löschen" }),
    );

    expect(einsaetzePapierkorb()).toHaveLength(0);
    expect(einsaetzeLaden()).toHaveLength(0);
  });

  it("behält den Einsatz im Papierkorb, wenn die Rückfrage abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    const s = buehne();

    await nutzer.click(screen.getByRole("button", { name: /^Papierkorb \(1\)/ }));
    await nutzer.click(screen.getByRole("button", { name: "Endgültig löschen…" }));
    await nutzer.click(within(rueckfrage("Einsatz endgültig löschen?")).getByRole("button", { name: "Abbrechen" }));

    expect(einsaetzePapierkorb().map((e) => e.id)).toEqual([s.id]);
  });

  it("holt einen Einsatz aus dem Papierkorb zurück", async () => {
    const nutzer = userEvent.setup();
    const s = buehne();

    await nutzer.click(screen.getByRole("button", { name: /^Papierkorb \(1\)/ }));
    await nutzer.click(screen.getByRole("button", { name: "Wiederherstellen" }));

    expect(einsaetzeLaden().map((e) => e.id)).toEqual([s.id]);
    expect(einsaetzePapierkorb()).toHaveLength(0);
  });
});

/**
 * „Einsatz löschen" ging auf der Startseite wortlos ab und quittierte aus der
 * Einsatzansicht ohne Rückweg (Audit Runde 2, R2-D6).
 */
describe("Einsatz löschen quittiert mit Rückgängig (R2-D6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function liste() {
    function Liste() {
      const [, neu] = useState(0);
      return <EinsatzListe einsaetze={einsaetzeLaden()} onOeffnen={() => {}} onGeaendert={() => neu((n) => n + 1)} />;
    }
    return render(
      <>
        <Liste />
        <Dialogschicht />
      </>,
    );
  }

  it("legt von der Startseite in den Papierkorb, quittiert mit Namen und holt über „Rückgängig“ zurück", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Wardenburg", EinsatzArt.EINSATZ, "Wardenburg");
    liste();
    await nutzer.click(screen.getByRole("button", { name: "Löschen…" }));
    await nutzer.click(within(rueckfrage("Einsatz löschen?")).getByRole("button", { name: "In den Papierkorb" }));
    const quittung = await screen.findByText(/Einsatz „Hochwasser Wardenburg" in den Papierkorb gelegt \(30 Tage rückholbar\)/);
    expect(einsaetzePapierkorb().map((e) => e.id)).toEqual([s.id]);
    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    expect(einsaetzeLaden().map((e) => e.id)).toEqual([s.id]);
    expect(screen.queryByText(/in den Papierkorb gelegt/)).toBeNull();
  });

  it("übergibt das Löschen aus der Einsatzansicht an die Startseite — einmal", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Übungslage Nord", EinsatzArt.UEBUNG);
    const detail = render(
      <>
        <EinsatzDetail
          einsatz={einsaetzeLaden()[0]!}
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
        />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    await nutzer.click(within(rueckfrage("Einsatz löschen?")).getByRole("button", { name: "In den Papierkorb" }));
    detail.unmount();
    const erste = liste();
    expect(screen.getByText(/Einsatz „Übungslage Nord" in den Papierkorb gelegt/)).toBeTruthy();
    expect(einsaetzePapierkorb().map((e) => e.id)).toEqual([s.id]);
    erste.unmount();
    // Beim nächsten Aufbau der Startseite nicht erneut.
    liste();
    expect(screen.queryByText(/in den Papierkorb gelegt/)).toBeNull();
  });
});

describe("Papierkorb der Vorlagen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function buehne() {
    const v = vorlageAnlegen("Bergungsgruppe Standard", neuerBogen());
    vorlageLoeschen(v.id);
    render(
      <>
        <VorlagenListe vorlagen={vorlagenLaden()} onMustern={() => {}} onBearbeiten={() => {}} onGeaendert={() => {}} />
        <Dialogschicht />
      </>,
    );
    return v;
  }

  it("löscht eine Vorlage endgültig, wenn die Rückfrage bejaht wird", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: /^Papierkorb \(1\)/ }));
    await nutzer.click(screen.getByRole("button", { name: "Endgültig löschen…" }));
    await nutzer.click(
      within(rueckfrage("Vorlage endgültig löschen?")).getByRole("button", { name: "Endgültig löschen" }),
    );

    expect(vorlagenPapierkorb()).toHaveLength(0);
    expect(vorlagenLaden()).toHaveLength(0);
  });

  it("behält die Vorlage im Papierkorb, wenn die Rückfrage abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    const v = buehne();

    await nutzer.click(screen.getByRole("button", { name: /^Papierkorb \(1\)/ }));
    await nutzer.click(screen.getByRole("button", { name: "Endgültig löschen…" }));
    await nutzer.click(within(rueckfrage("Vorlage endgültig löschen?")).getByRole("button", { name: "Abbrechen" }));

    expect(vorlagenPapierkorb().map((x) => x.id)).toEqual([v.id]);
  });
});
