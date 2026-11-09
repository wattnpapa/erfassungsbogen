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

  # Gesammelt wird seit 2026-11-09 in der eigenen Meldekopf-App: Der zweite
  # Weg der Startseite verweist dorthin.
  Szenario: Der Meldekopf-Weg der Startseite führt in die Meldekopf-App
    Angenommen ich öffne die App
    Dann sehe ich die Überschrift "Bögen sammeln (Meldekopf)"
    Und sehe ich den Hinweis "Für Meldeköpfe, Bereitstellungsräume und Zugführer gibt es eine eigene App"

  Szenario: Geteilter Link eines alten Bogens wird geladen und migriert
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg - Ni"
    Und sehe ich die Organisation "THW"
    Und sehe ich die Person "Rudolph" in der Personalliste
