# Fehler und Wiederanlauf — Lagemonitor (R6-E)

Rolle: Prüfer, der typische Bedienfehler und Unterbrechungen absichtlich
provoziert. Geprüft im Produktionsbuild (Port 4173), Chrome 153 (Playwright),
Monitor 1920 × 1080 und 1366 × 768, Einsatzansicht 1280 × 800, ohne
Codeänderung.

Durchgeführt: Im Block „Lagemonitor für den Fernseher" Einsatzbeginn und
Funkrufname absichtlich falsch gesetzt (Zukunft, falsches Jahr, Datum gelöscht,
Zahlendreher, nur Leerzeichen, HTML, 100 Zeichen, Emoji), mit dem Monitor in
einem zweiten Fenster desselben Kontexts; beide Ansichten mitten im Tippen neu
geladen, Zurück und Vorwärts benutzt; Popup und blockiertes Popup
(`window.open` liefert `null`) durchgespielt, Schließen im Popup und im
Hauptfenster; Hell/Dunkel nach dem Neuladen geprüft; leere und falsche
Adressen; den Einsatz in den Papierkorb gelegt und wiederhergestellt; eine
falsche Geräteuhr eingestellt.

Urteil: Der Monitor ist robust gegen Textfehler (HTML erscheint als Text, 60
Zeichen „W" brechen sauber um, kein waagerechtes Scrollen). Der Funkrufname wird
bei jedem Tastenanschlag gespeichert und überlebt das Neuladen; Zurück und
Vorwärts führen in die Einsatzansicht. Schwach ist die Behandlung des
Einsatzbeginns: Das datetime-Feld löscht den Wert stillschweigend, es gibt keine
Plausibilitätsprüfung, „Jetzt" und „Löschen" haben keinen Rückweg. Außerdem
gehen Funkrufname und Beginn nach Papierkorb und Wiederherstellen verloren. Fast
alles ist ohne fremde Hilfe behebbar, aber man muss den Fehler selbst bemerken.

## Befunde

### R6-E1 (P1) — Funkrufname und Einsatzbeginn gehen nach Papierkorb und Wiederherstellen verloren

- Fundstelle: Startseite, Einsatz löschen und danach Wiederherstellen oder
  Rückgängig, kombiniert mit Eintragungen in einem anderen Einsatz.
- Beobachtung: „Wattsturm 2026" („Salus Übungsleitung", Beginn 6 h 27 min) kam in
  den Papierkorb. Danach trug der Prüfer bei „Hochwasser Süd" den Funkrufnamen
  „Test Anderer" ein. Der Speicher `eeb.lagefunkruf.v1` enthielt danach nur noch
  „Florian Nord" und „Test Anderer"; der Eintrag von Wattsturm war weg. Nach
  „Wiederherstellen" zeigte der Monitor von Wattsturm „Wattsturm 2026" in der
  ersten Zeile, ohne Funkrufnamen und ohne Hinweis. Der Beginn war in diesem
  Lauf noch da, weil keiner geschrieben wurde; er ist wegen derselben
  Schreibregel gefährdet (aus dem Code abgeleitet, nicht nachgestellt).
- Ursache: Beim Schreiben werden Einträge zu Einsätzen verworfen, die nicht in
  der aktuellen Liste stehen, und Papierkorb-Einsätze stehen nicht darin
  (`einsatzWerte.setzen` mit `bekannteIds` aus `einsaetzeLaden()`).
- Folge: Ein versehentlich gelöschter und zurückgeholter Einsatz verliert
  Funkrufnamen und Einsatzdauer; die erste Zeile am Fernseher fehlt still, die
  Führungsstelle ist nicht mehr zu erkennen.
- Empfehlung: Angaben von Einsätzen im Papierkorb (30 Tage) aufbewahren; die
  Wiederherstellung bringt Funkrufnamen und Beginn mit zurück.
- Nachprüfung: Wie oben nachstellen; nach „Wiederherstellen" zeigt der Monitor
  wieder „Salus Übungsleitung" und „6 Stunden, 27 Minuten".

### R6-E2 (P1) — Beginn-Feld: Das Bearbeiten eines Teilfelds löscht den gespeicherten Beginn

- Fundstelle: Einsatzansicht, Feld „Einsatzbeginn" (datetime-local), 1280 × 800.
- Beobachtung: Bei gesetztem Beginn (08:11) tippte der Prüfer „2" in das
  Jahressegment; im Browser allein wäre „0002-10-18T08:11" entstanden, in der App
  wurde das gesamte Feld leer („mm/dd/yyyy, --:-- --"). Der gespeicherte Beginn
  wurde gelöscht, der Monitor zeigte sofort „Einsatzbeginn nicht gesetzt". Auch die
  Rücktaste im Monatssegment löscht den Beginn sofort. Weiteres Tippen führt nicht
  zurück; erst ein komplett neu eingegebener Wert (Monat, Tag, Jahr, Uhrzeit,
  AM/PM) wird wieder gespeichert. Wahrscheinliche Ursache (abgeleitet): Der
  Browser meldet für einen unvollständigen Wert einen leeren String, und die App
  speichert „leer" als „Beginn entfernen" (`ausEingabeWert("")` → `null`).
- Folge: Wer nur eine Ziffer korrigieren will, zerstört den Beginn; die Dauer
  verschwindet am Fernseher, ohne dass es auffällt. Mit Handschuhen am Laptop
  tippt niemand das Datum in Ruhe neu.
- Empfehlung: Zwischenzustände nicht speichern; erst übernehmen, wenn das Feld
  vollständig und gültig ist, oder mit eigenem „Übernehmen". Die alte Eingabe darf
  nicht verschwinden, bis eine neue gültige da ist; Hinweis, wenn der Beginn
  dadurch entfällt.
- Nachprüfung: Beginn setzen, im Jahr eine Ziffer tippen; der Monitor behält die
  alte Dauer, das Feld wird nicht geleert.

### R6-E3 (P1) — Falsche Geräteuhr: Das Hauptfenster warnt, der Monitor zeigt die falsche Zeit groß und ohne Warnung

- Fundstelle: Monitor, Zeile Taktische Zeit.
- Beobachtung: Die Geräteuhr wurde auf 05.01.2024 03:12 gestellt. Das Hauptfenster
  zeigte die Meldung „Geräteuhr prüfen: … beim letzten Start war der 18.10.2026
  (1017 Tage danach)". Der Monitor zeigte rot, groß und ohne jeden Hinweis „05 0312
  jan 24", dazu „Einsatz beginnt noch".
- Folge: Alle am Fernseher lesen eine falsche Zeit als führende taktische Zeit
  (Annahme: Sie wird auch in Meldungen übernommen). Das Hauptfenster kennt das
  Problem, der Fernseher ist blind dafür.
- Empfehlung: Der Monitor übernimmt die vorhandene Uhr-Plausibilitätsprüfung und
  markiert die Zeit sichtbar als „Uhr ungeprüft", solange sie nicht bestätigt ist.
- Nachprüfung: Wie oben nachstellen; der Monitor zeigt Warnung oder Kennzeichnung.

### R6-E4 (P2) — „Jetzt" und „Löschen" überschreiben beziehungsweise entfernen den Beginn ohne Rückfrage und ohne Rückgängig

- Fundstelle: Einsatzansicht, Knöpfe neben dem Beginn-Feld.
- Beobachtung: Bei gesetztem Beginn (6 h 27 min) ersetzte ein Tipp auf „Jetzt" ihn
  sofort durch die aktuelle Zeit, ohne Dialog, Hinweis oder Rückgängig. „Löschen"
  entfernt ihn ebenso; der Monitor zeigte danach „Einsatzbeginn nicht gesetzt".
  „Lagemonitor öffnen" liegt direkt daneben.
- Folge: Ein Fehltipp setzt die Einsatzdauer auf null zurück; die Zeit lässt sich
  nur raten und neu eintippen, das alte Datum steht nirgends mehr.
- Empfehlung: Bei bereits gesetztem Beginn vor Überschreiben oder Löschen den
  alten Wert nennen und bestätigen lassen, oder ein Rückgängig anbieten.
- Nachprüfung: Beginn setzen, „Jetzt" tippen; der alte Wert wird genannt und ist
  wiederherstellbar.

### R6-E5 (P2) — Unplausible Beginn-Werte werden ungewarnt übernommen

- Fundstelle: Beginn-Feld und Monitor-Zeile Einsatzdauer.
- Beobachtung: 2025 statt 2026 ergab „365 Tage, 0 Stunden, 2 Minuten"; der 10.01.
  statt 10.10. ergab „281 Tage, 0 Stunden, 2 Minuten"; Tag 19 statt 18, 20:10
  oder 2027 ergaben nur „Einsatz beginnt noch", ohne Angabe, wann. Das Feld zeigt
  keine Vorschau der Dauer und keine Warnung.
- Folge: Ein Zahlendreher oder falsches Jahr fällt nur auf, wenn jemand auf den
  Fernseher schaut und die Zahl anzweifelt; „Einsatz beginnt noch" ist als
  Fehlerhinweis nicht erkennbar.
- Empfehlung: Direkt unter dem Feld die berechnete Dauer anzeigen („Läuft seit 365
  Tagen" oder „Beginn in der Zukunft") und bei mehr als etwa einem Tag oder bei
  Zukunft rückfragen; am Monitor statt „beginnt noch" den Beginn nennen.
- Nachprüfung: 2025 und ein Zukunftsdatum eingeben; das Feld warnt, der Monitor
  nennt den Beginn.

### R6-E6 (P2) — Falsche oder leere Kennung in der Adresse: leer zeigt die ganze App, falsch eine Sackgasse

- Fundstelle: `?lagemonitor=` und Varianten, 1920 × 1080.
- Beobachtung: Bei `?lagemonitor=` (leer), `?lagemonitor` ohne Wert oder
  `#lagemonitor=…` öffnet die normale Startseite der App, ohne Hinweis, dass die
  Kennung fehlt. Bei falscher Kennung (ein Zeichen fehlt, Großbuchstaben,
  angehängtes Leerzeichen, `<b>x</b>`) steht „Dieser Einsatz ist auf diesem Gerät
  nicht (mehr) vorhanden." mit einem kleinen Knopf „Schließen"; es fehlen eine
  Liste der vorhandenen Einsätze, ein Hinweis auf die richtige Adresse und einer
  auf „Lagemonitor öffnen" in der Einsatzansicht. Positiv: Der Einsatz kommt von
  selbst wieder, wenn er per Rückgängig zurückgeholt wird.
- Folge: Der Fernseher zeigt entweder die Bedien-App oder eine Fehlermeldung ohne
  Ausweg; wer die Adresse von Hand abgetippt hat, findet den Fehler nicht.
- Empfehlung: Eine leere Kennung ebenfalls als Monitor-Fehler behandeln; die
  Fehlerseite bietet die Einsätze auf diesem Gerät zur Auswahl an und nennt den Weg
  („In der Einsatzansicht: Lagemonitor öffnen").
- Nachprüfung: Adressen wie oben; es erscheint nie die volle App, und es gibt eine
  Auswahl.

### R6-E7 (P2) — Einstellungen im Monitor gehen beim Neuladen verloren

- Fundstelle: Monitor, Optionen und Einheiten-Klappe.
- Beobachtung: Hell/Dunkel springt nach dem Neuladen auf Dunkel zurück, die
  aufgeklappte Einheitentabelle ist wieder zu. Die 5-s-Aktualisierung selbst
  klappt nichts zu (11 s beobachtet).
- Folge: Ein bei Sonne eingestellter Hell-Modus ist nach jedem Neuladen weg,
  etwa nach einem Absturz oder Fensterwechsel; das merkt man erst am Fernseher.
- Empfehlung: Hell/Dunkel und Klappzustand je Gerät merken.
- Nachprüfung: Hell wählen, neu laden; der Modus bleibt.

### R6-E8 (P3) — Nach „Jetzt" zeigt der Monitor bis zu 5 s lang „Einsatz beginnt noch"

- Beobachtung: Direkt nach „Jetzt" zeigte der Monitor „Einsatz beginnt noch", nach
  5,5 s „0 Stunden, 0 Minuten". Ursache: Der Monitor vergleicht mit seinem letzten
  Takt. Keine Bedienungsgefahr, wirkt aber wie ein Fehler.
- Empfehlung: Beim storage-Ereignis die Zeit sofort neu lesen.

### R6-E9 (P3) — Kleinigkeiten in der Einsatzansicht

- Bei mehr als 60 Zeichen im Funkrufnamen wird still gekürzt, ohne Zähleranzeige.
- Es gibt keine Bestätigung „gespeichert" nach Funkrufname oder Beginn; der Nutzer
  erfährt es nur am Monitor.
- Unter „Lagemonitor öffnen" steht ein Absatz über „Einsatz weitergeben / sichern"
  (PDF-Hinweis), der zu den Export-Knöpfen gehört und verwirrt.
- Der Schließen-Knopf im Hauptfenster (kein Popup, kein Opener) lädt die App neu
  statt zu schließen; auf einem Fernseher im eigenen Fenster steht dann die
  Bedienoberfläche. Erwartbar, aber nirgends erklärt.

## Was gut ist und gehalten hat

- Funkrufname: HTML und Skripte erscheinen als Text, Sonderzeichen, Emoji und
  Zahlendreher gehen durch; nur Leerzeichen entfernt den Namen, der Monitor fällt
  auf den Einsatznamen zurück.
- 60 Zeichen „W" brechen sauber um; bei 1366 × 768 bleibt der Monitor ohne
  Scrollen auf einer Seite.
- Der Funkrufname wird bei jedem Anschlag gespeichert, auch beim Neuladen mitten
  im Tippen; die Einsatzansicht kommt danach zum selben Einsatz zurück.
- Zurück und Vorwärts führen in die richtige Ansicht; bei blockiertem Popup
  wechselt das Fenster selbst in den Monitor, und Zurück bringt die
  Einsatzansicht wieder.
- Der Popup-Monitor schließt sich mit „Schließen"; ein zweiter Klick auf
  „Lagemonitor öffnen" öffnet kein zweites Fenster.
- Beim Löschen eines Einsatzes zeigt der offene Monitor sofort „nicht (mehr)
  vorhanden" und erholt sich nach „Rückgängig" von selbst; der Lösch-Dialog nennt
  Folgen und Rückholfrist (30 Tage).

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 3 | 4 | 2 |

Größtes Einsatzrisiko: Der Fernseher zeigt falsche Zeit oder Dauer (falsche
Geräteuhr, falsches Jahr, verlorener Beginn) groß und rot, ohne dass jemand eine
Warnung sieht. Wichtigster nächster Schritt: Beginn nur bei vollständigem
gültigem Wert übernehmen, Dauer und Zukunft direkt im Feld anzeigen (R6-E2,
R6-E5) und Funkrufnamen und Beginn beim Papierkorb behalten (R6-E1).
