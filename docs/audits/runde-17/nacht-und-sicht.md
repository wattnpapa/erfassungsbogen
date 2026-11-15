# Audit „Nacht und Sicht", Runde 17 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Prüfer: Rollenaudit `thw-night-visibility-reviewer` · Datum: 2026-10-27 ·
Zählung: **P0 0 · P1 0 · P2 0 · P3 2**

Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Stand `main`
(Commit `be6b396`, nach Behebung der Runde 16). Reiner Prüfbericht, keine Codeänderung.

Gelesen vor dem Lauf: [docs/audits/README.md](../README.md) und die Abschnitte „Stand der
Behebung" in runde-16 bis runde-11 sowie [runde-16/nacht-und-sicht.md](../runde-16/nacht-und-sicht.md).
Ab dieser Runde gibt es keine „bekannten Grenzen" mehr; auch früher als teilweise oder bewusst
belassen geführte Punkte werden gemeldet, wenn sie im Browser noch zu beobachten sind.

## Prüfaufbau

Chromium über Playwright (`chromium.launch()` ohne Optionen, globales playwright-Modul), Locale
de-DE, `isMobile`/`hasTouch`, Viewports 390 × 844 und 360 × 640, alle vier Ansichten (Standard,
Dunkel, Feld, Nacht) über `eeb.anzeigemodus.v1`, also 8 Kombinationen. Zustand per
`localStorage`-Seed: Sammlung „Hochwasser Nord" mit sechs Meldungen aus `examples/thw/`
(`uebung: false`, Eingang vor 5 Minuten bis 6 Std 40 Min, eine abgerückt). Die Angabe „vor 103 Tagen"
stammt aus dem `stand` der Beispieldateien, nicht aus der App.

Gemessen wurde je Zustand: Kontrast jedes sichtbaren Textknotens gegen die tatsächlich
darunterliegende Fläche (Deckkraft eingerechnet, WCAG-Formel, deaktivierte Elemente gesondert),
Platzhaltertexte, Schrift unter 12 px, waagerechtes Rollen der Seite und Text, der über seine Zelle
oder seinen Container hinausragt. Zustände: Startseite, Scanner ohne Kamera, Einsatzansicht,
aufgeklappte Karte, Abrücken-Quittung („Wieder anwesend" mit „Rückgängig"), Karten/Tabelle,
„Suchen, sortieren, filtern", „Bogen scannen…", „Einheit manuell erfassen…", „Einheit schnell
erfassen…", „Bögen einlesen…", „Ort eintragen…", „Einsatz weitergeben / sichern", Lagemonitor-Knopf,
Ansichtswahl, „Einsatz löschen?", „Neue Einsatz-Sammlung…", „Alle Daten löschen", Bogen Schritt 1
bis 6, Anleitung, Datenschutz, Impressum, Aufbau des Bogens, Datensicherung, Übungsbögen.
Bildschirmfotos für Nacht und Feld bei 360 px habe ich angesehen.

**Nicht prüfbar:** echtes Licht (Sonne, Scheinwerfer, Rotlicht), Displayhelligkeit, Kamerabild im
Dunkeln (die Umgebung hat keine Kamera; der Scanner zeigte die Ausweichansicht), native Fassungen,
Ausdruck, Rot-Grün-Schwäche am echten Auge (nur über die Prüfung, dass Zustände ein Wort oder eine
Form tragen).

## Urteil

Kontrast und Codierung halten: In allen 8 Kombinationen und allen genannten Zuständen liegt kein
sichtbarer, nicht deaktivierter Text unter 4,5 : 1, keine Schrift unter 12 px, die Seite rollt nie
waagerecht. „ABGERÜCKT" trägt Rahmen und Durchstreichung, Alter „⚠" mit Wort, „anon."/„ANONYMISIERT"
steht als Text, die Wahl in der Ansichtsleiste ist durch Füllung und Beschriftung erkennbar. Nacht
bleibt warm ohne große helle Flächen; Feld ist hell (gewollt) mit dunkelblauem Kopf. Ansichtswechsel
unterbricht keinen Vorgang. Die Aufgabe ist ohne fremde Hilfe machbar; übrig sind zwei kleine Punkte.

## Prüfung der Behebungen aus Runde 16

| Befund | Ergebnis |
| --- | --- |
| R16-L1 Kennzahlen-Beschriftung „EINHEITEN" | hält: In Feld und Nacht bei 360 und 390 px steht „EINHEITEN", „FÜHRER", „UNTERF.", „MANNSCH.", „GESAMT" jeweils in der eigenen Zelle, die Trennlinie wird nicht berührt, kein Überstand gemessen |
| R16-N1/N2/N4 (Dialogfuß, Scanner-Knopfleiste, Zeit unteilbar) | hält: „Abbrechen", „Kamera erneut versuchen", „QR aus Bild einlesen…" im Scanner sichtbar, in allen vier Ansichten lesbar |
| R16-K1 „Name / Ort ändern…", R16-M1 bis M3 | hält: Dialog „Einsatz bearbeiten" in Nacht und Feld ohne Text unter 4,5 : 1 |
| R16-W1/W3 Quittungsleiste | hält: „Wieder anwesend 19:03" mit „Rückgängig" und „✕" in Nacht über 4,5 : 1 |
| R16-G1/G2, R16-H1 | hält soweit messbar (Abstände und Zielgrößen sind nicht Gegenstand dieser Rolle) |

## Befunde

### R17-L1 (P3) Deaktivierte Knöpfe liegen bei Deckkraft 0,4 weit unter 4,5 : 1

- **Ort:** Bogen Schritt 1 („← Zurück"), „Neue Einsatz-Sammlung…" („Einsatz anlegen" vor Eingabe des
  Namens), „Alle Daten löschen" („Endgültig löschen" vor der Bestätigung); alle vier Ansichten.
- **Beobachtung:** Die Knöpfe sind mit Deckkraft 0,4 gedimmt. Gemessen für „← Zurück" im ersten
  Schritt: Standard 2,59 : 1, Dunkel 3,37 : 1, Feld 2,85 : 1, Nacht 2,86 : 1. „Einsatz anlegen" und
  „Endgültig löschen" tragen dieselbe Deckkraft (Kontrast dort nicht einzeln gerechnet). Der Zustand
  wird nur über das Dimmen vermittelt; der Knopf nennt nicht, was fehlt.
- **Folge:** Bei Sonne oder geringer Displayhelligkeit verschwindet der Knopf; ein Helfer sieht nicht,
  dass „Einsatz anlegen" noch nicht möglich ist und warum, und tippt wiederholt auf ihn. Gering, weil
  die Aufgabe über das Feld daneben klar ist.
- **Empfehlung:** Deaktivierte Knöpfe erkennbar lassen (Rahmen oder Muster behalten, Text über etwa
  3 : 1 bis 4,5 : 1) und bei „Einsatz anlegen" / „Endgültig löschen" in einer Zeile nennen, was zur
  Freigabe fehlt.
- **Neu oder alt (Verweis):** alt – wie R11 („deaktivierte Knöpfe, Deckkraft 0,4"), R13 und R15
  („←" im ersten Schritt), dort als bekannte Grenze geführt; weiter offen.
- **Nachprüfung:** Je Ansicht „← Zurück" in Schritt 1 und „Einsatz anlegen" im leeren Dialog messen:
  Text mindestens 3 : 1 (besser 4,5 : 1), Knopfrand sichtbar, Grund für „nicht möglich" als Text.

### R17-L2 (P3) Einsatzname im Kopf der Erfassung wird mit „…" gekürzt

- **Ort:** „Einheit manuell erfassen…" und „Einheit schnell erfassen…" aus der Einsatzansicht, Kopfzeile
  „‹ Einsatz „Hochwasser Nord"" neben „Ansicht: …▾", 360 × 640 (alle Ansichten) und 390 × 844.
- **Beobachtung:** Der Text ist 216 px (Feld 242 px) breit, die Zelle 170 bis 214 px (Feld 174 bis
  204 px). Sichtbar bleibt bei 360 px in Standard, Dunkel und Nacht „‹ Einsatz „Hochwasser …", in Feld
  nur „‹ Einsatz „Hochwa…"; das schließende Anführungszeichen fehlt. Zwei Zeilen darunter steht
  „Aufnahme für: Hochwasser Nord" vollständig.
- **Folge:** Bei Namen mit gleichem Anfang („Hochwasser Nord", „Hochwasser Nordwest") ist die
  Kopfzeile allein nicht eindeutig; wer nachts schnell mit „‹" zurück will, muss auf die zweite Zeile
  schauen. Gering, weil die Marke darunter den vollen Namen nennt.
- **Empfehlung:** Den Namen im Kopf umbrechen statt kürzen oder den Namen nur an einer Stelle führen.
- **Neu oder alt (Verweis):** neu.
- **Nachprüfung:** Einsatz mit langem Namen anlegen, Erfassung öffnen, bei 360 px in allen vier
  Ansichten: Name im Kopf ohne „…" lesbar oder nur einmal, aber vollständig angezeigt.

## Schluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** keines beobachtet; ein gedimmter „Einsatz anlegen" wirkt wie ein Knopf, der nicht reagiert.
- **Größtes Einsatzrisiko:** nicht prüfbar bleibt die echte Wirkung von Sonne und Scheinwerfer auf das Display; die Messwerte sind Kontrastwerte, keine Helligkeitsmessung.
- **Top-Priorität für die nächste Iteration:** R17-L1 beheben (deaktivierte Knöpfe lesbar halten, Grund nennen) und danach auf einem echten Gerät bei Dunkelheit und Sonne messen.
