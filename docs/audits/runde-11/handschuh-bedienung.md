# Audit „Handschuh-Bedienung“, Runde 11 (Touch-Ziele, Abstände, Doppeltipp, Tastatur, Rückfragen, Querformat)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-25 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, `vite preview`)

**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 3 (R11-G1 bis R11-G3)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`
und `docs/audits/runde-10/README.md`. Nicht neu gemeldet sind die dort genannten
Grenzen und Reste (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3,
R9-G5, R8-H5/S4, leere Karten bei „Nur Stärke“, Rückgängig für Meldungen überlebt
das Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320) sowie R6-G6 (Schrittleiste ohne
Lücke, laut Runde 10 offen).

## Prüfaufbau

Chromium über `require('playwright')` ohne Startoptionen, `isMobile` und `hasTouch`,
Pixeldichte 2, Locale de-DE, je Lauf ein eigener Browser-Kontext. Viewports
390 × 844 und 360 × 640 (Hauptlage), 640 × 360 quer; die niedrige Tastatur über
Viewporthöhen von 340, 330 und 300 px nachgestellt. Zustände per `localStorage`-Seed
(`eeb.entwurf.v1`: Bogen „THW Albstadt Zugtrupp Technischer Zug“ mit 4 Personen,
2 Fahrzeugen; `eeb.einsaetze.v1`: Sammlung „Hochwasser Musterstadt“ mit sechs
Übungsbögen, alle mit `uebung: false`), dazu ein Lauf ohne Seed (Erstnutzung).

Gemessen sind Rechtecke per `getBoundingClientRect` (Maßstab 44 px Kante, 8 px
Abstand) und Tipps per `touchscreen.tap()`. Der Server wurde von weiteren Prüfern
gleichzeitig benutzt; Zeitmessungen sind unsicher.

Geprüft: Startseite; Schritte 1 bis 6 des eigenen Bogens (Karten- und Kurz-Liste-Ansicht
des Personals, Funktionsvorschläge); Einsatzansicht (Karten, Tabelle, Filter, aufgeklappte
Karte, „Mehr…“, „Abrücken“ mit Quittung, „Stärke ändern…“, „Aufteilen…“, „Auftrag/Notiz“,
„Zug zuordnen“); Aufnahme von Hand und Schnellerfassung (Schritt 1); Scanner ohne Kamera;
Lagemonitor; Rückfragen „Verwerfen“, „Bogen schließen“, „Alle Daten löschen“,
„StAN-Sollplätze laden“, „Person entfernen“; Doppeltipp auf „Weiter →“, „✕“, „+ Person
hinzufügen“, „Abrücken“.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, echte Bildschirmtastatur (Beschriftung
der Eingabetaste, Aufspringen beim Fokus), Wischen und Ziehen, Safari/WebKit, native Datums-
und Zeitpicker, echter Browser-Zoom, Kamera-Scan, Geräteuhr-Warnung (R7-G8/H9, Grenze).

Kennzeichnung: **gemessen** = Zahl oder Wert aus dem Browser, **beobachtet** = im Ablauf oder
auf dem Bildschirmfoto gesehen, **Risiko** = plausibel, aber nicht nachgestellt.

## Urteil

Die Bedienung mit Handschuh trägt. Alle Knöpfe, Eingaben und Auswahlfelder der geprüften
Schritte und Ansichten sind mindestens 44 px hoch (Ausnahmen sind in anderen Berichten
geführt: „Bogen fortsetzen“ 30 px, siehe R11-M4; unsichtbarer Sprunglink „Zum Inhalt
springen“ 36 px). Die 24-px-Kästchen und -Optionsfelder liegen in Beschriftungen von 44 bis
48 px Höhe, ganze Zeile antippbar. Kein seitlicher Überlauf (`scrollWidth` gleich Bildbreite)
in 390 × 844 und 360 × 640. Alle Aufgaben (Bogen durchblättern, Personen und Fahrzeuge
eintragen, Einheit abrücken und zurücknehmen, Stärke ändern, Einheit aufteilen, Einheit von
Hand aufnehmen, Bogen schließen, Daten löschen) sind ohne fremde Hilfe zu schaffen.

Neu und belegt sind drei P3-Punkte; kein P0, P1 oder P2.

## Befunde

### R11-G1 [P3] Eingabetaste in Schritt 1 und 4 bleibt im Feld, in Schritt 3 und 5 springt sie weiter

**Priorität:** P3

**Kennzeichnung:** gemessen (Eingabetaste im Browser, Fokus nach dem Druck, Attribut
`enterkeyhint`); die Beschriftung der echten Bildschirmtaste nicht geprüft (Risiko).

**Fundstelle / Aufgabe:** Schritt 1 „Einheit“ (auch in der Aufnahme von Hand und der
Schnellerfassung): „Ort der Einheit (Pflicht)“, „Dienststellen-Kürzel (optional)“,
„Einheitstyp“. Schritt 4 „Fahrzeuge“: „Fahrzeugtyp“.

**Beobachtung:** In Schritt 3 (Vorname → Nachname → „Zählt als“) und Schritt 5 (Verpflegung →
Diesel → Benzin → Gemisch → Freitext) trägt das Feld `enterkeyhint="next"`, die Eingabetaste
führt zum nächsten Feld. In den genannten Feldern ist kein `enterkeyhint` gesetzt, und die
Eingabetaste bewirkt nichts: Fokus und Inhalt bleiben („Albstadt“ + Eingabetaste ergibt
„Albstadtx“ im selben Feld mit offener Tastatur; ebenso „OALBX“ im Kürzel, „Fahrzeugtyp“
bleibt im Fokus). Im selben Schritt springen andere Felder weiter („Organisationsname“ →
„Einheitstyp“, „Telefon“ → „E-Mail“, „Kennzeichen“ → „Sitzplätze“, „Sitzplätze“ → „Ausstattung“).
Das Pflichtfeld „Ort der Einheit“ gehört also zu den Feldern ohne Wirkung der Taste.

**Erwartung der Rolle:** Die große Taste rechts unten auf der Tastatur ist in jedem Feld
gleich belegt: „Weiter“ springt zum nächsten Feld, am Ende der Reihe schließt sie die
Tastatur. Wer sie einmal gelernt hat, drückt sie ohne Nachdenken.

**Auswirkung im Einsatz:** Mit Handschuh trifft man das nächste Feld schlechter als die
Eingabetaste. Fällt die Taste in einem Feld aus, sucht der Helfer nach dem Grund oder tippt
ein zweites Mal; die Tastatur bleibt offen und verdeckt das nächste Feld. Kein Datenverlust.

**Empfehlung:** Dieselbe Regel wie in Schritt 3 und 5 für alle einzeiligen Textfelder der
Schritte 1 und 4: „Weiter“ zum nächsten sichtbaren Feld, im letzten Feld „Fertig“.

**Nachprüfung:** Schritt 1, Fokus in „Ort der Einheit (Pflicht)“, Eingabetaste führt zu
„Dienststellen-Kürzel“; Schritt 4, „Fahrzeugtyp“ führt zu „Kennzeichen“; alle genannten Felder
tragen `enterkeyhint`.

### R11-G2 [P3] „Aufteilen…“ setzt den Fokus sofort auf das Textfeld, die Personenliste als Hauptaufgabe liegt dahinter

**Priorität:** P3

**Kennzeichnung:** beobachtet (`document.activeElement` nach dem Tipp ist das Feld „z. B.
Fachberater“); das Aufspringen der Bildschirmtastatur selbst Risiko.

**Fundstelle / Aufgabe:** Einsatzansicht → Karte aufklappen → „Mehr…“ → „Aufteilen…“
(Formular in der Karte, Feld „Bezeichnung des abgeteilten Teils“, darunter „Personal, das
mitgeht (0 von n)“ mit Kästchenzeilen von je rund 62 px, darunter „Verbleib“ und Bestätigung).

**Beobachtung:** Beim Öffnen des Formulars liegt der Fokus im Textfeld. Die Auswahl der
Personen und Fahrzeuge, die eigentlich mitgehen sollen, folgt erst darunter (bei 360 × 640
beginnt sie bei rund 2080 px Seitenhöhe, das Feld bei 1979 px). Die Personenzeilen selbst
sind groß und gut zu treffen. Bei „Auftrag/Notiz“ und „Zug zuordnen“ ist der Fokus im einzigen Feld richtig; nur hier
steht das Textfeld vor der eigentlichen Aufgabe.

**Erwartung der Rolle:** Erst die Auswahl, dann (wenn überhaupt) der Name des Teils; die
Tastatur kommt nur, wenn ich ein Feld antippe.

**Auswirkung im Einsatz:** Auf einem echten Gerät klappt vermutlich die Tastatur auf, bevor
der Helfer die Liste gesehen hat; sie nimmt bei 640 px Höhe mehr als die halbe Fläche und
verdeckt die Kästchen. Der Helfer muss sie mit einem Tipp außerhalb schließen, bevor er die
Personen wählen kann. Kostet einen Zug, keine Fehlbedienung.

**Empfehlung:** Beim Öffnen von „Aufteilen…“ keinen Fokus ins Textfeld setzen (oder die
Liste zuerst, die Bezeichnung danach anbieten).

**Nachprüfung:** Nach „Aufteilen…“ ist nichts fokussiert und es erscheint keine Tastatur;
auf einem echten Telefon gegenprüfen.

### R11-G3 [P3] Antippflächen ohne Lücke: Tabellenköpfe, Aufklapp-Karten, „Hinweise“-Link über „Zuklappen/Details“; im Querformat Knopfpaare mit 6 px

**Priorität:** P3

**Kennzeichnung:** gemessen (Rechtecke, 360 × 640, 390 × 844 und 640 × 360); die Fehltipp-Folge
Risiko.

**Fundstelle / Aufgabe:**
- Einsatzansicht, Ansicht „Tabelle“: die Spaltenköpfe („EINHEIT“, „GES.“, „F“, „U“, „M“,
  „KFZ“, „AUFTRAG“, …) sind je 44 px hoch und 44 bis 163 px breit, 1 px Lücke; die Kennbuchstaben
  „F“, „U“, „M“ stehen in 44 px breiten Köpfen nebeneinander. Am 360-px-Telefon liegt der
  Kopf 1 px unter „Suchen, sortieren, filtern“ (Zusammenfassung 1054 bis 1098 px, Kopf ab 1099 px).
- Einsatzansicht, Karten: jede eingeklappte Karte ist als Ganzes ein Knopf („Aufklappen: Zeiten,
  Details und Aktionen“), 112 bis 165 px hoch, 1 bis 2 px Lücke zur nächsten.
- Aufgeklappte Karte: der Link „Hinweise: Zeitraum vorbei“ (47 px hoch) stößt mit 1 px an
  „Zuklappen“ und „Details“ (je 44 px); darunter bei 360 px „Bogen als PDF“ und „Abrücken“ mit 8 px.
- Filterzeile: „6 ohne Auftrag“ und „6 ohne Zug“ (47 px) stehen 4 px über „Suchen, sortieren,
  filtern“ (44 px); „Karten/Tabelle“ liegt 4 bis 6 px über den Zeilen darunter.
- Querformat 640 × 360, Schritt 3 und 4: „+ Person hinzufügen“ und „StAN-Sollplätze laden
  (4 Personen)“ übereinander mit 6 px (hochkant 16 px); ebenso „+ Fahrzeug hinzufügen“ und
  „StAN-Vorbelegung laden“.

**Beobachtung:** Die Ziele selbst sind groß genug; es fehlt die Lücke zwischen ihnen, die in
den übrigen Ansichten 8 bis 12 px beträgt. Folgen der Fehltipps sind in jedem Fall harmlos
oder abgesichert: eine falsche Sortierung ändert nur die Reihenfolge, ein ungewollt
aufgeklapptes Feld schiebt die Liste, „StAN-Sollplätze laden“ fragt mit Nennung der
4 Namen, die verloren gingen („Dabei gehen 4 eingetragene Namen verloren“).

**Erwartung der Rolle:** Zwischen zwei Knöpfen bleibt so viel Luft, dass der Daumen den einen
trifft, ohne den anderen zu streifen.

**Auswirkung im Einsatz:** Mehrere Fehltipps nacheinander und mehr Scrollen; bei den
Aufklapp-Karten verschiebt ein versehentlich geöffnetes Feld die darunterliegenden Ziele,
das nächste Tippen trifft dann etwas anderes. Eine Fehlbedienung mit Folgen ließ sich nicht
herstellen.

**Empfehlung:** Mindestens 8 px (besser 12 px) Lücke zwischen den genannten Zielen; bei den
Aufklapp-Karten einen sichtbaren, abgesetzten Rand statt aneinanderstoßender Flächen;
Spaltenköpfe der Tabelle ohne 1-px-Naht.

**Nachprüfung:** Abstände per `getBoundingClientRect` in den drei Viewports; Tipps auf die
Naht zwischen zwei Zielen lösen nur ein Ziel aus.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Doppeltipp (Tipp-Sperre):** „Weiter →“ zweimal im Abstand von 90 und 250 ms führt genau
  einen Schritt weiter. „✕“ einer Person im Abstand 80/200/400/700 ms öffnet genau eine
  Rückfrage und entfernt nichts. „+ Person hinzufügen“ zweimal im Abstand 100 ms legt genau
  eine Person an. „Abrücken“ zweimal im Abstand 90 ms bucht einmal; erst nach rund 5 s hebt
  ein weiterer Tipp mit eigener Quittung („Wieder anwesend: … zurückgenommen“) auf.
- **Rückfragen:** „Angefangenen Bogen verwerfen?“, „Bogen schließen?“, „Alle lokalen Daten
  löschen“, „StAN-Sollplätze laden?“, „Person entfernen?“: gefährliche Wahl rot und abgesetzt,
  „Abbrechen“ darunter oder daneben, jeweils 44 px hoch. Bei „Alle Daten löschen“ ist
  „Endgültig löschen“ erst nach einem Kästchen (Beschriftung 265 × 48 px) bedienbar.
- **Niedrige Tastatur (360 × 300 und 330):** „Stärke ändern“ behält Fuß mit
  „Stärke übernehmen“/„Abbrechen“ im Bild und rollt im Rumpf; die Vorschlagsliste der Funktion
  (Schritt 3) passt ihre Höhe an (256 → 182 px); die Inline-Formulare „Auftrag/Notiz“ und „Zug
  zuordnen“ halten „Speichern“/„Abbrechen“ (44 px, 8 px Lücke) im Bild.
- **Zahlenfelder:** „Stärke ändern“ und Schritt 4/5 mit `inputmode="numeric"` und
  „Weiter“/„Fertig“-Taste; „Nr. laut Zettel“ numerisch.
- **Personalliste (Kurz-Liste):** „▲ ▼ ⇑ ✕“ je 44 × 44 px; Vorname → Nachname → „Zählt als“
  mit der Eingabetaste (R10-G1 hält).
- **Einsatzansicht:** Schaltflächen „Bogen scannen…“, „Einheit manuell erfassen…“, „Bögen
  einlesen…“ 57 px hoch mit 12 px Lücke; „Abrücken“ mit Quittung („Rückgängig“ 121 × 44,
  „✕“) auf einem festen Platz über dem Ansicht-Balken, im Querformat 65 px hoch; „Entfernen“
  (rot) getrennt von „Verschieben…“ (77 px Abstand).
- **Aufteilen:** Personenzeilen mit Beschriftung 62 px hoch und großem Kästchen.
- **Scanner ohne Kamera:** „Kamera erneut versuchen“, „QR aus Bild einlesen…“, „Fertig“
  je 44 px, 8 bis 12 px Lücke, unten am Bildrand.
- **Lagemonitor** (öffnet in zweitem Fenster): „Dunkler“, „Heller (weiß)“, „Einsatzdaten“,
  „Optionen“ je 44 px.
- **Keine Pflichtgesten**; Tabelle verlangt nur das übliche Seitwärtsrollen zum Lesen weiterer
  Spalten (Aktionen stehen auf den Karten).

## Abgrenzung zu parallelen Berichten der Runde 11

Von mir gemessen, aber dort geführt und deshalb nicht erneut gemeldet: Kopf und zweizeilige
Fußleiste der Meldekopf-Erfassung (128 px Fuß, 20 % der Höhe bei 360 × 640; R11-M1),
Quittung nach „Abrücken“ mit Ansicht-Balken (R11-M3), 30 px hoher Knopf „Bogen fortsetzen“
(R11-M4).

## Abgleich mit Runde 10

| Befund Runde 10 | Stand | Beobachtung Runde 11 |
| --- | --- | --- |
| R10-G1 Eingabetaste in der Kurz-Liste | hält | Vorname → Nachname → „Zählt als“ |
| R10-G2 Kachel „n Einheiten“ wie ein Knopf | hält | in dieser Runde nicht erneut geprüft; Kopfkarte der Einsatzansicht zeigt flache Zahlen |
| R10-G3 Hinweise in schmaler Spalte | nicht erneut geprüft | Schritt 5 in dieser Runde nur auf Ziele und Eingabetaste gemessen |
| R6-G6 Schrittleiste ohne Lücke | offen (aus Runde 10) | hochkant 53 bis 57 px breit, 0 px Lücke, unverändert; nicht neu gemeldet |
