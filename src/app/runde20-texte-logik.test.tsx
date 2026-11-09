/**
 * Runde 20, Block Texte und Logik: Ort „THW Oldenburg" ohne doppelte Organisation (H1, N1) samt „Ort der Einheit ändern…",
 * Zählung der Schnellerfassung (A2, W3, H3, K4, N3), ein Wort für das Alter der Angaben (A3), offene Wege im Kopf (K1, W2),
 * Legende der Rückrufnummer (K3), Fachwörter (N5), „Jetzt offline bereit" erst bei fertigem Laden (N7), Dateinamen (N8, G8),
 * Nummer in der Aufnahme-Quittung (H2), Vorschlag mit vollem Namen (S4).
 */
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import { ausgabeDateiname, einheitAnzeigename, neuerBogen } from "./hilfen";
import { ortOhneOrganisation } from "./ort-praefix";
import { offlineText } from "./offline-bereit";
import { SchrittEinheit } from "./schritte/einheit";
import { ovFreiHinweis } from "./schritte/einheit";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
});


function bogenMitOrt(ort: string, org: OrganisationsTyp = OrganisationsTyp.THW, aendern?: (b: Erfassungsbogen) => void): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.organisation = org;
  b.einheit.hierarchie[0]!.name = ort;
  aendern?.(b);
  return b;
}

describe("R20-H1 / N1: Organisation steht nicht doppelt im Namen", () => {
  it("einheitAnzeigename: „THW Oldenburg“ als Ort bleibt „THW Oldenburg“ – bei mehreren Organisationen", () => {
    const name = (org: OrganisationsTyp, ort: string, typ = "Bergungsgruppe", orgName?: string) => {
      const b = bogenMitOrt(ort, org, (x) => {
        x.einheit.einheitsTyp = { freitext: typ };
        if (orgName) x.einheit.organisationName = orgName;
      });
      return einheitAnzeigename(b.einheit);
    };
    expect(name(OrganisationsTyp.THW, "THW Oldenburg")).toBe("THW Oldenburg Bergungsgruppe");
    expect(name(OrganisationsTyp.THW, "Oldenburg")).toBe("THW Oldenburg Bergungsgruppe");
    expect(name(OrganisationsTyp.THW, "thw oldenburg")).toBe("thw oldenburg Bergungsgruppe");
    expect(name(OrganisationsTyp.FEUERWEHR, "Feuerwehr Wardenburg", "Löschzug")).toBe("Feuerwehr Wardenburg Löschzug");
    expect(name(OrganisationsTyp.FEUERWEHR, "Wardenburg", "Löschzug")).toBe("Feuerwehr Wardenburg Löschzug");
    expect(name(OrganisationsTyp.DRK, "DRK Oldenburg", "SEG Sanität")).toBe("DRK Oldenburg SEG Sanität");
    expect(name(OrganisationsTyp.DRK, "Oldenburg", "SEG Sanität")).toBe("DRK Oldenburg SEG Sanität");
    // Bisheriges Verhalten bleibt: Ort schon im Organisationsnamen, Wortteile zählen nicht.
    expect(name(OrganisationsTyp.SONSTIGE, "Buchenrode", "Behandlung", "DRK-Kreisverband Buchenrode e. V.")).toBe("DRK-Kreisverband Buchenrode e. V. Behandlung");
    expect(name(OrganisationsTyp.THW, "THWalde", "Gruppe")).toBe("THW THWalde Gruppe");
  });

  it("ortOhneOrganisation nimmt nur eine führende Organisation weg", () => {
    expect(ortOhneOrganisation("THW Oldenburg", "THW")).toBe("Oldenburg");
    expect(ortOhneOrganisation("THW-Oldenburg", "THW")).toBe("Oldenburg");
    expect(ortOhneOrganisation("  thw Oldenburg ", "THW")).toBe("Oldenburg");
    expect(ortOhneOrganisation("THW", "THW")).toBe("THW");
    expect(ortOhneOrganisation("THWalde", "THW")).toBe("THWalde");
    expect(ortOhneOrganisation("Oldenburg THW", "THW")).toBe("Oldenburg THW");
    expect(ortOhneOrganisation("Oldenburg", "")).toBe("Oldenburg");
  });

  it("Schnellerfassung: „THW Oldenburg“ im Ortsfeld wird beim Verlassen zu „Oldenburg“, der Anzeigename bleibt „THW Oldenburg“", async () => {
    const nutzer = userEvent.setup();
    function Buehne() {
      const [b, setB] = useState<Erfassungsbogen>({ ...neuerBogen(), personalErfassung: PersonalErfassung.NUR_STAERKE });
      return <SchrittEinheit bogen={b} aendern={(teil) => setB((alt) => ({ ...alt, ...teil }))} />;
    }
    render(<Buehne />);
    const feld = document.querySelector<HTMLInputElement>("#feld-einheit-name")!;
    await nutzer.type(feld, "THW Oldenburg");
    expect(feld.value).toBe("THW Oldenburg");
    await nutzer.tab();
    expect(feld.value).toBe("Oldenburg");
    expect(document.body.textContent).toContain("THW Oldenburg");
    expect(document.body.textContent).not.toContain("THW THW");
  });
});

describe("R20-N7: „Jetzt offline bereit“ erst, wenn alles geladen ist", () => {
  it("während das Nachladen läuft, steht der Kern getrennt vom Rest", () => {
    const laeuft = offlineText({ stand: "bereit", frischBereit: true, online: true, zweiStufen: true, zusatz: { fertig: 212, gesamt: 549 } });
    expect(laeuft).toMatch(/^✓ Bogen, PDF, QR-Code und Empfang gehen offline\. Rest lädt noch \(Beispielbögen, Themenseiten\): 212 von 549/);
    expect(laeuft).not.toContain("Jetzt offline bereit");
    const gezaehlt = offlineText({ stand: "bereit", frischBereit: true, online: true, zweiStufen: true });
    expect(gezaehlt).not.toContain("Jetzt offline bereit");
  });

  it("nach dem Laden steht „Jetzt offline bereit“", () => {
    expect(offlineText({ stand: "bereit", frischBereit: true, online: true, zweiStufen: true, zusatz: { fertig: 549, gesamt: 549 } })).toMatch(/^✓ Jetzt offline bereit/);
  });
});

describe("R20-N8 / G8: Dateinamen", () => {
  it("Sammel-PDF und Übersicht-CSV unterscheiden sich im Namen, nicht nur in der Endung", () => {
    const d = new Date(2026, 9, 28, 6, 43);
    const pdf = ausgabeDateiname("einsatz-sammel-pdf", "Hochwasser_Elbe", "pdf", d);
    const csv = ausgabeDateiname("einsatz-uebersicht", "Hochwasser_Elbe", "csv", d);
    expect(pdf).toBe("2026-10-28_0643_eeb-einsatz-sammel-pdf_Hochwasser_Elbe.pdf");
    expect(csv).toBe("2026-10-28_0643_eeb-einsatz-uebersicht_Hochwasser_Elbe.csv");
    expect(pdf.replace(/\.pdf$/, "")).not.toBe(csv.replace(/\.csv$/, ""));
  });
});

describe("R20-S4: der Ortsvorschlag nennt seinen vollen Namen", () => {
  it("„Flensburg“ meint vielleicht OV Flensburg (OFLE)", () => {
    const ov = (name: string, kurz: string) => ({ name, kurz, ort: name, plz: "1" }) as never;
    expect(ovFreiHinweis("Flensburg", [ov("Flensburg", "OFLE")])).toContain("„Flensburg\" meint vielleicht OV Flensburg (OFLE)");
    expect(ovFreiHinweis("Ulm", [ov("Ulm", "OULM"), ov("Neu-Ulm", "ONUL")])).toContain("OV Ulm (OULM), OV Neu-Ulm (ONUL)");
  });
});
