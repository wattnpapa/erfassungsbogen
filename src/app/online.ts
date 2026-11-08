/**
 * Netz da? Folgt den Browser-Ereignissen „online"/„offline". Für Inhalte, die
 * nur mit Netz Sinn haben (Erklärfilm auf der Startseite). Bewusst ohne die
 * Installationslogik aus offline-bereit.ts — dieser Hook beobachtet nur.
 * `navigator.onLine` meldet „online" auch im WLAN ohne Internet; wer darauf
 * angewiesen ist, fängt zusätzlich den Ladefehler ab.
 */
import { useEffect, useState } from "react";

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  useEffect(() => {
    const an = () => setOnline(true);
    const aus = () => setOnline(false);
    window.addEventListener("online", an);
    window.addEventListener("offline", aus);
    return () => {
      window.removeEventListener("online", an);
      window.removeEventListener("offline", aus);
    };
  }, []);
  return online;
}
