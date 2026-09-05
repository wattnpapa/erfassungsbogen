# language: de
Funktionalität: Einsatzweg einer Fachgruppe — Vorbereitung, Fahrt, Meldekopf
  Als Gruppenführer einer FGr WP bereite ich den Bogen schon in der Unterkunft
  vor: Einheitstyp wählen, die StAN belegt Sollstärke, Fahrzeuge und
  Funkrufnamen vor. Auf der Fahrt kommen Auftrag und Sofortbedarf dazu, am
  Meldekopf wird der Bogen per QR-Code vom Display abgenommen — auch ohne Netz.

  Grundlage:
    Angenommen ich öffne die App
    Wenn ich auf "Neuen Bogen erstellen" klicke
    Und ich das Feld "Organisation" auf "THW" stelle
    Und ich das Feld "Name (Pflicht)" mit "Oldenburg" fülle
    Und ich in der Vorschlagsliste "Oldenburg (NI)" wähle
    Und ich das Feld "Einheitstyp" auf "FGr WP (B) – Fachgruppe Wasserschaden/Pumpen (B)" stelle

  # StAN FGr WP (B): Stärke -/3/9/12, vier Fahrzeuge (LKW Lbw, MLW IV,
  # Anh SwPu mittel, Anh Plane/Spriegel). Die Vorbelegung ist der Kern der
  # Einsatzvorbereitung — ohne sie tippt der Gruppenführer zwölf leere Karten.
  Szenario: Die StAN-Vorbelegung stellt Sollstärke und Fahrzeuge bereit
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Personal (12)"
    Und sehe ich den Text "0 / 3 / 9 / 12"
    Und sehe ich die Überschrift "Fahrzeuge (4)"

  # Nur die beiden Funkstellen (LKW Lbw → 43, MLW IV → 34) bekommen einen
  # Funkrufnamen; Teileinheit-Kennzahl der FGr WP (B) ist 48 (THW-Taschenkarte).
  # Anhänger sind keine Funkstellen und bleiben ohne.
  Szenario: Die vorbelegten Funkrufnamen tragen Teileinheit- und Fahrzeugkennzahl
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Text "Heros Oldenburg (NI) 48/43"
    Und sehe ich den Text "Heros Oldenburg (NI) 48/34"

  # Der Meldekopf will die ganze Meldekette: OV, Regionalstelle, Landesverband.
  # Die OV-Auswahl füllt beide übergeordneten Ebenen aus der Regionalstruktur.
  Szenario: Der gewählte OV bringt Regionalstelle und Landesverband mit
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "Bremen, Niedersachsen"
    Und sehe ich den Hinweis "OODE"

  # Die Vorbelegung ist ein Startpunkt, kein Diktat: Wer nach dem Ausfüllen den
  # Typ korrigiert, darf dabei nicht die schon angepassten Fahrzeuge und das
  # eingetragene Personal verlieren.
  Szenario: Ein späterer Typwechsel wirft die vorbelegten Daten nicht weg
    Wenn ich das Feld "Einheitstyp" auf "FGr WP (C) – Fachgruppe Wasserschaden/Pumpen (C)" stelle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Fahrzeuge (4)"
    Und sehe ich den Text "Heros Oldenburg (NI) 48/43"
    Und sehe ich die Überschrift "Personal (12)"

  # Die StAN setzt bewusst keine Fahrerlaubnisklassen — vergisst der Bogen
  # sie ganz, findet der Kraftfahrer-Filter am Meldekopf die Einheit nicht.
  # Die Vollständigkeitsprüfung erinnert daran und führt zum Personal-Schritt.
  Szenario: Die Vollständigkeitsprüfung erinnert an den fehlenden Kraftfahrer
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "Fahrzeuge erfasst, aber kein Kraftfahrer"
    Wenn ich auf "Fahrzeuge erfasst, aber kein Kraftfahrer: Bei keiner Person ist eine Fahrerlaubnisklasse eingetragen." klicke
    Dann sehe ich den Schritt "3. Personal"
    Wenn ich das Feld "Fahrerlaubnis" auf "CE" stelle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "Fahrzeuge erfasst, aber kein Kraftfahrer" nicht

  # Auf der Fahrt: Auftrag und der Dieselbedarf der Pumpen — die StAN-Belegung
  # aus der Vorbereitung muss dabei unangetastet bleiben.
  Szenario: Auftrag und Sofortbedarf ergänzen die Vorbereitung, ohne sie zu stören
    Wenn ich zum Schritt "2. Einsatz" wechsle
    Und ich das Feld "Einsatzort / Auftrag" mit "Hochwasser Hunte — Pumpeneinsatz Achterdiek" fülle
    Und ich "Einsatzbeginn" ankreuze
    Und ich zum Schritt "5. Sofortbedarf" wechsle
    Und ich "Sofortbedarf erfassen" ankreuze
    Und ich das Feld "Diesel (l)" mit "400" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Text "Hochwasser Hunte — Pumpeneinsatz Achterdiek"
    Und sehe ich den Text "400 l Diesel / 0 l Benzin / 0 l Gemisch"
    Und sehe ich die Überschrift "Personal (12)"
    Und sehe ich die Überschrift "Fahrzeuge (4)"

  # Die Ankunft: der Meldekopf nimmt den Bogen vom Display ab und führt ihn im
  # Einsatz — mit Stärke, Fahrzeugzahl und dem Dieselbedarf aus dem Bogen.
  Szenario: Die Meldung kommt per QR-Code am Meldekopf an und zählt in den Bedarf
    Wenn ich zum Schritt "5. Sofortbedarf" wechsle
    Und ich "Sofortbedarf erfassen" ankreuze
    Und ich das Feld "Diesel (l)" mit "400" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Und ich mir den angezeigten QR-Code merke
    Und ich auf "Neuer Bogen" klicke
    Und ich im Dialog auf "Verwerfen und neu beginnen" klicke
    Und ich auf "QR-Code scannen…" klicke
    Und ich den gemerkten QR-Code über "QR aus Bild einlesen…" einlese
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg (NI)"
    Wenn ich auf "In Einsatz aufnehmen…" klicke
    Und ich auf "Neuen Einsatz anlegen…" klicke
    Und ich im Dialog "Name" mit "Hochwasser Hunte" fülle
    Und ich im Dialog auf "Einsatz anlegen" klicke
    Dann sehe ich die Überschrift "Einheiten (1)"
    Und sehe ich den Hinweis "Stärke 0 / 3 / 9 / 12"
    Und sehe ich zu "Kraftstoff" den Wert "Diesel 400 l"
    Und sehe ich zu "Fahrzeuge" den Wert "4"

  # Am Bereitstellungsraum gibt es kein WLAN und oft kein Netz: die volle
  # QR-Runde — erzeugen, als Bild abnehmen, einlesen — muss offline laufen.
  # Die bestehenden Offline-Tests decken Start und QR-Erzeugung ab, nicht die
  # Empfängerseite. Der Neustart nach dem Trennen prüft den Kaltstart ohne
  # Netz: die App muss samt nachgeladener Bausteine (jsQR) aus dem Cache
  # hochkommen — der Entwurf aus der Vorbereitung bleibt. Ohne Neuladen
  # mitten in der Sitzung deckt das Szenario „Die PDF entsteht auch ohne Netz
  # und ohne Neuladen" (uebergabe.feature) denselben Weg ab.
  Szenario: Die QR-Runde läuft komplett ohne Netz
    Wenn ich die App vom Netz trenne
    Und ich die Seite neu lade
    Und ich auf "Fortsetzen" klicke
    Dann sehe ich die Überschrift "Gesamtübersicht"
    Und ich mir den angezeigten QR-Code merke
    Und ich auf "Neuer Bogen" klicke
    Und ich im Dialog auf "Verwerfen und neu beginnen" klicke
    Und ich auf "QR-Code scannen…" klicke
    Und ich den gemerkten QR-Code über "QR aus Bild einlesen…" einlese
    Dann sehe ich die Übersicht mit dem Standort "Oldenburg (NI)"
    Und sehe ich die Überschrift "Personal (12)"
    Und sehe ich den Hinweis "Herkunft belegt"
