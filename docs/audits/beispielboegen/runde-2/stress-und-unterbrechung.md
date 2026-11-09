# Prüfbericht Beispielbögen, Runde 2: Stress und Unterbrechung

- **Prüfer:** Rolle „Stress und Unterbrechung“ (thw-stress-test-user): erfahrener Helfer unter Zeitdruck, wird unterbrochen und hat wenig Aufmerksamkeit frei
- **Datum:** 2026-11-09
- **Prüfgegenstand:** nur der Bereich Beispielbögen: Dialog „Beispielbögen“ mit dem neuen Suchfeld, der klebenden Pfadleiste mit Verkürzung „Alle › … ›“, der festen Dialoghöhe, dem gemerkten Ordner (`sessionStorage` `eeb.beispiel-pfad.v1`), Escape bzw. Zurück-Geste eine Ebene hoch, PDF-Quittung, Offline-Hinweisen der Ortsverbände, Platzhaltern beim Nachladen
- **Code-Stand:** `main`, Commit `085a93b`, live auf `https://erfassungsbogen.app/` (Fußzeile `v2026.1109.833`); lokal nicht gebaut (privates Submodul fehlt). Code gelesen: `src/app/beispiele-dialog.tsx` (`suchTreffer`, `pfadSetzen`, `cancel`-Handler, `beispielHolen`), Styles `.beispiel-suche`, `.beispiel-pfad`, `dialog.beispiele-dialog` in `index.html`
- **Zählung:** P0: 0 · P1: 2 · P2: 4 · P3: 3 · Hinweise: 4
- **Nachprüfung Runde 1:** 9 Befunde und 6 Hinweise; behoben 4, teilweise 7, offen 4 (Einzelheiten unten)
- **Kennzeichnung:** *gemessen* = im Testbrowser nachgestellt, *Risiko* = abgeleitet, *Schätzung* = Zeit für einen Menschen, aus Tipps und Wischen hochgerechnet.

## Prüfaufbau

- Playwright (`require('playwright')`, `chromium.launch()`), für jeden Lauf ein neuer Kontext mit `isMobile`/`hasTouch`, Locale de-DE, `deviceScaleFactor` 1. Viewports 360x640 und 390x844. Skripte `common.js`, `c1.js` bis `c10.js` und Bildschirmfotos `s-<Breite>-*.png` in `/tmp/claude-0/r2-stress/`.
- Getippt wurde mit `tap`, Text mit `keyboard.type` (120 ms je Zeichen), gewischt mit dem Mausrad im Dialog (450 px je Wischbewegung). Das DOM blieb unverändert, eingeschleuste Skripte gab es keine (strenge CSP).
- Suchtexte: „Oldenburg“, „OV Oldenburg Bergung“, „Oldenburg Bergung“, „B Oldenburg“, „Oldenburg B“, „Oldenbrug“ (Tippfehler), „Oldenbur“ (abgebrochen), „oldenburg tz b“, „TZ“, „Bergungsgruppe“, „Bergung“, „OV Oldenburg“, „Oldenburg (NI)“, „Oldenburg NI“, „Oldenburg 1 TZ B“, „THW Oldenburg“, „Zugtrupp Oldenburg“, „Ol“, „Oldenburg Holstein“, „Oldenburg ni b“.
- Unterbrechungen: „Schließen“ und wieder öffnen, Neuladen, „Anzeigen“ mit Rückkehr über „‹ Startseite“, Tab-Wechsel (3 s ein anderer Tab im Vordergrund), Einfrieren über CDP (`Page.setWebLifecycleState` frozen, 3 s, dann active), Escape-Kette ab OV-Ebene (dreimal wiederholt, auch mit Tipps dazwischen), Escape bei aktiver Suche, Suchtreffer → Ordner → „‹ Zurück“.
- Langsames Netz: Baustein `beispiele-thw-ov*` per Route um 4 s verzögert, Service Worker gesperrt (`c9.js`).
- Offline: Erstbesuch, OV Oldenburg (NI) mit Netz geöffnet, gewartet bis „✓ Jetzt offline bereit“ (nach 81 s), dann `setOffline(true)` und Neuladen (`c7.js`). Zweiter Lauf: erst „offline bereit“ abgewartet, neu geladen, dann OV Varel mit Netz geöffnet, danach offline (`c8.js`).
- Szenario wie in Runde 1: Der Zugführer will kurz vor einer Übung den Bogen der Bergungsgruppe des THW OV Oldenburg (NI) finden und als PDF oder Link an seine Helfer geben, diesmal mit Suchfeld.

## Annahmen

- Der Zugführer tippt zuerst den Ortsnamen, dann, wenn nötig, die Einheit, so wie sie auf den Karten steht („Bergungsgruppe“, „Bergung“). Gängige Kürzel wie „B“ oder „TZ“ benutzt er, wenn er sie kennt. Wie die Dateinamen aufgebaut sind, weiß er nicht.
- Am Telefon blendet sich beim Tippen die Bildschirmtastatur ein und belegt rund 40 % der Höhe. Im Testbrowser gibt es sie nicht (siehe „Nicht prüfbar“).
- Die Zurück-Geste unter Android löst beim offenen Dialog dasselbe `cancel`-Ereignis aus wie Escape am Rechner. Angenommen ist, dass Chrome unter Android dieselben Regeln für das Schließen anwendet wie das Chromium des Testbrowsers.

## Nicht prüfbar

- Bildschirmtastatur: wie viel von der Trefferliste über der Tastatur bleibt, war nicht messbar. Die Aussagen dazu sind abgeleitet.
- Echte Zurück-Geste, echtes Teilen-Menü (im Testbrowser gibt es kein `navigator.share`, der Link ging in die Zwischenablage) und das Beenden der App durch das Betriebssystem. Nachgestellt wurden nur Escape, Neuladen, Tab-Wechsel und Einfrieren.
- WebKit/iOS, native Builds, Handschuhe, Sonne, Lärm.
- Menschliche Zeiten: Gemessen ist nur die Zeit der Maschine. Die Zeiten für Menschen sind geschätzt, mit rund 1 s je Tipp oder Wischen, 0,4 s je Zeichen und 1 bis 2 s Lesen je Bildschirm.

## Urteil aus Sicht der Rolle

Die zweite Runde ist deutlich besser. Ein Ordner, in dem man einmal war, ist beim nächsten Öffnen wieder da, nach „Schließen“ sogar an derselben Stelle der Liste. Kopf und „Schließen“ springen nicht mehr. Die Pfadleiste bleibt beim Wischen stehen, ein Ordnerwechsel beginnt oben. Die Startseite sagt ehrlich, dass die Bögen der Ortsverbände nicht vorab geladen werden. Ein zweiter Aufruf kostet jetzt nur noch 2 Tipps und 3 bis 4 Wischbewegungen bis zur PDF.

Die **Suche hält aber nicht, was das Feld verspricht.** Wer „Oldenburg“ tippt, bekommt die ganze Regionalstelle Oldenburg: 57 Karten, darunter zehn gleich aussehende „Bergungsgruppe · 1. Technischer Zug“. Die erste stammt aus Aurich. Die gesuchte ist Karte 37, rund 19 Bildschirme tiefer. Der Ordner „OV Oldenburg (NI)“ steht nicht unter den Treffern (BB2-S1). Wer nach der Einheit sucht, die auf jeder Karte steht („Oldenburg Bergung“, „Bergungsgruppe“, „Zugtrupp Oldenburg“), bekommt **0 Treffer** ohne jeden Hinweis (BB2-S2). Der schnellste Weg geht über den Ordnertreffer „RSt Oldenburg“ und dann wieder durch die Ordner. Die Suche ersetzt also nur die ersten drei Ebenen. Dazu kommt: Die Zurück-Geste geht nur zwei- bis dreimal eine Ebene hoch, dann schließt sie den Dialog unvermittelt. Jeder Schritt überschreibt dabei den gemerkten Ordner (BB2-S3).

Weg im Szenario, Erstaufruf, gemessen:

| Weg | 360x640 | 390x844 | Maschinenzeit | Schätzung Mensch |
| --- | --- | --- | --- | --- |
| Runde 1, ohne Suche (Vergleich) | 7 Tipps, rund 5 Wischbewegungen, dazu 1.840 px Startseite | 7 Tipps | – | 35–50 s |
| **A: Suche „Oldenburg“ → Ordnertreffer „RSt Oldenburg“ → „OV Oldenburg (NI)“ → PDF** | 5 Tipps, 9 Zeichen, 4 Wischbewegungen im Dialog, dazu 1.843 px Startseite (rund 3 Wischbewegungen) | 5 Tipps, 9 Zeichen, 3 Wischbewegungen, 1.823 px Startseite | 11,8 s / 10,5 s | 25–35 s |
| B: Suche „Oldenburg“, dann bis zur Karte wischen | 3 Tipps, 9 Zeichen, 25 Wischbewegungen (11.250 px), Karte 37 von 57 | 3 Tipps, 20 Wischbewegungen (9.000 px) | – | über 60 s, mit hohem Risiko einer falschen Karte |
| C: Suche „OV Oldenburg Bergung“ | 0 Treffer | 0 Treffer | – | Abbruch oder neuer Versuch |
| D: zweiter Aufruf (gemerkter Ordner) | 2 Tipps, 3–4 Wischbewegungen, dazu Startseite | 2 Tipps, 3 Wischbewegungen | – | 10–15 s |

Weg A im Einzelnen (360x640): „Beispielbögen ansehen“ → Suchfeld → „Oldenburg“ → Ordnertreffer „THW › Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV) › Bremen, Niedersachsen › RSt Oldenburg“ (7 Zeilen hoch) → 1 Wischbewegung, „OV Oldenburg (NI)“ (y 686, unter dem Dialogrand bei 624) → 3 Wischbewegungen bis zur 5. Karte „Bergungsgruppe“ → „PDF“. Die Datei heißt `uebung-beispiel-thw-ortsverbaende-lv-bremen-niedersachsen-rst-oldenburg-ov-oldenburg-ni-ov-oldenburg-ni-05-1-tz-b.pdf` und kam nach rund 1,7 s.

## Nachprüfung Runde 1

| ID | Stand | Beobachtung Runde 2 |
| --- | --- | --- |
| BB-S1 | **teilweise** | Die Startseite meldet jetzt „Funktioniert komplett offline (außer den Beispielbögen der THW-Ortsverbände)“. Ordner und Ladefehler sagen „Ein Bogen braucht beim ersten Öffnen Netz und bleibt danach auf dem Gerät“ und bieten „Erneut laden“ an. Wer den Ordner nach fertigem Vorrat mit Netz geöffnet hatte (OV Varel), hatte offline alle 4 Bögen. Offen ist zweierlei: Offline zeigen die Karten weiter Dateinamen („ov-varel-02-1-tz-b“, „nicht geladen“) statt „Bergungsgruppe“; nur der Zug steht lesbar darunter. Und beim Erstbesuch hält das Versprechen nicht (BB2-S6). |
| BB-S2 | **teilweise** | Ein Suchfeld gibt es. Die Nachprüfung aus Runde 1 („Oldenburg Bergung“ in höchstens 4 Tipps bis zur PDF) scheitert aber: „Oldenburg Bergung“ ergibt 0 Treffer. Der beste Weg braucht 5 Tipps, 9 Zeichen und 3 bis 4 Wischbewegungen, und die Regionalstelle muss man dafür nicht mehr kennen. Siehe BB2-S1, BB2-S2. |
| BB-S3 | **teilweise** | Nach „Schließen“ öffnet der Dialog im selben Ordner und an derselben Stelle der Liste (Bildlauf 1.500 px). Nach Neuladen und nach „Anzeigen“ öffnet er im gemerkten Ordner, dann von oben. Tab-Wechsel und Einfrieren halten Ordner und Bildlauf. Offen: Nach „Anzeigen“ und „‹ Startseite“ steht die Startseite oben, der Knopf „Beispielbögen ansehen“ liegt dann 2.127 px tief, und einen Rückweg „Zurück zu den Beispielbögen“ gibt es nicht. Neu: Die Escape-Kette zerstört den gemerkten Ordner (BB2-S3). Die Suche wird nicht gemerkt (BB2-S7). |
| BB-S4 | **behoben** | Nach jedem Ordnerwechsel steht der Dialog auf Bildlauf 0, der Fokus liegt auf dem Ordnernamen. Die Pfadleiste klebt bei y 85 unter der Kopfzeile, „‹ Zurück“ ist von der letzten Karte aus ohne Wischen erreichbar. Neue Nebenwirkung siehe BB2-S4. |
| BB-S5 | **teilweise** | Das Register zeigt „THW … Bögen“, bis der Baustein da ist, und die Suche sagt „Bögen der Ortsverbände werden noch geladen …“. Auf der THW-Ebene fehlt der angekündigte Platzhalter „Alle Einheiten aller Ortsverbände – wird geladen …“ aber. Er liegt im Code innerhalb der Ordnerliste, die ohne weitere Unterordner gar nicht erscheint (Bild `s-360-lade-thw.png`). Zu sehen sind „101 Bögen“ und „Alle 101 in eine Übungs-Sammlung“. Nach 4 s erscheint der Ordner oben, und die Karten rutschen um 135 px (erste Karte von y 502 auf 637). Damit bleibt die Fehlfolgerung „Es gibt nur 101 THW-Bögen“ möglich. |
| BB-S6 | **teilweise** | Der Zähler sagt jetzt „101 Bögen direkt in ‚THW‘, außerhalb der Ordner oben“. Die 101 Einzelbögen liegen aber weiter neben dem Ordner, und worin sie sich von den OV-Bögen unterscheiden, steht nirgends. In der Suche fehlt der „Verstärkte Bergungszug Oldenburg (NI)“ bei „Oldenburg“; er erscheint nur bei „Bergung“. |
| BB-S7 | **behoben** | „Schließen“ steht auf allen Ebenen bei y 33 (360x640 und 390x844). Der Dialog ist 608 bzw. 812 px hoch. |
| BB-S8 | **teilweise** | Die Pfadleiste ist auf OV-Ebene 121 px hoch statt 235 px, Mittelstufen werden zu „…“ gekürzt, „Alle“ ist jetzt 44x44 px groß. Sie hat aber weiter drei Zeilen und klebt jetzt dauerhaft (BB2-S4). |
| BB-S9 | **teilweise** | PDF der Bergungsgruppe Oldenburg in Holstein: „vorgesehener Einsatzzeitraum: 09.11.2026 – 10.11.2026“, „ÜBUNG · Stand: 090857nov26“ in der Fußzeile jeder Seite; das Datum ist also aktuell. Der Hinweis auf fiktive Personen steht im Dialog weiter nur in der zugeklappten Erklärung (gemessen: „fiktiv“ außerhalb von `<details>` nicht vorhanden). |
| H1 | offen | Bei 360x640 endet der Dialog bei y 624, darunter steht lesbar „Für Einsatz, Übung …“ (alle Bilder `s-360-*`). |
| H2 | offen | „Kopiert“ steht 3 s am Link-Knopf und sagt nicht, was kopiert wurde (Zwischenablage: 741 Zeichen). |
| H3 | behoben | 150 ms nach dem Tipp auf „PDF“ steht „wird vorbereitet …“, und alle drei Knöpfe der Karte sind gesperrt. Dazu kommt eine Quittung, die man aber meist nicht sieht (BB2-S5). |
| H4 | behoben | Tab-Wechsel und Einfrieren über 3 s halten Dialog, Ordner und Bildlauf. Ein Doppeltipp im Register ist gesperrt (400 ms). |
| H5 | offen | Die PDF nennt weiter „OV-Oldenburg-SH@thw.de“, „Poststelle.RSt_Luebeck@thw.de“ und „Poststelle.LVHHMVSH@thw.de“. |
| H6 | offen | Auf der Ebene „Alle“ steht „THW“ bei 360x640 weiter zuletzt (y 679), unterhalb des Dialogrands. Das Suchfeld bietet jetzt aber einen zweiten Weg. |

## Neue Befunde

### BB2-S1 [P1, Suche] „Oldenburg“ liefert die ganze Regionalstelle; die gesuchte Bergungsgruppe ist Karte 37 von 57, die erste „Bergungsgruppe“ stammt aus Aurich

- **Kennzeichnung:** gemessen (`c1.js`, `c2.js`, `c3.js`; 360x640 und 390x844); Fehlgriff = Risiko
- **Fundstelle / Aufgabe:** Suchfeld, „Oldenburg“ (ebenso „OV Oldenburg“, „THW Oldenburg“, „Oldenburg (NI)“, „Oldenburg NI“).
- **Beobachtung:** „2 Ordner, 57 Bögen“. Als Ordnertreffer stehen „… › Bremen, Niedersachsen › RSt Oldenburg 53 Bögen“ und „… › RSt Lübeck › OV Oldenburg in Holstein 3 Bögen“. Der Ordner „OV Oldenburg (NI)“ fehlt, weil `suchTreffer` je Bogen nur den kürzesten passenden Pfad nimmt und „Oldenburg“ schon im Namen der Regionalstelle steht. Die Karten zeigen alle 53 Bögen der Regionalstelle in Dateireihenfolge: Aurich, Emden, Jever, Leer, Norden, Nordenham, Oldenburg in Holstein, dann erst Oldenburg (NI), danach Varel, Westerstede, Wilhelmshaven. Zehn Karten heißen „Bergungsgruppe / 1. Technischer Zug“ mit derselben Stärke 0/2/7//9. Die erste davon ist Karte 3 (Aurich, y 1.290), die gesuchte ist Karte 37 (y 11.504 bei 360x640, rund 19 Bildschirme). Der Ort steht erst in der zweiten Zeile der Karte, ohne „OV“. Mit „Oldenburg (NI)“ sind es 54 Karten; die gesuchte steht dann an 34. Stelle. Die erste Karte beginnt bei y 705, also unter dem Dialogrand (624).
- **Erwartung der Rolle:** „Oldenburg“ tippen, oben „OV Oldenburg (NI)“ als Ordner, darunter dessen 9 Bögen. Bögen aus anderen OVs der Regionalstelle stehen erst danach oder gar nicht.
- **Auswirkung im Einsatz:** Wer unter Zeitdruck die erste Karte „Bergungsgruppe“ antippt, verschickt den Bogen des OV Aurich; Stärke und Aufbau sehen gleich aus, der Fehler fällt erst beim Helfer auf. Wer es richtig machen will, wischt 25-mal oder muss erkennen, dass er den Ordnertreffer „RSt Oldenburg“ nehmen und sich dann wieder durch Ordner hangeln soll. Mit eingeblendeter Tastatur sieht man nach dem Tippen zunächst nur einen halben Ordnertreffer (Risiko).
- **Empfehlung:** Treffer im Namen des OV vor Treffern im Namen der Regionalstelle oder des Landesverbands nennen. Den OV-Ordner selbst als Treffer zeigen, auch wenn ein übergeordneter Ordner schon passt. Karten in der Trefferliste nach OV gruppieren, mit einer Zwischenzeile „OV Oldenburg (NI)“, oder den OV in die Überschrift der Karte nehmen („Bergungsgruppe · OV Oldenburg (NI)“).
- **Nachprüfung:** 360x640, „Oldenburg“: Der erste sichtbare Treffer ist „OV Oldenburg (NI)“. Keine Karte „Bergungsgruppe“ eines anderen OV steht vor der des OV Oldenburg (NI).
- **Typ:** Suche/Treffergüte

### BB2-S2 [P1, Suche] Die Einheit ist nicht suchbar: „Oldenburg Bergung“, „Bergungsgruppe“, „Zugtrupp Oldenburg“ ergeben 0 Treffer; Kürzel wirken als beliebige Buchstabenfolge

- **Kennzeichnung:** gemessen (`c1.js`)
- **Fundstelle / Aufgabe:** Suchfeld, Einheit oder Kürzel eingeben.
- **Beobachtung:** Die Suche läuft nur über Ordnernamen und Dateinamen, nicht über die Einheit im Bogen (`suchTreffer`). Ergebnisse:

  | Eingabe | Ergebnis |
  | --- | --- |
  | „OV Oldenburg Bergung“, „Oldenburg Bergung“ | 0 Ordner, 0 Bögen |
  | „Bergungsgruppe“, „Zugtrupp Oldenburg“ | 0 Ordner, 0 Bögen |
  | „Bergung“ | 1 Bogen: „Verstärkter Bergungszug Oldenburg (NI)“; keine der rund 600 Bergungsgruppen |
  | „Oldenbrug“ (Tippfehler) | 0 Ordner, 0 Bögen, kein Hinweis |
  | „Oldenbur“ | wie „Oldenburg“ (57) |
  | „B Oldenburg“, „Oldenburg B“ | wie „Oldenburg“ (57): Das „b“ steckt in „Oldenburg“ selbst |
  | „oldenburg tz b“, „Oldenburg 1 TZ B“ | 50 bzw. 49 Bögen, gesuchte Karte an 33. Stelle |
  | „TZ“ | 17 Ordner (u. a. „Katastrophenschutz 290 Bögen“, „RSt Chemnitz“, OV Forst (Lausitz), OV Preetz, OV Ratzeburg), 60 Bögen, „Nicht alle Treffer gezeigt“ |
  | „Ol“ | 20 Ordner (Hamburg/MV/SH, RSt Ingolstadt, RSt Olpe …), 60 Bögen |

  Bei 0 Treffern steht nur „0 Ordner, 0 Bögen“, ohne Hinweis auf Schreibweise oder darauf, dass nach Orten gesucht werden kann. Der Platzhalter „Ort, OV oder Einheit, z. B. Oldenburg“ verspricht eine Suche nach Einheiten, und bei 360 px ist er auf „z. B. Oldenbu“ abgeschnitten.
- **Erwartung der Rolle:** Wörter, die auf den Karten stehen („Bergungsgruppe“, „Zugtrupp“, „Technischer Zug“), findet die Suche. „B“ und „TZ“ gelten als Kürzel oder ganze Wörter. Bei 0 Treffern sagt die Suche, wonach sie sucht, und schlägt etwas Ähnliches vor.
- **Auswirkung im Einsatz:** Die naheliegende Eingabe führt zu „0 Bögen“. Unter Stress folgt daraus: „Für unseren OV gibt es keinen Bogen“ oder „Die Suche geht nicht“, und der Zugführer gibt auf oder sucht mehrfach. Kurze Kürzel überfluten die Liste mit Treffern, die damit nichts zu tun haben.
- **Empfehlung:** Einheitsbezeichnung und Zug (wie auf der Karte angezeigt) in den Suchtext aufnehmen. Wörter mit einem oder zwei Buchstaben nur als Wortanfang oder als ganzes Kürzel werten. Bei 0 Treffern einen Satz zeigen („Kein Treffer für ‚Oldenbrug‘. Gesucht wird in Orten, OVs und Einheiten.“), wenn möglich mit fehlertoleranter Nähe („Meintest du Oldenburg?“).
- **Nachprüfung:** „Oldenburg Bergung“ liefert die Bergungsgruppe des OV Oldenburg (NI) unter den ersten drei Treffern. „B Oldenburg“ engt gegenüber „Oldenburg“ ein. „Oldenbrug“ zeigt einen Hinweis.
- **Typ:** Suche/Umfang

### BB2-S3 [P2, Unterbrechung] Escape bzw. Zurück-Geste schließen den Dialog nach zwei bis vier Schritten unvermittelt, jeder Schritt überschreibt den gemerkten Ordner

- **Kennzeichnung:** gemessen (`c4.js`, `c5.js`, 360x640, Chromium; vier Läufe); Zurück-Geste unter Android = Risiko (Annahme oben)
- **Fundstelle / Aufgabe:** Dialog im OV Oldenburg (NI), Escape mehrfach drücken.
- **Beobachtung:** Das erste Escape geht wie vorgesehen eine Ebene hoch (RSt Oldenburg), das zweite meist auch (Bremen, Niedersachsen). Dann schließt sich der Dialog mitten in der Kette: in den Läufen nach 3, 2, 4 und 3 Escapes, auch mit einem Tipp auf die Überschrift dazwischen. Chromium lässt das Abbrechen des `cancel`-Ereignisses offenbar nicht beliebig oft zu. Der `cancel`-Handler ruft vorher noch `pfadSetzen` auf. Gemerkt ist deshalb danach eine Zwischenstufe (`["thw","ortsverbaende"]` oder `[…,"lv-bremen-niedersachsen"]`), nicht mehr der OV. Schon ein einziges versehentliches Escape ersetzt den gemerkten OV durch die Regionalstelle. Nur „Schließen“ behält den OV und den Bildlauf.
- **Erwartung der Rolle:** Die Zurück-Geste tut jedes Mal dasselbe. Wer den Dialog wegwischt, weil er angesprochen wird, findet beim Wiederöffnen den Ordner vor, in dem er zuletzt gearbeitet hat.
- **Auswirkung im Einsatz:** Die Zurück-Geste ist unter Stress die häufigste Bedienung. Mal geht sie eine Ebene hoch, mal ist der Dialog weg. Nach dem Wiederöffnen steht der Zugführer zwei bis drei Ebenen über seinem OV und muss den Weg teilweise neu gehen. Damit kehrt BB-S3 auf diesem Weg zurück.
- **Empfehlung:** Den gemerkten Ordner nicht schon bei jedem Schritt nach oben überschreiben, sondern erst bei einem bewussten Ordnerwechsel durch Antippen; alternativ zusätzlich den „tiefsten zuletzt geöffneten Ordner“ merken. Wenn die Plattform das Schließen erzwingt, beim Wiederöffnen dort weitermachen, wo vor der Escape-Kette gearbeitet wurde.
- **Nachprüfung:** OV Oldenburg öffnen, Escape fünfmal schnell hintereinander, „Beispielbögen ansehen“: Der Dialog zeigt OV Oldenburg (NI) oder bietet ihn sichtbar als „Zuletzt: OV Oldenburg (NI)“ an.
- **Typ:** Unterbrechung/Zustand

### BB2-S4 [P2, Orientierung] Die klebende Pfadleiste ist auf dem Telefon drei Zeilen hoch und verdeckt die Überschrift der Karte, deren Knöpfe direkt darunter stehen

- **Kennzeichnung:** gemessen (`c3.js`, Bild `s-360-A4-bergung.png`; 360x640 und 390x844)
- **Fundstelle / Aufgabe:** OV Oldenburg (NI), bis zur Bergungsgruppe wischen.
- **Beobachtung:** Die Pfadleiste klebt bei y 85 bis 206 (121 px). Zeile 1: „‹ Zurück“; Zeile 2: „Alle › … › RSt Oldenburg“; Zeile 3: „› OV Oldenburg (NI)“. Die Leiste umbricht auch bei 390 px dreizeilig. Mit der Kopfzeile sind oben 190 px von 608 px Dialoghöhe fest belegt (31 %). Beim Wischen gleitet die Überschrift einer Karte unter die Leiste, während ihre Knöpfe „Anzeigen / PDF / Link“ noch direkt darunter stehen. Im Bild stehen oben Knöpfe ohne Überschrift (sie gehören zur Bergungsgruppe), darunter die vollständige Karte „Fachgruppe Räumen (A)“. Das „…“ lässt sich nicht antippen; zum Landesverband geht es nur über zweimal „‹ Zurück“ oder über „Alle“.
- **Erwartung der Rolle:** Jeder sichtbare Knopf „PDF“ lässt sich ohne Nachdenken einer Einheit zuordnen. Die Leiste ist eine Zeile hoch.
- **Auswirkung im Einsatz:** Wer nach einer Unterbrechung auf den Bildschirm schaut, sieht oben ein „PDF“ ohne Namen und darunter die Überschrift der nächsten Einheit. Die Zuordnung nach oben ist plausibel, aber falsch, und man erwischt den Bogen der Nachbarkarte (Risiko). Die Liste hat außerdem ein Drittel weniger Platz, die Karten (rund 290 px) passen nur einmal ins Bild.
- **Empfehlung:** Die Pfadleiste auf dem Telefon in eine Zeile bringen („‹ Zurück“ links, rechts nur der aktuelle Ordner, der Rest über „…“ antippbar). Die Aktionen einer Karte dicht an ihrer Überschrift halten, oder die Überschrift der Karte ebenfalls kleben lassen, solange ihre Knöpfe sichtbar sind.
- **Nachprüfung:** 360x640, OV Oldenburg, in 100-px-Schritten wischen: Kein sichtbarer Knopf „PDF“ steht ohne die zugehörige Einheitsbezeichnung im Bild, und die Pfadleiste ist höchstens 56 px hoch.
- **Typ:** Layout/Zuordnung

### BB2-S5 [P2, Rückmeldung] Die PDF-Quittung erscheint über der Liste außer Sicht und verschwindet nach 6 s

- **Kennzeichnung:** gemessen (`c10.js`, 360x640)
- **Fundstelle / Aufgabe:** „PDF“ an einer Karte weiter unten in der Liste antippen.
- **Beobachtung:** Die Quittung „PDF ‚uebung-beispiel-…-02-1-tz-b.pdf‘ erzeugt — liegt im Download-Ordner.“ (97 px hoch) steht über der Trefferliste. Beim Tipp stand der Dialog auf Bildlauf 835, die Quittung lag bei y −315, also außer Bild. Nach 6,8 s war sie weg. An der Karte selbst steht während der Erzeugung kurz „wird vorbereitet …“, danach nichts mehr. Nach dem Tipp fällt der Fokus auf `<body>`.
- **Erwartung der Rolle:** Die Bestätigung steht dort, wo getippt wurde, und bleibt so lange stehen, dass ein Blick nach einer Ablenkung reicht.
- **Auswirkung im Einsatz:** Wer kurz wegsieht, weiß nicht, ob die PDF entstanden ist. Er tippt erneut und hat zwei gleichnamige Dateien im Download-Ordner, oder er sucht die Datei, ohne ihren Namen zu kennen.
- **Empfehlung:** Die Quittung an der Karte zeigen („✓ PDF gespeichert“ statt des Knopftexts oder darunter), solange bis die nächste Aktion folgt. Der Fokus bleibt auf dem Knopf.
- **Nachprüfung:** 360x640, „PDF“ an der 5. Karte: Bestätigung im Bild ohne Wischen, auch 10 s später noch sichtbar.
- **Typ:** Rückmeldung

### BB2-S6 [P2, Offline] Beim Erstbesuch mit Netz geöffnete OV-Bögen sind offline nur teilweise da, obwohl der Hinweis „bleibt danach auf dem Gerät“ zusagt

- **Kennzeichnung:** gemessen (`c7.js` gegen `c8.js`, 360x640); Ursache nicht geprüft
- **Fundstelle / Aufgabe:** Erster Aufruf der Seite, gleich OV Oldenburg (NI) geöffnet (alle 9 Karten mit Namen geladen), später ohne Netz.
- **Beobachtung:** Nach fertigem Vorrat (81 s), Netztrennung und Neuladen zeigte OV Oldenburg (NI) nur 3 von 9 Bögen mit Namen (02, 04, 05: Führungsunterstützung, Zugtrupp, Bergungsgruppe). Bei den übrigen 6 standen Dateinamen und „nicht geladen“, dazu „Einige Bögen liegen noch nicht auf dem Gerät … bleibt danach auf dem Gerät.“ In der Suche „Oldenburg“ waren offline alle Karten Dateinamen. Im Gegenlauf, mit OV Varel erst nach „offline bereit“ und Neuladen geöffnet, waren offline alle 4 Bögen da. Vermutlich laufen die Abrufe beim Erstbesuch noch am Service Worker vorbei (nicht geprüft).
- **Erwartung der Rolle:** Was ich mit Netz gesehen habe, habe ich auch ohne Netz. Wenn nicht, sagt die App es vorher.
- **Auswirkung im Einsatz:** Typischer Ablauf: Der Zugführer ruft die Seite am Vorabend zum ersten Mal auf und sieht die Bögen seines OV. Auf dem Übungsgelände fehlen dann zwei Drittel davon, und der Hinweis widerspricht dem, was er erlebt hat. Dass die Bergungsgruppe in diesem Lauf dabei war, war Zufall.
- **Empfehlung:** Einen geöffneten OV-Ordner zuverlässig für offline sichern (auch beim Erstbesuch) und das an den Karten zeigen („✓ auf dem Gerät“). Wo das nicht geht, den Hinweis einschränken („nach dem ersten Neuladen“).
- **Nachprüfung:** Neuer Kontext, Seite laden, sofort OV Oldenburg (NI) öffnen, Vorrat abwarten, offline neu laden: alle 9 Bögen mit Namen.
- **Typ:** Offline/Zusage

### BB2-S7 [P3, Unterbrechung] Die Suche ist kein Ort: Ordnertreffer → „‹ Zurück“ führt in den Elternordner, Suchtext und Trefferliste sind weg

- **Kennzeichnung:** gemessen (`c4.js`)
- **Fundstelle / Aufgabe:** „Oldenburg“ suchen, Ordnertreffer „OV Oldenburg in Holstein“ antippen (falscher OV), zurück.
- **Beobachtung:** „‹ Zurück“ führt nach „RSt Lübeck“, das Suchfeld ist leer. Ebenso leert „Schließen“ und Wiederöffnen die Suche. Escape bei aktiver Suche leert sie und lässt den Ordner stehen; das ist folgerichtig, kostet aber ebenfalls den Suchtext.
- **Erwartung der Rolle:** Nach einem Fehlgriff aus der Trefferliste komme ich mit „Zurück“ wieder zur Trefferliste.
- **Auswirkung im Einsatz:** Wer den falschen Oldenburg-Treffer erwischt, tippt den Suchtext neu ein (mit Bildschirmtastatur 9 Zeichen) oder geht durch fremde Ordner zurück.
- **Empfehlung:** Die Trefferliste als Schritt in der Pfadleiste führen („‹ Zurück zur Suche ‚Oldenburg‘“) und den Suchtext für die Sitzung merken.
- **Nachprüfung:** Suche, Ordnertreffer, „‹ Zurück“: Die Trefferliste „Oldenburg“ erscheint wieder.
- **Typ:** Zustand/Navigation

### BB2-S8 [P3, Weitergabe] Der PDF-Dateiname ist 112 bis 162 Zeichen lang, der OV steht doppelt darin, das Unterscheidende ganz am Ende

- **Kennzeichnung:** gemessen (`c3.js`, `c10.js`)
- **Beobachtung:** `uebung-beispiel-thw-ortsverbaende-lv-bremen-niedersachsen-rst-oldenburg-ov-oldenburg-ni-ov-oldenburg-ni-05-1-tz-b.pdf` (112 Zeichen); für Oldenburg in Holstein 162 Zeichen. Die Quittung gibt den ganzen Namen wieder und ist dadurch 4 bis 5 Zeilen hoch.
- **Auswirkung im Einsatz:** Download-Liste und Messenger kürzen den Namen in der Mitte oder am Ende; zu sehen ist „uebung-beispiel-thw-ortsverb…“. Wer zwei Bögen weitergibt, kann sie nicht unterscheiden, und „05-1-tz-b“ sagt dem Helfer nichts (Risiko).
- **Empfehlung:** Kurzer Name mit Einheit und OV vorn, Organisationspfad weglassen, kein doppelter OV, etwa `uebung-ov-oldenburg-ni-bergungsgruppe-1tz.pdf`.
- **Nachprüfung:** Dateiname höchstens rund 50 Zeichen, nennt Einheit und OV in den ersten 40 Zeichen.
- **Typ:** Weitergabe

### BB2-S9 [P3, Layout] Ordnertreffer zeigen den ganzen Pfad, 6 bis 7 Zeilen je Treffer; die erste Karte liegt unter dem Rand

- **Kennzeichnung:** gemessen (`c1.js`, Bild `s-360-q-Oldenburg.png`)
- **Beobachtung:** Jeder Ordnertreffer beginnt mit „THW › Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV) › …“ und ist bei 360 px rund 185 px hoch. Bei „Oldenburg“ beginnt die erste Karte bei y 705, bei „TZ“ (17 Ordner) bei y 3.559. Was den Treffer unterscheidet (RSt bzw. OV), steht am Ende.
- **Auswirkung im Einsatz:** Mit Bildschirmtastatur ist nach dem Tippen nur ein Teil des ersten Treffers zu sehen (Risiko). Der wichtige Teil steht in der letzten Zeile.
- **Empfehlung:** Treffer mit dem eigenen Namen vorn zeigen („OV Oldenburg (NI)“), den Pfad klein darunter und gekürzt („THW · Bremen, Niedersachsen · RSt Oldenburg“).
- **Nachprüfung:** 360x640, „Oldenburg“: zwei Ordnertreffer und mindestens der Kopf der ersten Karte im Bild.
- **Typ:** Layout/Suche

## Hinweise (ohne Priorität)

- **H1 Gemerkter Ordner wirkt:** Nach Neuladen, „Anzeigen“ und Schließen öffnet der Dialog in OV Oldenburg (NI). Der zweite Aufruf braucht 2 Tipps bis zur Karte. Das spart unter Stress am meisten.
- **H2 Einfrieren und Hintergrund halten:** Nach 3 s Tab-Wechsel und 3 s „frozen“ stehen Dialog, Ordner und Bildlauf (2.652 px) unverändert.
- **H3 Suche erst ab zwei Zeichen:** Ein Zeichen zeigt die Ordner, zwei Zeichen („Ol“) liefern schon 20 Ordner und 60 Bögen mit „Nicht alle Treffer gezeigt“. Das stört nicht, kostet aber beim Tippen Rechenzeit und bewegt die Liste mit jedem Zeichen.
- **H4 Nach „Anzeigen“ liegt der Einstieg tiefer:** Mit offenem Beispielbogen auf der Startseite liegt „Beispielbögen ansehen“ 2.127 px tief statt 1.843 px. Ein Rückweg aus dem Bogen fehlt (siehe BB-S3).

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (mit Suche in 5 Tipps, 9 Zeichen und 3 bis 4 Wischbewegungen, aber nur über den Ordnertreffer der Regionalstelle; mit der naheliegenden Eingabe „Oldenburg Bergung“ nein)
- **Fremde Hilfe nötig:** nein; die Regionalstelle muss man nicht mehr kennen, aber man muss den Umweg über den Ordnertreffer selbst erkennen
- **Größtes Missverständnis:** „Oldenburg“ zeigt zehn gleich aussehende Bergungsgruppen der ganzen Regionalstelle, und die erste ist die aus Aurich.
- **Größtes Einsatzrisiko:** Der Zugführer verschickt unter Zeitdruck den Bogen eines anderen OV, weil die Trefferliste nicht nach OV ordnet und der Ort erst in der zweiten Kartenzeile steht (BB2-S1).
- **Top-Priorität für die nächste Iteration:** Die Suche auf OV und Einheit ausrichten: OV-Ordner als ersten Treffer zeigen, Einheitsnamen mit durchsuchen, Karten nach OV gruppieren (BB2-S1 mit BB2-S2).
