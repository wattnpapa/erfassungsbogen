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
export function useOfflineStand(): { stand: OfflineStand; frischBereit: boolean; online: boolean } {
  const [stand, setStand] = useState<OfflineStand>(offlineStandJetzt);
  const [frischBereit, setFrischBereit] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));

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

  return { stand, frischBereit, online };
}

/** Text der Offline-Zeile auf der Startseite. */
export function offlineText(s: { stand: OfflineStand; frischBereit: boolean; online: boolean }): string {
  const daten = "alle Daten bleiben auf diesem Gerät.";
  if (s.stand === "bereit") {
    return s.frischBereit
      ? `✓ Jetzt offline bereit. Funktioniert komplett offline — ${daten}`
      : `✓ Funktioniert komplett offline — ${daten}`;
  }
  if (s.stand === "ohne") {
    return `Offline-Vorrat ist in diesem Browser nicht möglich (etwa im Privatmodus) — ohne Netz lässt sich die Seite nicht neu laden. Alle Daten bleiben auf diesem Gerät.`;
  }
  return s.online
    ? `⏳ Wird für den Offline-Betrieb geladen — bitte mit Netz geöffnet lassen. Alle Daten bleiben auf diesem Gerät.`
    : `⚠ Noch nicht offline bereit — ohne Netz diese Seite nicht neu laden; beim nächsten Netz wird der Rest geladen. Alle Daten bleiben auf diesem Gerät.`;
}
