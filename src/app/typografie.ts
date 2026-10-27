/**
 * Anführungszeichen (R17-W3): Die Texte der App öffnen mit „ (U+201E) und schlossen vielerorts mit dem geraden " (U+0022).
 * Statt Tausende Quelltextstellen einzeln anzufassen, läuft jeder Text durch {@link anfuehrung}: an den Senken der Dateien
 * (CSV, PDF, Excel) und, für die Oberfläche, über {@link anfuehrungWaechterStarten}. React zerlegt „{name}" in drei Textknoten;
 * der Wächter liest deshalb die Textknoten eines Elements der Reihe nach.
 */

/** „Name" → „Name“ — nur ein öffnendes „ ohne schließendes “ in derselben Zeile wird ergänzt. */
export function anfuehrung(text: string): string {
  return text.includes("„") ? text.replace(/„([^„“”"\n]*)"/g, "„$1“") : text;
}

const ATTRIBUTE = ["title", "aria-label", "placeholder", "alt"];
const NICHT = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT"]);
/** So viele Knoten weiter darf das schließende Zeichen stehen („, Name, " sind drei Knoten). */
const REICHWEITE = 6;

/** Die direkten Textknoten eines Elements der Reihe nach: ein „ ohne Ende wird vom nächsten geraden " geschlossen. */
function folge(el: Element): void {
  if (NICHT.has(el.tagName)) return;
  let offen = false;
  let abstand = 0;
  for (const k of Array.from(el.childNodes)) {
    if (k.nodeType !== 3) {
      if (offen && ++abstand > REICHWEITE) offen = false;
      continue;
    }
    const t = k as Text;
    let neu = "";
    for (const z of t.data) {
      if (z === "„") offen = true;
      else if (z === "“" || z === "”" || z === "\n") offen = false;
      else if (z === '"' && offen) {
        neu += "“";
        offen = false;
        continue;
      }
      neu += z;
    }
    if (neu !== t.data) t.data = neu;
    abstand = 0;
  }
}

function knoten(wurzel: Node): void {
  if (wurzel.nodeType === 3) {
    if (wurzel.parentElement) folge(wurzel.parentElement);
    return;
  }
  if (wurzel.nodeType !== 1 || NICHT.has((wurzel as Element).tagName)) return;
  const el = wurzel as Element;
  for (const a of ATTRIBUTE) {
    const w = el.getAttribute(a);
    if (w) {
      const neu = anfuehrung(w);
      if (neu !== w) el.setAttribute(a, neu);
    }
  }
  folge(el);
  for (const k of Array.from(el.children)) knoten(k);
}

/** Hängt einen Beobachter an die Wurzel: Text und Beschriftungen laufen vor dem Anzeigen durch {@link anfuehrung}. */
export function anfuehrungWaechterStarten(wurzel: Node = document.body): () => void {
  knoten(wurzel);
  const beobachter = new MutationObserver((liste) => {
    for (const m of liste) {
      if (m.type === "childList") m.addedNodes.forEach(knoten);
      else if (m.type === "characterData") knoten(m.target);
      else if (m.target.nodeType === 1) {
        // Nur die geänderte Beschriftung, nicht den ganzen Teilbaum.
        const el = m.target as Element;
        const a = m.attributeName;
        const w = a ? el.getAttribute(a) : null;
        if (a && w) {
          const neu = anfuehrung(w);
          if (neu !== w) el.setAttribute(a, neu);
        }
      }
    }
  });
  beobachter.observe(wurzel, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTE });
  return () => beobachter.disconnect();
}
