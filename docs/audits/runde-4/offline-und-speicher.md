# Audit Runde 4 – Offline und Speicher

Stand: 05.10.2026 · Code-Stand: Commit `3dd2ab5`

*Unvollständig: Die Prüfung wurde nach den ersten beiden Befunden abgebrochen. Urteil, Bestätigtes und der Abgleich mit Runde 3 fehlen; weitere Befunde sind nicht ausgeschlossen.*

## Prüfaufbau

- Produktionsbuild (`dist/`) über einen eigenen `vite preview` auf Port 4175, davor ein eigener drosselnder
  Reverse-Proxy (Port 4176). Der Proxy drosselt die **gesamte** Leitung, also auch die Abrufe des Service Workers
  (CDP-Drosselung erfasst nur die Seite: ein Erstladen mit „Fast 3G" per CDP war in 20 s fertig, obwohl 6,7 MB
  Kern über diese Leitung gut eine Minute brauchen). Der Proxy kennt drei Lagen: *normal* (gedrosselt, 1,6 Mbit/s,
  300 ms Latenz), *Funkloch* (Verbindung wird angenommen, aber nie beantwortet — wie ein Netz mit Balken, aber ohne
  Daten) und *weg* (Verbindung wird sofort abgewiesen).
- Echtes Offline ohne `setOffline`: eigener Server gestoppt bzw. Proxy auf *Funkloch*/*weg*. `setOffline` nur
  zusätzlich, um die `online`/`offline`-Ereignisse der Seite auszulösen.
- Playwright aus `node_modules`, Chromium `/opt/pw-browsers/chromium`, `isMobile`/`hasTouch`, Locale de-DE,
  360 × 640, je Prüfung ein frischer Browser-Kontext.
- Zustände per `localStorage`-Seeds (`eeb.entwurf.v1`, `eeb.einsaetze.v1`, `eeb.vorlagen.v1`) aus `examples/thw/`,
  jeweils `uebung: false`.
- Skripte und Screenshots: Scratchpad `runde4/offline/` (nicht im Repo).

## Urteil

Nicht abgegeben (Prüfung abgebrochen).

## Befunde

### P1

#### R4-O1 – Bricht das Erstladen im Funkloch ab, bleibt die Zeile bei „⏳ wird geladen … bitte mit Netz geöffnet lassen" stehen — auch wenn das Netz wiederkommt, lädt nichts mehr (gemessen)

- **Fundstelle:** Startseite, Offline-Zeile; `src/app/offline-bereit.ts` (`beiOnline` → `getRegistration().then(r => r?.update())`).
- **Beobachtung:** Erstaufruf über 1,6 Mbit/s. Bei „1,6 von 6,7 MB" wird die Leitung abgewiesen (Proxy *weg*, mit und
  ohne `setOffline`). Der Service Worker scheitert an der Installation, Chromium verwirft die Registrierung
  (`getRegistrations()` → 0). Mit `setOffline` wechselt die Zeile richtig auf „⚠ Noch nicht offline bereit (1,6 von
  6,7 MB geladen) — ohne Netz diese Seite nicht neu laden; beim nächsten Netz wird der Rest geladen". Kommt das Netz
  zurück, steht wieder „⏳ Wird für den Offline-Betrieb geladen: 1,6 von 6,7 MB — bitte mit Netz geöffnet lassen" —
  und dabei bleibt es (120 s bzw. 240 s beobachtet, 0 weitere Bytes, keine Registrierung). Der Nachlade-Anstoß beim
  `online`-Ereignis ruft `update()` auf einer Registrierung, die es nicht mehr gibt. Ohne `setOffline` (Telefon
  glaubt sich online) steht die ⏳-Zeile durchgehend da, auch während der Leitung nichts kommt.
  Gegenprobe Funkloch (Verbindungen hängen, 60 s): Hier lebt die Installation weiter und läuft nach Netzrückkehr bis
  „✓ Jetzt offline bereit" durch.
- **Folge:** Der Helfer tut genau, was die Zeile sagt — Seite offen lassen, warten. Es passiert aber nichts mehr. Er
  fährt los, lädt im Funkloch neu und hat die Fehlerseite des Browsers. Die Zusage „beim nächsten Netz wird der Rest
  geladen" stimmt in diesem Fall nicht. Daten gehen nicht verloren (der Entwurf liegt im `localStorage`), aber die App
  ist ohne Netz nicht mehr zu öffnen.
- **Empfehlung:** Fehlt die Registrierung beim Netzwechsel oder bewegt sich der Zähler eine Weile nicht, die
  Installation neu anstoßen (neu registrieren) — oder ehrlich sagen: „Laden abgebrochen — mit Netz einmal neu laden".
  Ein stehender Zähler sollte nicht dauerhaft „wird geladen" heißen.
- **Nachprüfung:** Erstaufruf gedrosselt, bei ~25 % Verbindung abweisen, nach 10 s wieder zulassen: Die Zeile erreicht
  ohne Neuladen „✓ offline bereit", oder sie fordert ausdrücklich zum Neuladen auf.

### P2

#### R4-O2 – „PDF erzeugen" ohne geladenen Baustein: Die Fehlermeldung landet unterhalb des sichtbaren Dialogs, der Knopf scheint nichts zu tun (gemessen)

- **Fundstelle:** Dialog „Bogen übergeben" → „PDF erzeugen"; Fehlertext aus `src/app/nachladen.ts` (`fehlerText`), Ausgabe im Übergabe-Dialog (`src/app/app.tsx`).
- **Beobachtung:** Erstaufruf über 1,6 Mbit/s, Netz bei „0,4 von 6,7 MB" weg (Proxy *weg* + `setOffline`). Gespeicherter
  Entwurf → „Fortsetzen" → Übersicht → „Bogen übergeben…" → „PDF erzeugen". Kein Download. Der Text „PDF: Der Baustein
  dafür ließ sich nicht nachladen. Dafür braucht die App einmal Netz …" steht zweimal im DOM: einmal auf der Seite
  *hinter* dem modalen Dialog, einmal im Dialog bei y = 628 px — unterhalb von „Weitere Formate", der sichtbare
  Dialog endet bei rund 620 px (Telefon 360 × 640). Im Screenshot nach dem Tippen ist nichts davon zu sehen. Zum
  Vergleich: Die Erfolgsmeldung „✓ PDF gespeichert …" erscheint direkt unter dem Knopf.
  Der QR-Code im Vollbild geht in derselben Lage (Kern-Code ist im Start-Bundle) — der eigentliche Ausweg ist also da.
- **Folge:** Der Helfer tippt zwei-, dreimal auf „PDF erzeugen", glaubt an einen Hänger und verliert Zeit, statt
  auf den QR-Code auszuweichen. Gerade in der Lage „Netz weg vor dem Vorrat" ist die Meldung der einzige Hinweis.
- **Empfehlung:** Fehlermeldung an derselben Stelle wie die Erfolgsmeldung (direkt unter dem Knopf) und mit dem
  Ausweg: „Ohne Netz geht jetzt nur der QR-Code."
- **Nachprüfung:** Dieselbe Lage; nach dem Tippen ist die Meldung ohne Scrollen im Bild und nennt den QR-Code.

## Bestätigtes

Nicht erhoben (Prüfung abgebrochen).

## Abgleich mit Runde 3

Nicht erhoben (Prüfung abgebrochen).

## Stand der Behebung

**Der Bericht bleibt unvollständig:** Die Prüfung wurde nach den beiden
Befunden abgebrochen; Urteil, Bestätigtes und der Abgleich mit Runde 3 fehlen
weiterhin, weitere Befunde sind nicht ausgeschlossen. Die Behebung betrifft
nur R4-O1 und R4-O2.

Stand 06.10.2026, Paket 4 „Uhr, Speicher, Löschen, Offline, Zeiten".
Geprüft mit Typprüfung, Unit-Tests (2 614 grün), Verhaltenstests (137 Szenarien, 1 749 Schritte
grün) und Nachmessung im Browser (360 × 640, `isMobile`/`hasTouch`, de-DE;
Dev-Server Port 5180, für den Service Worker Produktionsbuild mit
`vite preview` Port 4174 hinter einem drosselnden Reverse-Proxy). Aufgeführt
sind nur die Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-O1 Erstladen bricht ab, Zeile bleibt bei „wird geladen" | behoben | Verwirft der Browser die Service-Worker-Registrierung, registriert die Seite neu: beim `online`-Ereignis sofort und bei 20 s stehendem Zähler (nur mit Netz und bekanntem Umfang; `installationAnstossen` in `src/app/offline-bereit.ts`). Der Vorrat im Gerät bleibt, es wird nur der Rest geholt. Fehlt die Registrierung, steht „⚠ Laden abgebrochen bei 1,6 von 6,8 MB — mit Netz einmal neu laden, dann geht es weiter. Bis dahin diese Seite ohne Netz nicht neu laden." mit Knopf „Jetzt neu laden". Nachlauf mit dem Reverse-Proxy des Prüfers (1,6 Mbit/s, Verbindung bei 1,6 von 6,8 MB abgewiesen): (a) ohne `setOffline` — Registrierung nach 1 s verworfen, nach rund 25 s „Laden abgebrochen", nach Netzrückkehr (Registrierung neu, Zähler läuft) ohne Neuladen „✓ Jetzt offline bereit" nach 17 s; (b) mit `setOffline` und `online`-Ereignis — nach Netzrückkehr nach 15 s „✓ Jetzt offline bereit". |
| R4-O2 „PDF erzeugen" ohne geladenen Baustein: Meldung außer Sicht | behoben | Die Meldung steht im selben Block wie der Knopf (nicht mehr am Dialogende hinter „Weitere Formate"), rollt ins Bild und nennt den Ausweg: „PDF nicht möglich: Der PDF-Baustein ist noch nicht geladen. Ohne Netz geht jetzt nur der QR-Code — mit Netz die Seite einmal neu laden." Nachlauf (Baustein im Dev-Server abgewiesen): Meldung bei y 527–623 px, der Dialog endet bei 624 px; sie steht nur einmal im Baum. |
