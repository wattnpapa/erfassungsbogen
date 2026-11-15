# language: de
Funktionalität: Einzelperson statt Einheit melden
  Als Fachberaterin, die ohne Einheit in den Einsatz geht, möchte ich einen
  eigenen Bogen ausfüllen — damit der Meldekopf mich als einzelne Person
  führt und nicht als Gruppe mit der Stärke eins.

  Grundlage:
    Angenommen ich öffne die App
    Wenn ich auf "Neuen Bogen erstellen" klicke
    Dann sehe ich den Schritt "1. Einheit"

  Szenario: Eine Baufachberaterin meldet sich mit eigenem Bogen
    Wenn ich "Einzelperson (z. B. Fachberater/in)" ankreuze
    Dann sehe ich den Text "Funktion"
    Wenn ich das Feld "Funktion" auf "BFB – Baufachberater/in" stelle
    Und ich zum Schritt "3. Personal" wechsle
    Dann sehe ich den Schritt "3. Person"
    # Genau eine Person: Die Karte ist schon da, eine zweite lässt sich nicht anlegen.
    Und sehe ich die Schaltfläche "+ Person hinzufügen" nicht
    Wenn ich zum Schritt "6. Übersicht" wechsle
    # Raute statt Formation, die Funktion an der Stelle des Einheitstyps.
    Dann sehe ich das Bild "Taktisches Zeichen der Person"
    Und sehe ich den Text "Einzelperson"
    Und sehe ich den Text "Baufachberater/in"

  Szenario: Zurück zur Einheit bleibt möglich
    Wenn ich "Einzelperson (z. B. Fachberater/in)" ankreuze
    Und ich "Einheit" ankreuze
    Dann sehe ich den Text "Einheitstyp"
