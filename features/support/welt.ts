import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";
import type { Page } from "playwright";

/**
 * Cucumber-World: pro Szenario neu, hält die Playwright-Seite und die
 * Basis-URL der laufenden Web-App. Browser und Dev-Server werden szenarien-
 * übergreifend in den Haken (support/haken.ts) verwaltet.
 */
export class EebWelt extends World {
  page!: Page;
  readonly basisUrl: string;
  /**
   * Eingebaute JavaScript-Dialoge (prompt/confirm/alert), die während des
   * Szenarios aufgetaucht sind. Jeder Eintrag lässt das Szenario scheitern —
   * siehe die Begründung am Wachhund in support/haken.ts.
   */
  readonly systemdialoge: string[] = [];

  constructor(optionen: IWorldOptions) {
    super(optionen);
    this.basisUrl = process.env.EEB_BASE_URL ?? "http://localhost:5273";
  }

  /** App frisch öffnen; optionales URL-Fragment simuliert einen QR-/Universal-Link. */
  async oeffneApp(fragment = ""): Promise<void> {
    const url = fragment ? `${this.basisUrl}/#${fragment}` : this.basisUrl + "/";
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }
}

setWorldConstructor(EebWelt);
