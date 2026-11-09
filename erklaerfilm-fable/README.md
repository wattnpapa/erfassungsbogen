# Erklärfilm „Meldekopf Oldenburg“

Erklärfilm zum digitalen Einheiten-Erfassungsbogen: ein Comic-Einstieg am THW-Meldekopf in
Oldenburg (Papier gegen QR-Code), dann die echte App Seite für Seite, zum Schluss zurück in den
Comic. 1080p, 25 fps, deutsche Stimmen, Soundeffekte und Musik aus ElevenLabs.

- Drehbuch: [DREHBUCH.md](DREHBUCH.md) (erzeugt aus `drehbuch.mjs`)
- Produktionskette und Schnittstellen: [PIPELINE.md](PIPELINE.md)

## Erzeugen

Voraussetzungen: `npm ci` im Projekt, ffmpeg/ffprobe, Chromium für Playwright
(`/opt/pw-browsers/chromium` oder `PLAYWRIGHT_CHROMIUM` setzen), ElevenLabs-Zugang
(`ELEVENLABS_API_KEY` oder der Netzwerk-Proxy der Umgebung).

```sh
# 1. Sprache, Effekte, Musik (Cache in ton/, Index in build/)
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node erklaerfilm-fable/stimmen.mjs
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node erklaerfilm-fable/klaenge.mjs
node erklaerfilm-fable/zeitplan.mjs          # build/zeitplan.json

# 2. Bild
node erklaerfilm-fable/comic/rendern.mjs     # build/comic-intro.mp4, build/comic-abspann.mp4
LANG=de_DE.UTF-8 node erklaerfilm-fable/app/aufnahme.mjs   # build/app.mp4, build/app-marken.json

# 3. Ton und Schnitt
node erklaerfilm-fable/mischen.mjs           # build/ton.wav
node erklaerfilm-fable/schnitt.mjs           # build/erklaerfilm.mp4, .srt, kontaktblatt.png
node erklaerfilm-fable/drehbuch-md.mjs       # DREHBUCH.md mit Zeiten nachziehen
```

`build/` und `ton/` sind erzeugte Medien und bleiben aus dem Repository heraus (`.gitignore`).
Wer nur den Text ändert, lässt `stimmen.mjs` erneut laufen: unveränderte Zeilen kommen aus dem
Cache, neue bekommen eine neue Datei.

## Aufbau des Ordners

| Pfad | Zweck |
| --- | --- |
| `drehbuch.mjs` | Drehbuch als Daten: Sprecher, Szenen, Zeilen, Effekt-Cues, Musik-Prompts, Daten der gezeigten Einheit |
| `stimmen.mjs`, `klaenge.mjs`, `elevenlabs.mjs` | ElevenLabs-Zugriff mit Cache (max. 3 gleichzeitige Anfragen) |
| `zeitplan.mjs` | Zeitachse der Comic-Blöcke aus den Tonlängen |
| `comic/` | Comic-Szenen (HTML/SVG, deterministisches `seek(t)`) und Renderer |
| `app/` | Playwright-Aufnahme des Assistenten (Stop-Motion mit Cursor) |
| `mischen.mjs` | Stimmen, Effekte, Musik mit Ducking auf eine Spur |
| `schnitt.mjs` | Verketten, Ton anlegen, Untertitel, Kontaktblatt |
| `schrift/` | Webfonts für den Comic (Bangers, Patrick Hand, Comic Neue; SIL OFL) |

## Gestaltung in Kürze

Der Konflikt steht vorne: ein nasser Papierbogen, drei Handschriften, ein Taschenrechner, eine
wartende Fahrzeugschlange. Die Lösung ist ein einziger Piep. Erst danach erklärt der Film, wie der
Bogen entsteht, und zwar genau mit der Einheit aus dem Comic (FGr WP (B), OV Oldenburg). Der
Meldekopf-Teil schließt den Kreis: die Sammlung „Hochwasser Hunte“ zählt die Einheiten zusammen,
die im Comic angerollt sind.
