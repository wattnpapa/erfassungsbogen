/**
 * Native Brücke (Capacitor): In-App-QR-Scanner und Teilen von Dateien über
 * das System-Share-Sheet (AirDrop, Dateien-App, Drucken, Mail …).
 *
 * Im Browser ist istNativ() false und die Web-Pfade (Download-Links)
 * bleiben unverändert; dieses Modul wird dann nicht aktiv.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export function istNativ(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * QR-Code mit der Kamera scannen (fertige Scanner-UI des Plugins).
 * Liefert den rohen QR-Text oder null bei Abbruch durch den Nutzer.
 */
export async function qrScannen(): Promise<string | null> {
  try {
    const ergebnis = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
      scanInstructions: "QR-Code des Erfassungsbogens in den Rahmen halten",
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

/** PDF (Base64) in den Cache schreiben und übers Share-Sheet anbieten. */
export async function pdfTeilen(dateiname: string, base64: string): Promise<void> {
  const datei = await Filesystem.writeFile({
    path: dateiname,
    data: base64,
    directory: Directory.Cache,
  });
  await teilen(dateiname, datei.uri);
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
