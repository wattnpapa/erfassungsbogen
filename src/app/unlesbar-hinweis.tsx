/**
 * Hinweis auf Einträge, die die App nicht anzeigen kann (R7-N3, R7-E2): Zahl,
 * Folge für die Lage und ein Weg zur Sicherung. Ohne ihn hielt der Helfer die
 * angezeigte Stärke für vollständig.
 *
 * Runde 9: Der Kasten sagt in Worten des Helfers, was fehlt (Sammlung mit Namen statt „Gesamttext“),
 * dass erst „Daten sichern…“ eine Datei anlegt und dass Sammel-PDF und Lageblatt auf Papier der Weg
 * zurück sind (R9-A1, R9-N4, R9-H4). Zu sehen sind höchstens zwei Zeilen; das Übrige steht hinter dem
 * Antippen, damit „Neuen Bogen erstellen“ im ersten Bild bleibt (R9-M6, R9-S4). Ließ sich ein
 * beschädigter Text wegen vollen Speichers nicht beiseitelegen, sagt der Kasten das und die App
 * überschreibt ihn nicht (R9-O1, R9-E5).
 */
import { useState } from "react";
import { ausgelasseneMeldungen, ausgelasseneMeldungenGesamt } from "./einsaetze-lesen";
import { rettungOffenArten, rettungOffenText, unlesbarBestand, type TextArt } from "./unlesbar";
import { beiseitegelegtesEntfernen, textBeschreiben } from "./unlesbar-aufraeumen";
import { sicherungAlsDatei } from "./sicherung-datei";
import { frageJaNein } from "./dialoge";

function n(x: number, eins: string, viele: string): string {
  return `${x} ${x === 1 ? eins : viele}`;
}

/** Kurz in Worten des Helfers: welche Sammlung, wie viele Meldungen (soweit am Text noch erkennbar). */
export function textKurz(art: TextArt, text: string): string {
  if (art === "absenderkarte") return "Absenderkarte (Name und Kontakt für übergebene Bögen)";
  const { namen, zahl } = textBeschreiben(art, text);
  if (art === "vorlagen") return zahl > 0 ? `gespeicherte Vorlagen (etwa ${n(zahl, "Vorlage", "Vorlagen")})` : "gespeicherte Vorlagen";
  const wer = namen.length > 0 ? `Sammlung ${namen.map((x) => `„${x}“`).join(", ")}` : "gespeicherte Einsatz-Sammlungen";
  return zahl > 0 ? `${wer} (etwa ${n(zahl, "Meldung", "Meldungen")})` : wer;
}

/** Aufklapp-Kopf: die ersten zwei Zeilen sind der Hinweis selbst, groß genug zum Antippen. */
const KOPF = { cursor: "pointer", minHeight: "44px", display: "block", margin: 0 } as const;

export function UnlesbarHinweis({ sammlungId }: { sammlungId?: string }) {
  const [runde, setRunde] = useState(0);
  const [quittung, setQuittung] = useState("");
  void runde;
  const beiseite = unlesbarBestand();
  const teile: string[] = [];
  if (sammlungId) {
    const ausg = ausgelasseneMeldungen(sammlungId);
    if (ausg > 0) teile.push(n(ausg, "Meldung dieser Sammlung", "Meldungen dieser Sammlung"));
    const bm = beiseite?.meldungen.filter((m) => m.sammlungId === sammlungId).length ?? 0;
    if (bm > 0) teile.push(n(bm, "weitere Meldung (beiseitegelegt)", "weitere Meldungen (beiseitegelegt)"));
  } else {
    const ausg = ausgelasseneMeldungenGesamt();
    const bm = beiseite?.meldungen.length ?? 0;
    if (ausg + bm > 0) teile.push(n(ausg + bm, "Meldung in einer Sammlung", "Meldungen in Sammlungen"));
    if (beiseite?.sammlungen.length) teile.push(n(beiseite.sammlungen.length, "ganze Sammlung", "ganze Sammlungen"));
    if (beiseite?.vorlagen.length) teile.push(n(beiseite.vorlagen.length, "Vorlage", "Vorlagen"));
    for (const t of beiseite?.texte ?? []) teile.push(textKurz(t.art, t.text));
  }
  // Voller Speicher: Der Text liegt noch unverändert am Ursprungsort (R9-O1).
  const offen = sammlungId ? [] : rettungOffenArten();
  const sichern = async () => {
    const name = await sicherungAlsDatei();
    setQuittung(`Sicherung „${name}“ erzeugt (Downloads).`);
  };
  if (teile.length === 0 && offen.length === 0) return null;

  if (offen.length > 0 && teile.length === 0) {
    const was = offen.map((a) => textKurz(a, rettungOffenText(a) ?? "")).join(" und ");
    // Mehrzahl beugt Verb und Satzende mit („Die gespeicherten Einsatz-Sammlungen sind nicht lesbar …", R10-O1).
    const mehrzahl = offen.length > 1 || /Sammlungen|Vorlagen|“, „/.test(was);
    return (
      <div className="warnung unlesbar-hinweis" role="alert">
        <details>
          <summary style={KOPF}>
            <strong>Speicher voll – beschädigte Daten nicht gesichert:</strong> {was} {mehrzahl ? "sind" : "ist"} nicht lesbar und{" "}
            {mehrzahl ? "konnten" : "konnte"} nicht beiseitegelegt werden. ›
          </summary>
          <p>
            Der Text liegt unverändert auf dem Gerät, die App überschreibt ihn nicht — Änderungen an {offen.includes("sammlungen") ? "Sammlungen" : "Vorlagen"} werden
            bis dahin nicht gespeichert. Zuerst „Daten sichern…“ (die Datei enthält den Text), dann Platz schaffen:{" "}
            {offen.includes("sammlungen")
              ? "„Beschädigten Text verwerfen…“ (das schafft den Platz; es gibt keine lesbaren Einsätze, die sich löschen ließen), die App neu laden und die Bögen aus der letzten Sammel-PDF wieder einlesen."
              : "Papierkorb leeren oder gesicherte Einsätze löschen, und die App neu laden."}{" "}
            Auf Papier bleiben die letzte Sammel-PDF und das Lageblatt gültig.
          </p>
          <div className="aktionen">
            <button type="button" onClick={sichern}>Daten sichern…</button>
            <button
              type="button"
              className="gefahr"
              onClick={async () => {
                const ja = await frageJaNein({
                  titel: "Beschädigten Text verwerfen?",
                  text: "Der nicht lesbare Text wird durch den lesbaren Rest ersetzt (bei völliger Beschädigung durch eine leere Liste) und ist dann endgültig weg. Wenn du ihn noch prüfen willst, vorher „Daten sichern…“.",
                  ok: "Endgültig verwerfen",
                  gefahr: true,
                });
                if (!ja) return;
                const ok = beiseitegelegtesEntfernen();
                setQuittung(ok ? "Verworfen." : "Der Text ließ sich nicht ersetzen (Speicher voll). Zuerst Platz schaffen.");
                setRunde((r) => r + 1);
              }}
            >
              Beschädigten Text verwerfen…
            </button>
          </div>
          {quittung && <p className="hinweis">{quittung}</p>}
        </details>
      </div>
    );
  }

  return (
    <div className="warnung unlesbar-hinweis" role="status">
      <details>
        <summary style={KOPF}>
          <strong>Nicht lesbar: {teile.join(", ")}.</strong> {sammlungId ? "Liegt beiseite, fehlt in Liste und Zählung." : "Liegt beiseite, fehlt in Listen und Zählung."} ›
        </summary>
        <p>
          Die Stärke kann zu niedrig sein. Beiseitegelegt heißt: nicht gelöscht, aber noch keine Kopie — erst „Daten sichern…“ legt eine
          Datei an (Downloads). Die App kann den Text nicht öffnen; die Datei kann, wer die App betreut.
        </p>
        <p>
          <strong>Weg zurück auf Papier:</strong> die letzte Sammel-PDF gilt weiter — ihre Bögen mit „Bögen einlesen…“ bzw. „Einsatz importieren…“
          neu einlesen. Das Lageblatt dient nur zum Aushängen und Abgleichen und lässt sich nicht einlesen.
        </p>
        {offen.length > 0 && (
          <p className="warnung-text">
            <strong>Speicher voll:</strong> {offen.map((a) => textKurz(a, rettungOffenText(a) ?? "")).join(" und ")} ließ sich nicht beiseitelegen und
            liegt unverändert am alten Ort; bis Platz ist, werden dort keine Änderungen gespeichert.
          </p>
        )}
        <div className="aktionen">
          <button type="button" onClick={sichern}>Daten sichern…</button>
          {!sammlungId && beiseite && (
            <button
              type="button"
              className="gefahr"
              onClick={async () => {
                const ja = await frageJaNein({
                  titel: "Beiseitegelegte Einträge entfernen?",
                  text: `Endgültig gelöscht wird, was beiseitegelegt liegt: ${teile.join("; ")}. Auch der beschädigte Text am alten Ort wird durch den lesbaren Rest ersetzt. Wenn du sie noch prüfen willst, vorher „Daten sichern…“.`,
                  ok: "Endgültig entfernen",
                  gefahr: true,
                });
                if (!ja) return;
                const ok = beiseitegelegtesEntfernen();
                if (!ok) setQuittung("Entfernt, aber der beschädigte Text am alten Ort ließ sich nicht ersetzen (Speicher). Der Hinweis kann nach dem Neuladen wiederkehren.");
                setRunde((r) => r + 1);
              }}
            >
              Beiseitegelegtes entfernen…
            </button>
          )}
        </div>
        {quittung && <p className="hinweis">{quittung}</p>}
      </details>
    </div>
  );
}
