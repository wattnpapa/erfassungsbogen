/**
 * Ersatz für das virtuelle Modul `virtual:pwa-register`, das erst vite-plugin-pwa
 * im Build/Dev bereitstellt. Im Test gibt es keinen Service Worker — die
 * Registrierung meldet einfach nichts zurück (kein Update, kein Offline-Hinweis).
 */

export function registerSW(_optionen?: unknown): (neuLaden?: boolean) => Promise<void> {
  return async () => {};
}
