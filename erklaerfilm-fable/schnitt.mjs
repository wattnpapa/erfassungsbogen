/**
 * Endschnitt: Comic-Intro + App + Comic-Abspann hintereinander, Tonspur aus
 * mischen.mjs darunter → build/erklaerfilm.mp4 (1080p, H.264/AAC).
 * Dazu Untertitel (build/erklaerfilm.srt) und ein Kontaktblatt mit Standbildern
 * (build/kontaktblatt.png).
 *
 *   node erklaerfilm-fable/schnitt.mjs            Film, Untertitel, Kontaktblatt
 *   node erklaerfilm-fable/schnitt.mjs --platzhalter   fehlende Teilvideos durch Farbflächen ersetzen (Test)
 */
import { writeFile, mkdir, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { jsonLesen } from "./elevenlabs.mjs";

const exec = promisify(execFile);
const HIER = fileURLToPath(new URL(".", import.meta.url));
const BUILD = HIER + "build/";
const platzhalter = process.argv.includes("--platzhalter");

const misch = await jsonLesen(BUILD + "mischung.json", null);
if (!misch) throw new Error("Erst mischen.mjs laufen lassen.");
const plan = await jsonLesen(BUILD + "zeitplan.json", null);

async function dauerVon(datei) {
  const { stdout } = await exec("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", datei]);
  return Number.parseFloat(stdout);
}
async function da(p) { try { await stat(p); return true; } catch { return false; } }

const teile = [
  { id: "intro", datei: BUILD + "comic-intro.mp4", soll: misch.bloecke.intro, farbe: "0x0b1230" },
  { id: "app", datei: BUILD + "app.mp4", soll: misch.bloecke.app, farbe: "0xf3f5f9" },
  { id: "abspann", datei: BUILD + "comic-abspann.mp4", soll: misch.bloecke.abspann, farbe: "0x12275e" },
];

for (const t of teile) {
  if (!(await da(t.datei))) {
    if (!platzhalter) throw new Error(`${t.datei} fehlt – erst rendern (oder --platzhalter für einen Test).`);
    console.warn(`⚠ ${t.id}: Platzhalter (${t.soll.toFixed(1)} s)`);
    await exec("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", `color=c=${t.farbe}:s=1920x1080:r=25:d=${t.soll.toFixed(3)}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", BUILD + `platzhalter-${t.id}.mp4`]);
    t.datei = BUILD + `platzhalter-${t.id}.mp4`;
  }
  t.ist = await dauerVon(t.datei);
  const abw = t.ist - t.soll;
  console.log(`${t.id}: Bild ${t.ist.toFixed(2)} s, Ton ${t.soll.toFixed(2)} s${Math.abs(abw) > 0.08 ? `  ⚠ Abweichung ${abw.toFixed(2)} s` : ""}`);
}

// Jeden Teil exakt auf die Tonlänge bringen (letztes Bild halten bzw. kürzen), dann verketten.
const normiert = [];
for (const t of teile) {
  const ziel = BUILD + `teil-${t.id}.mp4`;
  const soll = t.soll.toFixed(3);
  // tpad hält das letzte Bild, -t schneidet Überhang; so stimmen die Schnittpunkte zur Tonspur.
  await exec("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", t.datei, "-vf", `tpad=stop_mode=clone:stop_duration=5,fps=25,format=yuv420p`, "-t", soll, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", ziel]);
  normiert.push(ziel);
}
await writeFile(BUILD + "schnittliste.txt", normiert.map((p) => `file '${p}'`).join("\n"));

await exec("ffmpeg", [
  "-y", "-hide_banner", "-loglevel", "error",
  "-f", "concat", "-safe", "0", "-i", BUILD + "schnittliste.txt",
  "-i", BUILD + "ton.wav",
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "25",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-movflags", "+faststart", "-shortest",
  "-metadata", "title=Meldekopf Oldenburg – der digitale Einheiten-Erfassungsbogen",
  "-metadata", "language=deu",
  BUILD + "erklaerfilm.mp4",
]);
console.log(`build/erklaerfilm.mp4: ${(await dauerVon(BUILD + "erklaerfilm.mp4")).toFixed(1)} s`);

// Untertitel
const srtZeit = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
};
const NAMEN = { erzaehler: "", sina: "Sina: ", hauke: "Hauke: ", merle: "Merle: ", jan: "Jan: " };
const srt = misch.stimmen
  .slice().sort((a, b) => a.at - b.at)
  .map((z, i) => `${i + 1}\n${srtZeit(z.at)} --> ${srtZeit(z.at + z.dauer)}\n${NAMEN[z.sprecher] ?? ""}${z.text}\n`)
  .join("\n");
await writeFile(BUILD + "erklaerfilm.srt", srt);

// Kontaktblatt: ein Standbild je Szene (Comic: Szenenmitte; App: Marke der ersten Zeile + 3 s)
const marken = await jsonLesen(BUILD + "app-marken.json", null);
const bilder = [];
for (const s of plan.bloecke.intro.szenen) bilder.push({ t: (s.start + s.ende) / 2, name: `Intro · ${s.id}` });
for (const s of plan.bloecke.app.szenen) {
  const m = marken?.zeilen?.[s.zeilen[0].id];
  if (m != null) bilder.push({ t: misch.bloecke.intro + m + Math.min(3, s.zeilen[0].dauer / 2), name: `App · ${s.id}` });
}
for (const s of plan.bloecke.abspann.szenen) bilder.push({ t: misch.bloecke.intro + misch.bloecke.app + (s.start + s.ende) / 2, name: `Abspann · ${s.id}` });
await mkdir(BUILD + "standbilder", { recursive: true });
const kacheln = [];
for (const [i, b] of bilder.entries()) {
  const ziel = BUILD + `standbilder/${String(i + 1).padStart(2, "0")}-${b.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
  const mm = String(Math.floor(b.t / 60)).padStart(2, "0"), ss = String(Math.floor(b.t % 60)).padStart(2, "0");
  const text = `${mm}:${ss}  ${b.name}`.replace(/:/g, "\\:").replace(/'/g, "");
  await exec("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-ss", b.t.toFixed(2), "-i", BUILD + "erklaerfilm.mp4", "-frames:v", "1",
    "-vf", `scale=640:360,drawbox=y=ih-40:w=iw:h=40:color=black@0.6:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${text}':x=12:y=h-30:fontsize=20:fontcolor=white`, ziel]);
  kacheln.push(ziel);
}
const spalten = 4, zeilen = Math.ceil(kacheln.length / spalten);
await exec("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...kacheln.flatMap((k) => ["-i", k]),
  "-filter_complex", `${kacheln.map((_, i) => `[${i}:v]`).join("")}xstack=inputs=${kacheln.length}:fill=0x12275e:layout=${kacheln.map((_, i) => `${(i % spalten) * 648}_${Math.floor(i / spalten) * 368}`).join("|")},pad=w=iw+8:h=ih+8:x=4:y=4:color=0x12275e[o]`,
  "-map", "[o]", BUILD + "kontaktblatt.png"]);
console.log(`build/kontaktblatt.png (${kacheln.length} Standbilder, ${spalten}×${zeilen}), build/erklaerfilm.srt (${misch.stimmen.length} Einträge)`);
