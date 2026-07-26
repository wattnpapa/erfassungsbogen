/**
 * Seiten-Fußzeile: Version, Credits sowie Impressum/Datenschutz/Über als Dialoge.
 * Aufbau angelehnt an sprechfunk-uebung.de (gleicher Autor).
 */

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode, type RefObject } from "react";
import { staerke, type Erfassungsbogen } from "../model";
import { istNativ, textTeilen } from "./nativ";
import { einheitOrt, migriereBogen, orgLabel, vokabText, vokabularFuer } from "./hilfen";
import { einheitSymbolSvg, svgDataUrl } from "./taktische-zeichen";
import { pdfErzeugen } from "./pdf";
import { nutzungsKanal, statistikAbgewaehlt, statistikAbwaehlen } from "./statistik";
import { AnzeigeSchalter } from "./anzeige-schalter";
import { alleDatenLoeschen, datenUmfang, sicherungErstellen, sicherungEinspielen, type DatenUmfang } from "./sicherung";

const KONTAKT = "johannes.rudolph@thw-oldenburg.de";
const REPO = "https://github.com/wattnpapa/erfassungsbogen";
// Absolut, nicht relativ: dieselbe Fußzeile läuft in der Electron-/Capacitor-App,
// wo ein relativer Pfad auf das mitgelieferte Bundle statt auf die Seite zeigt.
const ANLEITUNG = "https://erfassungsbogen.app/anleitung.html";

// Anzeigenamen für die Ordner in examples/. Erste Ebene ist die Organisation
// bzw. ein Thema (z. B. „Katastrophenschutz"), darunter können weitere Ebenen
// folgen (z. B. Bundesländer). Unbekannte Ordner erscheinen mit ihrem
// Ordnernamen in Großbuchstaben, damit neue Ordner auch ohne Eintrag hier
// sichtbar bleiben.
const ORDNER_LABEL: Record<string, string> = {
  thw: "THW",
  feuerwehr: "Feuerwehr",
  polizei: "Polizei",
  bundespolizei: "Bundespolizei",
  drk: "DRK",
  juh: "Johanniter (JUH)",
  mhd: "Malteser (MHD)",
  asb: "ASB",
  dlrg: "DLRG",
  bundeswehr: "Bundeswehr",
  rettungsdienst: "Rettungsdienst",
  katastrophenschutz: "Katastrophenschutz",
  brandenburg: "Brandenburg",
  niedersachsen: "Niedersachsen",
  sachsen: "Sachsen",
  thueringen: "Thüringen",
};

function ordnerLabel(ordner: string): string {
  return ORDNER_LABEL[ordner] ?? ordner.replace(/-/g, " ").toUpperCase();
}

// Beispielbögen aus examples/ — beliebig tief verschachtelt (z. B.
// examples/thw/*.json oder examples/katastrophenschutz/niedersachsen/*.json).
// Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Klick aus dem
// aktuellen Layout (siehe beispielPdf), damit Layout-Änderungen nicht jedes
// Mal ein Neurendern aller Beispiele erzwingen. Der Glob wird beim Build
// aufgelöst, neue Dateien und Ordner erscheinen also automatisch ohne
// Codeänderung (erzeugt von scripts/*-beispielboegen*.mts). `ordner` sind die
// Verzeichnissegmente zwischen examples/ und der Datei.
const BEISPIELE = Object.entries(
  import.meta.glob("../../examples/**/*.json", { eager: true, query: "?url", import: "default" }),
)
  .map(([pfad, url]) => {
    const teile = pfad.split("/");
    const iExamples = teile.lastIndexOf("examples");
    return {
      ordner: teile.slice(iExamples + 1, teile.length - 1),
      datei: teile[teile.length - 1]!.replace(/\.json$/, ""),
      url: url as string,
    };
  })
  .sort((a, b) => a.datei.localeCompare(b.datei, "de"));

/** Trefferliste unter einem Ordner-Pfad (Prefix-Abgleich). */
function unterPfad(pfad: string[]): typeof BEISPIELE {
  return BEISPIELE.filter((b) => pfad.every((seg, i) => b.ordner[i] === seg));
}

/** Direkte Unterordner (mit Bogenzahl) unterhalb eines Pfades. */
function unterordner(pfad: string[]): { ordner: string; anzahl: number }[] {
  const zaehler = new Map<string, number>();
  for (const b of unterPfad(pfad)) {
    if (b.ordner.length > pfad.length) {
      const naechster = b.ordner[pfad.length]!;
      zaehler.set(naechster, (zaehler.get(naechster) ?? 0) + 1);
    }
  }
  return [...zaehler.entries()]
    .map(([ordner, anzahl]) => ({ ordner, anzahl }))
    .sort((a, b) => ordnerLabel(a.ordner).localeCompare(ordnerLabel(b.ordner), "de"));
}

/** Bögen, die direkt in diesem Ordner liegen (keine tiefere Ebene mehr). */
function boegenHier(pfad: string[]): typeof BEISPIELE {
  return unterPfad(pfad).filter((b) => b.ordner.length === pfad.length);
}

// Einmal geladene Beispielbögen bleiben für die Sitzung liegen: die Tabelle
// zeigt Einheit, Herkunft und Stärke aus dem Bogen selbst, und beim Blättern
// zwischen den Ordnern (oder für PDF/Ansehen) wird nicht erneut geladen.
const BOGEN_CACHE = new Map<string, Erfassungsbogen>();

/** Beispielbogen-JSON laden (gecacht) und auf das aktuelle Schema heben. */
async function beispielBogen(url: string): Promise<Erfassungsbogen> {
  const bekannt = BOGEN_CACHE.get(url);
  if (bekannt) return bekannt;
  const bogen = migriereBogen((await (await fetch(url)).json()) as Erfassungsbogen);
  BOGEN_CACHE.set(url, bogen);
  return bogen;
}

/**
 * Eigene Kopie für alles, was den Bogen weitergibt (Öffnen, PDF): der geöffnete
 * Bogen wird bearbeitet, der Stand im Cache muss davon unberührt bleiben.
 */
async function beispielKopie(url: string): Promise<Erfassungsbogen> {
  return structuredClone(await beispielBogen(url));
}

/**
 * Beispielbogen laden und daraus die PDF im aktuellen Layout erzeugen —
 * Download (Web) bzw. Share-Sheet (App) übernimmt pdfErzeugen.
 */
async function beispielPdf(datei: string, url: string): Promise<void> {
  await pdfErzeugen(await beispielKopie(url), `${datei}.pdf`);
}

/** Einheitstyp im Vokabular der Organisation („Betreuungsgruppe (BTGr)"). */
function einheitsTypText(b: Erfassungsbogen): string {
  return vokabText(b.einheit.einheitsTyp, vokabularFuer(b.einheit.organisation, "einheitstyp"), "name");
}

/** Träger der Einheit — der erfasste Organisationsname, sonst die Organisation. */
function traegerText(b: Erfassungsbogen): string {
  return b.einheit.organisationName?.trim() || orgLabel(b.einheit.organisation);
}

/**
 * Oberste Zuständigkeitsebene („THW Landesverband Baden-Württemberg"). Steckt
 * ihr Name schon im Träger („Feuerwehr Landkreis Stade" über der „Unteren
 * KatS-Behörde Landkreis Stade"), bringt die Zeile nichts Neues und entfällt.
 */
function obersteEbene(b: Erfassungsbogen): string {
  const ebene = b.einheit.hierarchie[b.einheit.hierarchie.length - 1];
  if (!ebene || b.einheit.hierarchie.length < 2) return "";
  if (ebene.name && traegerText(b).includes(ebene.name)) return "";
  const bezeichnung = vokabText(ebene.bezeichnung, vokabularFuer(b.einheit.organisation, "ebene"), "name");
  return [bezeichnung, ebene.name].filter(Boolean).join(" ").trim();
}

/**
 * Icons der Zeilen-Aktionen: inline statt Bilddatei, damit sie die Textfarbe
 * (und damit die Kennfarbe der Organisation) erben und offline da sind.
 */
function IconAuge() {
  return (
    <svg className="knopf-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.6-6.2 10-6.2S22 12 22 12s-3.6 6.2-10 6.2S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconPdf() {
  return (
    <svg className="knopf-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5Z" />
      <path d="M14 3v4.5h4.5" />
      <path d="M12 11v5" />
      <path d="m9.75 13.75 2.25 2.25 2.25-2.25" />
    </svg>
  );
}

function Dialog({ titel, dialogRef, klasse, onSchliessen, children }: {
  titel: string;
  dialogRef: RefObject<HTMLDialogElement | null>;
  klasse?: string;
  /** Feuert auch bei Esc und Backdrop-Schluss, nicht nur beim Knopf. */
  onSchliessen?: () => void;
  children: ReactNode;
}) {
  return (
    <dialog ref={dialogRef} aria-label={titel} className={klasse} onClose={onSchliessen}>
      <div className="kopfzeile">
        <h2>{titel}</h2>
        <button onClick={() => dialogRef.current?.close()}>Schließen</button>
      </div>
      {children}
    </dialog>
  );
}

export function Fusszeile({ onBogenOeffnen }: {
  /**
   * Beispielbogen in der App öffnen — wie ein frisch gescannter Bogen.
   * Rückgabe false = die Übernahme wurde abgelehnt (Rückfrage abgebrochen);
   * dann bleibt der Dialog stehen.
   */
  onBogenOeffnen: (bogen: Erfassungsbogen) => boolean;
}) {
  const ueber = useRef<HTMLDialogElement>(null);
  const impressum = useRef<HTMLDialogElement>(null);
  const datenschutz = useRef<HTMLDialogElement>(null);
  const beispiele = useRef<HTMLDialogElement>(null);
  // Ordner-Navigation im Beispielbögen-Dialog: erst Organisation/Thema, ggf.
  // weitere Ebenen (z. B. Bundesland), dann der Bogen.
  const [beispielPfad, setBeispielPfad] = useState<string[]>([]);
  // Dateiname des Bogens, dessen PDF gerade entsteht (leer = keiner läuft).
  const [beispielLaeuft, setBeispielLaeuft] = useState("");
  const [beispielFehler, setBeispielFehler] = useState("");
  // Der Dialog lädt die Bögen des offenen Ordners nach, um Einheit, Herkunft
  // und Stärke in der Tabelle zu zeigen. Die Tabelle rendert ausschließlich aus
  // `beispielDaten` (URL → Bogen) — der Modul-Cache ist nur die Abkürzung beim
  // Nachladen, nie die Anzeigequelle. Sonst könnte die Ansicht mit einem
  // geleerten Cache dauerhaft leer stehen bleiben, ohne dass etwas nachlädt.
  const [beispieleOffen, setBeispieleOffen] = useState(false);
  const [beispielDaten, setBeispielDaten] = useState<Record<string, Erfassungsbogen>>({});
  const [beispielLaedt, setBeispielLaedt] = useState(false);
  const sicherung = useRef<HTMLDialogElement>(null);
  const [sicherungFehler, setSicherungFehler] = useState("");
  const loeschen = useRef<HTMLDialogElement>(null);
  // Stand beim Öffnen des Löschen-Dialogs — die Rückfrage nennt Zahlen, damit
  // niemand „alles löschen" blind bestätigt.
  const [loeschUmfang, setLoeschUmfang] = useState<DatenUmfang | null>(null);
  // Zweite Bestätigung im Dialog selbst (statt window.confirm): der Haken steht
  // neben der Liste dessen, was verschwindet, und ist nach dem Schließen wieder
  // leer — ein zweiter Klick allein löscht also nie.
  const [loeschVerstanden, setLoeschVerstanden] = useState(false);
  const [loeschFehler, setLoeschFehler] = useState("");
  const [statistikAus, setStatistikAus] = useState(() => statistikAbgewaehlt());

  function statistikUmschalten(ereignis: ChangeEvent<HTMLInputElement>) {
    const aus = ereignis.target.checked;
    setStatistikAus(aus);
    statistikAbwaehlen(aus);
  }

  // Bögen des offenen Ordners laden, sobald der Dialog offen ist bzw. der Pfad
  // wechselt. Fehlschläge (z. B. offline) sind kein Beinbruch: die Tabelle
  // zeigt dann den Dateinamen und meldet es unter der Liste.
  const beispielPfadSchluessel = beispielPfad.join("/");
  useEffect(() => {
    if (!beispieleOffen) return;
    const pfad = beispielPfadSchluessel ? beispielPfadSchluessel.split("/") : [];
    const urls = boegenHier(pfad).map((b) => b.url);
    let aktiv = true;
    // Schon Bekanntes sofort zeigen, den Rest nachladen.
    const bekannt: Record<string, Erfassungsbogen> = {};
    for (const u of urls) {
      const b = BOGEN_CACHE.get(u);
      if (b) bekannt[u] = b;
    }
    setBeispielDaten(bekannt);
    const fehlend = urls.filter((u) => !(u in bekannt));
    if (fehlend.length === 0) {
      setBeispielLaedt(false);
      return;
    }
    setBeispielLaedt(true);
    // Je Bogen einzeln in den Stand geben statt erst am Ende: bei einem großen
    // Ordner (THW: über 100 Bögen) füllt sich die Tabelle so nach und nach.
    void Promise.all(
      fehlend.map((u) =>
        beispielBogen(u).then(
          (b) => {
            if (aktiv) setBeispielDaten((stand) => ({ ...stand, [u]: b }));
            return true;
          },
          () => false,
        ),
      ),
    ).then((geladen) => {
      if (!aktiv) return;
      setBeispielLaedt(false);
      if (geladen.some((ok) => !ok)) {
        setBeispielFehler(
          "Einige Beispielbögen ließen sich nicht laden (offline?). Die Bögen selbst bleiben über die Aktionen erreichbar.",
        );
      }
    });
    return () => {
      aktiv = false;
    };
  }, [beispieleOffen, beispielPfadSchluessel]);

  // Anzeigestand der offenen Ebene.
  const beispielOrdner = unterordner(beispielPfad);
  const beispielBoegen = boegenHier(beispielPfad);
  const beispielGeladen = beispielBoegen.filter((b) => b.url in beispielDaten).length;

  /** PDF eines Beispielbogens anfordern; Fehler im Dialog zeigen. */
  async function beispielHolen(datei: string, url: string) {
    setBeispielFehler("");
    setBeispielLaeuft(datei);
    try {
      await beispielPdf(datei, url);
    } catch (err) {
      setBeispielFehler(`PDF konnte nicht erzeugt werden: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBeispielLaeuft("");
    }
  }

  /** Beispielbogen in der App öffnen — wie ein gescannter Bogen. */
  async function beispielAnsehen(datei: string, url: string) {
    setBeispielFehler("");
    setBeispielLaeuft(datei);
    try {
      const bogen = await beispielKopie(url);
      if (onBogenOeffnen(bogen)) beispiele.current?.close();
    } catch (err) {
      setBeispielFehler(`Bogen konnte nicht geladen werden: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBeispielLaeuft("");
    }
  }

  /** Alle lokalen App-Daten als Datei anbieten — App: Share-Sheet, Browser: Download. */
  async function sicherungExportieren() {
    const inhalt = sicherungErstellen();
    const name = `eeb-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    if (istNativ()) {
      await textTeilen(name, inhalt);
      return;
    }
    const blob = new Blob([inhalt], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function sicherungImportieren(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    const sicher = window.confirm(
      "Sicherung einspielen? ALLE App-Daten auf diesem Gerät (Vorlagen, Einsätze, Entwurf, Einstellungen, Geräteschlüssel) werden durch den Inhalt der Datei ersetzt.",
    );
    if (!sicher) return;
    try {
      const anzahl = sicherungEinspielen(await datei.text());
      window.alert(`Sicherung eingespielt (${anzahl} Einträge). Die App lädt jetzt neu.`);
      window.location.reload();
    } catch (err) {
      setSicherungFehler(err instanceof Error ? err.message : String(err));
    }
  }

  /** Löschen-Dialog öffnen: Stand frisch erheben, Bestätigung zurücksetzen. */
  function loeschenOeffnen() {
    setLoeschUmfang(datenUmfang());
    setLoeschVerstanden(false);
    setLoeschFehler("");
    loeschen.current?.showModal();
  }

  /**
   * Alles löschen und neu laden: der laufende Stand in React (offener Entwurf,
   * geladene Vorlagen) wüsste sonst nichts vom leeren Speicher und könnte ihn
   * beim nächsten Speichern wieder auffüllen.
   */
  function alleDatenLoeschenJetzt() {
    try {
      const anzahl = alleDatenLoeschen();
      window.alert(`Alle lokalen Daten gelöscht (${anzahl} Einträge). Die App startet jetzt neu.`);
      window.location.reload();
    } catch (err) {
      setLoeschFehler(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <footer className="seite">
      {/* Nach Zweck gruppiert statt als eine Reihe gleich gewichteter Links:
          „was tut der Eintrag" ist die einzige Ordnung, die hier etwas
          Wahres über den Inhalt aussagt. Der Anzeige-Umschalter ist ein
          Bedienelement und kein Link — er bekommt eine eigene, benannte
          Spalte statt zwischen den Links zu stehen. */}
      <div className="fuss-gruppen">
        <nav className="fuss-gruppe" aria-label="Daten">
          <span className="fuss-titel">Daten</span>
          <button className="link" onClick={() => { setSicherungFehler(""); sicherung.current?.showModal(); }}>Datensicherung</button>
          <button
            className="link"
            onClick={() => {
              setBeispielPfad([]); // beim Öffnen wieder ganz oben starten
              setBeispielFehler("");
              setBeispieleOffen(true);
              beispiele.current?.showModal();
            }}
          >
            Beispielbögen
          </button>
          <button className="link gefahr" onClick={loeschenOeffnen}>Alle Daten löschen</button>
        </nav>
        <nav className="fuss-gruppe" aria-label="Rechtliches">
          <span className="fuss-titel">Rechtliches</span>
          <button className="link" onClick={() => impressum.current?.showModal()}>Impressum</button>
          <button className="link" onClick={() => datenschutz.current?.showModal()}>Datenschutz</button>
        </nav>
        <nav className="fuss-gruppe" aria-label="Projekt">
          <span className="fuss-titel">Projekt</span>
          <a href={ANLEITUNG} target="_blank" rel="noopener noreferrer">Anleitung</a>
          <a href={`mailto:${KONTAKT}`}>Kontakt</a>
          <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
        <div className="fuss-gruppe">
          <span className="fuss-titel">Darstellung</span>
          <AnzeigeSchalter />
        </div>
      </div>
      <p className="fuss-marke">
        Einheiten-Erfassungsbogen v{__APP_VERSION__} · von{" "}
        <button className="link" onClick={() => ueber.current?.showModal()}>Johannes Rudolph</button>
      </p>

      <Dialog titel="Datensicherung" dialogRef={sicherung}>
        <p>
          Alle lokalen Daten dieser App — Vorlagen, Einsatz-Sammlungen, der aktuelle
          Entwurf, Einstellungen und der Signatur-Geräteschlüssel — lassen sich als
          eine Datei sichern und auf einem anderen Gerät (oder nach einer
          Neuinstallation) wieder einspielen.
        </p>
        <p className="warnung">
          Die Datei enthält den privaten Signaturschlüssel und ggf. Personendaten.
          Sicher aufbewahren und nur über vertrauenswürdige Wege übertragen.
        </p>
        <div className="aktionen">
          <button className="primaer" onClick={() => void sicherungExportieren()}>Sicherung erstellen…</button>
          <label className="datei-knopf">
            Sicherung einspielen…
            <input type="file" accept=".json,application/json" hidden onChange={(e) => void sicherungImportieren(e)} />
          </label>
        </div>
        {sicherungFehler && <p className="fehler">{sicherungFehler}</p>}
        <p className="hinweis">
          Einspielen ersetzt die vorhandenen App-Daten auf diesem Gerät vollständig.
        </p>
      </Dialog>

      {/* Restlos löschen — z. B. bevor ein geteiltes Tablet weitergegeben wird
          oder nach einer Übung. Bewusst mit Zahlen, Sicherungs-Ausweg und
          eigenem Haken: rückgängig gibt es hier nicht. */}
      <Dialog titel="Alle lokalen Daten löschen" dialogRef={loeschen}>
        <p>
          Entfernt <strong>alle</strong> Daten dieser App von diesem Gerät — auch die
          Einträge im Papierkorb. Es gibt keine Kopie in einer Cloud: was hier weg
          ist, ist weg.
        </p>
        {loeschUmfang && (
          loeschUmfang.eintraege === 0 ? (
            <p>Auf diesem Gerät sind derzeit keine App-Daten gespeichert.</p>
          ) : (
            <>
              <p><strong>Betroffen sind:</strong></p>
              <ul>
                <li>
                  {loeschUmfang.vorlagen} {loeschUmfang.vorlagen === 1 ? "Vorlage" : "Vorlagen"}
                  {" (inkl. Papierkorb)"}
                </li>
                <li>
                  {loeschUmfang.einsaetze} {loeschUmfang.einsaetze === 1 ? "Einsatz-Sammlung" : "Einsatz-Sammlungen"}
                  {" mit "}{loeschUmfang.meldungen} {loeschUmfang.meldungen === 1 ? "gemeldeten Bogen" : "gemeldeten Bögen"}
                </li>
                <li>{loeschUmfang.entwurf ? "der aktuelle Bogen-Entwurf" : "kein offener Bogen-Entwurf"}</li>
                <li>{loeschUmfang.absender ? "die hinterlegte Absenderkarte" : "keine Absenderkarte"}</li>
                <li>
                  {loeschUmfang.geraeteschluessel
                    ? "der Signatur-Geräteschlüssel — künftige Bögen werden mit einem neuen Schlüssel signiert"
                    : "kein Signatur-Geräteschlüssel"}
                </li>
                <li>alle Einstellungen (Darstellung, Vorbelegungen)</li>
              </ul>
            </>
          )
        )}
        <p className="warnung">
          Bereits erzeugte PDFs, QR-Codes und Sicherungsdateien bleiben unberührt —
          nur der Speicher dieser App wird geleert. Der Widerspruch zur
          Reichweitenmessung bleibt bestehen.
        </p>
        <div className="aktionen">
          <button onClick={() => void sicherungExportieren()}>Vorher Sicherung erstellen…</button>
        </div>
        <label className="inline">
          <input
            type="checkbox"
            checked={loeschVerstanden}
            onChange={(e) => setLoeschVerstanden(e.target.checked)}
          />
          Ja, alle lokalen Daten dieser App endgültig löschen
        </label>
        <div className="aktionen">
          <button className="gefahr" disabled={!loeschVerstanden} onClick={alleDatenLoeschenJetzt}>
            Endgültig löschen
          </button>
          <button onClick={() => loeschen.current?.close()}>Abbrechen</button>
        </div>
        {loeschFehler && <p className="fehler">{loeschFehler}</p>}
      </Dialog>

      <Dialog
        titel="Beispielbögen"
        dialogRef={beispiele}
        klasse="breit"
        onSchliessen={() => setBeispieleOffen(false)}
      >
        <p>
          Ausgefüllte Beispiel-Erfassungsbögen (fiktive Einheiten und Personen) –
          zum Ansehen, für Übungen oder zum Testen des QR-Imports. <strong>Anzeigen</strong>{" "}
          öffnet den Bogen in der App, als wäre er gerade gescannt worden;{" "}
          <strong>PDF</strong> erzeugt ihn im aktuellen Layout – die eingebetteten
          QR-Codes lassen sich direkt mit der App scannen.
        </p>
        {beispielPfad.length > 0 && (
          <p>
            <button className="link" onClick={() => setBeispielPfad(beispielPfad.slice(0, -1))}>
              ← Zurück
            </button>
            {"  "}
            <strong>{beispielPfad.map(ordnerLabel).join(" › ")}</strong>
          </p>
        )}
        {beispielPfad.length === 0 && <p><strong>Organisation oder Thema wählen:</strong></p>}
        {beispielOrdner.length > 0 && (
          <ul className="beispiel-liste">
            {beispielOrdner.map(({ ordner, anzahl }) => (
              <li key={`d/${ordner}`}>
                <button className="link" onClick={() => setBeispielPfad([...beispielPfad, ordner])}>
                  {ordnerLabel(ordner)} ({anzahl} {anzahl === 1 ? "Bogen" : "Bögen"})
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* Ladefortschritt sichtbar machen: ein Ordner mit 45 Bögen braucht einen
            Moment, und eine Tabelle mit „—" sieht sonst aus wie „keine Daten". */}
        {beispielLaedt && beispielBoegen.length > 0 && (
          <p className="hinweis" role="status">
            Angaben werden geladen … ({beispielGeladen} von {beispielBoegen.length} Bögen)
          </p>
        )}
        {beispielBoegen.length > 0 && (
          <div className="tabellen-scroll">
            {/* Die role-Attribute sind kein Selbstzweck: auf schmalen Geräten
                setzt das CSS die Zeilen auf display:block (Karten statt
                Seitwärtsrollen) und nähme der Tabelle sonst die Semantik. */}
            <table className="uebersicht beispiele" role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader">Einheit</th>
                  <th role="columnheader">Herkunft</th>
                  <th role="columnheader">Stärke</th>
                  <th role="columnheader">Bogen</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {beispielBoegen.map(({ datei, url }) => {
                  const b = beispielDaten[url];
                  const s = b ? staerke(b) : null;
                  return (
                    <tr key={datei} role="row">
                      <td role="cell">
                        <span className="beispiel-einheit">
                          {b && (
                            <img src={svgDataUrl(einheitSymbolSvg(b.einheit))} alt="" aria-hidden="true" />
                          )}
                          <span>
                            <strong>{b ? einheitsTypText(b) || datei : datei}</strong>
                            {beispielLaeuft === datei && <span className="hinweis">wird vorbereitet …</span>}
                          </span>
                        </span>
                      </td>
                      <td role="cell">
                        {b ? (
                          <>
                            <strong>{einheitOrt(b.einheit) || "—"}</strong>
                            <span className="hinweis">{traegerText(b)}</span>
                            {obersteEbene(b) && <span className="hinweis">{obersteEbene(b)}</span>}
                          </>
                        ) : (
                          <span className="hinweis">{beispielLaedt ? "…" : "nicht geladen"}</span>
                        )}
                      </td>
                      <td className="zahl" role="cell">
                        {b && s ? (
                          <>
                            <strong>{s.fuehrer}/{s.unterfuehrer}/{s.mannschaft}/{s.gesamt}</strong>
                            <span className="hinweis">
                              {b.fahrzeuge.length} {b.fahrzeuge.length === 1 ? "Fahrzeug" : "Fahrzeuge"}
                            </span>
                          </>
                        ) : (
                          <span className="hinweis">{beispielLaedt ? "…" : "—"}</span>
                        )}
                      </td>
                      <td role="cell">
                        <span className="beispiel-aktionen">
                          {/* Bewusst kein .primaer: das ist in dieser App die
                              eine dominante Aktion einer Ansicht — in einer
                              Liste mit Dutzenden Zeilen wäre sie nur laut. */}
                          <button
                            disabled={beispielLaeuft !== ""}
                            onClick={() => void beispielAnsehen(datei, url)}
                          >
                            <IconAuge />
                            Anzeigen
                          </button>
                          <button
                            disabled={beispielLaeuft !== ""}
                            onClick={() => void beispielHolen(datei, url)}
                          >
                            <IconPdf />
                            PDF
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {beispielFehler && <p className="fehler">{beispielFehler}</p>}
      </Dialog>

      <Dialog titel="Über dieses Projekt" dialogRef={ueber}>
        <p>
          Der Einheiten-Erfassungsbogen ist ein Projekt von <strong>Johannes Rudolph</strong>,
          ehrenamtlicher Helfer im THW (Ortsverband Oldenburg). Die App digitalisiert die
          Erfassung von Einheiten im Bevölkerungsschutz – BOS-übergreifend, offline nutzbar
          und mit QR-Code-Transport, damit die Daten auch ohne Netz beim Meldekopf ankommen.
        </p>
        <p>
          Die Anwendung ist Open Source (Lizenz EUPL-1.2). Fehler, Ideen und Beiträge gern
          über <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a> oder per{" "}
          <a href={`mailto:${KONTAKT}`}>E-Mail</a>.
        </p>
        <p>
          Weiteres Projekt: <a href="https://sprechfunk-uebung.de/" target="_blank" rel="noopener noreferrer">
          Sprechfunk-Übungsgenerator</a> – Sprechfunkübungen für BOS-Einheiten erstellen.
        </p>
      </Dialog>

      <Dialog titel="Impressum" dialogRef={impressum}>
        <p><strong>Angaben gemäß § 5 DDG</strong></p>
        <p>
          Johannes Rudolph<br />
          Kniphauser Straße 16<br />
          26419 Schortens<br />
          Deutschland
        </p>
        <p><strong>Kontakt</strong></p>
        <p>E-Mail: <a href={`mailto:${KONTAKT}`}>{KONTAKT}</a></p>
        <p><strong>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</strong></p>
        <p>Johannes Rudolph</p>
      </Dialog>

      <Dialog titel="Datenschutz" dialogRef={datenschutz}>
        <h3>1. Verantwortlicher</h3>
        <p>
          Johannes Rudolph<br />
          E-Mail: <a href={`mailto:${KONTAKT}`}>{KONTAKT}</a>
        </p>
        <h3>2. Verarbeitung beim Aufruf der Website</h3>
        <p>
          Die Website wird über GitHub Pages (GitHub Inc.) ausgeliefert. Dabei verarbeitet
          GitHub technisch notwendige Verbindungsdaten (z.&nbsp;B. IP-Adresse) in
          Server-Logs zur Bereitstellung und Absicherung des Dienstes. Details:{" "}
          <a href="https://docs.github.com/site-policy/privacy-policies/github-privacy-statement"
            target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>.
        </p>
        <h3>3. Erfasste Bogendaten</h3>
        <p>
          Alle im Erfassungsbogen eingegebenen Daten (Einheit, Personal, Fahrzeuge usw.)
          werden ausschließlich lokal auf dem eigenen Gerät verarbeitet. Es findet keine
          Übertragung an einen Server statt. Eine Weitergabe erfolgt nur, wenn Nutzende
          selbst eine Datei, ein PDF oder einen QR-Code erzeugen und teilen.
        </p>
        <p>
          Freiwillig können unter „Absender“ Name, E-Mail-Adresse und Telefonnummer
          hinterlegt werden. Diese Angaben bleiben auf dem Gerät gespeichert und werden
          in jedem selbst erzeugten QR-Code, Link und PDF mitgegeben, damit die
          Gegenstelle bei Rückfragen weiß, an wen sie sich wenden kann. Die Angabe ist
          nicht erforderlich und jederzeit änder- und löschbar.
        </p>
        <h3>4. Speicherung im Endgerät und Reichweitenmessung</h3>
        <p>
          Es werden keine Cookies gesetzt. Die App speichert ihre Daten aber im
          lokalen Speicher (localStorage) des Geräts, weil sie ohne Server
          arbeitet und die Arbeit sonst bei jedem Neustart verloren wäre:
          eigene Vorlagen, Einsatz-Sammlungen, der aktuelle Bogen-Entwurf, die
          Absenderkarte, der private Signatur-Geräteschlüssel und die
          Anzeige-Einstellungen (Feld-/Nachtmodus). Ein Widerspruch gegen die
          Reichweitenmessung wird ebenfalls dort vermerkt.
        </p>
        <p>
          Diese Einträge sind für den ausdrücklich gewünschten Dienst technisch
          erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG); eine Einwilligung ist dafür
          nicht nötig. Sie verlassen das Gerät nicht: es gibt keine Übertragung
          an einen Server, keinen Zugriff durch Dritte und keine Kennung zur
          Wiedererkennung. Gelöscht werden sie über „Alle Daten löschen“ in der
          Fußzeile oder durch Löschen der Websitedaten im Browser.
        </p>
        <p>
          Zur Reichweitenmessung wird{" "}
          <a href="https://www.goatcounter.com/" target="_blank" rel="noopener noreferrer">
            GoatCounter
          </a>{" "}
          eingesetzt: beim Start wird einmalig ein Zählimpuls gesendet. Übertragen
          werden nur Zeitpunkt und Nutzungsart ({nutzungsKanal().titel}) sowie – im
          Browser – die verweisende Seite. Die IP-Adresse wird nicht gespeichert, es
          entsteht keine geräteübergreifende Kennung. Inhalte des Erfassungsbogens
          werden nicht übertragen. Ohne Internetverbindung unterbleibt der Impuls.
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
        </p>
        <label className="inline">
          <input type="checkbox" checked={statistikAus} onChange={statistikUmschalten} />
          Nicht mitzählen (gilt ab dem nächsten Start)
        </label>
        <h3>5. Betroffenenrechte</h3>
        <p>
          Nach Art. 15–21 DSGVO bestehen Rechte auf Auskunft, Berichtigung, Löschung,
          Einschränkung der Verarbeitung und Widerspruch. Anfragen bitte an die oben
          genannte E-Mail-Adresse.
        </p>
        <p>
          Für die lokal gespeicherten Daten lassen sich Auskunft und Löschung
          unmittelbar selbst ausüben, ohne Anfrage: „Datensicherung“ in der Fußzeile
          gibt alle gespeicherten Einträge als Datei heraus (und spielt sie wieder
          ein), „Alle Daten löschen“ nennt den Umfang und entfernt sie vollständig
          von diesem Gerät. Der Reichweitenmessung wird über das Kästchen in
          Abschnitt 4 widersprochen.
        </p>
      </Dialog>
    </footer>
  );
}
