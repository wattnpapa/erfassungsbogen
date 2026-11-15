# Audit Runde 12 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-26 · Zählung: P0 0 · P1 0 · P2 0 · P3 4

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf Port 4173 (Produktionsbuild, `vite preview`, Code-Stand
Commit `2c96abe`), Playwright mit Chromium (globales Modul, die Projektkopie fand keinen Browser), Telefon 390 × 844 und
360 × 640, `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener Browser-Kontext. Zustände über `localStorage`-Seeds aus
den Übungsbögen (`uebung: false`), voller Speicher sowohl per `setItem`-Stub als auch echt (Schlüssel gefüllt, bis der
Browser ablehnt).

Nicht neu gemeldet sind die bekannten Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4), die Reste aus Runde 10 und Runde 11 (R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3).

## Urteil

Die Offline-Fähigkeit trägt weiter, und alle fünf Offline-Befunde aus Runde 11 halten (siehe unten). Ohne Netz laden alle
36 Seiten ohne einen einzigen fehlgeschlagenen Abruf, der Empfang per Link geht, und ein Link auf einen Bogen schützt einen
angefangenen eigenen Bogen mit Rückfrage. Bei vollem Speicher melden Entwurf, Abrücken, Auftrag/Notiz, Kenntnisnahme,
Funkrufname, Sammel-PDF-Import und Zurückholen aus dem Papierkorb den Zustand ehrlich; der Bestand bleibt unverändert. Eine
kaputte, leere, fremde oder aus einer neueren Fassung stammende Sicherungsdatei wird mit Ursache und Weg abgelehnt, eine
halb beschädigte benennt den Verlust vor dem Ersetzen.

Die Aufgaben „Einsatz führen, übergeben, importieren, abgleichen, sichern“ gelingen ohne fremde Hilfe. Neu gefunden sind
vier P3, alle am Rand: zwei Stellen, an denen eine Rückmeldung fehlt (Ablehnung des dauerhaften Speichers, Ablage der
Sicherung), und zwei Stellen, an denen ein Wert still wegfällt (Eingabe bei im anderen Fenster entfernter Einheit,
Widerspruch nach „Erledigt“).

## Nachprüfung der Behebungen aus Runde 11

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R11-O1 Auftrag/Notiz/Zug beim Neuladen | hält | Text getippt, nicht gespeichert, `visibilitychange`/`pagehide` ausgelöst: steht in `eeb.einsaetze.v1`; nach Neuladen in der Karte (Auftrag und Zug, 390 und 360) |
| R11-O2 Aufnahme, Einsatz im anderen Fenster gelöscht | hält | Fenster A zeigt „Der Einsatz „Hochwasser Test“ wurde in einem anderen Fenster in den Papierkorb gelegt …“, Marke „Aufnahme für“ weg, Einsatz im Papierkorb |
| R11-O3 Widerspruch nur bis zum Neuladen | hält, mit Rest R12-O2 | Nach Neuladen steht „1 Widerspruch zwischen den Geräten (offen)“ mit beiden Werten, Speicher `eeb.widersprueche.v1` gefüllt |
| R11-O4 Kenntnisnahme bei vollem Speicher | hält | „Kenntnisnahme nicht gespeichert“ (390 und 360) |
| R11-O5 Funkrufname bei vollem Speicher | hält | „Der Funkrufname konnte nicht gespeichert werden … der Lagemonitor zeigt ihn nicht.“ |

## Befunde

### P3

#### R12-O1 – Eingetippter Text verschwindet ohne Hinweis, wenn die Einheit im anderen Fenster entfernt wird (gemessen)

- **Priorität:** P3
- **Kennzeichnung:** gemessen bei 390 × 844, zwei Fenster in einem Browser-Kontext.
- **Fundstelle:** Einsatzansicht, Karte aufklappen, „Auftrag/Notiz“ (Feld „z. B. Deichabschnitt Nord ab 14:00“); im zweiten
  Fenster derselben Einsatzansicht „Mehr…“ → „Entfernen“ → „Meldung entfernen“ derselben Einheit.
- **Beobachtung:** Fenster A hat „Pumpen Nord“ eingetippt, das Feld ist offen, nichts gespeichert. Nach dem Entfernen in
  Fenster B (Rückfrage dort bestätigt) ist die Karte in A nach etwa 2,5 s weg, das Feld mit ihr; die Liste zählt „2
  gemeldet“, die Nummern rücken auf. Es gibt in A keinen Hinweis („in einem anderen Fenster entfernt“) und keinen Verbleib
  des Textes: weder in einer Karte noch im Speicher. Das Gegenstück bei gelöschtem Einsatz (R11-O2) meldet den Wechsel dagegen.
- **Erwartung der Rolle:** Ein Satz „Die Einheit wurde in einem anderen Fenster entfernt – Ihre Eingabe ‚Pumpen Nord‘ wurde
  nicht gespeichert“.
- **Folge:** Gering und nur bei zwei Fenstern auf einem Gerät: Der Helfer tippt einen Auftrag für eine Einheit, die schon
  weg ist, und sieht nur, dass die Karte fehlt. Er sucht die Einheit, statt zu verstehen, dass jemand sie entfernt hat; die
  Nummern verschieben sich, ohne dass A es erklärt.
- **Empfehlung:** Beim Verschwinden einer Karte mit offener Eingabe einen Hinweis zeigen, der die Einheit nennt und den
  eingetippten Text wiedergibt (zum Abtippen an anderer Stelle).
- **Nachprüfung:** Auftrag-Feld in Fenster A öffnen und füllen, Einheit in Fenster B entfernen: Hinweis mit Namen und Text.

#### R12-O2 – „Erledigt“ am Widerspruch verwirft den Wert der Datei mit einem kleinen Tipp, ohne Übernahme und ohne Rückgängig (gemessen)

- **Priorität:** P3
- **Kennzeichnung:** gemessen bei 360 × 640 (Sammel-PDF von Gerät A in Gerät B importiert, beide mit demselben Einsatz und
  verschiedenem Auftrag für dieselbe Einheit). Rest von R11-O3.
- **Fundstelle:** Einsatzansicht, Block „1 Widerspruch zwischen den Geräten (offen)“, Knopf „Erledigt“.
- **Beobachtung:** Der Block nennt nach dem Neuladen beide Werte („hier Auftrag „Notiz von B: Sandsäcke“, in der Datei
  Auftrag „Notiz von A: Pumpe“; der Stand dieses Geräts bleibt“). Es gibt nur „Erledigt“, keinen Weg, den Wert der Datei zu
  übernehmen; dafür muss die Karte geöffnet und der Auftrag von Hand neu getippt werden. Ein Tipp auf „Erledigt“ entfernt
  den Block und den Eintrag in `eeb.widersprueche.v1`, es erscheint keine Quittung und kein „Rückgängig“; der Wert der
  Datei steht danach nirgends mehr in der App. Der Knopf misst 50 × 30 px (andere Quittungen der App haben 44 px).
- **Erwartung der Rolle:** Entweder „Wert der Datei übernehmen“ neben „Stand dieses Geräts behalten“, oder wenigstens ein
  Rückgängig nach „Erledigt“ wie bei „Zur Kenntnis genommen“.
- **Folge:** Wer bei der Ablösung den Block wegtippt, um die Liste frei zu bekommen, verliert die Gegenseite des Widerspruchs
  (hier: einen Auftrag). Die Datei bleibt zwar als Quelle, aber nur, wenn sie noch zur Hand ist.
- **Empfehlung:** Zwei benannte Knöpfe („Meinen Wert behalten“, „Wert der Datei übernehmen“) in Fingergröße mit Abstand;
  nach der Wahl eine Quittung mit Rückgängig.
- **Nachprüfung:** Widerspruch erzeugen, neu laden, „Erledigt“ tippen: Quittung mit Rückgängig; Übernahme-Knopf setzt den Wert.

#### R12-O3 – „Dauerhaften Speicher anfragen“ zeigt bei Ablehnung keine Reaktion (gemessen)

- **Priorität:** P3
- **Kennzeichnung:** gemessen bei 360 × 640. Der Browser-Zustand wurde mit `navigator.storage.persist` = false nachgestellt (so
  verhält sich Chromium bei nicht installierten Seiten, ohne Rückfrage); Zustimmung (true) und fehlende `storage`-Schnittstelle
  gegengeprüft.
- **Fundstelle:** Fußzeile → „Datensicherung“, Absatz „Der Speicher ist nicht dauerhaft: …“, Knopf „Dauerhaften Speicher anfragen“.
- **Beobachtung:** Bei Zustimmung wechselt der Text auf „Der Browser hält den Speicher dieser App dauerhaft vor und räumt
  ihn nicht von sich aus.“ Bei Ablehnung bleibt der Text Wort für Wort gleich, der Knopf bleibt: Der Tipp hat keine sichtbare
  Folge. Ohne `storage`-Schnittstelle fehlt der Absatz ganz (stimmig).
- **Erwartung der Rolle:** Nach dem Tipp ein Satz, ob der Browser zugestimmt hat. Bei Nein: „Der Browser hat abgelehnt –
  regelmäßig sichern, auf iPhone/iPad zum Home-Bildschirm hinzufügen.“
- **Folge:** Der Helfer tippt mehrfach und vermutet einen Fehler, oder hält die Anfrage für erledigt und verlässt sich auf
  einen Speicher, den der Browser räumen darf (nur bei Platzmangel oder langer Nichtnutzung; echtes Räumen nicht prüfbar).
- **Empfehlung:** Antwort sichtbar machen (Zustimmung wie heute, Ablehnung mit Satz und Verweis auf die Sicherung).
- **Nachprüfung:** `persist()` ablehnen lassen, Knopf tippen: Satz „abgelehnt“ erscheint.

#### R12-O4 – „Sicherung erstellen…“ quittiert weder Dateiname noch Ablage, und die Anzeige sagt nichts zum Datenstand (gemessen)

- **Priorität:** P3
- **Kennzeichnung:** gemessen bei 360 × 640 und 390 × 844 (Download wird ausgelöst; ob der Browser die Datei ablegt, ist
  nicht prüfbar).
- **Fundstelle:** Fußzeile → „Datensicherung“ → „Sicherung erstellen…“, danach die Zeile „Letzte Sicherung auf diesem Gerät
  erstellt: 26.10.26, 03:56 Uhr.“; Startseite, Hinweis „Letzte Sicherung vor n Tagen …“.
- **Beobachtung:** Nach dem Tipp steht als einzige Folge die Zeile „… erstellt: <Zeit>“ (auch im Quelltext vermerkt: gemerkt
  wird beim Erzeugen, ob die Datei abgelegt wurde, sieht die App nicht). Es gibt keine Quittung mit Dateinamen
  (`eeb-sicherung-2026-10-26.json`) und keinem Hinweis auf den Speicherort, anders als beim Sammel-PDF („liegt im
  Download-Ordner bzw. wurde über das Teilen-Menü abgelegt“) und bei PDF („PDF gespeichert: <Dateiname>“). Die Erinnerung
  rechnet nur in Tagen (Schwelle 3 Tage); sie kennt keinen Datenstand: Eine Sicherung am Morgen, dazu 40 neue Meldungen am
  Abend, und weder Datensicherung noch Einsatzansicht sagen „seit der Sicherung 40 neue Meldungen“. Beim Einspielen
  verspricht der Dialog die Sicherung als Rückfall („Vorher Sicherung erstellen…“), nennt aber keinen Zeitpunkt, ab dem die
  Datei den Stand abbildet.
- **Erwartung der Rolle:** Wie beim Sammel-PDF ein Satz „Sicherung als eeb-sicherung-….json erzeugt – liegt im Download-Ordner;
  gesichert ist sie erst, wenn sie auf dem zweiten Gerät oder Datenträger liegt“, und in der Anzeige der Datenstand der
  Sicherung („enthält 3 Einsätze, 54 Meldungen; seit der Sicherung 12 neue Meldungen“).
- **Folge:** Wer „erstellt: 03:56“ liest, hält den Stand für gesichert, obwohl die Datei noch nirgends liegen muss (Tipp auf
  „Abbrechen“ im Speicherdialog des Browsers, voller Download-Ordner) und obwohl danach viel dazugekommen ist. Im Funkloch ist
  die Sicherung der einzige Rückweg bei Geräteverlust.
- **Empfehlung:** Quittung mit Dateinamen und Hinweis „erst wirksam, wenn sie auf einem zweiten Gerät liegt“; Anzeige der Zahl
  der Meldungen seit der Sicherung in Datensicherung und Einsatzansicht.
- **Nachprüfung:** Sicherung erzeugen: Quittung nennt Dateinamen; danach eine Meldung aufnehmen: Anzeige zeigt „1 neu seit der Sicherung“.

## Bestätigtes (ohne Befund)

- Alle 36 Seiten (`dist/*.html`) ohne Netz geladen (nach vollständigem Vorrat), keine fehlgeschlagenen Abrufe, keine Seitenfehler.
- Link-Empfang ohne Netz: Bogen kommt als „Empfangen als: ✓ signiert von …“; bei vorhandenem eigenen Entwurf kommt die Rückfrage
  „Empfangenen Bogen öffnen?“ mit Verweis auf „Zuletzt geschlossenen Bogen zurückholen“.
- Voller Speicher (echt gefüllt): Entwurf wechselt von „✓ gespeichert“ auf „⚠ Nicht gespeichert — der Speicher dieses Geräts
  ist voll. Jetzt „Bogen übergeben“ (PDF).“, Sammel-PDF-Import scheitert mit Grund und Weg, Bestand der Sammlung bleibt (Länge
  des Speichertexts vor und nach dem Versuch gleich), Zurückholen aus dem Papierkorb gelingt.
- Dreifach-Tipp auf „Abrücken“ bei 6-facher CPU-Drosselung und 150 Meldungen: genau ein Abrücken, eine Quittung.
- Sicherungsdatei kaputt/leer/fremd/Array/neuere Fassung: jeweils eigener Satz mit Ursache und Weg, Gerätedaten unverändert;
  halb beschädigt: Dialog nennt „beschädigt: Einsatz-Sammlungen …“ und sperrt „Einspielen und ersetzen“ bis zur Bestätigung.
- Datenschutzfrist: 65 Tage „Wird in 25 Tag(en) automatisch gelöscht“, 95 Tage „Automatisch gelöscht … nicht im Papierkorb“ mit
  Verzeichnis (`eeb.aufgeraeumt.v1`).
- Zwei Fenster: Änderungen aus Fenster B (neue Einheit, Entfernen, Löschen des Einsatzes) erscheinen in A nach 2 bis 3 s.

## Messung ohne Befund (künstliche Drosselung)

150 Meldungen (rund 454 000 Zeichen im Speicher), CPU-Drosselung per CDP: ohne Drosselung 0,2 s bis zur Liste und 0,6 bis
0,7 s bis zur Einsatzansicht; bei 4-facher Drosselung 1,0 s und 3,1 bis 3,5 s, „Abrücken“ bis zur Quittung 2,2 bis 5,8 s;
bei 6-facher Drosselung 1,4 bis 1,7 s und 4,2 bis 5,6 s, „Abrücken“ 3,2 s. Der Rechner war dabei nicht frei (Load etwa 2), die
Streuung ist groß. Nicht als Befund gemeldet, weil eine Sammlung dieser Größe und ein so langsames Gerät nicht belegt sind;
als Größenordnung für die Planung festgehalten.

## Nicht prüfbar

Echtes Räumen des Speichers durch den Browser, Kamera-Scan, Nahbereich, hängende statt tote Leitung (Playwright-`setOffline`
greift nicht auf Abrufe des Dienstarbeiters: Der Vorrat füllte sich im Test auch nach „Offline“ weiter, ein unvollständiger
Vorrat beim Neuladen ohne Netz ließ sich deshalb nicht herstellen), Update-Banner bei neuer Fassung (Web: `registerType:
prompt`; Android-Selbstupdate nur nativ), ob der Browser die Sicherungsdatei wirklich ablegt, Bildschirmtastatur und native Builds.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Letzte Sicherung … erstellt“ liest sich wie „gesichert“, sagt aber weder, dass die Datei
  angekommen ist, noch, was seither dazukam (R12-O4).
- **Größtes Einsatzrisiko:** Ein Widerspruch zwischen zwei Geräten lässt sich mit einem kleinen Tipp wegräumen, und der
  Gegenwert ist danach nur noch in der Datei (R12-O2).
- **Top-Priorität für die nächste Iteration:** R12-O4: Quittung mit Dateinamen nach „Sicherung erstellen…“ und Anzeige der
  Meldungen seit der letzten Sicherung.
