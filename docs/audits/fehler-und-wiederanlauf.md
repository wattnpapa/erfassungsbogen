# Audit „Fehler und Wiederanlauf" (Bedienfehler provozieren, selbst korrigieren)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-error-recovery-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite build` + `vite preview`),
Zweig `claude/thw-reviewer-skills-dr76q1`, Commit `9c0f2e4`.

Reiner Prüfbericht, keine Codeänderung.
> *Nachtrag 28.09.2026:* Die Befunde dieses Berichts sind behoben oder mit
> Begründung zurückgestellt; der Stand je Befund steht in
> [README.md → Stand der Behebung](README.md#stand-der-behebung).


## Prüfaufbau

Chromium (Playwright), 360 × 640, `isMobile`/`hasTouch`, de-DE, ohne Kamera.
Absichtlich gemachte Fehler, jeweils mit der Frage: Wird der Fehler vor der
Wirkung erkannt, sagt die Meldung, was zu tun ist, bleiben Eingaben erhalten,
und komme ich ohne Hilfe zurück?

Ausprobiert: falsche Datei laden (Fremd-PDF, Fremd-JSON) · Einzelbogen-PDF als
Einsatz importieren · Kauderwelsch und kaputter Link per Handscanner ·
Neuladen mitten im Tippen · Browser-Zurück und -Vor im Assistenten ·
falschen Einheitstyp wählen und danach wechseln oder leeren · Organisation
wechseln, nachdem Zugehörigkeit und Typ ausgefüllt sind · Zeitraum „bis" vor
„von", Einsatzende vor Einsatzbeginn · Stärke 99 / 0 / 1, negative Werte,
Sitzplätze −2, Diesel 99 999 l, Telefon „abc-xyz", E-Mail „keinemail" ·
Doppeltipp auf „Einsatz anlegen" und „+ Person hinzufügen" · Namensliste mit
Dublette und Einzelname einfügen · falscher Einsatz beim Aufnehmen.

Nicht prüfbar: Hardware-Zurück auf Android in den nativen Builds, Kamera-Scan
eines falschen Codes, Verhalten bei vollem Speicher.

## Urteil

Was die App abfängt, fängt sie gut ab: falsche Dateien und unlesbare Codes
bekommen eine konkrete Meldung mit dem nächsten Schritt, Neuladen verliert
keinen Buchstaben, Doppeltipps richten nichts an, ein Einzelbogen im
Einsatz-Import wird zum Angebot „dafür einen neuen Einsatz anlegen?". Die
Fehler, die weh tun, sind die stillen: Ein Tipp auf den falschen Einheitstyp
stellt 9 Personen und 4 Fahrzeuge in den Bogen, ohne es zu sagen, und ein
Wechsel des Typs räumt sie nicht weg; ein Wechsel der Organisation löscht
die ganze Zugehörigkeit; der Zurück-Knopf des Browsers verlässt die App.
Unplausible Zahlen (Stärke 99 / 0 / 1, Ende vor Beginn) gehen ungefragt in
die Übergabe. Ohne fremde Hilfe geht es, aber die Korrektur der stillen
Fehler kostet mehr Tipps als der Bogen selbst.

## Befunde

### E1 [P1] Der Einheitstyp füllt still 9 Personen und 4 Fahrzeuge ein — und ein Wechsel räumt nicht auf

Fundstelle: Schritt 1, Feld „Einheitstyp" (Vorschlagsliste); Folgen in
Schritt 3 und 4.
Beobachtung: Die Wahl „FGr R (B)" legt sofort 9 Personenkarten (GrFü, TrFü,
7 × Mannschaft) und 4 Fahrzeuge ohne Kennzeichen an. Auf Schritt 1 steht
dazu nichts — kein Dialog, keine Statuszeile; erst Schritt 3 meldet „7
Personenkarten ohne Angaben zählen in die Stärke" und Schritt 4 vier
Kennzeichen-Warnungen. Wer den Typ danach auf „ZTr TZ" (Soll 4 Personen)
ändert oder das Feld leert, behält alle 9 Karten und 4 Fahrzeuge der ersten
Wahl. Die Stärke steht bei 0 / 2 / 7 / 9, obwohl niemand erfasst ist.
Erwartung der Rolle: Eine Vorbelegung wird angekündigt („StAN-Sollplätze
eingetragen — Namen offen") und folgt dem Typ; wer sich vertippt und den Typ
korrigiert, bekommt die Vorbelegung des richtigen Typs, nicht die Summe
beider.
Auswirkung im Einsatz: Der Bogen meldet eine Stärke, die nicht stimmt, und
zwar in der Größenordnung einer ganzen Gruppe. Die Korrektur heißt 13-mal
„entfernen" (bei Karten mit Funktion jeweils mit Rückfrage) oder „Neuer
Bogen" mit Verlust der übrigen Eingaben. Unter Zeitdruck wird der Bogen so
übergeben — die Hinweise sind da, aber sie sagen „ausfüllen oder entfernen",
nicht „das kam vom falschen Einheitstyp".
Empfehlung: Vorbelegung auf Schritt 1 ankündigen und bestätigen lassen; beim
Typwechsel anbieten, unbenannte Vorbelegungs-Karten durch die des neuen Typs
zu ersetzen (benannte bleiben); ein Knopf „Vorbelegung entfernen" in Schritt
3 und 4.
Verifikation: Typ A wählen, dann Typ B — Schritt 3 darf nur die Sollplätze
von B zeigen; das Leeren des Typs muss die unbenannten Karten mitnehmen.

### E2 [P1] Organisation wechseln löscht Einheitstyp und Zugehörigkeit ohne Frage

Fundstelle: Schritt 1, Auswahl „Organisation" (THW, Feuerwehr, Polizei …;
„Feuerwehr" steht direkt unter „THW").
Beobachtung: Bei ausgefülltem THW-Bogen (Typ FGr R (B), OV Wardenburg mit
Kürzel, Rufnummer, Postfach, RB Bremen, LV Bremen/Niedersachsen) den Eintrag
„Feuerwehr" wählen: Einheitstyp leer, die gesamte Zugehörigkeit weg, das
Formular zeigt jetzt „Landesvorlage – Bundesland". Zurück auf „THW": Typ
leer, Zugehörigkeit leer, nur die Ebene „OV" steht wieder da. Kein Dialog,
keine Meldung, kein Rückweg. Die Personenkarten der StAN-Vorbelegung bleiben
dagegen stehen (E1).
Erwartung der Rolle: Ein Vertipper im ersten Auswahlfeld lässt sich durch
Zurückwählen ungeschehen machen.
Auswirkung im Einsatz: Rufnummern und Postfächer der drei Ebenen müssen neu
gesucht und getippt werden (über die OV-Vorschlagsliste teilweise
nachholbar) — im Fahrzeug, unterwegs, aus dem Kopf.
Empfehlung: Beim Wechsel mit ausgefüllter Zugehörigkeit nachfragen und
sagen, was verloren geht; oder die Angaben je Organisation behalten und beim
Zurückwechseln wiederherstellen.
Verifikation: THW-Bogen ausfüllen, auf Feuerwehr und zurück — die
Zugehörigkeit muss wieder da sein oder vorher gefragt worden sein.

### E3 [P1] Der Zurück-Knopf des Browsers verlässt die App

Fundstelle: Assistent, beliebiger Schritt; Browser-Zurück (auf Android der
Hardware-Zurück im Browser und in der installierten Web-App).
Beobachtung: Die App schreibt keine Verlaufseinträge; „Zurück" führt auf die
Seite vor der App (hier `about:blank`, im Alltag die Suchmaschine oder der
Chat, aus dem der Link kam). „Vorwärts" landet auf der Startseite, nicht im
Schritt. Der Entwurf ist erhalten und über „Fortsetzen" wieder da.
Erwartung der Rolle: „Zurück" heißt einen Schritt zurück — so steht es auch
unten links im Assistenten. Auf Android ist der Hardware-Zurück der Reflex
für „einen Schritt zurück", besonders mit Handschuh, wenn der kleine
„← Zurück"-Knopf nicht trifft.
Auswirkung im Einsatz: Die App ist plötzlich weg; der Helfer glaubt, der
Bogen sei es auch. Er kommt zurück, aber über die Startseite, und muss den
Schritt wieder suchen. Bei geöffnetem Scanner oder Übergabe-Dialog dasselbe.
(Native Android-App nicht geprüft; dort kann der Zurück-Knopf anders belegt
sein.)
Empfehlung: Schritte, Dialoge und den Scanner in den Verlauf eintragen, damit
„Zurück" innerhalb der App bleibt — der Scanner-Ausgang aus dem
Neuer-Nutzer-Audit (F1) wäre damit gleich mitgelöst.
Verifikation: Auf Schritt 3 Browser-Zurück drücken — Schritt 2 muss
erscheinen; im Scanner muss Zurück den Scanner schließen.

### E4 [P2] Unplausible Werte und Zeitfehler gehen ungeprüft in die Übergabe

Fundstelle: Schritt 2 (Zeitraum, Einsatzbeginn/-ende), Schritt 3 „Nur
Stärke", Schritt 4 Sitzplätze, Schritt 5 Betriebsstoff, Schritt 1 Telefon /
E-Mail.
Beobachtung: „Zeitraum bis" vor „von" wird erkannt — aber der Hinweis
erscheint auf Schritt 1, 3 und in der Übersicht, nicht auf Schritt 2, wo der
Fehler gemacht wird. Einsatzende 06:00 vor Einsatzbeginn 18:00 am selben Tag:
kein Hinweis; die Übersicht zeigt „2026-09-27 18:00 / 2026-09-27 06:00" (im
Gegensatz zum Zeitraum „27.09.2026" in Maschinenschreibweise). Stärke 99 / 0 /
1 (Gesamt 100): kein Hinweis. Sitzplätze −2, Diesel 99 999 l, Telefon
„abc-xyz", E-Mail „keinemail": kein Hinweis. Negative Stärkewerte in den
Zählern werden immerhin auf 0 gehalten.
Erwartung der Rolle: Ein Zahlendreher (99 statt 9, 0 statt 10) fällt beim
Tippen auf, weil die App stutzt: „99 Führer bei 1 Mannschaft — stimmt das?"
Auswirkung im Einsatz: Der Meldekopf zählt 100 statt 10 in die Lage, oder
eine Einheit steht mit Einsatzende vor Einsatzbeginn im Sammel-PDF. Beides
ist am Meldekopf nicht mehr als Tippfehler erkennbar.
Empfehlung: Plausibilitätshinweise direkt am Feld (Verhältnis Führer /
Mannschaft, Ende vor Beginn, negative Sitzplätze, Betriebsstoff über
Fahrzeugzahl × Richtwert) — nicht sperrend, aber sichtbar, und den
Zeitraum-Hinweis auf Schritt 2 zeigen. Zeitpunkte einheitlich als
„27.09.2026, 18:00" ausgeben.
Verifikation: Stärke 99 / 0 / 1 und Ende vor Beginn eingeben — am Feld muss
ein Hinweis stehen, und die Übersicht muss ihn wiederholen.

### E5 [P2] In den falschen Einsatz aufgenommen: es gibt kein Verschieben

Fundstelle: Übersicht → „In Einsatz aufnehmen…" → Einsatzliste (Namen ohne
weitere Unterscheidung außer „Einsatz · 2 Einheit(en) anwesend"); Karte der
Einheit in der Einsatzansicht.
Beobachtung: Die Karte bietet Details, PDF, Abrücken, Zug zuordnen,
Aufteilen, Historie, Entfernen — kein „In anderen Einsatz verschieben". Der
eigene Bogen ist nach der Aufnahme geschlossen (siehe Audit Zerstörende
Handlungen D5). Der Rückweg für eine gescannte Meldung: Entfernen
(„Rückgängig" vorhanden) und neu scannen; für eine manuell erfasste oder
den eigenen Bogen: „Bogen als PDF" → „Aus Datei laden…" → erneut aufnehmen.
Erwartung der Rolle: Falsche Mappe erwischt — umsortieren.
Auswirkung im Einsatz: Bei zwei parallel geführten Sammlungen (Einsatz und
Übung, zwei Bereitstellungsräume) kostet der Fehler drei Bildschirme und
eine PDF; wer den Weg nicht kennt, tippt die Einheit neu.
Empfehlung: „In anderen Einsatz verschieben" an der Karte; in der Auswahl
beim Aufnehmen Ort und Anlegezeit der Sammlungen zeigen.
Verifikation: Meldung in Einsatz A aufnehmen, nach B verschieben — ohne
Datei-Umweg, mit erhaltener Signatur und Historie.

### E6 [P3] Alte Meldungen bleiben stehen, der Scanner schließt sich, Dubletten werden übernommen

Fundstelle: Startseite (Statuszeile), Scanner, Dialog „Namen einfügen…".
Beobachtung: Nach einer falschen JSON-Datei steht „Keine gültige
Erfassungsbogen-Datei (Schema-Version 2–9 erwartet)" — und bleibt stehen,
während für die nächste, andere Datei bereits der Dialog „Keine
Einsatz-Sammlung in der Datei … Dafür einen neuen Einsatz anlegen?" offen
ist; zwei Aussagen zu zwei Dateien gleichzeitig. Ein ungültiger Handscanner-
Code schließt den Scanner und meldet gut („enthält keinen gültigen
Erfassungsbogen. Empfangen: ‚HALLODASISTKEINCODE…'"), aber für den nächsten
Versuch muss der Scanner neu geöffnet werden. „Namen einfügen…" übernimmt
„Meyer, Jan, ZFü" zweimal als zwei Führer, ohne Hinweis; die Vorschau zeigt
es, wenn man hinsieht.
Erwartung der Rolle: Eine Meldung gehört zur letzten Handlung; nach einem
Fehlscan bleibt der Scanner bereit; eine Dublette wird angemerkt.
Auswirkung im Einsatz: Gering, aber jedes Mal ein Moment Verwirrung — und
beim Stapelscan am Meldekopf ein Tipp mehr pro Fehlversuch.
Empfehlung: Statuszeile bei jeder neuen Handlung leeren; Scanner nach
Fehlcode offen lassen und die Meldung darin zeigen; Dubletten in der
Vorschau kennzeichnen.
Verifikation: Zwei falsche Dateien nacheinander laden — nur eine Meldung
darf stehen.

## Was gut funktioniert und erhalten bleiben sollte

Falsche Dateien bekommen eine Meldung, die den nächsten Schritt nennt: „In
dieser PDF steckt kein Erfassungsbogen — weder eingebettete Daten noch ein
lesbarer QR-Code. Stammt die PDF aus einem Scanner …, hilft ‚QR-Code
scannen…' bzw. ein Foto des Codes." Ein Einzelbogen im Einsatz-Import wird
zum Angebot „Dafür einen neuen Einsatz anlegen?".

Der ungültige Scan zeigt, was empfangen wurde — damit lässt sich ein
verstellter Handscanner (Tastaturbelegung) sofort erkennen.

Neuladen mitten im Wort verliert nichts: „Sandsack" stand nach dem Reload in
der Übersicht. „Fortsetzen" bringt den Bogen zurück.

Doppelklick auf „Einsatz anlegen" legt einen Einsatz an; Doppeltipp auf „+
Person hinzufügen" erzeugt zwei leere Karten, die die Hinweise beim Namen
nennen und die ohne Rückfrage wieder weggehen.

Negative Stärkewerte bleiben bei 0. „Zeitraum bis vor von" wird erkannt (nur
am falschen Ort gezeigt, E4).

„Namen einfügen…" zeigt vor dem Übernehmen, wer mit welcher Rolle entsteht,
und kommt mit „Nachname, Vorname", „Vorname Nachname" und Einzelnamen
zurecht.

Die offenen Punkte in Übersicht und Übergabe-Dialog sind antippbar und
führen an die Stelle, an der sich der Fehler beheben lässt.

## Abschluss

- Aufgabe geschafft: mit Umwegen — die stillen Fehler (Einheitstyp,
  Organisation) sind nur mit vielen Einzel-Löschungen oder „Neuer Bogen" zu
  korrigieren.
- Fremde Hilfe nötig: nein.
- Größtes Missverständnis: Der Einheitstyp ist kein Etikett, sondern eine
  Vorbelegung, die 13 Einträge anlegt und beim Korrigieren stehen bleibt.
- Größtes Einsatzrisiko: Eine Stärke von 100 statt 10 oder eine Meldung mit
  Sollplätzen des falschen Typs geht ohne Hinweis am Feld an den Meldekopf.
- Top-Priorität für die nächste Iteration: Vorbelegung ankündigen und beim
  Typwechsel ersetzen statt stapeln (E1), direkt danach die Rückfrage vor dem
  Organisationswechsel (E2).
