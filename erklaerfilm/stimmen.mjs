/**
 * Sprachaufnahmen und Geräusche für den Erklärfilm per ElevenLabs erzeugen.
 *
 *   ELEVENLABS_API_KEY=… node erklaerfilm/stimmen.mjs              alle fehlenden/geänderten Zeilen
 *   ELEVENLABS_API_KEY=… node erklaerfilm/stimmen.mjs --nur a5-1   einzelne Zeilen neu
 *   ELEVENLABS_API_KEY=… node erklaerfilm/stimmen.mjs --geraeusche Geräusche (Sound Effects)
 *   ELEVENLABS_API_KEY=… node erklaerfilm/stimmen.mjs --musik      Hintergrundmusik je Abschnitt (nach den Stimmen)
 *   node erklaerfilm/stimmen.mjs --dauer                           nur audio/dauer.json neu messen
 *
 * Welche Stimme wer spricht, steht in stimmen.json (Voice-IDs aus der
 * ElevenLabs-Stimmbibliothek). Gesendet wird `sprechtext`, sonst `text` —
 * so lassen sich Aussprachen („T-H-W“, „zwo-zwo“) steuern, ohne den
 * Untertitel zu verändern. Vorige und nächste Zeile derselben Stimme gehen
 * als previous_text/next_text mit, damit die Betonung zusammenpasst.
 *
 * Es wird nur neu erzeugt, was sich geändert hat (Text, Stimme, Einstellungen):
 * audio/stimmen-stand.json merkt sich je Zeile einen Fingerabdruck. Das spart
 * Zeichenkontingent.
 *
 * Danach misst ffprobe jede Datei; audio/dauer.json gibt dem Film die echten
 * Längen, und der Zeitplan richtet sich danach.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ORDNER = fileURLToPath(new URL(".", import.meta.url));
const AUDIO = join(ORDNER, "audio");
const API = "https://api.elevenlabs.io/v1";
const args = process.argv.slice(2);
const nur = args.includes("--nur") ? args.slice(args.indexOf("--nur") + 1).filter((a) => !a.startsWith("--")) : null;

const drehbuch = JSON.parse(await readFile(join(ORDNER, "drehbuch.json"), "utf8"));
const stimmen = JSON.parse(await readFile(join(ORDNER, "stimmen.json"), "utf8"));
await mkdir(join(AUDIO, "roh"), { recursive: true });
const standPfad = join(AUDIO, "stimmen-stand.json");
const stand = existsSync(standPfad) ? JSON.parse(await readFile(standPfad, "utf8")) : {};

function schluessel() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) {
    console.error("ELEVENLABS_API_KEY fehlt (API-Schlüssel aus elevenlabs.io → Profil → API Keys).");
    process.exit(1);
  }
  return k;
}

async function post(pfad, body) {
  for (let versuch = 1; ; versuch++) {
    const a = await fetch(`${API}${pfad}`, {
      method: "POST",
      headers: { "xi-api-key": schluessel(), "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify(body),
    });
    if (a.ok) return Buffer.from(await a.arrayBuffer());
    const text = await a.text();
    if ((a.status === 429 || a.status >= 500) && versuch < 4) {
      console.warn(`  ${a.status}, neuer Versuch in ${versuch * 5} s`);
      await new Promise((r) => setTimeout(r, versuch * 5000));
      continue;
    }
    throw new Error(`ElevenLabs ${a.status}: ${text.slice(0, 400)}`);
  }
}

function dauerVon(datei) {
  return new Promise((fertig, fehler) => {
    const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", datei]);
    let aus = "";
    p.stdout.on("data", (d) => (aus += d));
    p.on("exit", (c) => (c === 0 ? fertig(Number(aus.trim())) : fehler(new Error(`ffprobe ${datei}`))));
  });
}

// ── Sprache ────────────────────────────────────────────────────────────────
if (!args.includes("--dauer") && !args.includes("--geraeusche") && !args.includes("--musik")) {
  const alle = drehbuch.szenen.flatMap((s) => s.zeilen);
  const gesprochen = (z) => z.sprechtext ?? z.text;
  let erzeugt = 0;
  let zeichen = 0;
  for (const [i, z] of alle.entries()) {
    if (nur && !nur.includes(z.id)) continue;
    const s = stimmen.sprecher[z.sprecher];
    if (!s?.voice_id || s.voice_id.startsWith("HIER_")) {
      console.error(`Keine Voice-ID für „${z.sprecher}“ in stimmen.json — Zeile ${z.id} übersprungen.`);
      continue;
    }
    // Nachbarzeilen derselben Stimme geben den Tonfall vor.
    const vorige = alle.slice(0, i).reverse().find((x) => x.sprecher === z.sprecher);
    const naechste = alle.slice(i + 1).find((x) => x.sprecher === z.sprecher);
    const body = {
      text: gesprochen(z),
      model_id: stimmen.modell ?? "eleven_multilingual_v2",
      voice_settings: { ...stimmen.einstellungen, ...s.einstellungen },
      ...(vorige ? { previous_text: gesprochen(vorige) } : {}),
      ...(naechste ? { next_text: gesprochen(naechste) } : {}),
    };
    const abdruck = createHash("sha256").update(JSON.stringify([s.voice_id, body])).digest("hex").slice(0, 16);
    const datei = join(AUDIO, "roh", `${z.id}.mp3`);
    if (!nur && stand[z.id] === abdruck && existsSync(datei)) continue;
    process.stdout.write(`${z.id} (${z.sprecher}) … `);
    const mp3 = await post(`/text-to-speech/${s.voice_id}?output_format=mp3_44100_128`, body);
    await writeFile(datei, mp3);
    stand[z.id] = abdruck;
    await writeFile(standPfad, JSON.stringify(stand, null, 2));
    erzeugt++;
    zeichen += body.text.length;
    console.log("ok");
  }
  console.log(`${erzeugt} Zeilen erzeugt, ${zeichen} Zeichen verbraucht.`);
}

// ── Geräusche ──────────────────────────────────────────────────────────────
if (args.includes("--geraeusche")) {
  for (const [name, g] of Object.entries(drehbuch.geraeusche ?? {})) {
    const datei = join(AUDIO, `geraeusch-${name}.mp3`);
    if (existsSync(datei) && !(nur && nur.includes(name))) continue;
    process.stdout.write(`Geräusch ${name} … `);
    const mp3 = await post("/sound-generation", {
      text: g.beschreibung,
      duration_seconds: Math.min(22, Math.max(0.5, g.dauer ?? 5)),
      prompt_influence: 0.5,
    });
    await writeFile(datei, mp3);
    console.log("ok");
  }
}

// ── Nachbearbeiten und Dauer messen ────────────────────────────────────────
// ElevenLabs lässt oft lange Pausen stehen (bis über eine Sekunde mitten im
// Satz und am Ende). Aus audio/roh/ entsteht audio/<id>.mp3 ohne Stille am
// Anfang und Ende, Pausen im Satz höchstens 0,35 s, Lautheit −18 LUFS.
function nachbearbeiten(roh, ziel) {
  return new Promise((fertig, fehler) => {
    const filter =
      "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.05:stop_periods=-1:stop_duration=0.35:stop_threshold=-40dB:stop_silence=0.35," +
      "areverse,silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.08,areverse," +
      "loudnorm=I=-18:TP=-1.5:LRA=9,aresample=44100";
    const p = spawn("ffmpeg", ["-y", "-loglevel", "error", "-i", roh, "-af", filter, "-c:a", "libmp3lame", "-b:a", "160k", ziel]);
    p.on("exit", (c) => (c === 0 ? fertig() : fehler(new Error(`ffmpeg ${roh}`))));
  });
}
const dauer = {};
for (const z of drehbuch.szenen.flatMap((s) => s.zeilen)) {
  const roh = join(AUDIO, "roh", `${z.id}.mp3`);
  const datei = join(AUDIO, `${z.id}.mp3`);
  if (existsSync(roh)) await nachbearbeiten(roh, datei);
  if (existsSync(datei)) dauer[z.id] = Math.round((await dauerVon(datei)) * 1000) / 1000;
}
await writeFile(join(AUDIO, "dauer.json"), JSON.stringify(dauer, null, 2));
const summe = Object.values(dauer).reduce((a, b) => a + b, 0);
console.log(`audio/dauer.json: ${Object.keys(dauer).length} Zeilen, ${summe.toFixed(1)} s Sprache.`);

// ── Musik ──────────────────────────────────────────────────────────────────
// Ein Stück je Abschnitt (drehbuch.musik), so lang wie die Szenen dort laut
// Zeitplan — gleiche Regeln wie film.js (Vorlauf, Pause, Nachlauf, Mindestlänge).
if (args.includes("--musik")) {
  const MIN_SZENE = { titel: 6.5, abspann: 7 };
  const laenge = {};
  for (const sz of drehbuch.szenen) {
    let t = 0.5;
    sz.zeilen.forEach((z, i) => {
      t += dauer[z.id] ?? Math.max(1.2, (z.sprechtext ?? z.text).length / 14.5);
      if (i < sz.zeilen.length - 1) t += drehbuch.pause;
    });
    laenge[sz.id] = Math.max(t + 0.8, MIN_SZENE[sz.bild.art] ?? 0);
  }
  const ids = drehbuch.szenen.map((s) => s.id);
  for (const [name, m] of Object.entries(drehbuch.musik ?? {})) {
    const datei = join(AUDIO, `musik-${name}.mp3`);
    if (existsSync(datei) && !(nur && nur.includes(name))) continue;
    const abschnitt = ids.slice(ids.indexOf(m.von), ids.indexOf(m.bis) + 1);
    const sekunden = abschnitt.reduce((a, id) => a + laenge[id], 0) + 4; // Reserve fürs Ausblenden
    process.stdout.write(`Musik ${name} (${sekunden.toFixed(0)} s) … `);
    const mp3 = await post("/music", {
      prompt: m.beschreibung,
      music_length_ms: Math.round(Math.min(300, Math.max(10, sekunden)) * 1000),
      force_instrumental: true,
    });
    await writeFile(datei, mp3);
    console.log("ok");
  }
}
