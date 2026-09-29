/**
 * Schritt 2 — Einsatz: Zeitraum, Ort/Auftrag, Beginn und Ende sowie die
 * Übungs-Kennzeichnung.
 */

import {
  Einsatz,
  datumAusIso,
  datumZuIso,
  zeitpunktAusIso,
  zeitpunktZuIso,
} from "@bos/eeb-format/model";
import { DATENSCHUTZFRIST_TAGE } from "@bos/eeb-format/datenschutzfrist";
import { useRef } from "react";
import { heuteDatum, pruefpunkte } from "../hilfen";
import { Feld, Hinweise, type SchrittProps } from "./bausteine";

export function SchrittEinsatz({ bogen, aendern }: SchrittProps) {
  const ez = bogen.einsatz;
  const setEz = (p: Partial<Einsatz>) => aendern({ einsatz: { ...ez, ...p } });
  const jetztLokal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  /**
   * „Bis" folgt „von", solange niemand es angefasst hat. Das Datenmodell
   * verlangt für „bis" ein Datum (im QR ein fester uint16, kein „offen") —
   * die Vorbelegung ist also nicht zu vermeiden, aber sie soll wenigstens
   * nicht hinter dem Beginn zurückbleiben: Wer den Beginn auf übermorgen
   * setzt, bekam vorher „bis liegt vor von" als Hinweis zu einem Feld, das
   * er nie berührt hat.
   */
  const bisFolgtVon = ez.zeitraumBis === ez.zeitraumVon;
  /**
   * Zuletzt eingetragene Zeiten, solange der Schritt offen ist. Ein
   * versehentliches Ab- und Wiederanhaken setzte vorher „jetzt" und die
   * korrigierte Zeit war ohne Hinweis weg (Audit Runde 2, R2-E6). „Jetzt"
   * gibt es nur beim ersten Anhaken.
   */
  const zuletzt = useRef<{ einsatzbeginn?: number; einsatzende?: number }>({});
  const zeitUmschalten = (feld: "einsatzbeginn" | "einsatzende", an: boolean) => {
    if (an) {
      setEz({ [feld]: zuletzt.current[feld] ?? zeitpunktAusIso(jetztLokal()) });
    } else {
      zuletzt.current[feld] = ez[feld];
      setEz({ [feld]: undefined });
    }
  };
  return (
    <section className="karte">
      <h2>2. Einsatz</h2>
      {/* Abgrenzung zur „Einsatz-Sammlung" der Startseite: hier geht es um den
          Auftrag der EIGENEN Einheit, nicht ums Sammeln fremder Bögen. */}
      {/* Ehrlich zur Vorbelegung: Das Format kennt kein offenes Ende, „bis" ist
          deshalb mit dem Tag des Beginns vorbelegt. Vorher hieß es hier, das
          Feld dürfe offen bleiben — und stand doch mit dem heutigen Datum da. */}
      <p className="hinweis">
        Wofür deine Einheit gemeldet wird — Einsatz oder Übung. „Zeitraum bis" ist mit dem Tag des
        Beginns vorbelegt; steht das Ende noch nicht fest, den Vorschlag einfach stehen lassen und
        später nachtragen.
      </p>
      {/* Klasse „datum" statt „schmal": In 112 px stand vom Datum nur Tag und
          Monat, das Jahr war abgeschnitten — ein Vorjahresbogen fiel nicht auf.
          Auf dem Telefon stehen die Datumsfelder in voller Breite untereinander
          (index.html, Audit Runde 2, R2-H8). */}
      <div className="zeile">
        <Feld titel="Zeitraum von" klasse="datum">
          <input
            type="date"
            value={datumZuIso(ez.zeitraumVon)}
            onChange={(e) => {
              const zeitraumVon = datumAusIso(e.target.value);
              setEz({ zeitraumVon, ...(bisFolgtVon ? { zeitraumBis: zeitraumVon } : {}) });
            }}
          />
        </Feld>
        <Feld titel={bisFolgtVon ? "Zeitraum bis (Vorschlag: wie Beginn)" : "Zeitraum bis"} klasse="datum">
          <input type="date" value={datumZuIso(ez.zeitraumBis)} onChange={(e) => setEz({ zeitraumBis: datumAusIso(e.target.value) })} />
        </Feld>
        <Feld titel="Einsatzort / Auftrag">
          <input id="feld-ort-auftrag" value={ez.ortAuftrag} onChange={(e) => setEz({ ortAuftrag: e.target.value })} placeholder="z. B. Fernmeldebauübung Kabelblitz" />
        </Feld>
      </div>
      {/* Die Kästchen setzen einen Zeitstempel — das stand nirgends. Ein
          Kästchen „Einsatzende" las sich als Frage, ob der Einsatz ein Ende
          hat, und ein versehentlicher Haken schickte mit dem QR-Code einen
          Abmelde-Zeitpunkt mit. */}
      <div className="zeile">
        <label className="inline">
          <input
            type="checkbox"
            checked={ez.einsatzbeginn != null}
            onChange={(e) => zeitUmschalten("einsatzbeginn", e.target.checked)}
          />
          Einsatzbeginn eintragen
        </label>
        {ez.einsatzbeginn != null && (
          <Feld titel="Einsatzbeginn (Datum, Uhrzeit)" klasse="mittel datum">
            <input type="datetime-local" value={zeitpunktZuIso(ez.einsatzbeginn)} onChange={(e) => setEz({ einsatzbeginn: zeitpunktAusIso(e.target.value) })} />
          </Feld>
        )}
        <label className="inline">
          <input
            type="checkbox"
            checked={ez.einsatzende != null}
            onChange={(e) => zeitUmschalten("einsatzende", e.target.checked)}
          />
          Einsatzende eintragen
        </label>
        {ez.einsatzende != null && (
          <Feld titel="Einsatzende (Datum, Uhrzeit)" klasse="mittel datum">
            <input type="datetime-local" value={zeitpunktZuIso(ez.einsatzende)} onChange={(e) => setEz({ einsatzende: zeitpunktAusIso(e.target.value) })} />
          </Feld>
        )}
      </div>
      {/* Vorher: „meist trägt das der Meldekopf … ein". Die Zeiten des
          Meldekopfs bleiben aber in seiner Sammlung und kommen nie in diesen
          Bogen zurück — wer dem Hinweis folgte, hatte im eigenen PDF keine
          Einsatzzeiten (Audit Runde 2, R2-W4). */}
      <p className="hinweis">
        Setzt die aktuelle Uhrzeit, danach änderbar. Für den eigenen Bogen (Nachweis, Freistellung,
        Abrechnung) hier eintragen — der Meldekopf führt seine Eintreff- und Abrückzeiten getrennt,
        sie kommen nicht in diesen Bogen zurück.
      </p>
      {/* Schritt-Index 1 = Einsatz (siehe SCHRITTE in app.tsx): „bis vor von"
          und „Ende vor Beginn" erschienen vorher auf Schritt 1, 3 und in der
          Übersicht — überall, nur nicht dort, wo der Fehler gemacht wird. */}
      <Hinweise punkte={pruefpunkte(bogen, false, heuteDatum())} aktuellerSchritt={1} />
      {/* Übung als Eigenschaft des BOGENS, nicht der App: die Kennzeichnung
          reist im QR mit und erscheint auch auf dem empfangenden Gerät —
          ein Geräte-Modus könnte das nicht leisten. Nicht gesetzt = Feld
          fehlt komplett (kein `false` im QR/JSON). */}
      <div className="zeile">
        <label className="inline">
          <input
            type="checkbox"
            checked={bogen.uebung === true}
            onChange={(e) => aendern({ uebung: e.target.checked || undefined })}
          />
          Dies ist eine Übung
        </label>
      </div>
      {bogen.uebung ? (
        <>
          <p className="hinweis">
            Der Bogen wird überall als Übung gekennzeichnet: Störer in der App (auch nach dem
            Scannen auf anderen Geräten), Wasserzeichen „ÜBUNG" im PDF und Markierung in der
            Einsatz-Sammlung. Im Personal-Schritt lassen sich zusätzlich Beispielnamen erzeugen.
          </p>
          {/* Die Ausnahme von der Datenschutzfrist hängt allein an diesem Haken —
              wer ihn setzt, soll wissen, dass Namen dann unbefristet lesbar bleiben. */}
          <p className="warnung">
            Übungsbögen unterliegen <strong>keiner Datenschutzfrist</strong>: Namen, Funktionen,
            Qualifikationen und Erreichbarkeiten bleiben unbefristet lesbar — hier und auf jedem
            Gerät, das den Bogen empfängt. Echte Personaldaten nur eintragen, wenn das vertretbar ist.
          </p>
        </>
      ) : (
        // Eingeklappt: 48 Wörter bei jedem Besuch des Schritts wurden unter
        // Zeitdruck nicht gelesen und schoben „Weiter" aus dem Blick (Audit
        // „Stress und Unterbrechung", S4). Die Zusammenfassung trägt die
        // Kernaussage, der Rest steht einen Tipp tiefer.
        <details className="hinweis frist-erklaerung">
          <summary>Datenschutzfrist: Namen werden nach {DATENSCHUTZFRIST_TAGE} Tagen anonymisiert</summary>
          <p>
            {DATENSCHUTZFRIST_TAGE} Tage nach der letzten Änderung zeigt die App Namen, Funktionen,
            Qualifikationen und Erreichbarkeiten dieses Bogens nur noch anonymisiert — auf diesem
            Gerät und auf empfangenden Geräten. Stärke und Summen bleiben erhalten. Als Übung
            gekennzeichnete Bögen sind ausgenommen.
          </p>
        </details>
      )}
    </section>
  );
}
