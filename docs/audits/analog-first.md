# Audit „Analog first" (Papier-Rückfallebene, Medienbrüche, Wiedereinstieg)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-analog-first-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite build` + `vite preview`),
Zweig `claude/thw-reviewer-skills-dr76q1`, Commit `3ca9aa7`.

Reiner Prüfbericht, keine Codeänderung.
> *Nachtrag 28.09.2026:* Die Befunde dieses Berichts sind behoben oder mit
> Begründung zurückgestellt; der Stand je Befund steht in
> [README.md → Stand der Behebung](README.md#stand-der-behebung).


## Prüfaufbau

Chromium (Playwright), 360 × 640 für die App, Chromium-PDF-Ansicht für die
erzeugten Dateien. Geprüft: der Einzelbogen als PDF (Papier-Layout, QR-Code,
Fußzeile), die Blanko-Vorlage (`public/downloads/einheiten-erfassungsbogen-
blanko.pdf`), die Sammel-PDF eines Einsatzes mit einer anwesenden und einer
abgerückten Einheit (gedruckte Übergabe-Übersicht gegen den eingebetteten
Datenstand, der auf Gerät C wieder eingelesen wurde), die Nacherfassung
eines Papierbogens am Meldekopf („Einheit manuell erfassen…", „Nur
Stärke"), das Einlesen fotografierter Bögen („Bögen einlesen…"), der
Handscanner-Weg, und was nach Akku- oder Geräteausfall auf jeder Seite
übrig bleibt.

Annahmen (realer Ablauf nicht aus Vorschriften belegt): Der Meldekopf führt
parallel eine Kräfteübersicht auf Whiteboard oder Papier; Eintreff- und
Abrückzeiten sind für Einsatztagebuch und Abrechnung maßgeblich; nach dem
Einsatz wird eine vollständige Übersicht abgelegt.

## Urteil

Diese App verlangt dem Papier-Menschen wenig ab: Sie braucht keinen Server,
kein Konto, kein Netz, und ihr Ergebnis ist der bekannte Papierbogen — als
PDF eins zu eins, mit dem QR-Code als Anhang, nicht als Ersatz. Wer auf
Papier ankommt, wird gescannt oder abgetippt; wer digital ankommt, kann
jederzeit gedruckt werden. Für die Einheit ist der digitale Weg ein echter
Gewinn: kein Abschreiben am Meldekopf, keine Übertragungsfehler bei zwölf
Namen und vier Rufnummern. Für den Meldekopf hat der digitale Weg zwei
Lücken, die Papier nicht hätte: Die gedruckte Übergabe-Übersicht lässt
abgerückte Einheiten weg, obwohl sie in der Datei stecken — Papier und
Datenstand widersprechen sich —, und ein nachträglich vom Papier
abgetippter Bogen bekommt als Eintreffzeit den Moment des Abtippens. Ohne
Eintreff- und Abrückzeiten auf dem Ausdruck bleibt der Meldeblock die
maßgebliche Quelle.

## Befunde

### A1 [P1] Die gedruckte Übergabe-Übersicht lässt abgerückte Einheiten weg — Papier und Datei stimmen nicht überein

Fundstelle: Einsatzansicht → „Sammel-PDF (alle Bögen)", Seite 1
„Übergabe-Übersicht", Einsatz mit zwei Einheiten (Albstadt anwesend,
Crailsheim abgerückt).
Beobachtung: Die Übersicht führt eine Zeile („THW Albstadt … Erstmeldung"),
„Summe (1 Einheiten)", „Bedarf gesamt (1 Einheiten, 4 Personen)"; die
Bögen dahinter: nur Albstadt (Datei 2 Seiten). Crailsheim fehlt auf dem
Papier vollständig — kein „abgerückt", keine Zeile. Die in derselben PDF
eingebettete Sammlung enthält Crailsheim mit Status „abgerückt"; auf Gerät C
importiert erscheinen beide. Spalten der Übersicht: Einheit, Stand (der
Absender-Stand, hier ein Datum aus Juli), Stärke, Fzg, Veränderung — keine
Eintreffzeit, keine Abrückzeit (siehe Arbeitsablauf-Audit W3).
Erwartung der Rolle: Ein Übergabeblatt zeigt alles, was da war und wieder
weg ist, mit Uhrzeiten. „Alle Bögen" heißt alle. Was ich ausdrucke, ist
dasselbe, was in der Datei steckt.
Auswirkung im Einsatz: Die ablösende Schicht auf Papier weiß nichts von
Crailsheim; bei Abrechnung, Rückfragen („war Crailsheim da?") und
Einsatztagebuch fehlt die Einheit. Wer digital importiert, sieht sie —
zwei Wahrheiten für dieselbe Übergabe. Am Einsatzende, wenn alle abgerückt
sind, verweigert der Druck ohnehin (W2).
Empfehlung: Abgerückte Einheiten in der Übersicht als eigenen Block mit
Eintreff- und Abrückzeit; Spalte „eingetroffen" statt nur „Stand"; die
Bögen abgerückter Einheiten anhängen oder die Weglassung auf dem Blatt
benennen; der Ausdruck muss immer den ganzen Datenstand zeigen.
Verifikation: Einsatz mit einer abgerückten Einheit drucken — sie muss
auf Seite 1 stehen, mit Zeiten; Papier und Import auf Gerät C müssen
dieselben Einheiten nennen.

### A2 [P1] Nacherfassung vom Papier: Eintreffzeit und Stand sind immer „jetzt"

Fundstelle: Einsatzansicht → „Einheit manuell erfassen…" (Assistent),
„Einheit schnell erfassen (nur Stärke)…", und „In Einsatz aufnehmen" bei
einem aus PDF geladenen Bogen.
Beobachtung: Es gibt kein Feld für die Eintreffzeit; der Eintrag bekommt
den Zeitpunkt des Abtippens (`empfangenAm`), der Bogen den Stand des
Abtippens. Die Kästchen „Einsatzbeginn/Einsatzende" in Schritt 2 setzen
beim Ankreuzen ebenfalls „jetzt" (korrigierbar, aber nicht als Eintreffzeit
der Meldung geführt). Sortierung „Eintreffzeit (neueste zuerst)" ordnet
nach diesem Stempel.
Erwartung der Rolle: Wer um 14 Uhr zwölf Papierbögen vom Vormittag
einpflegt, trägt je Bogen die Uhrzeit vom Meldeblock ein. Sonst ist die
digitale Liste schlechter als der Block.
Auswirkung im Einsatz: Nach einer Phase ohne Gerät (Akku leer, Tablet
weg, Andrang zu groß) sind alle nachgetragenen Einheiten „um 14:03
eingetroffen"; Sortierung und Übergabe-Übersicht sind damit falsch, und
die einzig richtige Zeit steht auf Papier — Doppelführung ohne Abgleich.
Empfehlung: Beim manuellen Erfassen und beim Aufnehmen aus Datei ein Feld
„eingetroffen am" (vorbelegt jetzt, korrigierbar), dasselbe für
„abgerückt"; die Eintreffzeit auf Karte, Übersicht und Ausdruck zeigen.
Verifikation: Papierbogen mit Eintreffzeit 09:40 um 14:00 nachtragen — die
Karte muss 09:40 zeigen, die Übersicht danach sortieren.

### A3 [P2] Die Lage lebt auf einem Gerät — ohne Anstoß, sie regelmäßig zu Papier zu bringen

Fundstelle: Einsatzansicht; Datensicherung in der Fußzeile.
Beobachtung: Die Sammlung existiert nur im Browserspeicher des
Meldekopf-Geräts. Es gibt die Sammel-PDF (alle Bögen, viele Seiten), CSV
und Excel, aber keinen kurzen Weg „Lage jetzt drucken" (nur die Übersicht,
eine Seite) und keinen Hinweis, das in Abständen zu tun. Bei leerem Akku
oder defektem Gerät bleibt der letzte Ausdruck — oder nichts. Der
Speicher kann außerdem volllaufen, ohne dass die App es sagt
(Offline-Audit O1).
Erwartung der Rolle: Alle 60 Minuten ein Blatt für die Wand — das ist der
Stand, der bei Ausfall gilt.
Auswirkung im Einsatz: Ein voller Tag Kräfteübersicht ist bei
Geräteausfall weg; der Meldekopf führt deshalb ohnehin das Whiteboard
mit — Doppelarbeit, die der digitale Weg abnehmen sollte.
Empfehlung: „Übersicht drucken" (eine Seite quer, mit Eintreff-/
Abrückzeiten) als eigener Knopf neben der Sammel-PDF; eine Zeile
„Zuletzt gedruckt/gesichert vor 2 h" in der Einsatzansicht.
Verifikation: Aus der Einsatzansicht in zwei Tipps ein einseitiges
Lageblatt erzeugen.

### A4 [P2] Sammel-PDF als einziger Druckweg wächst mit jedem Bogen

Fundstelle: „Sammel-PDF (alle Bögen)".
Beobachtung: Die Datei enthält nach der Übersicht jeden Bogen als volle
Seite mit QR-Code; bei 40 Einheiten 41+ Seiten. Für die Wand oder die
Ablösung braucht es meist nur Seite 1.
Erwartung der Rolle: Übersicht und Bögen getrennt wählbar.
Auswirkung im Einsatz: Drucker im Bereitstellungsraum ist selten und
langsam; 41 Seiten je Stunde werden nicht gedruckt, also gar nichts.
Empfehlung: Siehe A3 — Übersicht allein; Bögen nur auf Wunsch.
Verifikation: Sammel-PDF mit „nur Übersicht" erzeugen — eine Seite.

### A5 [P3] Kennung eines Bogens ist der Name — Papier und Scan derselben Einheit können sich verpassen

Fundstelle: Aufnahme in den Einsatz („Einheit ist bereits gemeldet").
Beobachtung: Die App erkennt eine Einheit an Organisation, Einheitstyp
und Name der untersten Ebene. Ein abgetippter Papierbogen („OV Albstadt",
Einheitstyp leer) und ein späterer Scan derselben Einheit („Albstadt",
ZTr TZ) gelten als zwei Einheiten; eine laufende Nummer gibt es auf dem
Bogen nicht. Umgekehrt fängt die Prüfung Doppelscans sauber ab
(„gleicher Inhalt — übersprungen").
Erwartung der Rolle: Ein Bogen hat eine Nummer, die auf Papier und im
Gerät gleich ist; oder die App fragt bei ähnlichen Namen nach.
Auswirkung im Einsatz: Doppelzählung nach einer Papierphase; erkennbar,
aber nur beim Durchsehen der Liste.
Empfehlung: Beim Aufnehmen ähnliche Einheiten vorschlagen („Meinten Sie
‚THW Albstadt ZTr TZ' (manuell erfasst 09:40)?") mit „Zusammenführen".
Verifikation: Papierbogen abtippen, dann denselben Bogen scannen — die
App muss die Nähe erkennen.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen der Einheit ausfüllen | Vorlage mit Stammbesetzung, Ankreuzen statt Schreiben, Rufnummern aus der Dienststellenliste; keine Übertragungsfehler beim Meldekopf | Blanko-PDF drucken und von Hand ausfüllen (vorhanden); Meldeblock | Meldekopf tippt ab („Einheit manuell erfassen", Reihenfolge wie Papier) oder nur Stärke („Nur Stärke"); Eintreffzeit fehlt dabei (A2) |
| Übergabe an den Meldekopf | QR-Code, Link, Nahbereich, Datei — ohne Netz; Signatur belegt Herkunft | Ausgedruckter Bogen (PDF = Papier-Layout) oder handschriftlicher Bogen | Papier mit QR: scannen (Kamera, Handscanner, Foto/Stapel); Papier ohne QR: abtippen |
| Lage führen (Stärke, Bedarf, Züge) | Summen laufend, Zwischensummen je Zug, Filter, Folgemeldungs-Vergleich | Whiteboard/Strichliste vom gedruckten Lageblatt | Nur über Sammel-PDF (viele Seiten, ohne Abgerückte, A1/A3/A4); Nachtragen von Änderungen der Papierphase ohne Zeitfeld (A2) |
| Statuswechsel „abgerückt" | Ein Tipp, Summen sofort | Eintrag mit Uhrzeit im Meldeblock | Kein Abrückzeitpunkt im Gerät (W3): der Block bleibt maßgeblich |
| Schichtübergabe | Sammel-PDF mit eingebetteter Sammlung → „Einsatz importieren" auf dem nächsten Gerät, Historie inklusive | Ausgedruckte Übergabe-Übersicht — unvollständig (A1); bei allen abgerückt kein Druck (W2) | Import der Sammel-PDF (funktioniert, Status und Historie bleiben) |
| Einsatzende / Archiv | Datei mit allem; nach 90 Tagen Namen anonymisiert (App sagt es in Schritt 2) | Vollständiger Ausdruck vor Tag 90 — derzeit nicht erzeugbar, wenn alle abgerückt sind (W2) | Datensicherung (JSON) einspielen; Papier nicht rücklesbar außer über QR |

Nicht gelistet: Themenwahl, Vorlagenpflege, Beispielbögen — keine
Rückfallebene nötig.

## Würde ich dafür das Papier weglegen?

Für den eigenen Bogen der Einheit: ja — das PDF ist der Papierbogen, nur
ohne Abschreibefehler, und der QR-Code kostet nichts extra; fällt das Gerät
aus, gilt der letzte Ausdruck oder der Blanko-Bogen. Für die
Kräfteübersicht am Meldekopf: noch nicht — solange Eintreff- und
Abrückzeiten nicht im Gerät stehen und der Ausdruck abgerückte Einheiten
verschweigt, bleibt der Meldeblock die einzige vollständige Quelle, und die
App ist die Zweitschrift.

## Was gut funktioniert und erhalten bleiben sollte

Das PDF ist der Bogen: Stärke, OV/RB/LV mit Rufnummern, Einsatzzeitraum,
Auftrag, „Einsatzbeginn/Einsatzende" als leere Felder zum handschriftlichen
Eintragen, Fahrzeuge mit taktischem Zeichen, Funktionen und Namen,
Sofortbedarf mit Kästchen, unten der QR-Code mit dem Satz „Mit der Kamera
scannen oder den Link antippen"; Fußzeile „Stand: 170805jul26 · 1 / 1".
Eine Blanko-Vorlage liegt zum Download.

Keine Abhängigkeit von Infrastruktur: kein Server, kein Konto, kein Netz
nach dem ersten Aufruf (Offline-Audit). Kein Echtzeitzwang: Bögen können
vorbereitet, später gescannt, aus Fotos im Stapel eingelesen oder per
Handscanner übernommen werden.

Übung als Wasserzeichen „ÜBUNG" auf jeder Seite — auch auf Papier
unverwechselbar.

Die Sammel-PDF trägt die ganze Sammlung als Datei in sich; Import auf dem
nächsten Gerät bringt Status und Historie mit. Das ist besser als jeder
Ordner — sobald der Ausdruck dasselbe sagt (A1).

## Abschluss

- Aufgabe geschafft: Einheit: ja; Meldekopf: mit Umwegen (Meldeblock
  parallel).
- Fremde Hilfe nötig: nein.
- Größtes Missverständnis: „Sammel-PDF (alle Bögen)" zeigt auf Papier
  nicht alle Bögen — die abgerückten stehen nur in der Datei.
- Größtes Einsatzrisiko: Nach einer Papierphase tragen alle nachgetragenen
  Einheiten die Uhrzeit des Abtippens; Papier und Gerät widersprechen sich,
  und niemand sieht, welcher Stand gilt.
- Top-Priorität für die nächste Iteration: Eintreff- und Abrückzeit als
  Felder (vorbelegt, korrigierbar) und beide auf dem Übergabeblatt, samt
  abgerückten Einheiten (A1, A2).
