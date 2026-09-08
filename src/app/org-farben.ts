/**
 * Kennfarben je Organisation — die EINE Quelle für PDF und Oberfläche.
 *
 * Der PDF-Bogen färbt Kopfbalken/QR-Überschriften damit ein; die App leitet
 * daraus ihre Akzentfarbe ab (CSS-Variablen), sodass man schon an der Farbe
 * sieht, in welcher Organisation man gerade unterwegs ist. Standard ist das
 * THW-Blau — praktisch die bisherige Akzentfarbe.
 */

import { OrganisationsTyp } from "@bos/eeb-format/model";

/**
 * Kennfarbe je Organisation: färbt im PDF Kopfbalken, Organisationsangabe und die
 * QR-Überschriften, sodass man schon am aufgeschlagenen Bogen sieht, von wem er
 * stammt. Wo eine eindeutige Hausfarbe existiert (THW-Blau, Feuerrot,
 * DRK-Rot), ist sie übernommen; sonst eine gut unterscheidbare, an die
 * Organisation angelehnte Farbe.
 *
 * Die Werte sind bis auf das Weiß des Rettungsdienstes dunkel gehalten, damit
 * der Kopfbalken weiße Schrift tragen kann; helle Kennfarben schaltet
 * {@link orgFarbe} automatisch auf dunkle Schrift um. Die drei Rottöne (Feuerwehr, DRK, Malteser) und die beiden Grüntöne (Polizei,
 * Bundespolizei) unterscheiden sich in Helligkeit bzw. Sättigung; daneben steht
 * ohnehin der Name der Organisation.
 */
const ORG_FARBEN: Partial<Record<OrganisationsTyp, string>> = {
  [OrganisationsTyp.THW]: "#20214f", // THW-Blau (RAL 5002 Ultramarinblau)
  [OrganisationsTyp.FEUERWEHR]: "#c8102e", // Feuerrot (RAL 3000)
  [OrganisationsTyp.POLIZEI]: "#2d6a2e", // Polizeigrün, heller als die Bundespolizei
  [OrganisationsTyp.BUNDESPOLIZEI]: "#00694e", // Grün in der BGS-Tradition
  [OrganisationsTyp.DRK]: "#e30613", // DRK-Rot
  [OrganisationsTyp.JUH]: "#1a1a1a", // Johanniter-Schwarz
  [OrganisationsTyp.MHD]: "#7d1128", // Malteser-Bordeaux
  [OrganisationsTyp.ASB]: "#a34700", // dunkles ASB-Orange
  [OrganisationsTyp.DLRG]: "#9c6b00", // dunkles DLRG-Gelb
  [OrganisationsTyp.BUNDESWEHR]: "#4b5320", // Oliv
  [OrganisationsTyp.RETTUNGSDIENST]: "#ffffff", // Weiß (Rettungsdienst-Fahrzeuglackierung)
  [OrganisationsTyp.SONSTIGE]: "#4d4d4d", // neutrales Grau
};

const NEUTRAL = "#4d4d4d";

/** Relative Helligkeit 0–1 eines #rrggbb-Werts (nach WCAG, ohne Gamma-Korrektur — reicht hier). */
function helligkeit(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Kennfarben der Organisation für den Bogen:
 * - `balken`  = Füllung des Kopfbalkens,
 * - `schrift` = Text IM Kopfbalken (dunkel, sobald die Füllung zu hell für Weiß ist —
 *   der Rettungsdienst ist weiß, da wäre weiße Schrift unsichtbar),
 * - `akzent`  = farbiger Text auf weißem Papier (Organisationsangabe, QR-Überschriften);
 *   fällt bei hellen Kennfarben auf ein lesbares Neutralgrau zurück.
 *
 * Unbekannte Organisationen bekommen das Grau der „Sonstigen".
 */
export function orgFarbe(org: OrganisationsTyp): { balken: string; schrift: string; akzent: string } {
  const balken = ORG_FARBEN[org] ?? NEUTRAL;
  const hell = helligkeit(balken) > 0.6;
  return { balken, schrift: hell ? "#000000" : "#ffffff", akzent: hell ? NEUTRAL : balken };
}

// --- Ableitung der Oberflächen-Akzentfarbe -------------------------------

type Hsl = { h: number; s: number; l: number }; // h 0–360, s/l 0–1

function hexZuHsl(hex: string): Hsl {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslZuHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = (
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  ) as [number, number, number];
  const kanal = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${kanal(r)}${kanal(g)}${kanal(b)}`;
}

const klemme = (v: number) => Math.min(1, Math.max(0, v));

// --- Kontrastrechnung ----------------------------------------------------
//
// Die Kennfarben sind Hausfarben, keine frei wählbaren Töne: Feuerrot und
// DRK-Rot sind deutlich heller als das THW-Blau, für das die abgeleiteten
// Töne ursprünglich von Hand geprüft waren. Ein fester Helligkeitsschritt
// („etwas aufhellen") trifft deshalb je Organisation einen anderen Kontrast —
// bei den hellen Kennfarben rutschte der Link-Ton auf bis zu 2,3:1. Die
// Ableitung rechnet den Kontrast darum nach, statt ihn zu unterstellen.

/** Mindestkontrast für Fließtext nach WCAG 2.1 AA (1.4.3). */
const AA_TEXT = 4.5;

/** Die Fläche, auf der die abgeleiteten Textfarben stehen (Karten, Eingaben, Papier). */
const FLAECHE = "#ffffff";

/** WCAG-Leuchtdichte eines #rrggbb-Werts — mit Gamma, anders als {@link helligkeit}. */
function leuchtdichte(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Kontrastverhältnis zweier #rrggbb-Werte (1–21) nach WCAG 2.1. */
export function kontrast(a: string, b: string): number {
  const [la, lb] = [leuchtdichte(a), leuchtdichte(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Mischt `vorne` mit `anteil` (0–1) über `hinten` — wie eine Deckkraft, nur als fester Wert. */
function mische(vorne: string, anteil: number, hinten: string): string {
  const kanal = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) => Math.round(kanal(vorne, i) * anteil + kanal(hinten, i) * (1 - anteil)))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Verschiebt `basis` in Schritten von 5 % Helligkeit, bis der Ton `ziel`
 * Kontrast gegen `gegen` erreicht — `richtung` −1 dunkelt ab, +1 hellt auf.
 *
 * `abstand` ist der Mindestversatz gegenüber `basis`: wo der Ausgangston den
 * Kontrast schon erfüllt, käme sonst der Ausgangston selbst zurück, und ein
 * Hover, der die Farbe nicht ändert, ist kein Hover. `grenze` deckelt die
 * Suche — jenseits davon hat der Ton seinen Charakter verloren (ein „grüner"
 * Haken bei 95 % Helligkeit ist weiß), dann ist der Anschlag die ehrlichere
 * Antwort.
 */
function bisKontrast(
  basis: Hsl,
  gegen: string,
  ziel: number,
  richtung: 1 | -1,
  { abstand = 0, grenze = 1 }: { abstand?: number; grenze?: number } = {}
): string {
  for (let schritt = 0; schritt <= 20; schritt++) {
    const l = klemme(basis.l + richtung * (abstand + schritt * 0.05));
    if (richtung === 1 && l > grenze) break;
    const ton = hslZuHex({ ...basis, l });
    if (kontrast(ton, gegen) >= ziel) return ton;
  }
  return richtung === -1 ? "#000000" : "#ffffff";
}

/**
 * Grundton des Erledigt-Hakens im Kopfbalken. Auf dunklen Kennfarben steht er
 * unverändert; auf helleren hellt {@link bisKontrast} ihn so weit auf, bis er
 * trägt — er bleibt dabei grün und damit als Signal erkennbar.
 */
const GUT_AUF_KOPF = "#8fe0ab";

/**
 * Ab welcher Helligkeit der Haken sein Grün verloren hat. Auf den zwei
 * hellsten Kennfarben (DRK-Rot, DLRG-Gelb) liegt gar kein grüner Ton mit
 * 4,5:1: die Fläche steht dort in der Mitte des Helligkeitsbereichs, es
 * trägt nur noch Weiß oder Schwarz. Dann wird der Haken weiß — die Auskunft
 * „erledigt" hängt ohnehin am Zeichen ✓ gegenüber • und Leerstelle, nicht
 * allein an seiner Farbe.
 */
const GUT_GRENZE = 0.9;

/**
 * Zweitschrift auf der Kennfarbe: Weiß, so weit zur Kennfarbe hin abgesenkt,
 * wie 4,5:1 es zulässt. Bewusst als fester Mischwert und nicht als
 * halbdurchsichtiges Weiß — Deckkraft nimmt der Feld-Modus nicht zurück, und
 * dort soll ausdrücklich nichts zurücktreten.
 */
function kopfZweitschrift(akzent: string): string {
  for (let anteil = 0.78; anteil < 1; anteil += 0.02) {
    const ton = mische(FLAECHE, anteil, akzent);
    if (kontrast(ton, akzent) >= AA_TEXT) return ton;
  }
  return FLAECHE;
}

/**
 * Der Ton für Links und Hover: so weit aufgehellt wie möglich, ohne unter
 * 4,5:1 auf der weißen Fläche zu fallen.
 *
 * Aufhellen ist die Absicht — heller heißt „anfassbar". Bei den hellen
 * Kennfarben (Feuerrot, DRK-Rot, DLRG-Gelb) führt der volle Schritt von
 * 14 % aber von der Fläche weg statt auf sie zu und landete bei bis zu
 * 2,3:1. Statt die Richtung umzukehren, wird der Schritt gekürzt: gesucht
 * ist der größte Schritt, der noch trägt. Bleibt keiner übrig — die
 * Kennfarbe stünde selbst schon zu dicht an Weiß —, dunkelt der Ton ab;
 * `orgFarbe()` fängt diesen Fall zwar bereits mit dem Neutralgrau ab, aber
 * eine neue Hausfarbe soll nicht still durchs Raster fallen.
 */
function linkTon(basis: Hsl): string {
  for (let schritt = 0.14; schritt > 0; schritt -= 0.02) {
    const ton = hslZuHex({ ...basis, l: klemme(basis.l + schritt) });
    if (kontrast(ton, FLAECHE) >= AA_TEXT) return ton;
  }
  return bisKontrast(basis, FLAECHE, AA_TEXT, -1, { abstand: 0.1 });
}

/**
 * CSS-Akzentvariablen aus der Kennfarbe der Organisation. Grundlage ist der
 * `akzent`-Wert aus {@link orgFarbe} (mittlerer, dunkler Ton bzw. Neutralgrau
 * für sehr helle Kennfarben wie den Rettungsdienst).
 *
 * - `akzent`     Grundton (Web/Light: Überschriften, primäre Knöpfe, aktiver Schritt)
 * - `hell`       Ton für Links und Hover — steht als Schrift auf weißer Fläche
 * - `dunkel`     stark aufgehellter Ton — als Tint auf dunklem Grund (iOS/Android Dark)
 * - `tief`       sehr dunkler Ton — Text AUF dem hellen Tint (Material-Dark on-primary)
 * - `kopfAuf2`   Zweitschrift IM Kopfbalken (inaktiver Schritt, Nebenzeilen)
 * - `kopfGut`    der Erledigt-Haken IM Kopfbalken
 *
 * `hell`, `kopfAuf2` und `kopfGut` sind auf 4,5:1 gerechnet, nicht geschätzt:
 * `hell` gegen die weiße Fläche, die beiden Kopf-Töne gegen die Kennfarbe.
 * Siehe {@link bisKontrast}.
 */
export function orgAkzentPalette(org: OrganisationsTyp): {
  akzent: string;
  hell: string;
  dunkel: string;
  tief: string;
  kopfAuf2: string;
  kopfGut: string;
} {
  const akzent = orgFarbe(org).akzent;
  const basis = hexZuHsl(akzent);
  const hell = linkTon(basis);
  return {
    akzent: hslZuHex(basis),
    hell,
    dunkel: hslZuHex({ h: basis.h, s: Math.min(basis.s, 0.65), l: 0.75 }),
    tief: hslZuHex({ ...basis, l: 0.18 }),
    kopfAuf2: kopfZweitschrift(akzent),
    kopfGut: bisKontrast(hexZuHsl(GUT_AUF_KOPF), akzent, AA_TEXT, 1, { grenze: GUT_GRENZE }),
  };
}

/**
 * Akzentfarbe der Oberfläche auf die Organisation umstellen — setzt die
 * `--org-akzent*`-Variablen (und die PWA-`theme-color`) auf `<html>`. Ohne
 * Organisation (kein Bogen offen) werden sie entfernt, sodass das Standard-Blau
 * aus dem Stylesheet greift.
 */
export function wendeOrgAkzentAn(org: OrganisationsTyp | undefined): void {
  const wurzel = document.documentElement;
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (org === undefined) {
    for (const suffix of ["", "-hell", "-dunkel", "-tief"]) wurzel.style.removeProperty(`--org-akzent${suffix}`);
    for (const name of ["--org-kopf-auf-2", "--org-kopf-gut"]) wurzel.style.removeProperty(name);
    if (themeColor) themeColor.content = "#12275e";
    return;
  }
  const p = orgAkzentPalette(org);
  wurzel.style.setProperty("--org-akzent", p.akzent);
  wurzel.style.setProperty("--org-akzent-hell", p.hell);
  wurzel.style.setProperty("--org-akzent-dunkel", p.dunkel);
  wurzel.style.setProperty("--org-akzent-tief", p.tief);
  // Der Kopfbalken trägt die Kennfarbe als Fläche — seine Zweitschrift und
  // sein Haken müssen also je Organisation neu gerechnet werden, nicht einmal
  // für das THW-Blau. Ohne Bogen greifen die Vorgaben aus index.html.
  wurzel.style.setProperty("--org-kopf-auf-2", p.kopfAuf2);
  wurzel.style.setProperty("--org-kopf-gut", p.kopfGut);
  if (themeColor) themeColor.content = p.akzent;
}
