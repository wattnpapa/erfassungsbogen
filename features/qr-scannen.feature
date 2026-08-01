# language: de
Funktionalität: Bogen per QR-Code einlesen
  Als Meldekopf nehme ich fremde Bögen vom Display des anderen Geräts auf. Der
  Link-Weg (uebergabe.feature) prüft dieselbe Kodierung — nicht aber das Bild:
  Erzeugung als PNG, Dekodierung mit jsQR und der Weg über die Datei-Auswahl
  laufen nur hier durch.

  # Der genaue Fehlertext hängt am Grund (gesperrt, belegt, gar keine Kamera)
  # und damit an der Umgebung — geprüft wird deshalb, was der Nutzer in JEDEM
  # dieser Fälle vorfindet: den Weg über ein Bild und einen zweiten Versuch.
  Szenario: Ohne Kamera bleibt der Weg über ein Bild offen
    Angenommen ich öffne die App
    Wenn ich auf "QR-Code scannen…" klicke
    Dann sehe ich den Dialog "QR-Code scannen"
    Und sehe ich den Hinweis "Ohne Kamera geht es weiter über ein Foto oder einen Screenshot des QR-Codes."
    Und sehe ich den Datei-Knopf "QR aus Bild einlesen…"
    Und sehe ich die Schaltfläche "Kamera erneut versuchen"
    Wenn ich im Dialog "QR-Code scannen" auf "Abbrechen" klicke
    Dann sehe ich den Hinweis "Ohne Kamera geht es weiter über ein Foto oder einen Screenshot des QR-Codes." nicht
    Und sehe ich die Schaltfläche "Neuen Bogen erstellen"

  Szenario: Der angezeigte QR-Code wird als Bild wieder eingelesen
    Angenommen ich öffne einen geteilten Bogen-Link eines alten Bogens
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg - Ni"
    Wenn ich mir den angezeigten QR-Code merke
    Und ich auf "Neuer Bogen" klicke
    Und ich im Dialog auf "Verwerfen und neu beginnen" klicke
    Dann sehe ich die Schaltfläche "Neuen Bogen erstellen"
    Wenn ich auf "QR-Code scannen…" klicke
    Und ich den gemerkten QR-Code über "QR aus Bild einlesen…" einlese
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg - Ni"
    Und sehe ich die Person "Rudolph" in der Personalliste
    Und sehe ich den Hinweis "Empfangen als:"
    Und sehe ich den Hinweis "Herkunft belegt"
