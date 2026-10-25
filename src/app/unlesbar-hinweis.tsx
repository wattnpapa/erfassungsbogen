/**
 * Hinweis auf Einträge, die die App nicht anzeigen kann (R7-N3, R7-E2): Zahl,
 * Folge für die Lage und ein Weg zur Sicherung. Ohne ihn hielt der Helfer die
 * angezeigte Stärke für vollständig.
 */
import { useState } from "react";
import { ausgelasseneMeldungen, ausgelasseneMeldungenGesamt } from "./einsaetze-lesen";
import { unlesbarBestand, unlesbarVerwerfen } from "./unlesbar";
import { sicherungAlsDatei } from "./sicherung-datei";
import { frageJaNein } from "./dialoge";

function n(x: number, eins: string, viele: string): string {
  return `${x} ${x === 1 ? eins : viele}`;
}

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
    if (beiseite?.texte.length) teile.push(n(beiseite.texte.length, "beschädigter Gesamttext (Sammlungen oder Vorlagen)", "beschädigte Gesamttexte (Sammlungen oder Vorlagen)"));
  }
  if (teile.length === 0) return null;
  return (
    <div className="warnung unlesbar-hinweis" role="status">
      <p>
        <strong>Nicht lesbar: {teile.join(", ")}.</strong> {sammlungId ? "Sie fehlen in Liste und Zählung" : "Sie fehlen in Listen und Zählung"} — die Stärke
        kann zu niedrig sein. Nichts davon ist gelöscht; die Daten stecken in der Datensicherung.
      </p>
      <div className="aktionen">
        <button
          type="button"
          onClick={async () => {
            const name = await sicherungAlsDatei();
            setQuittung(`Sicherung „${name}" erzeugt (Downloads).`);
          }}
        >
          Daten sichern…
        </button>
        {!sammlungId && beiseite && (
          <button
            type="button"
            className="gefahr"
            onClick={async () => {
              const ja = await frageJaNein({
                titel: "Beiseitegelegte Einträge entfernen?",
                text: "Die beiseitegelegten, unlesbaren Einträge werden endgültig gelöscht. Wenn du sie noch prüfen willst, vorher „Daten sichern…“.",
                ok: "Endgültig entfernen",
                gefahr: true,
              });
              if (!ja) return;
              unlesbarVerwerfen();
              setRunde((r) => r + 1);
            }}
          >
            Beiseitegelegtes entfernen…
          </button>
        )}
      </div>
      {quittung && <p className="hinweis">{quittung}</p>}
    </div>
  );
}
