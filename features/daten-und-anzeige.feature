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
