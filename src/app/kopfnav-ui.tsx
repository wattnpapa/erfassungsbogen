/**
 * Die Kopfnavigation als React-Fassung — dieselbe Leiste, die auch über den
 * statischen Seiten steht (src/app/kopfnav.ts ist die gemeinsame Quelle).
 *
 * Warum die App sie überhaupt bekommt: Von jeder Themenseite führte ein Klick
 * in die App, umgekehrt lag der einzige Weg zur Anleitung in der Fußzeile —
 * hinter Weiche, Vorlagen, Einsätzen, Absenderkarte und dem erklärenden Text.
 * Wer in der App nicht weiterwusste, fand das HowTo praktisch nicht.
 *
 * Nur Wissen, keine Aktionen: „Neuen Bogen erstellen", „QR-Code scannen…" und
 * „Neuer Einsatz…" bleiben in der Weiche darunter. Begründung in kopfnav.ts.
 *
 * Nur im Web-Browser: In der installierten Fassung (Desktop-App, Android, iOS)
 * ist die Themenwelt nicht das, wofür die App geöffnet wurde — dieselbe Weiche
 * wie beim erklärenden Startseitentext (imWebBrowser() in nativ.ts). Im
 * Start-Gerüst von index.html erledigt das die Klasse `.als-app` aus der
 * Frühweiche im Kopf, damit die Leiste dort nicht bis zum Mount aufblitzt.
 */

import { kopfnavAufbau } from "./kopfnav";

export function Kopfnav() {
  // Leerer Dateiname: Die App gehört keiner Rubrik der Themenwelt an — kein
  // Eintrag steht auf „aktiv", das Logo führt ohnehin hierher zurück.
  const eintraege = kopfnavAufbau("");
  return (
    // `div`, nicht `header`: Der Kopfbalken darunter ist der Seitenkopf der
    // App — zwei Banner-Landmarken übereinander kündigten ihn doppelt an
    // (NavHuelle in kopfnav.ts).
    <div className="kopfnav">
      <div className="kopfnav-inner">
        <a href="./" className="kopfnav-logo">
          Erfassungsbogen
        </a>
        <nav className="kopfnav-links" aria-label="Hauptnavigation">
          {eintraege.map((e) =>
            e.unter ? (
              <span key={e.href} className={e.nurBreit ? "kopfnav-eintrag nur-breit" : "kopfnav-eintrag"}>
                <a href={e.href}>{e.label}</a>
                <span className={e.zweispaltig ? "kopfnav-unter kopfnav-unter-breit" : "kopfnav-unter"}>
                  {e.unter.map((u) => (
                    <a key={u.href} href={u.href}>
                      {u.label}
                    </a>
                  ))}
                </span>
              </span>
            ) : (
              <a key={e.href} href={e.href} className={e.nurBreit ? "nur-breit" : undefined}>
                {e.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
