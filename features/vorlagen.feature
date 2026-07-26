# language: de
Funktionalität: Vorlagen anlegen, verwalten und mustern
  Als Zugführer möchte ich meine Einheit einmal als Vorlage hinterlegen und vor
  jedem Einsatz nur noch abhaken, wer tatsächlich da ist — die Vorlage selbst
  bleibt dabei unverändert.

  Grundlage:
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "Als Vorlage speichern" klicke
    Und ich im Dialog "Name der Vorlage" mit "FGr K Oldenburg" fülle
    Und ich im Dialog auf "Vorlage speichern" klicke
    Und ich auf "‹ Startseite" klicke
    Dann sehe ich die Überschrift "Gespeicherte Vorlagen"

  Szenario: Die gespeicherte Vorlage steht auf der Startseite
    Dann sehe ich die Überschrift "FGr K Oldenburg"
    Und sehe ich den Hinweis "3 Personen"
    Und sehe ich die Schaltfläche "Einsatz vorbereiten"

  Szenario: Vorlage umbenennen
    Wenn ich auf "Umbenennen" klicke
    Dann sehe ich den Dialog "Vorlage umbenennen"
    Wenn ich im Dialog "Name" mit "Fachgruppe Kabel" fülle
    Und ich im Dialog auf "Umbenennen" klicke
    Dann sehe ich die Überschrift "Fachgruppe Kabel"
    Und sehe ich "FGr K Oldenburg" nicht

  Szenario: Gelöschte Vorlage liegt im Papierkorb und lässt sich zurückholen
    Wenn ich auf "Löschen" klicke
    Dann sehe ich die Schaltfläche "Papierkorb (1)"
    Wenn ich auf "Papierkorb (1)" klicke
    Und ich auf "Wiederherstellen" klicke
    Dann sehe ich die Schaltfläche "Einsatz vorbereiten"

  Szenario: Endgültiges Löschen fragt in der App zurück
    Wenn ich auf "Löschen" klicke
    Und ich auf "Papierkorb (1)" klicke
    Und ich auf "Endgültig löschen" klicke
    Dann sehe ich den Dialog "Vorlage endgültig löschen?"
    Wenn ich im Dialog auf "Endgültig löschen" klicke
    Dann sehe ich die Schaltfläche "Papierkorb (1)" nicht

  Szenario: Musterung streicht Abwesende und startet einen frischen Bogen
    Wenn ich auf "Einsatz vorbereiten" klicke
    Dann sehe ich die Überschrift "Personal (3/3)"
    Und sehe ich die Schaltfläche "Einsatz starten · 3 Pers · 1 Fz"
    Wenn ich in der Musterung "Weber" abwähle
    Dann sehe ich die Schaltfläche "Einsatz starten · 2 Pers · 1 Fz"
    Wenn ich auf "Einsatz starten · 2 Pers · 1 Fz" klicke
    Dann sehe ich den Schritt "2. Einsatz"
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Personal (2)"
    Und sehe ich "Weber" nicht

  Szenario: Die Musterung lässt die Vorlage unangetastet
    Wenn ich auf "Einsatz vorbereiten" klicke
    Und ich in der Musterung "Weber" abwähle
    Und ich auf "Einsatz starten · 2 Pers · 1 Fz" klicke
    Und ich auf "‹ Startseite" klicke
    Dann sehe ich den Hinweis "3 Personen"

  Szenario: Musterung abbrechen ändert nichts
    Wenn ich auf "Einsatz vorbereiten" klicke
    Und ich auf "‹ Abbrechen" klicke
    Dann sehe ich die Überschrift "Gespeicherte Vorlagen"
    Und sehe ich die Schaltfläche "Einsatz vorbereiten"
