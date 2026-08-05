# language: de
Funktionalität: Einheitenliste durchsuchen, filtern und sortieren
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

  Szenario: Ab der zweiten Meldung steht die Filterleiste bereit
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

  # Wunsch aus Cuxhaven (August 2026): bei größeren Lagen die vorhandenen
  # Einsatzkräfte nach Qualifikation finden. Der geteilte Bogen bringt eine
  # Person mit der Funktion SGL mit, die beiden manuell erfassten Einheiten
  # führen kein Personal.
  Szenario: Der Qualifikationsfilter nennt die passenden Einsatzkräfte
    Wenn ich das Feld "Qualifikation" auf "SGL – Sachgebietsleiter/in (1)" stelle
    Dann sehe ich die Überschrift "Einheiten (1 von 3)"
    Und führt die Einheitenliste genau 1 Einheiten
    Und sehe ich den Text "1× SGL: Johannes Rudolph"
    Und sehe ich den Hinweis "1 Einsatzkraft mit „SGL – Sachgebietsleiter/in“"
    Und sehe ich den Hinweis "2 Meldungen führen keine Personen"

  Szenario: Der Qualifikationsfilter lässt die Summen des Einsatzes unberührt
    Wenn ich das Feld "Qualifikation" auf "SGL – Sachgebietsleiter/in (1)" stelle
    Dann führt die Einheitenliste genau 1 Einheiten
    Und meldet die Kopfleiste 3 Einheiten
    Wenn ich auf "Filter aufheben" klicke
    Dann führt die Einheitenliste genau 3 Einheiten

  Szenario: Suche und Qualifikationsfilter greifen zusammen
    Wenn ich das Feld "Qualifikation" auf "SGL – Sachgebietsleiter/in (1)" stelle
    Und ich das Feld "Suche" mit "wardenburg" fülle
    Dann führt die Einheitenliste genau 0 Einheiten
    Und sehe ich den Hinweis "Keine Einheit passt zu"

  # „Welche Einheit hat mir Kraftfahrer gemeldet?" ist beim Besetzen eines
  # Fahrzeugs dieselbe Frage wie die nach AGT oder SGL. Der geteilte Bogen
  # bringt zwei Fahrer mit: Johannes Rudolph (Klasse C) und Tom Fischer
  # (Klasse B); die beiden manuell erfassten Einheiten führen kein Personal.
  Szenario: Der Kraftfahrer-Filter findet die Einheit mit Fahrern
    Wenn ich das Feld "Qualifikation" auf "Kf – Kraftfahrer/in (beliebige Klasse) (2)" stelle
    Dann sehe ich die Überschrift "Einheiten (1 von 3)"
    Und führt die Einheitenliste genau 1 Einheiten
    Und sehe ich den Hinweis "Kf: Johannes Rudolph, Tom Fischer"
    Und sehe ich den Hinweis "2 Einsatzkräfte mit „Kf – Kraftfahrer/in (beliebige Klasse)“"

  # Der Meldekopf fragt nach dem Fahrzeug, das er besetzen will, nicht nach dem
  # Kartenaufdruck: wer C gemeldet hat, darf auch den Klasse-B-Transporter
  # fahren (§ 6 Abs. 3 FeV) — und muss darum als Treffer für „Kf B" erscheinen.
  Szenario: Wer Klasse C gemeldet hat, zählt auch als Kraftfahrer für Klasse B
    Wenn ich das Feld "Qualifikation" auf "Kf B – Fahrerlaubnisklasse B (2)" stelle
    Dann sehe ich den Hinweis "Kf B: Johannes Rudolph, Tom Fischer"
    Wenn ich das Feld "Qualifikation" auf "Kf C – Fahrerlaubnisklasse C (1)" stelle
    Dann sehe ich den Hinweis "Kf C: Johannes Rudolph"
    Und sehe ich den Hinweis "Tom Fischer" nicht

  # Die volle Runde des Zugtrupps: LKW-Fahrer wird mit dem Bogen erfasst und
  # ist danach im Einsatz über seine Klasse auffindbar.
  Szenario: Ein frisch erfasster CE-Fahrer ist sofort über den Filter auffindbar
    Wenn ich auf "Einheit manuell erfassen…" klicke
    Dann sehe ich den Schritt "1. Einheit"
    Wenn ich das Feld "Organisation" auf "Feuerwehr" stelle
    Und ich das Feld "Name (Pflicht)" mit "Hude" fülle
    Und ich zum Schritt "3. Personal" wechsle
    Und ich auf "+ Person hinzufügen" klicke
    Und ich das Feld "Nachname" mit "Tabken" fülle
    Und ich das Feld "Fahrerlaubnis" auf "CE" stelle
    Und ich zum Schritt "6. Übersicht" wechsle
    Und ich auf "In Einsatz übernehmen" klicke
    Dann sehe ich die Überschrift "Einheiten (4)"
    Wenn ich das Feld "Qualifikation" auf "Kf CE – Fahrerlaubnisklasse CE (1)" stelle
    Dann sehe ich die Überschrift "Einheiten (1 von 4)"
    Und führt die Einheitenliste "Feuerwehr Hude" an Stelle 1
    Und führt die Einheitenliste "THW" nicht

  Szenario: Nach Eintreffzeit steht die jüngste Meldung oben
    Wenn ich das Feld "Sortierung" auf "Eintreffzeit (neueste zuerst)" stelle
    Dann führt die Einheitenliste "Feuerwehr Aschhausen" an Stelle 1
    Und führt die Einheitenliste "THW" an Stelle 3
