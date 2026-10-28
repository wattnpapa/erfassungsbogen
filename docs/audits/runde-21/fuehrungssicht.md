# Audit „Führungssicht“, Runde 21 (Lage führen, Stand übergeben, auch ohne Netz)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-10-29 ·
Prüfgegenstand: Web-App im Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `f007590` (`main`).

Zählung: **P0: 1 · P1: 0 · P2: 1 · P3: 1** · Hinweise (ohne Priorität): 6

Reiner Prüfbericht, keine Codeänderung. Maßstab: Es gibt keine „bekannten
Grenzen“ zum Auslassen. Was im echten Browser noch zu beobachten ist, wird
gemeldet, auch wenn es früher als „offen“ oder „nicht ganz erreicht“ geführt
wurde (dann mit alter Befund-ID im Feld „Neu oder alt“). Je Sachverhalt ein
Befund. P3 steht nur dort, wo die Aufgabe der Führung tatsächlich beeinträchtigt
wird; Abwägungsfragen stehen unter „Hinweise“.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales Modul
`/opt/node22/lib/node_modules/playwright`), Locale de-DE, `isMobile`/`hasTouch`;
Telefon 390x844 und 360x640, dazu 320x568 und 320x480 (Dialoge), 640x360 und
844x390 (quer). Zustand: Einsatz „Hochwasser Nord“ mit bis zu fünf Einheiten,
aufgenommen über „Einheit schnell erfassen (nur Stärke)…“ und über „Bögen
einlesen…“ (Beispielbögen). Geprüft:

- Nachgeladene Teile: Verlauf von Seitenhöhe und Layoutverschiebungen beim
  Neuladen der Einsatzansicht (Service Worker aktiv, mit und ohne 4- und
  6-facher CPU-Drosselung, mit künstlich verzögerten Nachladeteilen), Inhalt des
  Precache, Zeichensammlung (Platzhalter `data-zeichen`).
- Offline: Netz getrennt (`setOffline`) nach dem ersten Laden, (a) in derselben
  Sitzung, (b) nach Neuladen, (c) von der Startseite aus „Öffnen“, (d) als
  eigenes Fenster `?lagemonitor=<id>`. Dazu: Bogen anlegen bis Fahrzeuge und
  PDF, Lageblatt, Übersicht als CSV, Excel-Liste, Sammel-PDF, „Daten sichern“.
- Behebungen aus Runde 20: Bogen schließen, ersetzen („Neu anfangen“),
  zurückholen und Ändern bei bis zum Quota-Fehler gefülltem `localStorage`;
  „Einsatz löschen“ → „Nicht gelöscht“ → „Endgültig löschen…“; Namen „THW
  Oldenburg“ (Ort mit und ohne „THW“); „Ort der Einheit ändern…“;
  Schnellerfassung; Scanner ohne Kamera quer; Assistent quer (Standard und
  Feld, jeder Schritt bis ans Seitenende); Dialoge bei 320 px; Tabelle am
  Telefon; Lageblatt (als Text gelesen); Kopf nach „Einsatz beendet“.
- Automatisch: Tippziele unter 44 px und Kontrast in Standard, Feld, Dunkel,
  Nacht (Startseite, Einsatzansicht, aufgeklappte Karte, Details): keine
  Treffer außer dem Sprunglink „Zum Inhalt springen“ (nur bei Fokus sichtbar);
  kein horizontales Scrollen.

Nicht geprüft: echte Kamera, Drucken, echte Funklöcher (nur `setOffline`),
Verhalten auf dem Produktivserver (siehe R21-K1), Electron- und Capacitor-Fassung.

## Urteil

Mit Netz ist die Lage ohne fremde Hilfe zu lesen, zu pflegen und zu übergeben;
alle Behebungen der Runde 20, die ich nachgestellt habe, halten (Liste unten).
**Ohne Netz bricht das Ganze an einer Stelle weg:** Wer die Seite im Funkloch
neu lädt oder die App dort neu startet, kann keinen Einsatz mehr öffnen. Die
Startseite sagt dabei „✓ Funktioniert komplett offline“. Das ist die Folge der
Auslagerung der Einsatzansicht in ein nachgeladenes Bündel (R21-K1). Die übrigen
nachgeladenen Teile (Zeichensammlung, PDF, Lagemonitor, Namen, Ort ändern)
funktionieren offline und verursachen kein spürbares Laden.

Geprüft und in Ordnung (Behebungen der Runde 20, nicht gemeldet):

- Voller Speicher: „Bogen schließen“ nennt den Rückholweg und hält ihn;
  „Zuletzt geschlossenen Bogen zurückholen“ stellt den Bogen her; „Neuen Bogen
  erstellen“ → „Neu anfangen“ ersetzt und hält den alten Stand zurückholbar;
  Ändern danach meldet „Nicht gespeichert — der Speicher dieses Geräts ist voll“.
- „Einsatz löschen“ bei vollem Speicher: „Nicht gelöscht … der Einsatz ist nicht
  gelöscht“, „Endgültig löschen…“ mit zweiter Rückfrage („das wäre die einzige
  Kopie“), „Einsatz behalten“.
- Kein „THW THW Oldenburg“ („THW Oldenburg“, „Oldenburg“, „Oldenburg (Oldb)“
  ergeben je ein „THW“).
- „Ort der Einheit ändern…“: Nummer bleibt, Historie (2), Vermerk „Ort der
  Einheit am Meldekopf geändert“ (Quittung siehe R21-K2).
- Schnellerfassung zählt „Schritt 1 von 4 … 3 von 4“ (R20-K4 behoben).
- Scanner ohne Kamera bei 640x360 und 844x390: alle Knöpfe sichtbar, kein
  Scrollen. Assistent quer: kein Feld unter der Fußleiste, auch nicht in „Feld“
  (R20-N2 nicht mehr zu beobachten; Tippen auf „Ort der Einheit“ rückt es frei).
- Dialoge bei 320x568 und 320x480: jeweils vollständig im Fenster, Knöpfe 58 bis
  77 px hoch, kein horizontales Scrollen.
- Lageblatt: Legende „(OV) Nummer des Ortsverbands – die Einheit selbst hat keine
  gemeldet“, „nicht erfasst“ vor jeder Summe (R20-K2, K3 behoben); Kopf nach
  „beendet“: „noch offen: Excel-Liste und Datensicherung“ (R20-K1 behoben).
- Tabelle am Telefon: passt in die Breite (368/368 px), ohne seitliches
  Scrollen.

## Befunde

### R21-K1 [P0] Einsatz lässt sich nach Neuladen oder Neustart ohne Netz nicht mehr öffnen („Hier ist etwas schiefgelaufen“)

- **Typ:** Daten/Verlust (Daten bleiben erhalten, sind aber im Einsatz nicht
  erreichbar).
- **Neu oder alt (Verweis):** neu (Folge der Auslagerung der Einsatzansicht in
  ein nachgeladenes Bündel in Runde 20, Startbündel 1,23 MB → 0,73 MB).
- **Ort:** Einsatzansicht, jede Art des Öffnens ohne Netz, nachdem die Seite
  neu geladen wurde: (b) Neuladen im geöffneten Einsatz, (c) Startseite →
  „Öffnen“ bei der Einsatz-Karte, (d) Neustart der App. 390x844.
- **Beobachtung:** Einsatz mit Einheiten angelegt, Service Worker aktiv (Precache
  110 Einträge, Zusatz-Cache 549), dann Netz getrennt und neu geladen: Statt der
  Lage steht „Hier ist etwas schiefgelaufen – Die Ansicht ließ sich nicht
  aufbauen“. Auf der Startseite (Weg: „Zur Startseite“) steht dabei weiter grün
  „✓ Funktioniert komplett offline — alle Daten bleiben auf diesem Gerät“; ein
  Tipp auf „Öffnen“ bei der Einsatz-Karte führt wieder in denselben Fehler, auch
  nach weiterem Neuladen. Konsole: „Unable to preload CSS for
  http://localhost:4173/assets/index-Bp0pLAQP.css“. Ursache gefunden: Das
  Bündel der Einsatzansicht (`einsaetze-ui-*.js`) verlangt diese CSS-Datei,
  der Bau legt sie aber nicht mehr ab (das CSS steckt inline in `index.html`;
  `vite.config.ts` löscht das Asset im Plugin `eeb-font-css-inline`). Die
  Datei gibt es weder im Precache noch auf dem Server; `vite preview` antwortet
  auf den Pfad mit der Startseite (200, `text/html`) und verdeckt den Fehler,
  solange Netz da ist. Mit einer 404-Antwort für diese Datei stürzt die
  Einsatzansicht auch mit Netz ab (nachgestellt mit einer Umleitung im
  Browser). Es ist die einzige fehlende Datei unter allen `./…js|css|wasm`-
  Verweisen in `dist/assets`. Innerhalb derselben Sitzung (Einsatz war vor dem
  Trennen schon geöffnet) arbeitet alles weiter: Karten, Details, Lageblatt,
  Übersicht als CSV, Excel-Liste und Sammel-PDF lassen sich ohne Netz erzeugen;
  der Lagemonitor in einem neuen Fenster lädt ohne Netz einwandfrei.
  „Daten sichern“ auf dem Fehlerbild liefert ohne Netz die Sicherungsdatei.
- **Folge:** Im Funkloch (Keller, Halle, Bereitstellungsraum) ist die Lage nach
  einem Neuladen, einem Browser- oder App-Neustart oder einem Absturz des Geräts
  nicht mehr zu öffnen – genau dann, wenn die Führung sie braucht. Das
  Fehlerbild rät „Neu laden“ und, wenn das nichts hilft, „Alle Daten löschen“;
  wer dem folgt, löscht den einzigen Stand. Die grüne Zusage auf der
  Startseite täuscht Sicherheit vor. Gesichert ist nur, wer vorher „Daten
  sichern“ gedrückt hat. Ob der Produktivserver die Datei mit 404 beantwortet
  und der Fehler dort schon mit Netz auftritt, habe ich nicht prüfen können.
- **Empfehlung:** Die Einsatzansicht muss ohne Netz öffnen, nachdem die App
  einmal geladen wurde: Das Bündel darf keine Datei verlangen, die es nicht
  gibt (Verweis auf das gelöschte CSS entfernen oder das CSS wieder
  ausliefern und vorab speichern). Dazu einen Test im Produktionsbuild mit
  getrenntem Netz und Neuladen in der Einsatzansicht, damit dieser Weg nicht
  wieder bricht; die Zusage „Funktioniert komplett offline“ erst zeigen, wenn
  er besteht. Bis dahin Hinweis am Fehlerbild: „Ohne Netz: Daten sichern, nicht
  löschen.“

### R21-K2 [P2] Das „Mehr“-Blatt bleibt nach „Ort der Einheit ändern…“, „Stärke ändern…“ und „Als Übung kennzeichnen…“ offen und verdeckt die „Rückgängig“-Leiste

- **Typ:** Bedienung.
- **Neu oder alt (Verweis):** neu (betrifft die in Runde 20 eingeführte Aktion „Ort der Einheit ändern…“ und die bestehenden „Stärke ändern…“ und „Als Übung kennzeichnen…“).
- **Ort:** Einsatzansicht, Karte aufklappen → „Mehr…“ → eine der drei Aktionen →
  Rückfrage bestätigen. 390x844.
- **Beobachtung:** Nach „Ort übernehmen“, „Stärke übernehmen“ oder „Als Übung
  kennzeichnen“ schließt nur die Rückfrage. Das Blatt mit „Aufteilen…“,
  „Stärke ändern…“, „Ort der Einheit ändern…“, „Entfernen“, „Weniger anzeigen“
  steht weiter über rund 310 px am unteren Rand (37 % des Bildschirms) und
  liegt über der Quittungsleiste mit „Rückgängig“ (Messung: Knopf bei y = 794,
  verdeckt; Blatt-Knopf „Weniger anzeigen“ liegt darüber). Nach 6 s ist die
  Leiste noch da, nach rund 10 bis 12 s verschwindet sie, ohne je sichtbar
  gewesen zu sein. Bei „Entfernen“ schließt das Blatt dagegen, dort ist
  „Rückgängig“ sichtbar. Die Rückfrage verspricht in allen drei Fällen
  „‚Rückgängig‘ nimmt die Änderung zurück“.
- **Folge:** Wer einen falschen Ort oder eine falsche Stärke bestätigt, sieht
  keine Rückmeldung und keinen Rückgängig-Knopf; er sieht nur das Blatt, das er
  noch zuklappen muss. Merkt er es nach dem Zuklappen, ist die Leiste weg, und
  die Änderung ist nur noch über „Historie“ oder eine neue Änderung zu
  korrigieren (Zeit unter Druck, Zahlendreher in der Stärke).
- **Empfehlung:** Das Blatt beim Bestätigen schließen (wie bei „Entfernen“),
  damit die Quittung mit „Rückgängig“ sichtbar ist.

### R21-K3 [P3] Nach dem Einlesen liegt die erste Einheit rund zwei Bildschirme unter dem Anfang

- **Typ:** Layout/Abstand.
- **Neu oder alt (Verweis):** alt, R20-W6/H5/G6 (Meldung „nicht ganz erreicht“),
  davor R19-K6.
- **Ort:** Einsatzansicht direkt nach „Bögen einlesen…“ mit fünf Bögen, 360x640
  und 390x844.
- **Beobachtung:** Die erste Einheitenkarte beginnt bei y = 1 209 px (360x640,
  rund 1,9 Bildschirme) beziehungsweise y = 1 221 px (390x844, rund 1,45
  Bildschirme). Davor stehen die vier Aufnahmeknöpfe, die Quittung
  „5 Bögen aufgenommen. Aufnahme 12:47 …“, „Neu seit der letzten Kenntnisnahme“
  und der Block „Bedarf“. Der Sprunglink „Zur Einheitenliste ↓“ ist vorhanden.
- **Folge:** Wer gerade fünf Bögen eingelesen hat, will sehen, welche Einheiten
  jetzt da sind, und sieht erst nach zwei Wischern die erste; am Telefon fragt
  er sich, ob das Einlesen etwas gebracht hat.
- **Empfehlung:** Die Aufnahmeknöpfe nach dem ersten Einlesen einklappen oder
  die Einheitenliste vor Quittung und Bedarf stellen, sodass die erste Karte
  unter 960 px beginnt.

## Hinweise (ohne Priorität)

Abwägungs- und Geschmacksfragen oder Beobachtungen ohne erkennbare
Beeinträchtigung der Aufgabe; nicht in der Zählung.

- **H1 (neu, Laden):** Beim Neuladen der Einsatzansicht wechselt das Bild: erst
  das ungestylte Startgerüst (Seitenhöhe 5 734 px), dann nur die Fußleiste auf
  leerer Fläche (1 778 px), dann die Lage (4 409 px); gemessene
  Layoutverschiebung 0,3 an `FOOTER.seite`. Mit warmem Service Worker dauert das
  115 bis 200 ms, bei 4-facher CPU-Drosselung rund 0,4 s, bei 6-facher 0,25 s
  Fußleiste allein (Platzhalter fehlt dort). Zeichen und Einheiten selbst
  springen nicht: Die Zeichen erscheinen im reservierten, unsichtbaren Quadrat.
  Eine Beeinträchtigung der Aufgabe sehe ich nicht, es ist aber das Einzige, was
  vom Nachladen spürbar bleibt.
- **H2 (alt, R20-H1/R19-W6):** Die Tabelle am Telefon bricht die Spalte
  „Einheit“ auf fünf bis sieben Zeilen („Nr. 1 THW Albstadt Zugtrupp Technischer
  Zug ÜBUNG ⚠ Stand vor 103 Tagen“), eine Zeile ist 150 bis 190 px hoch; es passen
  rund 3,5 Einheiten auf einen Bildschirm, die Kartenansicht zeigt mehr.
- **H3 (neu):** „Verschieben…“ im „Mehr“-Blatt wird angeboten, auch wenn es nur
  einen Einsatz gibt; die Rückfrage sagt erst dann „Es gibt keine andere
  Einsatz-Sammlung auf diesem Gerät“ und bietet „Alles klar“.
- **H4 (neu):** Bei vollem Speicher steht auf der Startseite grün „✓ Funktioniert
  komplett offline — alle Daten bleiben auf diesem Gerät“ direkt unter der roten
  Warnung „die App kann nichts mehr speichern“. Beide stimmen, widersprechen sich
  aber im Ton.
- **H5 (neu):** Die Rückfrage „Nicht gelöscht“ nennt „Platz schafft dann
  ‚Entfernen‘ bei einer Einheit …, zuletzt ‚Alle Daten löschen‘“ und bietet im
  selben Fenster „Endgültig löschen…“; wer den Text zu Ende liest, sucht einen
  anderen Knopf, als er schon vor sich hat.
- **H6 (neu):** Bei 320x568 ist in „Ist das dieselbe Einheit?“ die Erläuterung
  zu „Ja — als neue Fassung“ am Fensterrand abgeschnitten (innerer Rollbereich
  mit Verlauf, nur der Text, die Knöpfe sind vollständig). Der gleiche Inhalt steht
  in den Knöpfen selbst.
