# Audit Runde 15 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-26 · Zählung: P0 0 · P1 0 · P2 0 · P3 1

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf Port 4173 (Produktionsbuild, Code-Stand Commit `a7874f0`,
`main` nach Runde 14), Playwright mit Chromium (globales Modul, die Projektkopie fand keinen Browser), Telefon 390 × 844 und
360 × 640, `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener Browser-Kontext. Zustände über die Oberfläche (Einsatz
anlegen, Übungsbögen als JSON einlesen, eine Kopie mit `uebung: false`) und über `localStorage`. Zeitläufe mit echter
Wartezeit und mit der Uhr-Attrappe von Playwright (`page.clock`). Netz weg über `context.setOffline`. CPU-Last mit
`Emulation.setCPUThrottlingRate`.

Nicht neu gemeldet sind die bekannten Grenzen aus den Runden 6 bis 14 (laut Auftrag und `docs/audits/README.md`).

## Urteil

Die Offline-Fähigkeit trägt. Beide Behebungen aus Runde 14 halten im echten Browser, und ich habe keinen Datenverlust, keine
doppelten Datensätze und keine blockierten Abläufe gefunden. Neu ist nur ein P3: Die Zeitangabe zur Sammel-PDF stimmt bei
vielen Bögen nicht. Die Aufgaben „Einsatz führen, übergeben, auf einem zweiten Gerät einspielen, sichern, wiederherstellen“
gelingen ohne fremde Hilfe.

## Nachprüfung der Behebungen aus Runde 14

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R14-O1 Altersangaben laufen mit | hält | Einsatz mit einem Bogen, Seite unberührt: nach 75 s „(gerade eben)“, nach 135 s „(vor 1 Min)“. Mit vorgespulter Uhr ohne Berührung: nach 61 Min „⚠ … (vor 1 Std 1 Min)“ samt Marke, nach weiteren 3 Std „(vor 4 Std 1 Min)“; die Startseite zeigt dasselbe („Letzte Meldung ⚠ … vor 4 Std 1 Min“). |
| R14-O2 Sicherung übernimmt Vorratsstand nicht | hält | Eigener Wert `{"fertig":57,"gesamt":549}`, Sicherungsdatei mit `{"fertig":7,"gesamt":549}`: Nach „Einspielen und ersetzen“ steht dort nicht 7; der Wert wird aus dem Cache dieses Geräts neu bestimmt (549 von 549, Cache tatsächlich voll). Die Datei hat den Stand nicht überschrieben. Ein Gerät mit wirklich unvollständigem Cache und Netz weg ließ sich ohne eigenen Dateiserver nicht herstellen, daher nur diese Teilbestätigung. |

## Weiter geprüft, ohne Befund

- **Zwei Fenster, Entwurf:** Fenster B ändert den Einheitstyp; Fenster A zeigt „Hier wird nichts gespeichert. Das andere Fenster
  hat den Bogen geändert: Einheit (dort: …, hier: …)“. Der Entwurf im Speicher bleibt der von B, nichts wird überschrieben.
- **Zwei Fenster, Einsatz gelöscht:** Fenster B löscht den Einsatz, Fenster A wechselt von selbst zur Startseite. Eine Aufnahme
  danach legt den Einsatz nicht wieder an. Der Papierkorb zeigt „Einsätze (1)“, Zurückholen neben einem neuen Einsatz ergibt
  zwei getrennte Sammlungen.
- **Zurück-Geste:** Tippen und sofort `goBack` nach 0, 60 und 200 ms, bei 390 und 360 breit: Der Entwurf auf der Startseite
  trägt jedes Mal den letzten Wert.
- **Geräteuhr:** 2 Tage und 70 Jahre zurück: „liegt in der Zukunft“ bzw. Rückfrage „Geräteuhr prüfen“. 55 und 110 Tage vor:
  Rückfrage mit Folge („1 Sammlung endgültig gelöscht — nicht im Papierkorb“, Hinweis auf Export), bis zur Antwort bleibt alles.
- **Abrücken:** Quittung mit Rückgängig, nach Neuladen steht „Wieder anwesend“ unter „Mehr…“, Hinweis „Alle Einheiten sind
  abgerückt. Zum Abschluss den Einsatz sichern.“
- **Alle Daten löschen:** Dialog mit Haken und Betroffenen-Liste; danach bleiben Service Worker und beide Caches, ein Neuladen
  ohne Netz läuft („Funktioniert komplett offline“).
- **Offline neu laden:** Einsatzansicht und alle HTML-Seiten des Builds (Themenseiten, Datenschutz, Impressum) laden ohne Netz (Status 200); nur die Beispiel-JSON
  unter `/beispiele/…` ist ohne Netz nicht erreichbar und wird von der App auch nicht verlinkt.
- **Sicherung ohne Netz:** Datei entsteht, Meldung nennt „Gesichert ist sie erst, wenn sie auf einem zweiten Gerät oder Datenträger
  liegt“; „Dauerhaften Speicher anfragen“ wird in Chromium abgelehnt und das offen gesagt.
- **Großer Bestand:** 101 Übungsbögen: Einlesen 8,6 s, 320 Tsd. von 5 Mio. Zeichen („etwa 6 %“), Sammel-PDF 6,6 MB, Einlesen
  derselben Datei auf einem frischen Gerät 3,4 s, „101 Einheiten übernommen“.
- **Entwurf der Karte:** Text im Feld „Auftrag/Notiz“ überlebt ein Neuladen vor dem Speichern (nicht in `localStorage`, Ablageort nicht geprüft), im Speicher des
  Einsatzes steht er nach Hintergrund-Ereignis.

## Befunde

### P3

#### R15-O1 – „bis zu einer halben Minute“ für die Sammel-PDF gilt nur für kleine Einsätze: 30 Bögen brauchen bei Handy-Rechenleistung 46 s, 100 Bögen 39 s schon am Rechner (gemessen)

- **Priorität:** P3
- **Kennzeichnung:** gemessen bei 390 × 844, Produktionsbuild, ohne Netz. Messreihe: 20 Bögen 7,7 s, 100 Bögen 39,0 s (ungedrosselt,
  etwa 0,39 s je Bogen); 30 Bögen mit CPU 4-fach gedrosselt 45,7 s. Die Drosselung ist eine Annahme für ein Mittelklasse-Telefon, kein
  Messwert eines echten Geräts.
- **Fundstelle:** Einsatzansicht → „Einsatz weitergeben / sichern“; Meldung „Einsatz wird erzeugt…“ mit dem Satz „Die Sammel-PDF mit
  allen Bögen wird erzeugt — bei vielen Bögen dauert das bis zu einer halben Minute. Bitte nicht noch einmal tippen.“
- **Beobachtung:** Der Satz nennt eine feste Obergrenze. Sie wird bei 100 Bögen am Rechner und bei 30 Bögen mit gedrosselter CPU
  überschritten. Es gibt keinen Fortschritt („12 von 30“) und keine Ankündigung, dass es länger dauern kann. Das Ergebnis war in allen
  Läufen vollständig (kein Fehler, keine Doppeldatei).
- **Erwartung der Rolle:** Wer „bis zu einer halben Minute“ liest und nach 40 Sekunden noch nichts sieht, glaubt an einen Hänger.
- **Auswirkung im Einsatz:** Gering bis mittel. Die Warnung „nicht noch einmal tippen“ verhindert Doppelaufträge, aber ein Helfer, der
  nach einer Minute den Tab schließt oder das Telefon sperrt, bricht die Weitergabe der Lage ab, ohne es zu merken. Betrifft große Meldeköpfe
  (ab etwa 30 Einheiten auf Telefonen).
- **Empfehlung:** Die Zeitangabe an der Zahl der Bögen ausrichten (etwa „bei 30 Bögen rechne mit einer Minute und mehr“) oder einen
  laufenden Stand „n von m“ zeigen, und sagen, dass der Bildschirm währenddessen an bleiben soll.
- **Verifikation:** Einsatz mit 30 Bögen, CPU 4-fach gedrosselt: Während der Erzeugung steht eine Angabe, die zur tatsächlichen Dauer
  passt oder einen Fortschritt zeigt.

## Nicht prüfbar

Echte Funkloch-Übergänge auf einem Telefon (Playwright schaltet das Netz hart ab), Verhalten von iOS-Safari bei geräumtem Speicher,
Hintergrund-Beenden durch das Betriebssystem, Kamera-Scan, native Builds. Ein unvollständiger Cache mit abgeschnittenem Netz (für die
volle Bestätigung von R14-O2) ließ sich ohne eigenen Dateiserver nicht herstellen; mit dem lokalen Server füllt sich der Vorrat binnen
Sekunden.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „bis zu einer halben Minute“ liest sich wie eine Garantie, gilt aber nur für kleine Einsätze (R15-O1).
- **Größtes Einsatzrisiko:** Eine lange Sammel-PDF-Erzeugung wird für einen Hänger gehalten und abgebrochen (R15-O1).
- **Top-Priorität für die nächste Iteration:** R15-O1: Dauer an der Bogenzahl ausrichten oder Fortschritt zeigen.
