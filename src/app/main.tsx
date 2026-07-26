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
import { DebugLeiste, debugAktiv, wendePlattformKlasseAn, wendeRahmenAn } from "./debug-plattform";
import { wendeAnzeigeModusAn } from "./anzeige-modus";
import { statistikStarten } from "./statistik";

// Plattform-Klasse (z. B. platform-ios) auf <html> für plattformspezifisches CSS.
// Im Browser kann der Debug-Modus die visuelle Plattform überschreiben.
wendePlattformKlasseAn();
wendeRahmenAn();
wendeAnzeigeModusAn();

// Im Debug-Modus eine schwebende Leiste zum Umschalten der Vorschau zeigen.
function Wurzel() {
  return (
    <>
      <App />
      {debugAktiv() && <DebugLeiste />}
    </>
  );
}

// Einen Start zählen (Browser, PWA, App). Schlägt ohne Netz still fehl.
statistikStarten();

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Wurzel />
  </StrictMode>,
);
