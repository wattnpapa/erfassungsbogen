/**
 * Was unterscheidet die Fassung des anderen Fensters von der eigenen?
 *
 * Die Warnung der zwei Fenster nannte nur Minute und Personenzahl beider
 * Stände; bei einer Änderung nur im Text lasen sich „dort" und „hier" gleich
 * (Audit Runde 7, R7-O2, R7-W5, R7-N6, R7-S2, R7-H3). Diese Datei benennt die
 * Felder, in denen die Fassungen abweichen, und gibt Zeiten mit Sekunden an.
 */

import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { bogenDiff } from "@bos/meldekopf/meldung-diff";

/** „17:44:12 Uhr" aus einem Date.now()-Wert, mit Datum nur wenn nicht heute. */
export function zeitMitSekunden(ms: number): string {
  const d = new Date(ms);
  const uhr = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? `${uhr} Uhr`
    : `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}, ${uhr} Uhr`;
}

/** Wert für die Anzeige kürzen: „Neuer Ort am Nordhafen, Que…“ (R8-N6). */
function kurz(wert: string, laenge = 28): string {
  const t = wert.trim().replace(/\s+/g, " ");
  return t.length > laenge ? `${t.slice(0, laenge - 1).trimEnd()}…` : t;
}

/** Name ohne die Klammer mit Rolle: „Muster, Max (Mannschaft · GrFü)“ → „Muster, Max“. */
function nurName(zeile: string): string {
  return zeile.replace(/ \([^()]*\)$/, "");
}

/**
 * Die Abschnitte und Felder, in denen `dort` von `hier` abweicht — als kurze
 * Liste („Ort / Auftrag, Personal (2 geändert), Diesel"). Leer, wenn sich der
 * Bogen inhaltlich nicht unterscheidet (dann liegt der Unterschied nur im
 * Zeitpunkt oder in Zusätzen wie dem Übergabestand).
 *
 * `werte`: bei den einfachen Feldern (Ort / Auftrag, Zeitraum, Diesel …) beide Werte
 * nennen, „dort" und „hier", gekürzt (R8-N6). Personal und Fahrzeuge werden je Eintrag
 * einmal gezählt: Ein umbenannter Eintrag erscheint im Diff als Abgang plus Zugang und
 * zählt hier als EIN geänderter Eintrag; bis zu drei Namen werden genannt (R8-E4).
 */
export function unterschiedText(
  hier: Erfassungsbogen,
  dort: Erfassungsbogen,
  hoechstens = 4,
  optionen: { werte?: boolean } = {},
): string {
  let d;
  try {
    d = bogenDiff(hier, dort);
  } catch {
    return "";
  }
  if (d.anzahl === 0) return "";
  const feld = (a: { feld: string; vorher: string; nachher: string }) =>
    optionen.werte ? `${a.feld} (dort: „${kurz(a.nachher)}“, hier: „${kurz(a.vorher)}“)` : a.feld;
  const eintraege = (n: number) => `${n} ${n === 1 ? "Eintrag" : "Einträge"}`;
  const mitNamen = (n: number, namen: string[]) => {
    const einzigartig = [...new Set(namen.filter(Boolean))];
    const gezeigt = einzigartig.slice(0, 3).join(", ");
    return gezeigt ? `${eintraege(n)}: ${gezeigt}${einzigartig.length > 3 ? " …" : ""}` : eintraege(n);
  };
  const teile: string[] = [];
  for (const a of d.sonstiges) teile.push(feld(a));

  // Personal: Zugang und Abgang an derselben Stelle (Umbenennung) zählen einmal.
  const umbenannt = Math.min(d.personalZugang.length, d.personalAbgang.length);
  const geaenderte = new Set(d.personalGeaendert.map((a) => a.feld.split(" — ")[0] ?? a.feld));
  const personal = d.personalZugang.length + d.personalAbgang.length - umbenannt + geaenderte.size;
  if (personal > 0) {
    const namen = [
      ...d.personalAbgang.slice(0, umbenannt).map((alt, i) => `${nurName(alt)} → ${nurName(d.personalZugang[i] ?? "")}`),
      ...d.personalZugang.slice(umbenannt).map(nurName),
      ...d.personalAbgang.slice(umbenannt).map(nurName),
      ...geaenderte,
    ];
    teile.push(`Personal (${mitNamen(personal, namen)})`);
  } else if (d.staerke.length > 0) teile.push("Stärke");

  const fzUmbenannt = Math.min(d.fahrzeugeZugang.length, d.fahrzeugeAbgang.length);
  const fzGeaendert = new Set(d.fahrzeugeGeaendert.map((a) => a.feld.split(" — ")[0] ?? a.feld));
  const fahrzeuge = d.fahrzeugeZugang.length + d.fahrzeugeAbgang.length - fzUmbenannt + fzGeaendert.size;
  if (fahrzeuge > 0) {
    const namen = [
      ...d.fahrzeugeAbgang.slice(0, fzUmbenannt).map((alt, i) => `${alt} → ${d.fahrzeugeZugang[i] ?? ""}`),
      ...d.fahrzeugeZugang.slice(fzUmbenannt),
      ...d.fahrzeugeAbgang.slice(fzUmbenannt),
      ...fzGeaendert,
    ];
    teile.push(`Fahrzeuge (${mitNamen(fahrzeuge, namen)})`);
  }
  for (const a of d.bedarf.filter((x) => x.feld !== "Unterbringung M/W/D")) teile.push(feld(a));
  if (teile.length === 0) teile.push("Sofortbedarf");
  const gezeigt = teile.slice(0, hoechstens);
  const rest = teile.length - gezeigt.length;
  return gezeigt.join(", ") + (rest > 0 ? ` und ${rest} weitere` : "");
}
