# To-do

## Gerätetest & TestFlight (iOS)

- [ ] **Gerätetest iPhone:** `npm run ios:open`, iPhone anschließen, ▶︎ (Team
      2AKGEZS43R ist hinterlegt, signiert automatisch). Auf dem Gerät testen:
      In-App-Scanner („QR-Code scannen…") mit gedrucktem Bogen-QR, danach
      PDF-/JSON-Export übers Share-Sheet (AirDrop/Dateien/Drucken).
- [ ] **App Store Connect:** Unter <https://appstoreconnect.apple.com> neue App
      anlegen (Plattform iOS, Bundle-ID `de.erfassungsbogen.app`, Name z. B.
      „Einheiten-Erfassungsbogen") und in Xcode unter *Settings → Accounts* die
      Apple-ID hinterlegen. Danach übernimmt Claude Archiv + TestFlight-Upload.

## Web-QR-Scanner (Browser/Desktop)

Stand: 2026-07-11. Der Scan-Knopf auf dem Startbildschirm ist jetzt immer
sichtbar: nativ scannt das Capacitor-Plugin, im Browser/Electron die Webcam
(`src/app/qr-scanner-web.tsx`, getUserMedia + jsQR). Verifiziert sind der
Fehlerpfad (keine Kamera/Zugriff verweigert) und der Dekodier-Roundtrip
(`npm run demo`) — der Live-Scan mit echter Kamera noch nicht.

- [ ] Live-Test mit Webcam: Start → „QR-Code scannen…" → gedruckten oder
      angezeigten QR vorhalten → Übersicht öffnet sich mit dem Bogen.
- [ ] Electron-Paket (macOS): Kamerazugriff braucht `NSCameraUsageDescription`
      in der Info.plist und bei Hardened Runtime das Entitlement
      `com.apple.security.device.camera`, sonst scheitert getUserMedia im
      signierten Build.
- [ ] Merken: getUserMedia läuft nur im Secure Context (localhost oder HTTPS).
      Ein Test über eine HTTP-Adresse im LAN zeigt nur den Fehlerhinweis —
      das ist erwartetes Browserverhalten, kein Bug.

# QR-Deep-Links (Universal Links / App Links) fertigstellen

Stand: 2026-07-11. Die QR-Codes enthalten jetzt `https://erfassungsbogen.app/#<Payload>`;
Web-App-Hash-Einstieg, AASA, assetlinks, iOS-Entitlement und Android-Intent-Filter
sind angelegt. Was noch fehlt:

## Hosting / Domain

- [x] Web-App unter `https://erfassungsbogen.app` deployen (Vite-Build, `dist/`).
- [x] AASA/assetlinks werden ausgeliefert (Status 200, ohne Redirect). GitHub
      Pages liefert zwar `application/octet-stream` statt `application/json`,
      aber Apples CDN hat die Datei akzeptiert (geprüft 2026-07-12:
      `app-site-association.cdn-apple.com/a/v1/erfassungsbogen.app` spiegelt
      sie mit `Apple-Origin-Format: json`).

## Android

- [x] SHA256-Fingerprints in `public/.well-known/assetlinks.json` eingetragen
      (2026-07-12): Release-Zertifikat (aus der signierten Release-APK per
      `apksigner verify --print-certs` gezogen, `DA:88:C3:…`) und
      Debug-Keystore (`54:17:28:…`). Achtung: Bei einem Wechsel auf Play App
      Signing signiert Google mit einem eigenen Schlüssel — dann den
      SHA-256 aus der Play Console ergänzen.
- [ ] Nach dem nächsten Web-Deploy (assetlinks muss live sein) Verifizierung prüfen:
      `adb shell pm get-app-links de.erfassungsbogen.app` → Status `verified`.

## iOS

- [x] Team-ID in `apple-app-site-association` eintragen (2AKGEZS43R).
- [ ] In Xcode einmal mit angemeldetem Account bauen, damit die App-ID in der
      Developer-Console die Capability „Associated Domains" bekommt
      (Entitlement `applinks:erfassungsbogen.app` ist im Projekt eingetragen;
      Automatic Signing sollte das Provisioning-Profil selbst aktualisieren).
- [ ] Apple cached die AASA über sein CDN — nach dem ersten Deploy kann die
      Verifizierung bis zu 24 h dauern. Sofort-Test: Gerät in den Entwicklermodus,
      Einstellungen → Entwickler → „Associated Domains Development".

## Nativer Link-Empfang (Capacitor)

Erledigt 2026-07-12: `@capacitor/app` installiert und gesynct;
`bogenLinksEmpfangen()` in `src/app/nativ.ts` liefert Links aus
`appUrlOpen` (laufende App) und `getLaunchUrl()` (Kaltstart) an
`main.tsx`, das die URL über die gemeinsame Übernahme-Funktion dekodiert.

## Ende-zu-Ende-Test

- [ ] PDF erzeugen, gedruckten/angezeigten QR mit der iPhone- bzw.
      Android-Kamera scannen → App öffnet sich und zeigt die Übersicht.
- [ ] Gegentest ohne installierte App: Link öffnet die Web-App, Bogen wird
      aus dem Fragment geladen (funktioniert bereits, lokal verifiziert).
