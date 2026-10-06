/**
 * Schritt 1 — Einheit. Geprüft wird das, was hier Daten verändert: der
 * Organisationswechsel, die OV-Vorschlagsliste (samt mitgeführter Struktur)
 * und die Sichtbarkeit der Landesvorlagen.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Dialogschicht } from "../dialoge";
import { neuePerson, neuerBogen, vokabularFuer } from "../hilfen";
import { Ernaehrung, Geschlecht, OrganisationsTyp, PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import { stanPersonalVorbelegung } from "@bos/vokabulare/thw-stan-personal";
import { stanFahrzeugVorbelegung } from "@bos/vokabulare/thw-stan-fahrzeuge";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { SchrittEinheit } from "./einheit";

const buehne = () => render(<SchrittBuehne komponente={SchrittEinheit} />);

/**
 * Bühne mit Ableseleiste: Schritt 1 zeigt Personal und Fahrzeuge nicht an, eine
 * Landesvorlage ersetzt aber genau die. Damit der Test die Wirkung sehen kann,
 * was der Schritt über `aendern` hinausschreibt, steht es hier als Text daneben
 * — beobachtet wird also die Außenkante der Komponente, nicht ihr Inneres.
 */
function VorlagenBuehne({ start }: { start: Erfassungsbogen }) {
  const [bogen, setBogen] = useState(start);
  return (
    <>
      <SchrittEinheit bogen={bogen} aendern={(patch) => setBogen((b) => ({ ...b, ...patch }))} />
      <p>
        Personal: <output>{bogen.personal.map((p) => p.nachname || "—").join(", ") || "leer"}</output>
        {" · "}Fahrzeuge: <output>{bogen.fahrzeuge.length}</output>
      </p>
      <Dialogschicht />
    </>
  );
}

/** Bogen mit einer benannten Person — sie macht sichtbar, ob ersetzt wurde. */
function bogenMitPerson(): Erfassungsbogen {
  const b = neuerBogen();
  b.personal = [{ ...neuePerson(), vorname: "Thomas", nachname: "Lange" }];
  return b;
}

/** Erste echte Auswahlmöglichkeit einer Liste (die erste ist der Platzhalter). */
function ersteWahl(feld: HTMLSelectElement): string {
  return [...feld.options].map((o) => o.value).find((v) => v !== "")!;
}

describe("Schritt Einheit", () => {
  // Die Landesvorlagen ziehen über ihren eager-Glob sämtliche Beispielbögen
  // herein (~300 KB); sie erst im Test zu laden hieße, deren Auflösung in die
  // Wartezeit einer Zusicherung zu legen — unter paralleler Last reicht die
  // Vorgabe von 1 s dafür nicht. Hier vorab geladen, ist das Modul beim Rendern
  // im Cache und der Nachlade-Effekt der Komponente ist sofort fertig.
  beforeAll(async () => {
    await import("../../vokabulare/landesvorlagen");
  });

  it("zeigt das Kürzelfeld nur beim THW", async () => {
    const nutzer = userEvent.setup();
    buehne();

    expect(screen.getByLabelText("Dienststellen-Kürzel (optional)")).toBeDefined();

    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");

    expect(screen.queryByLabelText("Dienststellen-Kürzel (optional)")).toBeNull();
  });

  it("übernimmt einen Ortsverband aus der Vorschlagsliste mit Kontakt und Struktur", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Oldenburg");

    // Die OV-Liste lädt asynchron nach (dynamischer Import) — auf einer kalten
    // Maschine steht sie beim Tippen noch nicht, daher warten statt zugreifen.
    const treffer = await screen.findByText(
      (_text, el) => el?.tagName === "LI" && el.textContent?.startsWith("Oldenburg (NI)") === true,
      undefined,
      { timeout: 5000 }, // 220 kB OV-Daten: ein kalter CI-Runner braucht länger als die Vorgabe von 1 s
    );
    await nutzer.click(treffer);

    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("Oldenburg (NI)");
    expect((screen.getAllByLabelText("Dienststellen-Kürzel (optional)")[0] as HTMLInputElement).value).toBe("OODE");
    // Ziffern only — die Eingabe filtert Trenn- und Leerzeichen heraus.
    expect((screen.getAllByLabelText("Telefon")[0] as HTMLInputElement).value).toBe("04413401050");

    // Regionalstelle und Landesverband kommen als eigene Ebenen dazu — je mit
    // ihrem offiziellen Kürzel aus der Organisationskennzeichnung.
    const namen = screen.getAllByLabelText("Name") as HTMLInputElement[];
    expect(namen.map((f) => f.value)).toEqual(["Oldenburg", "Bremen, Niedersachsen"]);
    const kuerzel = screen.getAllByLabelText("Dienststellen-Kürzel (optional)") as HTMLInputElement[];
    expect(kuerzel.map((f) => f.value)).toEqual(["OODE", "GOLD", "LVNI"]);
  });

  // Audit Runde 3, R3-S4: Beim Verlassen des Felds wurde „Neustadt" still zu
  // Neustadt (Holstein) aufgelöst — samt Kürzel und Telefon, obwohl es drei
  // Ortsverbände gibt, deren Name so beginnt.
  it("löst beim Verlassen nur eindeutige Namen auf, keinen mehrdeutigen", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Neustadt");
    await screen.findByText((_t, el) => el?.tagName === "LI" && el.textContent?.startsWith("Neustadt an der Aisch") === true, undefined, { timeout: 5000 });
    await nutzer.tab();
    expect((screen.getAllByLabelText("Dienststellen-Kürzel (optional)")[0] as HTMLInputElement).value).toBe("");

    // Das Kürzel bleibt eindeutig und wird weiter aufgelöst.
    await nutzer.clear(screen.getByLabelText("Name (Pflicht)"));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "OODE");
    await nutzer.tab();
    expect((screen.getAllByLabelText("Dienststellen-Kürzel (optional)") as HTMLInputElement[]).map((f) => f.value)).toContain("OODE");
  });

  it("sagt an, was ein eindeutiger Name beim Verlassen ergänzt, und nimmt es auf Wunsch zurück (R3-S4)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Ulm");
    await screen.findByText((_t, el) => el?.tagName === "LI" && el.textContent?.startsWith("Ulm") === true, undefined, { timeout: 5000 });
    await nutzer.tab();
    const kuerzel = () => (screen.getAllByLabelText("Dienststellen-Kürzel (optional)") as HTMLInputElement[]).map((f) => f.value);
    expect(kuerzel()).toContain("OULM");
    const hinweis = document.querySelector<HTMLElement>(".ov-ergaenzt")!;
    expect(hinweis.textContent).toMatch(/^Aus dem OV-Verzeichnis ergänzt: Ulm \(OULM\) mit Telefon und E-Mail/);

    await nutzer.click(within(hinweis).getByRole("button", { name: "Rückgängig" }));
    expect(kuerzel()).toEqual([""]);
    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("Ulm");
    expect(document.querySelector(".ov-ergaenzt")).toBeNull();
  });

  // Audit Runde 4, R4-H1: Wer „Bergungsgruppe" ausschreibt und „ulm" klein tippt,
  // behielt Freitext ohne Typ-Code und ohne Kürzel — bei grünem Haken.
  it("löst einen ausgeschriebenen Einheitstyp und einen kleingeschriebenen OV beim Verlassen auf (R4-H1)", async () => {
    const nutzer = userEvent.setup();
    const bogenStand: { b: Erfassungsbogen | null } = { b: null };
    function Ablesen() {
      const [bogen, setBogen] = useState(neuerBogen());
      bogenStand.b = bogen;
      return <SchrittEinheit bogen={bogen} aendern={(patch) => setBogen((b) => ({ ...b, ...patch }))} />;
    }
    render(<Ablesen />);

    await nutzer.type(screen.getByRole("combobox", { name: "Einheitstyp" }), "Bergungsgruppe");
    await nutzer.tab();
    expect(bogenStand.b!.einheit.einheitsTyp.code).toBeDefined();
    expect(bogenStand.b!.einheit.einheitsTyp.freitext).toBeUndefined();

    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "ulm");
    await screen.findByText((_t, el) => el?.tagName === "LI" && el.textContent?.startsWith("Ulm") === true, undefined, { timeout: 5000 });
    await nutzer.tab();
    expect(bogenStand.b!.einheit.hierarchie[0]!.kurz).toBe("OULM");
  });

  it("sagt nach dem Verlassen, dass ein Freitext-Einheitstyp nicht aus der Liste ist, und schweigt beim Tippen (R4-H1)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    const feld = screen.getByRole("combobox", { name: "Einheitstyp" });
    await nutzer.type(feld, "Berg");
    expect(document.querySelector(".freitext-hinweis")).toBeNull();

    await nutzer.tab();

    const hinweis = document.querySelector<HTMLElement>(".freitext-hinweis")!;
    expect(hinweis.textContent).toMatch(/^„Berg" ist nicht aus der Liste — Vorschlag antippen oder als eigener Typ behalten/);
    // Ein gewählter Typ trägt keinen Hinweis.
    await nutzer.clear(feld);
    await nutzer.type(feld, "Bergungsgruppe");
    await nutzer.tab();
    expect(document.querySelector(".freitext-hinweis")).toBeNull();
  });

  it("sagt für einen OV-Namen ohne Verzeichnis-Treffer, dass Kürzel und Kontakt fehlen (R4-H1)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Xyzstadt");
    await nutzer.tab();
    await screen.findByText(/ist nicht im OV-Verzeichnis/, undefined, { timeout: 5000 });
    expect(document.querySelector(".ov-frei-hinweis")!.textContent).toContain("„Xyzstadt\"");
  }, 15000);

  it("zeigt beim Antippen des Einheitstyps die ganze Liste, nicht nur die ersten acht", async () => {
    const nutzer = userEvent.setup();
    buehne();

    const feld = screen.getByRole("combobox", { name: "Einheitstyp" });
    await nutzer.click(feld);

    const alle = vokabularFuer(neuerBogen().einheit.organisation, "einheitstyp");
    expect(alle.length).toBeGreaterThan(8);
    const zeilen = within(screen.getByRole("listbox", { name: "Vorschläge zu Einheitstyp" })).getAllByRole("option");
    expect(zeilen.length).toBe(alle.length);
    // Die Liste bleibt beim Tippen vollständig: alle Fachgruppen, nicht acht.
    await nutzer.type(feld, "FGr");
    const fgr = alle.filter((t) => t.kurz.toLowerCase().includes("fgr") || t.name.toLowerCase().includes("fgr"));
    expect(fgr.length).toBeGreaterThan(8);
    expect(within(screen.getByRole("listbox", { name: "Vorschläge zu Einheitstyp" })).getAllByRole("option").length).toBe(fgr.length);
  });

  it("bildet den Anzeigenamen aus Organisation, Einheitstyp und Ebenenname", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Musterhausen");

    expect(screen.getByText("THW Musterhausen")).toBeDefined();
  });

  it("bietet Landesvorlagen erst für Organisationen ohne eigene Vorbelegung an", async () => {
    const nutzer = userEvent.setup();
    buehne();

    // THW hat die code-basierte StAN-Vorbelegung — keine Landesvorlagen.
    expect(screen.queryByLabelText("Landesvorlage – Bundesland")).toBeNull();

    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");

    // findBy…: das Landesvorlagen-Datenpaket lädt asynchron nach (dynamischer
    // Import). Das Modul ist vorgewärmt (siehe beforeAll); die großzügige Frist
    // deckt nur noch das Rendern auf einer ausgelasteten Maschine ab.
    const bundesland = await screen.findByLabelText("Landesvorlage – Bundesland", undefined, {
      timeout: 5000,
    });
    expect(bundesland).toBeDefined();
    // Ohne gewähltes Bundesland bleibt die Einheitenauswahl gesperrt.
    expect((screen.getByLabelText("Landesvorlage – Einheit") as HTMLSelectElement).disabled).toBe(true);
  });

  it("fügt Ebenen hinzu und entfernt sie wieder — die unterste bleibt", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ übergeordnete Ebene" }));
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(2);

    // Eine leere Ebene geht ohne Rückfrage (Rückfrage-Regel).
    await nutzer.click(screen.getByRole("button", { name: /^Ebene .* entfernen$/ }));
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(1);
  });

  it("belegt beim Hinzufügen die jeweils nächsthöhere Ebene vor", async () => {
    const nutzer = userEvent.setup();
    buehne();

    // THW startet mit dem OV (Code 1); hinzugefügte Ebenen steigen auf RB und LV.
    expect((screen.getByLabelText("Ebene (eigene Einheit)") as HTMLSelectElement).value).toBe("1");
    await nutzer.click(screen.getByRole("button", { name: "+ übergeordnete Ebene" }));
    await nutzer.click(screen.getByRole("button", { name: "+ übergeordnete Ebene" }));

    const uebergeordnet = screen.getAllByLabelText("Ebene (übergeordnet)") as HTMLSelectElement[];
    expect(uebergeordnet.map((s) => s.value)).toEqual(["2", "3"]);
  });

  it("bietet auch der Feuerwehr eine Ebenen-Leiter an — Gemeinde zuerst", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");

    const eigene = screen.getByLabelText("Ebene (eigene Einheit)") as HTMLSelectElement;
    expect(eigene.value).toBe("1");
    expect(eigene.selectedOptions[0]?.textContent).toContain("Gemeinde/Stadt");

    await nutzer.click(screen.getByRole("button", { name: "+ übergeordnete Ebene" }));
    const naechste = screen.getByLabelText("Ebene (übergeordnet)") as HTMLSelectElement;
    expect(naechste.selectedOptions[0]?.textContent).toContain("Landkreis");
  });

  /**
   * Eine Landesvorlage wirft Personal und Fahrzeuge weg — deshalb die Rückfrage,
   * sobald im Bogen schon etwas steht. Beide Richtungen müssen halten: Ohne
   * Bestätigung darf nichts verloren gehen, mit Bestätigung muss die Vorlage
   * wirklich ankommen (und nicht bloß der Dialog zugehen).
   */
  async function landesvorlageWaehlen(nutzer: ReturnType<typeof userEvent.setup>) {
    render(<VorlagenBuehne start={bogenMitPerson()} />);
    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");

    const bundesland = (await screen.findByLabelText("Landesvorlage – Bundesland", undefined, {
      timeout: 5000,
    })) as HTMLSelectElement;
    await nutzer.selectOptions(bundesland, ersteWahl(bundesland));

    const einheit = screen.getByLabelText("Landesvorlage – Einheit") as HTMLSelectElement;
    await nutzer.selectOptions(einheit, ersteWahl(einheit));

    return document.querySelector<HTMLDialogElement>("dialog[aria-label='Landesvorlage anwenden?']")!;
  }

  it("ersetzt Personal und Fahrzeuge durch die Landesvorlage — nach Bestätigung", async () => {
    const nutzer = userEvent.setup();
    const dialog = await landesvorlageWaehlen(nutzer);

    await nutzer.click(within(dialog).getByRole("button", { name: "Ersetzen" }));

    // Thomas Lange ist weg, und an seiner Stelle steht die Vorlage.
    const personal = screen.getByText(/Personal:/);
    expect(personal.textContent).not.toContain("Lange");
    expect(personal.textContent).not.toContain("leer");
  });

  it("lässt bei „Abbrechen“ Personal und Fahrzeuge unangetastet", async () => {
    const nutzer = userEvent.setup();
    const dialog = await landesvorlageWaehlen(nutzer);

    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect(screen.getByText(/Personal:/).textContent).toContain("Lange");
  });
});

/**
 * „Name (Pflicht)" war keine Pflicht: Mit leerem Feld führte „Weiter" ohne ein
 * Wort auf Schritt 2, und die einzige Rückmeldung war ein „•" statt „✓" in der
 * Schrittleiste — ein Zeichen, dessen Bedeutung nirgends erklärt wird. Der
 * Fehler fiel erst fünf Schritte später in der Übersicht auf, als
 * „(Standort offen)" auf dem Bogen. Gesperrt wird weiterhin nichts: wer den
 * OV-Namen gerade nicht weiß, kommt weiter und trägt ihn nach.
 */
describe("Schritt Einheit — Beispiel im Einheitstyp (R3-H7)", () => {
  it("nennt beim THW THW-Einheiten statt „Löschzug, SEG Sanität“", () => {
    buehne();
    const feld = screen.getByRole("combobox", { name: "Einheitstyp" }) as HTMLInputElement;
    expect(feld.placeholder).toBe("z. B. Bergungsgruppe, FGr Wasserschaden/Pumpen");
  });

  it("nennt bei der Feuerwehr Feuerwehr-Einheiten", () => {
    const start = neuerBogen();
    start.einheit.organisation = OrganisationsTyp.FEUERWEHR;
    render(<SchrittBuehne komponente={SchrittEinheit} bogen={start} />);
    // Kurze Listen kommen als Auswahl, der Platzhalter ist dann die erste Zeile.
    const feld = screen.getByLabelText("Einheitstyp") as HTMLInputElement | HTMLSelectElement;
    const beispiel = feld instanceof HTMLSelectElement ? feld.options[0]!.text : feld.placeholder;
    expect(beispiel).toContain("z. B. Löschzug, Löschgruppe");
  });
});

describe("Schritt Einheit — offene Pflichtangaben", () => {
  it("nennt den fehlenden Namen der eigenen Einheit schon auf Schritt 1", () => {
    render(<SchrittEinheit bogen={neuerBogen()} aendern={() => {}} />);

    expect(screen.getByText(/Name der eigenen Einheit .* fehlt/)).toBeDefined();
  });

  it("nimmt den Hinweis zurück, sobald der Name steht", () => {
    const bogen = neuerBogen();
    render(
      <SchrittEinheit
        bogen={{ ...bogen, einheit: { ...bogen.einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "Oldenburg" }] } }}
        aendern={() => {}}
      />,
    );

    expect(screen.queryByText(/Name der eigenen Einheit .* fehlt/)).toBeNull();
  });

  /**
   * Die Kontaktstellen tragen die Nummer, über die der Meldekopf zurückfragt.
   * Ohne inputMode lag der Ziffernblock hinter einer Tastatur-Umschaltung.
   */
  it("öffnet für Telefon und E-Mail die passende Tastatur", () => {
    render(<SchrittEinheit bogen={neuerBogen()} aendern={() => {}} />);

    expect(screen.getByLabelText("Telefon")).toHaveProperty("inputMode", "tel");
    expect(screen.getByLabelText("E-Mail")).toHaveProperty("inputMode", "email");
  });

  /**
   * Audit Runde 2, R2-M6: `autocomplete="tel"/"email"` meint die EIGENEN Daten
   * des Gerätebesitzers — das Telefon bot für die OV-Rufnummer die private
   * Handynummer an. Das Kürzel ist eine Kennung: Großbuchstaben, keine
   * Autokorrektur, keine Rechtschreibprüfung.
   */
  it("bietet für Dienststellenkontakte kein Autofill der eigenen Kontaktkarte an, das Kürzel ohne Autokorrektur", () => {
    render(<SchrittEinheit bogen={neuerBogen()} aendern={() => {}} />);

    expect(screen.getByLabelText("Telefon").getAttribute("autocomplete")).toBe("off");
    expect(screen.getByLabelText("E-Mail").getAttribute("autocomplete")).toBe("off");
    const kuerzel = screen.getByLabelText("Dienststellen-Kürzel (optional)");
    expect(kuerzel.getAttribute("autocapitalize")).toBe("characters");
    expect(kuerzel.getAttribute("autocorrect")).toBe("off");
    expect(kuerzel.getAttribute("spellcheck")).toBe("false");
  });

  /**
   * Der Schnell-Einstieg der Startseite landet in genau diesem Assistenten —
   * sechs Schritte, dieselbe Überschrift. Dass nur Stärke gemeint ist, stand
   * vorher erst auf Schritt 3.
   */
  it("benennt die Schnellerfassung auf Schritt 1", () => {
    const bogen = neuerBogen();
    render(
      <SchrittEinheit
        bogen={{ ...bogen, personalErfassung: PersonalErfassung.NUR_STAERKE }}
        aendern={() => {}}
      />,
    );

    expect(screen.getByText(/^Schnellerfassung:/)).toBeDefined();
  });
});

/**
 * Die Wahl des Einheitstyps legt die StAN-Sollplätze und -Fahrzeuge still an
 * — und ein Wechsel auf den richtigen Typ ließ sie vorher stehen: Der Bogen
 * meldete die Summe beider Vorbelegungen, in der Größenordnung einer ganzen
 * Gruppe. Jetzt folgt die unbenannte Vorbelegung dem Typ, wird auf Schritt 1
 * angesagt und lässt sich dort wieder entfernen; Benanntes bleibt.
 */
describe("Schritt Einheit — Vorbelegung nach Einheitstyp", () => {
  /** Bühne mit Ableseleiste für Personal und Fahrzeuge (Schritt 1 zeigt beides sonst nicht). */
  function VorbelegungBuehne({ start }: { start: Erfassungsbogen }) {
    const [bogen, setBogen] = useState(start);
    return (
      <>
        <SchrittEinheit bogen={bogen} aendern={(patch) => setBogen((b) => ({ ...b, ...patch }))} />
        <p>
          Personal: <output data-testid="personal">{bogen.personal.length}</output>
          {" · "}Namen: <output data-testid="namen">{bogen.personal.map((p) => p.nachname).filter(Boolean).join(", ") || "keine"}</output>
          {" · "}Fahrzeuge: <output data-testid="fahrzeuge">{bogen.fahrzeuge.length}</output>
          {" · "}Kennzeichen: <output data-testid="kennzeichen">{bogen.fahrzeuge.map((f) => f.kennzeichen).filter(Boolean).join(", ") || "keine"}</output>
        </p>
        <Dialogschicht />
      </>
    );
  }

  const gross = { code: 7, name: "Fachgruppe Räumen (B)" }; // StAN 9 Personen, 4 Fahrzeuge
  const klein = { code: 3, name: "Zugtrupp Technischer Zug" }; // StAN 4 Personen, 1 Fahrzeug
  const org = OrganisationsTyp.THW;
  const personen = (code: number) => stanPersonalVorbelegung(org, { code }).length;
  const fahrzeuge = (code: number) => stanFahrzeugVorbelegung(org, { code }).length;
  const zahl = (id: string) => Number(screen.getByTestId(id).textContent);

  async function typWaehlen(nutzer: ReturnType<typeof userEvent.setup>, name: string) {
    const feld = screen.getByRole("combobox", { name: "Einheitstyp" });
    await nutzer.clear(feld);
    await nutzer.type(feld, name);
    const liste = screen.getByRole("listbox", { name: "Vorschläge zu Einheitstyp" });
    await nutzer.click(within(liste).getByText(name));
  }

  it("sagt die Vorbelegung auf Schritt 1 an und ersetzt sie beim Typwechsel durch die des neuen Typs", async () => {
    const nutzer = userEvent.setup();
    render(<VorbelegungBuehne start={neuerBogen()} />);

    await typWaehlen(nutzer, gross.name);
    expect(zahl("personal")).toBe(personen(gross.code));
    expect(zahl("fahrzeuge")).toBe(fahrzeuge(gross.code));
    expect(screen.getByText(/^Vorbelegt nach StAN:/).textContent).toContain(`${personen(gross.code)} Personen (Namen offen)`);

    await typWaehlen(nutzer, klein.name);

    // Nur die Sollplätze des neuen Typs — nicht die Summe beider.
    expect(zahl("personal")).toBe(personen(klein.code));
    expect(zahl("fahrzeuge")).toBe(fahrzeuge(klein.code));
  });

  it("nimmt beim Leeren des Typs die unbenannten Karten mit, benannte bleiben", async () => {
    const nutzer = userEvent.setup();
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: gross.code };
    start.personal = [...stanPersonalVorbelegung(org, { code: gross.code }), { ...neuePerson(), vorname: "Thomas", nachname: "Lange" }];
    start.fahrzeuge = [...stanFahrzeugVorbelegung(org, { code: gross.code }), { typ: {}, kennzeichen: "THW-84397" }];
    render(<VorbelegungBuehne start={start} />);

    await nutzer.clear(screen.getByRole("combobox", { name: "Einheitstyp" }));

    expect(zahl("personal")).toBe(1);
    expect(screen.getByTestId("namen").textContent).toBe("Lange");
    expect(zahl("fahrzeuge")).toBe(1);
    expect(screen.getByTestId("kennzeichen").textContent).toBe("THW-84397");
  });

  it("entfernt die Vorbelegung auf Knopfdruck — und nur die", async () => {
    const nutzer = userEvent.setup();
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: gross.code };
    start.personal = [{ ...neuePerson(), vorname: "Thomas", nachname: "Lange" }, ...stanPersonalVorbelegung(org, { code: gross.code })];
    start.fahrzeuge = stanFahrzeugVorbelegung(org, { code: gross.code });
    render(<VorbelegungBuehne start={start} />);

    await nutzer.click(screen.getByRole("button", { name: "Vorbelegung entfernen" }));

    expect(zahl("personal")).toBe(1);
    expect(screen.getByTestId("namen").textContent).toBe("Lange");
    expect(zahl("fahrzeuge")).toBe(0);
    expect(screen.queryByText(/^Vorbelegt nach StAN:/)).toBeNull();
  });

  // Audit Runde 4, R4-D4: „Vorbelegung entfernen" nahm Sollplätze mit Geschlecht
  // und Ernährung still mit, die Stärke fiel ohne Hinweis.
  it("quittiert „Vorbelegung entfernen“ mit Stärke vorher → nachher, nennt Geschlecht/Ernährung und stellt mit „Rückgängig“ wieder her (R4-D4)", async () => {
    const nutzer = userEvent.setup();
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: klein.code };
    const plaetze = stanPersonalVorbelegung(org, { code: klein.code });
    start.personal = [
      { ...neuePerson(), vorname: "Thomas", nachname: "Lange" },
      { ...plaetze[0]!, geschlecht: Geschlecht.W, ernaehrung: Ernaehrung.VEGAN },
      ...plaetze.slice(1),
    ];
    start.fahrzeuge = stanFahrzeugVorbelegung(org, { code: klein.code });
    render(<VorbelegungBuehne start={start} />);
    const vor = 1 + plaetze.length;

    await nutzer.click(screen.getByRole("button", { name: "Vorbelegung entfernen" }));

    expect(zahl("personal")).toBe(1);
    const quittung = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(quittung.textContent).toContain(`Vorbelegung entfernt: ${plaetze.length} Personen, ${fahrzeuge(klein.code)} Fahrzeug`);
    expect(quittung.textContent).toContain("(1 mit Geschlecht oder Ernährung)");
    expect(quittung.textContent).toContain(`Stärke ${vor} → 1`);

    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));

    expect(zahl("personal")).toBe(vor);
    expect(zahl("fahrzeuge")).toBe(fahrzeuge(klein.code));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });

  it("quittiert den Typwechsel, der Sollplätze ersetzt, und „Rückgängig“ stellt auch den alten Typ wieder her (R4-D4)", async () => {
    const nutzer = userEvent.setup();
    render(<VorbelegungBuehne start={neuerBogen()} />);
    await typWaehlen(nutzer, gross.name);
    // Erste Wahl auf einem leeren Bogen: nichts ging verloren, keine Leiste.
    expect(document.querySelector(".quittung-daumen")).toBeNull();

    await typWaehlen(nutzer, klein.name);

    const quittung = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(quittung.textContent).toContain("Vorbelegung des bisherigen Typs ersetzt");
    expect(quittung.textContent).toContain(`Stärke ${personen(gross.code)} → ${personen(klein.code)}`);
    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    expect(zahl("personal")).toBe(personen(gross.code));
    expect(zahl("fahrzeuge")).toBe(fahrzeuge(gross.code));
    expect((screen.getByRole("combobox", { name: "Einheitstyp" }) as HTMLInputElement).value).toContain(gross.name);
  });

  it("die nächste Eingabe verwirft den Rückweg, damit „Rückgängig“ nie spätere Eingaben mitnimmt", async () => {
    const nutzer = userEvent.setup();
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: klein.code };
    start.personal = stanPersonalVorbelegung(org, { code: klein.code });
    render(<VorbelegungBuehne start={start} />);
    await nutzer.click(screen.getByRole("button", { name: "Vorbelegung entfernen" }));
    expect(document.querySelector(".quittung-daumen")).not.toBeNull();

    await nutzer.type(screen.getByLabelText(/Organisationsname/), "x");

    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });

  it("zeigt keinen Vorbelegungs-Hinweis, solange kein Typ mit Vorgabe gewählt ist", () => {
    render(<VorbelegungBuehne start={neuerBogen()} />);

    expect(screen.queryByText(/^Vorbelegt nach StAN:/)).toBeNull();
  });
});

/**
 * Ein Vertipper im ersten Auswahlfeld löschte vorher Einheitstyp und die ganze
 * Zugehörigkeit — Rufnummern und Postfächer dreier Ebenen — ohne ein Wort.
 * Steht davon etwas im Bogen, wird gefragt und benannt, was verloren geht.
 */
describe("Schritt Einheit — Organisation wechseln", () => {
  function ausgefuellt(): Erfassungsbogen {
    const b = neuerBogen();
    b.einheit.einheitsTyp = { code: 7 };
    b.einheit.hierarchie = [
      { bezeichnung: { code: 1 }, name: "Wardenburg", kurz: "OWAR", telefon: "04407123" },
      { bezeichnung: { code: 2 }, name: "Bremen" },
    ];
    return b;
  }

  it("fragt nach und behält bei Abbruch Organisation, Typ und Zugehörigkeit", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittEinheit} bogen={ausgefuellt()} />);

    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");

    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Organisation auf „Feuerwehr\" wechseln?']")!;
    expect(dialog).not.toBeNull();
    // Die Frage nennt, was verloren geht.
    expect(dialog.textContent).toContain("FGr R (B)");
    expect(dialog.textContent).toContain("OV Wardenburg");
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect((screen.getByLabelText("Organisation") as HTMLSelectElement).selectedOptions[0]?.textContent).toBe("THW");
    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("Wardenburg");
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(2);
  });

  it("wechselt nach Bestätigung und setzt die Zugehörigkeit neu auf", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittEinheit} bogen={ausgefuellt()} />);

    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Organisation auf „Feuerwehr\" wechseln?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Organisation wechseln" }));

    expect((screen.getByLabelText("Organisation") as HTMLSelectElement).selectedOptions[0]?.textContent).toBe("Feuerwehr");
    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("");
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(1);
  });

  it("wechselt ohne Rückfrage, solange nichts ausgefüllt ist", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");

    expect(document.querySelector("dialog.abfrage")).toBeNull();
    expect((screen.getByLabelText("Organisation") as HTMLSelectElement).selectedOptions[0]?.textContent).toBe("Feuerwehr");
  });
});

/** Rückfrage-Regel für die Ebenen: „RB Tübingen" samt Rufnummer verschwand mit einem Fehlgriff. */
describe("Schritt Einheit — Ebene entfernen", () => {
  it("fragt vor dem Entfernen einer Ebene mit Inhalt nach und nennt sie", async () => {
    const nutzer = userEvent.setup();
    const b = neuerBogen();
    b.einheit.hierarchie = [
      { bezeichnung: { code: 1 }, name: "Wardenburg" },
      { bezeichnung: { code: 2 }, name: "Tübingen", telefon: "07071123" },
    ];
    render(<SchrittBuehne komponente={SchrittEinheit} bogen={b} />);

    await nutzer.click(screen.getByRole("button", { name: "Ebene RB Tübingen entfernen" }));

    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='RB Tübingen entfernen?']")!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain("Telefon 07071123");
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(2);

    await nutzer.click(screen.getByRole("button", { name: "Ebene RB Tübingen entfernen" }));
    const zweiter = document.querySelector<HTMLDialogElement>("dialog[aria-label='RB Tübingen entfernen?']")!;
    await nutzer.click(within(zweiter).getByRole("button", { name: "Ebene entfernen" }));
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(1);
  });
});

/**
 * Auf Schritt 1 standen vorher drei gelbe Kästen, bevor irgendetwas eingegeben
 * war — zwei davon zu Schritt 2 und 3. Wer auf dem ersten Bildschirm lernt,
 * dass gelbe Kästen ohnehin immer da sind, überliest später auch die, die zählen.
 */
describe("Schritt Einheit — nur eigene Hinweise", () => {
  it("weist auf einem frischen Bogen höchstens auf den fehlenden Namen hin", () => {
    render(<SchrittEinheit bogen={neuerBogen()} aendern={() => {}} />);

    expect(screen.getByText(/Name der eigenen Einheit .* fehlt/)).toBeDefined();
    expect(screen.queryByText(/Stärke ist 0/)).toBeNull();
    expect(screen.queryByText(/Ort\/Auftrag/)).toBeNull();
  });
});
