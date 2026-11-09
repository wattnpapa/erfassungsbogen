/**
 * Browser-Einstieg: Plattform-Klassen und Anzeige-Modus setzen, Start zählen,
 * die Anwendung (siehe app.tsx) in den Wurzelknoten hängen.
 */

// Oberflächenschrift: Archivo (Grotesk in der DIN-Linie — der Formenwelt der
// Fahrzeug- und Schilderbeschriftung im BOS-Umfeld). Bewusst aus dem Bundle
// statt von einem CDN: die App muss offline vollständig funktionieren.
import "@fontsource-variable/archivo";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Fehlerfaenger } from "./fehlerfaenger";
import { DebugLeiste, debugAktiv, wendePlattformKlasseAn, wendeRahmenAn } from "./debug-plattform";
import { wendeAnzeigeModusAn } from "./anzeige-modus";
import { tastaturWaechterStarten } from "./tastatur";
import { schriftStufeStarten } from "./schrift-stufe";
import { statistikStarten } from "./statistik";
import { dauerhaftWennWertvoll, speicherVerdrahten } from "./speicher-browser";
import { stempelQuelleSetzen } from "./hilfen";
import { stempelZeitpunkt } from "./datenschutz-uhr";
import { dialogVerlaufVerdrahten } from "./modal-overlay";
import { anfuehrungWaechterStarten } from "./typografie";

// Die Einsatz-Sammlungen aus der Zeit vor der Meldekopf-App liegen noch im Kern
// (Altbestand, meldekopf-altbestand.ts): Er bekommt die Ablage und die Uhr
// hineingereicht, damit Aufräum- und Datenschutzfrist weiter greifen (ADR-003).
speicherVerdrahten();
// Neue Stände werden mit der geprüften Uhr gestempelt (R5-E2); hilfen.ts importiert
// sie bewusst nicht selbst (Startbündel, siehe dort).
stempelQuelleSetzen(stempelZeitpunkt);
// Um dauerhaften Speicher bitten, sobald hier etwas Wertvolles liegt (R2-O6).
dauerhaftWennWertvoll();
// Zurück schließt jedes Fenster der Startseite, statt die App zu verlassen (R6-S3).
dialogVerlaufVerdrahten();

// Plattform-Klasse (z. B. platform-ios) auf <html> für plattformspezifisches CSS.
// Im Browser kann der Debug-Modus die visuelle Plattform überschreiben.
wendePlattformKlasseAn();
wendeRahmenAn();
wendeAnzeigeModusAn();
// Feste Leiste weicht der Bildschirmtastatur (R4-G3).
tastaturWaechterStarten();
// Große Systemschrift: Das Stylesheet verdichtet dann die niedrigen Fenster (R5-M3).
schriftStufeStarten();

// Im Debug-Modus eine schwebende Leiste zum Umschalten der Vorschau zeigen.
function Wurzel() {
  return (
    <Fehlerfaenger>
      <App />
      {debugAktiv() && <DebugLeiste />}
    </Fehlerfaenger>
  );
}

// Einen Start zählen (Browser, PWA, App). Schlägt ohne Netz still fehl.
statistikStarten();
// Schließende Anführungszeichen einheitlich „…“ (R17-W3).
anfuehrungWaechterStarten(document.getElementById("app")!);

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Wurzel />
  </StrictMode>,
);
