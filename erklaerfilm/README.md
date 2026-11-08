# Erklärfilm „Ankommen am Meldekopf“

Ein Erklärfilm von rund fünf Minuten in zwei Teilen (die genaue Länge ergibt sich aus den Sprachaufnahmen):

1. **Comic** — eine THW-Bergungsgruppe kommt nachts im Regen am Meldekopf an.
   Mit Papierbogen: Ausfüllen auf dem Knie, verschmierte Schrift, Abtippen,
   Stärke mit dem Taschenrechner, Schlange, Rückfrage der Einsatzleitung.
   Dann „zurückspulen“ — dieselbe Szene mit dem digitalen Bogen: QR-Code
   zeigen, scannen, fertig.
2. **App-Rundgang** — jede der sechs Seiten des Assistenten in der echten App,
   mit Zoom auf das jeweilige Feld, Mauszeiger und Untertitel; danach PDF,
   QR-Übergabe und die Einsatz-Sammlung am Meldekopf.

Das vollständige Drehbuch mit allen Sprechertexten: [DREHBUCH.md](DREHBUCH.md)
(erzeugt aus [drehbuch.json](drehbuch.json)).

## Ablauf

```bash
npm run erklaerfilm:aufnahme      # 1. App-Aufnahmen (startet selbst einen Vite-Server)
npm run erklaerfilm:stimmen       # 2. Stimmen per ElevenLabs (siehe unten)
npm run dev                       # 3. Vorschau: http://localhost:5173/erklaerfilm/film.html
npm run erklaerfilm:rendern       # 4. MP4 + SRT nach erklaerfilm/ausgabe/
```

Die Vorschau funktioniert schon ohne Stimmen: Dann schätzt der Film die Länge
jeder Zeile aus dem Text und zeigt das unten an. Leertaste spielt ab, der
Regler springt. Sobald `audio/dauer.json` existiert, richtet sich der
Zeitplan nach den echten Aufnahmen.

### 1. App-Aufnahmen (`aufnahme.mjs`)

Playwright füllt in der App einen Bogen für die „THW Ulm Bergungsgruppe“ aus:
Ort aus dem OV-Verzeichnis, Einheitstyp mit StAN-Vorbelegung, Namensliste
einfügen, Fahrzeuge, Sofortbedarf, offenen Punkt beheben, PDF, QR-Vollbild.
Nach jeder Eingabe entsteht ein Bild samt Position des Zielfelds
(`aufnahmen/index.json`). Die Meldekopf-Ansicht entsteht auf einem zweiten,
frischen Browser-Profil mit vier Beispielbögen aus `examples/thw/` plus dem
eben ausgefüllten Bogen.

Nach Änderungen an der Oberfläche einfach neu aufnehmen. Bricht die Aufnahme
ab, hat sich meist eine Beschriftung geändert — die Locators stehen in
`aufnahme.mjs`, die Verknüpfung zum Drehbuch läuft über die `notiz` jedes
Bildes (`"bilder": [...]` in `drehbuch.json`).

### 2. Stimmen (`stimmen.mjs`, ElevenLabs)

1. In [stimmen.json](stimmen.json) für jede Rolle eine `voice_id` eintragen
   (ElevenLabs → Voices → Stimme → „ID kopieren“). Die Hinweise dort
   beschreiben, welche Art Stimme gedacht ist.
2. API-Schlüssel setzen und erzeugen:

   ```bash
   ELEVENLABS_API_KEY=sk_… npm run erklaerfilm:stimmen
   ```

   Weitere Aufrufe erzeugen nur Zeilen neu, deren Text, Stimme oder
   Einstellung sich geändert hat (Fingerabdruck in
   `audio/stimmen-stand.json`). Einzelne Zeilen gezielt neu:
   `npm run erklaerfilm:stimmen -- --nur a5-1 b2-3`.
3. Geräusche (Regen, Motoren, Funkrauschen …) über die Sound-Effects-API:
   `npm run erklaerfilm:stimmen -- --geraeusche`.
4. Musik je Abschnitt (angespannt im Papier-Teil, gelöst im digitalen Teil,
   ruhig im App-Rundgang, warm zum Schluss) über die Music-API:
   `npm run erklaerfilm:stimmen -- --musik` — erst nach den Stimmen, weil sich
   die Länge der Stücke aus den Sprachaufnahmen ergibt. Die Beschreibungen
   stehen unter `musik` in `drehbuch.json`. Wer eigene Musik nimmt, legt sie
   als `audio/musik.mp3` ab.

Die Rohaufnahmen landen in `audio/roh/`. Daraus entsteht `audio/<id>.mp3`
ohne lange Pausen (höchstens 0,35 s) und auf −18 LUFS angeglichen.

In einer Claude-Code-Cloud-Sitzung setzt der Proxy den Schlüssel ein; Node
muss dafür über den Proxy gehen:
`NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt ELEVENLABS_API_KEY=proxy-injected npm run erklaerfilm:stimmen`.

Aussprache: ElevenLabs bekommt `sprechtext`, der Untertitel zeigt `text`. So
spricht der Erzähler „T-H-W“, „Stan“, „G-K-W“ und Funkrufnamen als
„zwo-zwo, fünf-eins“, während im Bild „THW“, „StAN“, „GKW“ und „22/51“ steht.
Klingt eine Zeile falsch, dort nachbessern und mit `--nur` neu erzeugen.

Ohne Netz zu ElevenLabs lassen sich die MP3s auch im Browser-Studio von
ElevenLabs erzeugen: als `audio/<zeilen-id>.mp3` ablegen (IDs stehen in
DREHBUCH.md) und `npm run erklaerfilm:stimmen -- --dauer` misst die Längen.

### 3. Rendern (`rendern.mjs`)

Setzt `film.html` Bild für Bild (25 fps, 1920×1080), schickt die Bilder an
ffmpeg und mischt den Ton: Sprachzeilen an ihre Startzeit, Funkzeilen mit
Bandpass, Geräusche und Musik leise darunter. Dazu eine `.srt` mit allen
Zeilen für Plattformen mit Untertitel-Upload.

```bash
npm run erklaerfilm:rendern -- --standbilder         # ein Bild je Zeile zum Durchsehen
npm run erklaerfilm:rendern -- --von 140 --bis 170   # nur ein Ausschnitt
npm run erklaerfilm:rendern -- --ohne-untertitel     # App-Teil ohne eingeblendete Untertitel
npm run erklaerfilm:rendern -- --nur-ton             # Bild behalten, nur Ton neu mischen
```

Braucht `ffmpeg`/`ffprobe` im PATH und `pdftoppm` (poppler) für die
Papierseiten in der Aufnahme. Der ganze Film rendert in rund zehn Minuten.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `drehbuch.json` | Szenen, Sprechertexte, Aussprache, Blasenpositionen, Bildzuordnung, Geräusche |
| `stimmen.json` | Voice-IDs und Stimmeinstellungen je Rolle |
| `comic.js` | Comic-Zeichnungen als SVG: Figuren, Fahrzeuge, Zelt, Wetter, Blasen, Panels |
| `film.js`, `film.html` | Zeitplan, App-Szenen (Zoom, Zeiger, Markierung), Wischblenden, Vorschau |
| `aufnahme.mjs` | App-Aufnahmen per Playwright |
| `stimmen.mjs` | ElevenLabs: Sprache, Geräusche, Dauer messen |
| `rendern.mjs` | MP4 und SRT |
| `drehbuch-md.mjs` | erzeugt DREHBUCH.md |
| `schrift/` | Bangers und Comic Neue (SIL Open Font License 1.1) für Offline-Rendern |

Erzeugtes (`aufnahmen/`, `audio/`, `ausgabe/`) steht in `.gitignore`. Wer die
Sprachaufnahmen nicht noch einmal bezahlen will, sichert `audio/` getrennt.

## Inhaltliche Leitplanken

- Personen und Handlung sind erfunden; der Abspann sagt das. Die Namen im
  App-Teil sind ebenfalls erfunden. Telefon und E-Mail des OV Ulm kommen aus
  dem OV-Verzeichnis der App, also aus öffentlich zugänglichen Angaben.
- Kein THW-Logo, nur der Schriftzug „THW“ auf Fahrzeugen und Kleidung.
- Nichts zeigen, was die App nicht kann. Der App-Teil besteht aus echten
  Aufnahmen; die Zahlen im Comic (0/2/7/9, fünf Einheiten, 38 Kräfte)
  entsprechen den Aufnahmen.
- Papier bleibt im Film die Rückfallebene — wie in der App
  (PDF im Papier-Layout, QR-Code auf der letzten Seite).
