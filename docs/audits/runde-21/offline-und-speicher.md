# Audit Runde 21 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-29 · Zählung: **P0 1 · P1 0 · P2 0 · P3 2 · Hinweise 3**

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf `http://localhost:4173` (Produktionsbuild `dist/`,
`vite preview`, Code-Stand `f007590` = `main`). Playwright mit Chromium über das globale Modul
(`/opt/node22/lib/node_modules/playwright`, die Projektkopie findet keinen Browser), `chromium.launch()` ohne Optionen,
`isMobile`/`hasTouch`, Locale de-DE, Viewports 390 x 844, 360 x 640, 320 x 568, quer 568 x 320 und 640 x 360. Je Lauf ein
eigener Browser-Kontext. Netz weg über `context.setOffline` (Service Worker aktiv, Neuladen offline), Drosselung über CDP
(100 KB/s, 200 ms, 4-fach CPU), voller Speicher durch Auffüllen von `localStorage` bis zum echten Quota-Fehler. Beispielbögen
aus `examples/thw` über die Oberfläche („Bögen einlesen…", „Aus Datei laden…"). Zusätzlich lief eine Kopie von `dist/` außerhalb
des Repositorys (statischer Server, einmal mit, einmal ohne die fehlende Datei aus R21-O1), nur um den Befund einzugrenzen und
zu sehen, was hinter ihm liegt; gemeldet ist nur, was am unveränderten Build zu sehen ist. Vorab gelesen:
`docs/audits/README.md`, „Stand der Behebung" in `runde-20/README.md` und der Bericht „Offline und Speicher" aus Runde 20.
Es gelten keine „bekannten Grenzen"; auch als „offen" oder „nicht ganz erreicht" geführte Punkte sind gemeldet, wenn sie im
Browser noch zu sehen waren.

Zählregel: ein Befund je Sachverhalt, ein Typ je Befund (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast); P3 nur bei
echter Beeinträchtigung der Aufgabe, Geschmacksfragen unter „Hinweise" ohne Priorität.

## Urteil

Die Behebungen aus Runde 20 halten alle, auch bei vollem Speicher: Der Bogen geht beim Schließen, Ersetzen und Zurückholen nicht
mehr verloren, „Endgültig löschen" im Notweg fragt nach, „THW Oldenburg" bleibt „THW Oldenburg", „Ort der Einheit ändern…"
funktioniert, die Tipp-Sperre ist lesbar, die Sicherungszeile stimmt, der Auftragstext bleibt nach dem Speicherfehler im Feld,
der Rückweg zum gelöschten Einsatz steht oben auf der Startseite. Die nachgeladene Zeichensammlung ist unauffällig (Platzhalter
in Bildgröße, kein Sprung) und läuft auch offline.

Aber: Die **nachgeladene Einsatzansicht lässt sich nicht aufbauen**, sobald das Netz fehlt (und auf einem Host, der für fehlende
Dateien 404 liefert, auch mit Netz). Der Build verweist auf eine Stilvorlage, die es nicht gibt; ohne Netz scheitert das Laden,
und es erscheint die Seite „Hier ist etwas schiefgelaufen". Das ist genau der Weg, den der Meldekopf im Funkloch braucht
(R21-O1, P0). Die Daten bleiben erhalten; sicher bedienbar ist der Einsatz ohne Netz aber nicht. Wer die Datei gedanklich
ergänzt, findet dahinter nichts Weiteres: Einsatz anlegen, Bögen einlesen, Neuladen offline, Beispielbögen, PDF und Sicherung
laufen offline, und die Statuszeile zum Vorladen sagt ehrlich, was fehlt.

## Nachprüfung der Behebungen aus Runde 20 (halten, nicht gemeldet)

- **R20-D1 Bogen bei vollem Speicher** (360 x 640 und 390 x 844, Speicherschlüssel geprüft): „Bogen schließen" legt den Bogen in
  `eeb.entwurf.ersetzt.v1` ab, die Startseite zeigt „Zuletzt geschlossener Bogen"; „Neuen Bogen erstellen" → „Neu anfangen"
  ersetzt und bewahrt den alten Stand; „Zuletzt geschlossenen Bogen zurückholen" tauscht Entwurf und Ablage, der bisherige Bogen
  geht nicht verloren. Bei Schreibfehlern steht im Assistenten „⚠ Nicht gespeichert – der Speicher dieses Geräts ist voll", die
  Startseite zeigt „Letzter gesicherter Stand: 11:26 Uhr … jetzt ‚Fortsetzen' und ‚Bogen übergeben'".
- **R20-W1 „Endgültig löschen" im Notweg** (voller Speicher, Einsatz im Papierkorb, nach Neuladen): Der Knopf öffnet „Einsatz
  endgültig löschen?" mit Name, Zahl der Meldungen und dem Hinweis auf die einzige Kopie, „Abbrechen" daneben; nichts wirkt
  sofort.
- **R20-H1 „THW THW Oldenburg":** Schnellerfassung mit Ort „THW Oldenburg" ergibt Karte „Nr. 1 THW Oldenburg"; „Mehr…" →
  „Ort der Einheit ändern…" öffnet den Dialog mit Feld, Erklärung (Historie, „Rückgängig") und „Ort übernehmen".
- **Schnellerfassung:** Ortsfeld zuerst, „Schritt 1 von 4 … 3 von 4"; „In Einsatz übernehmen" bei 360 vollständig (Rest siehe
  R21-O2).
- **Scanner ohne Kamera quer** (568 x 320, 640 x 360): „Dieses Gerät meldet keine nutzbare Kamera", „Kamera erneut versuchen",
  „QR aus Bild einlesen…" und „Fertig" ohne inneres Scrollen erreichbar.
- **Assistent quer** (568 x 320, 640 x 360, Ansicht „Feld"): Alle Felder der Schritte 1 bis 3 liegen nach dem Antippen oberhalb
  der Fußleiste. R20-N2 war nicht mehr zu beobachten.
- **Dialoge bei 320 px** (Einsatz löschen, Übergabe vermerken, Entfernen, Alle Daten löschen): Breite 288 px, kein Quer-Scroll,
  alle Knöpfe innerhalb des Fensters und mindestens 44 px hoch (nur das Kästchen „Alle Daten löschen" misst 24 px, sein Text
  liegt in derselben Zeile).
- **Tabelle am Telefon** (390, 360): kein seitliches Scrollen der Seite, Namensknöpfe 44 px und mehr (Rest bei 320 px siehe Hinweis
  H2).
- **R20-O1 Tipp-Sperre:** Zweiter Tipp nach 400 ms auf „Lageblatt" bei 360 px: Knopftext „Schon getippt" passt (Textbreite 152 px
  im Knopf von 154 px), ein Download.
- **R20-O2 Übergabe-Liste nach Sicherung:** Ohne vollen Speicher sofort „✓ Datensicherung: zuletzt gesichert … Sie enthält 1
  Einsatz, 3 Meldungen"; bei vollem Speicher nennt der Dialog „Vermerk nicht gespeichert (Speicher voll) – die Übergabe-Liste
  zeigt ‚noch nicht'", ebenso die Quittung des Lageblatts.
- **R20-O3 Text nach Speicherfehler:** Der Dialog „Auftrag/Notiz" bleibt offen, nennt den Text „Pumpen Keller Nord" und sagt, nach
  dem Platzschaffen nur noch „Speichern" zu tippen; das Feld behält den Inhalt.
- **R20-O5 Rückweg nach „Einsatz löschen":** Startseite zeigt oben „1 Einsatz liegt im Papierkorb (30 Tage rückholbar). Zum
  Papierkorb" (44 px hoch), auch nach 10 s.
- **Nachgeladene Teile (Zeichensammlung, Einsatzansicht) im Netz:** Bei 100 KB/s und 4-facher CPU-Bremse erscheinen taktische
  Zeichen nach etwa 0,9 s; der Platzhalter belegt 42 x 42 px wie das Zeichen, die Zeile springt nicht. Beim Öffnen eines
  vorhandenen Einsatzes werden keine weiteren Teile nachgeladen (Ansicht nach 0,3 s).
- **Nachgeladene Teile offline, ohne die Lücke aus R21-O1:** Nach dem ersten Laden Netz weg, Einsatz anlegen, drei Bögen einlesen,
  Neuladen: alles da; Beispielbögen anzeigen, Zeichen „geladen", Bogen-PDF erzeugen: alles geht. Wird das Netz schon 1,2 s nach
  dem ersten Laden getrennt, steht ehrlich „Rest fehlt noch (Beispielbögen, Themenseiten): 431 von 549, folgt beim nächsten
  Netz", und die Beispielbögen und die Anleitung gehen trotzdem.

## Befunde

### P0

#### R21-O1 – Einsatzansicht offline nicht aufbaubar: Der Build verweist auf eine nicht vorhandene Stilvorlage `index-Bp0pLAQP.css`

- **Priorität:** P0
- **Typ:** Bedienung (Einsatz ohne Netz nicht benutzbar)
- **Kennzeichnung:** gemessen (Neuladen und „Öffnen" offline, Netzwerk- und Konsolenprotokoll; je vier Läufe, 390 x 844)
- **Neu oder alt (Verweis):** neu (Folge des Nachladens der Einsatzansicht in Runde 20; die Offline-Prüfung in Runde 20 lief vor dieser Änderung durch)
- **Ort:** Startseite → „Neue Einsatz-Sammlung…" → „Einsatz anlegen" (Netz weg), oder bei vorhandenem Einsatz: Netz weg, Startseite → „Öffnen", oder Neuladen in der Einsatzansicht.
- **Beobachtung:** Das Teilpaket `assets/einsaetze-ui-Ca8VFLhR.js` listet als Abhängigkeit `./index-Bp0pLAQP.css`. Diese Datei gibt es in `dist/assets` nicht (dort liegt nur `lagemonitor-ui-C1Ho6b0A.css`) und sie steht nicht im Service-Worker-Vorrat. Online antwortet `vite preview` für den unbekannten Pfad mit der Startseite (HTTP 200, `text/html`), deshalb fällt es dort nicht auf. Ohne Netz bricht der Ladevorgang mit `Unable to preload CSS for …/index-Bp0pLAQP.css` ab (`net::ERR_INTERNET_DISCONNECTED`), alle 24 übrigen Teile kamen aus dem Service Worker. Es erscheint „Hier ist etwas schiefgelaufen – Die Ansicht ließ sich nicht aufbauen" mit „Neu laden", „Zur Startseite", „Daten sichern", „Alle Daten löschen". Erneutes „Neu laden" offline ändert nichts. Gleiches Ergebnis mit 1,5 s und mit 8 s Wartezeit nach dem ersten Laden (Vorladen fertig), und nach Neuladen innerhalb der Einsatzansicht, weil die App dort wieder einsteigt. Auf einem statischen Host, der für fehlende Dateien 404 liefert (so wie GitHub Pages, auf dem laut Datenschutzseite die App liegt), scheitert „Einsatz anlegen" schon **mit** Netz mit derselben Meldung (404, `Ansicht abgestürzt`). Mit Netz auf `vite preview`: Einsatzansicht öffnet normal. Die Startseite mit der Liste der Einsätze und „Öffnen" geht offline; nur das Öffnen scheitert. Eigene Bögen (Wizard, PDF, Schnellerfassung) gehen offline ohne Einsatz in der Ansicht.
- **Erwartung der Rolle:** Wer vor dem Funkloch einmal geladen hat, öffnet danach den Einsatz und liest Bögen ein. Dafür steht „✓ Funktioniert komplett offline" auf der Startseite.
- **Folge:** Der Meldekopf mit dem Einsatz auf dem Gerät kann im Funkloch seine Lage nicht aufrufen, keine Meldung aufnehmen, kein Lageblatt erzeugen, den Einsatz nicht sichern – die Aufgabe ist ohne Netz nicht fortsetzbar. Die Statuszeile auf der Startseite nennt den Zustand dabei „komplett offline". Die Fehlerseite nennt keine Ursache (Netz) und bietet nach „Neu laden" „Alle Daten löschen" an; wer ihr folgt, verliert die Einsatzdaten, obwohl nur das Netz fehlt. Die Daten selbst blieben in allen Läufen erhalten (nach Netzrückkehr und „Neu laden" öffnet der Einsatz wieder).
- **Empfehlung:** Die Teilpakete der Einsatzansicht so bauen, dass jede genannte Datei im Build liegt und im Vorrat steht; dazu in der Build-Prüfung offline eine Einsatzansicht öffnen lassen. Die Fehlerseite bei fehlendem Netz als solche benennen („Ohne Netz konnte ein Teil nicht geladen werden") und nicht zum Löschen raten.
- **Verifikation:** Frischer Browser, einmal laden, 8 s warten, Netz weg, „Neue Einsatz-Sammlung…" anlegen, drei Bögen einlesen, Neuladen: Einsatz mit allen Bögen da; wiederholt auf einem Host mit 404 für fehlende Dateien.

### P3

#### R21-O2 – Schnellerfassung: „Schritt 2 von 4: Personal" über der Überschrift „3. Personal"

- **Priorität:** P3
- **Typ:** Text
- **Kennzeichnung:** gemessen (360 x 640)
- **Neu oder alt (Verweis):** alt (R20-A2/W3/H3/K4/N3: „Schritt 1 von 6 … 2, 5 entfallen"; die Zählung wurde auf „von 4" gekürzt, die nummerierten Überschriften sind geblieben)
- **Ort:** Startseite oder Einsatz → „Einheit schnell erfassen (nur Stärke)…" → Schritte 1 bis 3.
- **Beobachtung:** Schritt 1 „Schritt 1 von 4: Einheit" mit „1. Einheit"; Schritt 2 „Schritt 2 von 4: Personal" mit Überschrift „3. Personal"; Schritt 3 „Schritt 3 von 4: Fahrzeuge" mit „4. Fahrzeuge"; dann „Übersicht". Zwei Zahlen für denselben Abschnitt auf einem Bildschirm.
- **Erwartung der Rolle:** Eine Zählung, die zu dem passt, was gerade zu sehen ist.
- **Folge:** Der Helfer rechnet nach, ob ein Schritt „2" übersprungen wurde und ob etwas fehlt; auf dem Meldeblock ist die Reihenfolge der Zettel-Felder verwirrend. Kein Datenverlust, kostet Aufmerksamkeit unter Zeitdruck.
- **Empfehlung:** In der Schnellerfassung die Abschnittsnummern der Überschriften weglassen oder an die Schrittzählung angleichen.
- **Verifikation:** Alle Schritte der Schnellerfassung: Zähler und Überschriftsnummer stimmen überein.

#### R21-O3 – Erste Einheitenkarte liegt nach dem Einlesen bei etwa 1 240 px, rund zwei Bildschirme unter dem Kopf

- **Priorität:** P3
- **Typ:** Layout/Abstand
- **Kennzeichnung:** gemessen (360 x 640: y = 1 236; 390 x 844: y = 1 241; fünf Beispielbögen, Einsatz mit Übungsmeldungen)
- **Neu oder alt (Verweis):** alt (R20-W6/H5/G6, dort als „nicht ganz erreicht" geführt)
- **Ort:** Einsatz → „Bögen einlesen…" → Bögen wählen → Einsatzansicht, Karten.
- **Beobachtung:** Über der ersten Karte „Nr. 1" stehen Kopf, Kennzahlen, „Nichts gezählt …", vier Aufnahmeknöpfe, die Quittung „5 Bögen aufgenommen. Aufnahme 11:24: …", „Neu seit der letzten Kenntnisnahme", „Bedarf", Sprunglinks, Einheitenkopf, Umschalter. Die Karte beginnt bei 1 236 bis 1 241 px.
- **Erwartung der Rolle:** Nach dem Einlesen die gerade eingelesene Einheit auf dem ersten Bildschirm sehen.
- **Folge:** Nach jeder Aufnahme muss der Helfer zwei Bildschirme scrollen, um zu sehen, was angekommen ist.
- **Empfehlung:** Die Quittung als eine Zeile mit Tippziel „In der Liste zeigen" und die Aufnahmeknöpfe nach dem ersten Bogen verkleinert; die erste Karte soll im ersten Bildschirm anfangen.
- **Verifikation:** Fünf Bögen einlesen: Oberkante der ersten Karte unter 960 px (360 x 640 und 390 x 844).

## Hinweise (ohne Priorität)

- **H1 – Leerer Bildschirm beim ersten Anlegen eines Einsatzes bei schwachem Netz** (neu): Bei 100 KB/s und 4-facher CPU-Bremse
  zeigt die Seite zwischen „Einsatz anlegen" und der Einsatzansicht etwa 0,5 bis 1 s lang nur die Fußzeile (Screenshot
  `s10_0`), ohne „Lädt…". Danach springt die Fußzeile nach unten. Nur der erste Einsatz auf dem Gerät betrifft es. Keine
  Aufgabe scheitert daran.
- **H2 – Tabelle bei 320 px:** Der Name bricht mitten im Wort („Technische/r Zug"), die Spalte „Bedarf" ist abgeschnitten
  („Diesel 80 l" halb sichtbar), der Hinweis „Zum Weiterlesen seitlich wischen →" benennt den Weg. Bei 360 und 390 px passt die
  Tabelle ohne Scrollen (alt, R20-N6/H11/H12/S5, am kleinsten Telefon).
- **H3 – Dauerleiste „Ansicht: Standard" am unteren Rand der Einsatzansicht** belegt etwa 57 px und deckt unten Text ab, bis man
  scrollt (alt, R19-K12/R20-H1).

## Nicht prüfbar

Echte Funkloch-Übergänge am Telefon, Speicherräumung durch iOS, Kamera-Scan, native Builds, Ablauf der 7 und 30 Tage im
Papierkorb, das tatsächliche Verhalten des Produktionshosts (GitHub Pages) – R21-O1 wurde dafür mit einem statischen Server
nachgestellt, der für fehlende Dateien 404 liefert.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (online ja; offline nein für die Einsatzansicht, siehe R21-O1)
- **Fremde Hilfe nötig:** ja, sobald die Fehlerseite offline erscheint (die Ursache nennt sie nicht)
- **Größtes Missverständnis:** Die Startseite sagt „Funktioniert komplett offline", die Einsatzansicht lädt ohne Netz nicht.
- **Größtes Einsatzrisiko:** Der Meldekopf im Funkloch kann den Einsatz nicht mehr öffnen (R21-O1) und folgt dem Rat „Alle Daten löschen".
- **Top-Priorität für die nächste Iteration:** R21-O1 (fehlende Stilvorlage der Einsatzansicht, Offline-Prüfung dafür in den Build).
