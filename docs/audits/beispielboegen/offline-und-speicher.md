# Audit Beispielbögen – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-11-08 · Zählung: **P0 0 · P1 0 · P2 2 · P3 2 · Hinweise 3**

Prüfgegenstand: nur der Bereich Beispielbögen auf der Live-Seite `https://erfassungsbogen.app/` (Stand `main` Commit `0dd56d4`,
frisch deployt): Abschnitt „Beispielbögen“ auf der Startseite unter „So funktioniert’s“ mit dem Primärknopf „Beispielbögen
ansehen“ (der Fußzeilen-Link ist entfallen), Dialog „Beispielbögen“ mit Register, Pfadleiste, Tabelle (Nachladen der Bögen des
offenen Ordners, Ladezustand „Angaben werden geladen … x von y“) und den Knöpfen Anzeigen, PDF und Link. Schwerpunkt: die
Beispielbögen als zweite Stufe des Offline-Vorrats und der Ordner „THW › Alle Einheiten aller Ortsverbände“ (3 533 Bögen), der
erst beim Öffnen des Dialogs als eigener Baustein (`beispiele-thw-ov`) dazukommt.

Reiner Prüfbericht, keine Codeänderung.

Zählregel: ein Befund je Sachverhalt, ein Typ je Befund (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast); P3 nur bei
echter Beeinträchtigung der Aufgabe, Geschmacksfragen unter „Hinweise“ ohne Priorität.

## Prüfaufbau

- Playwright (vorinstalliertes Modul) mit Chromium, `chromium.launchPersistentContext(dir)` je Lauf (Service Worker aktiv),
  Viewport 360 x 640, `deviceScaleFactor` 1, `isMobile`/`hasTouch`, Locale de-DE. Skripte und Screenshots unter
  `/tmp/claude-0/audit-offline/` (`s1.js` … `s14.js`, `01_…png` … `23_…png`).
- Erstbesuch online in einem frischen Profil, Offline-Zeile der Startseite alle 0,5 s mitgelesen, bis „✓ Jetzt offline bereit“.
  Dieses Profil diente als Ausgangsstand. Für jeden weiteren Lauf wurde es kopiert, damit sich die Läufe nicht gegenseitig
  den Vorrat füllen.
- Netz weg mit `context.setOffline(true)`, ohne und mit Neuladen. Dabei zeigte sich, dass `setOffline` die Abrufe des Service
  Workers nicht in jedem Lauf zuverlässig sperrt (in zwei Läufen kamen OV-Bögen trotz „offline“ aus dem Netz). Die
  maßgeblichen Offline-Läufe wurden deshalb zusätzlich mit `context.route('**/*', abort('internetdisconnected'))`
  wiederholt. Gemeldet ist nur, was sich mit dieser harten Sperre bestätigt hat.
- Langsames Netz über Route-Drosselung (1,5 s Verzögerung je JSON-Datei, 0,4 s je JS-Datei, frisches Profil, Dialog schon
  während des ersten Ladens geöffnet). Der Baustein `beispiele-thw-ov` wurde in einem eigenen Lauf um 4 s verzögert.
- Speicher: `navigator.storage.estimate()` und Einträge in `caches` (`workbox-precache-v2-…`, `eeb-zusatz`), per
  `page.evaluate` gelesen. Den Verdrängungsfall (BB-O2) habe ich so nachgestellt: 1 600 OV-Bögen wurden per `fetch` aus der
  Seite abgerufen, also über denselben Service-Worker-Weg, den die Tabelle beim Öffnen eines OV-Ordners nimmt. Die
  Adressliste stammt aus dem ausgelieferten Baustein. Danach wurde der HTTP-Cache des Browsers über CDP
  (`Network.clearBrowserCache`) geleert, damit kein Browser-Zwischenspeicher das Ergebnis schönt. CacheStorage blieb dabei
  unberührt.
- Das DOM wurde nicht verändert und es wurden keine Skripte eingeschleust. Bedient wurde nur über Klicks auf sichtbare Knöpfe.
- Zum Nachschlagen vorab gelesen: `src/app/fusszeile.tsx` (Dialog, `beispielBogen`, `ovBeispieleLaden`),
  `src/app/beispiele-thw-ov.ts`, `src/app/app.tsx` (`BeispielboegenStart`), `scripts/precache-aufteilung.ts`
  (`istNurAufAbruf`), `src/app/offline-bereit.ts`, Service-Worker-Konfiguration in `vite.config.ts`, als Vorlage
  `docs/audits/README.md` und `docs/audits/runde-21/offline-und-speicher.md`.

## Annahmen

- Die Beispielbögen sind Ausbildungs- und Vorführmaterial, kein Einsatzweg. Ich nehme an, dass Ausbilder und
  Fachberater sie auch dort zeigen wollen, wo kein Netz ist (Unterkunft, Übungsgelände, Bereitstellungsraum), und dass ein
  Helfer den Bogen seiner eigenen OV-Einheit als Muster öffnet. Ob das tatsächlich so genutzt wird, ist nicht belegt.
- Wie oft jemand mehr als rund 100 OV-Ordner aufruft (der Schwellenwert für BB-O2), ist unbekannt. Realistisch wäre das
  etwa beim Durchklicken eines ganzen Landesverbands zur Ausbildungsvorbereitung.

## Nicht prüfbar

Echte Funklöcher am Telefon, Speicherräumung durch iOS/Safari (die Vorräte im CacheStorage kann das Betriebssystem
verwerfen), die nativen Builds (dort gibt es laut `vite.config.ts` keinen Service Worker), echtes Teilen über das Share-Sheet
(der Link-Weg lief über die Zwischenablage) und langsame Netze jenseits der Route-Drosselung (keine Paketverluste,
kein CDP-Throttling am Service Worker).

## Urteil

Mit Netz und nach „offline bereit“ ist der Bereich solide. Der Kern war nach 15 s geladen, der Rest nach 44 s
(549 Dateien der zweiten Stufe, ungedrosselt). Danach gehen ohne Netz, auch nach Neuladen, alle Register, alle kleinen
Ordner (ASB, BBK, Bundeswehr, DLRG, DRK, Feuerwehr, Katastrophenschutz, Praktische Ausbildung) und die 101 Bögen direkt unter
„THW“. Anzeigen öffnet den Bogen, PDF lädt die Datei herunter (`wrv-bawue-fuehrungstrupp-elw1.pdf`) und Link meldet
„Kopiert“. Die Ordnerstruktur der 3 533 OV-Bögen steht offline nach 44 ms. Ein OV-Ordner, den man einmal mit Netz geöffnet
hat, ist auch nach Neuladen offline vollständig da.

Die Reibung steckt im großen OV-Ordner. Seine Bögen sind **nie** Teil des Vorrats: 3 533 von 3 634 THW-Bögen fehlen
offline, solange man den jeweiligen Ortsverband nicht vorher mit Netz geöffnet hat. Die Startseite sagt trotzdem
„Funktioniert komplett offline“, und die Meldung im Dialog verspricht ein Nachladen, das für diese Bögen nie kommt (BB-O1).
Wer viele OV-Ordner öffnet, verdrängt außerdem stillschweigend die eigentlich vorrätigen Beispielbögen und Themenfotos aus
dem Gerät (BB-O2). Ohne fremde Hilfe ist die Aufgabe offline zu schaffen, nur für die OV-Bögen nicht, und vorher sieht man
nicht, welche Bögen fehlen.

## Nachprüfung (hält, nicht gemeldet)

- **Erstbesuch bis „offline bereit“** (frisches Profil, ungedrosselt): „⏳ Wird für den Offline-Betrieb geladen: 0,0 von 8,0
  MB“ zählt hoch. Nach 15,1 s steht „✓ Bogen, PDF, QR-Code und Empfang gehen offline. Rest lädt noch (Beispielbögen,
  Themenseiten): 0 von 549“, das läuft sichtbar bis 548 von 549, nach 44,2 s folgt „✓ Jetzt offline bereit. Funktioniert komplett
  offline“. Cache danach: 111 Kerndateien, 549 in `eeb-zusatz`, Speicherschätzung 18,5 MB.
- **Startseiten-Einstieg:** Abschnitt „Beispielbögen“ mit Erklärsatz und Primärknopf „Beispielbögen ansehen“ bei y ≈ 1 523 px
  (Seitenhöhe 7 526 px). Der Knopf öffnet den Dialog, auch offline und auch während des ersten Ladens bei gedrosseltem Netz
  (nach 115 ms offen).
- **Offline ohne Neuladen** (Dialog vorher mit Netz geöffnet): Register, Pfadleiste, kleine Ordner und ein schon geöffneter
  OV-Ordner gehen. Ein nie geöffneter OV-Ordner zeigt die Zeilen mit Dateinamen, „nicht geladen“ und die Fehlerzeile (siehe
  BB-O1).
- **Offline nach Neuladen:** Register mit allen neun Organisationen und Themen, „THW 3.634 Bögen“; DLRG 7/7, ASB 4/4,
  Bundeswehr 8/8, DRK 8/8, THW 101/101 Bögen mit Angaben (Ladezeit 31 bis 225 ms). „OV Oldenburg (NI)“, vorher einmal mit Netz
  geöffnet: 9/9 Bögen nach 6 ms.
- **Anzeigen, PDF, Link offline** (kleiner Ordner): Anzeigen schließt den Dialog und öffnet den Bogen im Assistenten mit
  Übungsstörer; PDF erzeugt den Download; Link schreibt in die Zwischenablage, der Knopf zeigt „Kopiert“.
- **Fehlerzeile bei fehlendem Bogen:** Anzeigen, PDF und Link auf einen nicht vorrätigen Bogen melden je eigens „Bogen konnte
  nicht geladen werden: …“, „PDF konnte nicht erzeugt werden: …“ und „Link konnte nicht erzeugt werden: …“. Die Ansicht rollt
  zur Zeile (Meldung bei y = 447 bis 591 px im Bild). Es gibt keinen stillen Fehlschlag und keinen Absturz.
- **Ladezustand bei langsamem Netz** (1,5 s je Datei): „101 Bögen · Angaben werden geladen … 0 von 101“ zählt in kleinen
  Schritten hoch, fertig nach 12,9 s; die Tabelle füllt sich nach und nach, Knöpfe sind sofort bedienbar. Ein OV-Ordner mit 4
  Bögen braucht 2,3 s.
- **Netzrückkehr:** Wer den Ordner nach Netzrückkehr verlässt und wieder öffnet, bekommt alle Bögen (0 von 9 „nicht geladen“).
  Das automatische Nachladen ohne Verlassen fehlt, siehe BB-O3.

## Befunde

### P2

#### BB-O1 – OV-Bögen sind nie im Offline-Vorrat, die App sagt trotzdem „komplett offline“ und verspricht ein Nachladen, das nicht kommt

- **Priorität:** P2
- **Typ:** Text (falsche Zusage zum Offline-Stand)
- **Kennzeichnung:** gemessen (frisches Profil bis „offline bereit“, danach Netz weg, harte Sperre über `route.abort`; OV
  Westerstede, OV Jever, OV Bingen, RSt-Ordner in Sachsen/Thüringen)
- **Neu oder alt (Verweis):** neu (Folge von „Nur auf Abruf“ seit 2026-11-08, `istNurAufAbruf` in `scripts/precache-aufteilung.ts`)
- **Fundstelle:** Startseite, Offline-Zeile; Dialog „Beispielbögen“ → „THW“ → „Alle Einheiten aller Ortsverbände (LV › RSt ›
  OV)“ → Landesverband → RSt → OV; Fehlerzeilen in `fusszeile.tsx` (`beispielBogen`, Sammelmeldung im Lade-Effekt).
- **Beobachtung:** Nach „✓ Jetzt offline bereit. Funktioniert komplett offline“ enthält `eeb-zusatz` 549 Dateien und keinen
  einzigen der 3 533 OV-Bögen. Das Register zeigt offline unverändert „THW 3.634 Bögen“ und „Alle Einheiten aller
  Ortsverbände … 3.533 Bögen“, in jedem OV die volle Bogenzahl, ohne jeden Hinweis, dass davon nichts auf dem Gerät liegt.
  Öffnet man einen OV (z. B. „OV Westerstede 6 Bögen“), stehen 6 Zeilen mit technischen Dateinamen („ov-westerstede-01-
  fz-log-ztr-fz-log“), „nicht geladen“, Stärke „—“ und je drei aktiven Knöpfen. Darunter steht: „Einige Beispielbögen liegen
  noch nicht auf dem Gerät — sie werden mit Netz nachgeladen (siehe Offline-Zeile der Startseite).“ Jeder Knopf meldet
  „… Dieser Beispielbogen liegt noch nicht auf dem Gerät — Beispielbögen werden nach dem ersten Laden mit Netz nachgeladen
  (siehe Offline-Zeile der Startseite).“ Die Offline-Zeile, auf die verwiesen wird, sagt „komplett offline“. Mit Netz werden
  diese Bögen aber nie von selbst nachgeladen, nur der gerade geöffnete OV kommt beim Öffnen in den Vorrat. Die Erklärung
  „Was sind Beispielbögen?“ im Dialog sagt dazu nichts.
- **Erwartung der Rolle:** Nach „komplett offline“ geht alles, was die App anbietet, ohne Netz. Wenn nicht, will ich das
  **vorher** sehen, solange ich noch Netz habe: welche Ordner auf dem Gerät liegen und wie ich den Rest gezielt mitnehme.
- **Folge:** Ein Ausbilder bereitet zu Hause mit Netz vor, sieht „komplett offline“ und steht im Übungsgelände ohne Netz vor
  „nicht geladen“ beim Bogen seines eigenen Ortsverbands. Die Meldung sagt ihm, das komme „mit Netz“ von selbst. Er wartet
  also auf die nächste Verbindung, statt den Ordner gezielt zu öffnen. Das betrifft 97 % der THW-Beispielbögen. Daten gehen
  nicht verloren und die Einsatzwege sind nicht betroffen. Es kostet aber die vorbereitete Ausbildungseinheit.
- **Empfehlung:** In der Offline-Zeile und im Register ehrlich trennen: „Beispielbögen: 484 auf dem Gerät, Ortsverbände nur
  auf Abruf“. Am OV-Ordner (und am LV/RSt-Ordner) sichtbar kennzeichnen, ob er auf dem Gerät liegt („auf dem Gerät“ /
  „nur mit Netz“). Einen Weg anbieten, einen Ordner bewusst mitzunehmen („Für offline speichern“, mit Größe). Die Meldung für
  OV-Bögen ändern: „Dieser Ortsverband liegt nicht auf dem Gerät. Mit Netz einmal öffnen, dann geht er auch offline.“ Zeilen
  ohne Angaben mit dem Ortsnamen statt des Dateinamens beschriften.
- **Nachprüfung:** Frisches Profil bis „offline bereit“, Netz hart weg: Offline-Zeile und Register sagen vorher, dass die
  OV-Bögen fehlen; die Meldung im OV-Ordner nennt den richtigen Weg; nach „Für offline speichern“ (falls umgesetzt) und
  Neuladen offline sind alle Bögen des Ordners da.

#### BB-O2 – Viele geöffnete OV-Ordner verdrängen still die vorrätigen Beispielbögen und Themenfotos

- **Priorität:** P2
- **Typ:** Daten/Verlust (Offline-Vorrat geht ohne Zutun verloren)
- **Kennzeichnung:** gemessen (Profil „offline bereit“, 1 600 OV-Bögen über den Service-Worker-Weg abgerufen, HTTP-Cache
  geleert, Netz weg, Neuladen; zweimal, Ergebnis gleich)
- **Neu oder alt (Verweis):** neu (OV-Bögen landen seit 2026-11-08 im selben Laufzeit-Cache `eeb-zusatz`)
- **Fundstelle:** Service-Worker-Konfiguration `vite.config.ts`, `runtimeCaching`: Bögen-Route `CacheFirst`, `cacheName:
  "eeb-zusatz"`, `expiration: { maxEntries: 1500 }`, Foto-Route im selben Cache ebenfalls mit 1 500. Sichtbar auf der
  Startseite (Offline-Zeile) und im Dialog „Beispielbögen“.
- **Beobachtung:** Vorher: 550 Einträge, zweite Stufe 549/549, davon 484/484 Beispielbögen. Nach dem Abruf von 1 600
  OV-Bögen (4,2 MB, entspricht etwa dem Durchklicken der Landesverbände Nordrhein-Westfalen, Bayern und Baden-Württemberg):
  1 532 Einträge, davon 1 500 OV-Bögen, zweite Stufe nur noch **31/549**, Beispielbögen **0/484**. Es blieben nur die 31
  Themenseiten, alle Fotos sind weg. Der Stand blieb über 30 s gleich. Es gab keine Meldung, die Startseite zeigte bis zum
  Neuladen weiter „offline bereit“. Nach Neuladen ohne Netz steht: „✓ Bogen, PDF, QR-Code und Empfang gehen offline. Rest
  (Beispielbögen, Themenseiten): 31 von 549 da, das Netz hakt — der nächste Versuch läuft von selbst“. Im Dialog dann:
  ASB 4/4, BBK 5/5, Bundeswehr 8/8, DLRG 7/7, DRK 8/8, THW 101/101 Bögen „nicht geladen“, also **133 von 133** geprüften
  Bögen. Die Verdrängung beginnt rechnerisch schon ab rund 950 OV-Bögen (1 500 minus 549), das sind etwa 180 OV-Ordner.
  Mit Netz lädt die Startseite die zweite Stufe wieder nach, die dann ihrerseits OV-Bögen verdrängt.
- **Erwartung der Rolle:** Was als „offline bereit“ gemeldet wurde, bleibt auf dem Gerät, bis ich es lösche. Weiteres
  Stöbern mit Netz darf den Vorrat nicht unbemerkt leeren.
- **Folge:** Wer zur Ausbildungsvorbereitung viele Ortsverbände durchsieht, hat danach ohne Netz **weniger** Beispielbögen
  als vorher, auch die kleinen Ordner und die Fotos der Themenseiten fehlen. Die Startseite merkt es erst beim nächsten Laden
  und schiebt es auf „das Netz hakt“. Einsatzdaten sind nicht betroffen (die liegen in `localStorage`).
- **Empfehlung:** Den Vorrat der zweiten Stufe von den auf Abruf geholten OV-Bögen trennen, sodass eine Grenze für die
  OV-Bögen nie die zweite Stufe trifft. Wird doch etwas verdrängt, das in der Offline-Zeile als „da“ gezählt war, dann sofort
  sagen, was fehlt, und nicht erst beim nächsten Laden.
- **Nachprüfung:** Profil „offline bereit“, 3 533 OV-Bögen über die Tabelle oder per Abruf laden, HTTP-Cache leeren, Netz hart
  weg, Neuladen: Offline-Zeile weiter „komplett offline“ (bzw. ehrlich nach BB-O1), alle kleinen Ordner und THW 101/101 mit
  Angaben, Fotos der Themenseiten da.

### P3

#### BB-O3 – Fehlerzeile bleibt nach Ordnerwechsel stehen, offener Ordner lädt bei Netzrückkehr nicht nach

- **Priorität:** P3
- **Typ:** Bedienung
- **Kennzeichnung:** gemessen (harte Sperre; OV Jever → OV Oldenburg; OV Berlin Charlottenburg-Wilmersdorf mit Netzrückkehr)
- **Neu oder alt (Verweis):** neu
- **Fundstelle:** Dialog „Beispielbögen“, Fehlerzeile unter der Tabelle (`beispielFehler`); Lade-Effekt hängt nur am Pfad.
- **Beobachtung:** (a) In OV Jever (nicht vorrätig) „Anzeigen“ antippen, dann „‹ Zurück“ und „OV Oldenburg (NI)“ öffnen
  (vorrätig, 9/9 Bögen mit Angaben): Unter der vollständigen Tabelle steht weiter rot „Bogen konnte nicht geladen werden:
  Dieser Beispielbogen liegt noch nicht auf dem Gerät …“ (Screenshot `14_veraltete_meldung.png`). Gelöscht wird die Zeile erst
  beim nächsten Knopf oder beim Schließen des Dialogs. (b) Offline einen OV öffnen (9 × „nicht geladen“), Netz zurück, 8 s
  warten, Dialog offen lassen: weiter 9 × „nicht geladen“, kein neuer Versuch. Erst „‹ Zurück“ und erneutes Öffnen holt die
  Bögen (0 × „nicht geladen“).
- **Erwartung der Rolle:** Eine Fehlermeldung gehört zu dem, was ich gerade sehe. Kommt das Netz zurück, holt die Liste von
  selbst nach, was die Meldung „mit Netz“ versprochen hat.
- **Folge:** Der Helfer hält den richtig geladenen Ordner für fehlerhaft oder versucht im Funkloch-Wechsel wiederholt die
  falschen Bögen. Wenn das Netz zurück ist, sieht er weiter „nicht geladen“, bis er auf die Idee kommt, den Ordner zu
  verlassen. Kein Datenverlust.
- **Empfehlung:** Die Fehlerzeile beim Ordnerwechsel zurücksetzen. Bei Netzrückkehr die fehlenden Bögen des offenen Ordners
  neu anfordern oder einen Knopf „Erneut versuchen“ neben die Meldung stellen.
- **Nachprüfung:** Ablauf (a): Nach dem Wechsel in den vollständigen Ordner steht keine Fehlerzeile. Ablauf (b): Spätestens
  wenige Sekunden nach Netzrückkehr sind alle Zeilen gefüllt, ohne den Ordner zu verlassen.

#### BB-O4 – Beim Öffnen eines nicht vorrätigen Ordners springt die Ansicht ans Ende der Liste

- **Priorität:** P3
- **Typ:** Layout/Abstand
- **Kennzeichnung:** gemessen (360 x 640, OV Jever und OV Westerstede offline)
- **Neu oder alt (Verweis):** neu im Bereich (die Fehlerzeile holt sich seit R2-L2 selbst ins Bild; hier ohne Anlass durch
  den Nutzer)
- **Fundstelle:** Dialog „Beispielbögen“ → OV-Ordner ohne Netz; Sammelmeldung „Einige Beispielbögen liegen noch nicht auf
  dem Gerät …“ (`FehlerImBild` mit `scrollIntoView`).
- **Beobachtung:** Direkt nach dem Antippen des Ordners steht kurz die Pfadleiste mit „‹ Zurück“ und der Ordnername oben.
  Sobald die Abrufe scheitern, rollt der Dialog von selbst ans Ende. Im Bild sind dann nur noch die letzte Karte
  („ov-jever-04-1-tz-fgr-e … nicht geladen“) und die rote Meldung zu sehen (Screenshot `12_offline_reload_jever_oben.png`),
  Pfadleiste und Ordnername sind weg. Bei einem Fehlschlag nach eigenem Knopfdruck ist das Mitrollen sinnvoll, hier löst es
  der bloße Ordnerwechsel aus.
- **Erwartung der Rolle:** Nach dem Öffnen eines Ordners sehe ich oben, wo ich bin, und darunter, was fehlt, ohne dass die
  Ansicht unter dem Finger wegläuft.
- **Folge:** Der Helfer muss zurückrollen, um zu sehen, in welchem Ortsverband er ist, und um zum „‹ Zurück“-Knopf zu
  kommen. Mit Handschuhen auf 360 px ist das ein zusätzlicher Wisch je Ordner, in einem Funkloch je Fehlversuch.
- **Empfehlung:** Die Sammelmeldung für den Ordner oben über der Tabelle (beim Bogenzähler) zeigen und ohne Mitrollen. Das
  Mitrollen nur für Fehler nach einem Knopfdruck behalten.
- **Nachprüfung:** Offline einen nicht vorrätigen OV öffnen: Pfadleiste und Meldung stehen gemeinsam im ersten Bildschirm,
  die Ansicht rollt nicht von selbst.

## Hinweise (ohne Priorität)

- **H1 – Offline-Zeile „das Netz hakt“ bei abgeschaltetem Netz:** Nach Verdrängung (BB-O2) und Neuladen ohne Netz steht
  „31 von 549 da, das Netz hakt — der nächste Versuch läuft von selbst“. Das Gerät ist offline; „hakt“ klingt nach einer
  Störung, die sich gleich gibt. Beim Erstbesuch erschien dieselbe Formulierung kurz (2,5 s) bei 548 von 549, bevor
  „offline bereit“ kam. Vorschlag: bei fehlendem Netz „ohne Netz — folgt beim nächsten Netz“ wie in Runde 21 beobachtet.
- **H2 – THW-Ordner vor dem OV-Baustein unvollständig:** Bei verzögertem Baustein (4 s) zeigt das Register zunächst
  „THW 101 Bögen“ und im Ordner „THW“ keinen Unterordner. Nach dem Laden springt es auf „THW 3.634 Bögen“ und „Alle
  Einheiten aller Ortsverbände … 3.533 Bögen“, ohne Ladehinweis. Ungedrosselt sind es 0,7 s. Offline nach „offline bereit“
  liegt der Baustein im Kern und kommt sofort. Wer bei schwachem Netz früh tippt, sucht den OV-Ordner vergeblich.
- **H3 – Speicherbedarf:** Kern 8,3 MB (111 Dateien), zweite Stufe 7,7 MB (549 Dateien), Speicherschätzung nach „offline
  bereit“ 18,5 MB bei einer Quote von rund 10 GB im Testbrowser. Ein OV-Ordner mit 4 bis 10 Bögen kostet rund 10 bis 30 KB, alle
  3 533 OV-Bögen zusammen etwa 9,3 MB (gemessen 4,2 MB für 1 600 Bögen). Der Bedarf ist unkritisch. Die App nennt aber
  nirgends, wie viel die Beispielbögen belegen und wie man sie wieder loswird. Auf Geräten mit knappem Speicher (iOS)
  wäre das die erste Frage.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (alle kleinen Ordner und THW-Direktbögen offline ja; OV-Bögen nur, wenn der Ortsverband
  vorher mit Netz geöffnet wurde)
- **Fremde Hilfe nötig:** nein (die Meldungen sind verständlich, nur ihr Versprechen stimmt für die OV-Bögen nicht)
- **Größtes Missverständnis:** „Funktioniert komplett offline“ gilt nicht für 3 533 der 3 634 THW-Beispielbögen, und die
  Meldung sagt, sie kämen mit Netz von selbst.
- **Größtes Einsatzrisiko:** Wer viele Ortsverbände durchsieht, leert damit unbemerkt den vorrätigen Bestand der übrigen
  Beispielbögen und Themenfotos (BB-O2).
- **Top-Priorität für die nächste Iteration:** BB-O1: vor dem Funkloch sichtbar machen, welche Beispielordner auf dem Gerät
  liegen, und die OV-Ordner gezielt mitnehmbar machen; zusammen mit der getrennten Ablage aus BB-O2.
