import { AfterAll, BeforeAll, Before, After, Status, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium, webkit, type Browser } from "playwright";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
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

/** `abbruch` liefert einen Fehler, sobald weiteres Warten zwecklos ist. */
async function warteAufServer(url: string, abbruch?: () => Error | undefined, versuche = 120): Promise<void> {
  for (let i = 0; i < versuche; i++) {
    const aus = abbruch?.();
    if (aus) throw aus;
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

/**
 * Der Port muss frei sein, bevor der eigene Server startet — sonst prüft die
 * Suite einen Fremden.
 *
 * Vorgefallen: Ein liegengebliebener `vite preview` aus einem anderen Checkout
 * hielt 5273 besetzt. `--strictPort` ließ den eigenen Server stillschweigend
 * scheitern (stdio: "ignore"), `warteAufServer` bekam vom Fremden eine Antwort
 * und war zufrieden — die ganze Suite lief tagelang gegen einen alten Stand.
 * Ein Szenario stand damit auf Text, den die App längst nicht mehr sagt, und
 * fiel erst auf, als der Fremde zufällig nicht antwortete. Lieber laut
 * abbrechen: Wer bewusst gegen einen laufenden Server prüfen will, setzt
 * EEB_BASE_URL.
 */
async function pruefePortFrei(port: number): Promise<void> {
  // Beide Adressen einzeln: „localhost" löst auf 127.0.0.1 UND ::1 auf, und ein
  // Besetzer auf nur einer der beiden reicht, damit der Browser bei ihm landet.
  for (const host of ["127.0.0.1", "::1"]) {
    await new Promise<void>((frei, fehler) => {
      const test = createServer();
      test.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          fehler(
            new Error(
              `Auf ${host}:${port} antwortet bereits ein Server. Die Verhaltenstests würden gegen dessen ` +
                `Stand laufen statt gegen den frisch gebauten. Den Prozess beenden ` +
                `(lsof -nP -iTCP:${port} -sTCP:LISTEN) oder EEB_BASE_URL setzen, um ihn absichtlich zu nutzen.`,
            ),
          );
        } else if (err.code === "EAFNOSUPPORT" || err.code === "EADDRNOTAVAIL") {
          frei(); // Kein IPv6 auf diesem Rechner — dann kann dort auch niemand lauschen.
        } else {
          fehler(err);
        }
      });
      test.once("listening", () => test.close(() => frei()));
      test.listen(port, host);
    });
  }
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
    await pruefePortFrei(PORT);
    if (MODUS === "preview") await bauen();
    const argumente =
      MODUS === "preview"
        ? ["vite", "preview", "--port", String(PORT), "--strictPort"]
        : ["vite", "--port", String(PORT), "--strictPort"];
    // `detached`: `npx` startet vite als eigenes Kind. Ohne eigene Prozessgruppe
    // erwischt das SIGTERM am Ende nur npx, vite überlebt verwaist und hält den
    // Port — genau so entstand der Fremdserver, gegen den die Suite später lief.
    server = spawn("npx", argumente, { stdio: "ignore", env: process.env, detached: true });
    let gestorben: Error | undefined;
    server.once("exit", (code) => {
      gestorben = new Error(`Der Prüfstand-Server (vite ${MODUS}) endete vorzeitig mit Code ${code}.`);
    });
    await warteAufServer(BASIS_URL, () => gestorben);
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
  // Die ganze Prozessgruppe (negative PID): `npx` allein zu beenden ließe vite
  // verwaist weiterlaufen — siehe die Begründung am `detached` oben.
  if (server?.pid && server.exitCode === null) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM"); // Gruppe schon weg — dann reicht der Einzelne.
    }
  }
});
