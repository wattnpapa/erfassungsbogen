/**
 * Der zweite Weg der Startseite: „Bögen sammeln (Meldekopf)“. Bis zum 2026-11-09 sammelte diese App selbst
 * (Einsatz-Sammlung, Lagemonitor, Sammel-PDF, Lageblatt); das macht jetzt die eigene Meldekopf-App. Der Abschnitt
 * steht an derselben Stelle wie vorher, damit niemand ihn suchen muss, und verlinkt dorthin.
 *
 * Liegen auf dem Gerät noch Sammlungen aus der Zeit davor (meldekopf-altbestand.ts), sagt er es mit Zahl und
 * bietet beide Wege an: als Datensicherung hinüber (die Meldekopf-App spielt Sicherungen des Erfassungsbogens ein)
 * oder vom Gerät löschen, mit Rückfrage.
 */

import { useState } from "react";
import { MELDEKOPF_URL } from "./meldekopf-app";
import { altbestandLesen, altbestandLoeschen, altbestandText, type Altbestand } from "./meldekopf-altbestand";
import { sicherungErstellen, sicherungQuittungText, sicherungVermerkFehlte } from "./sicherung";
import { blobAlsDownload } from "./hilfen";
import { istNativ, textTeilen } from "./nativ";
import { frageJaNein } from "./dialoge";

export function MeldekopfWeg({ erststartHinweis }: { erststartHinweis?: React.ReactNode }) {
  const [altbestand, setAltbestand] = useState<Altbestand | null>(() => altbestandLesen());
  const [quittung, setQuittung] = useState("");
  const [fehler, setFehler] = useState("");

  async function sichern() {
    setFehler("");
    try {
      const inhalt = sicherungErstellen();
      const name = `eeb-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
      if (istNativ()) {
        await textTeilen(name, inhalt);
        setQuittung(sicherungQuittungText(name, true, sicherungVermerkFehlte()));
      } else {
        blobAlsDownload(name, new Blob([inhalt], { type: "application/json" }));
        setQuittung(sicherungQuittungText(name, false, sicherungVermerkFehlte()));
      }
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  async function loeschen() {
    if (!altbestand) return;
    const ja = await frageJaNein({
      titel: "Sammlungen von diesem Gerät löschen?",
      text: `${altbestandText(altbestand)} werden endgültig gelöscht, samt Papierkorb, Export-Ständen und Lagemonitor-Angaben. Vorlagen, eigener Bogen und Einstellungen bleiben. Wer die Sammlungen in der Meldekopf-App weiterführen will, erstellt vorher eine Datensicherung.`,
      ok: "Endgültig löschen",
      gefahr: true,
      fokus: "abbruch",
    });
    if (!ja) return;
    try {
      altbestandLoeschen();
      setAltbestand(null);
      setQuittung("Die Sammlungen sind von diesem Gerät gelöscht.");
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="weiche-weg" aria-labelledby="weg-meldekopf">
      <h2 id="weg-meldekopf">Bögen sammeln (Meldekopf)</h2>
      <p className="hinweis">
        Für Meldeköpfe, Bereitstellungsräume und Zugführer gibt es eine eigene App: eintreffende Bögen sammeln,
        Stärke und Sofortbedarf zählen, Lagemonitor, Sammel-PDF und Lageblatt. Sie liest die QR-Codes, Links und
        PDF-Dateien dieses Bogens.
      </p>
      <div className="aktionen">
        <a className="datei-knopf primaer meldekopf-link" href={MELDEKOPF_URL} target="_blank" rel="noopener noreferrer">
          Meldekopf-App öffnen ↗
        </a>
      </div>
      {altbestand && (
        <div className="meldekopf-altbestand" role="status">
          <p className="hinweis warnung-text">
            Auf diesem Gerät liegen noch {altbestandText(altbestand)} aus der Zeit, als diese App selbst sammelte. Hier
            lassen sie sich nicht mehr öffnen. In die Meldekopf-App kommen sie über eine Datensicherung: hier erstellen,
            dort unter „Daten“ einspielen. Die Datenschutzfrist von 90 Tagen gilt weiter.
          </p>
          <div className="aktionen">
            <button type="button" onClick={() => void sichern()}>Datensicherung erstellen…</button>
            <button type="button" className="gefahr" onClick={() => void loeschen()}>Sammlungen von diesem Gerät löschen…</button>
          </div>
        </div>
      )}
      {quittung && <p className="hinweis" role="status">{quittung}</p>}
      {fehler && <p className="fehler" role="alert">{fehler}</p>}
      {erststartHinweis}
    </section>
  );
}
