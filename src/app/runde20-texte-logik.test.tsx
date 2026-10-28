/**
 * Runde 20, Block Texte und Logik: Ort „THW Oldenburg" ohne doppelte Organisation (H1, N1) samt „Ort der Einheit ändern…",
 * Zählung der Schnellerfassung (A2, W3, H3, K4, N3), ein Wort für das Alter der Angaben (A3), offene Wege im Kopf (K1, W2),
 * Legende der Rückrufnummer (K3), Fachwörter (N5), „Jetzt offline bereit" erst bei fertigem Laden (N7), Dateinamen (N8, G8),
 * Nummer in der Aufnahme-Quittung (H2), Vorschlag mit vollem Namen (S4).
 */
import { readFileSync } from "node:fs";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, PersonalErfassung, zeitpunktAusIso, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { ausgabeDateiname, einheitAnzeigename, neuerBogen } from "./hilfen";
import { ortOhneOrganisation } from "./ort-praefix";
import { schnellKopfzeile, SCHNELL_SCHRITTE } from "./schnell-zaehlung";
import { offenKurz } from "./einsatz-abschluss";
import { angabenAlterWort } from "./angaben-alter";
import { lageblattZeilenAlter } from "./lagemonitor";
import { verpflegungText } from "./auswertung";
import { offlineText } from "./offline-bereit";
import { einzelDateiname } from "./pdf";
import { SchrittEinheit } from "./schritte/einheit";
import { ovFreiHinweis } from "./schritte/einheit";
import { abschlussSetzen } from "./einsatz-abschluss";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
});

const SCHRITTE = ["Einheit", "Einsatz", "Personal", "Fahrzeuge", "Sofortbedarf", "Übersicht"];

function bogenMitOrt(ort: string, org: OrganisationsTyp = OrganisationsTyp.THW, aendern?: (b: Erfassungsbogen) => void): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.organisation = org;
  b.einheit.hierarchie[0]!.name = ort;
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

  it("Karte: „Ort der Einheit ändern…“ legt eine neue Fassung an, Nummer und Zug bleiben, Rückgängig stellt den Namen wieder her", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Ort", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitOrt("Oldenburgg"));
    meldungHinzufuegen(s.id, bogenMitOrt("Husum"));
    render(<Wirt id={s.id} />);
    const karte = () => [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes("Oldenburgg") || k.textContent!.includes("THW Oldenburg"))!;
    await nutzer.click(within(karte()).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte()).getByRole("button", { name: "Ort der Einheit ändern…" }));
    const dialog = await waitFor(() => {
      const d = document.querySelector<HTMLDialogElement>("dialog[aria-label='Ort der Einheit ändern']");
      expect(d).toBeTruthy();
      return d!;
    });
    const eingabe = within(dialog).getByLabelText("Ort der Einheit") as HTMLInputElement;
    expect(eingabe.value).toBe("Oldenburgg");
    await nutzer.clear(eingabe);
    await nutzer.type(eingabe, "THW Oldenburg");
    await nutzer.click(within(dialog).getByRole("button", { name: "Ort übernehmen" }));
    // Neuer Name an der Karte, ohne doppelte Organisation; Schlüssel (damit Nummer, Zug, Historie) bleibt.
    const eintraege = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const oldenburg = eintraege.filter((e) => e.einheitSchluessel === eintraege[0]!.einheitSchluessel);
    expect(oldenburg).toHaveLength(2);
    expect(einheitAnzeigename(oldenburg[oldenburg.length - 1]!.bogen.einheit)).toBe("THW Oldenburg");
    expect(document.body.textContent).toContain("Name geändert");
    expect(document.body.textContent).not.toContain("THW THW");
    expect([...document.querySelectorAll(".einheit-zeile")].some((k) => k.textContent!.includes("Oldenburgg"))).toBe(false);
    expect([...document.querySelectorAll(".einheit-zeile")].some((k) => k.textContent!.includes("Nr. 2 THW Oldenburg"))).toBe(true);
    expect(document.body.textContent).toContain("Ort der Einheit am Meldekopf geändert");
    // Rückgängig
    const quittung = screen.getAllByRole("status").find((q) => q.textContent!.includes("Name geändert"))!;
    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    const danach = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    expect(danach).toHaveLength(2);
    expect(danach.map((e) => e.bogen.einheit.hierarchie[0]!.name).sort()).toEqual(["Husum", "Oldenburgg"]);
  }, 20000);
});

describe("R20-A2 / W3 / H3 / K4 / N3: Zählung der Schnellerfassung", () => {
  it("zählt nur die vier gezeigten Schritte und nennt die echten Namen", () => {
    expect(SCHNELL_SCHRITTE).toEqual([0, 2, 3, 5]);
    expect([0, 2, 3, 5].map((i) => schnellKopfzeile(i, SCHRITTE))).toEqual([
      "Schritt 1 von 4: Einheit",
      "Schritt 2 von 4: Personal",
      "Schritt 3 von 4: Fahrzeuge",
      "Schritt 4 von 4: Übersicht",
    ]);
  });

  it("auf einem entfallenden Schritt (nur über die Reiter erreichbar) steht ein Satz statt einer Zahlenliste", () => {
    const t = schnellKopfzeile(1, SCHRITTE);
    expect(t).toBe("Einsatz entfällt in der Schnellerfassung – weiter mit Personal");
    expect(t).not.toMatch(/\d/);
    expect(schnellKopfzeile(4, SCHRITTE)).toMatch(/^Sofortbedarf entfällt/);
  });
});

describe("R20-A3: ein Wort für das Alter der Angaben", () => {
  it("angabenAlterWort sagt immer „Stand“, auch wenn der Bogen erst kurz vor dem Eingang entstand", () => {
    const jetzt = Date.now();
    const b = neuerBogen();
    expect(angabenAlterWort({ empfangenAm: jetzt, bogen: { stand: b.stand } })).toBe("Stand");
    expect(angabenAlterWort({ empfangenAm: jetzt + 3 * 3_600_000, bogen: { stand: b.stand } })).toBe("Stand");
  });

  it("das Lageblatt schreibt „⚠ Stand vor …“ (kein „Meldung vor …“)", () => {
    const jetzt = 1_800_000_000_000;
    expect(lageblattZeilenAlter(jetzt - 401 * 60_000, jetzt)).toBe("⚠ Stand vor 6 Std 41 Min");
  });
});

describe("R20-K1 / W2: der Kopf nach „Einsatz beendet“ nennt, was offen ist", () => {
  it("offenKurz: bis zwei Namen ganz, darüber „und n weitere“", () => {
    expect(offenKurz([])).toBe("");
    expect(offenKurz(["Datensicherung"])).toBe("Datensicherung");
    expect(offenKurz(["Lageblatt", "Datensicherung"])).toBe("Lageblatt und Datensicherung");
    expect(offenKurz(["A", "B", "C"])).toBe("A, B und 1 weitere");
    expect(offenKurz(["A", "B", "C", "D", "E", "F"])).toBe("A, B und 4 weitere");
  });

  it("Kopf: „noch offen: Weitergabe-Datei (Sammel-PDF), Lageblatt und 4 weitere“ statt „noch offen: 6“", () => {
    const s = einsatzAnlegen("Hochwasser Kopf", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitOrt("Alpha"));
    abschlussSetzen(s.id, { beendetAm: Date.now() }, [s.id]);
    render(<Wirt id={s.id} />);
    const kopf = document.querySelector(".einsatz-beendet-kopf")!.textContent!;
    expect(kopf).toMatch(/noch offen: Weitergabe-Datei \(Sammel-PDF\), Lageblatt und 4 weitere/);
    expect(kopf).not.toMatch(/noch offen: \d/);
  });
});

describe("R20-K3: Rückrufnummer des Ortsverbands ist gekennzeichnet", () => {
  it("die Legende des Lageblatts erklärt (OV), die Details beschriften Telefon und E-Mail der Dienststelle", async () => {
    const quelle = readFileSync(`${process.cwd()}/src/app/pdf-dokument.ts`, "utf8");
    expect(quelle).toContain("(OV) Nummer des Ortsverbands – die Einheit selbst hat keine gemeldet.");
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Details", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitOrt("Albstadt", OrganisationsTyp.THW, (b) => {
      b.einheit.hierarchie[0]!.telefon = "07432984190";
      b.einheit.hierarchie[0]!.email = "OV-Albstadt@thw.de";
    }));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Details" }));
    const t = document.querySelector(".bogen-details")!.textContent!;
    expect(t).toContain("Telefon der Dienststelle: 07432984190");
    expect(t).toContain("E-Mail der Dienststelle: OV-Albstadt@thw.de");
  });
});

describe("R20-N5: Fachwörter erklärt", () => {
  it("Verpflegung: ein Satz mit Personen vor Ort, kein „angefordert 0 (Stärke 7)“", () => {
    const sum = (angefordert: number, gesamt: number) => ({ verpflegungAngefordert: angefordert, verpflegung: { gesamt } }) as never;
    expect(verpflegungText(sum(0, 7))).toBe("Verpflegung: keine angefordert (7 Personen vor Ort)");
    expect(verpflegungText(sum(3, 7))).toBe("Verpflegung: 3 angefordert (7 Personen vor Ort)");
    expect(verpflegungText(sum(7, 7))).toBe("Verpflegung 7");
  });

  it("Tabelle erklärt „zählend“, Zug-Zuordnung erklärt „Zug“", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Wörter", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitOrt("Alpha"));
    meldungHinzufuegen(s.id, bogenMitOrt("Beta"));
    const eintrag = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege[0]!;
    render(<Wirt id={s.id} extra={{ eingang: { schluessel: eintrag.einheitSchluessel, nonce: 5 } }} />);
    expect(document.body.textContent).toContain("Ein Zug fasst Einheiten unter einer Führung zusammen.");
    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));
    expect(document.body.textContent).toContain("Summe „zählend“ = anwesend, ohne Übung und ohne abgerückte.");
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

  it("Karten-PDF: Zeitpunkt der Erzeugung vorn, Stand des Bogens dahinter", () => {
    const b = bogenMitOrt("Albstadt");
    b.stand = zeitpunktAusIso("2026-07-17T08:05");
    const name = einzelDateiname(b, new Date(2026, 9, 28, 7, 54));
    expect(name).toMatch(/^2026-10-28_0754_eeb_.*Albstadt.*_Stand_2026-07-17_0805\.pdf$/);
    // Zwei Stände derselben Einheit bleiben unterscheidbar (R17-A2).
    const b2 = { ...b, stand: b.stand + 95 };
    expect(einzelDateiname(b2, new Date(2026, 9, 28, 7, 54))).not.toBe(name);
  });
});

describe("R20-H2: die Nummer steht in der Aufnahme-Quittung", () => {
  it("„Zuletzt abgelegt: Nr. 1 …“ samt Hinweis, sie auf den Zettel zu schreiben", () => {
    const s = einsatzAnlegen("Hochwasser Nr", EinsatzArt.EINSATZ);
    const e = meldungHinzufuegen(s.id, bogenMitOrt("Husum"));
    const eintrag = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege[0]!;
    expect(e).toBeDefined();
    render(<Wirt id={s.id} extra={{ eingang: { schluessel: eintrag.einheitSchluessel, nonce: 41 } }} />);
    const q = document.querySelector(".eingang-quittung")!.textContent!;
    expect(q).toMatch(/Zuletzt (abgelegt|eingelesen): Nr\. 1 „THW Husum/);
  });
});

describe("R20-S4: der Ortsvorschlag nennt seinen vollen Namen", () => {
  it("„Flensburg“ meint vielleicht OV Flensburg (OFLE)", () => {
    const ov = (name: string, kurz: string) => ({ name, kurz, ort: name, plz: "1" }) as never;
    expect(ovFreiHinweis("Flensburg", [ov("Flensburg", "OFLE")])).toContain("„Flensburg\" meint vielleicht OV Flensburg (OFLE)");
    expect(ovFreiHinweis("Ulm", [ov("Ulm", "OULM"), ov("Neu-Ulm", "ONUL")])).toContain("OV Ulm (OULM), OV Neu-Ulm (ONUL)");
  });
});
