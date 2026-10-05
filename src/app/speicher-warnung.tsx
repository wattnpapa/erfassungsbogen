/**
 * Hinweis auf einen fast vollen Gerätespeicher — dort, wo gearbeitet wird.
 *
 * Die Warnung ab 70 % stand nur im Dialog „Datensicherung". Startseite und
 * Einsatzansicht blieben bei vollem Speicher stumm, bis ein Scan nicht mehr
 * abgelegt werden konnte (Audit Runde 2, R2-O7). Die Zeile nennt, wo der
 * Platz steckt, und dass nur Löschen Platz schafft.
 */
import { useMemo } from "react";
import { speicherBelegung, speicherFehlerArt, speicherGroessteSammlungen, speicherText } from "./eintrag-zeiten";
import { leseSchreibFehler } from "./speicher-schonend";

/** Gilt als voll: auf ganze Prozent gerundet 100 % (R3-O4). */
export function istVoll(b: { anteil: number }): boolean {
  return b.anteil >= 0.995;
}

/** Ab diesem Anteil warnt die App (Fußzeile: ab 70 % gelb, hier ab 80 % sichtbar). */
export const SPEICHER_WARNSCHWELLE = 0.8;

/** Wo der Platz steckt: „„Hochwasser" (41 %), „Übung Mai" im Papierkorb (12 %)". */
export function groessteText(): string {
  const liste = speicherGroessteSammlungen(3).filter((x) => x.anteil >= 0.01);
  if (liste.length === 0) return "";
  return liste
    .map((x) => `„${x.name}"${x.papierkorb ? " im Papierkorb" : ""} (${Math.round(x.anteil * 100)} %)`)
    .join(", ");
}

/**
 * `stand` ist ein beliebiger Wert, der sich ändert, wenn geschrieben wurde
 * (etwa die geladenen Sammlungen) — die Belegung wird nur dann neu gezählt.
 */
export function SpeicherWarnung({ stand }: { stand: unknown }) {
  const b = useMemo(() => speicherBelegung(), [stand]);
  // Je Sammlung einmal serialisieren kostet bei 5 Mio. Zeichen spürbar —
  // nur neu rechnen, wenn sich die Sammlungen geändert haben (R3-O2).
  const groesste = useMemo(() => (b && b.anteil >= SPEICHER_WARNSCHWELLE ? groessteText() : ""), [b]);
  // Beim Lesen ließ sich die Frist-Bereinigung nicht zurückschreiben: die
  // Liste steht trotzdem da, der Speicher nimmt aber nichts an (R3-O2).
  if (leseSchreibFehler()) return <SpeicherNimmtNichtsAn />;
  if (!b || b.anteil < SPEICHER_WARNSCHWELLE) return null;
  return (
    <p className="warnung" role="status">
      {/* Bei 100 % ist „wird er voll" vorbei (R3-O4). */}
      {istVoll(b)
        ? `⚠ Gerätespeicher ist voll: ${speicherText(b)} — die App kann nichts mehr speichern.`
        : `⚠ Gerätespeicher zu ${speicherText(b)} belegt. Wird er voll, kann die App nichts mehr speichern.`}
      {groesste ? ` Am meisten belegen: ${groesste}.` : ""} Platz schafft nur Löschen: nicht mehr
      benötigte Einsätze sichern, in den Papierkorb legen und den Papierkorb leeren.
    </p>
  );
}

/**
 * Der Speicher nimmt gerade nichts an — gezeigt wird der gespeicherte Stand.
 * Unterscheidet den vollen vom gesperrten Speicher, weil nur beim vollen
 * Löschen hilft (R3-O4).
 */
export function SpeicherNimmtNichtsAn() {
  const art = useMemo(() => speicherFehlerArt(), []);
  return art === "gesperrt" ? (
    <p className="warnung" role="alert">
      ⚠ Dieser Browser lässt die App gerade nichts speichern — etwa im privaten Modus oder durch eine
      Datenschutz-Einstellung. Angezeigt wird der gespeicherte Stand; neue Eingaben gehen beim Schließen
      verloren. Speichern für diese Seite erlauben oder ein normales Fenster nutzen; bis dahin Bögen als PDF
      übergeben.
    </p>
  ) : (
    <p className="warnung" role="alert">
      ⚠ Der Speicher dieses Geräts ist voll — angezeigt wird der gespeicherte Stand, Änderungen lassen sich
      nicht speichern. Platz schafft nur Löschen: nicht mehr benötigte Einsätze sichern, in den Papierkorb
      legen und den Papierkorb leeren.
    </p>
  );
}
