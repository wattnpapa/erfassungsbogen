# To-do

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

- [ ] Web-App unter `https://erfassungsbogen.app` deployen (Vite-Build, `dist/`).
- [ ] Sicherstellen, dass der Hoster diese beiden Dateien **mit Content-Type
      `application/json` und ohne Redirect** ausliefert (liegen unter `public/`,
      landen also automatisch im Build):
  - `https://erfassungsbogen.app/.well-known/apple-app-site-association`
  - `https://erfassungsbogen.app/.well-known/assetlinks.json`
- [ ] Prüfen mit `curl -i https://erfassungsbogen.app/.well-known/apple-app-site-association`
      (Status 200, JSON, kein HTML-Fallback der SPA). Bei SPA-Rewrite-Regeln
      `.well-known/` explizit ausnehmen.

## Android

- [ ] SHA256-Fingerprint des Signierzertifikats in
      `public/.well-known/assetlinks.json` eintragen (ersetzt den Platzhalter).
  - Play App Signing: Play Console → Einrichtung → App-Signatur → SHA-256.
  - Lokales Keystore: `keytool -list -v -keystore <keystore>` → SHA256.
  - Debug-Builds zum Testen: Fingerprint von `~/.android/debug.keystore`
    (Passwort `android`) zusätzlich in die Liste aufnehmen.
- [ ] Nach dem Deploy Verifizierung prüfen:
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

- [ ] `npm login` (Token ist aktuell ungültig, Installationen schlagen mit E401 fehl).
- [ ] `npm install @capacitor/app && npx cap sync`
- [ ] `appUrlOpen`-Listener ergänzen (z. B. in `src/app/nativ.ts`), der den
      Payload an die bestehende Logik übergibt — `decodePayloadUrl` akzeptiert
      die volle URL bereits:

  ```ts
  import { App } from "@capacitor/app";
  App.addListener("appUrlOpen", ({ url }) => {
    // url = "https://erfassungsbogen.app/#<Payload>" → Bogen laden,
    // gleiche Übernahme wie uebernehmeQrText() in main.tsx.
  });
  ```

  Hinweis: `main.tsx` liest das Fragment bisher nur beim Seitenstart
  (`bogenAusUrlFragment`). Öffnet der Link eine **bereits laufende** App,
  kommt nur der Listener zum Zug — die Übernahme dafür am besten als
  gemeinsame Funktion herausziehen.

## Ende-zu-Ende-Test

- [ ] PDF erzeugen, gedruckten/angezeigten QR mit der iPhone- bzw.
      Android-Kamera scannen → App öffnet sich und zeigt die Übersicht.
- [ ] Gegentest ohne installierte App: Link öffnet die Web-App, Bogen wird
      aus dem Fragment geladen (funktioniert bereits, lokal verifiziert).
