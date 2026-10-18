# Offline und Speicher — Lagemonitor (R6-O)

Rolle: Prüfer für Funkloch, Wechsel online/offline, vollen oder gesperrten
Speicher. Geprüft im Produktionsbuild (Port 4173), Chrome 153 (Playwright);
Monitor 1920 × 1080, Einsatzansicht 1280 × 800.

Durchgeführt: Startseite online laden, bis der Service Worker aktiv ist, dann
offline gehen, den Monitor als zweites Fenster öffnen und neu laden; im
Hauptfenster `eeb.lagefunkruf.v1` ändern und beobachten, ob der Monitor
offline nachzieht; den Monitor als allererste Seite mit Service-Worker-Option
laden und offline neu laden; `Storage.setItem` für `eeb.lage*` mit
`QuotaExceededError` belegen und Funkrufname und „Jetzt" bedienen;
`window.open` auf `null` setzen (Popup-Sperre) und „Lagemonitor öffnen"
klicken; den Monitor mit beschädigten, falsch typisierten, zukünftigen und
riesigen Werten, mit gelöschtem Einsatz, beschädigtem `eeb.einsaetze.v1` und
einem `localStorage`-Getter, der wirft, starten. Die Szenarien sind
simuliert (nicht prüfbar: echter Privatmodus, echter Speicher-Vollauf, echte
Popup-Blocker anderer Browser).

Urteil: Der Kernfall funktioniert. Der Monitor startet und aktualisiert sich
ohne Netz, wenn das Hauptfenster vorher online geladen hat. Reibung gibt es bei
den Fehlermeldungen: Die Meldung bei Speicherfehlern ist falsch beschriftet,
eine Popup-Sperre bleibt unerklärt, und „Einsatz nicht vorhanden" erscheint auch
bei einem reinen Speicherproblem.

## Befunde

### R6-O1 (P1) — Speicherfehler beim Funkrufnamen wird als „Beginn" gemeldet, das Feld zeigt den ungespeicherten Text

- Fundstelle: Einsatzansicht, Block „Lagemonitor für den Fernseher", Feld
  „Funkrufname (optional)".
- Beobachtung (simulierter voller Speicher): „Florian Test" eingetippt — das Feld
  zeigt den Text, gespeichert ist nichts. Die einzige Meldung lautet „Der Beginn
  konnte nicht gespeichert werden (Speicher voll oder gesperrt)." — „Beginn" ist
  falsch. Bei „Jetzt" kam dieselbe Meldung, das Beginnfeld blieb leer und
  „Löschen" erschien nicht (korrekt). Beide Fehler teilen sich eine
  Fehlervariable; gelingt später ein Schreibvorgang, verschwindet die Meldung,
  obwohl der andere Wert weiter fehlt.
- Folge: Die Führungskraft liest „Beginn" und sieht ihren Funkrufnamen im Feld
  stehen, hält ihn für gespeichert. Am Fernseher fehlt er dann, im ungünstigsten
  Fall erst nach dem Aufbau im Fahrzeug. Die Meldung erscheint nur beim
  Schreiben, nicht schon beim Öffnen des Blocks.
- Empfehlung: Die Meldung nennt den betroffenen Wert (oder „Angaben für den
  Lagemonitor"), Fehler je Feld getrennt halten, das Feld bei Fehlschlag als
  „nicht gespeichert" kennzeichnen und die Folge nennen („Der Monitor zeigt diese
  Angabe nicht.").
- Nachprüfung: `Storage.prototype.setItem` für `eeb.lage*` werfen lassen,
  Funkrufname tippen; die Meldung nennt „Funkrufname", das Feld behält keinen
  stillen ungespeicherten Wert. Dasselbe mit „Jetzt".

### R6-O2 (P2) — „Einsatz nicht (mehr) vorhanden" erscheint auch bei unlesbarem Speicher

- Fundstelle: Monitor, Fehlerseite.
- Beobachtung: Dieselbe Seite erscheint bei beschädigtem `eeb.einsaetze.v1`
  („{{{"), bei einem `localStorage`-Zugriff, der einen SecurityError wirft, und
  bei gültigem Speicher mit `[]` (Einsatz tatsächlich gelöscht). Bei offenem
  Monitor und im Hauptfenster gelöschtem Einsatz wechselt die Anzeige per
  storage-Ereignis in 0,6 s auf dieselbe Seite.
- Folge: Der Text ist bei echter Löschung richtig, bei gesperrtem oder
  beschädigtem Speicher falsch und führt auf die falsche Spur: Die Führungskraft
  sucht den Einsatz oder legt ihn neu an, statt Browserprofil oder Speicher zu
  prüfen. Dieselbe Meldung erscheint vermutlich auch, wenn der Monitor in einem
  anderen Browser oder Profil läuft (nicht eigens nachgestellt, folgt aus dem
  Speichermodell).
- Empfehlung: Unterscheiden zwischen „Speicher nicht lesbar", „Einsatz nicht
  gefunden" und „anderer Browser oder anderes Profil"; den Hinweis ergänzen, das
  Fenster im selben Browser wie das Hauptfenster zu öffnen; bei Löschung bei
  offenem Monitor nicht sofort die Fehlerseite zeigen oder wenigstens den
  letzten Stand nennen.
- Nachprüfung: Die drei Fälle einzeln herstellen und die Texte vergleichen.

### R6-O3 (P2) — Popup-Sperre ersetzt still das Arbeitsfenster

- Fundstelle: Einsatzansicht, „Lagemonitor öffnen".
- Beobachtung (`window.open` gibt `null`): Das Hauptfenster wird ohne Hinweis
  zum Monitor (`?lagemonitor=…`), kein Satz „Pop-up blockiert". Es existiert nur
  noch ein Fenster, die Erfassung ist weg. „Schließen" und Zurück führen zur
  Einsatzansicht (gut).
- Folge: Die Führungskraft will das Monitorfenster auf den Fernseher ziehen und
  das Hauptfenster behalten, hat dann aber nur noch den Monitor und muss
  erraten, dass es an einer Popup-Sperre liegt; Verwechslungsgefahr, wenn
  jemand schon das Hauptfenster auf den Fernseher gezogen hatte.
- Empfehlung: Vor dem Wechsel eine Meldung („Das zweite Fenster wurde vom Browser
  blockiert. Zulassen und erneut versuchen, oder diese Ansicht als Monitor
  verwenden."), mit Wahl statt sofortigem Umschalten.
- Nachprüfung: `window.open` auf `null` setzen, Knopf drücken, es erscheint eine
  Erklärung.

### R6-O4 (P2) — Offline-Bereitschaft wird im Lagemonitor-Block nicht gezeigt

- Fundstelle: Monitor und Block „Lagemonitor für den Fernseher".
- Beobachtung: Der Monitor registriert selbst keinen Service Worker. Als erste
  Seite in einem frischen Profil geladen (`serviceWorker: true`): 0
  Registrierungen, 0 Controller; offline neu laden ergab
  `net::ERR_INTERNET_DISCONNECTED`. Hat das Hauptfenster vorher online geladen
  und ist der Service Worker aktiv, funktioniert der Monitor offline
  vollständig (verifiziert, auch nach Neuladen). Die Startseite zeigte in der
  Sitzung noch „0,0 von 6,9 MB — bitte mit Netz geöffnet lassen", der Vorrat war
  also unvollständig. Der Block zeigt davon nichts.
- Folge: Ein Neuladen im Funkloch (Browserabsturz, Rechner aus dem Ruhezustand)
  zeigt auf dem Fernseher die Browser-Fehlerseite statt der Lage, solange der
  Vorrat nicht fertig ist. Annahme: Im Einsatz ist mit Funkloch und Neustarts zu
  rechnen.
- Empfehlung: Im Block „Offline bereit" oder „wird noch geladen, bitte Netz
  lassen" anzeigen, wie auf der Startseite.
- Nachprüfung: Service Worker noch nicht aktiv, Block öffnen: Hinweis da; danach
  aktiv: Hinweis weg.

### R6-O5 (P3) — Beschädigte Speicherwerte werden still ignoriert; überlange Werte nicht begrenzt

- Beobachtung: `eeb.lagebeginn.v1 = "{kaputt"` und `eeb.lagefunkruf.v1 = "[["`:
  Der Monitor stürzt nicht ab, zeigt „Einsatzbeginn nicht gesetzt" und lässt den
  Funkrufnamen weg; falsch typisierte Werte ebenso. Ein Zukunftsbeginn zeigt
  „Einsatz beginnt noch" (plausibel). Ein sehr langer Funkrufname (400 Zeichen,
  direkt in den Speicher geschrieben; über die Oberfläche auf 60 begrenzt, über
  den Import einer Datensicherung denkbar) füllt den ganzen Fernseher (11
  Zeilen); Beginn 1e17 plus 400 Zeichen: Der Monitor zeigt nur noch den
  Funkrufnamen.
- Folge: Die Führungskraft sieht nur „nicht gesetzt" und tippt neu, ohne zu
  erfahren, dass der alte Wert beschädigt war — ein stiller Reset, keine
  Datenlücke.
- Empfehlung: Den Funkrufnamen beim Lesen auf 60 Zeichen kürzen; optional im Block
  erwähnen, wenn ein gespeicherter Wert nicht lesbar war.
- Nachprüfung: 400 Zeichen in `eeb.lagefunkruf.v1` schreiben, der Monitor
  begrenzt die Zeile.

## Was gut ist

- Offline-Start und Neuladen des Monitors funktionieren, sobald der Service
  Worker aktiv ist.
- Das storage-Ereignis aktualisiert den Monitor ohne Netz sofort (Funkrufname im
  Hauptfenster geändert, Monitor zeigte ihn nach 0,5 s).
- Beschädigtes JSON und falsche Typen führen weder zum Absturz noch zu einem
  Seitenfehler.
- Der Rücksprung nach einer Popup-Sperre klappt.
- Ein Schreibfehler liefert `false` und eine Meldung „Speicher voll oder
  gesperrt" (Text gut, nur falsch beschriftet); bei Fehlschlag erscheint kein
  „Löschen" für einen nie gespeicherten Beginn.

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 1 | 3 | 1 |

Größtes Einsatzrisiko: Ein Neuladen des Monitors im Funkloch vor Abschluss des
Offline-Vorrats zeigt die Browser-Fehlerseite auf dem Fernseher. Wichtigster
nächster Schritt: R6-O1 beheben — Fehlermeldung je Feld benennen und
ungespeicherte Eingaben kennzeichnen.
