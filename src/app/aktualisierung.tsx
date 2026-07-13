/// <reference types="vite-plugin-pwa/client" />
/**
 * Android-Selbst-Update (Sideload-APK, kein Play Store): beim Start prüfen,
 * ob ein neueres GitHub-Release vorliegt, und – auf Wunsch des Nutzers – die
 * APK laden und installieren. Gegenstück zu electron-updater auf dem Desktop.
 *
 * Der native Teil (Download + Installer-Intent, Version auslesen) steckt im
 * Capacitor-Plugin AppUpdate (android/.../AppUpdate.java). Hier liegt die
 * Logik: Release ermitteln, Version vergleichen, Banner anzeigen.
 */

import { useEffect, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { istNativ } from "./nativ";

interface AppUpdatePlugin {
  getCurrentVersion(): Promise<{ versionName: string; versionCode: number }>;
  downloadAndInstall(options: { url: string }): Promise<void>;
  addListener(
    eventName: "fortschritt",
    listenerFunc: (data: { prozent: number }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

const AppUpdate = registerPlugin<AppUpdatePlugin>("AppUpdate");

// owner/repo wie im Release-Workflow (.github/workflows/release.yml).
const REPO = "wattnpapa/erfassungsbogen";

interface UpdateInfo {
  version: string;
  apkUrl: string;
}

/** Selbst-Update nur auf nativem Android (per Sideload verteilte APK). */
function updatesUnterstuetzt(): boolean {
  return istNativ() && Capacitor.getPlatform() === "android";
}

/**
 * Zwei Versionsstrings numerisch komponentenweise vergleichen
 * (Format YYYY.MMDD.HHMM, z. B. "2026.712.1035"). true ⇒ a ist neuer als b.
 * Nötig, weil die Teile keine feste Breite haben und ein reiner Stringvergleich
 * sonst falsch sortiert (z. B. "5" nach "1035"). Nicht-numerische oder fehlende
 * Teile zählen als 0.
 */
function versionNeuerAls(a: string, b: string): boolean {
  const ta = a.split(".");
  const tb = b.split(".");
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) {
    const d = (Number(ta[i]) || 0) - (Number(tb[i]) || 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/**
 * Neuestes Release von GitHub holen und mit der installierten Version
 * vergleichen. Der Versionsstring hat das Format YYYY.MMDD.HHMM (z. B.
 * 2026.712.1035); verglichen wird numerisch je Komponente (siehe
 * versionNeuerAls). Fehler (kein Netz, Rate-Limit, kein Release) werden still
 * zu null: die App ist offline-tauglich und darf am Start nie hängen.
 */
async function aufUpdatePruefen(): Promise<UpdateInfo | null> {
  if (!updatesUnterstuetzt()) return null;
  try {
    const { versionName } = await AppUpdate.getCurrentVersion();
    const antwort = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!antwort.ok) return null;
    const release = await antwort.json();
    const neuste: unknown = release?.tag_name;
    if (typeof neuste !== "string" || !versionNeuerAls(neuste, versionName)) return null;
    const apk = (release.assets ?? []).find(
      (a: { name?: string }) => typeof a.name === "string" && a.name.endsWith("-android.apk"),
    );
    if (!apk?.browser_download_url) return null;
    return { version: neuste, apkUrl: apk.browser_download_url };
  } catch {
    return null;
  }
}

/**
 * Banner am oberen Rand, das ein verfügbares Update meldet. Der Download
 * startet erst auf Tippen (kein stiller Verbrauch von Mobildaten). Ist kein
 * Update da oder läuft die App nicht nativ auf Android, rendert nichts.
 */
export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [prozent, setProzent] = useState<number | null>(null);
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    let aktiv = true;
    aufUpdatePruefen().then((info) => {
      if (aktiv) setUpdate(info);
    });
    return () => { aktiv = false; };
  }, []);

  if (!update) return null;

  async function installieren() {
    if (!update) return;
    setFehler("");
    setProzent(0);
    const abo = await AppUpdate.addListener("fortschritt", (d) => setProzent(d.prozent));
    try {
      await AppUpdate.downloadAndInstall({ url: update.apkUrl });
      // Nach erfolgreichem Start des Installers übernimmt der System-Dialog.
    } catch (err) {
      setProzent(null);
      setFehler(err instanceof Error ? err.message : "Update fehlgeschlagen.");
    } finally {
      await abo.remove();
    }
  }

  return (
    <div className="update-banner" role="status">
      {prozent === null ? (
        <>
          <span>Version {update.version} verfügbar.</span>
          <button className="primaer" onClick={installieren}>Aktualisieren</button>
          <button className="link" onClick={() => setUpdate(null)}>Später</button>
        </>
      ) : (
        <span>Update wird geladen … {prozent}%</span>
      )}
      {fehler && <span className="fehler">{fehler}</span>}
    </div>
  );
}

/**
 * Web-Selbst-Update über den Service Worker (nur Browser, siehe unten). Der SW
 * lädt eine neue Version im Hintergrund und wartet dann; dieses Banner meldet
 * das dezent und lädt die Seite erst auf Klick neu (kein Auto-Reload, damit ein
 * gerade ausgefüllter Bogen nicht verlorengeht). In der Capacitor-/Electron-App
 * wird der SW nicht registriert – dort rendert die Komponente nichts.
 */
export function WebUpdateBanner() {
  const [neueVersion, setNeueVersion] = useState(false);
  // updateSW(true) aktiviert den wartenden SW (SKIP_WAITING) und lädt neu.
  const [neuLaden, setNeuLaden] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Kein SW in der nativen App (Capacitor iOS/Android) oder im Electron-Build:
    // die App liegt dort schon lokal, und capacitor://- bzw. file://-Kontexte
    // tragen keinen brauchbaren Service Worker.
    if (istNativ()) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    // Nur über http/https registrieren (nicht unter file://, capacitor://).
    if (!/^https?:$/.test(window.location.protocol)) return;

    let abbestellt = false;
    // Dynamischer Import: das virtuelle Modul liefert vite-plugin-pwa erst im
    // Build/Dev; so bleibt der native Bundle-Pfad unberührt.
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        if (abbestellt) return;
        const updateSW = registerSW({
          // Neue Version wartet im Hintergrund → Banner einblenden.
          onNeedRefresh() {
            setNeuLaden(() => () => updateSW(true));
            setNeueVersion(true);
          },
        });
      })
      .catch(() => {
        /* SW-Registrierung fehlgeschlagen – App läuft weiter (nur ohne Offline-Cache). */
      });

    return () => { abbestellt = true; };
  }, []);

  if (!neueVersion) return null;

  return (
    <div className="update-banner" role="status">
      <span>Neue Version verfügbar.</span>
      <button className="primaer" onClick={() => neuLaden?.()}>Neu laden</button>
      <button className="link" onClick={() => setNeueVersion(false)}>Später</button>
    </div>
  );
}

/**
 * Beide Update-Hinweise gebündelt: das native APK-Update (Android) und das
 * Web-Update über den Service Worker. Je nach Plattform rendert höchstens einer.
 */
export function Aktualisierungshinweise() {
  return (
    <>
      <UpdateBanner />
      <WebUpdateBanner />
    </>
  );
}
