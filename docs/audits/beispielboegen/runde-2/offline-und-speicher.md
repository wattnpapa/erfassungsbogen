# Audit Beispielbögen, Runde 2 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-11-09 · Zählung: **P0 0 · P1 1 · P2 0 · P3 2 · Hinweise 4**

Prüfgegenstand: nur der Bereich Beispielbögen auf der Live-Seite `https://erfassungsbogen.app/` (Stand `main` Commit `085a93b`).
Geprüft wurde der Stand nach der Behebung vom 08./09.11.2026 (siehe „Stand der Behebung“ in
[../README.md](../README.md)). Neu seit Runde 1 sind vor allem: der Dialog als eigener Baustein `beispiele-dialog-*.js`, der
erst beim ersten Öffnen lädt; der eigene Laufzeit-Cache `eeb-ov-beispiele` (4 000 Einträge) für die Bögen der Ortsverbände; die
eingeschränkte Zusage auf der Startseite („Funktioniert komplett offline (außer den Beispielbögen der THW-Ortsverbände)“); Hinweise
im Dialog, „Erneut laden“, Nachladen bei Netzrückkehr, Platzhalter für den OV-Ordner, die Suche, der gemerkte Ordner
(`sessionStorage` `eeb.beispiel-pfad.v1`) und „Alle … in eine Übungs-Sammlung“.

Reiner Prüfbericht, keine Codeänderung.

Zählregel wie in Runde 1: ein Befund je Sachverhalt, ein Typ je Befund (Daten/Verlust, Bedienung, Layout/Abstand, Text,
Kontrast); P3 nur bei echter Beeinträchtigung der Aufgabe, Geschmacksfragen unter „Hinweise“ ohne Priorität.

## Prüfaufbau

- Playwright (vorinstalliertes Modul) mit Chromium, `chromium.launchPersistentContext(dir)` je Lauf (Service Worker aktiv),
  Viewport 360 x 640, `deviceScaleFactor` 1, `isMobile`/`hasTouch`, Locale de-DE. Skripte und Screenshots unter
  `/tmp/claude-0/r2-offline/` (`lib.js`, `s1.js` … `s11.js`, `01_…png` … `18_…png`).
- Ausgangsstand: frisches Profil online bis „✓ Jetzt offline bereit“ (`s1.js`). Für jeden weiteren Lauf wurde das Profil
  kopiert.
- Netz weg immer doppelt: `context.setOffline(true)` **und** `context.route('**/*', abort('internetdisconnected'))` als harte
  Sperre. Danach wurde der HTTP-Cache des Browsers über CDP (`Network.clearBrowserCache`) geleert, CacheStorage blieb
  unberührt. Nach einem Neuladen meldete `navigator.onLine` trotz `setOffline` wieder `true`. Wo das `online`-Ereignis gebraucht
  wurde, habe ich `setOffline` deshalb nach dem Neuladen einmal aus- und wieder eingeschaltet (danach `onLine` = `false`).
- Netzrückkehr auf zwei Wegen: (A) mit `online`-Ereignis (Sperre aufheben und `setOffline(false)`); (B) ohne Ereignis (nur die
  Route-Sperre aufheben, `onLine` bleibt `true`, wie bei einem WLAN ohne Internet).
- Langsames Netz über Route-Verzögerung einzelner Bausteine: `beispiele-dialog-*.js` 4 s (`s8.js`), `beispiele-thw-ov-*.js` 5 s
  (`s10.js`). Ein Fehlschlag nur des OV-Bausteins wurde mit `route.abort` auf genau diese Datei nachgestellt (`s9.js`).
- Verdrängung (BB-O2): Alle 3 533 OV-Bogen-Adressen stammen aus dem ausgelieferten Baustein `beispiele-thw-ov-8TZU-GfL.js`. Sie
  wurden per `fetch` aus der Seite über den Service-Worker-Weg abgerufen (24 parallel, 277 s). Danach habe ich den HTTP-Cache
  geleert, das Netz hart gesperrt und neu geladen (`s6.js`).
- Das DOM wurde nicht verändert und es wurden keine Skripte eingeschleust. Bedient wurde nur über sichtbare Knöpfe und das
  Suchfeld. Gelesen wurde per `page.evaluate` (Text, `caches`, `navigator.storage.estimate()`, `sessionStorage`).
- Code zum Nachschlagen: `src/app/beispiele-dialog.tsx`, `src/app/fusszeile.tsx` (`lazy(() => import("./beispiele-dialog"))`),
  `src/app/fehlerfaenger.tsx`, `vite.config.ts` (`runtimeCaching`), `scripts/precache-aufteilung.ts`, `src/app/offline-bereit.ts`.

## Annahmen

- Wie in Runde 1: Die Beispielbögen sind Ausbildungs- und Vorführmaterial, kein Einsatzweg. Ich nehme an, dass sie auch dort
  gezeigt werden, wo kein Netz ist, und dass ein Helfer den Bogen seines eigenen OV als Muster öffnet.
- Für BB2-O1 nehme ich an, dass Erstbesuche in schwachem Netz vorkommen, etwa bei einem neuen Helfer, der per Link oder QR-Code
  am Übungsgelände kommt. Der Kern-Vorrat (8,0 MB) braucht auch ungedrosselt 26,7 s, bei schwachem Mobilfunk Minuten. Ob in
  dieser Zeit jemand die Beispielbögen öffnet, ist nicht belegt. Sie stehen aber als Primärknopf auf der Startseite.

## Nicht prüfbar

Echte Funklöcher am Telefon, Speicherräumung durch iOS/Safari, die nativen Builds (kein Service Worker), echtes Teilen über das
Share-Sheet (Link lief über die Zwischenablage), Safari/Firefox-Verhalten bei fehlgeschlagenem dynamischem Import (BB2-O2 ist
nur in Chromium gemessen), langsame Netze jenseits der Route-Verzögerung.

## Urteil

Nach „offline bereit“ ist der Bereich jetzt robust. Der Dialog-Baustein liegt im Kern-Precache (`beispiele-dialog-bw_VuAYn.js`
neben `beispiele-thw-ov-8TZU-GfL.js`). Darum öffnet der Dialog offline nach Neuladen schon beim allerersten Mal (495 ms, alle
neun Register). Der eigene Cache für die OV-Bögen wirkt: Auch mit allen 3 529 abgerufenen OV-Bögen bleiben die 549 Dateien der
zweiten Stufe und alle kleinen Ordner offline vollständig. Die Zusage auf der Startseite und die Meldungen im OV-Ordner sind
ehrlich. Fehlerzeile, Mitrollen und Netzrückkehr verhalten sich wie gewünscht. Der gemerkte Ordner, die Suche, PDF, Link und
„Alle … in eine Übungs-Sammlung“ gehen offline.

Die neue Reibung kommt aus dem Nachladen des Dialogs. **Vor** „offline bereit“ ist der Baustein noch nicht auf dem Gerät. Wer
dann ohne Netz „Beispielbögen ansehen“ antippt, verliert die ganze App an einen Fehlerschirm. Dessen Knöpfe „Seite neu laden“
und „Zur Startseite“ führen ohne Netz zur Fehlerseite des Browsers (BB2-O1). In Runde 1 öffnete der Dialog in dieser Lage
nach 115 ms. Kleiner: Scheitert nur der OV-Baustein einmal, kommt der Ordner trotz Zusage auch mit Netz nicht wieder (BB2-O2).
Bei langsamem Erstbesuch fehlt jede Rückmeldung zum Laden, und der Platzhalter für den OV-Ordner erscheint nicht (BB2-O3). Nach
„offline bereit“ ist die Aufgabe ohne fremde Hilfe zu schaffen.

## Nachprüfung Runde 1

| ID | Stand | Kurz |
| --- | --- | --- |
| BB-O1 | teilweise | Zusage und Meldungen ehrlich; kein Vermerk je Ordner, kein gezieltes Mitnehmen, Dateinamen statt Ortsnamen |
| BB-O2 | behoben | eigener Cache `eeb-ov-beispiele`; 3 529 OV-Bögen verdrängen nichts |
| BB-O3 | behoben | Fehlerzeile verschwindet beim Wechsel; Nachladen 0,5 s nach Netzrückkehr; „Erneut laden“ |
| BB-O4 | behoben | kein Mitrollen, Meldung über der Liste |
| H1 | entfällt | Anlass (Verdrängung) tritt nicht mehr auf; „das Netz hakt“ nicht mehr gesehen |
| H2 | teilweise | Register zeigt „THW … Bögen“; im Ordner „THW“ fehlt der Platzhalter, siehe BB2-O3 |
| H3 | offen | weiter keine Angabe zu Platz und Löschweg, siehe Hinweis H4 |

### BB-O1 – teilweise behoben

- **Gemessen:** Startseite nach Erstbesuch: „✓ Jetzt offline bereit. Funktioniert komplett offline (außer den Beispielbögen der
  THW-Ortsverbände)“. Offline nach Neuladen steht „✓ Funktioniert komplett offline (außer …)“. In jedem Ordner unter „Alle
  Einheiten aller Ortsverbände“ steht oben: „Die Bögen der THW-Ortsverbände lädt die App nicht vorab: Ein Bogen braucht beim
  ersten Öffnen Netz und bleibt danach auf dem Gerät.“ Die Sammelmeldung und die Meldungen der Knöpfe tragen denselben Satz.
  Das falsche Versprechen „werden mit Netz nachgeladen“ ist für OV-Bögen weg. Kleine Ordner behalten ihren Text, dort stimmt er.
- **Offen:** Register und Ordner zeigen offline weiter die volle Bogenzahl („OV Westerstede 6 Bögen“) und sagen nicht, ob ein OV
  schon auf dem Gerät liegt. Erst nach dem Antippen sieht man 6 × „nicht geladen“ (`05_offline_ov_westerstede.png`). Einen Weg
  „für offline mitnehmen“ gibt es nicht. Faktisch reicht es, den OV-Ordner einmal mit Netz zu öffnen, denn die Tabelle lädt dabei
  alle Bögen (gemessen: OV Leer und OV Norden danach offline 6/6 und 5/5). Der Hinweis sagt aber „Ein Bogen braucht beim ersten
  Öffnen Netz“. Das liest sich so, als müsse man jeden Bogen einzeln anzeigen. Nicht geladene Zeilen tragen weiter den
  Dateinamen („ov-westerstede-01-fz-log-ztr-fz-log“) statt des Ortsnamens. Der Rest aus der Empfehlung von Runde 1 bleibt daher
  offen. Für eine eigene Priorität reicht er nicht mehr: Die Zusage stimmt, nur die Planbarkeit fehlt.

### BB-O2 – behoben

Alle 3 533 OV-Bögen über den Service-Worker-Weg abgerufen (3 529 erfolgreich, 4 Abrufe scheiterten im Testnetz, 6,1 MB). Danach:
`eeb-ov-beispiele` 3 529 Einträge, `eeb-zusatz` 550, Precache 114. Nach geleertem HTTP-Cache, harter Sperre und Neuladen sind
ASB 4/4, BBK 5/5, Bundeswehr 8/8, DLRG 7/7, Feuerwehr, THW 101/101 und ein zufälliger OV (OV Dillingen 7/7) vollständig. Die
Offline-Zeile bleibt bei „komplett offline (außer …)“. Da 4 000 Einträge über den 3 533 möglichen OV-Bögen liegen, kann die
Grenze im heutigen Bestand nicht greifen.

### BB-O3 – behoben

(a) In OV Jever (nicht vorrätig) „Anzeigen“ tippen, dann „‹ Zurück“ und „OV Leer“ (vorrätig) öffnen: keine Fehlerzeile mehr,
6/6 Bögen. (b) OV Leer offline geöffnet (6 × „nicht geladen“), Netz mit `online`-Ereignis zurück: nach 511 ms alle Zeilen
gefüllt, die Sammelmeldung verschwindet (`08_netz_zurueck_leer.png`). Ohne `online`-Ereignis (Weg B, OV Norden) lädt nach 6 s
nichts von selbst nach. „Erneut laden“ holt dann alle 5 Bögen.

### BB-O4 – behoben

OV Westerstede offline geöffnet: `scrollTop` 0. Pfadleiste, OV-Hinweis, Sammelmeldung mit „Erneut laden“ und „6 Bögen“ stehen
im ersten Bildschirm (`05_offline_ov_westerstede.png`). Meldungen nach einem Knopfdruck holen sich weiter selbst ins Bild
(`07_offline_ov_sammel.png`), das ist gewollt.

## Nachprüfung (hält, nicht gemeldet)

- **Erstbesuch bis „offline bereit“:** Kern nach 26,7 s („✓ Bogen, PDF, QR-Code und Empfang gehen offline. Rest lädt noch …
  0 von 549“), fertig nach 61,8 s. Precache 114 Dateien, darin `beispiele-dialog-bw_VuAYn.js`, `beispiele-thw-ov-8TZU-GfL.js`,
  `thw-ov-lRhANnMy.js` und `thw-ov-regionalstruktur-BXHHPKec.js`; `eeb-zusatz` 549; Speicherschätzung 18,6 MB.
- **Dialog offline nach Neuladen, erstmals in dieser Sitzung:** offen nach 495 ms. Register ASB 4, BBK 5, Bundeswehr 8, DLRG 7,
  DRK 16, Feuerwehr 12, Katastrophenschutz 290, Praktische Ausbildung 41, THW 3.634 (`02_offline_dialog_erstmals.png`).
  Ordnerbaum der OV vollständig (LV, RSt, OV), THW 101 Bögen mit Angaben.
- **Gemerkter Ordner:** Online OV Norden geöffnet, `sessionStorage` hält
  `["thw","ortsverbaende","lv-bremen-niedersachsen","rst-oldenburg","ov-norden"]`. Netz hart weg, neu geladen: Der Dialog öffnet
  direkt in „OV Norden“, 5/5 Bögen mit Angaben (`09_offline_reload_gemerkt.png`).
- **Suche offline:** „Westerstede“ 1 Ordner, 7 Bögen; „Jever“ 1 Ordner, 5 Bögen; „DLRG“ 1 Ordner, 7 Bögen. Nicht vorrätige
  OV-Treffer stehen mit „nicht geladen“ und der OV-Sammelmeldung da (`10_offline_suche_jever.png`). Suche leeren führt zurück in
  den offenen Ordner.
- **PDF und Link offline (DLRG):** Download `uebung-beispiel-dlrg-wrv-bawue-fuehrungstrupp-elw1.pdf`, Quittung „… liegt im
  Download-Ordner“; Link zeigt „Kopiert“.
- **„Alle … in eine Übungs-Sammlung“ offline:** THW 101 Bögen nach 3,8 s als Sammlung „Übung: THW“ angelegt (101 Einheiten, 961
  Personen, `18_offline_sammel_thw.png`); OV Leer (vorher mit Netz geöffnet) als „Übung: THW › … › OV Leer“ mit 6 Einheiten. In
  einem nicht vorrätigen OV (Westerstede) scheitert der Sammelweg vollständig mit „Sammlung konnte nicht angelegt werden: Dieser
  Bogen liegt noch nicht auf dem Gerät …“. Der Dialog bleibt offen, es entsteht keine halbe Sammlung.
- **OV-Baustein fehlt (nachgestellt):** Register „THW 101 Bögen“, Hinweis „Ohne Netz fehlt unter „THW“ der Ordner „Alle Einheiten
  aller Ortsverbände“. Er erscheint, sobald das Netz zurück ist.“ Die Wiederkehr klappt nicht, siehe BB2-O2.

## Befunde

### P1

#### BB2-O1 – Vor „offline bereit“ ersetzt „Beispielbögen ansehen“ ohne Netz die ganze App durch einen Fehlerschirm ohne Ausweg

- **Priorität:** P1
- **Typ:** Bedienung (Ablauf ohne Netz nicht fortsetzbar)
- **Kennzeichnung:** gemessen (`s7.js`, `s7b.js`: frisches Profil, Seite geladen, nach 2,5 s Netz hart weg, Knopf angetippt;
  zweimal, Ergebnis gleich)
- **Neu oder alt (Verweis):** neu, Folge der Auslagerung des Dialogs in `beispiele-dialog.tsx` („Stand der Behebung“, letzter
  Absatz). In Runde 1 öffnete der Dialog in derselben Lage (erstes Laden, gedrosselt) nach 115 ms.
- **Fundstelle:** Startseite, Abschnitt „Beispielbögen“, Knopf „Beispielbögen ansehen“; `src/app/fusszeile.tsx`
  (`lazy(() => import("./beispiele-dialog"))` in `<Suspense fallback={null}>` ohne eigenen Fehlerfänger);
  `src/app/fehlerfaenger.tsx` (Fehlerschirm um die ganze App).
- **Beobachtung:** Die Offline-Zeile sagt korrekt „⚠ Noch nicht offline bereit (0,0 von 8,0 MB geladen) — ohne Netz diese Seite
  nicht neu laden …“. Nach dem Antippen von „Beispielbögen ansehen“ scheitert der Abruf von
  `assets/beispiele-dialog-bw_VuAYn.js` („Failed to fetch dynamically imported module“). Die **ganze Startseite** verschwindet.
  An ihrer Stelle steht „Hier ist etwas schiefgelaufen · Ein Teil der App konnte ohne Netz nicht geladen werden. Das Gerät meldet
  gerade keine Verbindung. Deine Daten und dein Einsatz sind unversehrt …“ mit dem Primärknopf „Seite neu laden“, darunter „Zur
  Startseite“ und „Daten sichern“ (`13_absturzschirm.png`). „Zur Startseite“ führt ohne Netz zur Fehlerseite des Browsers
  (`chrome-error://chromewebdata/`, `14_nach_zur_startseite.png`), „Seite neu laden“ tut dasselbe. Das ist genau der Schritt,
  vor dem die Offline-Zeile eben noch gewarnt hat. Kommt das Netz zurück, bleibt der Fehlerschirm stehen, bis man neu lädt.
  Nach „offline bereit“ tritt das nicht auf, denn dann liegt der Baustein im Precache.
- **Erwartung der Rolle:** Ein Knopf, der gerade nicht geht, sagt „geht erst mit Netz“. Der Rest der App bleibt, wie er war,
  vor allem der Bogen, an dem ich arbeite.
- **Folge:** Ein neuer Helfer öffnet die Seite am Übungsgelände bei schwachem Netz und tippt auf den auffälligen Knopf
  „Beispielbögen ansehen“. Ab da hat er keine App mehr, auch nicht für den eigenen Bogen, bis wieder Netz da ist. Die Knöpfe
  des Fehlerschirms führen ihn ins Leere. Die Daten liegen weiter in `localStorage` und gehen nicht verloren, sind aber bis
  zur nächsten Verbindung nicht erreichbar. Das Zeitfenster reicht ungedrosselt 27 s, bei schwachem Mobilfunk mehrere Minuten.
- **Empfehlung:** Ein gescheitertes Nachladen des Dialogs darf nur den Dialog betreffen. Am Knopf oder in einer kurzen Meldung
  „Beispielbögen gehen erst, wenn die App offline bereit ist (siehe Offline-Zeile)“ sagen und den nächsten Versuch zulassen.
  Ein Fehlerschirm, der ohne Netz und ohne fertigen Vorrat erscheint, sollte nicht „Seite neu laden“ als Hauptweg anbieten.
- **Nachprüfung:** Frisches Profil, Seite laden, vor „Bogen, PDF, QR-Code und Empfang gehen offline“ Netz hart weg, „Beispielbögen
  ansehen“ tippen: Startseite bleibt bedienbar, eine Meldung erklärt den Grund. Nach Netzrückkehr öffnet derselbe Knopf den
  Dialog ohne Neuladen.

### P3

#### BB2-O2 – Scheitert der Baustein der Ortsverbände einmal, kommt der Ordner trotz Zusage auch mit Netz nicht wieder

- **Priorität:** P3
- **Typ:** Text (Zusage, die nicht eintritt)
- **Kennzeichnung:** gemessen, nachgestellt (`s9.js`: nur `beispiele-thw-ov-*.js` per `route.abort` gesperrt, danach Sperre
  aufgehoben und `online`-Ereignis ausgelöst, dreimal; nur Chromium)
- **Neu oder alt (Verweis):** neu (Nachladen bei Netzrückkehr seit Nr. 2 der Behebung, BB-E3)
- **Fundstelle:** Dialog „Beispielbögen“, Register und Ordner „THW“; `ovBeispieleLaden` mit `window.addEventListener("online",
  laden)` in `beispiele-dialog.tsx`.
- **Beobachtung:** Der Hinweis „Ohne Netz fehlt unter „THW“ der Ordner „Alle Einheiten aller Ortsverbände“. Er erscheint, sobald
  das Netz zurück ist.“ steht wie vorgesehen (`16_ov_baustein_fehlt.png`). Nach Netzrückkehr wurde das `online`-Ereignis einmal
  ausgelöst (gezählt). Der Browser stellte aber **keine** neue Anfrage für den Baustein, im Mitschnitt steht nur die erste
  gescheiterte. Nach 8 s zeigt das Register weiter „THW 101 Bögen“, der Ordner fehlt, der Hinweis steht unverändert. Erst ein
  Neuladen hilft. Vermutlich merkt sich Chromium den gescheiterten Import derselben Adresse.
- **Erwartung der Rolle:** „Er erscheint, sobald das Netz zurück ist“ heißt, ich muss nichts tun.
- **Folge:** Wer seinen OV sucht, wartet mit Netz vergeblich. Die Lage ist selten: Der Dialog-Baustein muss geladen worden sein
  und der OV-Baustein unmittelbar danach scheitern, und das nur vor „offline bereit“, etwa beim Erstbesuch in einem Netz, das
  gerade wegbricht. Kein Datenverlust.
- **Empfehlung:** Entweder das Nachladen so gestalten, dass es nach Netzrückkehr wirklich neu anfragt, oder den Hinweis ehrlich
  fassen: „Mit Netz die Seite einmal neu laden, dann erscheint der Ordner.“
- **Nachprüfung:** Ablauf aus `s9.js`: Spätestens wenige Sekunden nach Netzrückkehr steht „THW 3.634 Bögen“ und der Ordner
  „Alle Einheiten aller Ortsverbände“, ohne Neuladen.

#### BB2-O3 – Langsamer Erstbesuch: Dialog lädt ohne Rückmeldung, Platzhalter für den OV-Ordner fehlt im Ordner „THW“

- **Priorität:** P3
- **Typ:** Bedienung
- **Kennzeichnung:** gemessen (`s8.js`: Dialog-Baustein um 4 s verzögert; `s10.js`: OV-Baustein um 5 s verzögert)
- **Neu oder alt (Verweis):** (a) neu, Folge der Auslagerung; (b) Rest von Runde 1 H2 bzw. Nr. 11 der Behebung (BB-S5, BB-H10)
- **Fundstelle:** (a) Knopf „Beispielbögen ansehen“, `<Suspense fallback={null}>` in `fusszeile.tsx`; (b) Dialog → „THW“.
  Der Platzhalter „wird geladen …“ steht in `beispiele-dialog.tsx` innerhalb der Register-Liste, und die erscheint nur, wenn
  es schon Unterordner gibt (`beispielOrdner.length > 0`). Unter „THW“ gibt es vor dem Baustein keinen.
- **Beobachtung:** (a) Nach dem Antippen passiert 4,6 s lang sichtbar nichts. Der Knopf bleibt unverändert, ohne Ladezeichen
  und ohne `aria-busy`, ein Dialog ist nicht offen (gemessen bei 0,3, 1,5 und 3 s). Weitere Tipps in dieser Zeit öffnen am Ende
  nur einen Dialog. (b) Das Register zeigt korrekt „THW … Bögen“. Im Ordner „THW“ steht während des Ladens aber kein
  Platzhalter, nur „101 Bögen · Angaben werden geladen …“, der Sammelknopf und die Karten (`17_thw_platzhalter.png`). Nach rund
  4 s erscheint „Alle Einheiten aller Ortsverbände … 3.533 Bögen“ über der Liste und schiebt Zähler, Sammelknopf und Karten nach
  unten. Der Zähler wechselt dabei von „101 Bögen“ auf „101 Bögen direkt in „THW“, außerhalb der Ordner oben“.
- **Erwartung der Rolle:** Ein Tipp wird sofort quittiert. Was gleich noch dazukommt, hat schon seinen Platz.
- **Folge:** Bei schwachem Netz tippt der Helfer mehrfach oder hält die Seite für hängend. Im Ordner „THW“ sucht er den OV-Ordner
  vergeblich oder tippt im Moment des Nachrutschens auf die falsche Stelle. Nach „offline bereit“ tritt beides nicht auf.
- **Empfehlung:** (a) Am Knopf sofort „wird geöffnet …“ zeigen, solange der Baustein lädt. (b) Den Platzhalter „Alle Einheiten
  aller Ortsverbände – wird geladen …“ auch dann zeigen, wenn „THW“ sonst noch keine Unterordner hat.
- **Nachprüfung:** Beide Bausteine um 4 bis 5 s verzögern: Der Knopf zeigt innerhalb von 0,3 s einen Ladezustand. Im Ordner
  „THW“ steht der Platzhalter von Anfang an an der Stelle, an der später der Ordner erscheint, und die Karten rutschen nicht.

## Hinweise (ohne Priorität)

- **H1 – Derselbe Satz dreimal:** In einem nicht vorrätigen OV steht nach einem Knopfdruck „Die Bögen der THW-Ortsverbände lädt
  die App nicht vorab: Ein Bogen braucht beim ersten Öffnen Netz …“ dreimal untereinander: im Ordnerhinweis, in der
  Sammelmeldung und in der roten Fehlerzeile (`06_offline_ov_anzeigen.png`). Auf 360 px sind damit fast zwei Drittel des ersten
  Bildschirms Text. Außerdem heißt es „**Einige** Bögen liegen noch nicht auf dem Gerät“, auch wenn alle 6 fehlen.
- **H2 – „Erneut laden“ ohne Rückmeldung:** Ohne Netz antippen ändert sichtbar nichts. Dieselbe Meldung steht in derselben Form
  wieder da, kein „versucht, weiter ohne Netz“. Ob der Tipp angekommen ist, sieht man nicht. Mit Netz funktioniert der Knopf
  (Weg B), und dort ist er der einzige Weg, weil das Telefon in einem WLAN ohne Internet kein `online`-Ereignis schickt.
- **H3 – Wie man einen OV mitnimmt, steht nirgends:** „Ein Bogen braucht beim ersten Öffnen Netz“ legt nahe, jeden Bogen einzeln
  anzuzeigen. Tatsächlich reicht es, den OV-Ordner einmal mit Netz zu öffnen und zu warten, bis die Angaben geladen sind.
  Umgekehrt sagt die Offline-Zeile auch dann noch „außer den Beispielbögen der THW-Ortsverbände“, wenn alle 3 529 auf dem Gerät
  liegen (siehe BB-O1, offen).
- **H4 – Speicherbedarf (Runde 1 H3, offen):** Nach „offline bereit“ schätzt der Browser 18,6 MB, nach dem Abruf aller OV-Bögen
  54,0 MB (die Dateien selbst 6,1 MB, der Rest ist Verwaltungsaufwand bzw. Aufrundung des Browsers). `eeb-ov-beispiele` hat keine
  Altersgrenze. Die App sagt weiter nirgends, wie viel die Beispielbögen belegen und wie man sie wieder loswird.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Nach „offline bereit“ ja, für OV-Bögen nur, wenn der Ortsverband vorher mit Netz geöffnet
  wurde. Vor „offline bereit“ ohne Netz nein, die App fällt auf den Fehlerschirm (BB2-O1).
- **Fremde Hilfe nötig:** nein nach „offline bereit“. Im Fall BB2-O1 bleibt nur Warten auf Netz, das sagt der Fehlerschirm aber
  nicht klar.
- **Größtes Missverständnis:** Der Fehlerschirm empfiehlt „Seite neu laden“, obwohl die Offline-Zeile eben noch „ohne Netz diese
  Seite nicht neu laden“ gesagt hat.
- **Größtes Einsatzrisiko:** Ein einziger Tipp auf „Beispielbögen ansehen“ im Funkloch vor „offline bereit“ nimmt dem Helfer
  bis zur nächsten Verbindung die ganze App, auch den eigenen Bogen (BB2-O1).
- **Top-Priorität für die nächste Iteration:** BB2-O1: Scheitert das Nachladen des Dialogs, darf das nur den Dialog betreffen,
  mit einem verständlichen Hinweis und einem neuen Versuch bei Netz.
