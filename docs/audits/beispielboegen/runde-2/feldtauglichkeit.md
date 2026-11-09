# Audit „Helfer im Feld“, Schwerpunkt Beispielbögen, Runde 2 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-11-09 ·
Prüfgegenstand: Live-Seite `https://erfassungsbogen.app/` (Stand `main`, Commit `085a93b`, angezeigte Fassung
`v2026.1109.833`), nur der Bereich Beispielbögen: Startseiten-Abschnitt „Beispielbögen“, der nachgeladene Dialog
„Beispielbögen“ (Suche, Register, klebende Pfadleiste, Karten, Sammelweg, Offline-Hinweise) und die Folgen von „Anzeigen“,
„PDF“, „Link“ und „Alle … in eine Übungs-Sammlung“.

Zählung (neue Befunde): **P0 0 · P1 0 · P2 3 · P3 6 · Hinweise 6** (Hinweise ohne Priorität, nicht in der Zählung)

Nachprüfung Runde 1: **behoben 4** (BB-H2, BB-H4, BB-H5, BB-H7) · **teilweise 7** (BB-H1, BB-H3, BB-H6, BB-H8, BB-H9,
BB-H10, BB-H11) · **offen 0**; von den Hinweisen 1 bis 6: behoben 2, 4, 5; offen 1, 3 (verschärft), 6.

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: Bericht aus Runde 1 (`../feldtauglichkeit.md`) und
`../README.md` mit „Stand der Behebung“ Nr. 1 bis 21; zum Nachschlagen `src/app/beispiele-dialog.tsx` (Suche `suchTreffer`,
Pfadleiste, `cancel`-Behandlung, Quittung, Sammelweg). Je Sachverhalt ein Befund; der Typ steht im Kopf jedes Befunds.

## Prüfaufbau

Playwright/Chromium (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Pixeldichte 1,
frischer Kontext je Lauf, Tipps als Touch-Tipps, Text über `keyboard.type` Zeichen für Zeichen (30 bis 120 ms Abstand).
Skripte und Bildschirmfotos unter `/tmp/claude-0/r2-feld/` (`r*.js`, `bb/*.png`, Ausgaben `r*.out`). Viewports 360 × 640,
390 × 844, quer 640 × 360; Anzeigemodus „Feld“ (Schalter „Ansicht“ im Kopf; im Querformat stehen die Modi direkt im Kopf),
zum Vergleich einzelne Läufe in „Standard“. DOM nicht verändert, kein Skript eingeschleust; gelesen wurden Lage, Größe,
Bildlauf, Fokus und berechnete Stile.

Wege: (1) Startseite → „Beispielbögen ansehen“ (Zeit bis zum offenen Dialog, auch gedrosselt 400 ms/50 kB/s);
(2) THW › Alle Einheiten aller Ortsverbände › Bremen, Niedersachsen › RSt Oldenburg › OV Oldenburg (NI), je Ebene Bildlauf
200 px und Lage der klebenden Pfadleiste gemessen, ans Ende gerollt; (3) Zurück-Geste (`goBack`) dreimal aus Tiefe 5, Escape,
Schließen und Wiederöffnen, Neuladen und Wiederöffnen; (4) Suche: 14 Suchbegriffe, darunter Tippfehler, Umlaut-Ersatz,
Einheit + Ort; Bildschirmtastatur angenähert durch Verkleinern des Fensters auf 55 % bzw. 45 % der Höhe; Escape und Zurück
bei Suchtext; Tipp auf einen Treffer und Zurück; (5) eigener Bogen („THW Oldenburg“, nur Ort) → Beispiel anzeigen →
Startseite → zweites Beispiel → Neuladen → drittes Beispiel; (6) „PDF“ aus einer unteren Karte (Download gespeichert),
„Link“ (Zwischenablage-Berechtigung, Beschriftung alle 300 ms gelesen); (7) „Alle 9 in eine Übungs-Sammlung“ (OV Oldenburg)
und „Alle 101 in eine Übungs-Sammlung“ (THW), Zustand alle 250 ms gelesen; (8) Offline: OV Oldenburg online geöffnet, bis
„✓ Jetzt offline bereit“ gewartet (≈ 55 s) plus 30 s, Netz getrennt, neu geladen, Dialog im gemerkten Ordner, „Anzeigen“
in OV Oldenburg (vorher online gesehen) und OV Norden (nie gesehen), Suche offline, Netz wieder an; (9) Stichprobe von
elf Beispielbögen aus allen Registern nach „Anzeigen“ auf „⚠ offene Punkte“ und Reiter „fehlt“.

## Annahmen

- Wie in Runde 1: Beispielbögen dienen Ausbildung, Übung, Dienstabend und Kennenlernen; selten Zeitdruck am Einsatzort.
- Ein Helfer schaut mehr als ein Beispiel an und sucht zuerst „seinen“ OV oder „seine“ Einheit.
- Mobile Browser verwerfen Tabs im Hintergrund und laden sie beim Zurückkehren neu; ein Neuladen ist also kein Sonderfall.
- Die Bildschirmtastatur nimmt im Hochformat rund 45 %, im Querformat rund 55 bis 60 % der Höhe ein.

## Nicht prüfbar (Not verified)

Echte Handschuhe, nasse Finger, Sonne und Dunkelheit am Display; WebKit/Safari; echte Bildschirmtastatur (Chrome Android
verkleinert standardmäßig nur den sichtbaren Bereich; hier angenähert durch kleineres Fenster, die Wirkung — weniger
sichtbare Fläche — ist dieselbe); das echte Teilen-Menü (`navigator.share` fehlt in Chromium, „Link“ lief über die
Zwischenablage); Download-Anzeige eines echten Android-Browsers; echtes Mobilnetz; Telefon-Zurück-Taste (angenähert über
`goBack`, das im Dialog das `cancel`-Ereignis auslöst); Verwerfen des Tabs durch das Betriebssystem (angenähert über
Neuladen); der Sammelweg offline (nicht ausgelöst).

## Urteil

Aufgabe „Einen Beispielbogen meiner Einheit finden, ansehen, als PDF holen, Link weitergeben, ggf. alle Bögen meines OV als
Übung sammeln“: **abgeschlossen, mit Mühe an einzelnen Stellen** — online hochkant ohne Hilfe, im Querformat mit Mühe.

Die vier P2-Befunde aus Runde 1 sind behoben oder deutlich entschärft: Zurück geht eine Ebene hoch und der Dialog öffnet im
letzten Ordner (auch nach Neuladen), das Querformat zeigt Karten mit allen drei Knöpfen, die Startseite sagt ehrlich, dass
die OV-Bögen Netz brauchen, und ein zweites unverändertes Beispiel ersetzt das erste ohne Rückfrage. Neu entsteht Reibung
an den Umbauten selbst: (a) die klebende Pfadleiste lässt im Querformat bis auf 42 px nichts von der Liste übrig
(BB2-H1); (b) die Suche findet Einheiten nicht unter dem Namen, der auf der Karte steht, und liefert bei „Oldenburg“ die
Regionalstelle mit Aurich und Emden statt des OV (BB2-H2); (c) im OV-Ordner steht der große Knopf „Alle 9 in eine
Übungs-Sammlung“ als erster Knopf vor den Bögen, die erste Karte beginnt erst unterhalb des ersten Bildes (BB2-H3).

Erwartetes Bild des Helfers: „Musterordner wie im OV-Schrank: ich suche meinen OV, nehme einen Bogen raus, lege ihn
zurück, nehme den nächsten.“ Das passt jetzt bis auf den Neustart des Browsers (BB-H1 Rest) und die Suche, die nach
Dateikürzeln statt nach Einheitsnamen sucht.

## Bestätigt (funktioniert und sollte bei Umbauten erhalten bleiben)

- **Zurück eine Ebene hoch:** Dreimal Zurück-Geste aus OV Oldenburg (NI): RSt Oldenburg → Bremen, Niedersachsen → Alle
  Einheiten …; Adresse bleibt `https://erfassungsbogen.app/`, Bildlauf jeweils 0, Fokus auf dem Ordnernamen. Escape ebenso.
  Mit Suchtext leeren Escape und Zurück zuerst die Suche, der Dialog bleibt offen.
- **Gemerkter Ordner:** Schließen/Öffnen, Neuladen/Öffnen und Rückkehr nach „Anzeigen“: Dialog steht wieder in
  „Alle › … › RSt Oldenburg › OV Oldenburg (NI)“, Bildlauf 0. „‹ Zurück“ 100 × 54 (Feld) als sicherer Weg.
- **Ordnerwechsel:** springt immer an den Anfang (aus Bildlauf 642 in den OV: danach 0); Pfadteile mindestens 44 px breit
  („Alle“ 44 × 54 im Feld).
- **Karten nach Dialogbreite:** 640 × 360 (Feld und Standard) zeigt Karten statt Tabelle (844 × 390 nicht geprüft): Kopfzeile ausgeblendet,
  Rollbereich 556 = 556 px (kein Seitwärtsrollen), „Anzeigen“ 125 × 54, „PDF“ 86 × 54, „Link“ 85 × 54 in einer Reihe.
- **Zweites Beispiel:** ohne Rückfrage; Meldung „Solange du nichts änderst, ersetzt das nächste Beispiel ihn ohne
  Rückfrage. Dein eigener Bogen „THW Oldenburg“ liegt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen“.“
  Startseitenkarte mit Kennzeichen „BEISPIEL“.
- **Erstes Beispiel bei eigenem Bogen:** kurze Rückfrage mit „Beispielbogen öffnen“ / „Abbrechen“, eigener Bogen landet auf
  dem Rückholplatz.
- **Einsatzzeitraum:** keine Stichprobe meldet mehr „Einsatzzeitraum … ist vorbei“ (vorher 6 von 6).
- **Katastrophenschutz:** „Baden-Württemberg“, „Mecklenburg-Vorpommern“, „Nordrhein-Westfalen“ usw. ausgeschrieben, darunter
  „Noch ohne Beispielbögen: Bremen, Hamburg, Sachsen-Anhalt, Schleswig-Holstein.“
- **Offline-Zeile:** „✓ Funktioniert komplett offline (außer den Beispielbögen der THW-Ortsverbände)“ — passt zum Dialog.
  Der nachgeladene Dialog öffnet auch offline (Baustein im Vorrat). Netz zurück: Ordner lädt von selbst nach.
- **Sammelweg:** „Alle 9 in eine Übungs-Sammlung“ nach 0,6 s, „Alle 101 …“ nach 7,4 s (Knopf solange gesperrt, Zähler
  „Angaben werden geladen … 29 → 100 von 101“); Ergebnis: Sammlung der Art „Übung“, alle Karten mit „ÜBUNG“, eigener Bogen
  unberührt, auf der Startseite „Einsatz-Sammlung (Meldekopf) · Übung: THW · Öffnen · Löschen…“.
- **Dialog-Start:** nachgeladen 0,86 bis 1,05 s ungedrosselt, 1,1 s gedrosselt (400 ms / 50 kB/s) — spürbar, aber kein
  Doppeltipp-Anlass.

## Nachprüfung Runde 1

| Alte ID | Stand | Beobachtung Runde 2 |
| --- | --- | --- |
| BB-H1 | **teilweise** (Rest P2) | Ohne Neuladen behoben (s. o.). Nach Neuladen gilt das angesehene Beispiel als eigener Entwurf: Startseite „THW Oldenburg (NI) Zugtrupp Technischer Zug ÜBUNG · Entwurf vom 09.11.26, 08:51 Uhr wiederhergestellt“ (vorher „BEISPIEL“), und das nächste „Anzeigen“ bringt wieder die Rückfrage aus Runde 1: „… Der Bogen „THW Oldenburg“ … auf dem Platz „Zuletzt geschlossener Bogen“ wird dabei endgültig gelöscht …“ mit „Beispielbogen öffnen — den alten Bogen vorher als Datei sichern“ / „… — alten Bogen endgültig löschen“ (je 300 × 67) / „Abbrechen“. Da Telefone Hintergrund-Tabs verwerfen, trifft das den Helfer, der zwischendurch Funk oder Messenger bedient hat. Empfehlung: die Kennzeichnung „unverändertes Beispiel“ mit dem Bogen speichern statt nur im Arbeitsspeicher. |
| BB-H2 | **behoben** | Zurück-Geste und Escape eine Ebene hoch, Dialog öffnet im letzten Ordner (auch nach Neuladen und nach „Anzeigen“). Offen wie im README vermerkt: kein Knopf „Zurück zu den Beispielbögen“ im geöffneten Bogen; die Startseite steht danach bei scrollY 0, der Abschnitt bei y = 2 678 (Hinweis 3). |
| BB-H3 | **teilweise** (Rest P3) | Startseite, Ordnerhinweis und Fehlermeldung sagen jetzt dasselbe. Weiter: Karten nicht geladener Bögen haben aktive Knöpfe (OV Norden offline: 5 × „nicht geladen“, „Anzeigen“ nicht gesperrt), der Fehler kommt erst nach dem Tipp. In OV Oldenburg, vorher online vollständig angezeigt („9 Bögen“ ohne Ladehinweis), fehlte offline einer der neun („ov-oldenburg-ni-04-1-tz-ztr-tz · nicht geladen“; einmal beobachtet, Ursache nicht ermittelt). Neue Nebenwirkungen siehe BB2-H6. |
| BB-H4 | **behoben** | 640 × 360: Karten, alle drei Knöpfe in einer Reihe im Bild, kein Seitwärtsrollen. Neue Enge durch die klebende Pfadleiste: BB2-H1. Auf der obersten Ebene steht quer im Feld-Modus weiter nur ein Register (ASB) ganz im Bild (Kopf 73 px, Erklärung, Suchfeld davor). |
| BB-H5 | **behoben** | Ordnerwechsel immer an den Anfang, Pfadleiste klebt unter dem Kopf (THW ans Ende gerollt, scrollTop 34 918: „‹ Zurück“ bei y = 106). Nebenwirkung Höhe: BB2-H1. |
| BB-H6 | **teilweise** (Rest P3) | Zeitraum-Warnung weg. 5 von 11 Stichproben zeigen weiter „⚠ … offene Punkte“ und einen Reiter „fehlt“: Feuerwehr Wietzendorf („Sitzplätze: 6 … für 20 Personen — 14 brauchen eine andere Mitfahrgelegenheit“), Feuerwehr Nordwede MTF (24 ohne Sitzplatz), THW Gieboldehausen FGr Ö (11 ohne Sitzplatz), DLRG Württemberg und JUH Akkonia („Alle 4 Personen stehen auf Geschlecht „männlich““; Akkonia zusätzlich „Keine telefonische Erreichbarkeit“, „kein Kraftfahrer“), ebenso Fachgruppe Führungsunterstützung Oldenburg (Reiter „4. Fahrzeuge — fehlt“). Im Sammelweg erscheinen dieselben Warnungen auf den Karten („alle als „männlich“ (Vorbelegung)“, „Sitzplätze fehlen: 4“). |
| BB-H7 | **behoben** | Ländernamen ausgeschrieben, fehlende Länder genannt. Am Rand: Katastrophenschutz › Hessen, erster Bogen zeigt im Kopf „Feuerwehr · 1. Löschgruppe · Löschzug (LZ)“ — Ort „Löschzug (LZ)“ (im README als offen vermerkt). |
| BB-H8 | **teilweise** (Rest P3) | Platzhalter für Zeichen und Höhe da, das Springen ist weg. Als Hauptzeile stehen weiter Dateinamen: in Suchtreffern während des Ladens („ov-emden-01-1-tz-ztr-tz“, „ov-norden-02-1-tz-b“), offline in jedem nicht geladenen Bogen, beim ersten Öffnen eines OV („ov-oldenburg-ni-01-fz-fk-ztr-fz-fk“, „Angaben werden geladen … 0 von 9“ nach 2,5 s). |
| BB-H9 | **teilweise** (Rest P3) | Quittung kommt („PDF „uebung-beispiel-…pdf“ erzeugt — liegt im Download-Ordner.“, 2,2 s ungedrosselt), steht aber oben im Dialog: nach „PDF“ in der 7. Karte bei scrollTop 3 333 liegt sie bei y = −2 784, also außer Sicht, und ist nach 6 s wieder weg. Während des Laufs bleibt „wird vorbereitet …“ unter dem Einheitsnamen (y = 127), der Knopf selbst ändert sich nicht. „Link“: weiter nur 3 s „Kopiert“ am Knopf (gemessen 0,6 bis 3,1 s), keine Zeile „Link kopiert“. Dateiname siehe BB2-H7. |
| BB-H10 | **teilweise** (Rest P3) | Zähler sagt jetzt „101 Bögen direkt in „THW“, außerhalb der Ordner oben“, beim Laden steht ein Platzhalter-Ordner — verständlich. Weiter: Feuerwehr enthält nur den Ordner „Niedersachsen“ (ein Tipp ohne Wahl); DRK mischt „Niedersachsen“ mit 8 losen Bögen, darunter „DRK-Kreisverband Buchenrode e. V. · Landesverband Saarland“. |
| BB-H11 | **teilweise** (Rest P3) | Klammer „(Bundeseinheiten)“ steht ganz; „Schließen“ neben dem Titel. Dafür trennt der Titel im Feld-Modus bei 360 px: „Beispiel-/bögen“ (Kopf 84 px). Pfadleiste in Tiefe 5 nun 146 statt 314 px, aber erste Karte bei 360 × 640 Feld erst bei y = 833 (Runde 1: 568), siehe BB2-H3. |

Hinweise aus Runde 1:

1. Erklärung ohne Aufklapp-Zeichen — **offen**: `summary` ist weiter Flexbox, kein Dreieck sichtbar (Bildschirmfoto
   `360x640-dlg.png`), wirkt wie ein Verweis.
2. Schmale Pfadziele — **behoben** („Alle“ 44 × 54, „THW“ 72 × 54 im Feld).
3. Lage des Abschnitts — **offen, verschärft**: ohne Bogen y = 1 999 (3,1 Bildschirme, Feld 360 × 640), mit eigenem Bogen
   2 365, mit Beispiel und Rückholplatz 2 678 (4,2 Bildschirme). Nach „Anzeigen“ → „‹ Startseite“ steht die Seite oben.
   Bewusst so gelassen (README Nr. 21); in Verbindung mit fehlendem Rückweg aus dem Bogen bleibt es ein Rollweg je Beispiel.
4. PDF-Dateiname ohne „Beispiel“ — **behoben** (Präfix `uebung-beispiel-`), dafür zu lang: BB2-H7.
5. Startseitenkarte ohne „Beispiel“ — **behoben** („BEISPIEL“); nach Neuladen „ÜBUNG“ (BB-H1 Rest).
6. Ordnernamen in „Praktische Ausbildung“ — **offen**: „Einlagen Kräfte Hannover“, „JUH OV Akkonia“, „JUH OV
   Johannesburg“, „JUH RV Malter“ unverändert.

## Befunde

### BB2-H1 [P2] Klebende Pfadleiste lässt im Querformat 42 px für die Liste; im Hochformat bis 43 % der Dialoghöhe

- **Typ:** Layout/Abstand
- **Evidence:** Observed (640 × 360 Feld und Standard; 360 × 640 und 390 × 844 Feld).
- **Ort:** Dialog „Beispielbögen“, Ebenen „Alle Einheiten aller Ortsverbände“ und „Bremen, Niedersachsen“, nach 200 px
  Bildlauf; OV-Ebene.
- **Beobachtung:** Kopfzeile und Pfadleiste kleben übereinander. Freie Höhe unter der Pfadleiste bis Dialogende:

  | Viewport / Modus | „Alle Einheiten …“ | „Bremen, Niedersachsen“ | OV Oldenburg |
  | --- | --- | --- | --- |
  | 640 × 360 Feld (Dialog 328 px) | Pfad 171 px → **82 px** frei | Pfad 211 px → **42 px** frei | Pfad 63 px → 190 px frei |
  | 640 × 360 Standard | 142 px → 117 px | 172 px → 87 px | 52 px → 207 px |
  | 360 × 640 Feld (Dialog 608 px) | 222 px → 300 px | 261 px → 261 px | 146 px → 376 px |

  Ursache sichtbar: die Kürzung „Alle › … › letzte zwei Ebenen“ lässt den langen Namen „Alle Einheiten aller Ortsverbände
  (nach Landesverband, Regionalstelle, OV)“ zwei- bis dreizeilig stehen (276 × 115 px), „‹ Zurück“ steht im Hochformat in
  eigener Zeile über dem Pfad. Im Querformat ist eine Karte 272 px hoch, frei sind 190 px: stehen die Knöpfe einer Karte
  oben im Bild, liegt deren Einheitsname schon unter der Pfadleiste (Bildschirmfoto `640x360-feld-ov-mitte.png`,
  `640x360-feld-Bremen-gerollt.png`: von der Liste ist eine Zeile „RSt Braunschweig“ zu sehen).
- **Erwartung des Helfers:** Quer gelegt, um mehr Liste zu sehen; oben eine Zeile „wo bin ich / zurück“.
- **Folge:** Im Querformat ist auf den Ebenen mit Landesverbänden und Regionalstellen je Wisch nur eine Zeile zu sehen;
  bei den Karten weiß man beim Tippen auf „Anzeigen“ nicht sicher, zu welcher Einheit der Knopf gehört. Hochformat
  funktioniert, kostet aber auf jeder Ebene fast die halbe Fläche.
- **Empfehlung:** Klebend nur eine Zeile halten: „‹ Zurück“ plus den letzten Pfadteil, einzeilig, mit Auslassung gekürzt;
  den vollen Pfad nur am Anfang der Liste (nicht klebend). Den Ordnernamen „Alle Einheiten aller Ortsverbände (nach
  Landesverband, Regionalstelle, OV)“ im Pfad kurz führen (z. B. „Ortsverbände“). Bei geringer Höhe (Querformat) den
  Kopf beim Rollen einklappen.
- **Nachprüfung:** 640 × 360 Feld, in „Bremen, Niedersachsen“ 200 px rollen: mindestens drei Registerzeilen ganz sichtbar;
  in OV Oldenburg sind Einheitsname und Knöpfe einer Karte gleichzeitig zu sehen.

### BB2-H2 [P2] Suche findet Einheiten nicht unter dem angezeigten Namen; „Oldenburg“ liefert die Regionalstelle statt des OV

- **Typ:** Bedienung (Finden)
- **Evidence:** Observed (360 × 640 Feld und 640 × 360, 14 Suchbegriffe).
- **Ort:** Dialog › Feld „Suchen“ (Platzhalter „Ort, OV oder Einheit, z. B. Oldenburg“).
- **Beobachtung:** Gesucht wird in Ordner- und Dateinamen, nicht in dem, was die Karte zeigt:

  | Eingabe | Ergebnis |
  | --- | --- |
  | „Zugtrupp Oldenburg“ | 0 Ordner, 0 Bögen (OV Oldenburg hat zwei Karten „Zugtrupp …“) |
  | „Bergung Biberach“ | 0 (Karte „Bergungsgruppe“ vorhanden) |
  | „Fachgruppe Notversorgung“ | 0 (Karte „Fachgruppe Notversorgung und Notinstandsetzung“ vorhanden) |
  | „B1“, „oldenbrug“ | 0, ohne Hinweis, was man anders eingeben könnte |
  | „Oldenburg“ | 2 Ordner, 57 Bögen: „THW › Alle Einheiten … › Bremen, Niedersachsen › RSt Oldenburg · 53 Bögen“ und „… › OV Oldenburg in Holstein“; die Liste beginnt mit „Fachgruppe Logistik-Verpflegung · Aurich“, dann Aurich, Emden …; OV Oldenburg (NI) erscheint nicht als eigener Ordner |
  | „Biberach“ | erster Treffer „… › RSt Biberach · 51 Bögen“, nicht „OV Biberach/Riß“ |
  | „Bad Toelz“, „Riss“ | gefunden (Umlaut-/ß-Ersatz funktioniert) |
  | „Sanitäts“ | 31 Bögen (Dateinamen ausgeschrieben) |

  Die Trefferzeilen der Ordner tragen den ganzen Pfad und sind 177 bis 231 px hoch.
- **Erwartung des Helfers:** „Ich tippe meinen OV oder ‚Zugtrupp Oldenburg‘ und bekomme genau das.“
- **Folge:** Der naheliegende Suchbegriff (Einheit + Ort, so wie es der Platzhalter vorschlägt) liefert „0 Bögen“; der
  Helfer schließt daraus, dass es den Bogen nicht gibt. Bei „Oldenburg“ muss er erkennen, dass die Regionalstelle gemeint
  ist, und dort weiterblättern — der Weg über die Suche ist dann nicht kürzer als über die Register.
- **Empfehlung:** Zusätzlich in den sichtbaren Angaben suchen (Einheitstyp ausgeschrieben, Ort, OV-Name, Zug), auch wenn
  sie erst geladen werden müssen — wenigstens für Einheitstyp und Kürzel (Ztr, B, N, FGr …) eine feste Zuordnung. Ordner,
  deren eigener Name passt (OV Oldenburg (NI)), vor deren Elternordner stellen. Bei 0 Treffern einen Satz zeigen
  („Nur Ort oder OV eingeben, z. B. ‚Oldenburg‘“). Trefferpfade kürzen („RSt Oldenburg · Bremen, Niedersachsen“).
- **Nachprüfung:** „Zugtrupp Oldenburg“ zeigt die Zugtrupp-Karten aus OV Oldenburg (NI); „Oldenburg“ zeigt „OV Oldenburg
  (NI)“ als ersten Treffer.

### BB2-H3 [P2] Im OV-Ordner steht „Alle 9 in eine Übungs-Sammlung“ als erster, großer Knopf vor den Bögen; die erste Karte liegt unter dem ersten Bild

- **Typ:** Bedienung (Fehlbedienung) / Layout
- **Evidence:** Observed (360 × 640 und 390 × 844 Feld, 640 × 360 Feld).
- **Ort:** Dialog › OV Oldenburg (NI) (ebenso THW „Alle 101 …“, DRK „Alle 8 …“), Bildlauf 0.
- **Beobachtung:** Reihenfolge unter der Pfadleiste: OV-Hinweis (4 Zeilen), „9 Bögen“, Knopf „Alle 9 in eine
  Übungs-Sammlung“ (276 × 72, zweizeilig, gleiche Rahmenoptik wie „Anzeigen“), Erklärsatz (4 Zeilen); Block 207 px. Die erste
  Karte beginnt bei 360 × 640 Feld bei y = 833 (Dialog endet bei 624), bei 390 × 844 Feld bei y ≈ 750 (nur ihr Kopf im
  Bild), quer bei y = 595 (Dialog endet bei 344). Eine Karte ist im Feld-Modus 360 bis 409 px hoch, „Link“ bricht in eine
  zweite Zeile. Ein Tipp auf den Sammelknopf öffnet ohne Rückfrage nach 0,6 s die Meldekopf-Ansicht einer neuen Sammlung
  „Übung: THW › Alle Einheiten …“ mit 9 Einheiten, „Bogen scannen…“, Stärke 2/18/47//67; auf der Startseite bleibt eine
  neue „Einsatz-Sammlung (Meldekopf)“ stehen.
- **Erwartung des Helfers:** Im Ordner zuerst die Bögen. Ein großer Knopf „Alle 9 …“ ganz oben wird als „alle anzeigen“
  gelesen.
- **Folge:** Wer nur ansehen will und den ersten großen Knopf nimmt, landet in einer Meldekopf-Ansicht, die er nicht
  kennt, und hat eine Sammlung auf der Startseite, die er löschen muss. Wer die Bögen sucht, muss erst wischen, ohne zu
  sehen, dass darunter etwas kommt.
- **Empfehlung:** Bögen zuerst; den Sammelweg ans Ende der Liste oder als schlichteren Verweis („Alle 9 als Übung am
  Meldekopf sammeln…“), mit kurzer Rückfrage, was entsteht. Den OV-Hinweis auf eine Zeile kürzen. In den Karten die drei
  Knöpfe in eine Reihe (im Feld-Modus nur Symbol + kurzes Wort oder schmalere Abstände).
- **Nachprüfung:** 360 × 640 Feld, OV Oldenburg: erste Karte samt Einheitsname oberhalb y = 500; der Sammelknopf ist nicht
  der erste Knopf unter der Pfadleiste.

### BB2-H4 [P3] Suche mit Bildschirmtastatur: quer kein Treffer sichtbar, hochkant einer; „Suchen“-Taste lässt die Tastatur stehen

- **Typ:** Layout/Abstand (Tastatur)
- **Evidence:** Likely (Tastatur angenähert durch kleineres Fenster); Enter-Verhalten Observed.
- **Ort:** Dialog › „Suchen“ nach Eingabe von „Biberach“ bzw. „Oldenburg“.
- **Beobachtung:** Hochkant (Fenster 360 × 352): Dialog 256 px, Suchfeld bei y = 99 bis 153, sichtbar ist nur der obere
  Teil der ersten Trefferzeile (177 px hoch). Quer (640 × 162): Dialog 130 px, Suchfeld reicht bis y = 153 und damit über
  das Dialogende; kein Treffer im Bild. Enter („Suchen“-Taste, `enterkeyhint=search`) lässt den Fokus im Feld, die Tastatur
  bliebe also offen. Das Löschen-Kreuz ist das kleine Browser-Symbol im Feld (Bildschirmfoto `360x640-suche-tastatur.png`).
- **Erwartung des Helfers:** Tippen, „Suchen“ drücken, Treffer sehen.
- **Folge:** Mit Handschuh tippen, dann Tastatur von Hand wegwischen, um die Treffer zu sehen; quer gar keine Rückmeldung
  beim Tippen.
- **Empfehlung:** „Suchen“-Taste schließt die Tastatur (Fokus aus dem Feld); Trefferzeilen kurz (siehe BB2-H2); Suchfeld
  beim Tippen an den oberen Dialogrand; eigener Löschknopf ≥ 44 × 44.
- **Nachprüfung:** Auf echtem Android-Telefon hoch und quer „Oldenburg“ suchen, „Suchen“-Taste: Tastatur zu, mindestens zwei
  Treffer sichtbar.

### BB2-H5 [P3] Nach Tipp auf einen Suchtreffer ist die Trefferliste weg; Zurück führt in den Elternordner, nicht zur Suche

- **Typ:** Bedienung (Orientierung)
- **Evidence:** Observed (360 × 640 Feld).
- **Ort:** Dialog › Suche „Biberach“ › Treffer „RSt Biberach“ › Zurück-Geste.
- **Beobachtung:** Nach dem Tipp steht der Pfad „Alle › … › Baden-Württemberg › RSt Biberach“, das Suchfeld ist leer. Zurück
  führt nach „Baden-Württemberg“, nicht zu den Treffern.
- **Erwartung des Helfers:** „Zurück zu meinen Suchergebnissen“, um den zweiten Treffer anzusehen.
- **Folge:** Für den zweiten Treffer erneut tippen (mit Handschuh mehrere Sekunden).
- **Empfehlung:** Suchtext beim Öffnen eines Treffers stehen lassen oder Zurück aus einem Treffer zur Trefferliste führen.
- **Nachprüfung:** Suche, Treffer öffnen, Zurück: Trefferliste wie zuvor.

### BB2-H6 [P3] Offline-Fehler verdeckt unter der klebenden Pfadleiste, derselbe Satz dreimal, bleibt nach Netzrückkehr stehen

- **Typ:** Text / Layout
- **Evidence:** Observed (360 × 640 Feld, offline).
- **Ort:** Dialog offline › OV Norden › „Anzeigen“ in einer Karte „nicht geladen“.
- **Beobachtung:** Der Dialog rollt zur Meldung (scrollTop 497); deren Anfang „Bogen konnte nicht geladen werden: Dieser
  Bogen liegt …“ liegt bei y = 52, also hinter Kopf und Pfadleiste (die bis y = 248 reichen); sichtbar ist erst „werden:
  Dieser Bogen liegt noch nicht auf dem Gerät …“ (Bildschirmfoto `r9-offline-ov-norden-fehler.png`). Der Satz „Die Bögen der
  THW-Ortsverbände lädt die App nicht vorab: Ein Bogen braucht beim ersten Öffnen Netz und bleibt danach auf dem Gerät.“
  steht dreimal untereinander (Ordnerhinweis, Ladehinweis mit „Erneut laden“, Fehlermeldung). Nach `setOffline(false)` lädt
  die Liste nach (Karten mit Klartext), die Fehlermeldung „Bogen konnte nicht geladen werden …“ bleibt aber stehen. Der
  Sammelknopf „Alle 5 in eine Übungs-Sammlung“ ist offline aktiv (nicht ausgelöst).
- **Erwartung des Helfers:** Eine Meldung, ganz lesbar, die verschwindet, wenn es wieder geht.
- **Folge:** Der Helfer liest einen halben Satz in Rot und drei gleiche Absätze; nach Netzrückkehr wirkt der Ordner
  weiter kaputt.
- **Empfehlung:** Meldung unterhalb der klebenden Leiste einrollen; den Satz einmal führen; Fehler bei Netzrückkehr und
  erfolgreichem Nachladen entfernen; Knöpfe (auch Sammelweg) nicht geladener Bögen offline sperren mit „nur mit Netz“.
- **Nachprüfung:** Offline in OV Norden „Anzeigen“: Meldung ab dem ersten Wort sichtbar, Satz einmal; Netz an: Meldung weg.

### BB2-H7 [P3] PDF-Dateiname 127 Zeichen mit doppeltem OV-Teil

- **Typ:** Text
- **Evidence:** Observed (360 × 640, Download gespeichert).
- **Ort:** OV Oldenburg (NI) › Karte „Fachgruppe Notversorgung …“ › „PDF“.
- **Beobachtung:** Datei „uebung-beispiel-thw-ortsverbaende-lv-bremen-niedersachsen-rst-oldenburg-ov-oldenburg-ni-ov-oldenburg-ni-07-1-tz-fgr-n.pdf“;
  „ov-oldenburg-ni“ steht zweimal. Die Quittung dazu ist im Feld-Modus 141 px hoch (sechs Zeilen).
- **Erwartung des Helfers:** In der Download-Liste „Beispiel Oldenburg FGr N“ erkennen.
- **Folge:** Download-Listen und Messenger kürzen den Namen in der Mitte oder am Ende; Einheit und Ort, also das
  Unterscheidende, stehen ganz hinten und sind dann weg.
- **Empfehlung:** Kurz und mit dem Unterscheidenden vorn, z. B. „uebung-beispiel-oldenburg-ni-fgr-n.pdf“; Ordnerkette nicht
  wiederholen.
- **Nachprüfung:** Dateiname unter 50 Zeichen, Ort und Einheit in den ersten 40 Zeichen.

### BB2-H8 [P3] Sammlungsname ist der ganze Ordnerpfad: zehn Zeilen im Kopf der Meldekopf-Ansicht

- **Typ:** Text / Layout
- **Evidence:** Observed (360 × 640 Feld).
- **Ort:** OV Oldenburg › „Alle 9 in eine Übungs-Sammlung“ › neue Sammlung.
- **Beobachtung:** Titel „Übung: THW › Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV) › Bremen,
  Niedersachsen › RSt Oldenburg › OV Oldenburg (NI)“ — im Kopf zehn Zeilen, 330 px, mit Silbentrennung „Ortsver-/bände“,
  „Landesver-/band“, „Nie-/dersachsen“ (Bildschirmfoto `r6-sammlung.png`). Bei THW („Alle 101 …“) lautet er nur „Übung: THW“.
- **Erwartung des Helfers:** „Übung OV Oldenburg“.
- **Folge:** Die Stärkeübersicht rückt unter das erste Bild; der Name taucht vermutlich ebenso lang auf Lageblatt und
  Sammel-PDF auf (nicht geprüft).
- **Empfehlung:** Name aus dem letzten Pfadteil bilden („Übung: OV Oldenburg (NI)“).
- **Nachprüfung:** Sammelweg aus OV Oldenburg: Titel einzeilig oder zweizeilig.

### BB2-H9 [P3] Querformat: auf der obersten Ebene nur ein Register im Bild

- **Typ:** Layout/Abstand
- **Evidence:** Observed (640 × 360 Feld; Standard: zwei).
- **Ort:** Dialog, oberste Ebene, Bildlauf 0.
- **Beobachtung:** Kopf 73 px, Erklärungszeile, „Suchen“ mit Feld (54 px), dann „ASB · 4 Bögen“ als einzige ganze Zeile
  (Bildschirmfoto `640x360-feld-top.png`); bis „THW“ (letzte Zeile) acht Zeilen à ≈ 64 px wischen.
- **Erwartung des Helfers:** Quer gelegt sieht er die Register auf einen Blick.
- **Folge:** Gering; mehrere Wischer, bevor THW kommt.
- **Empfehlung:** Bei geringer Höhe Erklärung und Suchfeld in eine Zeile (Suchsymbol), Register zweispaltig.
- **Nachprüfung:** 640 × 360 Feld: mindestens vier Register ganz im Bild.

## Hinweise (ohne Priorität, keine Beeinträchtigung der Aufgabe)

1. **Titel im Feld-Modus getrennt:** „Beispiel-/bögen“ bei 360 px (Kopf 84 px statt 73 px wie bei 390 px).
2. **Platzhalter abgeschnitten:** „Ort, OV oder Einheit, z. B. Old“ (360 × 640 Feld) bzw. „… z. B. Oldenb“ (390 × 844) — das
   Beispiel „Oldenburg“ ist gerade der Begriff, der zur Regionalstelle führt (BB2-H2).
3. **Rückfrage-Knöpfe im Feld-Modus 48 px:** „Beispielbogen öffnen“ / „Abbrechen“ 300 × 48, im übrigen Feld-Modus 54 px.
4. **Nachgeladener Dialog:** erstes Öffnen 0,9 bis 1,1 s ohne Rückmeldung am Knopf; unauffällig, auf langsamem Gerät aber
   ein möglicher Anlass für einen zweiten Tipp (nicht beobachtet, Doppeltipp-Sperre vorhanden).
5. **„…“ in der Pfadleiste nicht antippbar:** Die ausgelassenen Ebenen (THW, Alle Einheiten …, Land) sind nur über „‹ Zurück“
   oder „Alle“ zu erreichen; für einen Sprung zum Land fehlt der Weg.
6. **Rückweg aus dem Bogen:** wie im README vermerkt kein „Zurück zu den Beispielbögen“; mit Hinweis 3 der längste Weg im
   Bereich.

## Comprehension check

- Orientation: understood (Pfadleiste, gemerkter Ordner, Zurück eine Ebene; uncertain in Suchtreffern mit RSt statt OV, BB2-H2, und quer unter der hohen Pfadleiste, BB2-H1)
- Next action: understood (drei Knöpfe je Karte; uncertain im OV-Ordner, wo der Sammelknopf zuerst kommt, BB2-H3)
- System status: uncertain (Offline-Zeile ehrlich; PDF-Quittung außer Sicht, BB-H9; Fehler verdeckt und bleibt stehen, BB2-H6)
- Error recovery: understood (Zurück-Geste, Escape, Rückfrage; uncertain nach Neuladen, wo wieder „endgültig löschen“ gefragt wird, BB-H1)
- Field suitability: limited (online hochkant suitable; quer und mit Bildschirmtastatur eingeschränkt; offline für nie geöffnete OV-Bögen wie angekündigt nicht nutzbar)
