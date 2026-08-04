# language: de
Funktionalität: Einsatz-Sammlung führen (Meldekopf)
  Als Meldekopf sammle ich fremde Bögen unter einem Einsatz, sehe die Summen
  über alle anwesenden Einheiten, ordne Züge zu, verfolge Folgemeldungen in der
  Historie und gebe die Sammlung als PDF oder CSV weiter.

  Grundlage:
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Wenn ich auf "In Einsatz aufnehmen…" klicke
    Und ich auf "Neuen Einsatz anlegen…" klicke
    Und ich im Dialog "Name" mit "Hochwasser Weser" fülle
    Und ich im Dialog auf "Einsatz anlegen" klicke
    Dann sehe ich die Überschrift "Hochwasser Weser"
    Und sehe ich die Überschrift "Einheiten (1)"

  Szenario: Die Sammlung summiert Stärke und Bedarf über alle Einheiten
    Dann sehe ich die Überschrift "Bedarf (anwesende Einheiten)"
    Und sehe ich den Hinweis "Verpflegung:"
    Und sehe ich den Hinweis "Kraftstoff: Diesel"
    Und sehe ich den Hinweis "Fahrzeuge: 1"

  Szenario: Die Vollansicht einer gemeldeten Einheit aufklappen
    Wenn ich auf "Details" klicke
    Dann sehe ich die Überschrift "Zugehörigkeit"
    Und sehe ich den Hinweis "Rudolph"
    Wenn ich auf "Details schließen" klicke
    Dann sehe ich "Zugehörigkeit" nicht

  Szenario: Abgerückte Einheit zählt nicht mehr in die Summe
    Wenn ich auf "Abrücken" klicke
    Dann sehe ich die Schaltfläche "Als anwesend"
    Und sehe ich den Hinweis "abgerückt"
    Wenn ich auf "Als anwesend" klicke
    Dann sehe ich die Schaltfläche "Abrücken"

  Szenario: Einheit einem Zug zuordnen
    Wenn ich auf "Zug zuordnen" klicke
    Und ich das Feld mit dem Platzhalter "z. B. 2. Zug" mit "2. Zug" fülle
    Und ich auf "Speichern" klicke
    Dann sehe ich die Schaltfläche "Zug ändern"
    Und sehe ich den Hinweis "2. Zug"

  Szenario: Zug-Zuordnung abbrechen ändert nichts
    Wenn ich auf "Zug zuordnen" klicke
    Und ich das Feld mit dem Platzhalter "z. B. 2. Zug" mit "3. Zug" fülle
    Und ich auf "Abbrechen" klicke
    Dann sehe ich die Schaltfläche "Zug zuordnen"

  Szenario: Bogen aufteilen — der Fachberater steht plötzlich einzeln
    Wenn ich auf "Aufteilen…" klicke
    Dann sehe ich den Hinweis "Der abgeteilte Teil braucht eine Bezeichnung."
    Wenn ich das Feld "Bezeichnung des abgeteilten Teils" mit "Fachberater" fülle
    Und ich "Rudolph, Johannes" ankreuze
    Und ich auf "Aufteilen" klicke
    Dann sehe ich die Überschrift "Einheiten (2)"
    Und sehe ich den Hinweis "Fachberater"
    Und sehe ich den Hinweis "abgeteilt aus"
    # Die Stärke verteilt sich, sie verschwindet nicht: aus 1 / 0 / 2 / 3 werden
    # zwei Meldungen, die zusammen wieder 3 ergeben.
    Und sehe ich den Hinweis "Stärke 1 / 0 / 0 / 1"
    Und sehe ich den Hinweis "Stärke 0 / 0 / 2 / 2"

  Szenario: Aufgeteilte Teile wieder zusammenführen — der Zug sammelt sich
    Wenn ich auf "Aufteilen…" klicke
    Und ich das Feld "Bezeichnung des abgeteilten Teils" mit "Fachberater" fülle
    Und ich "Rudolph, Johannes" ankreuze
    Und ich auf "Aufteilen" klicke
    Dann sehe ich die Überschrift "Einheiten (2)"
    # Zusammenführen wird erst angeboten, wenn es einen zweiten Teil gibt — und
    # nur zeilenweise: nach der Aufteilung trägt jede Zeile den Knopf.
    Wenn ich bei der Einheit "Fachberater" auf "Zusammenführen…" klicke
    Und ich das Feld "Bezeichnung danach" mit "" fülle
    Und ich auf "Zusammenführen" klicke
    # Die Einheit steht wieder mit ihrer vollen Stärke da, nichts doppelt.
    Dann sehe ich den Hinweis "Stärke 1 / 0 / 2 / 3"
    Und sehe ich den Hinweis "zusammengeführt"
    Und sehe ich den Hinweis "aufgegangen in"

  Szenario: Ohne zweiten Teil gibt es nichts zusammenzuführen
    Dann sehe ich die Schaltfläche "Zusammenführen…" nicht

  Szenario: Aufteilen abbrechen ändert nichts
    Wenn ich auf "Aufteilen…" klicke
    Und ich das Feld "Bezeichnung des abgeteilten Teils" mit "Fachberater" fülle
    Und ich "Rudolph, Johannes" ankreuze
    Und ich auf "Abbrechen" klicke
    Dann sehe ich die Überschrift "Einheiten (1)"

  Szenario: Meldung entfernen fragt in der App zurück
    Wenn ich auf "Entfernen" klicke
    Dann sehe ich den Dialog "Meldung entfernen?"
    Wenn ich im Dialog auf "Meldung entfernen" klicke
    Dann sehe ich die Überschrift "Einheiten (0)"
    Und sehe ich den Hinweis "Noch keine Meldung."

  Szenario: Folgemeldung derselben Einheit wandert in die Historie
    Wenn ich denselben Bogen-Link erneut öffne
    Und ich zum Schritt "5. Sofortbedarf" wechsle
    Und ich das Feld "Sonstiges (Freitext)" mit "Ablösung angefordert" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Und ich auf "In Einsatz aufnehmen…" klicke
    Und ich auf "Hochwasser Weser" klicke
    Dann sehe ich den Dialog "Einheit ist bereits gemeldet"
    Wenn ich im Dialog auf "Als neue Fassung anhängen" klicke
    Dann sehe ich die Überschrift "Einheiten (1)"
    Und sehe ich die Schaltfläche "Historie (2)"
    Wenn ich auf "Änderungen" klicke
    Dann sehe ich den Hinweis "Auftrag / Sonstiges"
    Und sehe ich den Hinweis "Ablösung angefordert"

  Szenario: Dieselbe Einheit lässt sich getrennt weiterführen
    Wenn ich denselben Bogen-Link erneut öffne
    Und ich zum Schritt "5. Sofortbedarf" wechsle
    Und ich das Feld "Sonstiges (Freitext)" mit "zweiter Trupp" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Und ich auf "In Einsatz aufnehmen…" klicke
    Und ich auf "Hochwasser Weser" klicke
    Und ich im Dialog auf "Als eigene Einheit führen" klicke
    Dann sehe ich die Überschrift "Einheiten (2)"

  Szenario: Einheit manuell in den Einsatz erfassen
    Wenn ich auf "Einheit manuell erfassen…" klicke
    Dann sehe ich den Schritt "1. Einheit"
    Wenn ich das Feld "Organisation" auf "Feuerwehr" stelle
    Und ich das Feld "Name (Pflicht)" mit "Wardenburg" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Schaltfläche "In Einsatz übernehmen"
    Wenn ich auf "In Einsatz übernehmen" klicke
    Dann sehe ich die Überschrift "Hochwasser Weser"
    Und sehe ich die Überschrift "Einheiten (2)"

  Szenario: Sammel-PDF bündelt alle Bögen in einer Datei
    Wenn ich auf "Sammel-PDF (alle Bögen)" klicke und eine Datei erhalte
    Dann heißt die heruntergeladene Datei wie "eeb-einsatz-*.pdf"

  Szenario: CSV-Übersicht für die Lagekarte
    Wenn ich auf "Übersicht als CSV" klicke und eine Datei erhalte
    Dann heißt die heruntergeladene Datei wie "eeb-einsatz-*.csv"

  Szenario: CSV mit allen Daten aller Bögen für die Auswertung
    Wenn ich auf "Alle Daten als CSV" klicke und eine Datei erhalte
    Dann heißt die heruntergeladene Datei wie "eeb-einsatz-*-alle-daten.csv"

  Szenario: Gelöschter Einsatz liegt im Papierkorb und kommt zurück
    Wenn ich auf "Einsatz löschen" klicke
    Dann sehe ich die Schaltfläche "Neuen Bogen erstellen"
    Und sehe ich die Schaltfläche "Papierkorb (1)"
    Wenn ich auf "Papierkorb (1)" klicke
    Und ich auf "Wiederherstellen" klicke
    Dann sehe ich die Schaltfläche "Öffnen"

  Szenario: Einsatz endgültig löschen fragt in der App zurück
    Wenn ich auf "Einsatz löschen" klicke
    Und ich auf "Papierkorb (1)" klicke
    Und ich auf "Endgültig löschen" klicke
    Dann sehe ich den Dialog "Einsatz endgültig löschen?"
    Und sehe ich den Hinweis "Darin stecken fremde Personendaten"
    Wenn ich im Dialog auf "Endgültig löschen" klicke
    Dann sehe ich die Schaltfläche "Papierkorb (1)" nicht

  Szenario: Bei einer einzigen Meldung bleibt die Filterleiste weg
    Dann sehe ich "Suche" nicht

  # Am Handy fiel auf, dass die Leiste erst spät auftauchte und deshalb wie eine
  # fehlende Funktion aussah — ab der zweiten Meldung steht sie da.
  Szenario: Mit der zweiten Meldung erscheint die Filterleiste
    Wenn ich die Einheit "DLRG" "Wardenburg" manuell in den Einsatz aufnehme
    Dann sehe ich die Überschrift "Einheiten (2)"
    Und sehe ich den Text "Suche"

  Szenario: Die Sammel-PDF bringt die ganze Sammlung auf ein leeres Gerät
    Wenn ich auf "Sammel-PDF (alle Bögen)" klicke und eine Datei erhalte
    Und ich auf "‹ Einsätze" klicke
    Und ich auf "Alle Daten löschen" klicke
    Und ich im Dialog "Ja, alle lokalen Daten dieser App endgültig löschen" ankreuze
    Und ich im Dialog auf "Endgültig löschen" klicke
    Und ich im Dialog auf "Neu starten" klicke
    Dann sehe ich "Hochwasser Weser" nicht
    Wenn ich die zuletzt erhaltene Datei über "Einsatz importieren…" einlese
    Dann sehe ich die Überschrift "Hochwasser Weser"
    Und sehe ich die Überschrift "Einheiten (1)"
    Und führt die Einheitenliste "THW" an Stelle 1

  Szenario: Zurück zur Startseite listet den Einsatz mit seinen Summen
    Wenn ich auf "‹ Einsätze" klicke
    Dann sehe ich die Überschrift "Einsatz-Sammlung (Meldekopf)"
    Und sehe ich die Überschrift "Hochwasser Weser"
    Und sehe ich den Hinweis "1 Einheit(en) anwesend"
