<img src="public/icon.svg" alt="Erfassungsbogen.app Logo" width="96" align="right">

# Erfassungsbogen

Der digitale Einheiten-Erfassungsbogen für alle BOS und Hilfsorganisationen —
THW, Feuerwehr, Polizei, DRK/JUH/MHD/ASB, DLRG, Bundeswehr und weitere.
Bogen am Bildschirm ausfüllen, als PDF drucken — und der komplette Inhalt
steckt zusätzlich in einem einzigen QR-Code, der ganz ohne Internet auf jedem
anderen Gerät wieder eingelesen werden kann.

## Direkt ausprobieren

**<https://erfassungsbogen.app>** — läuft im Browser, ohne Installation und
ohne Anmeldung.

## Was kann die App?

- **Bogen ausfüllen**: Schritt für Schritt durch Einheit, Einsatz, Personal,
  Fahrzeuge und Sofortbedarf — mit Gesamtübersicht, in der sich alles
  nachbearbeiten lässt.
- **PDF drucken**: im gewohnten Papier-Layout; auf der letzten Seite sitzt ein
  QR-Code, der den kompletten Bogen enthält.
- **QR-Code scannen**: Kamera drauf, und der Bogen ist wieder in der App —
  auch komplett offline, es braucht keinen Server und keine Verbindung
  zwischen den Geräten. Wer den QR-Code mit der normalen Handykamera scannt,
  landet automatisch in der App bzw. auf der Webseite.
- **Speichern und laden**: der Bogen lässt sich als Datei sichern und
  weitergeben.
- **Alles bleibt auf dem Gerät**: keine Anmeldung, kein Server, keine Cloud —
  siehe [Datenschutzerklärung](https://erfassungsbogen.app/datenschutz.html).

## Für wen ist sie gedacht?

1. **Einheiten**, die ihren Erfassungsbogen selbst ausfüllen — statt Papier
   und Handschrift: einmal erfassen, drucken, und beim nächsten Einsatz nur
   noch anpassen.
2. **Meldeköpfe und Bereitstellungsräume**: trifft eine Einheit ohne Bogen
   ein, ist sie am Tablet in wenigen Minuten erfasst (nur Stärke,
   Führungskraft, Fahrzeuge) — Bogen drucken, weitergeben, fertig. Bringt
   die Einheit einen QR-Code mit, reicht ein Scan.

## Herunterladen

Alle Downloads unter
[Releases](https://github.com/wattnpapa/erfassungsbogen/releases/latest):

| Gerät | Download |
|---|---|
| **Windows** | Installer (`.exe`) |
| **macOS** | `.dmg` (unsigniert — beim ersten Start Rechtsklick → „Öffnen") |
| **Linux** | `.deb` (Debian/Ubuntu) oder `.pacman` (Arch) |
| **Android** | APK (Android 8.0 oder neuer) |
| **iPhone/iPad** | App Store / TestFlight in Vorbereitung — bis dahin: <https://erfassungsbogen.app> |

Die Desktop-App funktioniert komplett offline und hält sich selbst aktuell:
Updates werden im Hintergrund geladen und nach Bestätigung installiert.

## Lizenz

Freie Software unter [EUPL-1.2](LICENSE) — Europäische Union Public Licence
(mit amtlicher deutscher Fassung).

## Für Entwickler

Technische Dokumentation (Build, Architektur, Datenformat, QR-Codec):
[docs/entwicklung.md](docs/entwicklung.md)
