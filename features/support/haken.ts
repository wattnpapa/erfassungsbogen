import { AfterAll, BeforeAll, Before, After, Status, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium, webkit, type Browser } from "playwright";
import { spawn, type ChildProcess } from "node:child_process";
import type { EebWelt } from "./welt";

setDefaultTimeout(30_000);

let browser: Browser;
let devServer: ChildProcess | undefined;

const PORT = 5273;
const BASIS_URL = process.env.EEB_BASE_URL ?? `http://localhost:${PORT}`;

async function warteAufServer(url: string, versuche = 60): Promise<void> {
  for (let i = 0; i < versuche; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* Server noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev-Server unter ${url} nicht erreichbar geworden`);
}

BeforeAll(async function () {
  // Eigenen Dev-Server nur starten, wenn keine externe URL vorgegeben ist
  // (im CI/lokal kann EEB_BASE_URL auf einen bereits laufenden Server zeigen).
  if (!process.env.EEB_BASE_URL) {
    devServer = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
      stdio: "ignore",
      env: process.env,
    });
    await warteAufServer(BASIS_URL);
  }
  // EEB_BROWSER=webkit fährt die Suite als iOS-WKWebView-Näherung.
  browser = process.env.EEB_BROWSER === "webkit" ? await webkit.launch() : await chromium.launch();
});

Before(async function (this: EebWelt) {
  const kontext = await browser.newContext();
  this.page = await kontext.newPage();
});

After(async function (this: EebWelt, { result }) {
  if (result?.status === Status.FAILED && this.page) {
    const png = await this.page.screenshot();
    this.attach(png, "image/png");
  }
  await this.page?.context().close();
});

AfterAll(async function () {
  await browser?.close();
  devServer?.kill("SIGTERM");
});
