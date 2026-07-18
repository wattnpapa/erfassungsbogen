/**
 * Seiten-Fußzeile: Version, Credits sowie Impressum/Datenschutz/Über als Dialoge.
 * Aufbau angelehnt an sprechfunk-uebung.de (gleicher Autor).
 */

import { useRef, useState, type ChangeEvent, type MouseEvent, type ReactNode, type RefObject } from "react";
import { istNativ, pdfTeilen, textTeilen } from "./nativ";
import { feldModusAktiv, feldModusSetzen } from "./feld-modus";
import { sicherungEinspielen, sicherungErstellen } from "./sicherung";

const KONTAKT = "johannes.rudolph@thw-oldenburg.de";
const REPO = "https://github.com/wattnpapa/erfassungsbogen";

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
};

function ordnerLabel(ordner: string): string {
  return ORDNER_LABEL[ordner] ?? ordner.replace(/-/g, " ").toUpperCase();
}

// Beispiel-PDFs aus examples/ — beliebig tief verschachtelt (z. B.
// examples/thw/*.pdf oder examples/katastrophenschutz/niedersachsen/*.pdf). Der
// Glob wird beim Build aufgelöst, neue Dateien und Ordner erscheinen also
// automatisch ohne Codeänderung (erzeugt von scripts/beispielboegen-pdf.mts
// bzw. scripts/kats-nds-beispielboegen.mts). `ordner` sind die Verzeichnis-
// segmente zwischen examples/ und der Datei.
const BEISPIELE = Object.entries(
  import.meta.glob("../../examples/**/*.pdf", { eager: true, query: "?url", import: "default" }),
)
  .map(([pfad, url]) => {
    const teile = pfad.split("/");
    const iExamples = teile.lastIndexOf("examples");
    return {
      ordner: teile.slice(iExamples + 1, teile.length - 1),
      datei: teile[teile.length - 1]!,
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

/** Nativ gibt es keinen Browser-Download: PDF laden und übers Share-Sheet anbieten. */
async function beispielTeilen(e: MouseEvent, datei: string, url: string): Promise<void> {
  if (!istNativ()) return; // Web: normaler Download-Link
  e.preventDefault();
  const blob = await (await fetch(url)).blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const leser = new FileReader();
    leser.onload = () => resolve((leser.result as string).split(",", 2)[1]);
    leser.onerror = () => reject(leser.error);
    leser.readAsDataURL(blob);
  });
  await pdfTeilen(datei, base64);
}

function Dialog({ titel, dialogRef, children }: {
  titel: string;
  dialogRef: RefObject<HTMLDialogElement | null>;
  children: ReactNode;
}) {
  return (
    <dialog ref={dialogRef} aria-label={titel}>
      <div className="kopfzeile">
        <h2>{titel}</h2>
        <button onClick={() => dialogRef.current?.close()}>Schließen</button>
      </div>
      {children}
    </dialog>
  );
}

export function Fusszeile() {
  const ueber = useRef<HTMLDialogElement>(null);
  const impressum = useRef<HTMLDialogElement>(null);
  const datenschutz = useRef<HTMLDialogElement>(null);
  const beispiele = useRef<HTMLDialogElement>(null);
  // Ordner-Navigation im Beispielbögen-Dialog: erst Organisation/Thema, ggf.
  // weitere Ebenen (z. B. Bundesland), dann der Bogen.
  const [beispielPfad, setBeispielPfad] = useState<string[]>([]);
  const sicherung = useRef<HTMLDialogElement>(null);
  const [feldModus, setFeldModus] = useState(() => feldModusAktiv());
  const [sicherungFehler, setSicherungFehler] = useState("");

  function feldModusUmschalten() {
    const an = !feldModus;
    setFeldModus(an);
    feldModusSetzen(an);
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

  return (
    <footer className="seite">
      <span>
        Einheiten-Erfassungsbogen v{__APP_VERSION__} · von{" "}
        <button className="link" onClick={() => ueber.current?.showModal()}>Johannes Rudolph</button>
      </span>
      <span className="fusslinks">
        <button
          className="link"
          onClick={feldModusUmschalten}
          aria-pressed={feldModus}
          title="Große Tippziele und hoher Kontrast für den Einsatz draußen"
        >
          {feldModus ? "✓ Feld-Modus" : "Feld-Modus"}
        </button>
        <button className="link" onClick={() => { setSicherungFehler(""); sicherung.current?.showModal(); }}>Datensicherung</button>
        <button
          className="link"
          onClick={() => {
            setBeispielPfad([]); // beim Öffnen wieder ganz oben starten
            beispiele.current?.showModal();
          }}
        >
          Beispielbögen
        </button>
        <button className="link" onClick={() => impressum.current?.showModal()}>Impressum</button>
        <button className="link" onClick={() => datenschutz.current?.showModal()}>Datenschutz</button>
        <a href={`mailto:${KONTAKT}`}>Kontakt</a>
        <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
      </span>

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

      <Dialog titel="Beispielbögen" dialogRef={beispiele}>
        <p>
          Ausgefüllte Beispiel-Erfassungsbögen (fiktive Einheiten und Personen) als PDF –
          zum Ansehen, für Übungen oder zum Testen des QR-Imports. Die eingebetteten
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
        <ul>
          {unterordner(beispielPfad).map(({ ordner, anzahl }) => (
            <li key={`d/${ordner}`}>
              <button className="link" onClick={() => setBeispielPfad([...beispielPfad, ordner])}>
                {ordnerLabel(ordner)} ({anzahl} {anzahl === 1 ? "Bogen" : "Bögen"})
              </button>
            </li>
          ))}
          {boegenHier(beispielPfad).map(({ datei, url }) => (
            <li key={`f/${datei}`}>
              <a href={url} download={datei} onClick={(e) => void beispielTeilen(e, datei, url)}>
                {datei}
              </a>
            </li>
          ))}
        </ul>
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
        <h3>4. Cookies und Tracking</h3>
        <p>
          Die App setzt keine Cookies, nutzt keine Analyse-Dienste und bindet keine
          Inhalte von Drittanbietern ein.
        </p>
        <h3>5. Betroffenenrechte</h3>
        <p>
          Nach Art. 15–21 DSGVO bestehen Rechte auf Auskunft, Berichtigung, Löschung,
          Einschränkung der Verarbeitung und Widerspruch. Anfragen bitte an die oben
          genannte E-Mail-Adresse.
        </p>
      </Dialog>
    </footer>
  );
}
