# Rollenaudits, Runde 21 (Stand 29.10.2026)

Einundzwanzigste Prüfrunde nach der Behebung der Befunde aus [Runde 20](../runde-20/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `f007590` (Stand `main` nach Runde 20). Reine Prüfberichte ohne Codeänderung.

Alle zwölf Prüfer melden denselben P0: R21-A1/W1/E1/H1/K1/G1/M1/L1/N1/O1/S1/D1.
Die Einsatzansicht lässt sich offline nach dem Neuladen nicht öffnen („Hier ist etwas
schiefgelaufen", „Unable to preload CSS"), obwohl die Startseite „komplett offline"
meldet. Ursache war mein Umbau des Startbündels in Runde 20: Die nachgeladene
Einsatzansicht führte die Stilvorlage des Einstiegs in ihrer Vorladeliste, die der
Bau nach dem Einbetten der Schrift-CSS gelöscht hatte. Die e2e-Szenarien „Ohne
Netz" haben das nicht gefunden, weil sie die Einsatzansicht nicht ohne Netz öffnen.
Behoben noch in dieser Runde auf `main` (Commit 4c56f9e); `npm run bundle-budget`
prüft seitdem, dass kein Chunk auf eine fehlende Stilvorlage verweist. Das
ergänzte Szenario „Die Einsatzansicht öffnet auch ohne Netz nach dem Neuladen"
lief im Test auch gegen den kaputten Bau durch und ersetzt die Prüfung in
`bundle-budget` nicht.

Die weiteren Befunde: P2 R21-W2/H2 (Schnellerfassung legt „DRK Bremen" als
„THW DRK Bremen" ab, die Organisation ist eingeklappt), R21-K2 (das „Mehr"-Blatt
bleibt nach „Ort der Einheit ändern…" offen), R21-L2 (der Fehlerschirm nennt bei
fehlendem Netz keine Ursache und rät, den Einsatz zu löschen; verwandt R21-D2).
Mehrfach gemeldete P3: Schnellerfassung „Schritt 2 von 4" gegen Überschrift „3.
Personal" (zehn Berichte), erste Einheitenkarte 1,1 bis 1,8 Bildschirme tief (zwölf),
Assistent quer in „Feld": „Ort der Einheit" unter der Fußleiste (sechs), leere Fläche
beim Nachladen der Einsatzansicht (vier), Tabelle bei 320 px: Bedarf abgeschnitten
(fünf), Texte bei vollem Speicher (vier). Es bleiben rund 30 verschiedene P3.

| Bericht | P0 | P1 | P2 | P3 | Hinweise |
| --- | --- | --- | --- | --- | --- |
| [Neuer Nutzer](neuer-nutzer.md) | 1 | 0 | 0 | 6 | 5 |
| [Feldtauglichkeit](feldtauglichkeit.md) | 1 | 0 | 1 | 6 | 5 |
| [Arbeitsablauf](arbeitsablauf.md) | 1 | 0 | 1 | 4 | 5 |
| [Fehler und Wiederanlauf](fehler-und-wiederanlauf.md) | 1 | 0 | 0 | 6 | 7 |
| [Zerstörende Handlungen](zerstoerende-handlungen.md) | 1 | 0 | 0 | 3 | 6 |
| [Offline und Speicher](offline-und-speicher.md) | 1 | 0 | 0 | 2 | – |
| [Stress und Unterbrechung](stress-und-unterbrechung.md) | 1 | 0 | 0 | 4 | 6 |
| [Handschuh-Bedienung](handschuh-bedienung.md) | 1 | 0 | 0 | 7 | 6 |
| [Nacht und Sicht](nacht-und-sicht.md) | 1 | 0 | 1 | 5 | 2 |
| [Führungssicht](fuehrungssicht.md) | 1 | 0 | 1 | 1 | 6 |
| [Analog-first](analog-first.md) | 1 | 0 | 0 | 9 | 5 |
| [Mobile-UI](mobile-ui.md) | 0 | 1 | 0 | 5 | 5 |
| Verlaufstabelle (ohne Doppelungen, P3 geschätzt) | 1 | 0 | 3 | 30 | – |
