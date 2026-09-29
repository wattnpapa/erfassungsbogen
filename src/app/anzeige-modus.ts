/**
 * Anzeigemodus der Oberfläche — vier Umgebungen, vier Darstellungen:
 *  - „standard": die normale, helle Ansicht.
 *  - „dunkel":   neutrale dunkle Darstellung (abgedunkelter Raum, Dienstabend).
 *  - „feld":     große Tippziele + maximaler Kontrast für draußen
 *                (Handschuhe, pralle Sonne). Vorher der „Feld-Modus"-Schalter.
 *  - „nacht":    gedimmte, warme Darstellung für Nachteinsätze (Zelt,
 *                Fahrzeugkabine) — blendet nicht und schont die Dunkeladaption.
 *
 * Die Systemeinstellung des Geräts ist nur die Vorgabe beim ersten Start:
 * Ohne gespeicherte Wahl startet die App mit „dunkel", wenn das Gerät auf
 * dunkel steht (prefers-color-scheme), sonst mit „standard" — der Kaltstart
 * bei Nacht soll nicht mit einem weißen Bildschirm beginnen. Eine einmal
 * getroffene Wahl — auch „standard" — geht immer vor und wird nie automatisch
 * überschrieben; auch ein späterer Wechsel der Systemeinstellung schaltet eine
 * laufende Sitzung nicht um. Ein automatisches, nur halb angewandtes Dunkel
 * (dunkle Fläche, schwarze Schrift) hat auf Android-Geräten genau die
 * Lesbarkeit gekostet, für die dieser Schalter da ist — deshalb setzt die
 * Vorgabe denselben, vollständig belegten Dunkel-Modus, den auch der Schalter
 * setzt, und nichts Automatisches daneben.
 *
 * Technisch nur eine Klasse auf <html> (dunkel-/feld-/nacht-modus), das Styling
 * liegt in index.html; die Wahl bleibt im Gerätespeicher. Das Boot-Skript in
 * index.html wendet dieselbe Regel vor dem ersten Malen an.
 */

export type AnzeigeModus = "standard" | "dunkel" | "feld" | "nacht";

const SPEICHER_SCHLUESSEL = "eeb.anzeigemodus.v1";
/** Vorgänger-Schalter (nur Feld-Modus) — wird beim ersten Lesen übernommen. */
const ALT_FELDMODUS = "eeb.feldmodus.v1";

export const ANZEIGE_MODI: { modus: AnzeigeModus; label: string; titel: string }[] = [
  { modus: "standard", label: "Standard", titel: "Normale, helle Darstellung — bleibt hell, auch wenn das Gerät auf dunkel steht" },
  { modus: "dunkel", label: "Dunkel", titel: "Heller Text auf dunklem Grund für abgedunkelte Räume" },
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

/** Steht das Gerät auf dunkel? Ohne matchMedia (alte Webviews, Tests): nein. */
function systemDunkel(): boolean {
  try {
    return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  } catch {
    return false;
  }
}

export function anzeigeModus(): AnzeigeModus {
  const s = speicher();
  const wert = s?.getItem(SPEICHER_SCHLUESSEL);
  if (wert === "standard" || wert === "dunkel" || wert === "feld" || wert === "nacht") return wert;
  if (s?.getItem(ALT_FELDMODUS) === "1") return "feld";
  return systemDunkel() ? "dunkel" : "standard";
}

function anwenden(m: AnzeigeModus): void {
  const klassen = document.documentElement.classList;
  klassen.toggle("dunkel-modus", m === "dunkel");
  klassen.toggle("feld-modus", m === "feld");
  klassen.toggle("nacht-modus", m === "nacht");
  themeFarbeAbgleichen();
}

/** Kopfbalken des Nacht-Modus (index.html, `.nacht-modus { --kopf-fond }`). */
export const NACHT_KOPF_FOND = "#221f16";
/** Kennfarbe ohne offenen Bogen (index.html, Meta-Tag und `--akzent`). */
const STANDARD_THEME_FARBE = "#12275e";

/**
 * Browserleiste (`<meta name="theme-color">`) an Modus und Organisation
 * angleichen. Sie trug auch nachts die Kennfarbe — Android färbt damit
 * Status- und Adressleiste ein, bei roter Kennfarbe rot, über dem warm
 * gedimmten Bild (Audit Runde 2, R2-L6). Nachts nimmt sie deshalb den
 * dunklen Kopf-Ton; Standard, Feld und Dunkel behalten die Kennfarbe, wie
 * ihr Kopfbalken. Die Kennfarbe steht, sobald ein Bogen offen ist, als
 * `--org-akzent` auf `<html>` (org-farben.ts ruft hierher zurück).
 */
export function themeFarbeAbgleichen(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) return;
  const wurzel = document.documentElement;
  meta.content = wurzel.classList.contains("nacht-modus")
    ? NACHT_KOPF_FOND
    : wurzel.style.getPropertyValue("--org-akzent").trim() || STANDARD_THEME_FARBE;
}

/** Eigenes Event, damit mehrere Schalter-Instanzen (Kopf + Fußzeile) synchron bleiben. */
export const ANZEIGE_MODUS_EVENT = "eeb-anzeigemodus";

export function anzeigeModusSetzen(m: AnzeigeModus): void {
  speicher()?.setItem(SPEICHER_SCHLUESSEL, m);
  ohneUebergang(() => anwenden(m));
  window.dispatchEvent(new CustomEvent<AnzeigeModus>(ANZEIGE_MODUS_EVENT, { detail: m }));
}

/**
 * Die Umschaltung springt: Knöpfe überblenden ihre Schriftfarbe, der
 * Seitengrund schlägt sofort um. Für die Dauer des Übergangs stünde die
 * Schrift des alten Modus auf dem Grund des neuen — bei Knöpfen ohne eigene
 * Fläche („Impressum") ist sie dabei praktisch unsichtbar. Die Klasse
 * `modus-wechsel` (index.html) setzt alle Übergänge auf 0 ms; der erzwungene
 * Stilabruf übernimmt die neuen Farben noch im selben Frame, danach darf sich
 * die Oberfläche wieder bewegen.
 */
function ohneUebergang(umschalten: () => void): void {
  const klassen = document.documentElement.classList;
  klassen.add("modus-wechsel");
  umschalten();
  void document.documentElement.offsetHeight; // Stil jetzt berechnen
  requestAnimationFrame(() => klassen.remove("modus-wechsel"));
}

/** Beim App-Start die gespeicherte Wahl anwenden (vor dem ersten Render). */
export function wendeAnzeigeModusAn(): void {
  anwenden(anzeigeModus());
}
