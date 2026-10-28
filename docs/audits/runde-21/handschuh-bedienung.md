# Audit „Handschuh-Bedienung“, Runde 21 (Nachladen, Offline, Speicher voll, Schnellerfassung, Scanner, Assistent quer, Dialoge, Tabelle)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-29 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand `f007590`, `main`)

**Zählung:** P0: 1 (R21-G1) · P1: 0 · P2: 0 · P3: 7 (R21-G2 bis R21-G8) · Hinweise ohne Priorität: 6 (H1 bis H6)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`, der Abschnitt „Stand der
Behebung“ in `runde-20/README.md` und `runde-20/handschuh-bedienung.md`. Was im Browser noch zu beobachten ist, steht hier,
auch wenn es früher als „offen“ oder „nicht ganz erreicht“ geführt wurde (Feld „Neu oder alt (Verweis)“). Behebungen, die im
Browser nicht mehr zu beobachten sind, stehen nur in der Nachprüfungstabelle. Je Sachverhalt ein Befund, mit Typ
(Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast).

## Urteil aus Sicht der Rolle

Mit Handschuh ist die Arbeit am Meldekopf im Hochformat weitgehend gut zu schaffen: Die Tippziele in Karten, Dialogen und
Assistent sind 44 bis 58 px hoch, „Warum?“ und „ganz zeigen“ sind jetzt echte Knöpfe, die Schnellerfassung zählt „Schritt 1 von 4“,
der Scanner ohne Kamera und der Assistent im Querformat passen ins Bild, und bei vollem Gerätespeicher sagt die App ehrlich, was nicht
geklappt hat. Der große Bruch ist das Nachladen: Die Einsatzansicht (und damit der ganze Meldekopf) lässt sich ohne Netz nicht
mehr öffnen, sobald die Seite einmal neu geladen wird, obwohl die Startseite „Funktioniert komplett offline“ behauptet.
Das ist der einzige Befund, der die Aufgabe verhindert. Der Rest ist Reibung: Sprung nach „Zur Kenntnis genommen“, die Liste
beginnt erst nach 1,6 Bildschirmen, eine dauerhafte Ansichtsleiste, eine gequetschte Fußleiste bei geöffneter Tastatur.
Fremde Hilfe wäre nur beim Offline-Befund nötig, und selbst die hilft dort nicht.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen, kein Install), `isMobile`, `hasTouch`,
Pixeldichte 2, de-DE, Touch-Tipps (`tap()`). Viewports 390 x 844, 360 x 640, 320 x 568, quer 568 x 320 und 640 x 360, dazu 360 x 340
und 390 x 350 als nachgestellte geöffnete Bildschirmtastatur. Zustand: Einsatz-Sammlung „Hochwasser Test“ mit sechs THW-Beispielbögen
(`examples/thw`, über „Bögen einlesen…“), teils zusätzlich eine per Schnellerfassung aufgenommene, gezählte Einheit; eigener Bogen im
Assistenten; Modus „Feld“ über `eeb.anzeigemodus.v1`. Voller Speicher: `localStorage` bis zum Quota-Fehler gefüllt (5 242 880
Zeichen). Offline: `context.setOffline(true)`, einmal im Profil mit abgeschlossenem Service-Worker-Vorrat (Meldung „Jetzt offline
bereit“), einmal in einem frischen Profil nach dem ersten Laden. Nachladen: Netzdrosselung (Fast 3G, Slow 3G) ohne Service Worker,
CPU-Drosselung 6-fach mit Service Worker, Layout-Verschiebung über `PerformanceObserver`. Nicht prüfbar: echte Handschuhe, echte
Bildschirmtastatur (nachgestellt über die Fensterhöhe), Kamera-Scan, echter Produktionsserver (hier `vite preview`).

## Nachprüfung der Behebungen aus Runde 20

| Behebung | Ergebnis im Browser |
| --- | --- |
| Bogen bei vollem Speicher schließen (R20-D1) | hält: Rückfrage „Angefangenen Bogen schließen?“, danach „Zuletzt geschlossenen Bogen zurückholen“, nach Neuladen weiter da |
| Bogen bei vollem Speicher ersetzen | hält: „Neuen Bogen anfangen?“ → „Neu anfangen“; der alte Bogen bleibt unter „zurückholen“ stehen, auch nach Neuladen; Hinweis „Nicht gespeichert — der Speicher dieses Geräts ist voll“ im neuen Bogen |
| Bogen bei vollem Speicher zurückholen | hält: „Bogen … zurückgeholt“, Entwurf nach Neuladen wiederhergestellt |
| „Endgültig löschen“ im Notweg (R20-W1) | hält: erst „Nicht gelöscht“, dann eine zweite Rückfrage „… endgültig löschen?“ mit „Ja, endgültig löschen“ / „Einsatz behalten“ (je 139 x 58); wirkt nicht sofort |
| Meldung entfernen bei vollem Speicher | hält: „Papierkorb voll … Endgültig entfernen?“ |
| Kein „THW THW Oldenburg“ (R20-H1) | hält: Ort „THW Oldenburg“ wird zu „Oldenburg“, die Karte heißt „THW Oldenburg (NI) Zugtrupp Technischer Zug“ |
| „Ort der Einheit ändern…“ (R20-N1) | hält: Dialog, „THW Oldenburg“ eingegeben → Karte „THW Oldenburg Fachgruppe Wassergefahren (A)“, Quittung mit „Rückgängig“ |
| Schnellerfassung mit Schrittzählung (R20-H3 u. a.) | hält im Hochformat: „Schritt 1 von 4: Einheit“ … „Schritt 4 von 4: Übersicht“; Rest siehe R21-G8 |
| Scanner ohne Kamera quer (R20-G5) | hält: 568 x 320 und 640 x 360, Standard und „Feld“: Rahmen vollständig, kein innerer Bildlauf, „QR aus Bild einlesen…“ und „Fertig“ fest unten |
| Assistent und Schnellerfassung quer (R20-G7) | hält: Kopf in einer Zeile, 568 x 320: Inhalt zwischen y 51 und 264 (66 %); Rest siehe R21-G3 |
| Dialoge bei 320 px (R20-H9) | hält: 12 Dialoge geprüft (Einsatz anlegen, löschen, Name/Ort, Stärke, Ort, Entfernen, Zählen, Schlüssel …), kein Überlauf, Knöpfe 44 bis 77 px hoch, 8 px und mehr Abstand |
| Tabelle am Telefon (R20-N6) | hält bei 360 und 390 px (kein seitlicher Bildlauf); bei 320 px siehe R21-G7 |
| „Warum?“ und „ganz zeigen“ (R20-G1) | hält: „Warum?“ 70 x 44; „ganz zeigen“ 92 x 44, Treffer in der Mitte; „Hinweise: …“ 12 px über „Abrücken“, keine Überlappung |
| „Anderer Einsatz? Prüfen ▸“ (R20-G2) | hält: Tipp öffnet die Karte, „Gehört zu dieser Lage“ liegt im ersten Bild |
| Ansichtsschalter im Kopf der Einsatzansicht (R20-G4) | teilweise: Schalter im Kopf vorhanden, Leiste unten bleibt (R21-G6) |
| Dateiname des Karten-PDFs (R20-G8) | hält: `2026-10-28_1208_eeb_THW_Biberach_Riss_…pdf` (Datum des Exports vorn) |
| Platzhalter und Sprünge beim Nachladen | hält (siehe Abschnitt „Nachgeladene Teile“) |

## Nachgeladene Teile: Wirkt das Laden spürbar?

- **Zeichensammlung:** Der Platzhalter ist ein unsichtbares Quadrat, die Seitenhöhe bleibt gleich (keine Verschiebung). Zeit bis zum
  Zeichen nach „Neuen Bogen erstellen“: 62 ms ohne Drosselung, 0,5 s bei Fast 3G, 1,6 s bei Slow 3G. Nichts springt, das Zeichen
  erscheint nur später. Mit Service-Worker-Vorrat nicht zu bemerken.
- **Einsatzansicht aus der Startseite öffnen:** Der Bildschirm wird schon auf der Startseite im Hintergrund geladen; nach „Öffnen“ steht
  die Ansicht nach 171 ms da (Slow 3G), kein sichtbarer Platzhalter.
- **Einsatzansicht nach Neuladen (Hinweis H5):** erst die statische Startseite, dann die Ansicht. Ohne Vorrat (Fast 3G) 2,2 s lang, mit
  Vorrat 0,07 s, mit 6-facher CPU-Drosselung 0,27 s. Layout-Verschiebung dabei 0,3.
- **Offline:** Bogen-Assistent, Zeichen, Scanner der Startseite, Lagemonitor und (bei bereits geladener Ansicht) Karten-PDF, Sammel-PDF,
  Lageblatt und „Meldung entfernen“ laufen ohne Netz. Die Einsatzansicht selbst nicht: siehe R21-G1.

## Befunde

### R21-G1 [P0] Einsatzansicht ist offline nicht zu öffnen: „Hier ist etwas schiefgelaufen“, obwohl die Startseite „komplett offline“ meldet

**Typ:** Bedienung (Aufgabe nicht fortsetzbar; Daten bleiben erhalten) · **Kennzeichnung:** gemessen und mehrfach wiederholt
(Profil mit vollständigem Vorrat und frisches Profil; 390 x 844).

**Ort:** Startseite → „Öffnen“ bei einer Einsatz-Sammlung, „Neue Einsatz-Sammlung…“ → „Einsatz anlegen“, und jedes Neuladen, während
ein Einsatz offen ist; alles ohne Netz.

**Beobachtung:** Frisches Profil, Startseite geladen, Meldung „Jetzt offline bereit. Funktioniert komplett offline“ abgewartet,
Einsatz angelegt, Netz getrennt, Neuladen, „Öffnen“: Es erscheint die Absturzseite „Hier ist etwas schiefgelaufen. Die Ansicht ließ
sich nicht aufbauen.“ Konsole: `Unable to preload CSS for http://localhost:4173/assets/index-Bp0pLAQP.css`. Die nachgeladene Datei
`einsaetze-ui-….js` führt `./index-Bp0pLAQP.css` als Abhängigkeit, diese Datei gibt es im Build nicht (die Formatvorlage steckt
inline in `index.html`); `vite preview` beantwortet den Pfad mit der Startseite (200, `text/html`), deshalb fällt es online nicht
auf. Gegenprobe online: Wird für diesen Pfad ein 404 geliefert, stürzt die Ansicht auch mit Netz ab. Dieselbe Seite erscheint
bei einem offenen Einsatz nach jedem Neuladen ohne Netz (App-Neustart, Browser im Hintergrund beendet). „Neu laden“ ändert
nichts, „Zur Startseite“ bringt die Startseite zurück, dort führt jeder Weg in einen Einsatz wieder zur Absturzseite. Nicht
betroffen: eigener Bogen, Zeichen, Startseiten-Scanner, Lagemonitor-Fenster, und eine Ansicht, die vor dem Netzverlust schon
geladen war (dort liefen Karten-PDF, Sammel-PDF, Lageblatt und „Meldung entfernen“ ohne Netz).

**Erwartung der Rolle:** Was die Startseite als offline lauffähig ausweist, läuft im Funkloch. Der Meldekopf ist der Teil, der
ohne Netz gebraucht wird.

**Auswirkung im Einsatz:** Der Helfer am Meldekopf kann nach einem Neustart des Geräts oder des Browsers im Funkloch keine
gesammelten Bögen mehr sehen, keinen Bogen aufnehmen, kein Lageblatt und keinen Export mehr erzeugen. Die Seite rät außerdem,
den Einsatz „einzeln zu löschen“ — im Offline-Fall hilft das nicht und kostet nur den Einsatz. Die Daten bleiben auf dem Gerät.

**Empfehlung:** Die Einsatzansicht muss bei jedem Neuladen ohne Netz aufgehen; die Meldung „komplett offline“ nur zeigen, wenn
das nachweislich gilt. Die Absturzseite darf im Offline-Fall nicht zum Löschen raten.

**Nachprüfung:** Frisches Profil, „Jetzt offline bereit“ abwarten, Einsatz anlegen, Netz trennen, Neuladen, „Öffnen“: Karten
erscheinen. Dasselbe mit 404 für nicht vorhandene Pfade.

**Neu oder alt (Verweis):** neu (Folge der Aufteilung des Startbündels in Runde 20, „Einsatzansicht nachgeladen“; verwandt R19-O-Reihe
„offline bereit“).

### R21-G2 [P3] Schnellerfassung bei geöffneter Tastatur: „In Einsatz übernehmen“ wird auf 57 bis 85 px gequetscht und abgeschnitten

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen und im Bild (360 x 340: Knopf 85 x 52, Textreste „n / satz überneh“; 390 x 350: 57 x 52;
ab 360 x 360 in Ordnung, 167 x 44; 320 x 300 schaltet auf „Übernehmen“ und „→“ um und ist lesbar).

**Ort:** Schnellerfassung, Schritt 1, Fußleiste, wenn die Bildschirmtastatur den sichtbaren Bereich auf 350 px oder weniger kürzt.

**Beobachtung:** In der schmalen Stufe kommt der Ansichtsknopf „◐“ in die Fußleiste und nimmt den Platz; „Weiter →“ bleibt voll
lesbar, der Hauptknopf ist unleserlich. Genau diese Höhe herrscht beim Tippen des Orts („Pflicht“, erstes Feld).

**Erwartung der Rolle:** Die Schaltflächen bleiben beim Tippen lesbar.

**Auswirkung im Einsatz:** Gering: Beim Tippen steht der Hauptknopf als Rest da; man tippt ihn blind oder schließt die Tastatur.

**Empfehlung:** Die Kurzfassung der Beschriftung („Übernehmen“) schon ab der Höhe verwenden, bei der der Knopf unter 140 px fällt.

**Nachprüfung:** 360 x 340 und 390 x 350: „In Einsatz übernehmen“ oder „Übernehmen“ vollständig im Knopf.

**Neu oder alt (Verweis):** alt, R20-G7 (Rest; damals „verschwindet“, jetzt „abgeschnitten“).

### R21-G3 [P3] Assistent quer im Modus „Feld“: „Ort der Einheit“ liegt beim ersten Anzeigen zur Hälfte unter der Fußleiste

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen und im Bild (568 x 320, „Feld“, Schritt 1: Fußleiste ab y 255; das Ortsfeld beginnt bei y 238
und wird nach dem Tipp nach oben gerollt; in Standard liegt es bei y 214 bis 258 frei).

**Ort:** Vollassistent „Neuen Bogen erstellen“, Querformat, Modus „Feld“.

**Beobachtung:** Das Pflichtfeld ist beim ersten Anzeigen nur halb sichtbar; „Weiter →“ und „Ansicht“ stehen groß darunter.

**Erwartung der Rolle:** Das erste Pflichtfeld ist beim Öffnen ganz im Bild.

**Auswirkung im Einsatz:** Gering: Ein Bildlauf oder der Tipp ins Feld ist nötig, bevor man sieht, was auszufüllen ist.

**Empfehlung:** Im Querformat „Organisation“ und „Name“ in einer Zeile belassen und das Ortsfeld darüber anordnen oder die Leiste
kürzen.

**Nachprüfung:** 568 x 320, „Feld“: „Ort der Einheit“ ohne Bildlauf vollständig sichtbar.

**Neu oder alt (Verweis):** alt, R20-N2 („nicht ganz erreicht“).

### R21-G4 [P3] „Zur Kenntnis genommen“ lässt die Liste um rund 500 px springen; darunter liegen andere Aktionen

**Typ:** Bedienung · **Kennzeichnung:** gemessen (360 x 640: Seitenhöhe 5 909 → 5 377, Bildlauf 843 → 292; unter dem Finger danach „Einheit schnell
erfassen (nur Stärke)…“; 390 x 844: 726 → 219, danach „Bögen einlesen…“).

**Ort:** Einsatzansicht, aufgeklappter Kasten „Neu seit der letzten Kenntnisnahme“, Knopf „Zur Kenntnis genommen“.

**Beobachtung:** Der Kasten fällt weg, die Seite rückt nach oben. Eine Quittung „Zur Kenntnis: 7 · Details · Rückgängig“ erscheint
unten.

**Erwartung der Rolle:** Nach einer Sammelaktion bleibt unter dem Finger nichts Wirksames.

**Auswirkung im Einsatz:** Gering: Ein zweiter Tipp nach über einer Sekunde startet die Schnellerfassung oder öffnet die
Dateiauswahl. Die Tipp-Sperre fängt nur schnelle Doppeltipps ab.

**Empfehlung:** Den Bildlauf halten (oder die Quittung am Finger zeigen), damit an der getippten Stelle nichts Wirksames liegt.

**Nachprüfung:** Tipp auf „Zur Kenntnis genommen“, nach 1,5 s dieselbe Stelle antippen: keine neue Aktion.

**Neu oder alt (Verweis):** alt, R20-G3 (R19-G5).

### R21-G5 [P3] Die erste Einheitenkarte beginnt nach 1,6 Bildschirmen

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen (360 x 640: Überschrift „Einheiten (…)“ bei y 792, erste Karte bei y 1 051 mit sieben Einheiten und
bei y 1 116 mit sechs; 390 x 844: 798 und 1 056).

**Ort:** Einsatzansicht, zwischen den vier Aufnahmeknöpfen und der Liste.

**Beobachtung:** Kennzahlen, vier Aufnahmeknöpfe, Kästen („Neu seit der letzten Kenntnisnahme“, „n Übungsmeldungen nicht gezählt —
anzeigen“, „Bedarf“), zwei Sprungverweise und die Kopfzeile der Liste kommen vor der ersten Karte.

**Erwartung der Rolle:** Die gerade aufgenommene Einheit ist im zweiten Bild zu sehen.

**Auswirkung im Einsatz:** Gering: Wer die Aufnahme prüfen will, wischt rund 1 000 px (am Telefon 360 x 640).

**Empfehlung:** Kästen einklappen oder hinter die Liste, Sprungverweise überflüssig machen.

**Nachprüfung:** 360 x 640 mit sechs Bögen: erste Karte unter y 960.

**Neu oder alt (Verweis):** alt, R20-G6 (R20-W6, R20-H5, „nicht ganz erreicht“).

### R21-G6 [P3] Feste Leiste „Ansicht: Standard“ unten liegt dauerhaft über den untersten 57 px der Karten

**Typ:** Bedienung · **Kennzeichnung:** gemessen (360 x 640: Leiste ab y 583, nach dem Öffnen einer Karte; Treffer-Test: Mitte-links von „Abrücken“
(147 x 48), die auf die Leistenhöhe gerollt wurde, trifft „Ansicht: Standard“).

**Ort:** Einsatzansicht, nach dem Aufklappen einer Karte.

**Beobachtung:** Der Ansichtsschalter steht jetzt auch im Kopf der Ansicht; die Leiste unten bleibt trotzdem und überdeckt beim Rollen
Knöpfe. Ein Tipp auf einen Knopf, der gerade am unteren Rand steht, öffnet die Ansicht statt der Aktion.

**Erwartung der Rolle:** Eine Leiste, die keine zweite Aufgabe hat, belegt keinen Platz am Daumen.

**Auswirkung im Einsatz:** Gering: Ein Fehltipp auf „Abrücken“ oder „Bogen als PDF“ öffnet das Menü, nicht die Aktion; kein Schaden.

**Empfehlung:** Leiste entfallen lassen, solange der Schalter im Kopf steht.

**Nachprüfung:** 360 x 640 nach „Aufklappen“: kein fester Streifen am unteren Rand.

**Neu oder alt (Verweis):** alt, R20-G4 (R19-G6, R19-K12; Rest nach der Behebung).

### R21-G7 [P3] Tabelle bei 320 px: Spalte „Bedarf“ um etwa 8 px abgeschnitten, Wörter brechen mitten im Wort

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen und im Bild (320 x 568: Tabellenbehälter scrollWidth 306 gegen clientWidth 298; Zelle „Bedarf“ 73 gegen 67 px;
im Bild „Diesel 80 l“ und „Benzin 80“ am Rand abgeschnitten, „Technische│r Zug“ umbrochen; Spaltenköpfe „Stärke“ und „Eingetroffen“ stoßen
aneinander). Bei 360 und 390 px in Ordnung.

**Ort:** Einsatzansicht, „Tabelle“.

**Beobachtung:** Der Behälter lässt sich um 8 px seitlich schieben, ohne Hinweis; der Bedarf wird gekürzt dargestellt (Einheit „l“
fehlt).

**Erwartung der Rolle:** Die Tabelle passt ohne Bildlauf, oder die Wörter brechen an Silben.

**Auswirkung im Einsatz:** Gering: Die Bedarfsangabe ist ohne Einheit lesbar nur halb; betrifft Telefone mit 320 px.

**Empfehlung:** Bei 320 px Spaltenabstände verringern oder die Spalte „Bedarf“ unter den Namen setzen.

**Nachprüfung:** 320 x 568, sechs Bögen: kein seitlicher Bildlauf, „Diesel 80 l“ vollständig.

**Neu oder alt (Verweis):** neu (verwandt R19-G10, R20-N6, die bei 360 px halten).

### R21-G8 [P3] Schnellerfassung: Kopf „Schritt 2 von 4: Personal“, Überschrift „3. Personal“, Leiste quer „1 bis 6“ mit „–“

**Typ:** Text · **Kennzeichnung:** gemessen (360 x 640: Kopf „Schritt 2 von 4: Personal“ und Überschrift „3. Personal“; Schritt 3 „… von 4: Fahrzeuge“
und „4. Fahrzeuge“; 568 x 320: Schrittleiste „1. Einheit │ 2 – │ 3 │ 4 │ 5 – │ 6“).

**Ort:** Schnellerfassung, jeder Schritt.

**Beobachtung:** Zwei Zählungen stehen gleichzeitig im Bild. Quer zeigt die Leiste sechs Schritte, zwei mit „–“, ohne Erklärung. Der
Bogen-Assistent hat im Schritt 3 den Text „Vom Papier abtippen? … erst Schritt 4“.

**Erwartung der Rolle:** Eine Zahl für „wo bin ich“.

**Auswirkung im Einsatz:** Gering: Wer „Schritt 2 von 4“ liest und „3.“ in der Überschrift sieht, fragt, ob ein Schritt fehlt.

**Empfehlung:** Überschrift ohne Nummer oder dieselbe Nummer wie im Kopf; die entfallenen Schritte quer ausblenden oder erklären.

**Nachprüfung:** Schnellerfassung 360 x 640 und 568 x 320: überall dieselbe Zählung.

**Neu oder alt (Verweis):** alt, R20-H1 und R19-S3 (Teil der Behebung hält: „2, 5 entfallen“ ist weg).

## Hinweise (ohne Priorität)

- **H1 Kartenkopf (Layout):** Bei langen Namen berührt das Dreieck „▾“ den letzten Buchstaben („Technischer▾“, 360 x 640, Karte Nr. 6); das Wort bleibt lesbar.
- **H2 Leerer Entwurf (Text):** Eine nie ausgefüllte Schnellerfassung meldet nach dem Neuladen „Entwurf … wiederhergestellt. Die Aufnahme läuft dort weiter,
  wo du warst.“ und die Einsatzansicht „Angefangene Erfassung für diesen Einsatz: „THW“. Weiter erfassen“, obwohl nichts eingegeben wurde.
- **H3 Drei Zuklapp-Beschriftungen in der Karte (Text):** „Zuklappen“, „Weniger“ und „Weniger anzeigen“ (alt R20-H2).
- **H4 Quittung nach „Ort der Einheit ändern…“ (Text):** „Name geändert: „THW Crailsheim …“ → „THW Oldenburg …““; geändert wurde der Ort, genannt wird ein Name.
- **H5 Nach Neuladen kurz die statische Startseite (Layout):** Vor der Einsatzansicht steht erst die Startseite, dann ein leerer Platzhalter, dann die Ansicht
  (Seitenhöhe 5 288 → 1 921 → 5 252 px). Mit Vorrat 0,07 s, bei 6-facher CPU-Drosselung 0,27 s, ohne Vorrat über Fast 3G 2,2 s. Antippen ist in der Zeit wirkungslos.
- **H6 Eingabefeld unter „Zuklappen“ (Layout):** „Zug zuordnen“ und „Auftrag/Notiz“ öffnen das Feld unter dem Knopf „Zuklappen“, 220 px unter dem gedrückten Knopf; es ist fokussiert und
  im Bild, aber vom Knopf getrennt.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (online ja; offline nach Neuladen nein)
- **Fremde Hilfe nötig:** ja, aber nur beim Offline-Fall R21-G1, und dort hilft sie nicht
- **Größtes Missverständnis:** „Funktioniert komplett offline“ heißt am Meldekopf offenbar nur „der Bogen“, nicht „die Einsatzansicht“.
- **Größtes Einsatzrisiko:** Im Funkloch lässt sich nach jedem Neustart kein Einsatz mehr öffnen.
- **Top-Priorität für die nächste Iteration:** R21-G1: Einsatzansicht ohne Netz nach Neuladen öffnen (fehlende Formatvorlagen-Abhängigkeit im nachgeladenen Teil beheben) und bei Misserfolg nicht zum Löschen raten.
