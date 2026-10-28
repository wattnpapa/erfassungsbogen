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
import { frageFelder, zeigeHinweis } from "./dialoge";
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import { abschlussLaden, abschlussOffen, abschlussSetzen, abschlussUebergabeText, meldungenSeit, neueMeldungenText, UEBERGABE_AN_MAX } from "./einsatz-abschluss";
import { speicherFehlerArt } from "./eintrag-zeiten";
import { exportStaendeLaden, exportZeitKurz, lageblattStandLaden, neueEintraege, weitergabeStandLaden, type ExportStand } from "./export-stand";
import { letzteSicherung, sicherungStandText } from "./sicherung";

/** Ein Weg des Abschlusses: erledigt? wann? und was seitdem an Meldungen dazukam (R19-W1). */
export interface AbschlussWeg {
  name: string;
  /** Es gibt einen Vermerk UND er ist aktuell (keine Meldung danach). */
  getan: boolean;
  /** Es gibt einen Vermerk, aber seitdem kamen Meldungen. */
  veraltet: boolean;
  zeit?: number;
  neu: number;
  /** Der Stempel stammt nicht von einer Datei dieses Geräts, sondern vom anderen Gerät oder aus der Weitergabe (R19-K8). */
  fremd?: "geraet" | "weitergabe";
}

/** Die Wege Sammel-PDF, Lageblatt, beide CSV, Excel, Datensicherung — mit Stand gegen die Meldungen des Einsatzes. */
export function abschlussWege(einsatz: Einsatzsammlung): AbschlussWeg[] {
  const staende = exportStaendeLaden(einsatz.id);
  const seitStand = (s: ExportStand | null | undefined) => (s ? new Set(neueEintraege(einsatz.eintraege, s).map((e) => e.einheitSchluessel)).size : 0);
  const gesichert = letzteSicherung();
  const weg = (name: string, s: ExportStand | null | undefined): AbschlussWeg => {
    const neu = seitStand(s);
    // Ein übernommener Stempel (Einsatz importiert) belegt keine Datei dieses Geräts: nicht „erzeugt", nicht erledigt.
    return { name, getan: s != null && neu === 0 && !s.herkunft, veraltet: s != null && neu > 0, ...(s ? { zeit: s.zeitpunkt } : {}), ...(s?.herkunft ? { fremd: s.herkunft } : {}), neu };
  };
  const neuSicherung = gesichert != null ? meldungenSeit(einsatz.eintraege, gesichert) : 0;
  return [
    weg("Weitergabe-Datei (Sammel-PDF)", weitergabeStandLaden(einsatz.id)),
    weg("Lageblatt", lageblattStandLaden(einsatz.id)),
    weg("Übersicht als CSV", staende.csv),
    weg("Alle Daten als CSV", staende["csv-detail"]),
    weg("Excel-Liste", staende.xlsx),
    { name: "Datensicherung", getan: gesichert != null && neuSicherung === 0, veraltet: gesichert != null && neuSicherung > 0, ...(gesichert != null ? { zeit: gesichert } : {}), neu: neuSicherung },
  ];
}

/** Quittung am Bildrand mit Rückweg (R19-H11, M12); die Einsatzansicht zeigt sie als eine von mehreren Leisten, immer nur die jüngste. */
export interface AbschlussQuittung {
  text: string;
  /** Nimmt den Vermerk zurück; `false`, wenn der Speicher es nicht zuließ. */
  zurueck: () => boolean;
}

/** Meldung, wenn ein Vermerk des Abschlusses nicht geschrieben werden konnte (R19-O2). */
export function nichtGespeichert(titel: string, was: string): void {
  const ursache = speicherFehlerArt() === "gesperrt" ? "dieser Browser lässt die App nichts speichern" : "der Speicher dieses Geräts ist voll";
  void zeigeHinweis({
    titel,
    text: `${was} ist nicht gespeichert — ${ursache}. Nichts hat sich geändert. Erst sichern (Einsatz weitergeben / sichern), dann Platz schaffen: Papierkorb leeren oder alte Einsätze endgültig löschen.`,
  });
}

export default function AbschlussBlock({ einsatz, onGeaendert, onQuittung }: { einsatz: Einsatzsammlung; onGeaendert: () => void; onQuittung?: (q: AbschlussQuittung | null) => void }) {
  const a = abschlussLaden(einsatz.id);
  const gesichert = letzteSicherung();
  const bekannt = () => [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id);

  const wege = abschlussWege(einsatz);
  const offen = abschlussOffen(wege);
  // Vermerke gegen den Stand der Lage (R19-D1, W1): Kamen nach der Übergabe oder dem Ende Meldungen, gelten sie nicht mehr.
  const uebergabeNeu = a.uebergabeAm != null ? meldungenSeit(einsatz.eintraege, a.uebergabeAm) : 0;
  const beendetNeu = a.beendetAm != null ? meldungenSeit(einsatz.eintraege, a.beendetAm) : 0;
  const ohneDatei = wege.slice(0, 5).every((w) => w.zeit == null || w.fremd != null);

  const setQuittung = (q: AbschlussQuittung | null) => onQuittung?.(q);

  async function uebergabeVermerken() {
    const w = await frageFelder({
      titel: "Übergabe vermerken",
      hinweis: <p>Du hast die Lage mündlich, auf Papier oder als Datei übergeben — hier halten Uhrzeit und Empfänger das fest. Es wird nichts verschickt.</p>,
      felder: [{ name: "an", label: "An (Name oder Stelle, freiwillig)", optional: true, platzhalter: "z. B. Stab, Ablösung" }],
      ok: "Vermerken",
    });
    if (!w) return;
    const vorher = abschlussLaden(einsatz.id);
    const an = (w.an ?? "").slice(0, UEBERGABE_AN_MAX).trim();
    if (abschlussSetzen(einsatz.id, { uebergabeAm: Date.now(), uebergabeAn: an }, bekannt())) {
      onGeaendert();
      setQuittung({
        text: `Übergabe vermerkt${an ? ` an ${an}` : " — ohne Empfänger"}.`,
        zurueck: () =>
          abschlussSetzen(einsatz.id, vorher.uebergabeAm != null ? { uebergabeAm: vorher.uebergabeAm, uebergabeAn: vorher.uebergabeAn ?? null } : { uebergabeAm: null, uebergabeAn: null }, bekannt()),
      });
    } else nichtGespeichert("Übergabe nicht vermerkt", "Der Vermerk");
  }

  function aendern(feld: "uebergabe" | "beendet", setzen: boolean) {
    const ok =
      feld === "beendet"
        ? abschlussSetzen(einsatz.id, { beendetAm: setzen ? Date.now() : null }, bekannt())
        : abschlussSetzen(einsatz.id, { uebergabeAm: null, uebergabeAn: null }, bekannt());
    if (ok) {
      onGeaendert();
      if (feld === "beendet" && setzen) setQuittung({ text: "Einsatz beendet.", zurueck: () => abschlussSetzen(einsatz.id, { beendetAm: null }, bekannt()) });
      else setQuittung(null);
    } else nichtGespeichert(feld === "beendet" ? (setzen ? "Einsatz nicht beendet" : "Einsatz nicht geöffnet") : "Vermerk nicht entfernt", "Die Änderung");
  }

  const beendetZeile = a.beendetAm != null && (
    <p className="meldung einsatz-beendet" role="status">
      <strong>Einsatz beendet</strong> {exportZeitKurz(a.beendetAm)}
      {offen.length > 0 ? ` — noch offen: ${offen.join(", ")}` : " — alle Wege gegangen"}.
      {beendetNeu > 0 && <strong> Nicht mehr aktuell: seitdem {neueMeldungenText(beendetNeu)}.</strong>}{" "}
      <button type="button" className="link" onClick={() => aendern("beendet", false)}>Wieder öffnen</button>
    </p>
  );

  return (
    <section className="karte einsatz-abschluss" id="abschluss" aria-labelledby="abschluss-titel">
      <h2 id="abschluss-titel">Übergabe und Abschluss</h2>
      {/* Absätze statt Liste: Die Liste der Einheiten ist die einzige Liste der Seite (Vorleser, Tests). */}
      <div className="abschluss-liste">
        {wege.map((w) => (
          <p key={w.name} className={w.getan ? "getan" : "offen"}>
            <span aria-hidden="true">{w.getan ? "✓" : w.veraltet ? "⚠" : "○"}</span> {w.name}:{" "}
            {w.zeit != null
              ? `${w.name === "Datensicherung" ? "zuletzt gesichert" : w.fremd === "geraet" ? "vom anderen Gerät übernommen, hier nicht erzeugt" : w.fremd === "weitergabe" ? "ab der Weitergabe gerechnet, hier nicht erzeugt" : "erzeugt"} ${exportZeitKurz(w.zeit)}`
              : "noch nicht"}
            {w.veraltet ? ` — seitdem ${neueMeldungenText(w.neu)}, nicht mehr aktuell` : ""}
            {w.name === "Datensicherung" && gesichert != null && sicherungStandText() ? ` · ${sicherungStandText()}` : ""}
          </p>
        ))}
      </div>
      <p className="abschluss-uebergabe">
        {a.uebergabeAm != null ? (
          <>
            <span aria-hidden="true">{uebergabeNeu > 0 ? "⚠" : "✓"}</span> {abschlussUebergabeText(a, exportZeitKurz)}
            {a.uebergabeAn ? "" : " (ohne Empfänger)"}
            {ohneDatei ? ", ohne Datei" : ""}
            {uebergabeNeu > 0 ? `. Nicht mehr aktuell: seitdem ${neueMeldungenText(uebergabeNeu)}` : ""}.{" "}
            <button type="button" className="link" onClick={() => aendern("uebergabe", false)}>Vermerk entfernen</button>
            {uebergabeNeu > 0 && (
              <>
                {" "}
                <button type="button" className="link" onClick={() => void uebergabeVermerken()}>Neu vermerken…</button>
              </>
            )}
          </>
        ) : (
          <>
            <span aria-hidden="true">○</span> Übergabe noch nicht vermerkt.{" "}
            <button type="button" className="link" onClick={() => void uebergabeVermerken()}>Übergabe vermerken…</button>
          </>
        )}
      </p>
      {/* Das Ergebnis steht dort, wo der Finger war — der Knopf „beenden" wird durch die Zeile ersetzt (R19-M12). */}
      {a.beendetAm == null ? (
        <button type="button" onClick={() => aendern("beendet", true)}>Einsatz als beendet markieren</button>
      ) : (
        beendetZeile
      )}
    </section>
  );
}
