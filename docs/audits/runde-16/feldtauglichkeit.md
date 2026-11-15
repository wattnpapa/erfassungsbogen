# Audit „Helfer im Feld“, Runde 16 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `36d549a` (`main` nach Runde 15).

Zählung: **P0 0 · P1 0 · P2 0 · P3 3**

Reiner Prüfbericht, keine Codeänderung. Die bekannten Grenzen und Reste aus den
Runden 6 bis 15 wurden nicht neu gemeldet (u. a. R15-E1, R15-E2, R15-D4, R15-S4,
R15-M2, R15-O1).

## Prüfaufbau

Playwright/Chromium (globales Modul, `chromium.launch()` ohne Optionen, da die
Projektkopie keinen passenden Browser fand), `isMobile`/`hasTouch`, Locale de-DE,
Telefon 360 × 640 und 390 × 844, einzelne Läufe 320 × 568 und quer (640 × 360).
Frischer Kontext je Lauf, keine Kamera. Einsatzdaten: Kopien der Übungsbögen
unter `examples/thw/` mit `uebung: false` und aktuellem Stand (3 bis 6 Dateien),
über „Bögen einlesen…“ in eine frisch angelegte Sammlung „Hochwasser Test“
eingespielt; eigener Bogen einmal im Assistenten ausgefüllt (BGr, Husum und
Oldenburg (NI)), einmal aus einer Beispieldatei geladen.

Durchgespielt: eigener Bogen Schritt 1 bis 6 (Vorschläge für Ort und Einheitstyp,
Funkrufname, Eingabeattribute je Feld), Neuladen mitten im Assistenten,
„Bogen übergeben…“; Sammlung anlegen, Dateien einlesen, „Zur Kenntnis genommen“,
Karte aufklappen, „Abrücken“, „Mehr…“, „Stärke ändern…“ (auch Doppeltipp und
Browser-Zurück bei offenem Dialog), Tabelle, Filter, „Einsatz weitergeben /
sichern“, Schnellerfassung mit Sammlungswahl, manuelle Erfassung, Scanner ohne
Kamera, „Alle Daten löschen“, „Geräteschlüssel neu erzeugen“, Querformat,
Kontrastmessung in allen vier Ansichten, Erstbesuch mit Service-Worker-Installation.

**Nicht verifiziert:** echte Handschuhe und nasse Finger, Sonnenlicht und
Dunkelheit am Display, Kamera-Scan, native Datums- und Zeitauswahl (der
Prüfbrowser zeigt Datumsfelder im US-Format, das ist kein Befund der App),
echte Bildschirmtastatur und Autokorrektur, WebKit/Safari, echtes Drucken,
voller Speicher. Die Übungsbögen tragen Zeiträume aus dem Juli; die dadurch
erscheinenden Hinweise („Zeitraum vorbei“, „Anderer Einsatz?“) sind ein Artefakt
des Prüfaufbaus und wurden nicht gewertet.

## Urteil

Alle Szenarien wurden **abgeschlossen**, ohne Datenverlust und ohne Sackgasse.
Es gibt keinen P0-, P1- oder P2-Befund; drei Kleinigkeiten (P3).

## Nachprüfung der Behebungen aus Runde 15 im echten Browser

- **R15-H1 Quittungsleiste:** „Zur Kenntnis genommen: 6 Einheiten“ (360 px)
  vollständig, `scrollHeight` = `clientHeight` (18/18); „Stärke 4 → 11 geändert:
  „THW Albstadt Zugtrupp Technischer Zug““ mit Namen, auch quer; „Abgerückt 15:24:
  Nr. 1 „THW Albstadt …““ vollständig. Hält. Die Leiste bleibt stehen, bis „✕“
  oder „Rückgängig“ getippt wird (über 40 s gemessen).
- **R15-H2 Funkrufname:** Ort „Oldenburg (NI)“ gewählt, Schritt 4 zeigt „Ort im
  Funkrufnamen = Ort der Einheit (Oldenburg)“. Hält.
- **R15-H3 „Alle Daten löschen“:** Schlussabsatz lautet jetzt „Die Einstellung
  „Nicht mitzählen“ aus dem Datenschutzhinweis bleibt erhalten.“ Hält.
- **R15-S2 Kurzfassung ab sechs Einheiten:** „Neu seit der letzten Kenntnisnahme
  (6)“ mit „Zur Liste springen“, „Alle 6 einzeln anzeigen“, Sammelzuordnung des
  Zugs. Hält (zur Zielgröße der beiden Links siehe R16-H1).
- **R15-G1 Doppeltipp:** zwei Taps im Abstand von 60 ms auf „Stärke übernehmen“
  ergeben eine Änderung und eine Quittung. Hält.
- **Browser-Zurück bei offenem Dialog:** schließt den Dialog „Stärke ändern“ und
  bleibt in der Sammlung. Hält.
- **Neuladen im Assistenten:** Startseite mit „THW Husum Bergungsgruppe … gespeichert
  15:40 Uhr“, „Fortsetzen“/„Verwerfen“, Hinweis „öffnet ihn dort, wo du warst“.
  Hält.
- **Sammel-PDF:** Hinweis „bei 6 Bögen am Telefon etwa 9 Sekunden oder länger. Nicht
  noch einmal tippen“ während der Erzeugung (gemessen rund 2 s), danach Quittung
  „✓ Einsatz „…“ als PDF erzeugt“ und ein Download. Hält.
- **Ansichten:** Kontrastmessung (WCAG, Fließtext 4,5:1) in Standard, Feld, Dunkel
  und Nacht auf der Sammlung mit sechs Einheiten: keine Unterschreitung an
  sichtbarem Text.

## Befunde

### R16-H1 [P3] „Zur Liste springen ↓“ und „Alle 6 einzeln anzeigen“ sind nur 30 px hoch, die Nachbarn 44 px

**Evidence:** Observed (360 × 640 und 390 × 844; gemessen: Höhe 29,9 px, Breite
123 bzw. 144 px, Schriftgröße 14 px, `min-height` 0, Innenabstand 4,5 px oben und
unten).
**Ort:** Einsatzansicht, Kasten „Neu seit der letzten Kenntnisnahme (n)“, sobald
sechs oder mehr Einheiten neu sind (Kurzfassung aus R15-S2).
**Beobachtung:** Im selben Kasten sind „Zuletzt gemeldete oben zeigen“ (193 × 44 px)
und „Zur Kenntnis genommen“ (155 × 44 px) und „Zuordnen“ (93 × 44 px) 44 px hoch.
Die beiden Sprungverweise sehen genauso aus (unterstrichener Linktext), sind aber
rund ein Drittel niedriger und liegen mit Zeilen dazwischen untereinander.
**Erwartung des Helfers:** Alles, was wie ein Link im selben Kasten aussieht, trifft
er mit dem Handschuh gleich gut; sonst tippt er daneben und landet im Text oder
bei „Zur Kenntnis genommen“, das den Kasten beendet.
**Folge:** Gering. Ein Fehltipp auf „Alle 6 einzeln anzeigen“ trifft die freie Fläche
und bewirkt nichts; zwischen den Verweisen und „Zur Kenntnis genommen“ liegen
mehr als 44 px, eine Fehlbedienung wurde nicht beobachtet. Mit Handschuh
(nicht verifiziert) ist die Trefferquote niedriger als bei den Nachbarn.
**Empfehlung:** Dieselbe Mindesthöhe von 44 px wie bei den übrigen Verweisen im
Kasten; Abstand zu „Zug für 6 Einheiten ohne Zug“ mit 8 px beibehalten.
**Nachprüfung:** Sechs Bögen einlesen, 360 × 640: beide Verweise messen mindestens
44 px Höhe.

### R16-H2 [P3] Namensfelder der übergeordneten Ebenen (Regionalbereich, Landesverband) lassen Autokorrektur und Rechtschreibprüfung an

**Evidence:** Observed für die Eingabeattribute (Schritt 1, 360 × 640; gemessen
`autocorrect` nicht gesetzt, `autocomplete` leer, `spellcheck` = true bei den
Feldern „Name“ der Ebenen „RB“ („Heilbronn“) und „LV“ („Baden-Württemberg“)). Die
Wirkung auf einer echten Bildschirmtastatur ist **nicht verifiziert** (Likely).
**Ort:** Schritt 1 „Einheit“, Zugehörigkeit / Kontaktstellen, Zeilen der zweiten und
dritten Ebene; ebenso „Organisationsname (optional)“ (dort `autocorrect` aus,
aber `autocomplete` nicht aus).
**Beobachtung:** Das Feld „Ort der Einheit (Pflicht)“, die Kürzel-, Telefon- und
E-Mail-Felder und die Personennamen in Schritt 3 haben Autokorrektur,
Rechtschreibprüfung und Autovervollständigung abgeschaltet (R13-H3, Befund behoben).
Das Feld „Name“ der höheren Ebenen enthält ebenfalls Ortsnamen und
Dienststellenbezeichnungen, ist aber bei den Standardwerten des Browsers
geblieben.
**Erwartung des Helfers:** Er tippt „Haßmersheim“ oder „Heilbronn“ und erwartet
den Namen so, wie er ihn eingetippt hat, nicht ein „korrigiertes“ Wort.
**Folge:** Gering. Eine Autokorrektur würde den Namen der Dienststelle im Bogen und
im QR-Code verfälschen; der Fehler fiele erst beim Meldekopf oder im PDF auf.
Die Felder sind bei Vorlagen und Übungsbögen meist schon gefüllt.
**Empfehlung:** Autokorrektur, Rechtschreibprüfung und Autovervollständigung auch an
den Namensfeldern der höheren Ebenen und am Organisationsnamen abschalten, wie
am Ortsfeld.
**Nachprüfung:** Schritt 1 öffnen: alle Textfelder der Zeilen haben `autocorrect=off`
und `spellcheck=false`; auf einem Telefon einen unüblichen Ortsnamen eintippen.

### R16-H3 [P3] Beim Erstbesuch springen die Knöpfe des Meldekopfs mehrfach um 21 bis 42 px, solange die App sich für Offline lädt

**Evidence:** Observed (frischer Kontext, Startseite, 360 × 640 und 390 × 844,
Lage der Knöpfe alle 200 ms gemessen).
**Ort:** Startseite, grüner Kasten „Jetzt offline bereit … Übungsbögen und
Themenseiten werden nachgeladen (n von 549)“ und die darunterliegenden Knöpfe
„Neue Einsatz-Sammlung…“, „Einheit schnell erfassen (nur Stärke)…“.
**Beobachtung:** Der Kasten ändert in den ersten rund fünf Sekunden viermal seinen
Text und seine Höhe (bei 360 px 117 → 75 → 117 → 75 px, bei 390 px
96 → 75 → 96 → 54 px). „Neue Einsatz-Sammlung…“ wandert dabei bei 360 px von 882 über
840 und 882 nach 840 px, bei 390 px von 938 über 917 und 938 nach 896 px.
„Neuen Bogen erstellen“ und „QR-Code scannen…“ darüber bleiben stehen. Der
Vorgang tritt nur beim ersten Aufruf mit Netz auf; danach steht der kurze Satz.
**Erwartung des Helfers:** Eine Seite, deren Knöpfe stillstehen, wenn er sie
antippt.
**Folge:** Gering. Wer in dieser Zeit „Neue Einsatz-Sammlung…“ antippt, trifft
nach einer Verschiebung um 42 px die Lücke oder „Einheit schnell erfassen“
(Rückfrage „für welche Sammlung?“ mit „Abbrechen“). Der Erstaufruf mit Netz findet
zu Hause oder in der Unterkunft statt, nicht im Einsatz; Daten gehen nicht
verloren.
**Empfehlung:** Dem Kasten eine feste Höhe (oder Mindesthöhe für die längste
Fassung) geben, oder den Fortschrittsstand unterhalb der Knöpfe anzeigen; die
Zeile „(n von 549)“ nicht im Fluss über den Knöpfen laufen lassen.
**Nachprüfung:** Frischer Browser, Startseite aufrufen: die Oberkante von „Neue
Einsatz-Sammlung…“ ändert sich in den ersten zehn Sekunden nicht.

## Was gehalten hat (nicht ändern)

- **Quittungen mit Rückgängig:** Name der Einheit, Zahl und Zeit vollständig, Knöpfe
  44 px hoch, Leiste bleibt bis zur Bestätigung stehen.
- **„Stärke ändern…“:** Dialog mit Vorher-Nachher („Gesamt: 11 (bisher 4)“), Hinweis,
  was bleibt und was in die Historie wandert; Abbrechen auf Abstand.
- **Scanner ohne Kamera:** „Dieses Gerät meldet keine nutzbare Kamera.“, danach
  sofort der Weg „USB-Handscanner“, „Kamera erneut versuchen“, „QR aus Bild
  einlesen…“ und „Fertig“.
- **Manuelle Erfassung im Einsatz:** Kopf „‹ Einsatz „Hochwasser Test““ und Marke
  „Aufnahme für: Hochwasser Test“, Fokus im Ortsfeld mit Vorschlagsliste
  (Kürzel und Postleitzahl).
- **„Alle Daten löschen“:** Aufzählung der Folgen mit Zählern („1 Einsatz-Sammlung mit
  3 gemeldeten Bögen — noch kein Export …“), „Vorher Sicherung erstellen…“.
- **Eingabeattribute:** Zahlenfelder (Sitzplätze, Verpflegung, Kraftstoffe)
  mit numerischer Tastatur, Telefon und E-Mail mit eigener Tastatur,
  Personennamen ohne Autokorrektur.

## Verständnis-Check

- Orientierung: verstanden
- Nächste Handlung: verstanden
- Systemstatus: verstanden
- Fehlerbehebung: verstanden
- Feldtauglichkeit: eingeschränkt geprüft (echte Handschuhe, Sonnenlicht, Kamera,
  Telefontastatur nicht prüfbar); soweit prüfbar geeignet
