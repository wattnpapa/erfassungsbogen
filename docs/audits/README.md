# Rollenaudits (Stand 27.09.2026)

Zehn Prüfberichte aus je einer Nutzerrolle, alle gegen den Produktionsbuild
(`vite build` + `vite preview`) im Telefon-Viewport 360 × 640 (Führungssicht
zusätzlich Tablet 820 × 1180), Zweig `claude/thw-reviewer-skills-dr76q1`.
Reine Prüfberichte ohne Codeänderung; jeder Befund nennt Fundstelle,
Beobachtung, Folge, Empfehlung und Nachprüfung. Das ältere
[Feldtauglichkeits-Audit](../feldtauglichkeit-audit.md) (Rolle „Helfer im
Feld", Befunde behoben) bleibt daneben bestehen.

| Rolle | Bericht | Befunde |
| --- | --- | --- |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | 2 × P1, 5 × P2, 1 × P3 |
| Arbeitsablauf über drei Geräte | [arbeitsablauf.md](arbeitsablauf.md) | 2 × P1, 2 × P2, 3 × P3 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | 2 × P1, 3 × P2, 2 × P3 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | 3 × P1, 2 × P2, 1 × P3 |
| Handschuh-Bedienung | [handschuh-bedienung.md](handschuh-bedienung.md) | 1 × P1, 3 × P2, 2 × P3 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | 3 × P2, 2 × P3 |
| Offline und Speicher | [offline-und-speicher.md](offline-und-speicher.md) | 1 × P0, 1 × P2, 2 × P3 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | 2 × P1, 2 × P2, 1 × P3 |
| Analog first | [analog-first.md](analog-first.md) | 2 × P1, 2 × P2, 1 × P3 |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | 2 × P1, 3 × P2, 1 × P3 |

## Audit-übergreifende Reihenfolge

Mehrere Rollen sind unabhängig voneinander auf dieselben Ursachen
gestoßen. Nach Schwere und Häufigkeit:

1. Voller Speicher (O1, P0): Statuszeile behauptet „gespeichert", „In
   Einsatz aufnehmen" verwirft den Bogen ohne Meldung. Einziger P0.
2. Zeiten am Meldekopf (W3, D4, A2, K2): kein Eintreff- und kein
   Abrückzeitpunkt je Einheit, weder in der App noch auf dem
   Übergabeblatt; Nacherfassung vom Papier stempelt „jetzt".
3. Übergabe der Sammlung (W2, A1): „Sammel-PDF" ist die Übergabedatei,
   lässt auf Papier abgerückte Einheiten weg und verweigert sich, sobald
   alle abgerückt sind — also am Einsatzende.
4. Empfang am Meldekopf außerhalb des Einsatzes (W1, S1, S2, F2):
   Link, Nahbereich und Datei laufen über „meinen Bogen"; der
   Wiederholungsscan im Stapel hält mit einer Fachfrage an; nach
   Unterbrechung steht ein fremder Bogen als eigener Entwurf oben.
5. Stille Datenverluste im Assistenten (E1, E2, D1, D2, D3, G1, G2):
   Einheitstyp-Vorbelegung ohne Ankündigung und ohne Aufräumen,
   Organisationswechsel löscht die Zugehörigkeit, Tabellen-Löschen und
   ✕-Ziele ohne Rückfrage, „Nur Stärke" setzt die gemeldete Stärke auf 0.
6. Ausgänge und Rückwege (F1, E3): Scanner ohne erreichbares „Abbrechen"
   auf 640 px, Browser-Zurück verlässt die App.
7. Bedarf je Einheit und Lücken einer Meldung in der Führungssicht
   (K1, K3); Verpflegung doppelt geführt (W4).
8. Wortwahl an sieben Stellen, die unter Druck in die Irre führt (S3 mit
   Verweisen) — überwiegend Beschriftungen.
9. Nacht: Vollbild-QR und Begleitseiten (N1, N2, N3); Handschuh:
   Sortierpfeile, Chips, Querformat (G1–G3).

## Was alle Rollen bestätigt haben

Offline-Betrieb ohne Einschränkung, Entwurfsrettung bei jeder
Unterbrechung, Papier-Layout des PDF, QR-Aufteilung, Folgemeldung mit
Änderungsanzeige, Kiosk-Scan mit Quittung, Vorlage mit Ankreuzliste,
Kontrast in allen vier Themen, spezifische Rückfragen mit „Abbrechen" auf
Abstand, Papierkorb für Einsätze und Vorlagen.

## Prüfaufbau (für Wiederholungen)

Playwright gegen `vite preview` (Port 4173), Chromium aus
`/opt/pw-browsers/chromium`, `isMobile`/`hasTouch`, Locale de-DE, keine
Kamera. Zustände über `localStorage`-Seeds (`eeb.entwurf.v1`,
`eeb.einsaetze.v1`, `eeb.vorlagen.v1`) aus den Beispielbögen in
`examples/thw/`, jeweils mit `uebung: false`; QR-Transport durch den
inhaltsgleichen Link-Weg („Weitere Formate → Link teilen", `navigator.share`
gestubbt) und durch PDF-Dateien ersetzt. Nicht prüfbar waren Kamera-Scan,
Nahbereichs-Weitergabe, echte Handschuhe, echte Beleuchtung, die
Bildschirmtastatur und die nativen Builds.

## Stand der Behebung

Stand 28.09.2026. Alle Befunde wurden auf demselben Zweig bearbeitet und mit
Unit-Tests, Typprüfung, Produktionsbuild und einer Nachmessung im Browser
(360 × 640 und 640 × 360) geprüft. Zwei Befunde sind nur teilweise umgesetzt,
weil die vollständige Lösung das Meldeformat im Submodul `vendor/eeb-format`
ändern müsste (Schemawechsel, Codec, QR-Bytes); sie sind unten begründet.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| F1 Scanner ohne Ausgang | behoben | Scanner rollt, Knopfleiste klebt unten (bei 360 × 640 „Abbrechen" bei 584 px statt 687), Escape schließt, Handscanner-Hinweise eingeklappt |
| F2 Erfassung im Einsatz sieht aus wie eigener Bogen | behoben | Kopf „‹ Einsatz „…"" und Marke „Aufnahme für: …", „In Einsatz übernehmen" auf jedem Schritt, angefangene Erfassung in der Einsatzansicht angezeigt |
| F3 „Einsatz" dreifach belegt | behoben | „Neue Einsatz-Sammlung…", Dialog „Neue Einsatz-Sammlung anlegen", „In Einsatz-Sammlung ablegen" |
| F4 „Zeitraum bis" vorbelegt | teilweise | Feld heißt „Zeitraum bis (Vorschlag: wie Beginn)" und zieht mit „von" mit; leer ist ohne Schemawechsel nicht möglich (`zeitraumBis` ist Pflicht im Codec) |
| F5 Einsatzbeginn/-ende unklar | behoben | „… eintragen" mit Hinweiszeile, Datum-Uhrzeit-Felder beschriftet |
| F6 Hinweise anderer Schritte | behoben | Jeder Schritt zeigt nur seine eigenen Prüfpunkte |
| F7 Produktbegriffe | behoben | „Dienststellen-Kürzel", „Zählt als", „Erreichbar für Rückfragen", Sitzplatzrechnung erst mit Fahrzeugangaben, Siegel-Kurzform im Aufklapper |
| F8 leere Karte zählt, Geschlecht „M" | nicht geändert | Geschlecht ist im Format ein Pflichtfeld ohne „leer"; der bestehende Prüfpunkt „bei allen Personen steht die Vorbelegung M" bleibt die Absicherung |
| W1 Empfang außerhalb des Einsatzes | behoben | Link, Nahbereich und Datei bieten bei vorhandenen Sammlungen direkt „In „…" aufnehmen" an; beim Kaltstart kommt der eigene Entwurf zurück |
| W2 Weitergabe der Sammlung | behoben | Knopf „Einsatz weitergeben / sichern", funktioniert auch ohne Anwesende |
| W3 Abrücken ohne Zeit | behoben | Abrückzeit gespeichert, korrigierbar, auf Karte, Tabelle, PDF, CSV |
| W4 Verpflegung doppelt | behoben | Verpflegung zieht mit der Stärke mit; Abweichung als Bedarfsmarke am Meldekopf |
| W5 Kaltstart auf der Startseite | behoben | Zuletzt offene Sammlung öffnet wieder (12 Stunden) |
| W6 PDF ohne Quittung | behoben | „PDF gespeichert: <Dateiname>" im Übergabe-Dialog, Meldung nach Sammel-PDF und Lageblatt |
| W7 Quelle „manuell" | behoben | „Empfangen", „Manuell erfasst", „Aus Datei" |
| D1 Tabellen-Löschen ohne Frage | behoben | Rückfrage mit Namen wie in der Karte, Knopf abgerückt |
| D2 „Nur Stärke" setzt 0 | behoben | Rückfrage, Stärke/Unterbringung/Verpflegung aus den Karten vorbelegt, Karten als „nicht gezählt" gekennzeichnet |
| D3 ✕ ohne Frage | behoben | Rückfrage bei Erreichbarkeit und Ebene mit Inhalt, sprechende aria-labels |
| D4 Abrücken ohne Quittung | behoben | Quittung mit Uhrzeit und „Rückgängig", Gegenknopf an anderer Stelle |
| D5 Aufnehmen schließt eigenen Bogen | behoben | Eigener Bogen bleibt offen; empfangene Bögen werden nach dem Ablegen geschlossen |
| D6 Vorlage stumm gelöscht | behoben | Statuszeile mit „Rückgängig" |
| D7 Kein Papierkorb für eigenen Bogen | behoben | Verworfener Bogen liegt in der Rückholung |
| E1 Vorbelegung stapelt | behoben | Hinweis auf Schritt 1, Typwechsel ersetzt unbenannte Karten, „Vorbelegung entfernen" auf Schritt 3 und 4 |
| E2 Organisationswechsel löscht | behoben | Rückfrage mit Aufzählung des Verlusts |
| E3 Browser-Zurück verlässt die App | behoben | Schritte, Startseite, Einsatz und Scanner im Browser-Verlauf |
| E4 Unplausible Werte | behoben | Hinweise zu Ende vor Beginn, Stärke, Sitzplätzen, Betriebsstoff; Zeitpunkte als „27.09.2026, 18:00" |
| E5 Falscher Einsatz | behoben | „Verschieben…" an der Karte, mit Historie, Zeiten und Notiz |
| E6 Stehende Meldungen, Scanner schließt, Dubletten | behoben | Meldung je Handlung, Scanner bleibt nach Fehlcode offen, Dubletten in der Einfüge-Vorschau gekennzeichnet |
| G1 Sortierpfeile | behoben | 44 × 44 px (Feld 48), 8 px Abstand |
| G2 Chip-✕ | behoben | 32 px, Feld 44 px, Chips 44 px hoch |
| G3 Querformat | behoben | Formularfläche 211 px (Feld 179 px) statt 118 |
| G4 Kopf- und Fußzeilenziele | behoben | Rücksprung und Umschalter 44 px, Fußzeilenknöpfe 44 px mit 12 px Abstand |
| G5 Kästchen, Tabellenköpfe | behoben | Kästchen 24 px, ganze Kopfzelle antippbar |
| G6 Fußleiste über letztem Feld | behoben | Fokussierte Felder rollen über die Leiste, Übersichtsknöpfe 12 px Abstand |
| N1 Weißer Vollbild-QR | behoben | Nur Code und 24 px Ruhezone weiß, Grund folgt dem Thema |
| N2 Begleitseiten ohne Thema | behoben | Statikseiten übernehmen Thema bzw. Systemeinstellung |
| N3 Umschalter tief in der Einsatzansicht | behoben | Im Kopf der Einsatzansicht |
| N4 Systemeinstellung | behoben | Ohne gespeicherte Wahl startet die App bei System-Dunkel dunkel |
| N5 Taktisches Zeichen leuchtet | behoben | Gedimmt im Dunkel- und Nacht-Thema |
| O1 Voller Speicher | behoben | Ehrliche Statuszeile, Aufnahme scheitert sichtbar ohne Verlust des Bogens |
| O2 Beispielbögen offline | behoben | Beispielbögen im Offline-Cache |
| O3 Rückfrage vor Gleichheitsprüfung | behoben | Gleicher Inhalt wird ohne Frage quittiert |
| O4 Speicherstand | behoben | Anzeige in der Datensicherung, Warnung ab 70 % |
| S1 Stapel hält an | behoben | Im Stapel keine Rückfrage, Folgemeldung in der Quittung genannt |
| S2 Fremder Bogen als Entwurf | behoben | Empfang geht direkt in die Sammlung, letzte Sammlung öffnet wieder |
| S3 Plausible Fehlgriffe | behoben | Über F2, F3, D2, D4, E3, W1, W2 |
| S4 Lange Texte | behoben | Übergabe-Dialog gekürzt, Datenschutzfrist auf Schritt 2 eingeklappt |
| S5 Inline-Formulare | behoben | Zug und Notiz speichern beim Verlassen |
| A1 Übergabeblatt ohne Abgerückte | behoben | Block „Abgerückt" mit Zeiten, alle Bögen angehängt |
| A2 Nacherfassung stempelt „jetzt" | behoben | Eintreffzeit je Meldung korrigierbar |
| A3 Kein Anstoß zum Ausdruck | behoben | Knopf „Lageblatt (1 Seite)" |
| A4 Sammel-PDF wächst | behoben | Lageblatt als eine Seite, Bögen nur auf Wunsch |
| A5 Kennung nur über den Namen | behoben | Rückfrage bei gleichem Ort und anderer Kennung |
| K1 Bedarf nur als Summe | behoben | Bedarfsmarken je Karte, Tabellenspalte, Filter |
| K2 Kein Zeitbezug | behoben | Eintreff- und Abrückzeit, Marken „neu" und „alt" |
| K3 Lücken unsichtbar | behoben | Marke „n Lücken" mit Liste |
| K4 Drei Einheitenzahlen | behoben | „8 gemeldet · 6 zählend", Summenzeile mit derselben Zählweise |
| K5 Kein Auftrag | behoben | Auftrag/Notiz je Einheit auf Karte, Tabelle, CSV, PDF |
| K6 Liste unter dem Falz | behoben | Zwischensummen einklappbar, Filter gruppiert |

Folgearbeit, die das Format betrifft: `zeitraumBis` optional machen (F4) und
ein „keine Angabe" für das Geschlecht (F8). Beides ist ein Schemawechsel in
`vendor/eeb-format` mit Codec-Anpassung und berührt Arc42 4.5/8.4 sowie die
DSFA.
