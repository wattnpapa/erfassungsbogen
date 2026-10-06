/**
 * „Lage vom Papier abgleichen" — der Rückweg nach einem Geräteausfall, wenn
 * nur das gedruckte Übergabeblatt da ist (Audit Runde 3, R3-A2).
 *
 * Die QR-Codes tragen nur die Bögen. Eintreffzeit, Abrückvermerk und Zug
 * stehen als Text auf Seite 1 bzw. im Kasten „Stand am Meldekopf" und
 * mussten bisher an jeder Karte einzeln nachgetragen werden (6–8 Tipps je
 * Einheit, ohne Übersicht, was schon erledigt war). Hier stehen alle frisch
 * vom Papier eingelesenen Einheiten in einer Liste mit je Eintreffzeit,
 * Status und Zug; „Abgleich übernehmen" schreibt alles in einem Schritt.
 * Bis dahin tragen die Karten „vom Papier, Zeiten prüfen".
 */

import { useId, useState } from "react";
import { MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { geltendeJeEinheit } from "./fassung-vorrang";
import { einheitAnzeigename } from "./hilfen";
import { eintreffzeit, papierAbgleichUebernehmen, SpeicherVollFehler, zeitKurz } from "./eintrag-zeiten";
import { zeigeHinweis } from "./dialoge";

/** Revisionsköpfe, deren Lage vom Papier noch nicht abgeglichen ist. */
export function offenVomPapier(eintraege: MeldeEintrag[]): MeldeEintrag[] {
  return geltendeJeEinheit(eintraege).filter((e) => e.vomPapier != null);
}

function zuLokal(ms: number): string {
  const d = new Date(ms);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

function ausLokal(wert: string): number | null {
  if (!wert.trim()) return null;
  const ms = new Date(wert).getTime();
  return Number.isNaN(ms) ? null : ms;
}

interface Zeile {
  eintragId: string;
  name: string;
  eingetroffen: string;
  abgerueckt: boolean;
  abgerueckAm: string;
  zug: string;
  /** Auftrag / Notiz laut Blatt (R4-A2). */
  notiz: string;
  /** „Nr." laut Blatt, als Text für das Eingabefeld (R4-A1). */
  nummer: string;
}

export function PapierAbgleich(props: {
  einsatzId: string;
  eintraege: MeldeEintrag[];
  /** Züge, die in der Sammlung schon vorkommen — Vorschläge fürs Zugfeld. */
  zuege: string[];
  onGeaendert: () => void;
}) {
  const { einsatzId, eintraege, zuege, onGeaendert } = props;
  const offen = offenVomPapier(eintraege);
  const [zeilen, setZeilen] = useState<Zeile[] | null>(null);
  const listeId = useId();
  if (offen.length === 0) return null;

  const oeffnen = () =>
    setZeilen(
      offen.map((e) => ({
        eintragId: e.id,
        name: `${einheitAnzeigename(e.bogen.einheit)}${e.teilEtikett ? ` (${e.teilEtikett})` : ""}`,
        eingetroffen: zuLokal(eintreffzeit(e)),
        abgerueckt: e.status === MeldeStatus.ABGERUECKT,
        abgerueckAm: e.abgerueckAm != null ? zuLokal(e.abgerueckAm) : "",
        zug: e.zugEtikett ?? "",
        notiz: e.notiz ?? "",
        nummer: "",
      })),
    );
  const aendern = (i: number, teil: Partial<Zeile>) =>
    setZeilen((z) => (z ? z.map((x, j) => (j === i ? { ...x, ...teil } : x)) : z));

  async function uebernehmen() {
    if (!zeilen) return;
    const fehler: string[] = [];
    const daten = zeilen.map((z) => {
      const ein = ausLokal(z.eingetroffen);
      const ab = z.abgerueckt ? ausLokal(z.abgerueckAm) : null;
      if (ein == null) fehler.push(`${z.name}: Eintreffzeit fehlt`);
      if (z.abgerueckt && ab == null) fehler.push(`${z.name}: Abrückzeit fehlt`);
      if (ein != null && ab != null && ab < ein) fehler.push(`${z.name}: Abrücken vor dem Eintreffen`);
      const nr = z.nummer.trim() === "" ? undefined : Number(z.nummer.trim());
      if (nr != null && (!Number.isInteger(nr) || nr < 1)) fehler.push(`${z.name}: „Nr.“ muss eine ganze Zahl ab 1 sein`);
      return {
        eintragId: z.eintragId,
        eingetroffenAm: ein ?? 0,
        status: z.abgerueckt ? MeldeStatus.ABGERUECKT : MeldeStatus.ANWESEND,
        abgerueckAm: ab ?? undefined,
        zug: z.zug,
        notiz: z.notiz,
        ...(nr != null && Number.isInteger(nr) && nr >= 1 ? { nummer: nr } : {}),
      } as const;
    });
    // Eine Nummer gilt für eine Einheit: zweimal dieselbe vom Blatt wäre ein Tippfehler.
    const gesehen = new Map<number, string>();
    for (const d of daten) {
      if (!("nummer" in d) || d.nummer == null) continue;
      const wer = zeilen.find((z) => z.eintragId === d.eintragId)!.name;
      const schon = gesehen.get(d.nummer);
      if (schon) fehler.push(`„Nr. ${d.nummer}“ steht bei ${schon} und ${wer}`);
      else gesehen.set(d.nummer, wer);
    }
    if (fehler.length > 0) {
      await zeigeHinweis({ titel: "Abgleich unvollständig", text: `${fehler.join("; ")}. Nichts übernommen.` });
      return;
    }
    try {
      papierAbgleichUebernehmen(einsatzId, daten);
    } catch (e) {
      await zeigeHinweis({ titel: "Abgleich", text: e instanceof SpeicherVollFehler ? e.message : String(e) });
      return;
    }
    const ohneNummer = zeilen.filter((z) => z.nummer.trim() === "").length;
    setZeilen(null);
    onGeaendert();
    // Ohne „Nr. laut Blatt" vergibt die App die Nummern nach dem Eingang — das
    // sind nach einem Wiederanlauf vom Papier meist andere als auf dem Blatt
    // an der Wand (R4-A1). Das gehört gesagt, bevor jemand „Nr. 3 rückt ab"
    // funkt.
    if (ohneNummer > 0) {
      await zeigeHinweis({
        titel: "Nummern neu vergeben",
        text:
          `Für ${ohneNummer === 1 ? "1 Einheit" : `${ohneNummer} Einheiten`} stand keine „Nr. laut Blatt“ im Abgleich. ` +
          "Ihre Nummern vergibt die App neu, sie können von denen auf dem alten Lageblatt abweichen: " +
          "neues Lageblatt drucken und das alte abnehmen.",
      });
    }
  }

  if (!zeilen) {
    return (
      <section className="karte papier-abgleich" aria-label="Lage vom Papier abgleichen">
        <p>
          <strong>
            Vom Papier eingelesen, Lage noch nicht abgeglichen: {offen.length === 1 ? "1 Einheit" : `${offen.length} Einheiten`}.
          </strong>{" "}
          Eintreffzeit ist die Zeit des Einlesens, alle stehen als anwesend, ohne Zug, Auftrag und Nummer. Die Angaben vom
          Blatt (Seite 1 bzw. Kasten „Stand am Meldekopf“) hier in einem Schritt eintragen.
        </p>
        <button type="button" className="primaer" onClick={oeffnen}>
          Lage vom Papier abgleichen…
        </button>
      </section>
    );
  }

  return (
    <section className="karte papier-abgleich" aria-label="Lage vom Papier abgleichen">
      <h3>Lage vom Papier abgleichen ({zeilen.length})</h3>
      <p className="hinweis">
        Je Einheit, was auf dem Blatt steht — auch „Nr.“ und „Auftrag / Notiz“ aus dem Kasten „Stand am Meldekopf“.
        „Abgleich übernehmen“ schreibt alles auf einmal.
      </p>
      <datalist id={listeId}>
        {zuege.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      <ol className="papier-abgleich-liste">
        {zeilen.map((z, i) => (
          <li key={z.eintragId}>
            <strong>{z.name}</strong>
            {/* Die Nummer vom Blatt hält die Nummern des Lageblatts an der Wand
                stabil (R4-A1). Leer = die App vergibt eine. */}
            <label className="feld">
              Nr. laut Blatt (leer = App vergibt)
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={z.nummer}
                onChange={(e) => aendern(i, { nummer: e.target.value })}
              />
            </label>
            <label className="feld">
              Eingetroffen am
              <input type="datetime-local" value={z.eingetroffen} onChange={(e) => aendern(i, { eingetroffen: e.target.value })} />
            </label>
            <fieldset className="papier-status">
              <legend>Status</legend>
              <label>
                <input type="radio" name={`status-${z.eintragId}`} checked={!z.abgerueckt} onChange={() => aendern(i, { abgerueckt: false })} /> anwesend
              </label>
              <label>
                <input
                  type="radio"
                  name={`status-${z.eintragId}`}
                  checked={z.abgerueckt}
                  onChange={() => aendern(i, { abgerueckt: true, abgerueckAm: z.abgerueckAm || z.eingetroffen })}
                />{" "}
                abgerückt
              </label>
            </fieldset>
            {z.abgerueckt && (
              <label className="feld">
                Abgerückt am
                <input type="datetime-local" value={z.abgerueckAm} onChange={(e) => aendern(i, { abgerueckAm: e.target.value })} />
              </label>
            )}
            <label className="feld">
              Zug (leer = ohne)
              <input type="text" list={listeId} value={z.zug} onChange={(e) => aendern(i, { zug: e.target.value })} />
            </label>
            {/* Der Abgleich nimmt alles auf, was im Kasten steht: Pumpe 2 defekt
                oder „nur für Abschnitt Nord" gingen sonst verloren (R4-A2). */}
            <label className="feld">
              Auftrag / Notiz (leer = keiner)
              <input type="text" value={z.notiz} onChange={(e) => aendern(i, { notiz: e.target.value })} />
            </label>
          </li>
        ))}
      </ol>
      <div className="vorlage-aktionen">
        <button type="button" className="primaer" onClick={() => void uebernehmen()}>
          Abgleich übernehmen
        </button>{" "}
        <button type="button" onClick={() => setZeilen(null)}>
          Später
        </button>
      </div>
    </section>
  );
}

/** Marke an der Karte, solange der Abgleich fehlt. */
export function PapierMarke({ eintrag }: { eintrag: MeldeEintrag }) {
  if (eintrag.vomPapier == null) return null;
  return (
    <span className="papier-badge" title={`Vom Papier eingelesen ${zeitKurz(eintrag.vomPapier)} — Eintreffzeit, Status und Zug noch nicht abgeglichen`}>
      vom Papier, Zeiten prüfen
    </span>
  );
}
