# Prüfbericht Runde 21: Arbeitsablauf

- **Prüfer:** Rolle „Arbeitsablauf“ (thw-workflow-reviewer), Meldekopf-Bediener und Helfer mit eigenem Bogen in einer Person
- **Datum:** 2026-10-29
- **Code-Stand:** Commit `f007590` (Runde 20; Merge `17f1487` = `main`), Produktionsbuild, `http://localhost:4173`
- **Methode:** Playwright (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, frisches Profil je Lauf, Viewports 360 x 640 (Hauptlauf), 390 x 844, 320 x 568, 568 x 320 und 640 x 360 (quer, auch „Feld“). Einsatz „Übung Weser“ mit zwei per Schnellerfassung abgelegten Einheiten („DRK Bremen“, „THW Oldenburg“) und vier Beispielbögen aus `examples/thw/`; eigener Bogen im Assistenten (Entwurf, Schließen, Ersetzen, Zurückholen). Voller Speicher: `localStorage` bis zum Quota-Fehler gefüllt. Nachgeladene Teile: Netzdrosselung per Chrome-DevTools-Protokoll („schnelles 4G“ 1,6 MBit/s, 150 ms; „langsames 3G“ 400 kBit/s, 400 ms) mit blockiertem Service Worker, Zustand alle 150 bis 250 ms gemessen; Offline: nach dem ersten Laden und „Jetzt offline bereit“ das Netz getrennt (`setOffline`), dann Neuladen, Startseite, Einsatz öffnen und anlegen, Assistent, Bogen übergeben, Exporte; zusätzlich Abgleich von `dist/assets` mit dem Precache des Service Workers. Kein Code geändert. Nicht geprüft: echte Kamera, Nahbereich, Bildschirmtastatur, native Builds, Inhalt der erzeugten PDF-Seiten, ein echtes Mobilnetz (die Drosselung ist nur eine Annäherung), anderer Webserver als `vite preview`.
- **Maßstab:** Keine „bekannten Grenzen“. Auch Punkte, die in Runde 20 als „offen“ oder „nicht ganz erreicht“ geführt wurden, sind gemeldet, wenn sie im Browser noch zu sehen sind. Je Sachverhalt ein Befund; Behebungen, die im Browser nicht mehr zu beobachten sind, stehen nur unter „Haltbarkeit“.
- **Zählung:** P0: 1 · P1: 0 · P2: 1 · P3: 4 · Hinweise (ohne Priorität): 5

## Urteil aus Sicht der Rolle

Erwartete Arbeitsfolge (Annahme, kein bekannter THW-Vorschrifttext): Der Meldekopf legt einen Einsatz an, nimmt Bögen auf (Datei, Scan oder Schnellerfassung vom Zettel), ordnet Zug zu, rückt Einheiten ab, gibt die Lage weiter (Lageblatt, CSV, Sammel-PDF), vermerkt die Übergabe und markiert den Einsatz als beendet. Daneben steht der eigene Bogen bis zur Übergabe.

Mit Netz und im laufenden Betrieb ohne Neuladen ließ sich der gesamte Ablauf ohne fremde Hilfe, ohne doppelte Eingabe und ohne Datenverlust durchlaufen; die Behebungen aus Runde 20 halten (siehe Tabelle). Das Nachladen von Einsatzansicht und Zeichensammlung ist online auch bei gedrosseltem Netz nicht spürbar. **Nicht** fortsetzbar ist der Ablauf dagegen im Funkloch nach einem Neustart: Wer die App einmal online geladen hat, das Netz verliert und dann die Einsatzansicht öffnet, landet auf der Fehlerseite „Hier ist etwas schiefgelaufen“ (R21-W1, P0). Das widerspricht dem Hinweis „Funktioniert komplett offline“ auf der Startseite. Daneben: Eine Einheit eines anderen Verbands wird in der Schnellerfassung stillschweigend als „THW …“ abgelegt (R21-W2, P2). Der Rest sind Reste aus Runde 20 und Kleinigkeiten (P3).

## Haltbarkeit der Behebungen aus Runde 20 (im echten Browser)

| Behebung | Ergebnis |
| --- | --- |
| Bogen schließen bei vollem Speicher | hält: Bogen wird geschlossen und liegt nach Neuladen unter „Zuletzt geschlossenen Bogen zurückholen“ |
| Bogen ersetzen (zweiter Bogen, Rückholplatz belegt) | hält, auch bei vollem Speicher: Rückfrage nennt „Bogen „THW Husum“ … wird dabei endgültig gelöscht“ |
| Zurückholen | hält: „Bogen „THW Husum“ zurückgeholt“, Stand unverändert |
| „Endgültig löschen“ im Notweg (Einsatzansicht und Startseite) | hält: zwei Schritte („Endgültig löschen…“, dann „Ja, endgültig löschen“ mit „einzige Kopie“-Hinweis), „Einsatz behalten“ jeweils als Standard; Tipp in der ersten Sekunde bewirkt nichts (Sperre, siehe H4) |
| Kein „THW THW Oldenburg“ | hält: Karte „Nr. 2 THW Oldenburg“, Quittung nennt Nr. und Namen |
| „Ort der Einheit ändern…“ | hält: Dialog mit vorbelegtem Ort, Übernahme, Rückgängig (siehe aber R21-W2 für die Organisation) |
| Schnellerfassung Schrittzählung | hält im Kopf („Schritt 1 von 4: Einheit“, „2 von 4: Personal“, „3 von 4: Fahrzeuge“); Rest siehe R21-W3 |
| Scanner ohne Kamera quer | hält: 568 x 320 und 640 x 360 mit „Hinweise zum Handscanner“, „QR aus Bild einlesen…“ und „Fertig“ vollständig im Bild, kein inneres Rollen; 360 x 640 und 390 x 844 ebenso |
| Dialoge bei 320 x 568 | hält: „Datensicherung“ 842 px Inhalt in 534 px sichtbarem Rahmen, „Alle Daten löschen“: Haken bei y = 343 und „Endgültig löschen“ bei y = 423 im ersten Bild |
| Tabelle am Telefon | hält: 338 px in 360 px, 298 in 320, 368 in 390, kein seitlicher Überlauf, Köpfe ausgeschrieben, Schrift 14 px |
| Quittung „Zug zugeordnet“ | hält: „Zug „1. Zug“: 7 Einheiten“ sichtbar (R20-W5 behoben) |
| Kopfzeile „noch offen“ nach Beenden | hält: „noch offen: Weitergabe-Datei (Sammel-PDF), Lageblatt und 4 weitere“ (R20-W2 behoben) |
| Mehrfach-Einlesen, gleicher Stand | hält: „1 Bogen aufgenommen, 4 bereits vorhanden“, kein „älterer Stand“ (R20-W4 nicht mehr zu beobachten) |
| Exporte (Lageblatt, CSV, Sammel-PDF) | halten, online und im Browser-Lauf ohne Netz; Übergabeblock springt auf „✓ … erzeugt“ |
| Einsatz beenden / Meldung entfernen / „Zur Kenntnis genommen“ | halten: Quittungen mit Nr., Namen und „Rückgängig“ |

## Nachgeladene Teile: Wirkung beim Laden

- **Einsatzansicht:** Die Schaltfläche „Öffnen“ erscheint erst, wenn der Block geladen ist. Nach dem Tipp steht die Ansicht nach 116 bis 320 ms da, auch bei „langsamem 3G“ (Kaltstart ohne Cache). Kein Platzhalter, kein Sprung. Ein einzelner Nachzügler (Lagemonitor-Block) siehe H2.
- **Zeichensammlung:** Die Entwurfskarte steht mit festem 42 x 42-px-Bild an Ort und Stelle; das Zeichen ersetzt den Platzhalter nach 0,25 s (4G) bis 1,5 s (3G), die Karte springt nicht (Höhe 212 px vorher und nachher). Siehe H1.
- **Offline:** Startseite, „Neuen Bogen erstellen“, Assistent, „Fortsetzen“, „Bogen übergeben…“ und alle drei Exporte funktionieren; die Einsatzansicht nach Neuladen nicht (R21-W1).

## Befunde

### R21-W1 [P0] Typ Bedienung: Einsatzansicht ist offline nach dem Neuladen nicht zu öffnen („Hier ist etwas schiefgelaufen“)

- **Neu oder alt (Verweis):** neu (Folge der Nachladung der Einsatzansicht in Runde 20; die Startseite sagt dazu „Funktioniert komplett offline“, vgl. R19-O/R20 Offline)
- **Ort:** Startseite › Einsatz-Karte › „Öffnen“; ebenso „Neue Einsatz-Sammlung…“ › „Einsatz anlegen“, „In Einsatz-Sammlung ablegen…“ aus dem eigenen Bogen und jedes Neuladen mit zuletzt geöffnetem Einsatz, jeweils nach Netztrennung. 360 x 640.
- **Beobachtung:** Online geladen, bis „✓ Jetzt offline bereit. Funktioniert komplett offline — alle Daten bleiben auf diesem Gerät.“ gewartet, Einsatz angelegt, dann Netz getrennt und die Seite neu geladen. Die Startseite erscheint („Einsatz-Sammlung (Meldekopf) · Übung Weser · Öffnen“), nach „Öffnen“ aber die Seite „Hier ist etwas schiefgelaufen — Die Ansicht ließ sich nicht aufbauen. Deine Daten liegen weiter auf diesem Gerät …“. Reproduziert in drei Läufen und auf vier Wegen: (a) „Öffnen“, (b) Neuladen, solange der Einsatz zuletzt offen war (Fehlerseite direkt), (c) „Neue Einsatz-Sammlung…“ legt den Einsatz an und stürzt danach ab, (d) „In Einsatz-Sammlung ablegen…“ aus dem Bogen stürzt nach der Auswahl ab. Konsole: `Unable to preload CSS for http://localhost:4173/assets/index-Bp0pLAQP.css`. Diese Datei fehlt im Build (`dist/assets` und Precache enthalten sie nicht; der nachgeladene Block `einsaetze-ui-….js` fordert sie dennoch an). Online fängt `vite preview` die Adresse mit der Startseite ab, offline scheitert der Abruf und das Nachladen bricht ab. Bleibt die App dagegen offen, in der der Block schon geladen wurde, funktionieren Tabelle, Karten, erneutes Öffnen und alle Exporte auch ohne Netz. Die Fehlerseite nennt den Grund nicht und rät zu „Neu laden“, was offline nichts ändert.
- **Folge:** Im Funkloch ist die Kernfunktion des Meldekopfs (Lage, Abrücken, Lageblatt, Übergabe) nach jedem Neustart von App oder Telefon nicht erreichbar, obwohl die App „komplett offline“ zusagt. Daten gehen nicht verloren, aber der Ablauf ist nicht fortsetzbar; der Helfer hält die App für kaputt und greift zum Papier. Wer offline einen Einsatz anlegt oder einen Bogen ablegt, bekommt zusätzlich einen Absturz mitten in der Aktion, ohne zu wissen, ob sie gespeichert wurde. Wahrscheinlich (nicht geprüft) auch online hinter einem Webserver, der für die fehlende Datei 404 liefert.
- **Empfehlung:** Den Verweis auf die nicht vorhandene Stildatei aus dem nachgeladenen Block entfernen (oder die Datei ausliefern und in den Vorrat nehmen); beim Ladefehler der Einsatzansicht einen eigenen Text zeigen („Ansicht nicht geladen — Verbindung prüfen“) mit „Nochmal versuchen“; den Hinweis „Funktioniert komplett offline“ erst zeigen, wenn dieser Weg besteht.
- **Verifikation:** Online laden, „Jetzt offline bereit“ abwarten, Netz trennen, Neuladen, „Öffnen“, außerdem „Neue Einsatz-Sammlung…“ und „In Einsatz-Sammlung ablegen…“: Einsatzansicht mit Karten, Tabelle und „Bogen scannen…“ erscheint; zusätzlich Netz-aus unmittelbar nach dem ersten Laden; Konsole ohne `Unable to preload`.

### R21-W2 [P2] Typ Daten/Verlust: Schnellerfassung legt „DRK Bremen“ als „THW DRK Bremen“ ab; die Organisation ist eingeklappt und an der Karte nicht änderbar

- **Neu oder alt (Verweis):** neu (Gegenrichtung zu R20-H1 „THW THW Oldenburg“)
- **Ort:** Einsatz › „Einheit schnell erfassen (nur Stärke)…“ › „Ort der Einheit (Pflicht)“; Organisation unter „▸ Organisation, Ebene, Kontakt (optional)“; danach Karte › „Mehr…“.
- **Beobachtung:** Ich trage ab, was auf dem Zettel steht: „DRK Bremen“. Die Organisation steht unsichtbar auf „THW“. Ergebnis: „Nr. 1 THW DRK Bremen“ in Liste, Tabelle, Quittung, Dialog „Stärke fehlt“ und „Ort der Einheit ändern“ („„THW DRK Bremen“ bekommt einen anderen Ort“), Karte „THW · Stärke 0 / 0 / 6 / 6“. Unter „Mehr…“ (Aufteilen, Stärke ändern, Als Übung kennzeichnen, Ort der Einheit ändern, Verschieben, Entfernen) gibt es keine Änderung der Organisation. Im Vollassistenten ist die Organisation dagegen ein sichtbares Auswahlfeld.
- **Folge:** Fremde Einheiten stehen als THW im Lageblatt, in der CSV und in der Organisations-Zählung; Korrektur nur über „Entfernen“ und neu erfassen, dabei bleibt die Nummer frei und weicht vom Zettel ab.
- **Empfehlung:** Organisation im ersten Bild sichtbar halten (eine Zeile, nicht „optional“) oder aus dem Namen erkennen und rückfragen; an der Karte „Organisation ändern…“ neben „Ort der Einheit ändern…“.
- **Verifikation:** „DRK Bremen“ eintragen: Karte zeigt DRK (oder die Rückfrage erscheint); Organisation an der Karte änderbar.

### R21-W3 [P3] Typ Text: Kopf „Schritt 2 von 4: Personal“ steht über der Überschrift „3. Personal“

- **Neu oder alt (Verweis):** alt, R20-W3 (Rest: die Zählung im Kopf ist behoben, die Überschriften zählen weiter nach dem Vollassistenten)
- **Ort:** Schnellerfassung, Kopfband und Überschrift je Schritt, 360 x 640.
- **Beobachtung:** „Schritt 1 von 4: Einheit“ / „1. Einheit“; „Schritt 2 von 4: Personal“ / „3. Personal“; „Schritt 3 von 4: Fahrzeuge“ / „4. Fahrzeuge“. Die Zahlen widersprechen sich im selben Bild.
- **Folge:** Gering. Kurze Irritation („fehlt ein Schritt?“).
- **Empfehlung:** In der Schnellerfassung die Überschriften ohne Nummer oder mit der Zählung des Kopfes.
- **Verifikation:** Kopf und Überschrift zeigen in allen Schritten dieselbe Zahl.

### R21-W4 [P3] Typ Layout/Abstand: Nach dem Einlesen liegt die erste Einheitenkarte 1,8 Bildschirme unter dem Kopf

- **Neu oder alt (Verweis):** alt, R20-W6 / R20-H5 / R20-G6 (Rest; R19-W4)
- **Ort:** Einsatzansicht nach Schnellerfassung (zwei Einheiten) und nach „Bögen einlesen…“ (vier Beispielbögen), 360 x 640.
- **Beobachtung:** Überschrift „Einheiten (…)“ liegt bei y = 897, die erste Karte „Nr. 1“ bei y = 1 141 (zwei Einheiten) und y = 1 275 (sechs Einheiten); der Bildschirm ist 640 px hoch. Davor stehen Kennzahlen, die vier Aufnahmeknöpfe, Quittung, „Neu seit der letzten Kenntnisnahme“, Bedarf und Sprungverweise.
- **Folge:** Gering; „Zur Einheitenliste ↓“ führt hin, wenn man den Verweis findet. Nach jeder Aufnahme muss der Helfer suchen, um die eben aufgenommene Einheit zu sehen.
- **Empfehlung:** Liste unmittelbar nach den Kennzahlen; Aufnahmeknöpfe und Zug-Formular nach unten oder einklappen.
- **Verifikation:** Erste Karte unter y = 960 bei 360 x 640 nach dem Einlesen.

### R21-W5 [P3] Typ Layout/Abstand: Assistent im Querformat „Feld“ (568 x 320): „Ort der Einheit (Pflicht)“ liegt zur Hälfte unter der Fußleiste

- **Neu oder alt (Verweis):** alt, R20-N2 (Rest)
- **Ort:** „Neuen Bogen erstellen“, Schritt 1, 568 x 320 mit „Feld“ (Standard 568 x 320 und „Feld“ 640 x 360 ohne Befund).
- **Beobachtung:** Die feste Leiste („Ansicht“, „Weiter →“) beginnt bei y = 255, das Feld liegt bei y = 238 bis 291; im ersten Bild ist nur die obere Hälfte sichtbar, ohne Wischen ist das Pflichtfeld nicht vollständig zu sehen. Erst der Tipp ins Feld rollt es frei.
- **Folge:** Gering; ein Tipp auf die sichtbare Hälfte genügt.
- **Empfehlung:** Im Querformat „Feld“ Organisation und Organisationsname in eine Zeile oder das Ortsfeld nach oben.
- **Verifikation:** 568 x 320 „Feld“, Schritt 1: Ortsfeld vollständig über der Leiste, ohne Wischen.

### R21-W6 [P3] Typ Bedienung: Notweg bei vollem Speicher auf der Startseite bietet kein „Erst sichern“, obwohl der Text dazu rät

- **Neu oder alt (Verweis):** neu (Folge der Behebung von R20-W1; die Handlung ist sicher, die Wegwahl auf der Startseite neu)
- **Ort:** Startseite › Einsatz-Karte › „Löschen…“ › „In den Papierkorb“ bei vollem Speicher, Dialog „Nicht gelöscht“, 360 x 640.
- **Beobachtung:** Der Text sagt „Erst sichern (Einsatz weitergeben / sichern)“, die Startseite bietet aber nur „Endgültig löschen…“ und „Einsatz behalten“. In der Einsatzansicht steht derselbe Dialog mit der zusätzlichen Schaltfläche „Erst sichern (Sammel-PDF erzeugen) — Es gibt noch keinen Export“. Das „Sichern“ liegt auf der Startseite also hinter „Öffnen“, was der Dialog nicht sagt.
- **Folge:** Der Helfer sieht auf der Startseite zwei Wege, von denen einer die einzige Kopie vernichtet (zweite Rückfrage und Sperre fangen das ab); der Weg zum Sichern fehlt in diesem Bild.
- **Empfehlung:** Auf der Startseite denselben Dialog wie in der Einsatzansicht oder ein „Einsatz öffnen und sichern“; Text an die jeweils vorhandenen Schaltflächen anpassen.
- **Verifikation:** Speicher füllen, auf der Startseite „Löschen…“ ohne Export: „Erst sichern“ oder „Einsatz öffnen“ steht als erster Weg im Dialog.

## Hinweise (ohne Priorität)

- **H1 Zeichen-Platzhalter:** Auf der Entwurfskarte der Startseite steht anfangs ein leeres Bild, das Zeichen erscheint nach 0,25 s (4G) bis 1,5 s (3G). Kein Sprung, keine Funktionseinbuße. Ohne Netz im Vorrat.
- **H2 Später Block unten in der Einsatzansicht:** Bei „langsamem 3G“ erscheint nach etwa 2,4 s ein Block (Lagemonitor) zwischen Export-Erklärung und „Übergabe und Abschluss“ und schiebt den Rest um 84 px (bei y ≈ 2 700). Nur sichtbar, wer in dieser Zeit schon dort liegt.
- **H3 Startseite mit Entwurf und Einsatz:** „Neuen Bogen erstellen“ und „Neue Einsatz-Sammlung…“ liegen bei y = 755 (360 x 640) unter dem ersten Bild; „Fortsetzen“ und „Öffnen“ stehen darüber. Nur Reihenfolge, keine Beeinträchtigung.
- **H4 Sperre im Notweg ohne Anzeige:** Die Schaltfläche „Endgültig löschen…“ ist in der ersten Sekunde nach dem Öffnen gesperrt (`aria-disabled`), ohne sichtbaren Hinweis („Einen Moment …“ wie anderswo); ein früher Tipp bewirkt nichts. Schützt, wirkt aber wie ein Hänger.
- **H5 „Entwurf … wiederhergestellt“ nach jedem Neuladen:** Die Startseite meldet bei vorhandenem Entwurf „Entwurf vom … wiederhergestellt“, auch wenn nichts verloren war. Kann nach Absturz klingen.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (online und bei laufender App ja; im Funkloch nach Neustart nein)
- **Fremde Hilfe nötig:** nein (online); offline ja, weil die Fehlerseite keinen Weg zeigt
- **Größtes Missverständnis:** „Jetzt offline bereit“ und „Funktioniert komplett offline“ gelten nicht für den Einsatz (R21-W1); auch die Karte „THW DRK Bremen“ liest sich wie ein Tippfehler des Helfers, ist aber eine stille Vorgabe (R21-W2).
- **Größtes Einsatzrisiko:** Einsatzansicht nach Neustart ohne Netz nicht erreichbar (R21-W1); sonst wurde kein Datenverlust beobachtet.
- **Top-Priorität für die nächste Iteration:** R21-W1 (fehlenden Stil-Verweis des nachgeladenen Blocks beheben, Offline-Prüfung nach Neuladen als Test).
