/**
 * Kennfarben je Organisation — die EINE Quelle für PDF und Oberfläche.
 *
 * Der PDF-Bogen färbt Kopfbalken/QR-Überschriften damit ein; die App leitet
 * daraus ihre Akzentfarbe ab (CSS-Variablen), sodass man schon an der Farbe
 * sieht, in welcher Organisation man gerade unterwegs ist. Standard ist das
 * THW-Blau — praktisch die bisherige Akzentfarbe.
 */

import { OrganisationsTyp } from "../model";

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

/**
 * CSS-Akzentvariablen aus der Kennfarbe der Organisation. Grundlage ist der
 * `akzent`-Wert aus {@link orgFarbe} (mittlerer, dunkler Ton bzw. Neutralgrau
 * für sehr helle Kennfarben wie den Rettungsdienst).
 *
 * - `akzent`  Grundton (Web/Light: Überschriften, primäre Knöpfe, aktiver Schritt)
 * - `hell`    etwas aufgehellter Ton für Hover/Links
 * - `dunkel`  stark aufgehellter Ton — als Tint auf dunklem Grund (iOS/Android Dark)
 * - `tief`    sehr dunkler Ton — Text AUF dem hellen Tint (Material-Dark on-primary)
 */
export function orgAkzentPalette(org: OrganisationsTyp): {
  akzent: string;
  hell: string;
  dunkel: string;
  tief: string;
} {
  const basis = hexZuHsl(orgFarbe(org).akzent);
  return {
    akzent: hslZuHex(basis),
    hell: hslZuHex({ ...basis, l: klemme(basis.l + 0.14) }),
    dunkel: hslZuHex({ h: basis.h, s: Math.min(basis.s, 0.65), l: 0.75 }),
    tief: hslZuHex({ ...basis, l: 0.18 }),
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
    if (themeColor) themeColor.content = "#12275e";
    return;
  }
  const p = orgAkzentPalette(org);
  wurzel.style.setProperty("--org-akzent", p.akzent);
  wurzel.style.setProperty("--org-akzent-hell", p.hell);
  wurzel.style.setProperty("--org-akzent-dunkel", p.dunkel);
  wurzel.style.setProperty("--org-akzent-tief", p.tief);
  if (themeColor) themeColor.content = p.akzent;
}
