# Audit „Neuer Nutzer", Runde 20 (Helfer ohne Einweisung)

Prüfer: Rollenaudit `thw-new-user-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (laufender Server, Code-Stand
Commit `7c06324` = `main`) · Zählung: **P0 0 · P1 0 · P2 0 · P3 9 · Hinweise 5**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md` und der
Abschnitt „Stand der Behebung" von Runde 19. Es gibt keine „bekannten Grenzen"; auch Punkte mit
Stand „offen" oder „teilweise" sind gemeldet, wenn sie im Browser noch zu sehen sind.
Zählregel: ein Befund je Sachverhalt, ein Typ je Befund; P3 nur bei echter Beeinträchtigung der
Aufgabe, Geschmacksfragen stehen unter „Hinweise" ohne Priorität.

## Prüfaufbau

Chromium über das globale Playwright-Modul (die Projektkopie findet keinen Browser),
`chromium.launch()` ohne Optionen, `isMobile`, `hasTouch`, Tipps per Touch. Viewports 390 x 844
und 360 x 640 (zusätzlich 568 x 320 nur für den Scanner ohne Kamera). Frischer Browserzustand je
Durchlauf. Durchlaufen: Startseite; „Neuen Bogen erstellen" (Schritt 1 bis 6); „Neue
Einsatz-Sammlung…"; „Einheit schnell erfassen" (mit und ohne Ort, drei Einheiten); „Bögen
einlesen…" (drei und vier Beispielbögen, zweimal derselbe Satz); Karte aufklappen, „Mehr…",
„Entfernen" mit Rückfrage und Quittung, „Abrücken", Tabelle, Scanner ohne Kamera, Lageblatt,
Sammel-PDF, CSV (Übersicht, alle Daten), Excel, „Übergabe vermerken…", „Einsatz als beendet
markieren", „Einsatz löschen…". Der Gerätespeicher wurde mit einem bis zum Quota-Fehler
gefüllten `localStorage` nachgestellt (5,24 Mio. Zeichen Füllung).
Nicht prüfbar: Kamera, echte Bildschirmtastatur, Handschuhe, Licht, WebKit, Safe-Area.

## Urteil aus Sicht der Rolle

Beide Aufgaben gehen ohne fremde Hilfe: „eigenen Bogen erfassen" und „Einsatz-Sammlung anlegen,
Einheiten aufnehmen, abrücken, Meldung entfernen, Lageblatt, Sammel-PDF, CSV, Excel, Übergabe
vermerken, Einsatz beenden". Die Rückmeldungen sind inzwischen ehrlich: Bei vollem Speicher sagt
die App überall, dass etwas nicht gespeichert wurde. Was bleibt, sind Wortwahl, eine
Rückmeldung außerhalb des Sichtfelds, ein Pflichtfeld unter dem Falz und eine leere
Tabellenspalte. Nichts davon verhindert eine Aufgabe.

## Bestätigte Behebungen aus Runde 19 (im echten Browser)

- **Voller Speicher** (gemessen mit gefülltem `localStorage`): „Meldung entfernen" fragt „Papierkorb
  voll — Die Meldung kam nicht in den Papierkorb … Endgültig entfernen?" statt „7 Tage im
  Papierkorb" zu behaupten, die Meldung bleibt bis zur Antwort in der Liste. „Übergabe vermerken…"
  → „Übergabe nicht vermerkt … Nichts hat sich geändert". „Einsatz als beendet markieren" →
  „Einsatz nicht beendet … Nichts hat sich geändert". „Einsatz löschen…" → „Nicht gelöscht", der
  Einsatz bleibt stehen. Kein stilles Scheitern mehr (R19-O1 bis O4 gehalten).
- **Fußleiste**: im Assistenten (Schritt 1 bis 5, 360 und 390) und in der Schnellerfassung kein
  Textüberlauf (`scrollWidth` gleich `clientWidth` an allen Knöpfen), Leiste 57 px, kein seitlicher
  Überlauf. „In Einsatz übernehmen" bricht bei 390 auf zwei Zeilen um, bleibt aber im Knopf.
- **Quittungsleiste als Kurzfassung**: nach „Entfernen" 60 px hoch („Nr. 1 entfernt ·
  Papierkorb", „Details", „Rückgängig", „✕"), bei Abrücken, CSV, Excel, Lageblatt und Sammel-PDF
  60 bis 66 px und am unteren Rand sichtbar (R19-N1 und R19-N12 gehalten). Sie steht rund 30 s.
- **Tipp-Sperre**: Tipp 200 ms nach dem Öffnen der Rückfrage zeigt auf dem Knopf „Einen Moment …"
  (gestrichelter Rahmen), die Sperre endet nach rund 0,6 s; Lageblatt gefolgt von CSV nach 0,4 s
  und nach 1,5 s erzeugt beide Dateien (R19-N2 gehalten).
- **Schnellerfassung**: „Ort der Einheit (Pflicht)" steht zuerst (y = 183, auch bei 360 x 640 im
  ersten Bildschirm); „Weiter"/„In Einsatz übernehmen" ohne Ort öffnet „Ort der Einheit fehlt"
  mit Knopf „Zum Feld „Ort der Einheit"". Kopf und Überschriften zählen gleich („Schritt 3 von 6:
  Personal" über „3. Personal"; R19-N3 gehalten).
- **Tabelle am Telefon**: kein seitlicher Überlauf (354 beziehungsweise 384 px breit, `scrollWidth`
  gleich Fensterbreite), Namen vollständig lesbar, Legende „Ges. = Stärke gesamt, Eingetr. =
  eingetroffen" unter der Tabelle.
- **Startseite**: „Neue Einsatz-Sammlung…" liegt bei y = 395 (390 x 844) beziehungsweise y = 362
  (360 x 640) im ersten Bildschirm; die leere Überschrift „Einsatz-Sammlung (Meldekopf)" ist
  verborgen; „Absender" steht nach „So funktioniert's".
- Übung-Bögen: Kennzahlen „EINHEITEN (+4 ÜBUNG)" mit Satz „Nichts gezählt: alle 4 eingegangenen
  Meldungen sind Übung …" (R19-N6 gehalten); Übergabe-Dialog ohne Papierkästchen (R19-N13
  gehalten); wiederholtes Einlesen: „0 Bögen aufgenommen, 3 bereits vorhanden." (R19-K10 mit diesem
  Satz nicht nachgestellt).

## Befunde

### R20-N1 (P3, Text) – Ort „THW Oldenburg" ergibt „THW THW Oldenburg"

- **Neu oder alt (Verweis):** neu.
- **Ort:** Schnellerfassung Schritt 1 („Ort der Einheit (Pflicht)") → Quittung, Karte, Meldung.
- **Beobachtung:** Ich trage „THW Oldenburg" ein (das Feld heißt „Ort der Einheit", der
  Platzhalter „tippen für Vorschläge…", die Organisation steht auf THW voreingestellt). Die
  Quittung lautet „Zuletzt abgelegt: „THW THW Oldenburg"", die Karte „Nr. 1 THW THW Oldenburg",
  die Meldung „„THW THW Oldenburg" hat Nr. 1 — die Nummer auf dem Zettel eintragen." Mit „Oldenburg"
  allein entsteht „THW Oldenburg". Ein Hinweis, dass die Organisation schon davorgesetzt wird,
  fehlt.
- **Erwartung der Rolle:** Ich schreibe die Einheit, wie sie auf dem Zettel steht („THW Oldenburg").
- **Folge:** Doppelter Name im Lageblatt und in jeder Ausgabe, bis jemand ihn über „Details"
  korrigiert.
- **Empfehlung:** Unter dem Feld „wird zu: THW Oldenburg" live zeigen oder ein vorangestelltes
  „THW" nicht doppeln.
- **Verifikation:** „THW Oldenburg" als Ort eintragen, Karte lesen.

### R20-N2 (P3, Bedienung) – Vollassistent: Pflichtfeld „Ort der Einheit" unter dem Falz

- **Neu oder alt (Verweis):** alt – Rest von R19-N4 / R18-W7 (nur die Schnellerfassung wurde
  umgestellt).
- **Ort:** „Neuen Bogen erstellen" → Schritt 1 „Einheit", 360 x 640.
- **Beobachtung:** Im ersten Bildschirm stehen „Organisation", „Organisationsname (optional)" und
  „Einheitstyp"; danach folgt der Absatz „Zugehörigkeit / Kontaktstellen" (y = 421) mit
  Erklärtext, „Ebene (eigene Einheit)" (y = 592), erst dann „Ort der Einheit (Pflicht)" (y = 680).
  „Weiter" ist von Anfang an aktiv.
- **Erwartung der Rolle:** Das einzige Pflichtfeld steht vorn; ich sehe, dass noch etwas fehlt.
- **Folge:** Der Helfer tippt „Weiter", ohne den Ort zu kennen, und trifft den Fehler erst in der
  Übersicht („offene Punkte").
- **Empfehlung:** „Ort der Einheit" direkt unter „Organisation" (wie in der Schnellerfassung),
  Erklärtext darunter.
- **Verifikation:** Schritt 1 öffnen, Lage des Ortsfelds messen (soll im ersten Bildschirm liegen).

### R20-N3 (P3, Text) – Schnellerfassung: „Schritt 1 von 6 … · 2, 5 entfallen"

- **Neu oder alt (Verweis):** neu (R19-N3 behoben, die Schreibweise der Zählung ist neu).
- **Ort:** Schnellerfassung, Kopfzeile „Schritt 1 von 6: Einheit · 2, 5 entfallen", 360 und 390.
- **Beobachtung:** Kopf und Überschriften zählen jetzt einheitlich, aber „2, 5 entfallen" sagt dem
  Helfer nichts: Er kennt weder Schritt 2 noch Schritt 5. Die Fortschrittszahl springt von 1 auf 3.
- **Erwartung der Rolle:** „Schritt 1 von 4" oder keine Zahl.
- **Folge:** Der Helfer fragt sich, was „entfallen" bedeutet und ob er etwas verpasst hat.
- **Empfehlung:** Nur die tatsächlichen Schritte zählen („Schritt 1 von 4") oder „2, 5 entfallen"
  streichen.
- **Verifikation:** Schnellerfassung durchgehen, Kopfzeile lesen.

### R20-N4 (P3, Bedienung) – Quittung der Aufnahme steht unter dem Falz, nicht in der Leiste

- **Neu oder alt (Verweis):** alt – Rest von R18-H1/H2 und R19-N1 (Quittungen); Entfernen, Export
  und Abrücken haben die Leiste, die Aufnahme nicht.
- **Ort:** Einsatz-Seite nach „In Einsatz übernehmen" (Schnellerfassung), 360 x 640.
- **Beobachtung:** Die Seite springt nach oben (Kennzahlen). „Zuletzt abgelegt: „THW …" · jetzt 1
  Einheit, Gesamt 7. In der Liste zeigen" liegt bei y = 650 im 640 px hohen Fenster, also nicht
  sichtbar; eine Leiste am unteren Rand erscheint nicht. Sichtbar ist nur, dass die Zahlen oben
  wechseln.
- **Erwartung der Rolle:** Dieselbe Bestätigung wie nach „Entfernen" und „Abrücken": unten, mit
  „Rückgängig".
- **Folge:** Der Helfer weiß nicht sicher, dass die Einheit angelegt ist und welche Nummer sie
  trägt; er scrollt oder tippt noch einmal.
- **Empfehlung:** Aufnahme in der Quittungsleiste („Nr. 1 aufgenommen · Rückgängig").
- **Verifikation:** Einheit aufnehmen, ohne zu scrollen: Bestätigung sichtbar.

### R20-N5 (P3, Text) – Fachwörter der Sammlung ohne Erklärung

- **Neu oder alt (Verweis):** alt – R19-N7 (und R18-N13).
- **Ort:** Einsatz-Seite (Hinweisblöcke, Tabellenfuß).
- **Beobachtung:** „Summe (3 zählend)" im Tabellenfuß, „Zur Kenntnis genommen", „Zuletzt gemeldete
  oben zeigen", „Zug dieser Einheit: Zuordnen" mit „„Zuordnen" geht erst, wenn ein Zugname
  eingetragen ist", „Bedarf: Verpflegung angefordert 0 (Stärke 7) · bei 1 Einheit nicht erfasst".
  Nur „Merkt nur „gesehen", sendet nichts an die Einheiten" erklärt eines davon.
- **Erwartung der Rolle:** Wörter vom Funk: „anwesend", „gesehen", „kein Zug".
- **Folge:** Der Helfer fragt, ob „Zur Kenntnis genommen" etwas sendet und ob „zählend" „anwesend"
  meint; „Verpflegung angefordert 0 … nicht erfasst" liest sich widersprüchlich.
- **Empfehlung:** „Summe (3 anwesend)", „Alle gesehen", „Zug zuweisen", Bedarfszeile in einem Satz.
- **Verifikation:** Sammlung ohne Anleitung lesen lassen und die Begriffe deuten lassen.

### R20-N6 (P3, Layout) – Tabelle: leere Spalte „Bedarf", abgekürzte Köpfe

- **Neu oder alt (Verweis):** alt – R19-N8 (R18-N9); die Spalte heißt jetzt „Bedarf", ist aber
  weiter leer.
- **Ort:** Einsatz-Seite → „Tabelle", 360 x 640 und 390 x 844.
- **Beobachtung:** Köpfe „EINHEIT · GES. · EINGETR. · BEDARF". Die Spalte „BEDARF" ist ohne Eintrag
  leer und nimmt rund ein Viertel der Breite; die Namen („Nr. 2 THW Delmenhorst im Landkreis")
  brechen dafür auf zwei Zeilen. Die Langform steht nur im ausgeblendeten Kopftext und in der
  Legende unter der Tabelle.
- **Folge:** „Ges." und „Eingetr." müssen aus der Legende erraten werden; die leere Spalte
  verschwendet Breite.
- **Empfehlung:** „Gesamt" und „Eingetroffen" ausschreiben, leere Spalte erst bei Bedarf zeigen.
- **Verifikation:** Tabelle bei 360 px ohne Legende lesen lassen.

### R20-N7 (P3, Text) – Startseite: „Jetzt offline bereit" bei laufendem Nachladen

- **Neu oder alt (Verweis):** neu.
- **Ort:** Startseite, grüner Kasten unter „Bögen sammeln (Meldekopf)", beim ersten Besuch.
- **Beobachtung:** „✓ Jetzt offline bereit für Bogen, PDF, QR-Code und Empfang. Beispielbögen und
  Themenseiten werden nachgeladen (212 von 549) — alle Daten bleiben auf diesem Gerät." Der Haken
  steht, obwohl erst 212 von 549 Dateien geladen sind. Der Kasten ist bei 360 px 243 px hoch.
- **Erwartung der Rolle:** Entweder „bereit" oder „lädt noch"; wer vor der Anfahrt prüft, ob er im
  Funkloch arbeiten kann, braucht ein klares Ja.
- **Folge:** Der Helfer hält das Gerät für fertig vorbereitet, obwohl Themenseiten und Beispiele
  noch fehlen.
- **Empfehlung:** „Kernfunktionen offline bereit" und die Nachladezahl getrennt als „Rest lädt noch
  (212 von 549)".
- **Verifikation:** Startseite frisch öffnen, Kasten lesen, danach nach Abschluss des Ladens erneut.

### R20-N8 (P3, Text) – Dateinamen: Sammel-PDF und Übersicht-CSV beginnen gleich, Vorsilbe „eeb"

- **Neu oder alt (Verweis):** alt – R19-N11 (R18-N10); das Datum steht vorn, die Namen bleiben
  schwer unterscheidbar.
- **Ort:** Download-Ordner nach „Einsatz weitergeben / sichern", „Übersicht als CSV", „Alle Daten
  als CSV", Excel, Lageblatt.
- **Beobachtung:** `2026-10-28_0643_eeb-einsatz_Hochwasser_Elbe.pdf` (Sammel-PDF),
  `…eeb-einsatz_Hochwasser_Elbe.csv` (Übersicht), `…eeb-einsatz-alle-daten_….csv`,
  `…eeb-einsatz-oldenburg_….xlsx`, `…eeb-lageblatt_….pdf`. Die Oberfläche sagt „Weitergabe-Datei
  (Sammel-PDF)", der Dateiname „einsatz"; „eeb" erklärt sich nur dem Entwickler.
- **Folge:** In einer schmalen Dateiliste sind Sammel-PDF und Übersicht nur an der Endung zu
  trennen, die Datei mit Personendaten („alle-daten") ist von der Übersicht schwer zu
  unterscheiden.
- **Empfehlung:** Nach dem Datum die Wörter „Sammel-PDF", „Uebersicht", „Alle-Daten-mit-Namen",
  „Lageblatt", „Excel" statt „eeb-einsatz".
- **Verifikation:** Alle fünf Dateien erzeugen, Namen in einer schmalen Dateiliste lesen.

### R20-N9 (P3, Text) – Speicher-voll-Hinweise nennen Wege, die nicht zutreffen

- **Neu oder alt (Verweis):** neu (Folge der Behebung von R19-O2 bis O4).
- **Ort:** Dialoge „Übergabe nicht vermerkt", „Einsatz nicht beendet", „Nicht gelöscht" bei vollem
  Speicher, 390 x 844.
- **Beobachtung:** „Erst sichern (Einsatz weitergeben / sichern), dann Platz schaffen: Papierkorb
  leeren oder alte Einsätze endgültig löschen." Im geprüften Zustand (ein Einsatz, Papierkorb
  leer) gibt es beides nicht. „Nicht gelöscht" empfiehlt „unter „Mehr…" Meldungen oder Einheiten
  entfernen", aber „Entfernen" fragt bei vollem Speicher selbst „Papierkorb voll … Endgültig
  entfernen?". Die Dialoge nennen weder die Größe der Belegung noch, wie viel frei werden müsste.
- **Erwartung der Rolle:** Ein Weg, der in meinem Zustand wirklich möglich ist.
- **Folge:** Der Helfer sucht einen Papierkorb, der leer ist, und weiß nicht, ob „Alle Daten
  löschen" nötig ist.
- **Empfehlung:** Nur die zutreffenden Wege nennen (Papierkorb nur, wenn er Einträge hat) und die
  Belegung angeben.
- **Verifikation:** Speicher füllen, die drei Dialoge lesen, jeden genannten Weg ausführen.

## Hinweise (keine Priorität)

- **H1 – Startseite lang und eng:** 6 920 px (390) beziehungsweise 7 220 px (360); die zwei Spalten
  sind bei 360 px je 146 px breit, „Einheit schnell erfassen (nur Stärke)…" bricht auf drei Zeilen,
  „Einsatz importieren…" steht linksbündig neben zentrierten Nachbarn. Die Hauptaktionen liegen im
  ersten Bildschirm; es ist Geschmack, nicht Aufgabenhindernis (Rest von R19-N10).
- **H2 – „Mehr…"-Blatt:** Das Blatt am unteren Rand deckt die Karte ab, trägt keinen Namen der
  Einheit, heißt „Weniger" (Karte) und „Weniger anzeigen" (Blatt) und bleibt bei geöffneter
  Rückfrage hell. Die Rückfrage nennt die Einheit („Nr. 1 „THW Oldenburg""), daher kein Befund.
- **H3 – Scanner ohne Kamera:** Der Dialog hat keine Überschrift und nur „Fertig" zum Verlassen
  (kein „Schließen"); die Aufgabe geht über „QR aus Bild einlesen…". Bei 568 x 320 passt der Dialog
  ohne inneres Rollen (Standard-Ansicht; „Feld" nicht geprüft).
- **H4 – Karte und Hinweiszeilen:** Zeilenabstände in der aufgeklappten Karte sind großzügig
  (Karte 330 px hoch), „neu · kürzlich eingetroffen" sagt zweimal dasselbe, die Zeile „Bedarf: …
  · bei 1 Einheit nicht erfasst" bricht bei 360 px mit einem einzelnen „·" um.
- **H5 – Standzeit der Quittung:** Die Leiste steht rund 30 s (60 px), deckt unten Inhalt ab, ist
  aber per „✕" schließbar.

## Aufgabe

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Das Feld „Ort der Einheit" nimmt den ganzen Zettelnamen entgegen,
  die App setzt aber die Organisation davor („THW THW Oldenburg").
- **Größtes Einsatzrisiko:** Das Pflichtfeld „Ort der Einheit" liegt im Vollassistenten unter dem
  Falz; der Bogen wird dann ohne Ort übergeben und erst in der Übersicht als „offen" bemerkt.
- **Top-Priorität für die nächste Iteration:** Ortsfeld im Vollassistenten nach oben (R20-N2) und
  die Aufnahme in der Quittungsleiste bestätigen (R20-N4).
