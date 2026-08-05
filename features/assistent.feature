# language: de
Funktionalität: Bogen im Assistenten erfassen
  Als Einsatzkraft möchte ich einen Bogen Schritt für Schritt ausfüllen —
  Einheit, Einsatz, Personal, Fahrzeuge, Sofortbedarf — und am Ende in der
  Gesamtübersicht sehen, was der Meldekopf bekommt.

  Grundlage:
    Angenommen ich öffne die App
    Wenn ich auf "Neuen Bogen erstellen" klicke
    Dann sehe ich den Schritt "1. Einheit"

  Szenario: Der Assistent führt durch alle sechs Schritte
    Dann ist die Schaltfläche "← Zurück" gesperrt
    Wenn ich auf "Weiter →" klicke
    Dann sehe ich den Schritt "2. Einsatz"
    Wenn ich auf "Weiter →" klicke
    Dann sehe ich den Schritt "3. Personal"
    Wenn ich auf "Weiter →" klicke
    Dann sehe ich den Schritt "4. Fahrzeuge"
    Wenn ich auf "Weiter →" klicke
    Dann sehe ich den Schritt "5. Sofortbedarf & Sonstiges"
    Wenn ich auf "Zur Übersicht →" klicke
    Dann sehe ich die Überschrift "Gesamtübersicht"

  Szenario: Zurück führt einen Schritt zurück
    Wenn ich auf "Weiter →" klicke
    Und ich auf "Weiter →" klicke
    Dann sehe ich den Schritt "3. Personal"
    Wenn ich auf "← Zurück" klicke
    Dann sehe ich den Schritt "2. Einsatz"

  Szenario: Die Schrittleiste springt direkt zum Ziel
    Wenn ich zum Schritt "4. Fahrzeuge" wechsle
    Dann sehe ich den Schritt "4. Fahrzeuge"
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Gesamtübersicht"

  Szenario: Einheit einer anderen Organisation erfassen
    Wenn ich das Feld "Organisation" auf "Feuerwehr" stelle
    Und ich das Feld "Organisationsname (optional)" mit "Freiwillige Feuerwehr Wardenburg" fülle
    Und ich das Feld "Einheitstyp" mit "Löschzug" fülle
    Und ich das Feld "Ebene (eigene Einheit)" auf "Gemeinde – Gemeinde/Stadt" stelle
    Und ich das Feld "Name (Pflicht)" mit "Wardenburg" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "Feuerwehr — Freiwillige Feuerwehr Wardenburg"
    Und sehe ich den Hinweis "Löschzug"
    Und sehe ich den Hinweis "Wardenburg"

  Szenario: THW-Ortsverband aus der Vorschlagsliste übernehmen
    Wenn ich das Feld "Organisation" auf "THW" stelle
    Und ich das Feld "Name (Pflicht)" mit "Oldenburg" fülle
    Und ich in der Vorschlagsliste "Oldenburg (NI)" wähle
    Dann steht im Feld "Kürzel" der Wert "OODE"
    Und steht im Feld "Telefon" der Wert "04413401050"

  Szenario: Eine Ebene hinzufügen und wieder entfernen
    Wenn ich das Feld "Organisation" auf "Feuerwehr" stelle
    Und ich auf "+ übergeordnete Ebene" klicke
    Und ich das Feld "Name (Pflicht)" mit "Wardenburg" fülle
    Dann sehe ich die Schaltfläche "✕"
    Wenn ich auf "✕" klicke
    Dann sehe ich die Schaltfläche "✕" nicht

  Szenario: Landesvorlage belegt Einheitstyp, Stärkeplätze und Fahrzeuge vor
    Wenn ich das Feld "Organisation" auf "Feuerwehr" stelle
    Und ich das Feld "Landesvorlage – Bundesland" auf "Niedersachsen" stelle
    Und ich das Feld "Landesvorlage – Einheit" auf "Aufklärungstrupp Luft" stelle
    Dann steht im Feld "Einheitstyp" der Wert "Aufklärungstrupp Luft"
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Personal (3)"
    Und sehe ich die Überschrift "Fahrzeuge (1)"

  Szenario: Landesvorlage aus der Feuerwehrverordnung des Landes steht neben dem Katastrophenschutz
    Wenn ich das Feld "Organisation" auf "Feuerwehr" stelle
    Und ich das Feld "Landesvorlage – Bundesland" auf "Niedersachsen" stelle
    Und ich das Feld "Landesvorlage – Einheit" auf "Gruppe" stelle
    Dann steht im Feld "Einheitstyp" der Wert "Gruppe"
    Wenn ich zum Schritt "6. Übersicht" wechsle
    # Gruppe nach § 2 Abs. 2 Satz 1 Nr. 3 Nds. FwVO: neun Funktionen, ein Löschfahrzeug
    Dann sehe ich die Überschrift "Personal (9)"
    Und sehe ich die Überschrift "Fahrzeuge (1)"

  Szenario: Einsatzdaten landen in der Übersicht
    Wenn ich zum Schritt "2. Einsatz" wechsle
    Und ich das Feld "Einsatzort / Auftrag" mit "Deichverteidigung Elsfleth" fülle
    Und ich "Einsatzbeginn" ankreuze
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Text "Deichverteidigung Elsfleth"
    Und sehe ich "Ort/Auftrag ist noch leer." nicht

  Szenario: Person erfassen und in der Übersicht wiederfinden
    Wenn ich zum Schritt "3. Personal" wechsle
    Und ich auf "+ Person hinzufügen" klicke
    Und ich das Feld "Vorname" mit "Erika" fülle
    Und ich das Feld "Nachname" mit "Musterfrau" fülle
    Und ich das Feld "Stärkerolle (vor Ort)" auf "Führer/in" stelle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Personal (1)"
    Und sehe ich den Text "Musterfrau, Erika"

  Szenario: Person wieder entfernen
    Wenn ich zum Schritt "3. Personal" wechsle
    Und ich auf "+ Person hinzufügen" klicke
    Und ich das Feld "Nachname" mit "Irrtum" fülle
    Und ich auf "Person entfernen" klicke
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Personal (0)"

  # Nicht alle Klassen schließen sich gegenseitig ein: B (Pkw) und A (Krad)
  # brauchen zwei Einträge. Auf der Übersicht steht das wie auf dem
  # Papierbogen als „Kf B+A".
  Szenario: Mehrere Fahrerlaubnisklassen an einer Person erfassen
    Wenn ich zum Schritt "3. Personal" wechsle
    Und ich auf "+ Person hinzufügen" klicke
    Und ich das Feld "Nachname" mit "Krause" fülle
    Und ich das Feld "Fahrerlaubnis" auf "B" stelle
    Und ich auf "+ Klasse" klicke
    Und ich das Feld "Weitere Fahrerlaubnisklasse 1" auf "A" stelle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "Kf B+A"
    Wenn ich zum Schritt "3. Personal" wechsle
    Und ich auf "Fahrerlaubnisklasse A entfernen" klicke
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "Kf B+A" nicht
    Und sehe ich den Hinweis "Kf B"

  Szenario: Fertige Namensliste als Mehrzeilen-Text einfügen
    Wenn ich zum Schritt "3. Personal" wechsle
    Und ich auf "Namen einfügen…" klicke
    Dann sehe ich den Dialog "Namen einfügen"
    Wenn ich im Dialog den Text "Muster, Max\nErika Musterfrau\nJan Jansen" eingebe
    Und ich im Dialog auf "3 Personen übernehmen" klicke
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Personal (3)"
    Und sehe ich den Text "Muster, Max"
    Und sehe ich den Text "Musterfrau, Erika"

  Szenario: Enter in der Schnelleingabe legt die nächste Zeile an
    Wenn ich zum Schritt "3. Personal" wechsle
    Und ich auf "+ Person hinzufügen" klicke
    Und ich "Schnelleingabe (Tabelle)" ankreuze
    Und ich in der Schnelltabelle Zeile 1 auf "Anke" setze
    Und ich in der Schnelltabelle in Zeile 1 die Eingabetaste drücke
    Und ich in der Schnelltabelle Zeile 2 auf "Bernd" setze
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Personal (2)"

  Szenario: Meldekopf-Schnellerfassung meldet nur die Stärke
    Wenn ich zum Schritt "3. Personal" wechsle
    Und ich "Nur Stärke (Meldekopf-Schnellerfassung)" ankreuze
    Und ich das Feld "Führer" mit "1" fülle
    Und ich das Feld "Unterführer" mit "2" fülle
    Und ich das Feld "Mannschaft" mit "9" fülle
    Dann steht im Feld "Gesamt" der Wert "12"
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Text "1 / 2 / 9 / 12"

  Szenario: Fahrzeug mit Kennzeichen erfassen
    Wenn ich zum Schritt "4. Fahrzeuge" wechsle
    Und ich auf "+ Fahrzeug hinzufügen" klicke
    Dann sehe ich den Hinweis "Fahrzeug 1 hat noch kein Kennzeichen."
    Wenn ich das Feld "Fahrzeugtyp" mit "LF 20" fülle
    Und ich das Feld "Kennzeichen" mit "OL-FW 2041" fülle
    Und ich das Feld "Ausstattung nach StAN" auf "ja" stelle
    Dann sehe ich "Fahrzeug 1 hat noch kein Kennzeichen." nicht
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Fahrzeuge (1)"
    Und sehe ich den Text "OL-FW 2041"

  Szenario: Funkrufname mit Kennzahlen am Fahrzeug
    Wenn ich zum Schritt "4. Fahrzeuge" wechsle
    Und ich auf "+ Fahrzeug hinzufügen" klicke
    Und ich "Funkrufname" ankreuze
    Und ich das Feld "Kennzahlen (z. B. 18/13)" mit "18/13" fülle
    Dann steht im Feld "Kennzahlen (z. B. 18/13)" der Wert "18/13"

  Szenario: Fahrzeug wieder entfernen
    Wenn ich zum Schritt "4. Fahrzeuge" wechsle
    Und ich auf "+ Fahrzeug hinzufügen" klicke
    Und ich auf "Fahrzeug entfernen" klicke
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Fahrzeuge (0)"

  Szenario: Sofortbedarf und Freitext erscheinen in der Übersicht
    Wenn ich zum Schritt "5. Sofortbedarf" wechsle
    Und ich "Sofortbedarf erfassen" ankreuze
    Und ich das Feld "Diesel (l)" mit "120" fülle
    Und ich "Unterbringung" ankreuze
    Und ich das Feld "Sonstiges (Freitext)" mit "Kettensäge defekt" fülle
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Text "120 l Diesel / 0 l Benzin / 0 l Gemisch"
    Und sehe ich den Text "Kettensäge defekt"

  Szenario: Die Vollständigkeitsprüfung führt zum offenen Punkt
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "offene Punkte"
    Und sehe ich den Hinweis "Stärke ist 0 — es ist noch kein Personal erfasst."
    Wenn ich auf "Stärke ist 0 — es ist noch kein Personal erfasst." klicke
    Dann sehe ich den Schritt "3. Personal"

  Szenario: Der Entwurf übersteht einen Neustart der App
    Wenn ich das Feld "Organisation" auf "Feuerwehr" stelle
    Und ich das Feld "Name (Pflicht)" mit "Wardenburg" fülle
    Und ich die Seite neu lade
    Dann sehe ich den Hinweis "Entwurf vom"
    Und sehe ich die Schaltfläche "Fortsetzen"
    Wenn ich auf "Fortsetzen" klicke
    Dann sehe ich die Überschrift "Gesamtübersicht"
    Wenn ich zum Schritt "1. Einheit" wechsle
    Dann steht im Feld "Name (Pflicht)" der Wert "Wardenburg"
