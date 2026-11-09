# Produktionskette des Erklärfilms

Drei Blöcke, drei Werkzeuge, eine Tonmischung:

| Block | Quelle | Ergebnis | Zeitführung |
| --- | --- | --- | --- |
| Comic-Intro | `comic/` (HTML/SVG, gerendert mit Playwright) | `build/comic-intro.mp4` | Ton führt: `build/zeitplan.json` → Block `intro` |
| App | `app/aufnahme.mjs` (Playwright, Stop-Motion) | `build/app.mp4` + `build/app-marken.json` | Bild führt: Aufnahme setzt Marken je Sprechzeile |
| Comic-Abspann | `comic/` | `build/comic-abspann.mp4` | Ton führt: Block `abspann` |

Alle Videos: 1920×1080, 25 fps, H.264 (yuv420p), **ohne Ton**. Die Länge der Comic-Videos
entspricht `bloecke.<id>.dauer` aus dem Zeitplan (auf ganze Frames gerundet).

## build/zeitplan.json (aus zeitplan.mjs)

```jsonc
{
  "fps": 25,
  "bloecke": {
    "intro": {
      "id": "intro", "musik": "nacht", "visuellGefuehrt": false, "dauer": 127.8,
      "szenen": [{
        "id": "titel", "bild": "…", "caption": "…", "start": 0, "ende": 12.4,
        "zeilen": [{ "id": "i01", "sprecher": "erzaehler", "text": "…", "funk": false,
                     "datei": "ton/stimmen/i01-….mp3", "dauer": 10.3, "start": 1.2, "ende": 11.5 }],
        "sfx": [{ "key": "regen", "at": 0, "dauer": 12.4 }, { "key": "donner", "at": 0.8 }]
      }]
    },
    "app": { "visuellGefuehrt": true, "szenen": [{ "id": "start", "zeilen": [{ "id": "a01", "dauer": 10.3, … }] }] }
  }
}
```

## build/app-marken.json (aus app/aufnahme.mjs)

Zeiten in Sekunden **relativ zum Beginn von app.mp4**.

```jsonc
{
  "dauer": 232.5,
  "zeilen": { "a01": 0.8, "a02": 11.6, "a03": 16.2 },
  "sfx": [{ "key": "klick", "at": 12.1 }, { "key": "tippen", "at": 20.0, "dauer": 2.4 }, { "key": "blaettern", "at": 30.2 }],
  "kapitel": [{ "id": "einheit", "start": 16.2 }]
}
```

Regel: Eine Sprechzeile beginnt erst, wenn das zugehörige Bild steht, und das Bild
hält mindestens bis `start + dauer + 0.5 s`.

## Mischung und Schnitt

`mischen.mjs` legt Stimmen (Marken), Effekte (Cues) und Musikbetten (mit Ducking unter
Sprache) auf eine Spur; `schnitt.mjs` hängt die drei Videos aneinander, legt den Ton
darunter und schreibt `build/erklaerfilm.mp4`, `build/erklaerfilm.srt` und das
Kontaktblatt `build/kontaktblatt.png`.
