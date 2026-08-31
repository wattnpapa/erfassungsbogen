/**
 * Kameraliste für den Web-Scanner: Welche Kameras hat das Gerät, wie heißen
 * sie für den Nutzer, und welche war zuletzt die richtige?
 *
 * Nötig, weil die Vorgabe „Rückkamera" nur auf Handys trägt: Am Notebook kennt
 * der Treiber die Blickrichtung oft nicht, und wer eine zweite Kamera
 * angesteckt hat, bekommt sonst die, die das System zufällig zuerst nennt.
 */

export interface Kamera {
  /** deviceId für die getUserMedia-Anfrage. */
  id: string;
  /** Anzeigename in der Auswahl, z. B. „Hauptkamera". */
  name: string;
}

const SPEICHER_KAMERA = "eeb-kamera";

/**
 * Sprechender Name aus dem Geräte-Label. Die Labels sind je nach System sehr
 * verschieden („camera2 0, facing back", „Surface Camera Front", „Integrated
 * Webcam"): Wo die Blickrichtung drinsteht, gewinnt sie — danach sucht, wer
 * zwischen Front- und Hauptkamera wechseln will.
 *
 * Das Objektiv geht der Blickrichtung vor, weil moderne Handys mehrere
 * Rückkameras melden („Back Ultra Wide Camera", „Back Telephoto Camera"). Sie
 * alle „Hauptkamera 1/2/3" zu nennen, hilft niemandem — und ausgerechnet das
 * Ultraweitwinkel ist die Kamera, die aus wenigen Zentimetern noch scharf
 * stellt, während die Hauptkamera erst ab etwa 20 cm scharf wird.
 */
export function kameraName(label: string, index: number): string {
  const text = label.trim();
  if (/\b(ultra.?wide|ultra.?weit|weitwinkel)/i.test(text)) return "Ultraweitwinkel (Nahaufnahme)";
  if (/\b(telephoto|tele)\b/i.test(text)) return "Teleobjektiv";
  // Rückseite zuerst prüfen: Android-Labels nennen beides („facing back").
  if (/\b(back|rear|environment|rück|haupt)/i.test(text)) return "Hauptkamera";
  if (/\b(front|user|vorder|selfie)/i.test(text)) return "Frontkamera";
  return text || `Kamera ${index + 1}`;
}

/**
 * Videoquellen aus enumerateDevices() als Auswahlliste. Namen sind eindeutig:
 * Handys melden gern mehrere Rückkameras (Weitwinkel, Tele), die sonst alle
 * „Hauptkamera" hießen.
 *
 * Hinweis: Labels liefert der Browser erst NACH einer erteilten Freigabe —
 * vorher aufgerufen, kommt hier „Kamera 1", „Kamera 2" … heraus.
 */
export function kameraListe(geraete: MediaDeviceInfo[]): Kamera[] {
  const video = geraete.filter((g) => g.kind === "videoinput" && g.deviceId);
  const namen = video.map((g, i) => kameraName(g.label, i));
  const zaehler = new Map<string, number>();
  return video.map((g, i) => {
    const name = namen[i]!;
    const gesamt = namen.filter((n) => n === name).length;
    const nummer = (zaehler.get(name) ?? 0) + 1;
    zaehler.set(name, nummer);
    return { id: g.deviceId, name: gesamt > 1 ? `${name} ${nummer}` : name };
  });
}

/** Zuletzt gewählte Kamera (localStorage kann im privaten Modus werfen). */
export function gemerkteKamera(): string {
  try {
    return localStorage.getItem(SPEICHER_KAMERA) ?? "";
  } catch {
    return "";
  }
}

/** Kamerawahl merken, damit der nächste Scan gleich richtig startet. */
export function merkeKamera(id: string): void {
  try {
    localStorage.setItem(SPEICHER_KAMERA, id);
  } catch {
    /* Merken ist Komfort, kein Muss. */
  }
}
