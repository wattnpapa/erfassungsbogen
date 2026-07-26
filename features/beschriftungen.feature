# language: de
Funktionalität: Felder sind mit ihrem Namen beschriftet
  Als Einsatzkraft, die den Bogen mit Vorlesesoftware bedient, möchte ich zu
  jedem Feld nur seinen Namen hören — nicht den Text seiner Auswahlmöglichkeiten.

  Szenario: Auswahllisten heißen wie ihr Feld, nicht wie ihre Optionen
    Angenommen ich öffne die App
    Wenn ich auf "Neuen Bogen erstellen" klicke
    Dann heißt die Auswahlliste genau "Organisation"
    Und heißt die Auswahlliste genau "Einheitstyp"

  Szenario: Auch Auswahllisten in Unterformularen heißen nur nach ihrem Feld
    Angenommen ich öffne die App
    Wenn ich auf "Neuen Bogen erstellen" klicke
    Und ich zum Schritt "3. Personal" wechsle
    Und ich auf "+ Person hinzufügen" klicke
    Dann heißt die Auswahlliste genau "Geschlecht"
    Und heißt die Auswahlliste genau "Fahrerlaubnis"
