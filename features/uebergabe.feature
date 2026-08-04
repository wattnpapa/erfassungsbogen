# language: de
Funktionalität: Bogen übergeben — QR, PDF, Link, CSV
  Als Einsatzkraft möchte ich den fertigen Bogen weitergeben können: als
  QR-Code vom Display, als PDF im Papier-Layout oder als Link. Alle drei Wege
  tragen denselben signierten Inhalt. Die CSV-Tabelle steht daneben — sie ist
  zum Auswerten da, nicht zum Zurücklesen.

  Grundlage:
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg - Ni"

  Szenario: Die Übersicht erzeugt den QR-Code und nennt den Geräteschlüssel
    Dann sehe ich die Überschrift "QR-Code (Offline-Transport)"
    Und sehe ich das Bild "EEB2-QR-Code"
    Und sehe ich den Hinweis "Signiert (EEB2C"
    Und sehe ich "Schlüssel wird erzeugt…" nicht

  Szenario: Der Übergabe-Dialog bündelt alle Wege
    Wenn ich auf "Bogen übergeben…" klicke
    Dann sehe ich den Dialog "Bogen übergeben"
    Und sehe ich die Schaltfläche "QR-Code im Vollbild zeigen"
    Und sehe ich die Schaltfläche "PDF erzeugen"
    Und sehe ich die Schaltfläche "Link teilen"
    Und sehe ich die Schaltfläche "Als CSV (Tabelle)"
    Wenn ich im Dialog auf "Schließen" klicke
    Dann ist kein Dialog offen

  Szenario: QR-Code im Vollbild zeigen und wieder schließen
    Wenn ich auf "Bogen übergeben…" klicke
    Und ich im Dialog auf "QR-Code im Vollbild zeigen" klicke
    Dann sehe ich den Dialog "QR-Code im Vollbild"
    Und sehe ich den Hinweis "Der Bildschirm bleibt an"
    Wenn ich auf "Schließen" klicke
    Dann sehe ich "Der Bildschirm bleibt an" nicht

  Szenario: PDF-Vorschau zeigt den fertigen Bogen im Papier-Layout
    Wenn ich auf "Vorschau anzeigen" klicke und die PDF-Vorschau erscheint
    Dann sehe ich die Schaltfläche "Vorschau aktualisieren"

  Szenario: PDF erzeugen liefert eine Datei im Papier-Layout
    Wenn ich auf "Bogen übergeben…" klicke
    Und ich auf "PDF erzeugen" klicke und eine Datei erhalte
    Dann heißt die heruntergeladene Datei wie "eeb-*.pdf"

  Szenario: CSV liefert den Bogen als Tabelle für die Auswertung
    Wenn ich auf "Bogen übergeben…" klicke
    Und ich auf "Als CSV (Tabelle)" klicke und eine Datei erhalte
    Dann heißt die heruntergeladene Datei wie "eeb-*.csv"

  Szenario: Link teilen legt den Bogen-Link in die Zwischenablage
    Wenn ich auf "Bogen übergeben…" klicke
    Und ich im Dialog auf "Link teilen" klicke
    Dann liegt der Bogen-Link in der Zwischenablage

  Szenario: Ein alter, unsignierter Bogen behauptet keine Herkunft
    Dann sehe ich den Hinweis "Empfangen als:" nicht

  Szenario: Die Runde über den Link belegt Herkunft und wird gegengezeichnet
    Wenn ich zum Schritt "5. Sofortbedarf" wechsle
    Und ich das Feld "Sonstiges (Freitext)" mit "eigener Stand" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Und ich auf "Bogen übergeben…" klicke
    Und ich im Dialog auf "Link teilen" klicke
    Und ich den Link aus der Zwischenablage öffne
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg - Ni"
    Und sehe ich den Text "eigener Stand"
    Und sehe ich den Hinweis "Empfangen als:"
    Und sehe ich den Hinweis "Herkunft belegt"
    Und sehe ich den Hinweis "Unveränderter Bogen von fremder Stelle:"
    Und sehe ich den Hinweis "Gegengezeichnet"

  Szenario: Bearbeiten macht den empfangenen Bogen wieder zum eigenen
    Wenn ich zum Schritt "5. Sofortbedarf" wechsle
    Und ich das Feld "Sonstiges (Freitext)" mit "eigener Stand" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Und ich auf "Bogen übergeben…" klicke
    Und ich im Dialog auf "Link teilen" klicke
    Und ich den Link aus der Zwischenablage öffne
    Dann sehe ich den Hinweis "Unveränderter Bogen von fremder Stelle:"
    Wenn ich zum Schritt "5. Sofortbedarf" wechsle
    Und ich das Feld "Sonstiges (Freitext)" mit "nachträglich ergänzt" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "Unveränderter Bogen von fremder Stelle:" nicht
    Und sehe ich den Hinweis "Signiert mit dem Geräteschlüssel"

  Szenario: Der hinterlegte Absender reist mit zum Empfänger
    Wenn ich auf "‹ Startseite" klicke
    Und ich das Feld "Name" mit "Max Mustermann" fülle
    Und ich das Feld "Telefon" mit "0170 1234567" fülle
    Und ich auf "Übernehmen" klicke
    Und ich auf "Fortsetzen" klicke
    Und ich auf "Bogen übergeben…" klicke
    Und ich im Dialog auf "Link teilen" klicke
    Und ich den Link aus der Zwischenablage öffne
    Dann sehe ich den Hinweis "Empfangen als:"
    Und sehe ich den Hinweis "Eigene Angabe des Absenders:"
    Und sehe ich den Hinweis "Max Mustermann"

  Szenario: Der Bogen lässt sich aus der Übersicht als Vorlage sichern
    Wenn ich auf "Als Vorlage speichern" klicke
    Dann sehe ich den Dialog "Als Vorlage speichern"
    Wenn ich im Dialog "Name der Vorlage" mit "FGr K Oldenburg" fülle
    Und ich im Dialog auf "Vorlage speichern" klicke
    # Die Rückmeldung steht dort, wo gespeichert wurde — der Weg zur Startseite
    # räumt sie wieder weg. Erst darauf warten, dann weitergehen: sonst hinge das
    # Szenario davon ab, was der Browser zuerst abarbeitet.
    Dann sehe ich den Hinweis 'Als Vorlage „FGr K Oldenburg" gespeichert.'
    Wenn ich auf "‹ Startseite" klicke
    Dann sehe ich die Überschrift "FGr K Oldenburg"
