/**
 * „Feld-Modus": ein Schalter für den Einsatz draußen — deutlich größere
 * Tippziele und Schrift (Handschuhe, kalte Finger) plus maximaler Kontrast
 * (pralle Sonne auf dem Display). Technisch nur eine Klasse auf <html>,
 * das Styling liegt in index.html; die Wahl bleibt im Gerätespeicher.
 */

const SPEICHER_SCHLUESSEL = "eeb.feldmodus.v1";
const KLASSE = "feld-modus";

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

export function feldModusAktiv(): boolean {
  return speicher()?.getItem(SPEICHER_SCHLUESSEL) === "1";
}

export function feldModusSetzen(an: boolean): void {
  speicher()?.setItem(SPEICHER_SCHLUESSEL, an ? "1" : "0");
  document.documentElement.classList.toggle(KLASSE, an);
}

/** Beim App-Start die gespeicherte Wahl anwenden (vor dem ersten Render). */
export function wendeFeldModusAn(): void {
  document.documentElement.classList.toggle(KLASSE, feldModusAktiv());
}
