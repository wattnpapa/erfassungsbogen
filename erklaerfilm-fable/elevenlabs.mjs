/**
 * Dünner Zugang zur ElevenLabs-API. Der Schlüssel wird vom Netzwerk-Proxy
 * der Umgebung eingesetzt (Header xi-api-key); lokal reicht ELEVENLABS_API_KEY.
 *
 * Aufruf immer mit
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node …
 * sonst geht fetch am Proxy vorbei und der Platzhalter-Schlüssel wird abgelehnt.
 *
 * Das Konto erlaubt höchstens 3 gleichzeitige Anfragen – die Aufrufer
 * begrenzen ihre Parallelität selbst (stimmen.mjs: 2, klaenge.mjs: 1).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const BASIS = "https://api.elevenlabs.io/v1";
const SCHLUESSEL = process.env.ELEVENLABS_API_KEY ?? "proxy-injected";

export function hash(obj) {
  return createHash("sha1").update(JSON.stringify(obj)).digest("hex").slice(0, 12);
}

export async function existiert(pfad) {
  try { await stat(pfad); return true; } catch { return false; }
}

/** POST mit JSON-Körper, Antwort als Binärdatei; bei 429 (Concurrency) warten und wiederholen. */
export async function anfrageBinaer(pfad, body, zielDatei, versuche = 6) {
  for (let i = 0; i < versuche; i++) {
    const res = await fetch(BASIS + pfad, {
      method: "POST",
      headers: { "xi-api-key": SCHLUESSEL, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(new URL(".", "file://" + zielDatei), { recursive: true });
      await writeFile(zielDatei, buf);
      return buf.length;
    }
    const text = await res.text();
    if (res.status === 429 || res.status >= 500) {
      const warte = 2000 * (i + 1);
      console.warn(`  ${res.status} – warte ${warte} ms (${text.slice(0, 80)})`);
      await new Promise((r) => setTimeout(r, warte));
      continue;
    }
    throw new Error(`ElevenLabs ${res.status} für ${pfad}: ${text.slice(0, 300)}`);
  }
  throw new Error(`ElevenLabs: zu viele Fehlversuche für ${pfad}`);
}

/** Länge einer Audiodatei in Sekunden (ffprobe). */
export async function dauer(datei) {
  const { stdout } = await exec("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", datei]);
  return Number.parseFloat(stdout.trim());
}

/** Einfache Warteschlange mit begrenzter Parallelität. */
export async function parallel(aufgaben, n) {
  const ergebnisse = [];
  let i = 0;
  async function arbeiter() {
    while (i < aufgaben.length) {
      const idx = i++;
      ergebnisse[idx] = await aufgaben[idx]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, aufgaben.length) }, arbeiter));
  return ergebnisse;
}

export async function jsonLesen(pfad, fallback) {
  try { return JSON.parse(await readFile(pfad, "utf8")); } catch { return fallback; }
}
