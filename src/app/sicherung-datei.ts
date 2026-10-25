import { blobAlsDownload } from "./hilfen";
import { istNativ, textTeilen } from "./nativ";
import { sicherungErstellen } from "./sicherung";

/**
 * Alle lokalen App-Daten als Sicherungsdatei anbieten (Browser: Download, App:
 * Share-Sheet) — derselbe Weg wie „Datensicherung → Sicherung erstellen…" in
 * der Fußzeile, aber von Hinweisen aus erreichbar, die auf „Daten sichern"
 * verweisen (R7-N3/R7-E2).
 */
export async function sicherungAlsDatei(): Promise<string> {
  const inhalt = sicherungErstellen();
  const name = `eeb-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
  if (istNativ()) await textTeilen(name, inhalt);
  else blobAlsDownload(name, new Blob([inhalt], { type: "application/json" }));
  return name;
}
