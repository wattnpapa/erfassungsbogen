/**
 * Fenster zum lokalen Personalstamm: Helferliste einlesen (Spaltenzuordnung, Vorschau, Ablage) und „Wer ist dabei?"
 * (Suche, Filter, laufende Stärke, Übernahme in den Bogen).
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Fahrerlaubnis, OrganisationsTyp, StaerkeRolle, type Person } from "@bos/eeb-format/model";
import { Dialogschicht } from "./dialoge";
import { neuePerson } from "./hilfen";
import { stammLaden, type Personalstamm, type StammPerson } from "./personalstamm";
import { musterCsv, musterXlsx } from "./personalstamm-import";
import { AuswahlInhalt, EinlesenInhalt } from "./personalstamm-ui";
import { PersonalstammKarte } from "./personalstamm-fenster";

const p = (nachname: string, vorname: string, extra: Partial<StammPerson> = {}): StammPerson => ({
  nachname, vorname, rolle: StaerkeRolle.MANNSCHAFT, qualifikationen: [], fahrerlaubnisse: [], ...extra,
});

const STAMM: Personalstamm = {
  version: 1,
  importiert: Date.now(),
  quelle: "helfer.xlsx",
  personen: [
    p("Schulz", "Jens", { funktion: "GrFü", rolle: StaerkeRolle.UNTERFUEHRER, teileinheit: "B1", qualifikationen: ["AGT"], fahrerlaubnisse: [Fahrerlaubnis.CE] }),
    p("Meier", "Anna", { rolle: StaerkeRolle.FUEHRER, funktion: "ZFü", teileinheit: "ZTr" }),
    p("Abel", "Kim", { teileinheit: "B1" }),
    p("Zander", "Uwe", { teileinheit: "N", qualifikationen: ["Motorsäge"] }),
  ],
};

function auswahl(extra: Partial<Parameters<typeof AuswahlInhalt>[0]> = {}) {
  const onUebernehmen = vi.fn<(personal: Person[], text: string, organisation: OrganisationsTyp) => void>();
  render(
    <AuswahlInhalt
      stamm={STAMM}
      organisation={OrganisationsTyp.THW}
      bestand={[]}
      okText={(n, staerke) => `Bogen anlegen · ${n} · ${staerke}`}
      onUebernehmen={onUebernehmen}
      {...extra}
    />,
  );
  return onUebernehmen;
}

describe("Wer ist dabei?", () => {
  it("zeigt die laufende Stärke und übernimmt die Angetippten", async () => {
    const user = userEvent.setup();
    const onUebernehmen = auswahl();
    expect(screen.getByRole("button", { name: "Bogen anlegen · 0 · 0 / 0 / 0 // 0" })).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("checkbox", { name: /Meier, Anna/ }));
    await user.click(screen.getByRole("checkbox", { name: /Schulz, Jens/ }));
    await user.click(screen.getByRole("checkbox", { name: /Abel, Kim/ }));
    await user.click(screen.getByRole("button", { name: "Bogen anlegen · 3 · 1 / 1 / 1 // 3" }));
    expect(onUebernehmen).toHaveBeenCalledTimes(1);
    const [personal, text, org] = onUebernehmen.mock.calls[0]!;
    // Reihenfolge des Stamms (nach Nachname), nicht die des Antippens.
    expect(personal.map((x) => x.nachname)).toEqual(["Abel", "Meier", "Schulz"]);
    expect(personal[2]!.fahrerlaubnis).toBe(Fahrerlaubnis.CE);
    expect(personal[2]!.funktionen[0]).toHaveProperty("code");
    expect(text).toBe("3 Personen aus dem Personalstamm übernommen.");
    expect(org).toBe(OrganisationsTyp.THW);
  });

  it("filtert nach Suche, Teileinheit und Qualifikation und wählt alle angezeigten", async () => {
    const user = userEvent.setup();
    auswahl();
    await user.selectOptions(screen.getByRole("combobox", { name: "Teileinheit" }), "B1");
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect((screen.getByRole("status")).textContent).toContain("2 von 4 angezeigt");
    await user.click(screen.getByRole("button", { name: "Alle 2 angezeigten wählen" }));
    expect((screen.getByRole("status")).textContent).toContain("2 gewählt · Stärke 0 / 1 / 1 // 2");
    // Die Wahl bleibt, wenn der Filter wechselt.
    await user.selectOptions(screen.getByRole("combobox", { name: "Teileinheit" }), "");
    await user.selectOptions(screen.getByRole("combobox", { name: "Qualifikation" }), "Motorsäge");
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect((screen.getByRole("status")).textContent).toContain("2 gewählt");
    await user.selectOptions(screen.getByRole("combobox", { name: "Qualifikation" }), "");
    await user.type(screen.getByRole("searchbox", { name: "Suche" }), "gibtsnicht");
    expect(screen.getByText("Niemand im Personalstamm passt zu Suche und Filter.")).toBeTruthy();
  });

  it("sperrt, wer schon im Bogen steht, und füllt freie Sollplätze", async () => {
    const user = userEvent.setup();
    const sollplatz = { ...neuePerson(), staerkeRolle: StaerkeRolle.UNTERFUEHRER };
    const onUebernehmen = auswahl({ bestand: [{ ...neuePerson(), vorname: "anna", nachname: "MEIER" }, sollplatz] });
    const anna = screen.getByRole("checkbox", { name: /Meier, Anna/ });
    expect(anna).toHaveProperty("disabled", true);
    expect(within(anna.closest("label")!).getByText("schon im Bogen")).toBeTruthy();
    await user.click(screen.getByRole("checkbox", { name: /Schulz, Jens/ }));
    await user.click(screen.getByRole("button", { name: /Bogen anlegen · 1/ }));
    const [personal, text] = onUebernehmen.mock.calls[0]!;
    expect(personal.map((x) => x.nachname)).toEqual(["MEIER", "Schulz"]);
    expect(text).toBe("1 Person aus dem Personalstamm übernommen — 1 davon in freie Sollplätze.");
  });

  it("lässt beim neuen Bogen die Organisation wählen und ohne Auswahl weitergehen", async () => {
    const user = userEvent.setup();
    const onOhne = vi.fn();
    const onUebernehmen = auswahl({ organisationWaehlbar: true, onOhne });
    await user.selectOptions(screen.getByRole("combobox", { name: "Organisation des Bogens" }), String(OrganisationsTyp.FEUERWEHR));
    await user.click(screen.getByRole("checkbox", { name: /Schulz, Jens/ }));
    await user.click(screen.getByRole("button", { name: /Bogen anlegen · 1/ }));
    const [personal, , org] = onUebernehmen.mock.calls[0]!;
    expect(org).toBe(OrganisationsTyp.FEUERWEHR);
    expect(personal[0]!.funktionen).toEqual([{ freitext: "GrFü" }]); // kein THW-Code im Feuerwehr-Bogen
    await user.click(screen.getByRole("button", { name: "Ohne Auswahl weiter" }));
    expect(onOhne).toHaveBeenCalledWith(OrganisationsTyp.FEUERWEHR);
  });

  it("nennt das Alter eines alten Stamms", () => {
    auswahl({ stamm: { ...STAMM, importiert: Date.now() - 120 * 86_400_000 } });
    expect(screen.getByText(/Der Personalstamm ist 120 Tage alt/)).toBeTruthy();
  });
});

describe("Personal einlesen", () => {
  const csvDatei = () => new File([musterCsv()], "helfer.csv", { type: "text/csv" });

  it("liest eine CSV, schlägt die Spalten vor und legt den Stamm ab", async () => {
    const user = userEvent.setup();
    const onFertig = vi.fn();
    render(<EinlesenInhalt vorhanden={null} onFertig={onFertig} />);
    await user.upload(screen.getByLabelText("Datei wählen…"), csvDatei());
    expect(await screen.findByText(/3 Zeilen unter der Kopfzeile/)).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /^Nachname/ })).toHaveProperty("value", "0");
    expect(screen.getByRole("combobox", { name: /^Teileinheit/ })).toHaveProperty("value", "7");
    expect(screen.getByText(/Stärke 1 \/ 1 \/ 1 \/\/ 3/)).toBeTruthy();
    // Rufnummern kommen mit, Geschlecht und Ernährung nur auf Wunsch.
    expect(screen.getByRole("checkbox", { name: "Rufnummern einlesen" })).toHaveProperty("checked", true);
    expect(screen.getByRole("checkbox", { name: "Geschlecht und Ernährung einlesen" })).toHaveProperty("checked", false);
    await user.click(screen.getByRole("button", { name: "Als Personalstamm ablegen · 3 Personen" }));
    expect(onFertig).toHaveBeenCalledTimes(1);
    const stamm = stammLaden()!;
    expect(stamm.quelle).toBe("helfer.csv");
    expect(stamm.personen.map((x) => x.nachname)).toEqual(["Mustermann", "Musterfrau", "Beispiel"]);
    expect(stamm.personen[0]!.mobil).toBe("0171 3920000");
    expect(stamm.personen[0]).not.toHaveProperty("geschlecht");
  });

  it("liest eine Excel-Mappe und lässt Rufnummern auf Wunsch weg", async () => {
    const user = userEvent.setup();
    render(<EinlesenInhalt vorhanden={null} onFertig={() => {}} />);
    const mappe = new File([musterXlsx() as BlobPart], "helfer.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    await user.upload(screen.getByLabelText("Datei wählen…"), mappe);
    expect(await screen.findByText(/3 Zeilen unter der Kopfzeile/)).toBeTruthy();
    await user.click(screen.getByRole("checkbox", { name: "Rufnummern einlesen" }));
    await user.click(screen.getByRole("checkbox", { name: "Geschlecht und Ernährung einlesen" }));
    await user.click(screen.getByRole("button", { name: "Als Personalstamm ablegen · 3 Personen" }));
    const erste = stammLaden()!.personen[0]!;
    expect(erste).not.toHaveProperty("mobil");
    expect(erste).toHaveProperty("geschlecht");
    expect(erste).toHaveProperty("ernaehrung");
  });

  it("verlangt eine Spalte für den Namen", async () => {
    const user = userEvent.setup();
    render(<EinlesenInhalt vorhanden={null} onFertig={() => {}} />);
    await user.upload(screen.getByLabelText("Datei wählen…"), new File(["Helfer;Trupp\nMeier, Anna;B1\n"], "liste.csv"));
    // „Helfer" gilt als Name in einer Spalte.
    expect(await screen.findByRole("button", { name: "Als Personalstamm ablegen · 1 Person" })).toHaveProperty("disabled", false);
    await user.selectOptions(screen.getByRole("combobox", { name: /^Name in einer Spalte/ }), "");
    expect(screen.getByText(/Noch keine Spalte für den Namen gewählt/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Als Personalstamm ablegen/ })).toBeNull();
    await user.selectOptions(screen.getByRole("combobox", { name: /^Nachname/ }), "0");
    expect(screen.getByRole("button", { name: "Als Personalstamm ablegen · 1 Person" })).toHaveProperty("disabled", false);
  });

  it("zeigt beim Neu-Einlesen, was neu ist, sich ändert und entfällt", async () => {
    const user = userEvent.setup();
    const vorhanden: Personalstamm = {
      ...STAMM,
      personen: [p("Mustermann", "Max"), p("Weg", "Willi")],
    };
    render(<EinlesenInhalt vorhanden={vorhanden} onFertig={() => {}} />);
    await user.upload(screen.getByLabelText("Datei wählen…"), csvDatei());
    expect(await screen.findByText(/2 neu, 1 geändert, 1 entfällt, 0 unverändert/)).toBeTruthy();
    expect(screen.getByText("Weg, Willi")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stamm ersetzen · 3 Personen" })).toHaveProperty("disabled", false);
  });

  it("meldet eine Datei ohne Zeilen und eine alte .xls verständlich", async () => {
    const user = userEvent.setup();
    render(<EinlesenInhalt vorhanden={null} onFertig={() => {}} />);
    await user.upload(screen.getByLabelText("Datei wählen…"), new File(["Nachname;Vorname\n"], "leer.csv"));
    expect((await screen.findByRole("alert")).textContent).toContain("keine Zeilen unter der Kopfzeile");
    await user.upload(screen.getByLabelText("Datei wählen…"), new File([new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3, 4])], "alt.xls"));
    expect(await screen.findByText(/alte Excel-Datei/)).toBeTruthy();
  });
});

describe("Abschnitt der Startseite", () => {
  it("nennt Stand und Alter und löscht nach Rückfrage", async () => {
    const user = userEvent.setup();
    const onGeaendert = vi.fn();
    const alt = { ...STAMM, importiert: Date.now() - 120 * 86_400_000 };
    localStorage.setItem("eeb.personalstamm.v1", JSON.stringify(alt));
    render(
      <>
        <PersonalstammKarte stamm={alt} onGeaendert={onGeaendert} />
        <Dialogschicht />
      </>,
    );
    expect(screen.getByText("4 Personen")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Der Personalstamm ist 120 Tage alt");
    await user.click(screen.getByRole("button", { name: "Personalstamm löschen…" }));
    await user.click(await screen.findByRole("button", { name: "Personalstamm löschen" }));
    expect(onGeaendert).toHaveBeenCalledWith(null);
    expect(stammLaden()).toBeNull();
  });

  it("bietet ohne Stamm das Einlesen an", () => {
    render(<PersonalstammKarte stamm={null} onGeaendert={() => {}} />);
    expect(screen.getByRole("button", { name: "Personal einlesen…" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /löschen/ })).toBeNull();
  });
});
