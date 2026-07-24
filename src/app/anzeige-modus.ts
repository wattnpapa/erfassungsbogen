/**
 * Anzeigemodus der Oberfläche — drei Umgebungen, drei Darstellungen:
 *  - „standard": die normale Ansicht.
 *  - „feld":     große Tippziele + maximaler Kontrast für draußen
 *                (Handschuhe, pralle Sonne). Vorher der „Feld-Modus"-Schalter.
 *  - „nacht":    gedimmte, warme Darstellung für Nachteinsätze (Zelt,
 *                Fahrzeugkabine) — blendet nicht und schont die Dunkeladaption.
 *
 * Technisch nur eine Klasse auf <html> (feld-modus / nacht-modus), das Styling
 * liegt in index.html; die Wahl bleibt im Gerätespeicher.
 */

export type AnzeigeModus = "standard" | "feld" | "nacht";

const SPEICHER_SCHLUESSEL = "eeb.anzeigemodus.v1";
/** Vorgänger-Schalter (nur Feld-Modus) — wird beim ersten Lesen übernommen. */
const ALT_FELDMODUS = "eeb.feldmodus.v1";

export const ANZEIGE_MODI: { modus: AnzeigeModus; label: string; titel: string }[] = [
  { modus: "standard", label: "Standard", titel: "Normale Darstellung" },
  { modus: "feld", label: "Feld", titel: "Große Tippziele und hoher Kontrast für den Einsatz draußen" },
  { modus: "nacht", label: "Nacht", titel: "Gedimmte, warme Darstellung für Nachteinsätze — blendet nicht" },
];

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

export function anzeigeModus(): AnzeigeModus {
  const s = speicher();
  const wert = s?.getItem(SPEICHER_SCHLUESSEL);
  if (wert === "standard" || wert === "feld" || wert === "nacht") return wert;
  return s?.getItem(ALT_FELDMODUS) === "1" ? "feld" : "standard";
}

function anwenden(m: AnzeigeModus): void {
  const klassen = document.documentElement.classList;
  klassen.toggle("feld-modus", m === "feld");
  klassen.toggle("nacht-modus", m === "nacht");
}

/** Eigenes Event, damit mehrere Schalter-Instanzen (Kopf + Fußzeile) synchron bleiben. */
export const ANZEIGE_MODUS_EVENT = "eeb-anzeigemodus";

export function anzeigeModusSetzen(m: AnzeigeModus): void {
  speicher()?.setItem(SPEICHER_SCHLUESSEL, m);
  anwenden(m);
  window.dispatchEvent(new CustomEvent<AnzeigeModus>(ANZEIGE_MODUS_EVENT, { detail: m }));
}

/** Beim App-Start die gespeicherte Wahl anwenden (vor dem ersten Render). */
export function wendeAnzeigeModusAn(): void {
  anwenden(anzeigeModus());
}
