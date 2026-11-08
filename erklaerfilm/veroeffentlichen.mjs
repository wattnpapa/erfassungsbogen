/**
 * Erklärfilm für die Website bereitstellen: aus ausgabe/erklaerfilm.mp4
 * (Rendern in hoher Qualität, ~85 MB) entstehen unter public/video/
 *
 *   erklaerfilm.mp4   1080p, H.264 crf 30, AAC 128k, faststart (~25 MB)
 *   erklaerfilm.jpg   Vorschaubild (Titelbild bei 3 s)
 *   erklaerfilm.vtt   Untertitel (aus der SRT)
 *
 *   node erklaerfilm/veroeffentlichen.mjs
 *
 * faststart legt den Index an den Dateianfang, damit der Browser sofort
 * abspielen kann, statt erst die ganze Datei zu laden. Die Dateien gehören
 * nur zur Website: Electron schließt dist/video aus ("files" in
 * package.json), Capacitor bekommt dist/ ohne den Ordner
 * (scripts/ohne-video.mjs). Der Service Worker lädt sie nicht vor (mp4, jpg
 * und vtt stehen nicht in den globPatterns).
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ORDNER = fileURLToPath(new URL(".", import.meta.url));
const QUELLE = join(ORDNER, "ausgabe", "erklaerfilm.mp4");
const ZIEL = fileURLToPath(new URL("../public/video/", import.meta.url));

function ffmpeg(args) {
  return new Promise((fertig, fehler) => {
    const p = spawn("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
    p.on("exit", (c) => (c === 0 ? fertig() : fehler(new Error(`ffmpeg ${c}`))));
  });
}

await mkdir(ZIEL, { recursive: true });
await ffmpeg([
  "-i", QUELLE,
  "-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-crf", "30", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
  join(ZIEL, "erklaerfilm.mp4"),
]);
await ffmpeg(["-ss", "3", "-i", QUELLE, "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "4", join(ZIEL, "erklaerfilm.jpg")]);

// SRT → WebVTT: Kopfzeile davor, Komma in den Zeitangaben wird Punkt.
const srt = await readFile(QUELLE.replace(/\.mp4$/, ".srt"), "utf8");
const vtt = "WEBVTT\n\n" + srt.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2");
await writeFile(join(ZIEL, "erklaerfilm.vtt"), vtt);

const mb = (await stat(join(ZIEL, "erklaerfilm.mp4"))).size / 1048576;
console.log(`public/video/erklaerfilm.mp4: ${mb.toFixed(1)} MB — FILM_MB in src/app/app.tsx auf ${Math.round(mb)} setzen.`);
