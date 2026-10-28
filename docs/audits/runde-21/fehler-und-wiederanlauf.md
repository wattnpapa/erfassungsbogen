# Audit „Fehler und Wiederanlauf“, Runde 21 (Bedienfehler provozieren, selbst korrigieren)

- **Prüfer:** Rollenaudit `thw-error-recovery-reviewer`
- **Datum:** 2026-10-29
- **Zählung:** P0: 1 · P1: 0 · P2: 0 · P3: 6 (3 neu, 3 alt mit Verweis) · Hinweise (ohne Priorität): 7
- **Gegenstand:** Web-App im Produktionsbuild auf `http://localhost:4173` (`vite preview`), Code-Stand Commit `f007590` (`main`). Reiner Prüfbericht, keine Codeänderung.
- **Maßstab:** Keine „bekannten Grenzen“ zum Auslassen; auch Punkte, die in Runde 20 als „offen“ oder „nicht ganz erreicht“ stehen, sind gemeldet, wenn sie im Browser noch zu sehen sind. Je Sachverhalt ein Befund mit Typ (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast); P3 nur bei echter Beeinträchtigung der Aufgabe, Geschmacksfragen als Hinweis. Vorab gelesen: `docs/audits/README.md` und „Stand der Behebung“ in `runde-20/README.md`.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), `isMobile`, `hasTouch`, Locale de-DE, Dichte 2. Viewports 390 x 844 (Hauptlauf), 360 x 640, 320 x 568 sowie quer 568 x 320, 640 x 360, 844 x 390, jeweils Ansicht „Standard“ und „Feld“. Frischer Browserkontext je Lauf. Voller Speicher: `localStorage` bis zum Quota-Fehler gefüllt. Netz: `context.setOffline(true)` nach vollständigem ersten Laden (Service Worker aktiv, 110 Einträge im Precache und 550 im Zusatz-Cache, 18 bis 25 s Wartezeit); Nachladeverhalten mit gedrosseltem Netz (rund 400 kbit/s, 300 ms Latenz, kalter Start ohne Service Worker) und mit 6-fach gedrosselter CPU bei warmem Service Worker (Layout-Sprünge über `layout-shift`).

Durchlaufen: Startseite; „Neue Einsatz-Sammlung…“; Schnellerfassung (Ort mit und ohne Vorschlag, „THW Oldenburg“, Doppelt-Tipp, Stärke 9999, Neuladen mitten im Schritt, ähnlicher Name); Vollassistent (Weiter ohne Ort, „Neustadt“ mit Mehrdeutigkeit, Übersicht mit Personal- und Fahrzeugtabelle); Einheitenkarte mit „Abrücken“, „Mehr…“, „Stärke ändern…“, „Ort der Einheit ändern…“, „Verschieben…“, „Als Übung kennzeichnen…“, „Entfernen“; Tabelle; „Bögen einlesen…“ (gültig, doppelt, defekt, Textdatei); Scanner ohne Kamera; „Bogen schließen“, „Neuen Bogen erstellen“ (Ersetzen) und „Zuletzt geschlossenen Bogen zurückholen“ bei vollem Speicher; „Einsatz löschen…“ und „Endgültig löschen…“ im Notweg; Browser-Zurück; alle Dialoge der Startseite und der Einsatzansicht bei 320 px.

Nicht geprüft: echte Kamera, echte Bildschirmtastatur, native Builds, Nahbereich, Inhalt der erzeugten PDF.

## Urteil aus Sicht der Rolle

Die Fehlerabsicherung im Alltag trägt: Plausibilitätsrückfragen („Stimmt die Stärke?“ bei 9999), Namensähnlichkeit („Ist das dieselbe Einheit?“), Doppel-Tipps (ein Bogen, ein Abrücken), Entwurf nach Neuladen, Zurück-Taste, Rückgängig-Quittungen und der Umgang mit defekten Dateien funktionieren. Auch bei vollem Gerätespeicher gehen Bögen nicht verloren. Dagegen ist im **Offline-Betrieb nach einem Neuladen keine Einsatz-Sammlung mehr zu öffnen oder anzulegen** (R21-E1); das ist der einzige Befund, der die Aufgabe des Meldekopfs ohne Netz verhindert. Sonst bleiben sechs kleine P3.

### Behebungen der Runde 20, im echten Browser geprüft und gehalten (nicht als Befund)

- **Voller Speicher:** „Bogen schließen“ (Rückfrage, Stand wandert nach `eeb.entwurf.ersetzt.v1`, bleibt nach Neuladen als „Zuletzt geschlossenen Bogen zurückholen“ da), „Neuen Bogen erstellen“ (Ersetzen, alter Stand bleibt zurückholbar) und „Zurückholen“ (Bogen wieder offen, `eeb.entwurf.v1` neu) verlieren nichts.
- **Notweg:** „Einsatz löschen?“ → „Nicht gelöscht“ → „Endgültig löschen…“ → zweite Rückfrage (Knopf anfangs „Einen Moment …“) → „Endgültig gelöscht“; der Einsatz ist danach wirklich weg und der Speicher frei.
- **Kein „THW THW Oldenburg“:** Schnellerfassung und „Ort der Einheit ändern…“ ergeben „THW Oldenburg“ bzw. „THW Bremen“, ähnliche Namen lösen „Ist das dieselbe Einheit?“ bzw. „ähnelt … zählt getrennt“ aus.
- **Scanner ohne Kamera quer** (568 x 320 bis 844 x 390, Standard und Feld): kein innerer Bildlauf, „Fertig“ und „QR aus Bild einlesen…“ sichtbar.
- **Dialoge bei 320 px:** alle passen in 568 px Höhe, kein Querüberlauf (Ausnahme R21-E7).
- **Tabelle am Telefon:** Einsatztabelle und Übersichtstabellen ohne Querlauf bei 390, 360, 320; Personaltabelle zeigt keine abgeschnittene Spalte mehr.
- **Zeichensammlung:** taktische Zeichen erscheinen in Übersicht und Fahrzeugschritt ohne Sprung (Layout-Shift 0,01 bei gedrosseltem Netz) und auch offline nach Neuladen.

## Befunde

### R21-E1 (P0, Bedienung) Offline nach Neuladen: Einsatz-Sammlung lässt sich nicht mehr öffnen oder anlegen, „Hier ist etwas schiefgelaufen“

- **Neu oder alt (Verweis):** neu (Folge der in Runde 20 nachgeladenen Einsatzansicht, `einsaetze-lazy.tsx` / Chunk `einsaetze-ui`; die Runde-20-Notiz „Ohne Netz-Szenarien laufen weiter“ gilt nur ohne Neuladen).
- **Ort:** Startseite → „Öffnen“ bei einer Einsatz-Sammlung oder „Neue Einsatz-Sammlung…“ → „Einsatz anlegen“; ebenso der automatische Wiedereinstieg in den zuletzt offenen Einsatz beim Start.
- **Beobachtung:** Ablauf: App einmal online laden, 18 bis 25 s warten (Service Worker und Caches vollständig), Netz trennen. Ohne Neuladen funktionieren Einsatzansicht, Karten, Scanner. **Nach einem Neuladen im Offline-Zustand** (Seite neu laden, App neu starten) zeigt „Öffnen“ bzw. „Einsatz anlegen“ nur noch die Fehlerseite „Hier ist etwas schiefgelaufen — Die Ansicht ließ sich nicht aufbauen“. Ebenso beim Start, wenn ein Einsatz offen war (die Seite lädt dann direkt in die Fehlerseite, auch beim zweiten Neuladen). „Zur Startseite“ hilft nicht, jeder neue Versuch scheitert gleich. Technische Angabe: „Unable to preload CSS for http://localhost:4173/assets/index-Bp0pLAQP.css“; die einzige fehlgeschlagene Anfrage ist genau diese Datei. Ursache laut Build: Das Hauptstylesheet wird beim Build in die `index.html` eingebettet und die Datei gelöscht (`fontCssInline` in `vite.config.ts`), die Abhängigkeitsliste des Chunks `einsaetze-ui-Ca8VFLhR.js` verweist aber weiter auf `./index-Bp0pLAQP.css`; die Datei steht auch nicht im Precache. Online fällt das nicht auf (der Server liefert für die Adresse die Startseite), offline schlägt der Ladevorgang fehl. Wieder online und „Neu laden“ funktioniert sofort. Das Einzelbogen-Verfahren (Neuen Bogen erstellen, Übersicht mit Zeichen, Scanner, Entwurf) funktioniert offline nach Neuladen weiter; betroffen ist allein die Einsatz-Sammlung.
- **Folge:** Ein Meldekopf im Funkloch, dessen Browser oder Gerät neu startet (Akkuwechsel, App im Hintergrund beendet, Seite neu geladen), kann keinen Einsatz mehr ansehen und keine Einheit aufnehmen; die Sammlung ist bis zur Rückkehr des Netzes nicht benutzbar. Das ist genau der Fall, für den die App „funktioniert komplett offline“ verspricht. Die Daten bleiben erhalten (nichts gelöscht), aber die Fehlerseite rät zum „Löschen…“ des Einsatzes auf der Startseite und zu „Alle Daten löschen“ und nennt das fehlende Netz nicht; wer dem Rat folgt, vernichtet im ungünstigen Fall den einzigen Stand.
- **Empfehlung:** Die Einsatzansicht muss nach Neuladen ohne Netz laden (kein Verweis auf nicht vorhandene Dateien; der Ablauf „Netz trennen nach erstem Laden, Neuladen, Einsatz öffnen“ gehört in die Nachprüfung). Die Fehlerseite sollte bei fehlendem Netz sagen „Kein Netz — die Ansicht konnte nicht geladen werden“ und nicht zum Löschen raten.
- **Nachprüfung:** Online laden, 20 s warten, Netz trennen, Seite neu laden, Einsatz öffnen, Einheit schnell erfassen, Tabelle, „Bogen scannen…“; danach ein zweites Mal neu laden. Die Konsole darf keine fehlgeschlagene Anfrage zeigen.

### R21-E2 (P3, Layout/Abstand) Nachladen der Einsatzansicht: leere Fläche, Startseite blitzt auf, Fußzeile springt

- **Neu oder alt (Verweis):** neu (Folge der Verkleinerung des Startbündels in Runde 20).
- **Ort:** Neuladen oder Kaltstart, wenn ein Einsatz zuletzt offen war (Wiedereinstieg); Neuladen innerhalb der Einsatzansicht.
- **Beobachtung:** Bei warmem Service Worker und 6-fach gedrosselter CPU (ein altes Telefon) lädt die Seite in rund 1,1 s: erst 0,3 s die statische Startseite („Digitaler Einheiten-Erfassungsbogen“ mit Knöpfen), dann rund 0,4 s eine leere graue Fläche mit nur der Fußzeile (Platzhalter mit `aria-busy`, ohne Text oder Anzeige), dann die Einsatzansicht; dabei ein Layout-Sprung von 0,30. Bei kaltem Start und 400 kbit/s (nur erste Nutzung oder nach gelöschtem Cache) dauert die leere Fläche rund 1,7 s (8,7 bis 10,4 s), ebenfalls mit Sprung 0,30. Die taktischen Zeichen selbst springen nicht (Platzhalter gleicher Größe).
- **Folge:** Wer in der Phase tippt, trifft kurz sichtbare Startseitenknöpfe („Neuen Bogen erstellen“, „QR-Code scannen…“) oder eine leere Fläche; beim Einsteigen entsteht der Eindruck, die App sei abgestürzt. Datenverlust entsteht nicht.
- **Empfehlung:** Statt leerer Fläche einen kurzen Hinweis „Einsatz wird geladen…“ in Höhe der späteren Ansicht zeigen und die Startseite beim Wiedereinstieg nicht vorher aufblitzen lassen.
- **Nachprüfung:** Neuladen bei 6-facher CPU-Drosselung; kein Layout-Sprung über 0,1, keine Startseite vor der Einsatzansicht, Platzhalter mit Text.

### R21-E3 (P3, Bedienung) „Ort der Einheit ändern…“ prüft den Ort nicht und bietet keine Vorschläge

- **Neu oder alt (Verweis):** neu (zu der in Runde 20 eingeführten Funktion; die Schnellerfassung prüft denselben Ort).
- **Ort:** Einsatzansicht → Karte aufklappen → „Mehr…“ → „Ort der Einheit ändern…“.
- **Beobachtung:** Das Feld ist ein einfaches Textfeld ohne Vorschlagsliste. „Oldenbrg“ wird ohne jeden Hinweis übernommen (Karte „Nr. 1 THW Oldenbrg“, Quittung „abgelegt“). In der Schnellerfassung zeigt dieselbe Eingabe „Kein Ort mit diesem Namen in der Liste — Schreibweise prüfen“ und bietet Vorschläge mit Kennung („Oldenburg (NI)“, „Oldenburg in Holstein“). Das Feld wird zudem mit „Oldenburg (NI)“ vorbelegt; wer es ändert, verliert die Unterscheidung zu „Oldenburg in Holstein“ ohne Frage.
- **Folge:** Ein Tippfehler im Ortsnamen steht danach in Liste, Lageblatt und CSV und fällt erst dort auf; die Änderung ist zwar rückgängig zu machen, aber die Prüfung, die beim ersten Erfassen schützt, fehlt genau bei der Korrektur.
- **Empfehlung:** Dieselbe Ortsprüfung und dieselben Vorschläge wie in der Schnellerfassung, auch bei „Ort übernehmen“.
- **Nachprüfung:** „Oldenbrg“ eingeben: Hinweis „Kein Ort mit diesem Namen in der Liste“ und Vorschlagsliste wie in Schritt 1.

### R21-E4 (P3, Text) Schnellerfassung: „Schritt 2 von 4“ widerspricht der Überschrift „3. Personal“ und der Leiste 1 bis 6

- **Neu oder alt (Verweis):** alt, R20-A2 / W3 / H3 / K4 / N3 („Schritt 1 von 6 … 2, 5 entfallen“), Rest.
- **Ort:** „Einheit schnell erfassen (nur Stärke)…“, jeder Schritt.
- **Beobachtung:** Kopf „Schritt 2 von 4: Personal“, darunter die Überschrift „3. Personal“; bei „Schritt 3 von 4“ steht „4. Fahrzeuge“. Im Querformat (568 x 320 bis 844 x 390) zeigt die Schrittleiste weiter „1. Einheit · 2 – · 3 · 4 · 5 – · 6“, also sechs Schritte mit zwei durchgestrichenen. Hochformat zeigt keine Leiste.
- **Folge:** Der Helfer sieht drei verschiedene Zählungen für denselben Ablauf und kann nicht abschätzen, wie viele Schritte noch kommen.
- **Empfehlung:** Eine Zählung für Kopf, Überschrift und Leiste (die entfallenen Schritte nicht anzeigen).
- **Nachprüfung:** Schnellerfassung hoch und quer: „Schritt n von 4“, Überschrift „n.“, Leiste mit vier Einträgen.

### R21-E5 (P3, Layout/Abstand) Einsatzansicht: die Einheitenliste liegt mehr als einen Bildschirm tief

- **Neu oder alt (Verweis):** alt, R20-W6 / H5 / G6 („nicht ganz erreicht“).
- **Ort:** Einsatz-Sammlung mit Einheiten, Hochformat.
- **Beobachtung:** Die erste Einheitenkarte beginnt nach Neuladen bei y = 1033 (390 x 844) bzw. 1028 (360 x 640); direkt nach einer Aufnahme bei 1164 bzw. 1159, weil die Box „Zuletzt abgelegt“ und die Quittung davorstehen. Davor liegen Kennzahlen, vier Aufnahmeknöpfe, der Block „Neu seit der letzten Kenntnisnahme“ und zwei Sprunglinks. Am 360 x 640 Telefon ist die Liste erst nach etwa 1,6 Bildschirmen erreichbar.
- **Folge:** Nach dem Öffnen eines Einsatzes sieht der Helfer die Einheiten nicht; er muss erst scrollen, um zu prüfen, ob seine Eingabe angekommen ist.
- **Empfehlung:** Liste vor die vier Aufnahmeknöpfe oder die Knöpfe kompakter; Ziel erste Karte unter 700 px.
- **Nachprüfung:** Einsatz mit drei Einheiten öffnen, y der ersten Karte bei 390 x 844 und 360 x 640 messen.

### R21-E6 (P3, Layout/Abstand) Assistent quer in „Feld“: „Ort der Einheit“ liegt beim Öffnen zum großen Teil unter der Fußleiste

- **Neu oder alt (Verweis):** alt, R20-N2 („nicht ganz erreicht“).
- **Ort:** „Neuen Bogen erstellen“, Schritt 1, Ansicht „Feld“, 568 x 320.
- **Beobachtung:** Das Feld liegt bei 238 bis 291 px, die Fußleiste beginnt bei 255 px; 36 von 53 px des Pflichtfelds sind verdeckt. Bei 640 x 360 (Feld 238–291, Leiste 295) und 844 x 390 sowie in „Standard“ ist es frei; nach einem Tipp in das Feld rollt es frei (geprüft).
- **Folge:** Das erste Pflichtfeld wirkt halb abgeschnitten; ein Tipp auf den sichtbaren Rest funktioniert, der Eindruck ist aber der einer defekten Seite.
- **Empfehlung:** Beim Öffnen des Schritts im Querformat so rollen, dass das erste Pflichtfeld über der Leiste liegt.
- **Nachprüfung:** 568 x 320, „Feld“: Unterkante des Felds über der Oberkante der Fußleiste.

### R21-E7 (P3, Text) „Als Übung kennzeichnen“ bricht bei 320 px mitten im Wort („kennzeichne-n“)

- **Neu oder alt (Verweis):** alt, Rest zu R20-H9 / M5 („Dialoge bei 320 px“); die Dialoge passen, dieser Knopf nicht.
- **Ort:** Einsatzansicht → Karte → „Mehr…“ → „Als Übung kennzeichnen…“, 320 x 568.
- **Beobachtung:** Der Bestätigungsknopf (119 px breit, 77 px hoch) bricht „kennzeichnen“ als „kennzeichne“ / „n“. Bei 360 und 390 px (139 bzw. 154 px breit) bleibt das Wort ganz.
- **Folge:** Die Beschriftung einer folgenreichen Handlung (die Einheit zählt danach nicht mehr mit) ist am kleinsten Telefon schwer zu lesen; Verwechslung ist unwahrscheinlich, Lesbarkeit leidet.
- **Empfehlung:** Knöpfe untereinander setzen oder kürzere Beschriftung („Als Übung“).
- **Nachprüfung:** 320 x 568: Beschriftung ohne Wortbruch.

## Hinweise (ohne Priorität)

- **H1 (Bedienung):** „Weiter“ im Vollassistenten geht ohne Ort in Schritt 2; die Schrittleiste markiert Schritt 1 dann nicht als „fehlt“, erst die Übersicht fängt es ab. Alt, R20-H2 / R19-E3 (Rest).
- **H2 (Text):** Dasselbe Ereignis (Einheit abgelegt) erscheint dreifach: Quittungsleiste, Box „Zuletzt abgelegt: Nr. 3 …“ über der Liste und Statuszeile „Abgelegt: …“. Die Box schiebt die Liste weiter nach unten (siehe R21-E5). Neu.
- **H3 (Layout):** Personaltabelle in der Übersicht bei 360 px: die Kopfzelle „Funktion / Zusatzfunkti-on“ bricht mitten im Wort. Neu.
- **H4 (Text):** Fahrzeugkarte in der Übersicht zeigt leeres Kennzeichen und leeren Funkrufnamen als leere Zeile, „Ausstattung (StAN)“ aber als „—“. Neu.
- **H5 (Text):** Bei vollem Speicher zeigt die Startseite für einen frisch geöffneten, noch leeren Bogen „Beim Schließen gehen die Änderungen verloren — jetzt Fortsetzen und Bogen übergeben“, obwohl es nichts zu übergeben gibt. Neu.
- **H6 (Layout):** Der lange Einheitstyp („FGr W (A) – Fachgruppe Wassergefahren (A)“) wird im Feld abgeschnitten, der Kartenname enthält die Langform („THW Bremen Mitte Fachgruppe Wasserschaden/Pumpen (A)“) und wird in der Quittung gekürzt („…Fach…“). Neu.
- **H7 (Text):** Die Notweg-Rückfrage „Nicht gelöscht“ auf der Startseite verweist auf „Einsatz weitergeben / sichern“ und „Entfernen bei einer Einheit“, die nur in der geöffneten Einsatzansicht stehen; auf der Startseite gibt es dazu keinen Knopf im selben Dialog. Neu.

## Aufgabe geschafft: mit Umwegen (online ja; offline nach Neuladen nein, nur Einzelbogen)
## Fremde Hilfe nötig: ja, offline nach Neuladen (nur mit Netz oder Entwickler lösbar)
## Größtes Missverständnis: Die Fehlerseite „Hier ist etwas schiefgelaufen“ lässt einen fehlenden Netzzugang wie einen Datenfehler aussehen und rät zum Löschen.
## Größtes Einsatzrisiko: Nach einem Neustart ohne Netz ist die Einsatz-Sammlung nicht mehr zu öffnen (R21-E1).
## Top-Priorität für die nächste Iteration: R21-E1, danach R21-E3 (Ort-Prüfung bei der Korrektur).
