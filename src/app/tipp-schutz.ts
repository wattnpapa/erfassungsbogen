/**
 * Schutz vor dem zweiten Tipp eines Doppeltipps an einer Stelle, an der
 * gerade etwas anderes erschienen ist.
 *
 * Mit Handschuh tippt man lieber zweimal, wenn man nicht sicher ist, ob der
 * erste Tipp ankam — und zwar bis zu einer Sekunde später. Nach „Abrücken"
 * lag dort aber „Wieder anwesend" (R2-G4 hatte den Gegenknopf eigens an
 * dieselbe Stelle gesetzt), oder die Quittungsleiste mit „Rückgängig" war
 * unter dem Finger aufgegangen. Beide sperrten nur 600 ms; ein zweiter Tipp
 * nach 700 oder 1 000 ms nahm das Abrücken still zurück (Audit Runde 3,
 * R3-S5, R3-G2). Jede Stelle einzeln länger zu sperren hätte auch den
 * bewussten Rückweg an anderer Stelle gebremst.
 *
 * Darum sperrt dieses Modul nicht Knöpfe, sondern den ORT: Nach einer
 * Handlung, die unter dem Finger etwas austauscht (`ortSperren`), nimmt die
 * App an dieser Bildschirmstelle für `ORTSSPERRE_MS` keinen Tipp an — gleich,
 * welcher Knopf dort inzwischen liegt. Ein Tipp daneben wirkt sofort.
 *
 * Tastatur-Klicks (`detail === 0`) und Klicks ohne Ort (Testumgebung ohne
 * Layout: 0/0) sperrt es nie.
 */

/**
 * So lange nimmt eine Karte nach „Abrücken"/„Wieder anwesend" keinen Tipp an.
 * Ein Doppeltipp mit Handschuh liegt bei 100–300 ms (Audit Runde 2, R2-G4);
 * wer bewusst zurücknehmen will, tippt nicht schneller als nach einer
 * halben Sekunde erneut.
 */
// Der Prüfstand (features/support/haken.ts) setzt ihn vor dem Laden auf 0 —
// Playwright tippt schneller nach, als es ein Finger je täte.
export const PRELLSCHUTZ_MS: number = (globalThis as { __EEB_PRELLSCHUTZ_MS?: number }).__EEB_PRELLSCHUTZ_MS ?? 600;

/**
 * Sperre einer Bildschirmstelle nach einem Austausch unter dem Finger. Der
 * zögernde zweite Tipp kam in den Messungen bis 1 000 ms nach dem ersten;
 * 1,5 s liegen deutlich darüber und bleiben kürzer als ein bewusster
 * Rückweg (Blick auf die Quittung, lesen, tippen). Mit abgeschaltetem
 * Prellschutz (Prüfstand) ebenfalls aus.
 */
export const ORTSSPERRE_MS: number =
  (globalThis as { __EEB_ORTSSPERRE_MS?: number }).__EEB_ORTSSPERRE_MS ?? (PRELLSCHUTZ_MS === 0 ? 0 : 1500);

/**
 * Sperre der Stelle unter einer aufgegangenen Quittungsleiste mit „Rückgängig". Ein Zweittipp ab 1,5 s
 * nahm „Abrücken" an derselben Stelle zurück, weil dort jetzt „Rückgängig" lag (R8-D5); der
 * bewusste Rückweg kommt erst nach dem Lesen der Quittung und liegt über 2,5 s.
 */
export const QUITTUNG_SPERRE_MS: number = ORTSSPERRE_MS === 0 ? 0 : Math.max(ORTSSPERRE_MS, 2500);

/** Halbmesser der gesperrten Stelle: eine Fingerkuppe mit Handschuh samt Zittern. */
export const ORTSSPERRE_RADIUS_PX = 40;

/**
 * Untergrenze des Halbmessers bei schmalen Zielen. Der Radius folgt der halben
 * Breite des angetippten Ziels (höchstens 40 px): Bei Browser-Zoom 150 bis 200 %
 * liegen die Reiter der Schrittleiste 25 bis 35 CSS-px auseinander, und der
 * feste Radius sperrte den Nachbarreiter mit (Audit Runde 7, R7-H5). Ein Ziel
 * ohne Maß (Testumgebung ohne Layout) behält die 40 px.
 */
const ORTSSPERRE_RADIUS_MIN_PX = 12;

/** Wie lange ein Tipp als „der Tipp eben" gilt, an dessen Ort gesperrt wird. */
const TIPP_FRISCH_MS = 1000;

interface Punkt {
  x: number;
  y: number;
  zeit: number;
  /** Halbe Breite des angetippten Ziels (CSS-px); 0, wenn unbekannt. */
  halb: number;
}

/**
 * Eine gesperrte Stelle. `verlaengern`: Jeder dort verworfene Tipp schiebt das
 * Ende hinaus (höchstens bis `kappe`) — nach einer bestätigten Rückfrage hält
 * ein Tipp-Rhythmus von 0,5 bis 1 s sonst länger an, als die Sperre trägt
 * (R5-S3).
 */
interface Sperre {
  x: number;
  y: number;
  radius: number;
  bis: number;
  kappe: number;
  verlaengern: boolean;
  /**
   * Gilt nicht für Tipps INNERHALB einer offenen Rückfrage (`dialog.abfrage`): Die Sperre, die das
   * Öffnen der Rückfrage setzt, schützt die Stelle des auslösenden Tipps hinter dem Dialog, nicht
   * die Knöpfe des Dialogs. Deren Schutz ist der Prellschutz der Rückfrage (dialoge.tsx); sonst
   * verwarf die Sperre den ersten bewussten Tipp auf einen frisch erschienenen Knopf, und
   * „Einen Moment …“ verdeckte den Dialogtext (R8-H5, R8-S4).
   */
  nurAusserhalbRueckfrage: boolean;
}

/** Obergrenze einer verlängerten Sperre, vom Beginn an gerechnet. */
const VERLAENGERN_KAPPE_MS = 4000;

let letzterTipp: Punkt | null = null;
let sperren: Sperre[] = [];

function mitOrt(e: MouseEvent): boolean {
  return e.detail > 0 && !(e.clientX === 0 && e.clientY === 0);
}

/** Halbe Breite des Tippziels unter dem Klick; 0, wenn es kein Maß gibt. */
function halbeZielbreite(e: MouseEvent): number {
  const ziel = (e.target as Element | null)?.closest?.("button, a[href], summary, label, [role='button'], [role='tab']");
  const b = ziel?.getBoundingClientRect?.().width ?? 0;
  return b > 0 ? b / 2 : 0;
}

function radiusFuer(halb: number): number {
  return halb > 0 ? Math.min(ORTSSPERRE_RADIUS_PX, Math.max(ORTSSPERRE_RADIUS_MIN_PX, halb)) : ORTSSPERRE_RADIUS_PX;
}

const IN_RUECKFRAGE = "dialog.abfrage[open]";

function inRueckfrage(e: MouseEvent): boolean {
  return (e.target as Element | null)?.closest?.(IN_RUECKFRAGE) != null;
}

function sperreAn(x: number, y: number, jetzt: number, imDialog = false): Sperre | undefined {
  sperren = sperren.filter((s) => s.bis >= jetzt);
  return sperren.find((s) => !(imDialog && s.nurAusserhalbRueckfrage) && Math.hypot(x - s.x, y - s.y) <= s.radius);
}

/**
 * Ein verworfener Tipp zeigt sich: Der Knopf darunter bekommt kurz einen
 * Rahmen, und über dem Finger steht „Einen Moment …". Vorher sah ein
 * verworfener Tipp aus wie ein hängender Knopf, und wer im Takt von einer
 * Sekunde tippte, lernte nur, dass jeder zweite Tipp nichts tut (R5-S2,
 * R5-G5). Die Meldung fängt keinen Tipp ab und liegt nie unter dem Finger.
 */
const VERWORFEN_ANZEIGE_MS = 900;
let verworfenUhr: ReturnType<typeof setTimeout> | undefined;
let verworfenKnopf: Element | null = null;
function verworfenZeigen(e: MouseEvent): void {
  if (typeof document === "undefined") return;
  verworfenKnopf?.removeAttribute("data-tipp-gesperrt");
  const ziel = (e.target as Element | null)?.closest?.("button, a[href], summary, label, [role='button']") ?? null;
  ziel?.setAttribute("data-tipp-gesperrt", "");
  verworfenKnopf = ziel;
  let pille = document.getElementById("tipp-moment");
  if (!pille) {
    pille = document.createElement("div");
    pille.id = "tipp-moment";
    pille.className = "tipp-moment";
    pille.setAttribute("role", "status");
    pille.textContent = "Einen Moment …";
  }
  // Im QR-Vollbild (und jedem anderen modalen Fenster) liegt der Hinweis IM Fenster: Ein
  // Element im Seitenkörper bleibt unter der obersten Ebene verdeckt (Audit Runde 6, R6-H1).
  const offene = document.querySelectorAll("dialog[open]");
  const host: Element = offene.length > 0 ? offene[offene.length - 1]! : document.body;
  if (pille.parentElement !== host) host.appendChild(pille);
  const breite = window.innerWidth || 360;
  pille.style.left = `${Math.round(Math.min(Math.max(e.clientX, 72), Math.max(72, breite - 72)))}px`;
  pille.style.top = `${Math.round(Math.max(8, e.clientY - 72))}px`;
  // In einer Rückfrage läge die Pille 72 px über dem Finger mitten im Text („dort abgel…“ verdeckt,
  // R8-H5). Dort steht sie unmittelbar unter dem angetippten Knopf (passt sie nicht mehr ins Bild,
  // darüber) — nie im Fließtext, der über den Knöpfen steht.
  if (host.classList.contains("abfrage")) {
    const r = ziel?.getBoundingClientRect?.();
    if (r && r.height > 0) {
      const hoehe = 36;
      const hoch = window.innerHeight || 640;
      const unten = r.bottom + 4;
      pille.style.top = `${Math.round(unten + hoehe <= hoch ? unten : Math.max(8, r.top - hoehe - 4))}px`;
    }
  }
  // Im QR-Vollbild quer lag die Pille über „Teil n von m" (R7-H4): dort steht sie fest unten
  // in der Spalte, nicht über dem Tipport (die Regel steht in index.html, `.im-vollbild`).
  pille.classList.toggle("im-vollbild", host.classList.contains("qr-vollbild"));
  pille.hidden = false;
  clearTimeout(verworfenUhr);
  verworfenUhr = setTimeout(() => {
    verworfenKnopf?.removeAttribute("data-tipp-gesperrt");
    verworfenKnopf = null;
    if (pille) pille.hidden = true;
  }, VERWORFEN_ANZEIGE_MS);
}

function klickPruefen(e: MouseEvent) {
  if (!mitOrt(e)) return;
  const jetzt = Date.now();
  const s = sperreAn(e.clientX, e.clientY, jetzt, inRueckfrage(e));
  if (s) {
    if (s.verlaengern) s.bis = Math.min(Math.max(s.bis, jetzt + ORTSSPERRE_MS), s.kappe);
    e.preventDefault();
    e.stopImmediatePropagation();
    verworfenZeigen(e);
    return;
  }
  letzterTipp = { x: e.clientX, y: e.clientY, zeit: jetzt, halb: halbeZielbreite(e) };
}

/** Ein Feld nimmt den Fokus schon beim Drücken — auch das an der gesperrten Stelle abfangen. */
function druckPruefen(e: MouseEvent) {
  if (!mitOrt(e) || sperren.length === 0) return;
  if (sperreAn(e.clientX, e.clientY, Date.now(), inRueckfrage(e))) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}

let installiert = false;
/** Einmal je Seite: der Prüfer sitzt vor React (Fenster, Einfangphase). */
export function tippSchutzInstallieren(): void {
  if (installiert || typeof window === "undefined") return;
  installiert = true;
  window.addEventListener("click", klickPruefen, true);
  window.addEventListener("mousedown", druckPruefen, true);
}
tippSchutzInstallieren();

/**
 * Die Stelle des Tipps eben für `ms` sperren. Aufzurufen von einer Handlung,
 * nach der unter dem Finger etwas anderes liegt — auch nach einer Rückfrage:
 * dann gilt der Ort des bestätigenden Tipps, oder `ort`, wenn die Handlung
 * die Stelle des auslösenden Knopfs selbst mitgibt (Person entfernen).
 * Mehrere Stellen können gleichzeitig gesperrt sein (auslösender Knopf und
 * Bestätigung der Rückfrage, R5-S3).
 */
export function ortSperren(
  ms: number = ORTSSPERRE_MS,
  ort?: { x: number; y: number },
  optionen: { verlaengern?: boolean; nurAusserhalbRueckfrage?: boolean } = {},
): void {
  if (ms <= 0) return;
  let stelle = ort;
  let radius = ORTSSPERRE_RADIUS_PX;
  if (!stelle) {
    const t = letzterTipp;
    if (!t || Date.now() - t.zeit > TIPP_FRISCH_MS) return;
    stelle = t;
    radius = radiusFuer(t.halb);
  }
  const jetzt = Date.now();
  const bis = jetzt + ms;
  const vorhanden = sperreAn(stelle.x, stelle.y, jetzt);
  if (vorhanden && Math.hypot(stelle.x - vorhanden.x, stelle.y - vorhanden.y) < 4) {
    vorhanden.bis = Math.max(vorhanden.bis, bis);
    vorhanden.verlaengern ||= optionen.verlaengern === true;
    vorhanden.nurAusserhalbRueckfrage &&= optionen.nurAusserhalbRueckfrage === true;
    vorhanden.kappe = Math.max(vorhanden.kappe, jetzt + VERLAENGERN_KAPPE_MS);
    vorhanden.radius = Math.max(vorhanden.radius, radius);
    return;
  }
  sperren.push({ x: stelle.x, y: stelle.y, radius, bis, kappe: jetzt + VERLAENGERN_KAPPE_MS,
    verlaengern: optionen.verlaengern === true,
    nurAusserhalbRueckfrage: optionen.nurAusserhalbRueckfrage === true,
  });
}

/** Ort des letzten Tipps (Bildschirmkoordinaten), solange er frisch ist. */
export function letzterTippOrt(): { x: number; y: number } | null {
  const t = letzterTipp;
  if (!t || Date.now() - t.zeit > TIPP_FRISCH_MS) return null;
  return { x: t.x, y: t.y };
}

/** Nur für Tests: Zustand zurücksetzen. */
export function tippSchutzZuruecksetzen(): void {
  letzterTipp = null;
  sperren = [];
  verworfenKnopf?.removeAttribute("data-tipp-gesperrt");
  verworfenKnopf = null;
  clearTimeout(verworfenUhr);
  if (typeof document !== "undefined") document.getElementById("tipp-moment")?.remove();
}

/**
 * Wie lange ein Teil des QR-Vollbilds im Bild stehen muss, bevor er als
 * „gezeigt" zählt (R5-S1): Ein Teil, der nur zwischen zwei Tipps aufblitzte,
 * kann die Gegenstelle nicht scannen. Mit abgeschaltetem Prellschutz
 * (Prüfstand) 0.
 */
let mindestzeigeMs: number = ORTSSPERRE_MS;
export function mindestzeigeDauer(): number {
  return mindestzeigeMs;
}
/** Für Tests: Mindestanzeigedauer setzen. Gibt den alten Wert zurück. */
export function mindestzeigeSetzen(ms: number): number {
  const alt = mindestzeigeMs;
  mindestzeigeMs = ms;
  return alt;
}
