# Audit „Neuer Nutzer", Runde 5 (THW-Helfer ohne Einweisung)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit c0cbae0 (Code entspricht 4fcdbaf).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, ohne Kamera.
Jeder Lauf hatte einen eigenen Browser-Kontext. Der Server lief gleichzeitig
für elf weitere Prüfer; Zeiten habe ich deshalb nicht gewertet. Ein Teil der
Läufe begann mit leerem Speicher, alle Zustände entstanden dort durch
Bedienung (Sammlung anlegen, Bögen über Links aufnehmen, Dateien und Bilder
einlesen). Die übrigen Läufe begannen mit `localStorage`-Seeds
(`eeb.entwurf.v1`, `eeb.uhr.v1`) aus `examples/`, jeweils mit `uebung: false`:

- THW: 013 Ulm B (auch mit auf heute gesetzten Zeitraum- und Standwerten, mit
  anderem Personal und Kennzeichen, mit Typ „Abstützsystem Holz“ und mit dem
  Ortsnamen „Neu-Ulm“), 024 Mühldorf B, 025 Neu-Ulm FGr F, 002 Biberach FGr O.
- Andere Organisationen: DRK `bhp25-behandlung-gelb`, DLRG
  `wrz-mittelbaden-bootsgruppe`, Feuerwehr `niedersachsen/gruppe-sudheim`, ASB
  `einsatzeinheit-sanitaetsgruppe`, Bundeswehr `panzerpionierzug`, BBK
  `fuehrungsgruppe`. Aus den Bögen entstanden über „Link teilen“ Links für das
  Meldekopf-Gerät; die PDF der Bögen wurde erzeugt, gerastert (150 dpi) und als
  Bild und als PDF wieder eingelesen.
- Geräteuhr: `eeb.uhr.v1` mit „letzter Start vor 120 Tagen“ (echter Sprung
  nicht nachgestellt, nur der Zustand danach).

Ich habe zuerst ohne Blick in Anleitung, Dokumentation oder frühere Berichte
getestet. Danach habe ich den Runde-4-Bericht samt „Stand der Behebung“ und
die Übersicht `runde-4/README.md` gelesen, erst zuletzt die übrigen
Runde-5-Berichte (Stand beim Lesen: alle elf lagen vor).

Rolle: Helfer eines THW-Ortsverbands, kennt den Papier-Erfassungsbogen, hat
die App nie gesehen. Szenarien:

1. **Eigenen Bogen melden:** leeres Gerät → „Neuen Bogen erstellen“ → alle
   Schritte → Übersicht → „Bogen übergeben…“ → QR-Vollbild, „Weitere
   Formate“. Dazu Bögen anderer Organisationen als Entwurf öffnen und die
   Übersicht lesen.
2. **Am Meldekopf aushelfen:** Sammlung anlegen, acht Bögen aus fünf
   Organisationen aufnehmen, Karten aufklappen („Mehr…“, „Abrücken“,
   „Entfernen“, „Aufteilen…“, „Verschieben…“, „Stärke ändern…“), Lageblatt
   erzeugen und lesen, „Einheit manuell erfassen…“ mit „Stärke fehlt“.
3. **Rückfragen:** „Wohin damit?“ (Link und Datei), „Einheit ist bereits
   gemeldet“ (gleiche und andere Personen), „Ist das dieselbe Einheit?“
   (manuell ohne Typ, danach Bogen mit Typ), Zurück-Geste bei offener Rückfrage.
4. **Papier-Rückweg:** Bögen als Bild (PNG) und als PDF in „Bögen einlesen…“,
   „Lage vom Papier abgleichen…“.
5. **Geräteuhr, Ansicht, Startseite:** Warnung bei gesprungener Uhr,
   Ansichtsschalter an allen drei Stellen, erstes Bild der Startseite.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, USB-Handscanner, native
Datums- und Auswahllisten (headless Chromium zeigt Datum im US-Format
„10/06/2026, 11:56 AM“; das werte ich nicht), Bildschirmtastatur (die
„tastatur-offen“-Behandlung aus R4-G3 konnte ich nicht auslösen; die
Namensvorschläge lagen in meinen Läufen ohne Tastatur unter der Fußleiste),
echtes Drucken, native Builds, WebKit/Safari, ein echter Sprung der Geräteuhr
(nur der Zustand danach). Ein Tipp auf „In Einsatz übernehmen“ in der ersten
Sekunde nach dem Öffnen der Aufnahme blieb in vier von vier Läufen
wirkungslos, ab zwei Sekunden Wartezeit wirkte er (zwei von zwei); unter
gleichzeitiger Last von zwölf Prüfern ordne ich das nicht als eigenen Befund
ein (siehe Verweis auf R5-G5/R5-S2).

## Urteil

Der eigene Bogen und der Meldekopf gelingen ohne Hilfe. Die Rückfragen aus
Runde 4 tragen: „Wohin damit?“ stellt sich bei Link und Datei, „Einheit ist
bereits gemeldet“ zeigt „Bisher“ und „Neu“ untereinander und warnt bei
„Keine gemeinsame Person, kein gemeinsames Fahrzeug“, „Ist das dieselbe
Einheit?“ nennt beide Bezeichnungen, beide Stärken und beide Stände, und die
Wahl „Ja“ lässt sich über „Rückgängig“ zurücknehmen. Auch das Lageblatt liest
sich ohne Erklärung (Nr., Zug, Funkrufname, Eintreffen, Stand, Stärke F / U /
M / G, Bedarf, „Veränderung seit der letzten Meldung“, Rückfragen je Zeile).
Die Zurück-Geste schließt jetzt die Rückfrage „Meldung entfernen?“ und
verlässt die Ansicht nicht.

Reibung entsteht an einer Stelle, die ein Neuling sofort sieht: Die Marke
„⚠ Anderer Einsatz?“ steht bei den ersten Bögen einer frischen Sammlung fast
immer da, auch wenn der Bogen zur Lage passt. Der Neuling hält sie für einen
Fehler seines Scans oder lernt, sie zu übersehen, also gerade dann, wenn sie
einmal stimmt (R5-N1). Dazu kommen acht kleine Stellen: Der Rat „Zeitraum bis
stehen lassen“ führt am Folgetag zur Marke „Zeitraum vorbei“ (R5-N2), ein
Neuladen springt in eine halbfertige Aufnahme, die man über „‹ Startseite“
verlassen hat (R5-N3), der Ansichtsschalter heißt an drei Stellen
verschieden (R5-N4), „Rückfrage“ meint zwei Dinge (R5-N5), bei Bögen anderer
Organisationen stehen Namensteile doppelt (R5-N6), einige Fachwörter stehen
ohne Erklärung da (R5-N7), „⇑“ erklärt sich nur im Tooltip (R5-N8), und der
Bericht nach dem Bildeinlesen zeigt „Lage vom Papier abgleichen…“ zweimal
(R5-N9).

Aufgabe 1 bis 4 gelingen ohne fremde Hilfe. Beim Papier-Rückweg stimmt die
Zeit im Abgleich nicht von allein (Verweis R5-A1).

## Befunde

### R5-N1 [P2] „⚠ Anderer Einsatz?“ steht bei den ersten Bögen einer frischen Sammlung fast immer da, auch wenn der Bogen passt (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet; Ursache im Code nachgesehen.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Weser“ (nur Name, ohne „Ort /
Auftrag“, so wie der Dialog „Neue Einsatz-Sammlung anlegen“ es zulässt: „Ort /
Auftrag (optional)“). Bogen THW Ulm B (013, Ort/Auftrag „Gebäudeschaden Ulm —
Abstützen, Räumen“) per Link aufgenommen. Code:
`src/app/einheiten-tabelle.ts` Z. 183–199 (`abweichenderOrt`),
`src/app/einsaetze-ui.tsx` Z. 1010 und 3085.

**Beobachtung:** Der Vergleich nimmt die Wörter aus dem Sammlungsnamen und aus
dem Ort/Auftrag der übrigen Meldungen. „Hochwasser Weser“ teilt kein Wort mit
„Gebäudeschaden Ulm — Abstützen, Räumen“. Schon die erste Karte trägt darum
„⚠ Anderer Einsatz?“, die Quittung „— ⚠ Bogen nennt: „…“, passt das zu dieser
Lage?“ und aufgeklappt „Zählt trotzdem mit“. Mit drei Bögen (Ulm, Neu-Ulm,
DRK) trugen alle drei die Marke, mit acht Bögen aus fünf Organisationen nur
noch einer (die übrigen teilten irgendein Wort untereinander). Ein Bogen,
dessen Ort/Auftrag den Sammlungsnamen nennt, bleibt ohne Marke. Die
Sammlung selbst hat aber meist nur einen Namen („Hochwasser Weser“), die
Einheiten melden einen Auftrag („Deichsicherung Hameln“).

**Erwartung der Rolle:** Eine Warnung „Anderer Einsatz?“ erwarte ich, wenn
etwas nicht stimmt. Bei der ersten gescannten Einheit der Lage kann nichts
anderes dastehen als die Lage selbst.

**Auswirkung im Einsatz:** Der Helfer schaut beim ersten Bogen auf das
Etikett und denkt, er habe den falschen Code gescannt. Oder er lernt in den
ersten Minuten, die Marke wegzuklicken. Dann geht die eine Meldung unter, bei
der sie stimmt (R5-K5 beschreibt genau diesen Fall mit Ort in der Sammlung).

**Empfehlung:** Die Marke nur zeigen, wenn die Sammlung selbst einen Ort/Auftrag
hat oder mindestens zwei übrige Meldungen einen gemeinsamen Ort tragen und der
Bogen davon abweicht. Fehlt der Bezug, den Hinweis weglassen oder einmalig
sagen: „Die Sammlung hat keinen Ort — Ort/Auftrag der Bögen nicht
vergleichbar.“

**Nachprüfung:** Sammlung nur mit Namen anlegen, einen Bogen mit beliebigem
Auftrag aufnehmen: keine Marke und keine Warnzeile in der Quittung. Mit Ort in
der Sammlung und einem Bogen mit fremdem Ort muss die Marke weiter kommen.

### R5-N2 [P3] Schritt 2 rät, „Zeitraum bis“ stehen zu lassen; am Folgetag nennt dieselbe App den Bogen „Zeitraum vorbei“ (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Neuer Bogen, Schritt 2 („„Zeitraum bis“ ist mit dem
Tag des Beginns vorbelegt; steht das Ende noch nicht fest, den Vorschlag
einfach stehen lassen und später nachtragen.“). Danach Bogen 013 mit
Zeitraum von = bis = gestern am Meldekopf aufgenommen. Code:
`src/app/schritte/einsatz.tsx` (Hilfetext), Marke in
`src/app/einheiten-tabelle.ts` Z. 248.

**Beobachtung:** Der Rat im Schritt ist klar und wird befolgt. Am Meldekopf
trägt dieselbe Einheit am nächsten Tag die Marke „Zeitraum vorbei“ (Karte),
in der eigenen Übersicht „⚠ 1 offener Punkt … Einsatzzeitraum … ist vorbei —
gilt dieser Bogen noch für den aktuellen Einsatz? Sonst Zeitraum und
Ort/Auftrag neu eintragen.“ und im Dialog „Bogen übergeben…“ „Dieser Bogen
gehört zum Einsatz …“ mit „Für neuen Einsatz vorbereiten“.

**Erwartung der Rolle:** Wenn die App sagt „später nachtragen“, erwarte ich
eine Erinnerung am Tag, an dem das Ende feststeht, nicht eine Marke für eine
Einheit, die noch im Einsatz ist.

**Auswirkung im Einsatz:** Bei mehrtägigen Einsätzen trägt jede Einheit, die
den Vorschlag stehen ließ, ab Tag zwei die Marke. Am Meldekopf mischt sie
sich unter echte Hinweise (siehe R5-N1). Der Helfer trägt kein Ende nach,
weil es noch keins gibt.

**Empfehlung:** Den Vorschlag „wie Beginn“ als offen kennzeichnen („Ende offen“)
und die Marke am Folgetag nur für Bögen mit gesetztem Ende zeigen; oder im
Schritt sagen: „Läuft der Einsatz länger, Ende morgen nachtragen — sonst steht
die Einheit als „Zeitraum vorbei“.“

**Nachprüfung:** Bogen mit dem Vorschlag, Gerätedatum einen Tag später: Karte
und Übersicht dürfen keinen Widerspruch zum Rat aus Schritt 2 zeigen.

### R5-N3 [P3] Nach Neuladen steht die App in der halbfertigen Meldekopf-Aufnahme, obwohl man sie über „‹ Startseite“ verlassen hat (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Sammlung → „Einheit manuell erfassen…“ → Name „Ulm“
eingetragen → „‹ Einsatz „Hochwasser Weser““ → „‹ Startseite“ → Seite neu
laden. Code: `src/app/app.tsx` Z. 802 („Entwurf … wiederhergestellt.“).

**Beobachtung:** Die Startseite erscheint vor dem Neuladen wie erwartet
(„Digitaler Einheiten-Erfassungsbogen“). Nach dem Neuladen steht oben „‹ Einsatz
„Hochwasser Weser““ und „Aufnahme für: Hochwasser Weser“, darunter „Entwurf vom
06.10.26, 12:12 Uhr wiederhergestellt.“ und Schritt 1 mit dem eingetragenen
Namen. Der eigene Bogen verhält sich anders: Dort bleibt nach dem Neuladen die
Startseite mit der Karte „Fortsetzen / Verwerfen“.

**Erwartung der Rolle:** Wer „Startseite“ gewählt hat, will nach einem
Neuladen (Telefon schläft, Tab wird neu geladen) wieder dort stehen. Eine
angefangene Aufnahme biete ich mir über „Weiter erfassen“ an (der Knopf
existiert in der Sammlung).

**Auswirkung im Einsatz:** Der Helfer landet unerwartet in einem Formular, das
er nicht mehr im Kopf hat, und tippt es womöglich mit der Meldung eines anderen
Einsatzes zu Ende („In Einsatz übernehmen“).

**Empfehlung:** Nach „‹ Startseite“ auch im Fall der Aufnahme die Startseite
mit einer Karte „Angefangene Erfassung für „Hochwasser Weser“ — Fortsetzen /
Verwerfen“ zeigen, wie beim eigenen Bogen.

**Nachprüfung:** Aufnahme beginnen, über „‹ Startseite“ verlassen, neu laden:
Startseite mit Karte, nicht das Formular.

### R5-N4 [P3] Der Ansichtsschalter heißt an drei Stellen verschieden und hat auf der Sammlungsseite keine Überschrift (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Startseite und Assistent (Kopf: „Ansicht: Standard
▾“), Assistent (Fußleiste: „◐“ ohne Text), Sammlungsseite (Vierer-Schalter
„Standard / Feld / Dunkel / Nacht“ im Kopf ohne Überschrift, dazu schwebendes
„◐“), Seitenende („DARSTELLUNG“ mit denselben vier Knöpfen). Code:
`src/app/anzeige-schalter.tsx`, `src/app/fusszeile.tsx` Z. 821.

**Beobachtung:** Der aufgeklappte Schalter erklärt sich gut („Standard · normal“,
„Feld · große Tasten“, „Dunkel · abends“, „Nacht · gedimmt“). Es fehlt der
gemeinsame Name: „Ansicht“ im Kopf, kein Wort an „◐“, „Darstellung“ am
Seitenende, auf der Sammlungsseite gar kein Wort. Auf der Sammlungsseite steht
das erste Bild „‹ Startseite“ über vier Wörtern, die nach Filter oder Reiter
aussehen.

**Erwartung der Rolle:** Ein Schalter, der die Anzeige ändert, trägt überall
dieselbe Bezeichnung. „◐“ allein sagt mir nicht „Ansicht ändern“.

**Auswirkung im Einsatz:** Wer nachts blendet, sucht „Dunkel“ und findet es nur,
wenn er „Ansicht“ oder das Symbol kennt. Die Sammlungsseite lässt ihn
„Standard“ als Reiter lesen.

**Empfehlung:** Überall „Ansicht“ (auch am Seitenende), „◐ Ansicht“ mit
Text in der Fußleiste und auf der Sammlungsseite eine Überschrift „Ansicht:“.

**Nachprüfung:** Einem ungeschulten Helfer sagen „Mach den Bildschirm für die
Nacht dunkel“ — er soll ihn in beiden Ansichten (Assistent, Sammlung) ohne
Suchen finden.

**Verweis:** Das schwebende „◐“ liegt auf dem Inhalt und überdeckt Text,
Marken und Kästchen am linken Rand (`elementFromPoint` auf dem Kästchen
„Brandt, Uwe“ in „Aufteilen“ liefert den Knopf): R5-L1
([nacht-und-sicht.md](nacht-und-sicht.md)), dort auch in
[mobile-ui.md](mobile-ui.md) und [fuehrungssicht.md](fuehrungssicht.md).

### R5-N5 [P3] „Rückfrage“ meint an der Karte und im Lageblatt eine Hinweisliste, nicht eine Frage (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet; Annahme zum Sprachgebrauch gekennzeichnet.

**Fundstelle / Aufgabe:** Aufgeklappte Karte: Knopf „Rückfrage: Zeitraum vorbei
+ 3 weitere“; Lageblatt-PDF: „Rückfrage: Zeitraum vorbei; keine Rufnummer; kein
Kraftfahrer“; daneben heißen die Dialoge „Wohin damit?“, „Ist das dieselbe
Einheit?“, „Stärke fehlt“ in meinem Sprachgebrauch „Rückfragen“.

**Beobachtung:** Die „Rückfrage“ an der Karte öffnet keine Frage, sondern
legt unter den Knöpfen eine Liste von Sätzen frei („Einsatzzeitraum … ist
vorbei — gilt dieser Bogen noch …?“, „Sitzplätze: 3 in den erfassten
Fahrzeugen für 7 Personen …“). Die Liste liegt unterhalb der Knopfreihen, rund
300 px unter der Marke. Auf dem Lageblatt steht „Rückfrage“ vor Stichworten.

**Erwartung der Rolle:** (Annahme: Im Funkverkehr ist „Rückfrage“ eine Frage
an die Gegenstelle.) Ich erwarte, dass „Rückfrage“ etwas ist, das ich an die
Einheit richte oder das mich etwas fragt, nicht eine Mängelliste.

**Auswirkung im Einsatz:** Der Helfer funkt eine „Rückfrage“ an die Einheit
(„Zeitraum vorbei?“), die nur ein App-Hinweis ist. Oder er hält die
Lageblatt-Zeile für offen, obwohl sie nur etwas anmerkt.

**Empfehlung:** Die Liste „Hinweise“ nennen (Marke: „Hinweise: Zeitraum vorbei
+ 3 weitere“; Lageblatt: „Hinweise: …“) und „Rückfrage“ den Dialogen
überlassen, die wirklich etwas fragen.

**Nachprüfung:** Einem ungeschulten Helfer die aufgeklappte Karte zeigen und
fragen, was „Rückfrage: …“ von ihm verlangt.

### R5-N6 [P3] Bei Bögen anderer Organisationen stehen Namensteile doppelt oder in ungewohnter Folge (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Karten der Sammlung, „Meldung von … empfangen“,
Quittung und Lageblatt für die Beispielbögen. Bezeichnung aus
`einheitAnzeigename` (`src/app/hilfen.ts`).

**Beobachtung:** Beispiele aus den geprüften Bögen:

- „Bundeswehr Panzerpionierzug Panzerpionierzug“ (Übersicht „Bundeswehr ·
  Panzerpionierzug · Panzerpionierzug“)
- „DRK-Kreisverband Buchenrode e. V. Buchenrode Behandlung Kat. GELB (BHP 25)“
- „Freiwillige Feuerwehr Northeim Sudheim Gruppe“ (liest sich wie „die Gruppe
  Sudheim der FF Northeim“, nicht wie „Ortsfeuerwehr Sudheim, Gruppe“)
- „Berufsfeuerwehr Nordwede — MTF-Standort (Bundesausstattung) Nordwede
  Führungsgruppe (MTF)“
- „ASB-Kreisverband Rheindorf e. V. Rheindorf Sanitätsgruppe (Einsatzeinheit)“

THW-Bögen („THW Ulm Bergungsgruppe“) sind sauber.

**Erwartung der Rolle:** Name der Einheit, Ort, Typ, jeweils einmal. Auf dem
Funk und am Lageblatt nenne ich „Rotkreuz Buchenrode Behandlung gelb“, nicht
den Verbandsnamen mit Ortsnamen zweimal.

**Auswirkung im Einsatz:** Zeilen werden lang, am Telefon brechen sie in drei
Zeilen um (Lageblatt-Spalte „Einheit“), und der Helfer sucht „seine“ Einheit
in der Liste länger.

**Empfehlung:** Ort nicht wiederholen, wenn er schon im Organisationsnamen oder
im Einheitsnamen steht; Typ nicht wiederholen, wenn er dem Namen entspricht.
Bei Feuerwehr die Reihenfolge „Ortsfeuerwehr, Typ“ behalten.

**Nachprüfung:** Je ein Bogen von DRK, Bundeswehr, Feuerwehr, ASB in die
Sammlung aufnehmen: Der Name steht in Karte, Quittung und Lageblatt ohne
doppelten Ort oder Typ.

### R5-N7 [P3] Einige Fachwörter stehen ohne Erklärung da (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Eigener Bogen, Schritt 3 („Nur Stärke
(Meldekopf-Schnellerfassung)“); „Bogen übergeben…“ → „Weitere Formate“ („Als
Excel (Format „Oldenburg“)“); Dialog „Einheit ist bereits gemeldet“ („neue
Fassung“); „Bögen einlesen…“ → „Stapel eingelesen“ („Unvollständiger
mehrteiliger Bogen“). Code: `src/app/schritte/personal.tsx`,
`src/app/einsaetze-ui.tsx` Z. 1839, `src/app/stapel-quittung.tsx` Z. 69.

**Beobachtung:**
- Im eigenen Bogen verlangt Schritt 3 die Wahl zwischen „Personal vollständig
  erfassen“ und „Nur Stärke (Meldekopf-Schnellerfassung)“. Wer seinen eigenen
  Bogen ausfüllt, braucht den zweiten Weg nicht, und das Wort
  „Meldekopf-Schnellerfassung“ nennt eine Funktion des anderen Geräts.
- „Excel (Format „Oldenburg“)“ ist erklärt („Eine Zeile in der Einheitenliste
  der Führungsstelle …“), der Name „Oldenburg“ sagt es nicht.
- „Als neue Fassung anhängen“ ist erklärt („Der Normalfall bei einer
  Folgemeldung: die bisherige Meldung wandert in die Historie“), aber „Fassung“
  und „Folgemeldung“ sind App-Wörter; THW-Helfer sagen „neue Meldung“ oder
  „Nachmeldung“ (Annahme).
- „Stapel eingelesen“, „mehrteiliger Bogen“ und „Teile 1, 2 fehlen“ meinen
  Bilder und QR-Seiten; ein Helfer mit einem Foto des Blatts liest „Stapel“
  nicht als „meine Fotos“.

**Erwartung der Rolle:** Schaltflächen und Überschriften sagen in meinen Worten,
was passiert.

**Auswirkung im Einsatz:** Kurzes Stutzen, im ersten Fall die Wahl der falschen
Betriebsart für den eigenen Bogen (Stärke ohne Namen und Fahrzeuge).

**Empfehlung:** Schritt 3 beim eigenen Bogen ohne die Wahl „Nur Stärke“ zeigen
(oder „Nur die Zahlen, keine Namen“); „Oldenburg“ ersetzen oder erklären
(„Excel-Liste der Führungsstelle Oldenburg“); „neue Fassung“ gegen „neue
Meldung dieser Einheit“ tauschen; „Stapel“ gegen „Bilder und Dateien“.

**Nachprüfung:** Einen ungeschulten Helfer die vier Stellen vorlesen und mit
eigenen Worten wiedergeben lassen.

### R5-N8 [P3] „⇑“ in der Personenliste erklärt sich nur im Tooltip; dort steht die Folge (neu)

**Priorität:** P3

**Kennzeichnung:** Risiko (Code gelesen, Tooltip auf Touch nicht erreichbar).

**Fundstelle / Aufgabe:** Schritt 3, „Kurz-Liste (Tabelle)“ nach „Namen
einfügen…“, ab der zweiten Person die Knöpfe „▲ ▼ ⇑ ✕“. Code:
`src/app/schritte/personal.tsx` Z. 309–317.

**Beobachtung:** „⇑“ trägt `aria-label` „Person n an die erste Stelle“ und
`title` „An die erste Stelle — gilt im PDF und in der Meldung als erreichbar
für Rückfragen“. Sichtbar ist nur das Symbol. Auf dem Telefon gibt es keinen
Tooltip. Dass die erste Person die Ansprechperson wird, steht sichtbar nur als
Regel unter der ersten Karte in der Kartenansicht.

**Erwartung der Rolle:** Ein Pfeil mit Doppelstrich sagt „nach oben“, nicht
„diese Person wird Ansprechperson“.

**Auswirkung im Einsatz:** Der Helfer sortiert mit „⇑“ eine Vertretung nach
oben und macht sie damit ohne Absicht zur Person, die der Meldekopf anruft.

**Empfehlung:** Auch in der Kurz-Liste die Regel einmal als Zeile über der Liste
zeigen („Die erste Person ist die Ansprechperson.“) oder „⇑“ als „Ganz nach
oben“ beschriften.

**Nachprüfung:** Kurz-Liste mit drei Personen: Die Regel zur Ansprechperson
ist im Bild, ohne dass ein Tooltip nötig ist.

**Verweis:** Lage der Knöpfe „✕“ über „⇑“: R5-G2
([handschuh-bedienung.md](handschuh-bedienung.md)).

### R5-N9 [P3] Nach „Bögen einlesen…“ von Bildern steht „Lage vom Papier abgleichen…“ zweimal im Bild (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Sammlung → „Bögen einlesen…“ mit einer PNG-Aufnahme
des Übergabeblatts (und einer dritten Seite eines mehrteiligen Bogens). Code:
`src/app/stapel-quittung.tsx` Z. 78, `src/app/papier-abgleich-ui.tsx` Z. 166–177.

**Beobachtung:** Der Bericht „Stapel eingelesen“ führt mit zwei
Aufzählungspunkten über das Ergebnis, einem blauen Knopf „Lage vom Papier
abgleichen…“ und zwei weiteren Aufzählungspunkten (Handkorrekturen auf dem
Ausdruck, „Eintreffzeit, Status, Zug und Nummer stehen nicht im Code“). Auf dem
Bild ist der Bericht eine Bildschirmhöhe lang. Darunter folgt die Karte „Vom
Papier eingelesen, Lage noch nicht abgeglichen: 1 Einheit“ mit demselben Knopf.
Der Abgleich selbst (Nr. laut Blatt, Eingetroffen am, Status, Zug, Auftrag /
Notiz) ist klar beschriftet.

**Erwartung der Rolle:** Ein Weg zum Abgleich, einmal.

**Auswirkung im Einsatz:** Kurzes Zögern, welcher der beiden Knöpfe der richtige
ist. Der Bericht verdrängt die Karte der neu aufgenommenen Einheit nach unten.

**Empfehlung:** Knopf nur in der Karte lassen oder den Bericht auf den
Ergebnissatz plus Verweis kürzen („Weiteres zum Papier: siehe Karte unten“).

**Nachprüfung:** Ein Bild einlesen: Der Knopf „Lage vom Papier abgleichen…“
steht genau einmal im ersten Bild.

**Verweis:** Zeit des Einlesens als Eintreffzeit nach „Abgleich übernehmen“
(das Feld „Eingetroffen am“ ist mit der Einlesezeit vorbelegt): R5-A1
([analog-first.md](analog-first.md)); Stapelbericht mit falscher Seitenzählung:
R5-A5.

## Verweise auf Befunde in anderen Runde-5-Berichten

Diese Stellen habe ich selbst gesehen und zähle sie hier nicht:

- **Startseite, erstes Bild:** Bei 360 × 640 liegt „Neuen Bogen erstellen“ nach
  fertiger Installation bei 592 px (Unterkante 637 px, am echten Telefon mit
  Browserleiste unter dem Bild), während der Installation (Kasten „Wird für den
  Offline-Betrieb geladen“) bei 655 px, bei 320 × 568 bei 692 px. Siehe R5-M2
  ([mobile-ui.md](mobile-ui.md)).
- **Schwebendes „◐“ über Inhalt:** R5-L1 (siehe R5-N4).
- **Geräteuhr:** Die Warnung „Geräteuhr prüfen“ kommt auch bei einer echten Pause
  von mehr als 60 Tagen (Seed: letzter Start vor 120 Tagen, Warnung nennt den
  08.06.2026 und den 06.10.2026); der Satz „Stimmt es, gilt es ab dem nächsten
  Start (frühestens morgen)“ erklärt nicht, was bis dahin bleibt. Siehe R5-D1 und
  R5-D4 ([zerstoerende-handlungen.md](zerstoerende-handlungen.md)).
- **Tipp in der ersten Sekunde:** R5-G5 und R5-S2 (Fingerstellen-Sperre
  schweigt).
- **Lageblatt-Zeile „Bemerkung der Einheit“ abgeschnitten:** R5-A9.

## Bestätigtes

- **Startseite:** Zweck, zwei Rollen („Meinen Bogen ausfüllen“, „Bögen sammeln
  (Meldekopf)“), „So funktioniert’s“, Offline-Zeile mit Ladefortschritt und
  danach „Funktioniert komplett offline“. Mit Entwurf steht die Karte mit
  „Fortsetzen / Verwerfen“ vorn.
- **Wizard:** Schritt 1 bietet für „THW Ortsverband Ulm“ im Organisationsnamen
  „Als Ortsverband „Ulm“ eintragen“; der Platzhalter lautet „meist leer – OV
  unten eintragen“. Schritt 2 erklärt „Zeitraum bis“. Schritt 3: „Namen
  einfügen…“ mit Übernahme („5 Namen übernommen. Rückgängig“) und beide
  Warnungen („Alle 5 Personen stehen auf Geschlecht „männlich“ …“, „Keine
  telefonische Erreichbarkeit …“). Schritt 5 nennt vor dem Anhaken
  „Verpflegung, Betriebsstoff (Diesel, Benzin, Gemisch), Unterbringung,
  Ruhezeit“.
- **Übersicht und Übergabe:** „Bogen übergeben…“ führt mit „Dieser Bogen gehört
  zum Einsatz … / Für neuen Einsatz vorbereiten“, „⚠ 1 offener Punkt —
  ansehen · Übergeben ist trotzdem möglich“, „QR-Code im Vollbild zeigen“
  (Einheit, Stärke mit Legende F / UF / M / Ges, Stand) und „PDF erzeugen“.
  „In Einsatz-Sammlung ablegen…“ sagt jetzt „Das bleibt auf diesem Gerät — an
  den Meldekopf geht er über „Bogen übergeben…“.“ Bögen mit abgelaufener
  Datenschutzfrist (DRK, Bundeswehr, Stand 2025) zeigen „DATENSCHUTZFRIST
  ABGELAUFEN — Namen … wurden … entfernt. Stärke und Summen bleiben erhalten.“
- **Link-Empfang:** „Meldung von … empfangen. Stärke 0 / 2 / 6 / 8. Wohin damit?“
  mit der Sammlung als erstem Weg und „Bogen öffnen (ansehen oder bearbeiten)“
  mit dem Zusatz „der eigene angefangene Bogen bleibt über die Startseite
  zurückholbar“. Gleiches bei einer Datei aus „Aus Datei laden…“ der Startseite
  mit vorhandener Sammlung und Entwurf.
- **Meldekopf:** Quittung nach der Aufnahme („Zuletzt eingelesen: … jetzt 2
  Einheiten, Gesamt 15. In der Liste zeigen“), „Neu seit der letzten
  Kenntnisnahme“ je Einheit, „Folgemeldung: Stärke 0 → 8 (+8) · 2 Fahrzeuge dazu
  · … Rückgängig“. „Abrücken“ quittiert mit Uhrzeit und „Rückgängig“.
  „Entfernen“ nennt „samt Historie“, „Rückgängig nur, solange die App geöffnet
  bleibt“ und „noch keinen Export und keine Weitergabe“. „Verschieben…“ sagt „Es
  gibt keine andere Einsatz-Sammlung auf diesem Gerät.“ „Stärke ändern…“ sagt,
  was bleibt („Fahrzeuge, Bedarf, Namen, Zug und Auftrag bleiben; die bisherige
  Meldung wandert in die Historie“).
- **Schnellerfassung:** „Stärke fehlt“ mit „Stärke eintragen“ (springt zu „3.
  Personal“) und „Trotzdem mit Stärke 0 übernehmen“; ohne Namen „Name der
  Einheit fehlt“ mit „Zum Namensfeld“. Kopfmarken „Aufnahme für: Hochwasser
  Weser“ einzeilig bei 360 px.
- **Rückfragen bei Doppelmeldung:** „Einheit ist bereits gemeldet“ mit „Bisher:
  Stärke …· Lehmann, Karsten · THW-80125, THW-80126 · Stand …“ und „Neu: …“ in
  der gleichen Form; bei anderem Personal und anderen Kennzeichen „⚠ Keine
  gemeinsame Person, kein gemeinsames Fahrzeug — vielleicht eine andere Gruppe?“
  mit „Als eigene Einheit führen“ vorn; bei Folgemeldung (gleiche Personen)
  „Als neue Fassung anhängen“ vorn und keine Warnung. „Ist das dieselbe
  Einheit?“ bei „THW Ulm“ (manuell, Stärke 0) und „THW Ulm Bergungsgruppe“
  (Bogen): Beide Bezeichnungen, beide Stärken, beide Stände; „Ja — als neue
  Fassung“ ergibt „Folgemeldung: Stärke 0 → 8“ mit „Rückgängig“. Neu-Ulm und Ulm
  (beide Bergungsgruppe) und eine zweite Ulmer Gruppe mit anderem Typ fragen
  nicht.
- **Zurück-Geste:** In der Sammlung schließt „Zurück“ die offene Rückfrage
  „Meldung entfernen?“ und bleibt in der Ansicht. Im Assistenten (Aufnahme)
  führt „Zurück“ zur Sammlung und dann zur Startseite.
- **Lageblatt:** Zwei Seiten A4 quer, Kopfzeile „Lage: 6 Einheiten zählend ·
  Stärke F / U / M / G 2 / 14 / 61 / 77 · 13 Fahrzeuge“, „Bedarf“, Tabelle mit
  Nr. nach Eingang, „Rückfrage“ je Zeile, „Summe laut Gerät“, Nachtragszeilen
  auf Seite 2. Rückmeldung nach „Lageblatt (A4 quer)“: „Lageblatt erstellt
  06.10.2026, 11:57 · seitdem keine neue Meldung“.
- **Papier-Rückweg:** Bild von Seite 2 eines Bogens wird gelesen („2 Bilder
  gelesen — 1 Bogen aufgenommen“), unvollständige Mehrseiten-Bögen sagen, welche
  Teile fehlen und bis wann sie gemerkt bleiben. Das Formular „Lage vom Papier
  abgleichen“ trägt „Nr. laut Blatt (leer = App vergibt)“, „Eingetroffen am“,
  „Status“, „Zug“, „Auftrag / Notiz“.
- **Ansicht:** Der aufgeklappte Schalter trägt die Zweckzeilen („normal“, „große
  Tasten“, „abends“, „gedimmt“). Im Feld-Modus bleiben Kopf und Leiste im Bild
  (die Kopfzeile „nur auf diesem G…“ ist dort gekürzt, siehe R5-L2).
- **Bögen anderer Organisationen:** Kopf und Primärknöpfe tragen die Farbe der
  Organisation (DRK rot, Bundeswehr oliv); Weiß auf Rot und Oliv ist lesbar.
  Die Bögen von DRK, DLRG, Feuerwehr, ASB, Bundeswehr und BBK ließen sich
  ohne Fehler als Link aufnehmen.

## Abschluss

- **Aufgabe geschafft:** ja (eigener Bogen, Meldekopf, Doppelmeldung, Papier-Rückweg).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Marke „⚠ Anderer Einsatz?“ an der ersten
  Karte liest der Neuling als Hinweis auf einen falsch gescannten Bogen, sie
  meint aber nur, dass kein Wort des Auftrags im Namen der Sammlung vorkommt
  (R5-N1).
- **Größtes Einsatzrisiko:** Eine Warnmarke, die bei den ersten Bögen jeder
  frischen Sammlung falsch anschlägt, erzieht dazu, sie zu übersehen (R5-N1,
  zusammen mit R5-K5).
- **Top-Priorität für die nächste Iteration:** „Anderer Einsatz?“ nur zeigen,
  wenn die Sammlung selbst einen Ort/Auftrag hat oder mehrere Meldungen einen
  gemeinsamen Ort tragen (R5-N1).

## Abgleich mit Runde 4

Grundlage: [../runde-4/neuer-nutzer.md](../runde-4/neuer-nutzer.md) mit
Abschnitt „Stand der Behebung“ und [../runde-4/README.md](../runde-4/README.md).

| Runde-4-Befund | Stand laut Runde 4 | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-N1 „Bereits gemeldet“ ohne Vergleich (P2) | behoben | hält | Dialog zeigt „Bisher: …“ und „Neu: …“ mit Stärke, Ansprechperson, Kennzeichen und Stand. Mit anderem Personal und anderen Kennzeichen kommt „⚠ Keine gemeinsame Person, kein gemeinsames Fahrzeug — vielleicht eine andere Gruppe?“ und „Als eigene Einheit führen“ steht vorn; bei Folgemeldung mit gleichen Personen keine Warnung, „Als neue Fassung anhängen“ vorn. |
| R4-N2 „Aus Datei laden…“ ohne „Wohin damit?“ (P2) | behoben | hält | Mit Sammlung „Hochwasser Weser“ und Entwurf Mühldorf fragt die Datei `016-bamberg` „Bogen von „THW Bamberg Fachgruppe Wassergefahren (A)“ aus der Datei … Wohin damit?“ mit „In „Hochwasser Weser“ aufnehmen“. Den Weg „Bogen öffnen“ und die Entwurf-Rückholung habe ich nicht bis zum Ende durchgespielt. |
| R4-N3 Kurz-Liste: Geschlecht außerhalb des Bilds (P3) | behoben | hält | Nach „5 Personen übernehmen“ ist die Seite 360 px breit (`scrollWidth` 360), jede Person steht gestapelt mit Vorname, Nachname, „Mannschaft“ und „M“ untereinander; Geschlecht ist im Bild ohne Seitwärtswischen erreichbar. Die Warnung „Alle 5 Personen stehen auf Geschlecht „männlich““ bleibt stehen. Neue Nebenstelle: „⇑“ nur im Tooltip (R5-N8), „✕“ über „⇑“ (R5-G2). |
| R4-N4 Marken und gekürzte Hinweise nur per Tooltip (P3) | behoben | hält, mit offener Nachprüfung | „älter als 24 h“ steht ausgeschrieben, die Herkunft in Worten („von der Einheit empfangen, per Scan oder Link“). Aufgeklappt stehen die Hinweise als ganze Sätze. Den Tipp auf die Marke der zugeklappten Karte habe ich nicht nachvollzogen (die Marke ließ sich in meinem Lauf nicht gezielt ansprechen). Das Wort „Rückfrage“ selbst bleibt missverständlich (R5-N5). |
| R4-N5 Platzhalter lenkt den OV ins falsche Feld (P3) | behoben | hält | Platzhalter „meist leer – OV unten eintragen“. Mit „THW Ortsverband Ulm“ im Organisationsnamen erscheint „„Ulm“ ist ein Ortsverband und gehört unter „Zugehörigkeit“ …“ mit dem Knopf „Als Ortsverband „Ulm“ eintragen“. |
| R4-N6 Kleinere Stolpersteine (P3) | behoben | hält teilweise | „In Einsatz-Sammlung ablegen…“ sagt „Das bleibt auf diesem Gerät — an den Meldekopf geht er über „Bogen übergeben…““; Schritt 5 nennt die vier Bereiche vor dem Anhaken; Kopfmarken „Aufnahme für: Hochwasser Weser“ bleiben einzeilig. Der Knopf „Bogen anlegen · 8 Pers · 2 Fz“ (Musterung aus der Vorlage) ist nur im Code (`vorlagen-ui.tsx` Z. 525) nachgesehen, nicht im Lauf. Neue Stolpersteine: R5-N7. |
| R4-K5 Einheitenliste weit unten (Verweis) | teilweise | nicht neu geprüft | Die Karte der ersten Einheit liegt am Telefon nach Summen, Quittung und Bedarf mehrere Bildschirme tief (R5-K4 misst 2,6); ich habe den Wert nicht neu gemessen; siehe R5-K4 ([fuehrungssicht.md](fuehrungssicht.md)). |
| R4-G2/M3 „◐“ am Platz von „Weiter →“ (Verweis) | behoben | verkehrt, mit Nebenwirkung | Im Assistenten steht „◐“ in der Fußleiste, die Plätze von „←“ und „Weiter →“ sind fest. In der Einsatzansicht liegt „◐“ jetzt als schwebender Knopf auf dem Inhalt und fängt Taps ab (R5-L1, R5-N4). |
| R4-W3/R4-S1 Kaltstart-Link, Zurück-Geste (Verweis) | behoben | hält, mit Rest | Mit Sammlung fragt der Link „Wohin damit?“; die Zurück-Geste schließt „Meldung entfernen?“ in der Sammlung. Auf der Startseite verlässt „Zurück“ bei offener Rückfrage weiter die App (R5-S5). |
| R4-D1 Geräteuhr (Verweis) | teilweise | hält nicht ganz | Die Warnung „Geräteuhr prüfen“ steht jetzt in Klartext (zwei Daten, „löscht und anonymisiert die App nichts“). Bei einer echten Pause über 60 Tage meldet sie sich ebenfalls; der Satz „… gilt es ab dem nächsten Start (frühestens morgen)“ bleibt offen. Der Zustand nach einem Tag ist in R5-D1 beschrieben. |

Keine Behebung hat sich in meiner Rolle ins Gegenteil verkehrt. Die Wirkung
von R4-N3 und R4-G2/M3 wurde an der Stelle verschoben: Die Kurz-Liste liegt
sauber im Bild, trägt aber „⇑“ ohne Erklärung (R5-N8); die Fußleiste ist im
Assistenten in Ordnung, die Einsatzansicht trägt das schwebende „◐“ (R5-L1).

Einordnung der eigenen Befunde: R5-N1 bis R5-N9 sind neu. R5-N1 hat Nähe zu
R5-K5 (Gegenstück: fehlende Marke im Lageblatt) und zu R4-K6 (Einführung der
Marke). R5-N8 steht neben R5-G2, R5-N9 neben R5-A1 und R5-A5. Auf bestehende
Runde-5-Befunde verweise ich nur: R5-M2, R5-L1, R5-D1, R5-D4, R5-G5, R5-S2,
R5-K4, R5-A9.

Bilanz: Von den sechs Runde-4-Befunden meiner Rolle halten fünf (R4-N1 bis
R4-N5), einer hält teilweise (R4-N6). Neu sind keine P0 und keine P1, ein P2
(R5-N1) und acht P3.
