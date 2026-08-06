# language: de
Funktionalität: Erfassungsbogen erstellen und offline transportieren
  Als Einsatzkraft möchte ich einen Bogen digital anlegen und per geteiltem
  Link (QR-Code) an den Meldekopf übertragen — offline und über App-Versionen
  hinweg lesbar.

  Szenario: Startseite bietet die Grundaktionen an
    Angenommen ich öffne die App
    Dann sehe ich die Überschrift "Digitaler Einheiten-Erfassungsbogen"
    Und sehe ich die Schaltfläche "Neuen Bogen erstellen"

  Szenario: Neuen Bogen beginnen führt in den Assistenten
    Angenommen ich öffne die App
    Wenn ich auf "Neuen Bogen erstellen" klicke
    Dann sehe ich den Schritt "1. Einheit"

  # Der Meldekopf-Weg der Startseite: „Einheit schnell erfassen" startet den
  # Assistenten direkt in der Nur-Stärke-Erfassung, ohne Umweg über ein Radio
  # in Schritt 3.
  Szenario: Meldekopf-Schnellerfassung startet einen reinen Stärke-Bogen
    Angenommen ich öffne die App
    Wenn ich auf "Einheit schnell erfassen (nur Stärke)…" klicke
    Dann sehe ich den Schritt "1. Einheit"
    Wenn ich zum Schritt "3. Personal" wechsle
    Dann ist "Nur Stärke (Meldekopf-Schnellerfassung)" ausgewählt

  Szenario: Geteilter Link eines alten Bogens wird geladen und migriert
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg - Ni"
    Und sehe ich die Organisation "THW"
    Und sehe ich die Person "Rudolph" in der Personalliste
