/**
 * Erklärfilm aus dist/ entfernen, bevor Capacitor (Android/iOS) das Web-Bundle
 * in die App kopiert. Der Film liegt unter public/video/ nur für die Website
 * (rund 20 MB); in den Apps verlinkt die Startseite auf erfassungsbogen.app.
 * Electron schließt den Ordner über "files" in package.json aus.
 */
import { rm } from "node:fs/promises";

await rm(new URL("../dist/video", import.meta.url), { recursive: true, force: true });
console.log("dist/video entfernt (nicht für App-Pakete)");
