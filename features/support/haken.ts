import { AfterAll, BeforeAll, Before, After, Status, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium, webkit, type Browser } from "playwright";
import { spawn, type ChildProcess } from "node:child_process";
import type { EebWelt } from "./welt";

setDefaultTimeout(30_000);

let browser: Browser;
let server: ChildProcess | undefined;

const PORT = 5273;
const BASIS_URL = process.env.EEB_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Prüfstand: „preview" (Vorgabe) baut die App und liefert das echte
 * Auslieferungs-Bundle aus, „dev" (EEB_SERVER=dev) fährt den Vite-Dev-Server.
 *
 * Die Vorgabe ist bewusst der Build: pdfmake hängt im Dev-Server beim Rendern
 * (getDataUrl/download melden sich nie zurück, siehe docs/entwicklung.md), im
 * Build läuft es. Ohne diesen Modus bliebe jeder PDF-Weg ungetestet — und der
 * Build kostet nur wenige Sekunden. Nebenbei prüft die Suite so den
 * minifizierten Stand samt Service-Worker statt der Dev-Transformation.
 */
const MODUS = process.env.EEB_SERVER === "dev" ? "dev" : "preview";

async function warteAufServer(url: string, versuche = 120): Promise<void> {
  for (let i = 0; i < versuche; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* Server noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server unter ${url} nicht erreichbar geworden`);
}

/** `npm run build` einmal vor der Suite — ein Fehlschlag bricht sie ab. */
function bauen(): Promise<void> {
  return new Promise((fertig, fehler) => {
    const p = spawn("npm", ["run", "build"], { stdio: "ignore", env: process.env });
    p.on("error", fehler);
    p.on("exit", (code) => (code === 0 ? fertig() : fehler(new Error(`npm run build endete mit Code ${code}`))));
  });
}

BeforeAll({ timeout: 180_000 }, async function () {
  // Eigenen Server nur starten, wenn keine externe URL vorgegeben ist
  // (im CI/lokal kann EEB_BASE_URL auf einen bereits laufenden Server zeigen).
  if (!process.env.EEB_BASE_URL) {
    if (MODUS === "preview") await bauen();
    const argumente =
      MODUS === "preview"
        ? ["vite", "preview", "--port", String(PORT), "--strictPort"]
        : ["vite", "--port", String(PORT), "--strictPort"];
    server = spawn("npx", argumente, { stdio: "ignore", env: process.env });
    await warteAufServer(BASIS_URL);
  }
  // EEB_BROWSER=webkit fährt die Suite als iOS-WKWebView-Näherung.
  browser = process.env.EEB_BROWSER === "webkit" ? await webkit.launch() : await chromium.launch();
});

Before(async function (this: EebWelt) {
  const kontext = await browser.newContext();
  // „Link teilen" schreibt ohne Web-Share-API in die Zwischenablage; ohne
  // Erlaubnis scheitert das still. WebKit kennt diese Berechtigungsnamen nicht.
  await kontext.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  this.page = await kontext.newPage();
  // Wachhund gegen window.prompt/confirm/alert: In der iOS-App (WKWebView)
  // beantwortet das System diese Dialoge nicht — `prompt` liefert dort sofort
  // `null`, der Knopf tut also scheinbar nichts. Genau daran scheiterte „Neuen
  // Einsatz anlegen" auf dem Telefon. Hier wird jeder Systemdialog vermerkt und
  // lässt das Szenario scheitern (siehe After), statt still weggeklickt zu
  // werden — Rückfragen gehören in die eigene Oberfläche (src/app/dialoge.ts).
  this.page.on("dialog", async (dialog) => {
    this.systemdialoge.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });
  // Downloads sammeln, damit Schritte den Dateinamen prüfen können
  // (PDF, Sammel-PDF, CSV, Datensicherung).
  this.page.on("download", (d) => this.downloads.push(d));
});

After(async function (this: EebWelt, { result }) {
  if (result?.status === Status.FAILED && this.page) {
    const png = await this.page.screenshot();
    this.attach(png, "image/png");
  }
  const dialoge = this.systemdialoge;
  await this.page?.context().close();
  if (dialoge.length > 0) {
    throw new Error(
      `Die App hat ${dialoge.length} eingebaute JavaScript-Dialoge benutzt — die bleiben in der iOS-App ` +
        `unbeantwortet. Stattdessen die eigenen Dialoge verwenden (src/app/dialoge.tsx):\n  ${dialoge.join("\n  ")}`,
    );
  }
});

AfterAll(async function () {
  await browser?.close();
  server?.kill("SIGTERM");
});
