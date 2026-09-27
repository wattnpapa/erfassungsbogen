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
