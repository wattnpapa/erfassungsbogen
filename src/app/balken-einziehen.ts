/**
 * Die feste Ansichtsleiste der Einsatzansicht zieht sich beim Lesen nach unten ein (R17-N3, R17-H7, R17-G5, R17-K6).
 *
 * Sie lag dauerhaft über der Liste: 56 px (9 % von 640) schnitten Zeilen und „Mehr…" an, mit einer Quittung darüber
 * belegten beide 23 % des Bildes. Jetzt steht sie nur dort im Bild, wo man sie sucht: beim Zurückrollen und am Ende der
 * Seite (dort hält `main` ihre Höhe frei). Ganz oben ist sie weg — der Kopf trägt dieselbe Wahl. Die Klasse
 * `balken-weg` am Wurzelelement steuert nur die Sichtbarkeit (index.html); ein Tastaturfokus holt die Leiste zurück.
 */

export const BALKEN_WEG_KLASSE = "balken-weg";

/** Mindeste Rollstrecke, ab der eine Richtung gilt (px): Zittern des Fingers wechselt nichts. */
const SCHWELLE_PX = 12;
/** Unterhalb dieser Bildlaufstelle (px) steht der Kopf mit der Ansichtswahl im Bild. */
const KOPF_PX = 240;
/** Abstand zum Seitenende (px), ab dem die Leiste in ihrem freigehaltenen Platz steht. */
const ENDE_PX = 8;

/** Entscheidet, ob die Leiste weg soll. Rein, damit Tests ohne Layout rechnen können. */
export function balkenWeg(y: number, vorher: number, sichtbar: number, gesamt: number, war: boolean): boolean {
  if (y + sichtbar >= gesamt - ENDE_PX) return false;
  if (y < KOPF_PX) return true;
  const weg = y - vorher;
  if (weg > SCHWELLE_PX) return true;
  if (weg < -SCHWELLE_PX) return false;
  return war;
}

/** Hört auf den Bildlauf und setzt die Klasse; gibt die Abmeldung zurück. */
export function balkenEinziehen(fenster: Window = window): () => void {
  const wurzel = fenster.document.documentElement;
  let vorher = fenster.scrollY;
  let weg = balkenWeg(vorher, vorher, fenster.innerHeight, wurzel.scrollHeight, false);
  let wartet = false;
  const setzen = () => wurzel.classList.toggle(BALKEN_WEG_KLASSE, weg);
  const messen = () => {
    wartet = false;
    const y = fenster.scrollY;
    weg = balkenWeg(y, vorher, fenster.innerHeight, wurzel.scrollHeight, weg);
    if (Math.abs(y - vorher) > SCHWELLE_PX) vorher = y;
    setzen();
  };
  const bildlauf = () => {
    if (wartet) return;
    wartet = true;
    if (typeof fenster.requestAnimationFrame === "function") fenster.requestAnimationFrame(messen);
    else messen();
  };
  setzen();
  fenster.addEventListener("scroll", bildlauf, { passive: true });
  return () => {
    fenster.removeEventListener("scroll", bildlauf);
    wurzel.classList.remove(BALKEN_WEG_KLASSE);
  };
}
