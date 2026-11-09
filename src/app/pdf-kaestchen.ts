/**
 * Ankreuzkästchen als gezeichnete Quadrate, wie in der THWin-Word-Vorlage —
 * statt der Textzeichen „[  ]“ und „[X]“.
 *
 * Die Dokumentdefinitionen (pdf-dokument.ts) schreiben Kästchen weiter als Text:
 * so bleiben sie in Tests, in der WinAnsi-Abbildung und beim Messen lesbar. Erst
 * unmittelbar vor dem Setzen ersetzt {@link kaestchenZeichnen} jede Textzeile,
 * die ein Kästchen trägt, durch eine Spaltenzeile aus Text und einem kleinen
 * Canvas-Quadrat (angekreuzt mit einem X wie Words ⊠). Zeilen ohne Kästchen
 * bleiben unverändert. Das Original wird nicht verändert: Geänderte Knoten
 * werden kopiert, alles andere wird geteilt.
 *
 * Aufrufer: alle `createPdf` in pdf.ts und scripts/pdf-in-node.ts.
 */
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

/** „[  ]“, „[ ]“ oder „[X]“ — so schreibt pdf-dokument.ts Kästchen. */
const KAESTCHEN = /\[(X| +)\]/g;
/** Dasselbe ohne Zustand, nur zum Prüfen. */
const HAT_KAESTCHEN = /\[(X| +)\]/;

/** Kantenlänge im Verhältnis zur Schriftgröße (Vorlage: 9,8 pt Kasten bei 12 pt). */
const KANTE = 0.8;
/** Zeilenhöhe von Helvetica in pdfmake, bezogen auf die Schriftgröße. */
const ZEILE = 1.15;
const LINIE = 0.5;

type Lauf = Record<string, unknown> & { text: string };

/** Ein gezeichnetes Kästchen als Spalte. */
function quadrat(ja: boolean, groesse: number, zeilenfaktor: number): Content {
  const s = Math.round(groesse * KANTE * 10) / 10;
  // Mittig zur Zeile, leicht über der Mitte wie die Großbuchstaben daneben.
  const oben = Math.max(0, (groesse * ZEILE * zeilenfaktor - s) / 2 - groesse * 0.1);
  // Abstand links und rechts: pdfmake schneidet Leerzeichen an Spaltenrändern ab.
  const x = Math.round(groesse * 0.3 * 10) / 10;
  const canvas: Record<string, unknown>[] = [
    { type: "rect", x, y: oben, w: s, h: s, lineWidth: LINIE, lineColor: "#000000" },
  ];
  if (ja) {
    canvas.push(
      { type: "line", x1: x, y1: oben, x2: x + s, y2: oben + s, lineWidth: LINIE, lineColor: "#000000" },
      { type: "line", x1: x + s, y1: oben, x2: x, y2: oben + s, lineWidth: LINIE, lineColor: "#000000" },
    );
  }
  return { canvas, width: s + 2 * x } as unknown as Content;
}

/** Text eines Knotens als Läufe (gleich formatierte Stücke). */
function laeufe(text: unknown, erbe: Record<string, unknown> = {}): Lauf[] | null {
  if (typeof text === "string") return [{ ...erbe, text }];
  if (typeof text === "number") return [{ ...erbe, text: String(text) }];
  if (Array.isArray(text)) {
    const alle: Lauf[] = [];
    for (const t of text) {
      const l = laeufe(t, erbe);
      if (!l) return null;
      alle.push(...l);
    }
    return alle;
  }
  if (text && typeof text === "object") {
    const { text: innen, ...rest } = text as Record<string, unknown>;
    return laeufe(innen, { ...erbe, ...rest });
  }
  return null;
}

/** Läufe an Zeilenumbrüchen trennen. */
function zeilen(l: Lauf[]): Lauf[][] {
  const aus: Lauf[][] = [[]];
  for (const lauf of l) {
    const teile = lauf.text.split("\n");
    teile.forEach((t, i) => {
      if (i > 0) aus.push([]);
      if (t) aus[aus.length - 1]!.push({ ...lauf, text: t });
    });
  }
  return aus;
}

/** Eine Zeile mit Kästchen als Spalten; das letzte Textstück darf umbrechen. */
function zeileMitKaestchen(z: Lauf[], groesse: number, zeilenfaktor: number): Content {
  const spalten: Record<string, unknown>[] = [];
  let puffer: Lauf[] = [];
  const textSpalte = () => {
    if (puffer.length) spalten.push({ text: puffer, width: "auto" });
    puffer = [];
  };
  for (const lauf of z) {
    let rest = lauf.text;
    let m: RegExpExecArray | null;
    KAESTCHEN.lastIndex = 0;
    while ((m = KAESTCHEN.exec(rest))) {
      const vor = rest.slice(0, m.index);
      if (vor) puffer.push({ ...lauf, text: vor });
      textSpalte();
      const g = typeof lauf.fontSize === "number" ? lauf.fontSize : groesse;
      spalten.push(quadrat(m[1] === "X", g, zeilenfaktor) as unknown as Record<string, unknown>);
      rest = rest.slice(m.index + m[0].length);
      KAESTCHEN.lastIndex = 0;
    }
    if (rest) puffer.push({ ...lauf, text: rest });
  }
  textSpalte();
  const letzte = spalten[spalten.length - 1];
  if (letzte && "text" in letzte) letzte.width = "*";
  return { columns: spalten, columnGap: 0 } as unknown as Content;
}

const STIL_SCHLUESSEL = ["text", "margin", "colSpan", "rowSpan", "border", "fillColor", "verticalAlignment", "id", "pageBreak", "unbreakable"];

/** Textknoten mit Kästchen → Stapel aus Zeilen; sonst null. */
function textKnoten(k: Record<string, unknown>, groesse: number, zeilenfaktor: number): Content | null {
  const l = laeufe(k.text);
  if (!l || !l.some((x) => HAT_KAESTCHEN.test(x.text))) return null;
  // Formatierung des Knotens (fett, Farbe …) gilt für jeden Lauf.
  const stil: Record<string, unknown> = {};
  for (const [s, w] of Object.entries(k)) if (!STIL_SCHLUESSEL.includes(s)) stil[s] = w;
  const eigeneGroesse = typeof k.fontSize === "number" ? k.fontSize : groesse;
  const faktor = typeof k.lineHeight === "number" ? k.lineHeight : zeilenfaktor;
  const stapel = zeilen(l).map((z): Content => {
    if (!z.some((x) => HAT_KAESTCHEN.test(x.text))) return { text: z.length ? z : " " } as Content;
    return zeileMitKaestchen(z, eigeneGroesse, faktor);
  });
  const neu: Record<string, unknown> = { ...stil, stack: stapel };
  for (const s of STIL_SCHLUESSEL) if (s !== "text" && s in k) neu[s] = k[s];
  return neu as unknown as Content;
}

function knoten(k: unknown, groesse: number, zeilenfaktor: number): unknown {
  if (Array.isArray(k)) {
    let anders = false;
    const neu = k.map((x) => {
      const y = knoten(x, groesse, zeilenfaktor);
      if (y !== x) anders = true;
      return y;
    });
    return anders ? neu : k;
  }
  if (typeof k === "string") {
    return HAT_KAESTCHEN.test(k) ? textKnoten({ text: k }, groesse, zeilenfaktor) : k;
  }
  if (!k || typeof k !== "object") return k;
  const o = k as Record<string, unknown>;
  const g = typeof o.fontSize === "number" ? o.fontSize : groesse;
  const f = typeof o.lineHeight === "number" ? o.lineHeight : zeilenfaktor;
  if ("text" in o && !("stack" in o) && !("columns" in o) && !("table" in o)) {
    return textKnoten(o, groesse, zeilenfaktor) ?? k;
  }
  let kopie: Record<string, unknown> | null = null;
  for (const feld of ["stack", "columns"] as const) {
    if (Array.isArray(o[feld])) {
      const neu = knoten(o[feld], g, f);
      if (neu !== o[feld]) (kopie ??= { ...o })[feld] = neu;
    }
  }
  const tabelle = o.table as Record<string, unknown> | undefined;
  if (tabelle && Array.isArray(tabelle.body)) {
    const neu = knoten(tabelle.body, g, f);
    if (neu !== tabelle.body) (kopie ??= { ...o }).table = { ...tabelle, body: neu };
  }
  return kopie ?? k;
}

/** Kopie der Dokumentdefinition mit gezeichneten Kästchen (siehe Modulkommentar). */
export function kaestchenZeichnen<T extends TDocumentDefinitions>(dd: T): T {
  const groesse = typeof dd.defaultStyle?.fontSize === "number" ? dd.defaultStyle.fontSize : 12;
  const faktor = typeof dd.defaultStyle?.lineHeight === "number" ? dd.defaultStyle.lineHeight : 1;
  const aus = { ...dd, content: knoten(dd.content, groesse, faktor) } as T;
  for (const feld of ["header", "footer"] as const) {
    const f = dd[feld];
    if (typeof f === "function") {
      aus[feld] = ((...a: Parameters<typeof f>) => knoten(f(...a), groesse, faktor)) as typeof f;
    } else if (f) {
      (aus as Record<string, unknown>)[feld] = knoten(f, groesse, faktor);
    }
  }
  return aus;
}
