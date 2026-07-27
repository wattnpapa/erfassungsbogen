# language: de
Funktionalität: Einheitenliste durchsuchen und sortieren
  Bei einer Großlage stehen 30–50 Einheiten in der Sammlung. Wer dann eine
  bestimmte sucht, braucht Filter und Sortierung — und darf sich dabei nicht
  aus Versehen die Summen des Einsatzes verstellen: Die Kopfleiste zählt
  weiterhin alle anwesenden Einheiten, nicht nur die angezeigten.

  Grundlage:
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "In Einsatz aufnehmen…" klicke
    Und ich auf "Neuen Einsatz anlegen…" klicke
    Und ich im Dialog "Name" mit "Hochwasser Weser" fülle
    Und ich im Dialog auf "Einsatz anlegen" klicke
    Und ich die Einheit "DLRG" "Wardenburg" manuell in den Einsatz aufnehme
    Und ich die Einheit "Feuerwehr" "Aschhausen" manuell in den Einsatz aufnehme
    Dann sehe ich die Überschrift "Einheiten (3)"

  Szenario: Ab drei Meldungen steht die Filterleiste bereit
    Dann sehe ich den Text "Suche"
    Und führt die Einheitenliste genau 3 Einheiten
    Und führt die Einheitenliste "DLRG Wardenburg" an Stelle 1
    Und führt die Einheitenliste "Feuerwehr Aschhausen" an Stelle 2
    Und führt die Einheitenliste "THW" an Stelle 3

  Szenario: Die Suche grenzt auf die gesuchte Einheit ein
    Wenn ich das Feld "Suche" mit "wardenburg" fülle
    Dann sehe ich die Überschrift "Einheiten (1 von 3)"
    Und führt die Einheitenliste genau 1 Einheiten
    Und führt die Einheitenliste "DLRG Wardenburg" an Stelle 1
    Und führt die Einheitenliste "THW" nicht

  Szenario: Gesucht wird auch über die Organisation
    Wenn ich das Feld "Suche" mit "feuerwehr" fülle
    Dann führt die Einheitenliste genau 1 Einheiten
    Und führt die Einheitenliste "Feuerwehr Aschhausen" an Stelle 1

  Szenario: Die Suche lässt die Summen des Einsatzes unberührt
    Wenn ich das Feld "Suche" mit "wardenburg" fülle
    Dann führt die Einheitenliste genau 1 Einheiten
    Und meldet die Kopfleiste 3 Einheiten

  Szenario: Ohne Treffer führt ein Knopf zurück zur vollen Liste
    Wenn ich das Feld "Suche" mit "Hubschrauber" fülle
    Dann führt die Einheitenliste genau 0 Einheiten
    Und sehe ich den Hinweis "Keine Einheit passt zu"
    Wenn ich auf "Suche löschen" klicke
    Dann führt die Einheitenliste genau 3 Einheiten

  Szenario: Nach Eintreffzeit steht die jüngste Meldung oben
    Wenn ich das Feld "Sortierung" auf "Eintreffzeit (neueste zuerst)" stelle
    Dann führt die Einheitenliste "Feuerwehr Aschhausen" an Stelle 1
    Und führt die Einheitenliste "THW" an Stelle 3
