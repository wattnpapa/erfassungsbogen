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

import { useEffect, useId, useRef, useState } from "react";
import { MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { geltendeJeEinheit } from "./fassung-vorrang";
import { einheitAnzeigename } from "./hilfen";
import { eintreffzeit, papierAbgleichUebernehmen, SpeicherVollFehler, zeitKurz } from "./eintrag-zeiten";
import { frageJaNein, zeigeHinweis } from "./dialoge";
import { einsaetzeLaden } from "./einsaetze-lesen";
import { meldungsNummern, nummernWechsel, nummernWechselListe } from "./einheiten-tabelle";
import {
  abgleichEntwurfLaden,
  abgleichEntwurfLoeschen,
  abgleichEntwurfSpeichern,
  abgleichZeilenMitEntwurf,
  geaenderteZeilen,
  type AbgleichZeile,
} from "./papier-abgleich-entwurf";

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

type Zeile = AbgleichZeile;

export function PapierAbgleich(props: {
  einsatzId: string;
  eintraege: MeldeEintrag[];
  /** Züge, die in der Sammlung schon vorkommen — Vorschläge fürs Zugfeld. */
  zuege: string[];
  onGeaendert: () => void;
  /**
   * Zählt hoch, wenn der Abgleich von außen geöffnet werden soll — der Knopf im
   * Bericht von „Bögen einlesen…“ (R4-A6). 0 = nie angestoßen.
   */
  anstoss?: number;
  /**
   * Der Bericht von „Bögen einlesen…“ steht offen und trägt selbst den Knopf: Hier steht dann
   * keiner, ein Weg zum Abgleich, einmal (R5-N9).
   */
  knopfImBericht?: boolean;
}) {
  const { einsatzId, eintraege, zuege, onGeaendert } = props;
  const offen = offenVomPapier(eintraege);
  const [zeilen, setZeilen] = useState<Zeile[] | null>(null);
  // Zwischenstand im Sitzungsspeicher (R7-S1): überlebt Neuladen, „Später" und die Startseite.
  const [entwurfAnzahl, setEntwurfAnzahl] = useState(() => abgleichEntwurfLaden(props.einsatzId).length);
  const basisRef = useRef<Zeile[]>([]);
  useEffect(() => {
    if (zeilen) abgleichEntwurfSpeichern(einsatzId, zeilen, basisRef.current);
  }, [zeilen, einsatzId]);
  const listeId = useId();
  const karte = useRef<HTMLElement>(null);
  const letzterAnstoss = useRef(props.anstoss ?? 0);
  const anstoss = props.anstoss ?? 0;
  const offenAnzahl = offen.length;
  const insBild = useRef(false);
  const oeffnenRef = useRef<(() => void) | null>(null);
  // Hooks vor dem frühen Ausstieg. Öffnet den Abgleich (wie sein eigener Knopf)
  // und holt ihn ins Bild, sobald die Liste steht.
  useEffect(() => {
    if (anstoss === letzterAnstoss.current) return;
    letzterAnstoss.current = anstoss;
    if (offenAnzahl === 0) return;
    insBild.current = true;
    oeffnenRef.current?.();
  }, [anstoss, offenAnzahl]);
  useEffect(() => {
    if (!zeilen || !insBild.current) return;
    insBild.current = false;
    karte.current?.scrollIntoView?.({ block: "start" });
  }, [zeilen]);
  if (offen.length === 0) return null;

  const basisZeilen = (): Zeile[] =>
      offen.map((e) => ({
        eintragId: e.id,
        name: `${einheitAnzeigename(e.bogen.einheit)}${e.teilEtikett ? ` (${e.teilEtikett})` : ""}`,
        // Leer: Die Zeit des Einlesens ist keine Eintreffzeit (R5-A1).
        eingetroffen: "",
        abgerueckt: e.status === MeldeStatus.ABGERUECKT,
        abgerueckAm: e.abgerueckAm != null ? zuLokal(e.abgerueckAm) : "",
        zug: e.zugEtikett ?? "",
        notiz: e.notiz ?? "",
        nummer: "",
      }));
  const oeffnen = () => {
    const basis = basisZeilen();
    basisRef.current = basis;
    const mitEntwurf = abgleichZeilenMitEntwurf(basis, abgleichEntwurfLaden(einsatzId));
    setZeilen(mitEntwurf);
    setEntwurfAnzahl(geaenderteZeilen(mitEntwurf, basis));
  };
  oeffnenRef.current = oeffnen;
  const aendern = (i: number, teil: Partial<Zeile>) =>
    setZeilen((z) => (z ? z.map((x, j) => (j === i ? { ...x, ...teil } : x)) : z));

  /** „Später": das Formular schließt, der Zwischenstand bleibt im Sitzungsspeicher (R7-S1/R7-G1). */
  function spaeter() {
    if (!zeilen) return;
    setEntwurfAnzahl(geaenderteZeilen(zeilen, basisRef.current));
    setZeilen(null);
  }

  /** Eingaben bewusst wegwerfen — mit Rückfrage, wenn schon etwas eingetragen ist. */
  async function eingabenVerwerfen() {
    const n = zeilen ? geaenderteZeilen(zeilen, basisRef.current) : entwurfAnzahl;
    if (n > 0) {
      const ja = await frageJaNein({
        titel: "Eingaben verwerfen?",
        text: `Die Eingaben für ${n === 1 ? "1 Einheit" : `${n} Einheiten`} werden gelöscht. Sie stehen dann nur noch auf dem Papier.`,
        ok: "Verwerfen",
        gefahr: true,
      });
      if (!ja) return;
    }
    abgleichEntwurfLoeschen(einsatzId);
    setEntwurfAnzahl(0);
    setZeilen(null);
  }

  async function uebernehmen() {
    if (!zeilen) return;
    const fehler: string[] = [];
    const daten = zeilen.map((z) => {
      const ein = ausLokal(z.eingetroffen);
      const ab = z.abgerueckt ? ausLokal(z.abgerueckAm) : null;
      // Eine fehlende Abrückzeit hält den Abgleich nicht auf: Sie bleibt „nicht bestätigt" (R6-A6).
      if (ein != null && ab != null && ab < ein) fehler.push(`${z.name}: Abrücken vor dem Eintreffen`);
      const nr = z.nummer.trim() === "" ? undefined : Number(z.nummer.trim());
      if (nr != null && (!Number.isInteger(nr) || nr < 1)) fehler.push(`${z.name}: „Nr.“ muss eine ganze Zahl ab 1 sein`);
      return {
        eintragId: z.eintragId,
        ...(ein != null ? { eingetroffenAm: ein } : {}),
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
    // Eine Nummer vom Blatt, die schon eine nicht beteiligte Einheit trägt, verschiebt deren
    // Nummer (R8-W1): vorher nennen, nicht erst hinterher.
    const beteiligt = new Set(zeilen.map((z) => eintraege.find((e) => e.id === z.eintragId)?.einheitSchluessel));
    const jetzigeNummern = meldungsNummern(eintraege);
    const namenJe = new Map(eintraege.map((e) => [e.einheitSchluessel, einheitAnzeigename(e.bogen.einheit)]));
    const belegt: string[] = [];
    for (const d of daten) {
      if (!("nummer" in d) || d.nummer == null) continue;
      for (const [schl, nr] of jetzigeNummern) {
        if (nr === d.nummer && !beteiligt.has(schl)) belegt.push(`Nr. ${nr} trägt schon ${namenJe.get(schl) ?? schl}`);
      }
    }
    if (belegt.length > 0) {
      const weiter = await frageJaNein({
        titel: "Nummer schon vergeben",
        text: `${belegt.join("; ")}. Diese Einheit ist nicht Teil des Abgleichs und bekommt eine andere Nummer. Trotzdem übernehmen?`,
        ok: "Übernehmen",
      });
      if (!weiter) return;
    }
    try {
      papierAbgleichUebernehmen(einsatzId, daten);
    } catch (e) {
      await zeigeHinweis({ titel: "Abgleich", text: e instanceof SpeicherVollFehler ? e.message : String(e) });
      return;
    }
    const namenOhneNummer = zeilen.filter((z) => z.nummer.trim() === "").map((z) => z.name);
    const namenOhneZeit = zeilen.filter((z) => z.eingetroffen.trim() === "").map((z) => z.name);
    const namenOhneAbrueckzeit = zeilen.filter((z) => z.abgerueckt && ausLokal(z.abgerueckAm) == null).map((z) => z.name);
    const ohneNummer = namenOhneNummer.length;
    const ohneZeit = namenOhneZeit.length;
    abgleichEntwurfLoeschen(einsatzId);
    setEntwurfAnzahl(0);
    setZeilen(null);
    onGeaendert();
    // Alle Einheiten, deren Nummer sich ändert — auch die nicht beteiligten (R8-W1).
    const nachher = einsaetzeLaden().find((x) => x.id === einsatzId)?.eintraege ?? eintraege;
    const wechsel = nummernWechsel(eintraege, nachher);
    // Ohne „Nr. laut Blatt" vergibt die App die Nummern nach dem Eingang — das
    // sind nach einem Wiederanlauf vom Papier meist andere als auf dem Blatt
    // an der Wand (R4-A1). Das gehört gesagt, bevor jemand „Nr. 3 rückt ab"
    // funkt.
    // Ein Fenster statt zwei hintereinander, mit den betroffenen Einheiten (R6-N3).
    const nenne = (namen: string[]) => `${namen.slice(0, 5).join(", ")}${namen.length > 5 ? ` und ${namen.length - 5} weitere` : ""}`;
    const zeitText =
      `Für ${ohneZeit === 1 ? "1 Einheit" : `${ohneZeit} Einheiten`} stand keine Eintreffzeit im Abgleich (${nenne(namenOhneZeit)}). ` +
      "Es gilt weiter die Zeit des Einlesens; die Karte trägt „vom Papier, Zeiten prüfen“ und das Lageblatt kennzeichnet die Zeit als nicht bestätigt, bis die Zeit vom Blatt eingetragen ist.";
    // Die Abrückzeit gehört dazu (R7-A2): fehlt sie, bleibt sie „nicht bestätigt" und steht so auf Karte und Lageblatt.
    const abrueckText =
      `Für ${namenOhneAbrueckzeit.length === 1 ? "1 abgerückte Einheit" : `${namenOhneAbrueckzeit.length} abgerückte Einheiten`} stand keine Abrückzeit im Abgleich (${nenne(namenOhneAbrueckzeit)}). ` +
      "Karte und Lageblatt vermerken „Abrückzeit nicht bestätigt“, bis sie an der Karte nachgetragen ist.";
    const nummerText =
      `Für ${ohneNummer === 1 ? "1 Einheit" : `${ohneNummer} Einheiten`} stand keine „Nr. laut Blatt“ im Abgleich (${nenne(namenOhneNummer)}). ` +
      "Ihre Nummern vergibt die App neu, sie können von denen auf dem alten Lageblatt abweichen: " +
      "neues Lageblatt drucken und das alte abnehmen.";
    const nummernAenderung =
      wechsel.length > 0
        ? `${wechsel.length === 1 ? "1 Nummer ändert sich" : `${wechsel.length} Nummern ändern sich`}: ${nummernWechselListe(wechsel)}. ` +
          "Am Funk genannte Nummern und das gedruckte Lageblatt gelten für diese Einheiten nicht mehr: Lageblatt neu drucken."
        : "";
    const hinweise: string[] = [];
    if (ohneZeit > 0) hinweise.push(zeitText);
    if (namenOhneAbrueckzeit.length > 0) hinweise.push(abrueckText);
    if (ohneNummer > 0 || wechsel.length > 0) hinweise.push(ohneNummer > 0 ? `${nummerText}${nummernAenderung ? ` ${nummernAenderung}` : ""}` : nummernAenderung);
    if (hinweise.length > 1) {
      await zeigeHinweis({
        titel: `Abgleich übernommen – ${hinweise.length === 2 ? "zwei" : "drei"} Hinweise`,
        text: (
          <>
            {hinweise.map((h) => (
              <p key={h}>{h}</p>
            ))}
          </>
        ),
      });
    } else if (ohneZeit > 0) {
      await zeigeHinweis({ titel: "Eintreffzeit nicht bestätigt", text: zeitText });
    } else if (namenOhneAbrueckzeit.length > 0) {
      await zeigeHinweis({ titel: "Abrückzeit nicht bestätigt", text: abrueckText });
    } else if (hinweise.length === 1 && (ohneNummer > 0 || wechsel.length > 0)) {
      await zeigeHinweis({ titel: "Nummern neu vergeben", text: hinweise[0]! });
    }
  }

  if (!zeilen) {
    // Nach dem Abgleich fehlt allenfalls die Eintreffzeit: Die Karte sagt nur noch das (R6-N3).
    const nurZeitOffen = offen.length > 0 && offen.every((e) => e.papierAbgeglichen);
    return (
      <section className="karte papier-abgleich" aria-label="Lage vom Papier abgleichen" ref={karte}>
        {nurZeitOffen ? (
          <p>
            <strong>
              Abgeglichen bis auf die Eintreffzeit: {offen.length === 1 ? "1 Einheit" : `${offen.length} Einheiten`}.
            </strong>{" "}
            Nr., Zug, Status und Notiz stehen; die Eintreffzeit ist noch die Zeit des Einlesens und gilt als nicht bestätigt. Sie lässt sich hier
            nachtragen.
          </p>
        ) : (
          <p>
            <strong>
              Vom Papier eingelesen, Lage noch nicht abgeglichen: {offen.length === 1 ? "1 Einheit" : `${offen.length} Einheiten`}.
            </strong>{" "}
            Die Eintreffzeit ist die Zeit des Einlesens und gilt als nicht bestätigt, alle stehen als anwesend, ohne Zug, Auftrag und Nummer. Die Angaben vom
            Blatt (Seite 1 bzw. Kasten „Stand am Meldekopf“) hier in einem Schritt eintragen.
          </p>
        )}
        {entwurfAnzahl > 0 && (
          <p className="hinweis">
            Angefangene Eingaben für {entwurfAnzahl === 1 ? "1 Einheit" : `${entwurfAnzahl} Einheiten`} sind noch da (nur in diesem Browserfenster, bis du
            sie übernimmst oder den Tab schließt). Sie erscheinen wieder, wenn du den Abgleich öffnest.
          </p>
        )}
        {props.knopfImBericht ? (
          <p className="hinweis">Der Knopf „Lage vom Papier abgleichen…“ steht im Bericht darüber.</p>
        ) : (
          <button type="button" className="primaer" onClick={oeffnen}>
            {nurZeitOffen ? "Eintreffzeiten nachtragen…" : "Lage vom Papier abgleichen…"}
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="karte papier-abgleich" aria-label="Lage vom Papier abgleichen" ref={karte}>
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
              Eingetroffen am (leer = Zeit des Einlesens, nicht bestätigt)
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
        </button>
      </div>
      {/* Eigene Zeile mit Abstand zur Hauptaktion (R7-G1): ein Fehltipp daneben
          vernichtet nichts — die Eingaben bleiben im Sitzungsspeicher. */}
      <div className="vorlage-aktionen papier-abgleich-weg" style={{ marginTop: "1.75rem" }}>
        <button type="button" onClick={spaeter}>
          Später
        </button>{" "}
        <button type="button" className="gefahr" onClick={() => void eingabenVerwerfen()}>
          Eingaben verwerfen…
        </button>
        <p className="hinweis">„Später“ schließt nur das Formular; die Eingaben bleiben für diese Sitzung erhalten.</p>
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
