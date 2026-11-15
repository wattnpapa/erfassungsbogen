# Audit Runde 14 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-26 · Zählung: P0 0 · P1 0 · P2 1 · P3 1

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf Port 4173 (Produktionsbuild, `vite preview`, Code-Stand
Commit `429c41a`, `main` nach Runde 13), Playwright mit Chromium (globales Modul, die Projektkopie fand keinen Browser),
Telefon 390 × 844, für die Dialoge der Datensicherung zusätzlich 360 × 640, `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein
eigener Browser-Kontext. Zustände über die Oberfläche (Einsatz anlegen, Übungsbögen als JSON einlesen, `uebung: false`)
und über `localStorage`. Voller Speicher mit `setItem`-Stub (Wachsen wirft `QuotaExceededError`, Verkleinern bleibt erlaubt) und
echt (Datei größer als das Kontingent). Für unvollständigen Vorrat und für den Update-Hinweis lief ein eigener kleiner
Dateiserver (Port 4181, Inhalt von `dist/`, mit Abbruch nach N Anfragen und einem Schalter, der `sw.js` um einen Kommentar
ändert); er wurde nach den Läufen über seine PID beendet. Zeitläufe mit der Uhr-Attrappe von Playwright und mit echter Wartezeit.

Nicht neu gemeldet sind die bekannten Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4),
die Reste aus Runde 10 (leere Karten bei „Nur Stärke“, Rückgängig für Meldungen überlebt Neuladen nicht, Tabellenzeilenhöhe bei
180 × 320), Runde 11 (R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3), Runde 12 (R12-W3, R12-H3, R12-O2, R12-O4,
R12-G3) und Runde 13 (R13-W1 Vergleichsbasis in Dialog und Quittung, R13-W6 kein Zustand „beendet“, R13-H1 keine Knöpfe mit
nächsten Typen).

## Urteil

Die Offline-Fähigkeit trägt weiter, und alle vier Behebungen aus Runde 13 halten. Neu gefunden sind zwei Stellen, an denen
die App etwas Falsches über ihren eigenen Stand behauptet: Die Altersangaben der Einsatzansicht bleiben ohne Berührung
stehen (R14-O1, P2), und eine eingespielte Sicherung übernimmt die Vorratsanzeige des Herkunftsgeräts (R14-O2, P3).
Datenverlust, doppelte Datensätze oder blockierte Abläufe habe ich nicht gefunden. Die Aufgaben „Einsatz führen, übergeben,
auf einem zweiten Gerät einspielen, sichern, wiederherstellen“ gelingen ohne fremde Hilfe.

## Nachprüfung der Behebungen aus Runde 13

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R13-O1 Sicherung einspielen bei zu großer Datei | hält | Gerät mit Einsatz „Vorhandener Einsatz“ (2 Meldungen), Datei mit 6,5 Mio. Zeichen Nutzlast, bei 390 und 360 breit: Rückfrage mit Haken, dann „Nicht eingespielt: Der Speicher dieses Geräts reicht für diese Sicherung nicht. Ihre bisherigen Daten auf diesem Gerät sind unverändert.“ (`role="alert"`, bei 360 × 640 im Dialog sichtbar, Dialog rollt). Speicherschlüssel und Größen vorher und nachher gleich; nach Neuladen steht der Einsatz noch da. |
| R13-O2 Fehlermeldung beim nicht geladenen Übungsbogen | hält | Vorrat bei 150 von 549 Anfragen abgebrochen, Netz weg, THW-Liste → „Anzeigen“ am ersten Bogen: `role="alert"` „Bogen konnte nicht geladen werden: Dieser Übungsbogen liegt noch nicht auf dem Gerät …“ bei 675 bis 795 px von 844 px, also im Bild. |
| R13-O3 Rat bei vollem Speicher und leerem Papierkorb | hält | Einsatz löschen → „In den Papierkorb“ mit Stub: „Der Speicher ist voll, der Papierkorb leer — der Einsatz ist nicht gelöscht. Erst sichern … Platz schafft nur Verkleinern: unter „Mehr…“ Meldungen oder Einheiten entfernen, zuletzt „Alle Daten löschen“ (nach der Sicherung).“ Hinweis: Der Dialog bei Abrücken mit vollem Speicher nennt weiter „den Papierkorb leeren“, obwohl der Papierkorb leer ist; der Satz ist dort allgemein gehalten und führt nicht in die Irre (kein eigener Befund). |
| R13-O4 „Neu laden“ nach Erstinstallation | hält | Eigener Server, Seite nach Erstbesuch offen, neue `sw.js` nach 6 s: Banner „Neue Version verfügbar. Neu laden · Später“; Tipp auf „Neu laden“: Seite lädt nach höchstens 3,5 s neu (Marker in `window` weg), Banner weg. |

## Weiter geprüft, ohne Befund

- **Zwei Fenster, Sammlung:** Fenster B nimmt einen dritten Bogen auf, das veraltete Fenster A rückt danach eine Einheit ab: Im
  Speicher stehen alle drei Bögen, die Abrückzeit der einen, A zeigt sofort „3 gemeldet · 2 zählend“. Kein Überschreiben.
- **Zwei Geräte, derselbe Einsatz:** Gerät A rückt Crailsheim ab und gibt die Sammel-PDF weiter; Gerät B rückte inzwischen
  Albstadt ab. Nach dem Einlesen auf B stehen beide als abgerückt, Quittung „1 Meldung aktualisiert: Crailsheim abgerückt 09:22“,
  „davon 0 anwesend“. Dieselbe Datei dreimal eingelesen: einmal „übernommen“, danach „keine neue Einheit … Datei war älter oder
  gleich: keine Änderung übernommen“; es bleibt eine Sammlung. Eine Sammel-PDF über „Bögen einlesen…“ in einer fremden Sammlung
  löst die Rückfrage „Sammel-PDF einer anderen Sammlung“ aus, nichts wird still angehängt.
- **Voller Speicher (Stub):** „Zur Kenntnis genommen“ („Kenntnisnahme nicht gespeichert … erscheinen nach dem Neuladen aber
  wieder als „neu““), Abrücken („Speichern fehlgeschlagen“, Einheit bleibt anwesend), Einsatz löschen: jeweils Dialog, Bestand
  unverändert; PDF, CSV, Excel und Lageblatt entstehen ohne Netz und ohne frei gewordene Chunks.
- **Beschädigter Speicher:** Abgeschnittenes JSON in `eeb.einsaetze.v1`, `eeb.entwurf.v1`, `eeb.vorlagen.v1` und ein Bogen ohne
  Inhalt: Startseite erscheint jeweils, Hinweis „Nicht lesbar: Sammlung „Kaputt“ … Liegt beiseite“ bzw. „Ein Bogen ließ sich nicht
  öffnen — beiseitegelegt, nicht gelöscht“, Rohtext liegt unter `eeb.unlesbar.v1` bzw. `eeb.entwurf.beschaedigt.v1`. Je vier
  fehlerhafte Werte (`{bad`, `null`, `{}`, `[null]`) für 28 `eeb.`-Schlüssel: kein Seitenfehler, die Sammlung bleibt sichtbar.
- **Speicher gesperrt:** `localStorage` wirft `SecurityError`: Startseite erscheint mit Satz „Dieser Browser lässt die App gerade
  nichts speichern … neue Eingaben gehen beim Schließen verloren … bis dahin Bögen als PDF übergeben.“
- **Geräteuhr:** 95 und 125 Tage vorgesprungen: „⚠ Geräteuhr prüfen … Bis du antwortest, löscht und anonymisiert die App nichts“,
  Sammlung bleibt mit 12 Personen erhalten.
- **Entwurf bei hartem Abbruch:** Tab ohne `beforeunload` geschlossen 0, 150, 400 und 1000 ms nach der Eingabe: Der Ort steht
  jedes Mal im Entwurf.
- **Doppeltipp:** „Einsatz anlegen“ doppelt angetippt: eine Sammlung.
- **Link ohne Netz:** Bogen-Link bei vorhandener Sammlung und ohne Netz geöffnet: Dialog „Wohin damit?“ mit „In „…“ aufnehmen“.
- **Lagemonitor ohne Netz:** Zweites Fenster zeigt den Stand und folgt dem Abrücken im Hauptfenster; nach Neuladen offline bleibt
  der Stand erhalten.
- **Sicherung:** Rundlauf Gerät A → Datei → Gerät B (offline): alle `eeb.`-Schlüssel des Geräts stehen in der Datei, die
  Rückfrage nennt beide Seiten; `eeb.uhr.v1` bleibt beim Gerät.

## Befunde

### P2

#### R14-O1 – Die Altersangaben der Einsatzansicht laufen nicht mit: „gerade eben“ bleibt stunden­lang stehen, die Warnmarken „älter als 1 Std“ erscheinen erst nach einer Berührung (gemessen)

- **Priorität:** P2
- **Kennzeichnung:** gemessen bei 390 × 844. Echte Wartezeit: Einsatz mit einem Bogen, Seite 155 s unberührt. Zweite Messung
  mit Uhr-Attrappe (`page.clock`): 3 Stunden vorspulen. Gegenprobe: Der Lagemonitor hat einen eigenen Takt und ist nicht betroffen.
- **Fundstelle:** Einsatzansicht, Kopfzeile „Einsatz · letzte Meldung 26.10.2026, 09:25 (gerade eben)“, Marken „⚠ Meldung vor …“
  an den Karten, Altersspalte der Tabelle, Satz „⚠ älteste Meldung vor … 2 von 2 älter als 1 Std“, Startseite „Letzte Meldung …
  (vor 4 Min)“.
- **Beobachtung:** Direkt nach dem Einlesen steht „letzte Meldung 26.10.2026, 09:25 (gerade eben)“. Nach 75 und nach 155 s ohne
  Berührung steht dort unverändert „(gerade eben)“. Mit vorgespulter Uhr (3 Stunden ohne Berührung) ebenso, und es erscheint
  keine Warnmarke. Ein Wechsel „Tabelle“ → „Karten“ aktualisiert sofort: „letzte Meldung ⚠ 26.10.2026, 10:00 (vor 3 Std 0 Min) ·
  ⚠ älteste Meldung vor 3 Std 0 Min, 2 von 2 älter als 1 Std“. `focus`, `visibilitychange`, `online`, `pageshow` und ein
  `storage`-Ereignis lösen keine Aktualisierung aus. Im Quelltext rechnet die Einsatzansicht das Alter bei jedem Zeichnen mit
  `Date.now()` neu; es gibt dort keinen Takt (nur `lagemonitor-ui.tsx` und die Offline-Zeile haben einen).
- **Erwartung der Rolle:** Ein Gerät, das am Meldekopf aufgeschlagen liegt, zeigt von selbst, dass die letzte Meldung inzwischen
  eine Stunde alt ist; mindestens bei Rückkehr in die App oder beim Entsperren des Telefons stimmt die Angabe.
- **Auswirkung im Einsatz:** Die Marken „älter als 1 Std“ und „vor n Std“ sind die Schutzvorrichtung gegen veraltete Lagebilder
  (R11-K1, R12-K2). Sie wirken aber nur, wenn jemand die Ansicht ohnehin berührt. Wer nach einer Stunde Funkloch auf das liegen
  gelassene Gerät schaut, liest „gerade eben“ und ein Lagebild ohne Warnung, obwohl seit einer Stunde nichts mehr eingegangen ist.
  Genau dieser Fall — kein Netz, keine neuen Meldungen, Gerät liegt offen — ist der, in dem die Altersangabe etwas sagen soll.
  Nicht betroffen: Zahlen, Stärken und Bedarf (die ändern sich nicht mit der Zeit); Lagemonitor.
- **Empfehlung:** Die Altersangaben der Einsatzansicht und der Startseite mindestens je Minute und bei Rückkehr in die
  Sichtbarkeit neu berechnen lassen, wie es der Lagemonitor tut.
- **Verifikation:** Einsatz mit einer Meldung öffnen, Seite 70 s unberührt lassen: „(vor 1 Min)“. Uhr 61 Minuten vorspulen
  ohne Berührung: Warnmarke „älter als 1 Std“ steht von selbst da.

### P3

#### R14-O2 – „Sicherung einspielen“ übernimmt den Vorratsstand des Herkunftsgeräts: Die Offline-Zeile meldet „komplett offline“, obwohl Übungsbögen auf diesem Gerät fehlen (gemessen)

- **Priorität:** P3
- **Kennzeichnung:** gemessen bei 390 × 844 mit eigenem Server (Vorrat bei 150 Anfragen abgebrochen, 135 Einträge im
  Cache statt rund 628); zweite Messung ohne eigenen Server, nur Vergleich der Anzeige. Die Heilung nach Rückkehr des Netzes
  wurde ebenfalls gemessen.
- **Fundstelle:** Startseite, grüne Offline-Zeile; Fußzeile → „Datensicherung“ → „Sicherung einspielen…“; „Übungsbögen“.
- **Beobachtung:** Vor dem Einspielen steht „✓ Jetzt offline bereit für Bogen, PDF, QR-Code und Empfang. Übungsbögen und
  Themenseiten: 57 von 549 da, das Netz hakt — der nächste Versuch läuft von selbst“; `eeb.offline-zusatz.v1` hat
  `{"fertig":57,"gesamt":549}`. Die Sicherung von Gerät A trägt `{"fertig":549,"gesamt":549}` und überschreibt den Wert.
  Danach steht dort „✓ Funktioniert komplett offline — alle Daten bleiben auf diesem Gerät.“, der Cache hat unverändert 135
  Einträge, und in der THW-Liste sind 101 von 102 Zeilen „nicht geladen“. Mit Netz holt der Dienst den Rest nach (nach
  Neuladen und 30 s: 628 Einträge); ohne Netz bleibt die Zeile falsch.
- **Erwartung der Rolle:** Die Offline-Zeile beschreibt, was auf diesem Gerät liegt, nicht was auf dem Gerät lag, von dem die
  Sicherung stammt.
- **Auswirkung im Einsatz:** Gering. Betroffen sind nur Übungsbögen und Vorbelegung; Einsatzdaten, PDF, QR und Empfang
  laufen. Wer ein Gerät nach Ausfall aus der Sicherung neu aufsetzt (der Fall, für den die Sicherung gedacht ist), glaubt es
  vollständig offline bereit, und die Lücke fällt erst auf, wenn ein Übungsbogen ohne Netz „nicht geladen“ meldet.
- **Empfehlung:** Den Vorratsstand beim Einspielen beim Gerät lassen, so wie es der Merkzettel der Geräteuhr schon tut
  (`eeb.uhr.v1`, Kommentar in `sicherung.ts`).
- **Verifikation:** Gerät mit unvollständigem Vorrat, Netz weg, Sicherung eines vollständigen Geräts einspielen: Zeile nennt
  weiter „n von 549 da“.

## Nicht prüfbar

Echte Funkloch-Übergänge auf einem Telefon (Playwright schaltet das Netz hart ab), Verhalten von iOS-Safari bei geräumtem
Speicher, Kamera-Scan, Nahbereich, native Builds, Bildschirmtastatur. Ob ein Wechsel aus dem Hintergrund auf einem Telefon die
Ansicht neu zeichnet (R14-O1), ließ sich nur über die Ereignisse `focus`, `visibilitychange` und `pageshow` nachstellen; auch
sie führten zu keiner Aktualisierung.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „gerade eben“ in der Kopfzeile der Einsatzansicht liest sich wie eine Messung, ist aber der Stand
  vom letzten Zeichnen der Seite (R14-O1).
- **Größtes Einsatzrisiko:** Ein am Meldekopf liegendes Gerät zeigt nach Stunden ohne neue Meldung weiter „gerade eben“ und keine
  Veraltet-Warnung (R14-O1).
- **Top-Priorität für die nächste Iteration:** R14-O1: Altersangaben der Einsatzansicht und der Startseite im Minutentakt und bei
  Rückkehr in die App neu berechnen.
