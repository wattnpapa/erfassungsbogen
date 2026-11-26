/**
 * PDF-Ausgabe (pdfmake, rein clientseitig): rendert die DocDefinition aus
 * pdf-dokument.ts und bietet das Ergebnis als Download (Web) bzw. übers
 * System-Share-Sheet (nativ) an. Das Layout selbst liegt in pdf-dokument.ts
 * (pdfmake-frei und dadurch unit-testbar).
 */

import { pdfMake } from "./pdf-helvetica";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { ausgabeDateiname, blobAlsDownload, dateinameTeil, einheitAnzeigename, qrErzeugen } from "./hilfen";
import { istNativ, binaerTeilen } from "./nativ";
import {
  boegenSammelDokument,
  einzelPdfDokument,
  nichtDarstellbareBetroffene,
  nichtDarstellbareNamen,
  pdfDokument,
  umschriftBetroffene,
  vereinfachtBetroffene,
  type SammelEinzelBogen,
} from "./pdf-dokument";
import type { PdfAuftrag, PdfNachricht } from "./pdf-sammel-worker";
import { einzelPdfsZippen } from "./pdf-zip";
import { BLANKO_DATEINAME, BLANKO_INFO, BLANKO_ZEILEN, leererBogen } from "./blanko";
import { zeitEingelesen } from "./eintrag-zeiten";
import { kaestchenZeichnen } from "./pdf-kaestchen";

/**
 * Einzel-PDF mit Platz für Stiftnachträge, wo er keine Seite kostet: ein
 * Probesatz misst den freien Platz (Audit Runde 3, R3-A6).
 */
function einzelDokument(b: Erfassungsbogen, qr: Awaited<ReturnType<typeof qrErzeugen>>) {
  return einzelPdfDokument(b, qr, (probe) => pdfMake.createPdf(kaestchenZeichnen(probe)).getBuffer());
}

/**
 * Bogen als PDF ausgeben. `name` überschreibt den aus der Einheit abgeleiteten
 * Dateinamen (die Übungsbögen behalten so ihren Dateinamen aus examples/).
 * `herkunft` = empfangener Payload: unverändert weitergereicht behält der
 * QR-Code auf der letzten Seite die Original-Signatur (siehe qrErzeugen).
 */
export async function pdfErzeugen(
  b: Erfassungsbogen,
  name?: string,
  herkunft?: Uint8Array | null,
  /** Vor dem Ausgeben gefragt: true = der Aufrufer will die Datei nicht mehr (Übungsbögen, BB-E1). */
  abgebrochen?: () => boolean,
): Promise<{ nichtDarstellbar: number; betroffen: string[]; umschrift: string[]; vereinfacht: string[] }> {
  const qr = await qrErzeugen(b, herkunft);
  const dd = await einzelDokument(b, qr);
  const nichtDarstellbar = nichtDarstellbareNamen(b);
  const betroffen = nichtDarstellbareBetroffene(b);
  const umschrift = umschriftBetroffene(b);
  const vereinfacht = vereinfachtBetroffene(b);
  const rumpf = dateinameTeil(einheitAnzeigename(b.einheit));
  const dateiname = name ?? ausgabeDateiname("", rumpf, "pdf");
  if (abgebrochen?.()) return { nichtDarstellbar, betroffen, umschrift, vereinfacht };
  if (istNativ()) {
    // In der App gibt es keinen Browser-Download: PDF übers Share-Sheet anbieten
    const base64 = await pdfMake.createPdf(kaestchenZeichnen(dd)).getBase64();
    await binaerTeilen(dateiname, base64);
  } else {
    pdfMake.createPdf(kaestchenZeichnen(dd)).download(dateiname);
  }
  return { nichtDarstellbar, betroffen, umschrift, vereinfacht };
}

/**
 * Bogen als PDF-Blob-URL — für die eingebettete Vorschau in der Übersicht
 * (Browser/Desktop; die native App zeigt PDFs übers Share-Sheet an).
 *
 * Bewusst Blob statt `data:`-URL: die Content-Security-Policy des Builds
 * erlaubt als Rahmenquelle nur 'self'/file:/blob: — ein data:-Rahmen wird
 * blockiert und die Vorschau bliebe leer. Die URL muss der Aufrufer wieder
 * freigeben (URL.revokeObjectURL), sonst hält der Tab jede erzeugte PDF fest.
 */
export async function pdfBlobUrl(b: Erfassungsbogen, herkunft?: Uint8Array | null): Promise<string> {
  const qr = await qrErzeugen(b, herkunft);
  const dd = await einzelDokument(b, qr);
  return URL.createObjectURL(await pdfMake.createPdf(kaestchenZeichnen(dd)).getBlob());
}






export { zeitEingelesen };




/**
 * Fertiges Dokument ausgeben: Download im Browser, Share-Sheet in der App.
 * false = Share-Sheet abgebrochen; der Export-Stand verbucht dann nichts.
 */
async function dokumentAusgeben(dd: Parameters<typeof pdfMake.createPdf>[0], dateiname: string): Promise<boolean> {
  if (istNativ()) {
    const base64 = await pdfMake.createPdf(kaestchenZeichnen(dd)).getBase64();
    return binaerTeilen(dateiname, base64);
  }
  // Bis die Datei wirklich entstanden ist: Ohne `await` meldete die Sperre „fertig", Sekunden bevor der Download kam (R17-D4).
  await pdfMake.createPdf(kaestchenZeichnen(dd)).download(dateiname);
  return true;
}



/**
 * Blanko-Vordruck: der leere Bogen zum Ausfüllen mit der Hand, aus derselben
 * Quelle wie die ausgelieferte Datei (blanko.ts). In der App erzeugt statt
 * geladen — geht offline, in der Desktop-App und im Teilen-Fenster gleich.
 * Bisher nur über „Aufbau des Bogens" auf der Website erreichbar (Audit
 * Runde 3, R3-A7).
 */
export async function blankoPdfErzeugen(): Promise<boolean> {
  const dd = pdfDokument(leererBogen(), null, BLANKO_ZEILEN);
  return dokumentAusgeben({ ...dd, info: BLANKO_INFO }, BLANKO_DATEINAME);
}

/**
 * Wie weit eine Ausgabe mehrerer Bögen ist: `qr` = QR-Codes erzeugt (n von
 * von), `satz` = Bögen gesetzt bzw. vorbereitet, `datei` = die Datei entsteht
 * (ohne Zählung).
 */
export interface PdfFortschritt {
  schritt: "qr" | "satz" | "datei";
  n: number;
  von: number;
}

/** Pause für die Oberfläche zwischen zwei Bögen (QR-Codes und Satz im Hauptthread rechnen ohne Wartezeit). */
const atemholen = () => new Promise<void>((weiter) => setTimeout(weiter, 0));

/** Setzen im Hauptthread: Bytes der fertigen PDF. */
const setzenHier = async (dd: Parameters<typeof kaestchenZeichnen>[0]) =>
  (await pdfMake.createPdf(kaestchenZeichnen(dd)).getBuffer()) as Uint8Array;

/** QR-Satz je Bogen, mit Fortschritt; null = abgebrochen. */
async function qrSaetze(
  boegen: readonly Erfassungsbogen[],
  fortschritt: ((f: PdfFortschritt) => void) | undefined,
  abgebrochen: () => boolean,
): Promise<SammelEinzelBogen[] | null> {
  const mitQr: SammelEinzelBogen[] = [];
  for (const [i, b] of boegen.entries()) {
    if (abgebrochen()) return null;
    mitQr.push({ bogen: b, qr: await qrErzeugen(b, null) });
    fortschritt?.({ schritt: "qr", n: i + 1, von: boegen.length });
    await atemholen();
  }
  return mitQr;
}

/**
 * Mehrere Bögen als eine Sammel-PDF (Übungsbögen: die markierten Bögen eines
 * Ordners). Jeder Bogen bekommt seinen eigenen QR-Code und sieht aus wie sein
 * Einzel-PDF; siehe boegenSammelDokument. `fortschritt` meldet jeden
 * vorbereiteten Bogen, `abgebrochen` wird zwischen den Bögen gefragt.
 * false = abgebrochen oder Share-Sheet verworfen.
 */
export async function sammelPdfErzeugen(
  boegen: readonly Erfassungsbogen[],
  dateiname: string,
  titel: string,
  fortschritt?: (f: PdfFortschritt) => void,
  abgebrochen: () => boolean = () => false,
): Promise<boolean> {
  const mitQr = await qrSaetze(boegen, fortschritt, abgebrochen);
  if (!mitQr) return false;
  // Erst im Worker setzen (Oberfläche bleibt bedienbar); nur wenn es ihn
  // nicht gibt oder er nicht startet, im Hauptthread.
  const imWorker = await imWorkerSetzen({ art: "sammel", boegen: mitQr, titel }, fortschritt, abgebrochen);
  if (imWorker === "abgebrochen") return false;
  if (imWorker !== "kein-worker") {
    if (abgebrochen()) return false;
    return bytesAusgeben(imWorker, dateiname, "application/pdf");
  }
  const dd = await boegenSammelDokument(
    mitQr,
    (probe) => pdfMake.createPdf(kaestchenZeichnen(probe)).getBuffer(),
    titel,
    (n, von) => fortschritt?.(n < von ? { schritt: "satz", n, von } : { schritt: "datei", n: 0, von: 0 }),
    abgebrochen,
  );
  if (!dd || abgebrochen()) return false;
  return dokumentAusgeben(dd, dateiname);
}

/**
 * Mehrere Bögen als ZIP-Datei mit je einer eigenen PDF (Übungsbögen). Jede
 * PDF gleicht dem Einzel-PDF des Bogens. `namen` = Dateinamen im ZIP, in der
 * Reihenfolge der Bögen (doppelte bekommen „-2", „-3"). false = abgebrochen
 * oder Share-Sheet verworfen.
 */
export async function einzelPdfsAlsZip(
  boegen: readonly Erfassungsbogen[],
  namen: readonly string[],
  dateiname: string,
  fortschritt?: (f: PdfFortschritt) => void,
  abgebrochen: () => boolean = () => false,
): Promise<boolean> {
  const mitQr = await qrSaetze(boegen, fortschritt, abgebrochen);
  if (!mitQr) return false;
  const imWorker = await imWorkerSetzen({ art: "zip", boegen: mitQr, namen: [...namen] }, fortschritt, abgebrochen);
  if (imWorker === "abgebrochen") return false;
  if (imWorker !== "kein-worker") {
    if (abgebrochen()) return false;
    return bytesAusgeben(imWorker, dateiname, "application/zip");
  }
  const zip = await einzelPdfsZippen(
    mitQr,
    namen,
    setzenHier,
    (n, von) => fortschritt?.(n < von ? { schritt: "satz", n, von } : { schritt: "datei", n: 0, von: 0 }),
    abgebrochen,
    atemholen,
  );
  if (!zip || abgebrochen()) return false;
  return bytesAusgeben(zip, dateiname, "application/zip");
}

/**
 * Sammel-PDF oder ZIP im Worker setzen (pdf-sammel-worker.ts). "kein-worker"
 * heißt: der Worker ließ sich nicht starten (Desktop-App über file://, ohne
 * Netz, alte Browser, Testumgebung) — dann rechnet der Aufrufer selbst.
 * Fehler beim Setzen kommen als Ausnahme, wie im Hauptthread.
 */
function imWorkerSetzen(
  auftrag: PdfAuftrag,
  fortschritt: ((f: PdfFortschritt) => void) | undefined,
  abgebrochen: () => boolean,
): Promise<ArrayBuffer | "kein-worker" | "abgebrochen"> {
  if (typeof Worker === "undefined") return Promise.resolve("kein-worker");
  let worker: Worker;
  try {
    worker = new Worker(new URL("./pdf-sammel-worker.ts", import.meta.url), { type: "module" });
  } catch {
    return Promise.resolve("kein-worker");
  }
  return new Promise((fertig, fehler) => {
    let gemeldet = false;
    const wache = window.setInterval(() => {
      if (!abgebrochen()) return;
      ende();
      fertig("abgebrochen");
    }, 250);
    function ende() {
      window.clearInterval(wache);
      worker.terminate();
    }
    worker.onmessage = (e: MessageEvent<PdfNachricht>) => {
      gemeldet = true;
      const n = e.data;
      if (n.art === "fortschritt") {
        fortschritt?.({ schritt: n.schritt, n: n.n, von: n.von });
        return;
      }
      ende();
      if (n.art === "fertig") fertig(n.datei);
      else fehler(new Error(n.text));
    };
    // Startet das Skript gar nicht (Ladefehler, CSP, file://), kam noch keine
    // Nachricht: dann im Hauptthread. Ein Fehler mitten im Satz ist echt.
    worker.onerror = (e) => {
      e.preventDefault();
      ende();
      if (gemeldet) fehler(new Error(e.message || "Die Datei ließ sich nicht setzen."));
      else fertig("kein-worker");
    };
    try {
      worker.postMessage(auftrag);
    } catch {
      ende();
      fertig("kein-worker");
    }
  });
}

/** Fertige Bytes ausgeben: Download im Browser, Share-Sheet in der App. */
async function bytesAusgeben(daten: ArrayBuffer | Uint8Array, dateiname: string, mime: string): Promise<boolean> {
  const bytes = daten instanceof Uint8Array ? daten : new Uint8Array(daten);
  if (istNativ()) {
    let binaer = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binaer += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return binaerTeilen(dateiname, btoa(binaer));
  }
  blobAlsDownload(dateiname, new Blob([bytes as BlobPart], { type: mime }));
  return true;
}
