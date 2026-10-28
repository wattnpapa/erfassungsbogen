# Audit Runde 18 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-27 · Zählung: P0 0 · P1 0 · P2 1 · P3 0

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf Port 4173 (Produktionsbuild, Code-Stand `ae3a8e9`, `main`),
Playwright mit Chromium (globales Modul), Telefon 390 × 844 und 360 × 640, `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener
Browser-Kontext. Netz weg über `context.setOffline`, CPU-Last über `Emulation.setCPUThrottlingRate`, zwei Tabs im selben Kontext,
gesperrter Browser-Speicher über einen Init-Script-Stub (`localStorage` wirft `SecurityError`, wie im privaten Modus), voller Speicher
durch Auffüllen von `localStorage` bis zum echten Quota-Fehler. Einsätze, Bögen, Sicherung und Sammel-PDF über die Oberfläche
(Beispielbögen aus `examples/thw`).

Nach dem Auftrag gelten keine „bekannten Grenzen“ mehr als ausgenommen. Gemeldet ist alles, was im Browser noch zu beobachten war.

## Urteil

Die Offline-Fähigkeit trägt. Alle Behebungen aus Runde 17, die diese Rolle berühren, halten. Ich fand keinen Datenverlust, keine
Duplikate und keinen blockierten Ablauf bei Funkloch, Neuladen, Zurück-Geste, vollem Speicher, Parallelzugriff und Sicherung. Eine
Lücke bleibt in einem Randfall, der bisher nie geprüft wurde: Wenn der Browser das Speichern ganz verweigert (privates Fenster), tut
„Einsatz anlegen“ scheinbar nichts. Die Aufgabe „Einsatz führen, Bögen einlesen, Netz weg, neu laden, Sammel-PDF und Sicherung
erzeugen“ gelingt ohne fremde Hilfe.

## Nachprüfung der Behebungen (Runde 17 und ältere)

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R17-O1 / R15-O1 Sammel-PDF ohne Fortschritt | hält | 30 Bögen, CPU 6-fach: „1 von 30 … 26 von 30 Bögen vorbereitet“, Zeitangabe „etwa 35 Sekunden“, tatsächlich 38,6 s; Hinweis „Nicht noch einmal tippen“; Datei `eeb-einsatz-…_Hochwasser_Test.pdf`. |
| R17-O2 / R14-S2 aufgeklappte Karte nach Neuladen | hält | Karte aufgeklappt, Neuladen offline: `aria-expanded=true` weiter 1, Bildlaufstelle 1393 → 1393 px. |
| Doppeltipp | hält | „Einsatz anlegen“, „Abrücken“, „Meldung entfernen“, „Zurückholen“, „Einspielen und ersetzen“ je mit `dblclick`: genau ein Einsatz, ein Abrücken, eine entfernte, eine zurückgeholte Meldung. |
| Zurück-Geste | hält | Einsatz → Startseite; Assistent Schritt 3 → 2 → 1 → Startseite mit „Fortsetzen“; kein Verlassen der App vor der Startseite. |
| Neuladen im Assistenten, offline | hält | Entwurf „vom … wiederhergestellt“, Ort erhalten, „Fortsetzen“ öffnet ihn. |
| Papierkorb für entfernte Meldungen | hält | „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar“ überlebt Neuladen offline; „Zurückholen“ stellt Nr. 1 an der alten Stelle wieder her, Quittung „Meldung … zurückgeholt“. |
| Voller Speicher (Einlesen, Abrücken, Entwurf) | hält | Einlesen: „Nicht aufgenommen: 2 Bögen — der Speicher dieses Geräts ist voll …“, Bestand unverändert; Abrücken bei 0 freien Bytes: „Speichern fehlgeschlagen“, Status bleibt 0 auch nach Neuladen; Entwurf: „⚠ Nicht gespeichert — der Speicher dieses Geräts ist voll“ mit „Was tun?“. |
| Parallele Änderungen in zwei Tabs | hält | Drei Bögen aus zwei Tabs: beide Tabs und der Speicher zeigen 3, nichts überschrieben. |
| Sicherung und Wiederherstellung | hält | Sicherung offline erzeugt (Quittung „Gesichert ist sie erst, wenn sie auf einem zweiten Gerät oder Datenträger liegt“), Speicher geleert, eingespielt: „Sicherung eingespielt“. |
| Einsatz-Import (Sammel-PDF) | hält | Offline importiert: „3 Einheiten, davon 3 anwesend“. Erneut mit lokal geändertem Stand (eine Einheit abgerückt): „Datei war älter oder gleich: keine Änderung übernommen, dieser Stand bleibt.“ |
| Vorratsanzeige / Themenseiten offline | hält | Netz bei 0,5 s weg: ehrlicher Satz „fehlen noch (191 von 549), sie folgen beim nächsten Netz“; Anleitung, Fachgruppe Räumen, Feuerwehr und Beispielbögen-Auswahl (Katastrophenschutz → Länderliste) laden offline. |
| Browser sperrt Speicher, Entwurf | hält | „⚠ Nicht gespeichert — dieser Browser lässt die App nichts speichern. Jetzt „Bogen übergeben“ (PDF).“ |
| Tabelle am Telefon (360 px) | hält | Tabelle 326 px in 360 px, kein Seitenüberlauf, Kernspalten Einheit/Stärke/Meldung vor/Bedarf. |
| Layoutsprung der Startseite (R17-H1) | hält | Layout-Shift beim Erstbesuch und Neuladen bei 4-facher CPU-Drosselung: 0,0004 bis 0,0008, unterhalb der Wahrnehmung. |

## Befunde

### P2

#### R18-O1 – „Einsatz anlegen“ scheitert bei gesperrtem Browser-Speicher ohne Rückmeldung an der Stelle des Tippens

- **Priorität:** P2
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** neu (Randfall war in Runde 11 bis 17 nicht geprüft; verwandt mit dem Entwurfs-Hinweis „dieser Browser lässt die App nichts speichern“, der dort greift, hier aber nicht)
- **Ort:** Startseite → „Neue Einsatz-Sammlung…“ → Name eintragen → „Einsatz anlegen“, in einem Browser, der `localStorage` verweigert (privates Fenster, Datenschutz-Einstellung).
- **Beobachtung:** Der Dialog schließt sich, die Startseite bleibt stehen, kein Einsatz öffnet sich und keiner entsteht (auch nicht nur im Arbeitsspeicher). Es gibt keine Quittung an der Stelle des Tippens. Die einzige Erklärung ist der Warnkasten „⚠ Dieser Browser lässt die App gerade nichts speichern …“ weiter oben auf der Seite: nach dem Tipp steht er 434 px über dem sichtbaren Bereich (Bildlaufstelle 748 px, Kasten bei −434 px, 261 px hoch, nicht angeheftet). Direkt am Tippziel steht dagegen der grüne Satz „✓ Jetzt offline bereit …“.
- **Erwartung der Rolle:** Entweder öffnet sich der Einsatz mit Hinweis „wird nur bis zum Schließen gehalten“, oder der Dialog bleibt offen und nennt den Grund.
- **Folge:** Ein Helfer im privaten Fenster (häufig auf iPhones) tippt wiederholt auf „Einsatz anlegen“, hält die App für defekt oder wechselt zu Papier, ohne den Grund zu erfahren. Der Hinweis „Bögen als PDF übergeben“ erreicht ihn nicht.
- **Empfehlung:** Bei gesperrtem Speicher den Dialog offen lassen und die Ursache im Dialog nennen, oder den Einsatz im Arbeitsspeicher führen (mit angeheftetem Hinweis „geht beim Schließen verloren“, wie beim Bogen-Entwurf). Mindestens den Warnkasten beim Fehlschlag in den sichtbaren Bereich holen.
- **Verifikation:** Browser mit gesperrtem Speicher, „Einsatz anlegen“ antippen: Der Grund ist ohne Bildlauf lesbar, oder der Einsatz öffnet sich mit dauerhaft sichtbarem Hinweis.

## Nicht prüfbar

Echte Funkloch-Übergänge auf dem Telefon (Playwright schaltet das Netz hart ab), iOS-Safari mit geräumtem Speicher oder Speicher-Räumung durch das Betriebssystem, Hintergrund-Beenden durch das Betriebssystem, Kamera-Scan, native Builds, der Ablauf der 7 und 30 Tage im Papierkorb (nur Rückholen und der Bestand nach Neuladen geprüft).

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Wer im privaten Fenster „Einsatz anlegen“ tippt und nichts passiert, hält die App für kaputt (R18-O1).
- **Größtes Einsatzrisiko:** Keines über P2; das stille Scheitern des Einsatz-Anlegens bei gesperrtem Speicher (R18-O1).
- **Top-Priorität für die nächste Iteration:** R18-O1: Grund am Tippziel nennen oder Einsatz im Arbeitsspeicher führen.
