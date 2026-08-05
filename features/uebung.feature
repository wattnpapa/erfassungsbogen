# language: de
Funktionalität: Übungs-Kennzeichnung des Bogens
  Ein Übungsbogen darf niemals als echte Lage durchgehen. Die Kennzeichnung
  hängt am Bogen (nicht an einem Geräte-Modus) und reist im QR/Link mit —
  der Störer erscheint darum auch auf dem empfangenden Gerät, und in der
  Einsatz-Sammlung bleibt der Bogen neben echten Meldungen markiert.

  Grundlage:
    Angenommen ich öffne die App
    Wenn ich auf "Neuen Bogen erstellen" klicke
    Und ich das Feld "Name (Pflicht)" mit "Musterhausen" fülle
    Und ich zum Schritt "2. Einsatz" wechsle
    Und ich "Dies ist eine Übung" ankreuze
    Dann sehe ich den Hinweis "Dieser Bogen ist als Übung gekennzeichnet"

  Szenario: Der Störer steht auf jedem Schritt des Assistenten
    Wenn ich zum Schritt "3. Personal" wechsle
    Dann sehe ich den Hinweis "Dieser Bogen ist als Übung gekennzeichnet"
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich den Hinweis "Dieser Bogen ist als Übung gekennzeichnet"

  Szenario: Haken raus nimmt die Kennzeichnung wieder weg
    Wenn ich "Dies ist eine Übung" abwähle
    Dann sehe ich den Hinweis "Dieser Bogen ist als Übung gekennzeichnet" nicht

  # Künstliche Personendaten gibt es nur im Übungsbogen — im echten Einsatz
  # existiert der Weg gar nicht erst. Geprüft wird beides: dass der Generator
  # im Übungsbogen Personen liefert und dass er ohne Haken verschwindet.
  Szenario: Beispielpersonen füllen den Übungsbogen
    Wenn ich zum Schritt "3. Personal" wechsle
    Und ich auf "Namen einfügen…" klicke
    Dann sehe ich die Überschrift "Beispielnamen (Übung)"
    Wenn ich das Feld "Anzahl" mit "5" fülle
    Und ich auf "Beispielpersonen einfügen" klicke
    Und ich zum Schritt "6. Übersicht" wechsle
    Dann sehe ich die Überschrift "Personal (5)"

  Szenario: Ohne Übungs-Haken gibt es keine Beispielpersonen
    Wenn ich "Dies ist eine Übung" abwähle
    Und ich zum Schritt "3. Personal" wechsle
    Und ich auf "Namen einfügen…" klicke
    Dann sehe ich die Schaltfläche "Beispielpersonen einfügen" nicht

  # Der eigentliche Sinn der Kennzeichnung: sie erreicht das nächste Gerät.
  # Ein Meldekopf, der einen Übungsbogen scannt, sieht den Störer — auch wenn
  # seine eigene App nie in einem „Übungsmodus" war.
  Szenario: Die Übung reist im Link mit auf das nächste Gerät
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Und ich auf "Bogen übergeben…" klicke
    Und ich im Dialog auf "Link teilen" klicke
    Und ich den Link aus der Zwischenablage öffne
    Dann sehe ich die Übersicht mit dem Standort "Musterhausen"
    Und sehe ich den Hinweis "Dieser Bogen ist als Übung gekennzeichnet"

  Szenario: In der Einsatz-Sammlung bleibt der Übungsbogen markiert
    Wenn ich zum Schritt "6. Übersicht" wechsle
    Und ich auf "In Einsatz aufnehmen…" klicke
    Und ich auf "Neuen Einsatz anlegen…" klicke
    Und ich im Dialog "Name" mit "Stabsrahmenübung Küste" fülle
    Und ich im Dialog auf "Einsatz anlegen" klicke
    Dann sehe ich die Überschrift "Einheiten (1)"
    Und sehe ich den Text "ÜBUNG"
