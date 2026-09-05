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

/** Achsparalleles Rechteck in Pixeln — hier stets im Koordinatenraum des Videobilds. */
export interface Ausschnitt {
  x: number;
  y: number;
  breite: number;
  hoehe: number;
}

/** Lage und Größe eines Elements auf dem Bildschirm (Teilmenge von DOMRect). */
export interface Kasten {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Bildausschnitt, der dem Suchrahmen auf dem Bildschirm entspricht — in
 * Pixeln des Kamerabilds, damit der Decoder dort in voller Auflösung liest.
 *
 * Warum ein Ausschnitt statt des ganzen Bilds: Die Reichweite des Decoders
 * hängt an den Pixeln je QR-Modul. Ein dichter Bogen-Code auf einem
 * Handydisplay füllt aus Fokusabstand nur ein Drittel der Bildbreite — das
 * ganze Bild verkleinert zu dekodieren macht ihn unlesbar, der Rahmen in
 * Originalauflösung nicht. Nebenbei ignoriert der Decoder so, was neben dem
 * Rahmen im Bild ist.
 *
 * Das Video liegt mit `object-fit: cover` in seinem Kasten: gleichmäßig
 * skaliert, mittig, überstehende Ränder beschnitten. `zugabe` weitet den
 * Ausschnitt um den Rahmen herum (1.3 = 30 % breiter), damit ein Code, der
 * etwas über den Rahmen ragt, samt Ruhezone im Ausschnitt bleibt. Ohne
 * brauchbaren Rahmen (nicht gerendert, Größe 0) kommt das ganze Bild zurück.
 */
export function suchAusschnitt(
  video: { breite: number; hoehe: number },
  anzeige: Kasten,
  rahmen: Kasten | undefined,
  zugabe = 1.3,
): Ausschnitt {
  const ganz = { x: 0, y: 0, breite: video.breite, hoehe: video.hoehe };
  if (!rahmen || rahmen.width <= 0 || rahmen.height <= 0 || anzeige.width <= 0 || anzeige.height <= 0) return ganz;
  // Maßstab Bildschirm-px je Video-px bei „cover“: die Achse, die den Kasten
  // gerade ausfüllt, bestimmt ihn; die andere steht über.
  const massstab = Math.max(anzeige.width / video.breite, anzeige.height / video.hoehe);
  const sichtbarBreite = anzeige.width / massstab;
  const sichtbarHoehe = anzeige.height / massstab;
  const versatzX = (video.breite - sichtbarBreite) / 2;
  const versatzY = (video.hoehe - sichtbarHoehe) / 2;
  const mitteX = versatzX + (rahmen.x + rahmen.width / 2 - anzeige.x) / massstab;
  const mitteY = versatzY + (rahmen.y + rahmen.height / 2 - anzeige.y) / massstab;
  const kante = (Math.max(rahmen.width, rahmen.height) / massstab) * zugabe;
  const x0 = Math.max(0, Math.floor(mitteX - kante / 2));
  const y0 = Math.max(0, Math.floor(mitteY - kante / 2));
  const x1 = Math.min(video.breite, Math.ceil(mitteX + kante / 2));
  const y1 = Math.min(video.hoehe, Math.ceil(mitteY + kante / 2));
  if (x1 - x0 < 1 || y1 - y0 < 1) return ganz;
  return { x: x0, y: y0, breite: x1 - x0, hoehe: y1 - y0 };
}
