/**
 * Quittungsleiste nach der Aufnahme einer Einheit von Hand (R20-S1, N4, H2): Nummer und Name am Bildrand, „Rückgängig“ nimmt die Einheit wieder
 * heraus. Nachgeladen (React.lazy in einsaetze-ui.tsx), damit das Startbündel sie nicht trägt (ADR-003, Aufnahmeregel 5).
 */
import { meldungEntfernen } from "@bos/meldekopf/einsaetze";
import { DaumenQuittung } from "./daumen-quittung";
import { entfernteMerken } from "./entfernte-meldungen";

export interface AufnahmeQuittung {
  nonce: number;
  nummer?: number;
  name: string;
}

export default function AufnahmeLeiste(props: {
  a: AufnahmeQuittung;
  einsatzId: string;
  eintragId: string;
  /** Führt die Änderung aus und meldet einen Speicherfehler selbst (einsaetze-ui.tsx, `gesichert`). */
  gesichert: (titel: string, aktion: () => void) => Promise<boolean>;
  /** Nach dem Zurücknehmen: der Satz für die nächste Quittung. */
  onZurueck: (satz: string) => void;
  onSchliessen: () => void;
}) {
  const { a, einsatzId, eintragId } = props;
  const nr = a.nummer != null ? `Nr. ${a.nummer} ` : "";
  async function zurueck() {
    const ok = await props.gesichert("Rückgängig", () => {
      meldungEntfernen(einsatzId, eintragId);
      entfernteMerken(einsatzId, [eintragId]); // kommt beim Import nicht still zurück (R2-D4)
    });
    if (ok) props.onZurueck(`Aufnahme zurückgenommen: ${nr}„${a.name}" steht nicht mehr in der Lage.`);
  }
  return (
    <DaumenQuittung
      sperreKurz
      kurz={`${nr}„${a.name.length > 22 ? `${a.name.slice(0, 21)}…` : a.name}“ abgelegt`}
      onRueckgaengig={() => void zurueck()}
      rueckgaengigName="Aufnahme rückgängig machen"
      onSchliessen={props.onSchliessen}
    >
      <strong>Abgelegt:</strong> {nr}„{a.name}“{a.nummer != null ? " — die Nummer auf den Zettel schreiben." : "."}
    </DaumenQuittung>
  );
}
