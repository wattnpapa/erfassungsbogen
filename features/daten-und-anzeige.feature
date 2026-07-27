# language: de
Funktionalität: Darstellung, Datensicherung und Auskunft
  Die App läuft im Einsatz auch draußen und nachts, hält alle Daten lokal und
  muss sie auf Wunsch sichern oder restlos löschen können — dazu die
  Pflichtangaben und die Beispielbögen.

  Szenario: Anzeigemodus umschalten und über den Neustart behalten
    Angenommen ich öffne die App
    Dann ist der Anzeigemodus "Standard" aktiv
    Wenn ich den Anzeigemodus "Feld" wähle
    Dann ist der Anzeigemodus "Feld" aktiv
    Wenn ich die Seite neu lade
    Dann ist der Anzeigemodus "Feld" aktiv
    Wenn ich den Anzeigemodus "Nacht" wähle
    Dann ist der Anzeigemodus "Nacht" aktiv

  Szenario: Datensicherung erstellen
    Angenommen ich öffne die App
    Wenn ich auf "Datensicherung" klicke
    Dann sehe ich den Dialog "Datensicherung"
    Und sehe ich den Hinweis "Die Datei enthält den privaten Signaturschlüssel"
    Wenn ich auf "Sicherung erstellen…" klicke und eine Datei erhalte
    Dann heißt die heruntergeladene Datei wie "*.json"

  Szenario: Eine Sicherung holt die Daten auf ein leergeräumtes Gerät zurück
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "Als Vorlage speichern" klicke
    Und ich im Dialog "Name der Vorlage" mit "FGr K Oldenburg" fülle
    Und ich im Dialog auf "Vorlage speichern" klicke
    Und ich auf "‹ Startseite" klicke
    Und ich auf "Datensicherung" klicke
    Und ich auf "Sicherung erstellen…" klicke und eine Datei erhalte
    Und ich im Dialog auf "Schließen" klicke
    Und ich auf "Alle Daten löschen" klicke
    Und ich im Dialog "Ja, alle lokalen Daten dieser App endgültig löschen" ankreuze
    Und ich im Dialog auf "Endgültig löschen" klicke
    Und ich im Dialog auf "Neu starten" klicke
    Dann sehe ich "Gespeicherte Vorlagen" nicht
    Wenn ich auf "Datensicherung" klicke
    Und ich die zuletzt erhaltene Datei über "Sicherung einspielen…" einlese
    Dann sehe ich den Dialog "Sicherung einspielen?"
    Wenn ich im Dialog auf "Einspielen und ersetzen" klicke
    Dann sehe ich den Dialog "Sicherung eingespielt"
    Wenn ich im Dialog auf "Neu laden" klicke
    Dann sehe ich die Überschrift "Gespeicherte Vorlagen"
    Und sehe ich die Überschrift "FGr K Oldenburg"

  Szenario: Ohne Netz startet die App weiter
    Angenommen ich öffne die App
    Wenn ich die App vom Netz trenne
    Und ich die Seite neu lade
    Dann sehe ich die Überschrift "Einheiten-Erfassungsbogen"
    Und sehe ich die Schaltfläche "Neuen Bogen erstellen"
    Und sehe ich den Hinweis "Funktioniert komplett offline"

  Szenario: Ohne Netz entsteht auch der Bogen samt QR-Code
    Angenommen ich öffne die App
    Wenn ich die App vom Netz trenne
    Und ich die Seite neu lade
    Und ich auf "Neuen Bogen erstellen" klicke
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Gesamtübersicht"
    Und sehe ich das Bild "EEB2-QR-Code"

  Szenario: Alle Daten löschen verlangt einen bewussten Haken
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "‹ Startseite" klicke
    Und ich auf "Alle Daten löschen" klicke
    Dann sehe ich den Dialog "Alle lokalen Daten löschen"
    Und sehe ich den Hinweis "der aktuelle Bogen-Entwurf"
    Und ist die Schaltfläche "Endgültig löschen" gesperrt
    Wenn ich im Dialog "Ja, alle lokalen Daten dieser App endgültig löschen" ankreuze
    Dann ist die Schaltfläche "Endgültig löschen" bedienbar

  Szenario: Alle Daten löschen leert den Gerätespeicher
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "‹ Startseite" klicke
    Und ich auf "Alle Daten löschen" klicke
    Und ich im Dialog "Ja, alle lokalen Daten dieser App endgültig löschen" ankreuze
    Und ich im Dialog auf "Endgültig löschen" klicke
    Dann sehe ich den Dialog "Alle lokalen Daten gelöscht"
    Wenn ich im Dialog auf "Neu starten" klicke
    Dann sehe ich die Schaltfläche "Neuen Bogen erstellen"
    Und sehe ich die Schaltfläche "Fortsetzen" nicht

  Szenario: Löschen abbrechen lässt die Daten stehen
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "‹ Startseite" klicke
    Und ich auf "Alle Daten löschen" klicke
    Und ich im Dialog auf "Abbrechen" klicke
    Dann ist kein Dialog offen
    Und sehe ich die Schaltfläche "Fortsetzen"

  Szenario: Angefangenen Bogen direkt von der Startseite verwerfen
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "‹ Startseite" klicke
    Und ich auf "Verwerfen" klicke
    Dann sehe ich den Dialog "Angefangenen Bogen verwerfen?"
    Wenn ich im Dialog auf "Verwerfen" klicke
    Dann sehe ich den Hinweis "Angefangener Bogen verworfen."
    Und sehe ich die Schaltfläche "Fortsetzen" nicht

  Szenario: Das Verwerfen abbrechen lässt den angefangenen Bogen stehen
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "‹ Startseite" klicke
    Und ich auf "Verwerfen" klicke
    Und ich im Dialog auf "Abbrechen" klicke
    Dann ist kein Dialog offen
    Und sehe ich die Schaltfläche "Fortsetzen"

  Szenario: Pflichtangaben sind aus der Fußzeile erreichbar
    Angenommen ich öffne die App
    Wenn ich auf "Impressum" klicke
    Dann sehe ich den Dialog "Impressum"
    Wenn ich im Dialog auf "Schließen" klicke
    Und ich auf "Datenschutz" klicke
    Dann sehe ich den Dialog "Datenschutz"
    Und sehe ich die Überschrift "1. Verantwortlicher"

  Szenario: Beispielbögen lassen sich durchblättern und öffnen
    Angenommen ich öffne die App
    Wenn ich auf "Beispielbögen" klicke
    Dann sehe ich den Dialog "Beispielbögen"
    Und sehe ich den Hinweis "Organisation oder Thema wählen:"

  Szenario: Der Erststart erklärt das Grundprinzip
    Angenommen ich öffne die App
    Dann sehe ich die Überschrift "So funktioniert’s"
    Und sehe ich den Hinweis "1. Bogen ausfüllen"
    Und sehe ich den Hinweis "Funktioniert komplett offline"

  Szenario: Ein kaputter Link meldet sich verständlich
    Angenommen ich öffne einen Bogen-Link mit beschädigtem Inhalt
    Dann sehe ich den Hinweis "Der geöffnete Link enthält keinen gültigen Erfassungsbogen."
    Und sehe ich die Schaltfläche "Neuen Bogen erstellen"
