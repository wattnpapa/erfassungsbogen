/**
 * Ist die App auf diesem Gerät schon offline bereit?
 *
 * Die Startseite sagte beim ersten Aufruf sofort „✓ Funktioniert komplett
 * offline", auch wenn der Service Worker erst 23 von 551 Dateien im Vorrat
 * hatte. Wer die App dann im Fahrzeug aufrief und im Funkloch neu lud, sah die
 * Fehlerseite des Browsers statt seines Bogens (Audit Runde 2, R2-O1). Die
 * Zusage steht deshalb erst, wenn ein Service Worker aktiv ist — Workbox
 * aktiviert ihn erst, wenn der ganze Vorrat im Gerät liegt.
 *
 * Stände:
 *  - "bereit": Service Worker aktiv (oder native App — dort liegt alles lokal).
 *  - "laedt":  Service Worker wird noch installiert; die Seite läuft, ein
 *              Neuladen ohne Netz aber nicht.
 *  - "ohne":   Dieser Browser kann keinen Service Worker (etwa Privatmodus).
 */
import { useEffect, useState } from "react";
import { istNativ } from "./nativ";
import { kernFortschritt, mb, umfangLaden, zusatzNachladen, type OfflineUmfang } from "./offline-vorrat";

export type OfflineStand = "bereit" | "laedt" | "ohne";

function sw(): ServiceWorkerContainer | null {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker;
}

/** Stand beim ersten Zeichnen — synchron, damit ein gewöhnlicher Start nicht flackert. */
export function offlineStandJetzt(): OfflineStand {
  if (istNativ()) return "bereit";
  if (typeof window !== "undefined" && !/^https?:$/.test(window.location.protocol)) return "bereit";
  const c = sw();
  if (!c) return "ohne";
  return c.controller ? "bereit" : "laedt";
}

/**
 * Stand samt Netzlage. `frischBereit`: in dieser Sitzung gerade fertig
 * geworden — die Startseite quittiert das einmal.
 */
export interface OfflineZustand {
  stand: OfflineStand;
  frischBereit: boolean;
  online: boolean;
  /** Erste Stufe (Kern) beim Laden: Bytes im Vorrat / gesamt (R3-O3). */
  kern?: { geladen: number; gesamt: number } | null;
  /** Zweite Stufe (Beispielbögen, Themenseiten): Dateien da / gesamt. */
  zusatz?: { fertig: number; gesamt: number } | null;
  /**
   * Es gibt eine zweite Stufe (Web mit Service Worker, nicht nativ). Dann
   * heißt „bereit" nur: der Kern liegt im Vorrat. Solange `zusatz` noch nicht
   * gezählt ist, darf die Zeile nicht „komplett offline" sagen.
   */
  zweiStufen?: boolean;
}

export function useOfflineStand(): OfflineZustand {
  const [stand, setStand] = useState<OfflineStand>(offlineStandJetzt);
  const [frischBereit, setFrischBereit] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const [umfang, setUmfang] = useState<OfflineUmfang | null>(null);
  const [kern, setKern] = useState<{ geladen: number; gesamt: number } | null>(null);
  const [zusatz, setZusatz] = useState<{ fertig: number; gesamt: number } | null>(null);

  // Umfang beider Stufen — nur im Web mit Service Worker, nicht nativ.
  useEffect(() => {
    if (stand === "ohne" || istNativ() || !sw() || umfang) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    let aus = false;
    void umfangLaden().then((u) => {
      if (!aus && u) setUmfang(u);
    });
    return () => {
      aus = true;
    };
  }, [stand, online, umfang]);

  // Erste Stufe: solange geladen wird, alle anderthalb Sekunden nachsehen.
  useEffect(() => {
    if (stand !== "laedt" || !umfang) return;
    let aus = false;
    const schauen = () =>
      void kernFortschritt(umfang).then((k) => {
        if (!aus && k) setKern(k);
      });
    schauen();
    const uhr = setInterval(schauen, 1500);
    return () => {
      aus = true;
      clearInterval(uhr);
    };
  }, [stand, umfang]);

  // Zweite Stufe: erst wenn der Service Worker die Seite steuert (sonst landet
  // nichts in seinem Cache), und erneut, wenn das Netz zurückkommt.
  useEffect(() => {
    if (stand !== "bereit" || !umfang || !sw()?.controller) return;
    let aus = false;
    void zusatzNachladen(
      umfang,
      (fertig, gesamt) => {
        if (!aus) setZusatz({ fertig, gesamt });
      },
      () => aus,
    );
    return () => {
      aus = true;
    };
  }, [stand, umfang, online]);

  useEffect(() => {
    const beiOnline = () => {
      setOnline(true);
      // Ist die Installation im Funkloch abgebrochen, beim nächsten Netz neu
      // anstoßen, statt auf den nächsten Seitenaufruf zu warten.
      if (stand === "laedt") void sw()?.getRegistration().then((r) => r?.update()).catch(() => {});
    };
    const beiOffline = () => setOnline(false);
    window.addEventListener("online", beiOnline);
    window.addEventListener("offline", beiOffline);
    return () => {
      window.removeEventListener("online", beiOnline);
      window.removeEventListener("offline", beiOffline);
    };
  }, [stand]);

  useEffect(() => {
    if (stand !== "laedt") return;
    let aus = false;
    void sw()?.ready.then(() => {
      if (aus) return;
      setStand("bereit");
      setFrischBereit(true);
    });
    return () => {
      aus = true;
    };
  }, [stand]);

  const zweiStufen =
    stand !== "ohne" &&
    !istNativ() &&
    sw() !== null &&
    typeof window !== "undefined" &&
    /^https?:$/.test(window.location.protocol);
  return { stand, frischBereit, online, kern, zusatz, zweiStufen };
}

/** Text der Offline-Zeile auf der Startseite. */
export function offlineText(s: OfflineZustand): string {
  const daten = "alle Daten bleiben auf diesem Gerät.";
  if (s.stand === "bereit") {
    // Zweite Stufe noch unvollständig: Bogen, PDF, QR und Empfang gehen
    // schon ohne Netz, Beispielbögen und Themenseiten folgen (R3-O3).
    if (s.zusatz && s.zusatz.fertig < s.zusatz.gesamt) {
      const kopf = s.frischBereit ? "✓ Jetzt offline bereit" : "✓ Offline bereit";
      return s.online
        ? `${kopf} für Bogen, PDF, QR-Code und Empfang. Beispielbögen und Themenseiten werden nachgeladen (${s.zusatz.fertig} von ${s.zusatz.gesamt}) — ${daten}`
        : `${kopf} für Bogen, PDF, QR-Code und Empfang. Beispielbögen und Themenseiten fehlen noch (${s.zusatz.fertig} von ${s.zusatz.gesamt}), sie folgen beim nächsten Netz — ${daten}`;
    }
    // Zweite Stufe noch nicht gezählt (gleich nach dem Aktivieren, oder das
    // Verzeichnis der Stufen fehlt): sicher ist nur der Kern. Vorher stand hier
    // kurz „komplett offline", obwohl noch keine Beispielbögen im Gerät lagen.
    if (s.zweiStufen && !s.zusatz) {
      return `${s.frischBereit ? "✓ Jetzt offline bereit" : "✓ Offline bereit"} für Bogen, PDF, QR-Code und Empfang — ${daten}`;
    }
    return s.frischBereit
      ? `✓ Jetzt offline bereit. Funktioniert komplett offline — ${daten}`
      : `✓ Funktioniert komplett offline — ${daten}`;
  }
  if (s.stand === "ohne") {
    return `Offline-Vorrat ist in diesem Browser nicht möglich (etwa im Privatmodus) — ohne Netz lässt sich die Seite nicht neu laden. Alle Daten bleiben auf diesem Gerät.`;
  }
  // Fortschritt der ersten Stufe in Megabyte (R3-O3).
  const stand = s.kern && s.kern.gesamt > 0 ? `${mb(s.kern.geladen)} von ${mb(s.kern.gesamt)} MB` : "";
  return s.online
    ? `⏳ Wird für den Offline-Betrieb geladen${stand ? `: ${stand}` : ""} — bitte mit Netz geöffnet lassen. Danach gehen Bogen, PDF, QR-Code und Empfang ohne Netz. Alle Daten bleiben auf diesem Gerät.`
    : `⚠ Noch nicht offline bereit${stand ? ` (${stand} geladen)` : ""} — ohne Netz diese Seite nicht neu laden; beim nächsten Netz wird der Rest geladen. Alle Daten bleiben auf diesem Gerät.`;
}
