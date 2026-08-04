/**
 * Native Brücke (Capacitor): In-App-QR-Scanner und Teilen von Dateien über
 * das System-Share-Sheet (AirDrop, Dateien-App, Drucken, Mail …).
 *
 * Im Browser ist istNativ() false und die Web-Pfade (Download-Links)
 * bleiben unverändert; dieses Modul wird dann nicht aktiv.
 */

import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export function istNativ(): boolean {
  return Capacitor.isNativePlatform();
}

/** Aktuelle Laufzeit-Plattform: "ios" | "android" | "web". */
export function plattform(): string {
  return Capacitor.getPlatform();
}

/**
 * Ist ein System-Share-Sheet erreichbar? Nativ immer (Capacitor Share), im
 * Browser nur mit Web Share API. Desktop-Chrome unter Linux und Electron haben
 * keine — dort bleiben Zwischenablage und Download die Wege.
 */
export function shareSheetVerfuegbar(): boolean {
  return istNativ() || (typeof navigator !== "undefined" && typeof navigator.share === "function");
}

/**
 * Name des Nahbereichs-Dienstes der Plattform — allein für die Beschriftung,
 * damit der Knopf das nennt, was der Nutzer im Share-Sheet dann auch sucht.
 * Im Browser bleibt nur die Gerätekennung; sie entscheidet hier über ein Wort,
 * nicht über eine Funktion, ein Fehlgriff kostet also nichts.
 */
export function nahbereichDienst(): "AirDrop" | "Quick Share" | null {
  const p = plattform();
  if (p === "ios") return "AirDrop";
  if (p === "android") return "Quick Share";
  const kennung = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/Android/.test(kennung)) return "Quick Share";
  if (/iPhone|iPad|iPod|Mac OS X|Macintosh/.test(kennung)) return "AirDrop";
  return null;
}

/**
 * Universal Links (iOS) / App Links (Android) empfangen: Der Callback
 * bekommt die volle URL (https://erfassungsbogen.app/#<Payload>) — beim
 * Kaltstart über die Launch-URL, bei bereits laufender App über appUrlOpen.
 * Liefert eine Aufräumfunktion, die den Listener wieder entfernt.
 */
export function bogenLinksEmpfangen(callback: (url: string) => void): () => void {
  if (!istNativ()) return () => {};
  const listener = App.addListener("appUrlOpen", ({ url }) => callback(url));
  App.getLaunchUrl()
    .then((start) => {
      if (start?.url) callback(start.url);
    })
    .catch(() => {});
  return () => {
    listener.then((l) => l.remove()).catch(() => {});
  };
}

/**
 * QR-Code mit der Kamera scannen (fertige Scanner-UI des Plugins).
 * Liefert den rohen QR-Text oder null bei Abbruch durch den Nutzer.
 */
export async function qrScannen(anweisung = "QR-Code des Erfassungsbogens in den Rahmen halten"): Promise<string | null> {
  // Dynamischer Import: das Plugin zieht über sein definitions.js die komplette
  // html5-qrcode-Bibliothek (~360 KB) mit — die gehört nicht ins Start-Bundle,
  // zumal der native Scanner im Browser nie aufgerufen wird.
  const { CapacitorBarcodeScanner, CapacitorBarcodeScannerCameraDirection, CapacitorBarcodeScannerTypeHint } = await import(
    "@capacitor/barcode-scanner"
  );
  try {
    const ergebnis = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
      scanInstructions: anweisung,
    });
    return ergebnis.ScanResult || null;
  } catch (err) {
    // Abbruch durch den Nutzer ist kein Fehler
    if (/cancel|abbruch|dismiss/i.test(err instanceof Error ? err.message : String(err))) return null;
    throw err;
  }
}

/** Share-Sheet öffnen; Abbruch durch den Nutzer ist kein Fehler. */
async function teilen(titel: string, uri: string): Promise<void> {
  try {
    await Share.share({ title: titel, files: [uri] });
  } catch (err) {
    if (/cancel|abbruch/i.test(err instanceof Error ? err.message : String(err))) return;
    throw err;
  }
}

/** Binärdatei (Base64) in den Cache schreiben und übers Share-Sheet anbieten — PDF, XLSX, … */
export async function binaerTeilen(dateiname: string, base64: string): Promise<void> {
  const datei = await Filesystem.writeFile({
    path: dateiname,
    data: base64,
    directory: Directory.Cache,
  });
  await teilen(dateiname, datei.uri);
}

/** Einen Link (App-URL) als Text übers Share-Sheet anbieten — ohne Datei-Anhang. */
export async function linkTeilen(titel: string, url: string): Promise<void> {
  try {
    await Share.share({ title: titel, text: titel, url });
  } catch (err) {
    if (/cancel|abbruch/i.test(err instanceof Error ? err.message : String(err))) return;
    throw err;
  }
}

/** Text (z. B. Bogen-JSON) als Datei übers Share-Sheet anbieten. */
export async function textTeilen(dateiname: string, text: string): Promise<void> {
  const datei = await Filesystem.writeFile({
    path: dateiname,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await teilen(dateiname, datei.uri);
}
