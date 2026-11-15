# Audit Runde 13 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-26 · Zählung: P0 0 · P1 0 · P2 2 · P3 2

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf Port 4173 (Produktionsbuild, `vite preview`, Code-Stand
Commit `7637e61`, `main` nach Runde 12), Playwright mit Chromium (globales Modul, die Projektkopie fand keinen Browser),
Telefon 390 × 844 und 360 × 640, `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener Browser-Kontext. Zustände über
`localStorage`-Seeds aus den Übungsbögen (`uebung: false`). Voller Speicher auf zwei Wegen nachgestellt: `setItem`-Stub, der
beim Überschreiten einer Gesamtgröße `QuotaExceededError` wirft (Verkleinern bleibt erlaubt, wie im Browser), und echt
(Datei größer als das Kontingent des Browsers). Für Netzabbruch während des Vorratsladens und für den Update-Hinweis lief
zusätzlich ein eigener kleiner Dateiserver (Port 4180, Inhalt von `dist/`, abschaltbar, mit künstlicher Verzögerung und
einem Schalter, der `sw.js` um einen Kommentar ändert, um eine neue Fassung vorzutäuschen); er wurde nach den Läufen per PID beendet.

Nicht neu gemeldet sind die bekannten Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4),
die Reste aus Runde 10 (leere Karten bei „Nur Stärke“, Rückgängig für Meldungen überlebt Neuladen nicht, Tabellenzeilenhöhe
bei 180 × 320), Runde 11 (R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3) und Runde 12 (R12-W3, R12-H3, R12-O2,
R12-O4, R12-G3).

## Urteil

Die Offline-Fähigkeit trägt weiter, und alle Behebungen aus Runde 12 halten (Tabelle unten). Bei vollem Speicher melden jetzt
auch Zug zuordnen, Eintreffzeit ändern, Einsatzbeginn „Jetzt“, Neue Einsatz-Sammlung und Einsatz löschen den Zustand
ehrlich, der Bestand bleibt unverändert; Sammel-PDF, Lageblatt und CSV entstehen trotzdem und sagen es. Zwei Fenster
(Entwurf, entfernte Einheit) führen zu Rückfragen statt zu stillem Überschreiben.

Die Aufgaben „Einsatz führen, übergeben, sichern, auf einem zweiten Gerät einspielen“ gelingen ohne fremde Hilfe, mit einer
Ausnahme: Das **Einspielen einer zu großen Sicherung löscht zuerst die vorhandenen Daten und scheitert dann** (R13-O1).
Daneben zwei kleinere Lücken: eine Fehlermeldung außerhalb des Bildes (R13-O2) und ein Rat bei vollem Speicher, der bei leerem
Papierkorb ins Leere läuft (R13-O3).

## Nachprüfung der Behebungen aus Runde 12

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R12-O1 Eingabe bei im anderen Fenster entfernter Einheit | hält | Fenster A tippt „Pumpen Nord“ ins Feld Auftrag/Notiz, Fenster B entfernt die Einheit: A zeigt „Die Einheit „THW Crailsheim …“ wurde in einem anderen Fenster entfernt — Ihre Eingabe Auftrag/Notiz „Pumpen Nord“ wurde nicht gespeichert. Verstanden“ (nach 2 bis 3 s, Liste „3 gemeldet“) |
| R12-O3 Ablehnung des dauerhaften Speichers | hält | `persist()` = false: Satz „Der Browser hat den dauerhaften Speicher abgelehnt — regelmäßig sichern; auf iPhone und iPad … Home-Bildschirm“ (390 und 360) |
| R12-O4 Quittung der Sicherung (Teilfassung) | hält | „Sicherung „eeb-sicherung-2026-10-26.json“ erzeugt — liegt im Download-Ordner. Gesichert ist sie erst, wenn sie auf einem zweiten Gerät oder Datenträger liegt.“ und „Sie enthält 1 Einsatz, 4 Meldungen; seitdem ist nichts Neues dazugekommen.“ (Rest, keine Anzeige in der Einsatzansicht, bleibt bekannte Grenze) |
| R12-G1/G2 Sperre bei Rückfragen | hält, mit Beobachtung | Ein Tipp auf „Meldung entfernen“ in den ersten rund 0,3 s nach Öffnen der Rückfrage bleibt wirkungslos (Dialog bleibt offen, nichts entfernt); nach 1,5 s geht er. Als gewollte Sperre gewertet, nicht gemeldet. |
| Sicherung einspielen, Rückfrage | hält | Gegenüberstellung „geht dabei verloren / in der Datei“ nennt Sammlungen, Papierkorb, Vorlagen, Entwurf, Absenderkarte, Schlüssel; Haken „Ja, die Daten dieses Geräts durch die Sicherung ersetzen“ nötig |

## Befunde

### P2

#### R13-O1 – „Sicherung einspielen“ löscht zuerst die Daten des Geräts und scheitert dann am Speicher: Gerät danach leer, Fehler in Browser-Englisch (gemessen)

- **Priorität:** P2
- **Kennzeichnung:** gemessen bei 390 × 844, echter Browser, ohne Stub: Gerät mit dem Einsatz „Vorhandener Einsatz“ (2
  Meldungen), Sicherungsdatei „sicHuge.json“ mit einem Einsatz von 1955 Meldungen (6,8 Mio. Zeichen, größer als das
  Kontingent von rund 5 Mio. Zeichen). Zweite Messung mit `setItem`-Stub (Gerät fast voll, Datei größer als der freie Platz):
  gleiches Ergebnis.
- **Fundstelle:** Fußzeile → „Datensicherung“ → „Sicherung einspielen…“ → Datei wählen → Rückfrage „Sicherung einspielen?“
  → Haken → „Einspielen und ersetzen“.
- **Beobachtung:** Die Rückfrage nennt den Verlust („Sammlung „Vorhandener Einsatz“ mit 2 Meldungen … geht dabei
  verloren“) und die Datei („Sammlung „Riesen-Einsatz“ mit 1955 Meldungen“), prüft aber nicht, ob die Datei auf das Gerät
  passt. Nach der Bestätigung steht im Dialog „Datensicherung“ nur der rohe Browser-Text „Failed to execute 'setItem' on
  'Storage': Setting the value of 'eeb.einsaetze.v1' exceeded the quota.“ (englisch, ohne Hinweis, was nun mit den Daten ist).
  Der Speicher enthält danach nur noch `eeb.uhr.v1`: Der vorhandene Einsatz ist weg, die Datei ist nicht eingespielt. Im
  Quelltext (`sicherungEinspielen`) werden erst alle `eeb.`-Schlüssel entfernt und dann die Schlüssel der Datei geschrieben;
  einen Rückfall bei Fehlschlag gibt es nicht.
- **Erwartung der Rolle:** Entweder prüft die App vor dem Löschen, ob die Datei passt („Die Datei ist größer als der
  Speicher dieses Geräts — sie lässt sich hier nicht einspielen“), oder sie lässt die alten Daten stehen, wenn das
  Schreiben scheitert. Die Fehlermeldung sagt auf Deutsch, ob die Daten dieses Geräts noch da sind.
- **Folge:** Wer eine Sicherung von einem Gerät mit größerem Kontingent (etwa Desktop-Fassung, anderer Browser, anderes
  Betriebssystem; die Kontingente der Browser sind verschieden) auf ein anderes Gerät einspielt, verliert dort alles, was
  vorher lag, und hat danach weder die alten noch die neuen Daten. Das Risiko ist begrenzt (Haken und Rückfrage vorab,
  „Vorher Sicherung erstellen…“ als Ausweg, Datei bleibt erhalten), trifft aber genau den Umzug auf ein anderes Gerät nach
  einem Ausfall, also die Lage, für die die Sicherung gedacht ist. Ich habe nicht geprüft, ob reale Sicherungen die
  Kontingente verschiedener Geräte überschreiten; belegt ist nur das Verhalten bei zu großer Datei.
- **Empfehlung:** Größe der Datei vor dem Löschen gegen den freien Platz prüfen und bei Überschreitung in der Rückfrage
  benennen; bei Fehlschlag die vorherigen Daten wiederherstellen und mit einem deutschen Satz melden („Nicht eingespielt:
  Der Speicher dieses Geräts reicht nicht. Ihre bisherigen Daten sind unverändert.“).
- **Nachprüfung:** Datei erzeugen, die größer als das Kontingent ist, auf einem Gerät mit Daten einspielen: Hinweis vor dem
  Löschen oder unveränderter Bestand mit deutscher Meldung.

#### R13-O2 – Fehlermeldung zu einem nicht geladenen Übungsbogen steht hinter der Liste, außerhalb des Bildes (gemessen)

- **Priorität:** P2
- **Kennzeichnung:** gemessen bei 390 × 844 und 360 × 640, Vorrat unvollständig (eigener Server, Verbindung nach 28 von 549
  Dateien getrennt; die Liste zeigt je Bogen „nicht geladen“).
- **Fundstelle:** Fußzeile → „Übungsbögen“ → Organisation (z. B. THW) → Zeile „001-albstadt-ztr-tz“ → „Anzeigen“, „PDF“
  oder „Link“.
- **Beobachtung:** Nach dem Tipp ändert sich im sichtbaren Bild nichts (Aufnahme nach 2,5 s). Der Satz „Bogen konnte nicht
  geladen werden: Dieser Übungsbogen liegt noch nicht auf dem Gerät — Übungsbögen werden nach dem ersten Laden mit Netz
  nachgeladen (siehe Offline-Zeile der Startseite).“ steht im Quelltext als `<p class="fehler">` hinter der Tabelle, ohne
  `role="alert"`/`status`, und die Liste rollt nicht dorthin. Abstand zur Oberkante des Bildes: bei THW (101 Bögen) rund
  18 300 px bei 390 × 844 und rund 24 700 px bei 360 × 640; selbst bei ASB (4 Bögen) liegt sie bei 949 px, also unter dem
  unteren Bildrand von 844 px. Die frühere Beobachtung („im Bild“, R5/R6/R8) trifft nur bei sehr kurzen Listen zu.
- **Erwartung der Rolle:** Die Rückmeldung erscheint an der angetippten Zeile oder rollt ins Bild, wie es R4-O2 beim PDF-
  Baustein behoben hat.
- **Folge:** Wer ohne Netz einen Übungsbogen als Vorlage öffnen will, tippt „Anzeigen“, sieht nichts und tippt erneut,
  oder wechselt zu „PDF“ und „Link“ mit demselben Ergebnis. Er hält die App für hängend, statt zu erfahren, dass der Bogen
  erst mit Netz kommt. Nur Übung und Vorbelegung betroffen, keine Einsatzdaten.
- **Empfehlung:** Meldung an der Zeile selbst zeigen oder ins Bild rollen und als Statusmeldung auszeichnen; in der Liste
  die Knöpfe bei „nicht geladen“ mit dem Grund beschriften.
- **Nachprüfung:** Vorrat unvollständig, Netz weg, „Anzeigen“ in der THW-Liste tippen: Satz erscheint im sichtbaren Bild.

### P3

#### R13-O3 – Bei vollem Speicher und leerem Papierkorb nennt der Rat nur Wege, die es nicht gibt (gemessen)

- **Priorität:** P3
- **Kennzeichnung:** gemessen bei 390 × 844 mit `setItem`-Stub (Gesamtgröße darf nicht wachsen, Verkleinern ist erlaubt).
- **Fundstelle:** Startseite → Einsatz → „Löschen…“ → „In den Papierkorb“; ebenso an der Karte.
- **Beobachtung:** Mit einem Einsatz und leerem Papierkorb meldet die App „Nicht gelöscht: Der Speicher dieses Geräts nimmt
  nichts mehr an … Platz schafft nur Löschen: nicht mehr benötigte Einsätze sichern, den Papierkorb leeren oder einen
  gesicherten Einsatz dort endgültig löschen.“ „Papierkorb leeren“ und „dort endgültig löschen“ gibt es nicht, der Papierkorb
  ist leer; „Einsätze sichern“ schafft keinen Platz. Der eigentliche Weg steht nicht da: In der Einsatzansicht „Mehr… →
  Entfernen“ verkleinert den Bestand (gemessen: danach ging „In den Papierkorb“ durch und der Einsatz lag im Papierkorb),
  ebenso „Alle Daten löschen“.
- **Erwartung der Rolle:** Ein Rat, der zum Zustand passt: bei leerem Papierkorb Einheiten entfernen oder alle Daten
  nach Sicherung löschen.
- **Folge:** Gering. Der Helfer sucht einen Papierkorb, der leer ist, und greift im Zweifel zu „Alle Daten löschen“, dem
  gröbsten Mittel. Selten (der Speicher muss bis auf wenige Zeichen voll sein; die App warnt ab 70 % in der Datensicherung).
- **Empfehlung:** Den Rat nach Zustand wählen und bei leerem Papierkorb das Entfernen einzelner Meldungen nennen.
- **Nachprüfung:** Speicher voll, Papierkorb leer, „In den Papierkorb“ tippen: Meldung nennt einen Weg, der Platz schafft.

#### R13-O4 – „Neu laden“ im Update-Hinweis bleibt wirkungslos, wenn die Seite seit der Erstinstallation offen ist (gemessen, Nachbau)

- **Priorität:** P3
- **Kennzeichnung:** gemessen bei 390 × 844 mit eigenem Server (neue Fassung durch geänderte `sw.js`), Browser-Kontext
  ohne vorherigen Besuch; Gegenprobe mit Neuladen vor dem Update.
- **Fundstelle:** Banner „Neue Version verfügbar. Neu laden · Später“ am oberen Rand.
- **Beobachtung:** Seite beim ersten Besuch geöffnet, nicht neu geladen, nach 17 s kommt die neue Fassung, das Banner
  erscheint. Tipp auf „Neu laden“ (44 px hoch, Touch): der wartende Service Worker wird aktiv (`waiting` false), die Seite
  lädt aber nicht neu (Marker in `window` bleibt), das Banner bleibt stehen, ein zweiter Tipp tut nichts. Mit vorherigem
  Neuladen (Seite schon vom Service Worker gesteuert) lädt „Neu laden“ die Seite neu, Banner weg. Eingabe im offenen Feld wird
  beim Tipp gesichert (Auftrag/Notiz im Speicher). Ursache im Quelltext der Registrierung: Das Neuladen hängt an einem
  Ereignis, das nur kommt, wenn die Seite beim Registrieren schon gesteuert war.
- **Erwartung der Rolle:** Nach „Neu laden“ läuft die neue Fassung oder das Banner nennt, dass die Seite von Hand neu geladen
  werden muss.
- **Folge:** Gering und selten (eine bis zum Update ununterbrochen offene Erstinstallations-Sitzung, etwa auf einem Tablet am
  Meldekopf). Der Helfer glaubt, aktualisiert zu haben, und arbeitet mit der alten Fassung weiter; das Banner wirkt kaputt.
  Die Daten sind nicht betroffen.
- **Empfehlung:** Nach „Neu laden“ in jedem Fall neu laden, oder das Banner auf „Bitte Seite neu laden“ umstellen, wenn
  nichts geschieht.
- **Nachprüfung:** Erstbesuch ohne Neuladen, neue Fassung ausliefern, „Neu laden“ tippen: Seite lädt neu, Banner verschwindet.

## Bestätigtes (ohne Befund)

- Voller Speicher (Stub): Zug zuordnen („Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll …“), Eintreffzeit
  ändern (Dialog „Zeit ändern“ mit Grund, Wert unverändert), Einsatzbeginn „Jetzt“ („Der Beginn konnte nicht gespeichert werden
  (Speicher voll oder gesperrt).“), Neue Einsatz-Sammlung („Sammlung nicht angelegt“), Einsatz löschen („Nicht gelöscht“):
  jeweils Meldung, Speicherinhalt unverändert. Sammel-PDF, Lageblatt und CSV werden trotzdem erzeugt und quittiert.
- Sicherung auf dem Gerät: Rundlauf Gerät A → Datei → Gerät B; die Rückfrage vor dem Ersetzen führt Papierkorb, Vorlagen,
  Entwurf, Absenderkarte und Schlüssel auf beiden Seiten auf.
- Zwei Fenster, eigener Entwurf: Fenster A zeigt nach dem Ändern in B „⚠ Hier wird nichts gespeichert. Das andere Fenster hat
  den Bogen geändert: Einheit (dort: …, hier: …)“ mit „Anderen Stand laden“; im Speicher steht der Stand von B.
- Vorratsladen mit unterbrochener Leitung (eigener Server, nach 100 von 549 Dateien getrennt): Zeile wechselt auf „… 100
  von 549 da, das Netz hakt — der nächste Versuch läuft von selbst“; nach Neuladen bleibt „Offline bereit … werden
  nachgeladen (100 von 549)“; bereits geladene Themenseiten öffnen ohne Netz.

## Nicht prüfbar

Ob eine Sicherung eines Geräts mit größerem Kontingent in der Praxis vorkommt (R13-O1 belegt nur das Verhalten bei zu großer
Datei); echtes Räumen des Speichers durch den Browser; Kamera-Scan, Nahbereich; ob ein auf einem anderen Gerät erfasster
Stand des Zusatz-Vorrats (`eeb.offline-zusatz.v1`, wandert in der Sicherung mit) nach dem Einspielen die Offline-Zeile
falsch zeigt — im Nachbau füllte der Service Worker den Vorrat sofort wieder auf, ein Fehlstand ließ sich nicht herstellen;
Bildschirmtastatur und native Builds.

## Abschluss

- **Aufgabe geschafft:** ja, mit Umweg bei der Sicherung (ein Einspielen mit zu großer Datei bricht ab).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Einspielen und ersetzen“ liest sich wie ein Tausch, ist aber erst Löschen und dann Schreiben;
  scheitert das Schreiben, ist nichts mehr da (R13-O1).
- **Größtes Einsatzrisiko:** Das Einspielen einer Sicherung, die nicht auf das Gerät passt, hinterlässt ein leeres Gerät und
  eine englische Fehlermeldung (R13-O1).
- **Top-Priorität für die nächste Iteration:** R13-O1: Größe vor dem Löschen prüfen und bei Fehlschlag den Bestand
  wiederherstellen.
