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
  (globalThis as { __EEB_ORTSSPERRE_MS?: number }).__EEB_ORTSSPERRE_MS ?? (PRELLSCHUTZ_MS === 0 ? 0 : 1200);

/**
 * Sperre der Stelle nach einem Wechsel der Ansicht (Sammlung öffnen, Startseite, Scanner): 600 ms. Wer die
 * neuen Knöpfe liest, tippt nach einer halben Sekunde; 1,5 s schluckten den nächsten bewussten Tipp
 * (Audit Runde 9, R9-H5). Gilt wie jede Ortssperre nur an der Stelle des ersten Tipps, nicht für den Rest des Bildes.
 */
export const SEITENWECHSEL_SPERRE_MS: number = ORTSSPERRE_MS === 0 ? 0 : Math.min(ORTSSPERRE_MS, 400); // R18: 0,4 s statt 0,6 s

/**
 * Sperre der Stelle nach einem Schrittwechsel („Weiter →" liegt danach wieder unter dem Finger): 900 ms
 * (R10-S2). Bei 1,5 s verwarf die Sperre bei gleichmäßigem Tippen im Abstand von 1,0 bis 1,3 s jeden
 * zweiten Tipp; der Doppeltipp (R4-S2, bis rund 700 ms später) bleibt gesperrt, das bewusste Weitertippen
 * ab einer Sekunde geht durch.
 */
export const SCHRITTWECHSEL_SPERRE_MS: number = ORTSSPERRE_MS === 0 ? 0 : Math.min(ORTSSPERRE_MS, 600); // R18: 0,6 s statt 0,9 s

/**
 * Sperre der Stelle nach „Weiter →" im Assistenten: 0,5 s (R17-G11). Bei 0,9 s blieb jeder zweite Tipp eines Helfers auf der
 * Strecke, der durch leere oder bekannte Schritte blättert (Abstand 0,4 bis 0,8 s: Schritt 2, 2, 3, 3, 4); er hielt den
 * verworfenen Tipp für einen Fehltipp. Der Doppeltipp mit Handschuh liegt bei 0,1 bis 0,3 s (R2-G4) und bleibt gesperrt; ein
 * Schrittwechsel ist harmlos und mit „← Zurück" umkehrbar. Die Teilwechsel im QR-Vollbild behalten die längere Sperre.
 */
export const ASSISTENT_SCHRITT_SPERRE_MS: number = ORTSSPERRE_MS === 0 ? 0 : Math.min(ORTSSPERRE_MS, 300); // R18-G3: 0,3 s statt 0,5 s

/**
 * Sperre der Stelle unter einer aufgegangenen Quittungsleiste mit „Rückgängig". Ein Zweittipp ab 1,5 s
 * nahm „Abrücken" an derselben Stelle zurück, weil dort jetzt „Rückgängig" lag (R8-D5); der
 * bewusste Rückweg kommt erst nach dem Lesen der Quittung und liegt über 2,5 s.
 */
export const QUITTUNG_SPERRE_MS: number = ORTSSPERRE_MS; // R18: „Rückgängig" und „✕" sind nie gesperrt; die Sperre hält nur den Knopf unter einer schwebenden Leiste

/**
 * Kürzere Sperre unter einer Quittung, deren „Rückgängig" etwas Harmloses zurücknimmt (Kenntnisnahme, Zug, Auftrag,
 * Name/Ort): so lang wie der Prellschutz des Knopfs. Die 2,5 s oben verwarfen in einer Folge „Kenntnisnahme → Rückgängig →
 * Kenntnisnahme → Rückgängig" im Abstand von 0,6 s den dritten, bewussten Tipp, obwohl nichts zu schützen war (R17-D3).
 * Bei „Abrücken", „Entfernen" und Stärke bleibt es bei der langen Sperre.
 */
export const QUITTUNG_SPERRE_KURZ_MS: number = ORTSSPERRE_MS === 0 ? 0 : PRELLSCHUTZ_MS;

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

/**
 * Sichere Gegenhandlungen (R18-W3, E1, H4, G3, S3, D2, N1): „Abbrechen", „Rückgängig", „Zurück" und Schließen nehmen
 * nichts weg und stehen nie hinter einer Tipp-Sperre. Die Sperren schützen den Weg nach vorn und die zerstörende
 * Antwort; wer einen Fehltipp sofort zurücknehmen will, wird nicht gebremst und sieht kein „Einen Moment …".
 * Erkannt am Merkmal `data-sicher` oder an der Beschriftung des Knopfs.
 */
const SICHERE_BESCHRIFTUNG = /^(?:[←‹]\s*)?(?:Abbrechen|Zurück|Rückgängig|Schließen|Verstanden|✕|×)(?![\p{L}\p{N}])/u;
const KNOPF_ODER_LINK = "button, a[href], summary, [role='button']";

export function istSichereGegenhandlung(ziel: EventTarget | null): boolean {
  const knopf = (ziel as Element | null)?.closest?.(KNOPF_ODER_LINK) ?? null;
  if (!knopf) return false;
  if (knopf.closest("[data-sicher]")) return true;
  return SICHERE_BESCHRIFTUNG.test((knopf.textContent ?? "").trim());
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
export function tippVerworfenZeigen(e: MouseEvent, text = "Einen Moment …"): void {
  verworfenZeigen(e, text);
}
function verworfenZeigen(e: MouseEvent, text = "Einen Moment …"): void {
  if (typeof document === "undefined") return;
  knopfZuruecksetzen();
  const ziel = (e.target as Element | null)?.closest?.("button, a[href], summary, label, [role='button']") ?? null;
  // R19-S5/W11/L3/E1/N2/K4: Auf einem breiten Knopf steht der Grund auf dem Knopf selbst (index.html, ::after, voller Kontrast,
  // verdeckt die Beschriftung nur für diese Zehntelsekunden), nicht als Pille über dem Finger. Schmale Ziele behalten die Pille.
  const aufKnopf = ziel instanceof HTMLButtonElement && ziel.getBoundingClientRect().width >= KNOPF_TEXT_MIN_PX;
  ziel?.setAttribute("data-tipp-gesperrt", aufKnopf ? "text" : "");
  if (aufKnopf) ziel.setAttribute("data-tipp-text", text);
  verworfenKnopf = ziel;
  let pille = document.getElementById("tipp-moment");
  if (!pille) {
    pille = document.createElement("div");
    pille.id = "tipp-moment";
    pille.className = "tipp-moment";
    pille.setAttribute("role", "status");
  }
  pille.textContent = text;
  if (aufKnopf) {
    pille.hidden = true;
    clearTimeout(verworfenUhr);
    verworfenUhr = setTimeout(knopfZuruecksetzen, VERWORFEN_ANZEIGE_MS);
    return;
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
      // Auf dem angetippten Knopf selbst (R9-S2): Unter dem Knopf lag sie bei gefülltem Fuß außerhalb des
      // Bildes, darüber im Fließtext oder auf dem nächsten Weg. Der Knopf trägt zugleich den gestrichelten Rahmen.
      const hoehe = 29;
      pille.style.left = `${Math.round(r.left + r.width / 2)}px`;
      pille.style.top = `${Math.round(Math.max(4, r.top + (r.height - hoehe) / 2))}px`;
    }
  }
  // Im QR-Vollbild quer lag die Pille über „Teil n von m" (R7-H4): dort steht sie fest unten
  // in der Spalte, nicht über dem Tipport (die Regel steht in index.html, `.im-vollbild`).
  pille.classList.toggle("im-vollbild", host.classList.contains("qr-vollbild"));
  pille.hidden = false;
  clearTimeout(verworfenUhr);
  verworfenUhr = setTimeout(() => {
    knopfZuruecksetzen();
    if (pille) pille.hidden = true;
  }, VERWORFEN_ANZEIGE_MS);
}
/** Ab dieser Breite trägt der Knopf „Einen Moment …" selbst. */
const KNOPF_TEXT_MIN_PX = 104;
function knopfZuruecksetzen(): void {
  verworfenKnopf?.removeAttribute("data-tipp-gesperrt");
  verworfenKnopf?.removeAttribute("data-tipp-text");
  verworfenKnopf = null;
}

function klickPruefen(e: MouseEvent) {
  if (!mitOrt(e)) return;
  const jetzt = Date.now();
  if (istSichereGegenhandlung(e.target)) {
    // Nie gesperrt; der Ort zählt trotzdem als „der Tipp eben" (eine Quittung danach weicht dem Finger aus).
    // R19-E1: „Abbrechen" in einer Rückfrage gibt die Stelle des öffnenden Knopfs frei — wer sich vertippt hat und
    // gleich neu ansetzt, trifft sonst einen stummen Knopf.
    if (inRueckfrage(e)) sperren = sperren.filter((s) => !s.nurAusserhalbRueckfrage);
    letzterTipp = { x: e.clientX, y: e.clientY, zeit: jetzt, halb: halbeZielbreite(e) };
    return;
  }
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
  if (!mitOrt(e) || sperren.length === 0 || istSichereGegenhandlung(e.target)) return;
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
  knopfZuruecksetzen();
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
