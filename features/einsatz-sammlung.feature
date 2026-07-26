# language: de
Funktionalität: Einsatz-Sammlung anlegen und Bögen darin sammeln
  Als Meldekopf möchte ich einen Einsatz anlegen und fremde Bögen darin sammeln.
  Die Rückfragen dazu müssen in der Oberfläche der App stehen: Die eingebauten
  JavaScript-Dialoge (prompt/confirm) beantwortet die iOS-App nicht — dort tat
  der Knopf scheinbar nichts. Jedes Szenario hier scheitert zusätzlich, sobald
  ein Systemdialog auftaucht (Wachhund in features/support/haken.ts).

  Szenario: Einsatz von der Startseite aus anlegen
    Angenommen ich öffne die App
    Wenn ich auf "Neuer Einsatz…" klicke
    Dann sehe ich den Dialog "Neuen Einsatz anlegen"
    Wenn ich im Dialog "Name" mit "Hochwasser Weser" fülle
    Und ich im Dialog "Ort / Auftrag (optional)" mit "Deichabschnitt Nord" fülle
    Und ich im Dialog auf "Einsatz anlegen" klicke
    Dann sehe ich die Überschrift "Hochwasser Weser"
    Und sehe ich den Text "Einsatz · Deichabschnitt Nord"

  Szenario: Ohne Namen lässt sich kein Einsatz anlegen
    Angenommen ich öffne die App
    Wenn ich auf "Neuer Einsatz…" klicke
    Dann sehe ich den Dialog "Neuen Einsatz anlegen"
    Und ist im Dialog "Einsatz anlegen" gesperrt

  Szenario: Die Eingabetaste legt den Einsatz an
    Angenommen ich öffne die App
    Wenn ich auf "Neuer Einsatz…" klicke
    Und ich im Dialog "Name" mit "Sturmflut Wangerland" fülle
    Und ich im Dialog die Eingabetaste drücke
    Dann sehe ich die Überschrift "Sturmflut Wangerland"

  Szenario: Esc schließt den Dialog ohne etwas anzulegen
    Angenommen ich öffne die App
    Wenn ich auf "Neuer Einsatz…" klicke
    Und ich im Dialog "Name" mit "Nie angelegt" fülle
    Und ich den Dialog mit Esc schließe
    Dann ist kein Dialog offen
    Und sehe ich die Schaltfläche "Neuen Bogen erstellen"
    Und sehe ich "Nie angelegt" nicht

  Szenario: Abgebrochener Dialog legt nichts an
    Angenommen ich öffne die App
    Wenn ich auf "Neuer Einsatz…" klicke
    Und ich im Dialog "Name" mit "Verworfen" fülle
    Und ich im Dialog auf "Abbrechen" klicke
    Dann sehe ich die Schaltfläche "Neuen Bogen erstellen"
    Und sehe ich "Verworfen" nicht

  Szenario: Gescannten Bogen in einen neu angelegten Einsatz aufnehmen
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg - Ni"
    Wenn ich auf "In Einsatz aufnehmen…" klicke
    Und ich auf "Neuen Einsatz anlegen…" klicke
    Dann sehe ich den Dialog "Neuen Einsatz anlegen"
    Wenn ich im Dialog "Name" mit "Sammelübung Nord" fülle
    Und ich im Dialog "Art" auf "Übung" stelle
    Und ich im Dialog auf "Einsatz anlegen" klicke
    Dann sehe ich die Überschrift "Sammelübung Nord"
    Und sehe ich den Text "Übung"
    Und sehe ich die Überschrift "Einheiten (1)"

  Szenario: Bogen verwerfen fragt in der App zurück
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "Neuer Bogen" klicke
    Dann sehe ich den Dialog "Aktuellen Bogen verwerfen?"
    Wenn ich im Dialog auf "Verwerfen und neu beginnen" klicke
    Dann sehe ich die Schaltfläche "Neuen Bogen erstellen"
