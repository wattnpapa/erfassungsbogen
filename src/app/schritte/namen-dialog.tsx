/**
 * Inhalt des Fensters „Namen einfügen…" in Schritt 3 (Personal): Namensliste einfügen, Vorschau mit Plätzen und Marken,
 * Reihenfolge wählen, Beispielnamen für Übungen.
 *
 * Eigene Datei, die Schritt 3 per `React.lazy` nachlädt: Der Zerleger (personal-schnell), die Beispielnamen und die Vorschau
 * gehören nur zu diesem Fenster und sollen das Startbündel nicht vergrößern (ADR-003, Aufnahmeregel 5). Titel, Kopfzeile und
 * Hinweis stehen im Schritt selbst, damit das Fenster sofort da ist.
 */
import { useState } from "react";
import { StaerkeRolle, type Erfassungsbogen, type Person } from "@bos/eeb-format/model";
import { kontaktAusNummer, namenEinsetzen, namenVerdachtGruende, parseNamen, telefonAbtrennen, type NamenReihenfolge } from "../personal-schnell";
import { beispielPersonen } from "../beispielnamen";
import { beispielMerken } from "../beispiel-herkunft";
import { neuePerson, personUnbenannt, vokabularFuer } from "../hilfen";
import { frageJaNein } from "../dialoge";
import { Feld, ZahlFeld } from "./bausteine";
import { ROLLE_LABEL, benannte, platzText } from "./personal";

export default function NamenInhalt({ bogen, onUebernehmen, onBeispiele }: {
  bogen: Erfassungsbogen;
  /** Die Liste ist übernommen: neue Personenliste samt Quittungstext für „Rückgängig". */
  onUebernehmen: (personal: Person[], text: string) => void;
  /** Beispielpersonen (nur Übungsbögen) sind erzeugt: die neue Personenliste. */
  onBeispiele: (personal: Person[]) => void;
}) {
  const [namenText, setNamenText] = useState("");
  // Wie Zeilen ohne Komma zu lesen sind: bis der Helfer es gewählt hat, trägt jede solche Zeile „Reihenfolge prüfen" (R17-E1, R17-N1).
  const [reihenfolge, setReihenfolge] = useState<NamenReihenfolge | null>(null);
  const namenAlle = parseNamen(namenText, { reihenfolge: reihenfolge ?? "vorname", pruefen: reihenfolge == null });
  const zeilenOhneKomma = namenText
    .split(/\r?\n/)
    .filter((z) => z.trim() !== "" && !/[,;\t]/.test(z) && telefonAbtrennen(z.trim()).zeile.split(/\s+/).length >= 2).length;
  // Solange die Lesart nicht gewählt ist, bleibt „Übernehmen" gesperrt (R18-S7).
  const reihenfolgeOffen = zeilenOhneKomma > 0 && reihenfolge == null;
  // Zeilen, die kein Name sein dürften (Ziffern, Klammern, Semikolon), tragen eine
  // Marke und werden nur übernommen, wenn sie ausdrücklich angehakt sind (R7-E7).
  const namenVerdaechtig = (n: { vorname: string; nachname: string }) =>
    /[\d()\[\]{};<>]/.test(`${n.vorname} ${n.nachname}`) || !/\p{L}/u.test(`${n.vorname}${n.nachname}`);
  const zeilenSchluessel = (n: { vorname: string; nachname: string }, i: number) => `${i}:${n.nachname}|${n.vorname}`;
  const [verdachtAngehakt, setVerdachtAngehakt] = useState<ReadonlySet<string>>(() => new Set());
  const namenVorschau = namenAlle.filter((n, i) => !namenVerdaechtig(n) || verdachtAngehakt.has(zeilenSchluessel(n, i)));
  // Dubletten kennzeichnen — in der Liste selbst und gegenüber schon
  // erfassten Personen. Übernommen werden sie trotzdem (zwei gleichnamige
  // Helfer gibt es), aber nicht unbemerkt (Audit „Fehler", E6).
  const namensSchluessel = (v: string, n: string) => `${n.trim().toLowerCase()}|${v.trim().toLowerCase()}`;
  const schonErfasst = new Set(bogen.personal.map((p) => namensSchluessel(p.vorname, p.nachname)));
  const vorschauDoppelt = namenVorschau.map((n, i) => {
    const k = namensSchluessel(n.vorname, n.nachname);
    return schonErfasst.has(k) || namenVorschau.findIndex((m) => namensSchluessel(m.vorname, m.nachname) === k) < i;
  });
  const anzahlDoppelt = vorschauDoppelt.filter(Boolean).length;

  /**
   * Eingefügte Zeile → Person. Das Funktionsfeld wandert in die Funktionsliste
   * (als Vokabeleintrag, wenn das Kürzel im Vokabular der Organisation steht,
   * sonst als Freitext) und bringt die Stärke-Rolle mit — ohne das zählte ein
   * eingefügter Zugführer als Mannschaft.
   */
  function personAusZeile(n: (typeof namenVorschau)[number]) {
    const person = { ...neuePerson(), vorname: n.vorname, nachname: n.nachname };
    if (n.rolle != null) person.staerkeRolle = n.rolle;
    // Rufnummer am Zeilenende: als dienstlicher Kontakt statt als „Name mit Ziffern" (R17-H5).
    const kontakt = n.telefon ? kontaktAusNummer(n.telefon) : null;
    if (kontakt) person.kontakte = [kontakt];
    if (n.funktion) {
      const tabelle = vokabularFuer(bogen.einheit.organisation, "funktion");
      const gesucht = n.funktion.toLowerCase();
      const treffer = tabelle.find(
        (v) => v.kurz?.toLowerCase() === gesucht || v.name.toLowerCase() === gesucht,
      );
      person.funktionen = [treffer ? { code: treffer.code } : { freitext: n.funktion }];
    }
    return person;
  }
  // Wohin jeder Name kommt — freie Sollplätze zuerst (R2-N2). Die Vorschau
  // zeigt es, bevor übernommen wird.
  const vorschauPlaetze = namenEinsetzen(bogen.personal, namenVorschau.map(personAusZeile), personUnbenannt).plaetze;
  // Anzahl für den Beispielnamen-Generator (nur Übungsbögen). Vorgabe 9:
  // Trupp bis Gruppe, die häufigste Größenordnung in Übungslagen.
  const [beispielAnzahl, setBeispielAnzahl] = useState(9);

  function namenUebernehmen() {
    if (namenVorschau.length === 0) return;
    const { personal, plaetze } = namenEinsetzen(bogen.personal, namenVorschau.map(personAusZeile), personUnbenannt);
    const eingesetzt = plaetze.filter((x) => x != null).length;
    onUebernehmen(
      personal,
      `${namenVorschau.length} ${namenVorschau.length === 1 ? "Name" : "Namen"} übernommen` +
        (eingesetzt > 0 ? ` — ${eingesetzt} davon in freie Sollplätze.` : "."),
    );
    // Die gewählte Ansicht bleibt (R12-N6): Wer Karten wählt, bekommt nach „Übernehmen“ keine Tabelle.
    setNamenText("");
    setReihenfolge(null);
    setVerdachtAngehakt(new Set());
  }

  function beispielnamenUebernehmen() {
    const anzahl = Math.max(1, Math.min(99, beispielAnzahl));
    const bestand = benannte(bogen.personal);
    const erzeugt = beispielPersonen(anzahl, bestand);
    beispielMerken({ personal: erzeugt }); // erfundene Namen: Rückfrage beim Abwählen von „Übung" (R14-E6)
    onBeispiele([...bestand, ...erzeugt]);
  }

  return (
    <>
      {/* Sichtbare Beschriftung statt nur Platzhalter: der verschwand mit
          der ersten Eingabe, und mit ihm der Name des Felds (R2-M5). */}
      <label className="feld">
        Namensliste (eine Person je Zeile)
        <textarea
          rows={8}
          value={namenText}
          onChange={(e) => setNamenText(e.target.value)}
          placeholder={"Muster, Max\nErika Musterfrau\n…"}
          style={{ width: "100%" }}
        />
      </label>
      {/* R8-E2: Escape, Zurück-Geste und „Schließen“ verwerfen die Liste nicht mehr — sie bleibt im Feld,
          bis sie übernommen oder von Hand geleert wird. */}
      {namenText.trim() !== "" && (
        <p className="hinweis">
          Die Liste bleibt stehen, auch wenn du das Fenster schließt — bis du sie übernimmst oder leerst.{" "}
          <button
            type="button"
            onClick={async () => {
              // Ab einer Handvoll Zeilen fragen: eine aus einer Nachricht kopierte Liste ist sonst mit einem Tipp weg (R10-D3).
              if (namenAlle.length >= 4) {
                const ja = await frageJaNein({
                  titel: `${namenAlle.length} Zeilen verwerfen?`,
                  text: "Die eingefügte Liste wird geleert. Sie ist danach nicht wiederherzustellen — nur neu einzufügen.",
                  ok: "Liste leeren",
                  abbruch: "Liste behalten",
                  gefahr: true,
                  fokus: "abbruch",
                });
                if (!ja) return;
              }
              setNamenText("");
              setReihenfolge(null);
              setVerdachtAngehakt(new Set());
            }}
          >
            Liste leeren
          </button>
        </p>
      )}
      {/* Reihenfolge einmal für die ganze Liste festlegen, statt je Zeile zu raten (R17-E1, R17-N1): „Meier Karl" kann
          Nachname Vorname oder Vorname Nachname heißen. Solange nichts gewählt ist, trägt jede solche Zeile „Reihenfolge prüfen". */}
      {zeilenOhneKomma > 0 && (
        <fieldset className="reihenfolge-wahl">
          <legend>
            {zeilenOhneKomma === 1 ? "Die Zeile ohne Komma lese ich als" : `${zeilenOhneKomma} Zeilen ohne Komma lese ich als`}
            {reihenfolge == null ? " (bitte bestätigen)" : ""}
          </legend>
          {([
            ["vorname", "Vorname Nachname"],
            ["nachname", "Nachname Vorname"],
          ] as const).map(([wert, label]) => (
            <label className="inline" key={wert}>
              <input
                type="radio"
                name="namen-reihenfolge"
                checked={reihenfolge === wert} // keine Vorauswahl: Bei „Meier Hans" wäre jede geratene Lesart eine stille Vertauschung (R18-S7)
                onChange={() => setReihenfolge(wert)}
                onClick={() => setReihenfolge(wert)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}
      {/* Vorschau: Wer welche Rolle bekommt, entscheidet über die gemeldete
          Stärke — das darf nicht erst im fertigen Bogen auffallen. */}
      {namenAlle.length > 0 && (
        <ul className="namen-vorschau">
          {(() => {
            let wirksam = -1;
            return namenAlle.map((n, i) => {
              const verdacht = namenVerdaechtig(n);
              const schluessel = zeilenSchluessel(n, i);
              const dabei = !verdacht || verdachtAngehakt.has(schluessel);
              if (dabei) wirksam++;
              const w = wirksam;
              return (
                <li key={i}>
                  {verdacht && (
                    <label className="inline">
                      <input
                        type="checkbox"
                        aria-label={`„${[n.nachname, n.vorname].filter(Boolean).join(", ")}" trotzdem als Name übernehmen`}
                        checked={dabei}
                        onChange={(e) =>
                          setVerdachtAngehakt((alt) => {
                            const neu = new Set(alt);
                            if (e.target.checked) neu.add(schluessel);
                            else neu.delete(schluessel);
                            return neu;
                          })
                        }
                      />
                    </label>
                  )}
                  {/* „Vorname Nachname" in der Lesart, die gerade gilt (R18-S7): „Nachname, Vorname" las sich wie eine Vertauschung. */}
                  {[n.vorname, n.nachname].filter(Boolean).join(" ")}
                  {n.funktion ? ` · ${n.funktion}` : ""}
                  {n.telefon ? ` · Tel. ${n.telefon}` : ""}
                  {" · "}
                  {verdacht && !dabei ? (
                    <strong>wird nicht übernommen</strong>
                  ) : (
                    <strong>
                      {vorschauPlaetze[w] != null
                        ? `→ Platz ${vorschauPlaetze[w]! + 1}: ${platzText(bogen.personal[vorschauPlaetze[w]!]!, bogen.einheit.organisation)}`
                        : ROLLE_LABEL[n.rolle ?? StaerkeRolle.MANNSCHAFT]}
                    </strong>
                  )}
                  {verdacht && <span className="uebung-badge">kein Name?</span>}
                  {!verdacht && n.unsicher && <span className="uebung-badge">Reihenfolge prüfen</span>}
                  {dabei && vorschauDoppelt[w] && <span className="uebung-badge">doppelt</span>}
                </li>
              );
            });
          })()}
        </ul>
      )}
      {namenAlle.some(namenVerdaechtig) && (
        <p className="warnung" role="status">
          {namenAlle.filter(namenVerdaechtig).length === 1 ? "Eine Zeile sieht" : `${namenAlle.filter(namenVerdaechtig).length} Zeilen sehen`} nicht
          nach einem Namen aus ({namenVerdachtGruende(namenAlle.filter(namenVerdaechtig))}) und {namenAlle.filter(namenVerdaechtig).length === 1 ? "wird" : "werden"} nicht übernommen. Wer sie
          doch braucht, hakt sie an.
        </p>
      )}
      {namenAlle.some((n) => n.unsicher && !namenVerdaechtig(n)) && (
        <p className="warnung" role="status">
          Bei „Reihenfolge prüfen" ist die Reihenfolge geraten (mehrere Wörter ohne Komma oder vor dem Komma, Funktion ohne Komma) — die
          Vorschau zeigt „Vorname Nachname" in der gewählten Lesart. Stimmt das nicht, oben die Reihenfolge ändern oder die Zeile als „Nachname, Vorname, Funktion" schreiben.
        </p>
      )}
      {anzahlDoppelt > 0 && (
        <p className="warnung" role="status">
          {anzahlDoppelt === 1 ? "Ein Name steht" : `${anzahlDoppelt} Namen stehen`} doppelt — in der Liste oder
          schon im Bogen. Übernommen werden sie trotzdem; wenn es dieselbe Person ist, die Zeile vorher löschen.
        </p>
      )}
      {/* R19-E10: „Übernehmen" und der Grund der Sperre bleiben am unteren Rand des Fensters stehen (index.html, .namen-fuss). */}
      <div className="namen-fuss">
      <p>
        <button type="button" className="primaer" disabled={namenVorschau.length === 0 || reihenfolgeOffen} aria-describedby={reihenfolgeOffen && namenVorschau.length > 0 ? "namen-reihenfolge-fehlt" : undefined} onClick={namenUebernehmen}>
          {namenVorschau.length === 0
            ? "Übernehmen"
            : `${namenVorschau.length} ${namenVorschau.length === 1 ? "Person" : "Personen"} übernehmen${
                namenAlle.length > namenVorschau.length ? ` (${namenAlle.length - namenVorschau.length} nicht)` : ""
              }`}
        </button>
      </p>
      {/* Der gesperrte Knopf sagt, was fehlt (R18-S7). */}
      {reihenfolgeOffen && namenVorschau.length > 0 && (
        <p className="hinweis" id="namen-reihenfolge-fehlt">
          „Übernehmen“ geht erst, wenn oben gewählt ist, ob die Zeilen ohne Komma „Vorname Nachname“ oder „Nachname Vorname“ lauten.
        </p>
      )}
      </div>
      {/* Beispielnamen nur bei Übungsbögen (Haken in Schritt 2): im echten
          Einsatz existiert dieser Weg gar nicht erst — künstliche Daten
          lassen sich dort auch nicht versehentlich erzeugen. */}
      {bogen.uebung && (
        <>
          <h3>Beispielnamen (Übung)</h3>
          <p className="hinweis">
            Erzeugt erkennbar fiktive Personen mit zufälligem Namen, Geschlecht, Ernährung
            und Fahrerlaubnis; Unterführerplätze (Gruppen-/Truppführer) werden passend zur Stärke verteilt, ein Führerplatz erst ab Zugstärke.
          </p>
          <div className="zeile">
            <Feld titel="Anzahl" schmal>
              <ZahlFeld wert={beispielAnzahl} setzen={setBeispielAnzahl} min={1} max={99} einheit="Personen" />
            </Feld>
            <button type="button" onClick={beispielnamenUebernehmen}>
              Beispielpersonen einfügen
            </button>
          </div>
        </>
      )}
    </>
  );
}
