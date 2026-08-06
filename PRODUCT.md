# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Zwei bestätigte Nutzergruppen, ohne festgelegte Rangfolge:

1. **Einheiten** (THW, Feuerwehr, DRK/JUH/MHD/ASB, DLRG, Polizei, Bundeswehr, Katastrophenschutz der Länder), die ihren eigenen Einheiten-Erfassungsbogen ausfüllen und pflegen — einmal erfassen, drucken, beim nächsten Einsatz nur anpassen.
2. **Meldeköpfe, Bereitstellungsräume und Führungsstellen** (auch Zug- und Verbandsführer), die eintreffende fremde Bögen sammeln, Stärke und Sofortbedarf über alle Einheiten zusammenzählen und geschlossen weitermelden.

Nutzer sind Ehrenamtliche und Einsatzkräfte, keine IT-Fachleute; die App muss ohne Schulung und ohne Anmeldung funktionieren.

## Product Purpose

Digitaler Einheiten-Erfassungsbogen für alle BOS-Einheiten und Hilfsorganisationen: Stärkemeldung und Einsatzdokumentation am Bildschirm ausfüllen, als PDF im gewohnten Papier-Layout drucken. Erfolg heißt: schneller und fehlerärmer als Papier und Handschrift, und am Meldekopf ist eine eintreffende Einheit in Minuten erfasst (per QR-Scan sofort).

## Positioning

Der komplette Bogeninhalt steckt in einem einzigen QR-Code auf der letzten PDF-Seite und lässt sich ohne Internet, ohne Server und ohne Kopplung auf jedem anderen Gerät wieder einlesen (offline-first). Kostenlos, freie Software (EUPL-1.2), keine Anmeldung, keine Cloud — alle Daten bleiben auf dem Gerät. Bisher nicht als formell unverhandelbares Versprechen erklärt, aber faktisch das tragende Alleinstellungsmerkmal.

## Operating Context

- **Maßgebliche Nutzungssituation: draußen unterwegs** — im Fahrzeug, am Meldekopf, im Bereitstellungsraum, unter Zeitdruck; grelles Tageslicht wie Dunkelheit. Feld- und Nacht-Modus existieren dafür; künftige Design-Arbeit misst sich an dieser Situation, nicht am Schreibtisch.
- Läuft im Browser (PWA, erfassungsbogen.app), als Desktop-App (Electron: Windows x64/arm64, macOS, Linux) und als Android-App (Capacitor); iOS in Vorbereitung. Einheitliche Web-Designsprache auf allen Plattformen.
- Transportwege ohne Netz: QR-Code (Kamera, USB-Handscanner am PC), AirDrop/Quick Share, Datei; PDF trägt den Bogen als QR mit sich.
- Papier-Erfassungsbogen der Organisationen ist die Referenz: das PDF muss dem gewohnten Papier-Layout entsprechen, damit es in bestehende Meldewege passt.
- Anschlussformate der Führungsstellen: CSV je Einsatz, Excel-Liste im Format „Oldenburg".

## Capabilities and Constraints

- Assistent (Einheit, Einsatz, Personal, Fahrzeuge, Sofortbedarf) mit nachbearbeitbarer Gesamtübersicht; Schnellerfassung am Meldekopf (nur Stärke, Führungskraft, Fahrzeuge).
- Einsatz-Sammlung: fremde Bögen bündeln, laufende Summen mit Zwischensummen je Zug, Melde-Historie, Schichtübergabe-Diff (was hat sich gegenüber der letzten Meldung geändert), Sammel-PDF.
- Vorlagen: Landes-/Organisations-Beispielbögen (KatS der Länder, FwVO NDS, DRK, DLRG, THW-StAN) als anwendbare Vorbelegung; eigene Vorlagen mit Musterung.
- Optionale Ed25519-Signatur im QR-Code.
- **Schema-Abwärtskompatibilität ist Pflicht:** alte QR-Codes und Dateien müssen per Migration lesbar bleiben.
- Kein Server, keine Anmeldung, keine Cloud; Reichweitenmessung cookielos (GoatCounter).
- Fachterminologie ist verbindlich: Stärke (Schreibweise x/y/z//g), Sofortbedarf, Meldekopf, Bereitstellungsraum, Funkrufname, taktische Zeichen, Fachgruppe, StAN.
- Sprache der Oberfläche und des Codes: Deutsch.

## Brand Commitments

Bisher keine formell bindenden Zusagen erklärt (Stand 2026-08-06). Faktisch vorhanden und bis auf Widerruf zu bewahren: Name „Erfassungsbogen" / erfassungsbogen.app, die „Amtlich"-Optik über eigene CSS-Design-Token (bewusst kein Tailwind), Oberflächenschrift Archivo (im Bundle, offline), eingebackene taktische Zeichen (jonas-koeritz-Sammlung), Dunkelmodus nur per Schalter (nie prefers-color-scheme).

## Evidence on Hand

- Beispielbögen als JSON unter `examples/` (KatS Niedersachsen/Sachsen/Brandenburg/Thüringen, Feuerwehr NDS, DRK, DLRG, THW).
- Eigene Landingpages je Organisation (thw/feuerwehr/drk/johanniter/malteser/asb/dlrg/katastrophenschutz/meldekopf) plus Anleitung und „Papier oder digital?".
- Keine Testimonials, Fallstudien oder Nutzerzahlen vorhanden — nicht erfinden.

## Product Principles

1. **Offline ist der Normalfall, nicht der Fehlerfall** — jede Funktion muss ohne Netz und ohne Server vollständig funktionieren.
2. **Draußen bedienbar** — Lesbarkeit und Trefferflächen für Einsatzsituationen (Sonne, Nacht, Handschuhe, Zeitdruck) schlagen Ästhetik am Schreibtisch.
3. **Das Papier ist der Vertrag** — PDF und Begriffe folgen den gewohnten amtlichen Bögen, damit Ausdrucke in bestehende Meldewege passen.
4. **Nichts geht verloren** — Abwärtskompatibilität der Schemata, Datensicherheit auf dem Gerät, Papierkorb statt endgültigem Löschen.
5. **Sofort nutzbar** — keine Anmeldung, keine Installationspflicht, keine Schulung; ein Scan genügt.

## Accessibility & Inclusion

Kein verbindlicher Standard (BITV/WCAG) festgelegt. Produktspezifisch etabliert: hoher Kontrast im Feld-Modus für Sonnenlicht, Nacht-Modus für Dunkelheit — beide als reine Token-Belegungen.
