/**
 * Block „Übergabe und Abschluss" der Einsatzansicht (R18-A6, R18-A7).
 *
 * Am Einsatzende blieb es dem Helfer überlassen, an alle Wege zu denken (Sammel-PDF, Lageblatt, Tabellen, Sicherung);
 * die Ansicht nannte weder den Sicherungsstand noch ein Ende, und das Papier-Kästchen „übertragen [ ]" hatte am Gerät
 * kein Gegenstück. Der Block zeigt je Weg, ob er schon gegangen wurde, den Stand der Datensicherung, vermerkt die
 * Übergabe (Zeit und Empfänger) und markiert den Einsatz als beendet. Die Vermerke liegen im App-eigenen Schlüssel
 * `eeb.abschluss.v1` (einsatz-abschluss.ts), nicht in der Sammlung.
 *
 * Eigene Datei, aber bewusst NICHT per `React.lazy` nachgeladen: Als eigener nachgeladener Baustein zog er die Aufteilung der
 * gemeinsamen Bausteine durcheinander (Einheitentabelle, Auswertung, Meldungsvergleich rutschten ins Startbündel: +26 KB gemessen,
 * ADR-003 Aufnahmeregel 5); statisch eingebunden bleibt das Startbündel unter dem Budget (+7 KB).
 */
import type { Einsatzsammlung } from "@bos/meldekopf/einsaetze";
import { frageFelder } from "./dialoge";
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import { abschlussLaden, abschlussOffen, abschlussSetzen, abschlussUebergabeText, UEBERGABE_AN_MAX } from "./einsatz-abschluss";
import { exportStaendeLaden, exportZeitKurz, lageblattStandLaden, weitergabeStandLaden } from "./export-stand";
import { letzteSicherung, sicherungStandText } from "./sicherung";

export default function AbschlussBlock({ einsatz, onGeaendert }: { einsatz: Einsatzsammlung; onGeaendert: () => void }) {
  const a = abschlussLaden(einsatz.id);
  const staende = exportStaendeLaden(einsatz.id);
  const weitergabe = weitergabeStandLaden(einsatz.id);
  const lageblatt = lageblattStandLaden(einsatz.id);
  const gesichert = letzteSicherung();
  const bekannt = () => [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id);

  const wege = [
    { name: "Weitergabe-Datei (Sammel-PDF)", getan: weitergabe != null, zeit: weitergabe?.zeitpunkt },
    { name: "Lageblatt", getan: lageblatt != null, zeit: lageblatt?.zeitpunkt },
    { name: "Übersicht als CSV", getan: staende.csv != null, zeit: staende.csv?.zeitpunkt },
    { name: "Excel-Liste", getan: staende.xlsx != null, zeit: staende.xlsx?.zeitpunkt },
    { name: "Datensicherung", getan: gesichert != null, zeit: gesichert ?? undefined },
  ];
  const offen = abschlussOffen(wege);

  async function uebergabeVermerken() {
    const w = await frageFelder({
      titel: "Übergabe vermerken",
      hinweis: <p>Wie das Kästchen „übertragen [ ]" auf dem Papier: Die Übergabe ist angekommen. Die Uhrzeit ist jetzt.</p>,
      felder: [{ name: "an", label: "An (Name oder Stelle)", optional: true, platzhalter: "z. B. Stab, Ablösung" }],
      ok: "Vermerken",
    });
    if (!w) return;
    if (abschlussSetzen(einsatz.id, { uebergabeAm: Date.now(), uebergabeAn: (w.an ?? "").slice(0, UEBERGABE_AN_MAX) }, bekannt())) onGeaendert();
  }

  function aendern(feld: "uebergabe" | "beendet", setzen: boolean) {
    const ok =
      feld === "beendet"
        ? abschlussSetzen(einsatz.id, { beendetAm: setzen ? Date.now() : null }, bekannt())
        : abschlussSetzen(einsatz.id, { uebergabeAm: null, uebergabeAn: null }, bekannt());
    if (ok) onGeaendert();
  }

  return (
    <section className="karte einsatz-abschluss" aria-labelledby="abschluss-titel">
      <h2 id="abschluss-titel">Übergabe und Abschluss</h2>
      {a.beendetAm != null && (
        <p className="meldung einsatz-beendet" role="status">
          <strong>Einsatz beendet</strong> {exportZeitKurz(a.beendetAm)}
          {offen.length > 0 ? ` — noch offen: ${offen.join(", ")}` : " — alle Wege gegangen"}.{" "}
          <button type="button" className="link" onClick={() => aendern("beendet", false)}>Wieder öffnen</button>
        </p>
      )}
      {/* Absätze statt Liste: Die Liste der Einheiten ist die einzige Liste der Seite (Vorleser, Tests). */}
      <div className="abschluss-liste">
        {wege.map((w) => (
          <p key={w.name} className={w.getan ? "getan" : "offen"}>
            <span aria-hidden="true">{w.getan ? "✓" : "○"}</span> {w.name}:{" "}
            {w.getan && w.zeit != null ? `${w.name === "Datensicherung" ? "zuletzt gesichert" : "erzeugt"} ${exportZeitKurz(w.zeit)}` : "noch nicht"}
            {w.name === "Datensicherung" && gesichert != null && sicherungStandText() ? ` · ${sicherungStandText()}` : ""}
          </p>
        ))}
      </div>
      <p className="abschluss-uebergabe">
        {a.uebergabeAm != null ? (
          <>
            <span aria-hidden="true">✓</span> {abschlussUebergabeText(a, exportZeitKurz)}.{" "}
            <button type="button" className="link" onClick={() => aendern("uebergabe", false)}>Vermerk entfernen</button>
          </>
        ) : (
          <>
            <span aria-hidden="true">○</span> Übergabe noch nicht vermerkt.{" "}
            <button type="button" className="link" onClick={() => void uebergabeVermerken()}>Übergabe vermerken…</button>
          </>
        )}
      </p>
      {a.beendetAm == null && (
        <button type="button" onClick={() => aendern("beendet", true)}>Einsatz als beendet markieren</button>
      )}
    </section>
  );
}
