# language: de
Funktionalität: Erfassungsbogen erstellen und offline transportieren
  Als Einsatzkraft möchte ich einen Bogen digital anlegen und per geteiltem
  Link (QR-Code) an den Meldekopf übertragen — offline und über App-Versionen
  hinweg lesbar.

  Szenario: Startseite bietet die Grundaktionen an
    Angenommen ich öffne die App
    Dann sehe ich die Überschrift "Einheiten-Erfassungsbogen"
    Und sehe ich die Schaltfläche "Neuen Bogen erstellen"

  Szenario: Neuen Bogen beginnen führt in den Assistenten
    Angenommen ich öffne die App
    Wenn ich auf "Neuen Bogen erstellen" klicke
    Dann sehe ich den Schritt "1. Einheit"

  Szenario: Geteilter Link eines alten Bogens wird geladen und migriert
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Dann sehe ich die Übersicht mit der Einheit "OV Oldenburg - Ni"
    Und sehe ich die Organisation "THW"
    Und sehe ich die Person "Rudolph" in der Personalliste
