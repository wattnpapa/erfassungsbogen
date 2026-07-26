/**
 * Allgemeine Oberflächen-Schritte: klicken, ausfüllen, ankreuzen, prüfen.
 * Fachliche Schritte (Bogen, Dialoge, Einsatz) stehen in bogen.steps.ts.
 *
 * Grundsatz: gewartet wird über `waitFor`/`toPass`-artige Schleifen, nie über
 * feste Pausen — ein `sleep` wäre entweder zu kurz (Flackern) oder zu lang.
 */

import { When, Then } from "@cucumber/cucumber";
import type { Locator } from "playwright";
import type { EebWelt } from "../support/welt";

/** Arbeitsbereich der Seite — schließt Kopf-/Fußzeile und geschlossene Dialoge aus. */
function inhalt(welt: EebWelt): Locator {
  return welt.page.locator("main");
}

/**
 * Bedienelement über seinen zugänglichen Namen — also über das, was auch eine
 * Vorlesesoftware ansagt. Jedes Feld der App trägt genau seinen Feldnamen
 * (`Feld`/`Auswahl` in schritte/bausteine.tsx, geprüft in
 * beschriftungen.feature); ein Freitextfeld neben einer Auswahlliste heißt
 * „<Feldname> (Freitext)". Die Schritte hängen damit an derselben Zusicherung,
 * die auch die Barrierefreiheit trägt — bricht die, brechen sie mit.
 */
function auswahl(welt: EebWelt, name: string): Locator {
  return inhalt(welt).getByLabel(name, { exact: true }).first();
}

/**
 * Eingabefeld über sein umschließendes <label>, dessen Text mit dem Feldnamen
 * beginnt. Nicht über den zugänglichen Namen wie bei den Auswahllisten: der
 * ändert sich bei einem gefüllten Textfeld im Label mit dem Inhalt mit, und
 * ein Schritt, der nur bei leerem Feld greift, ist keiner.
 *
 * `.first()`: dieselbe Beschriftung wiederholt sich je Zeile/Karte (drei
 * Zugehörigkeits-Ebenen haben drei „Kürzel"). Gemeint ist immer die erste —
 * die unterste Ebene bzw. die zuerst angelegte Person.
 */
function feld(welt: EebWelt, name: string): Locator {
  const anfang = new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return inhalt(welt)
    .locator("label")
    .filter({ hasText: anfang })
    .locator("input:not([type=checkbox]):not([type=radio]), textarea")
    .first();
}

/** Wartet, bis `pruefung` ohne Ausnahme durchläuft (Standard: 10 s). */
async function bisWahr(pruefung: () => Promise<void>, dauerMs = 10_000): Promise<void> {
  const ende = Date.now() + dauerMs;
  for (;;) {
    try {
      await pruefung();
      return;
    } catch (fehler) {
      if (Date.now() > ende) throw fehler;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

// ------------------------------------------------------------------ Bedienen

When("ich das Feld {string} mit {string} fülle", async function (this: EebWelt, name: string, wert: string) {
  await feld(this, name).fill(wert);
});

When("ich das Feld {string} auf {string} stelle", async function (this: EebWelt, name: string, wert: string) {
  await auswahl(this, name).selectOption({ label: wert });
});

When("ich {string} ankreuze", async function (this: EebWelt, name: string) {
  await inhalt(this).getByLabel(name, { exact: true }).check();
});

When("ich {string} abwähle", async function (this: EebWelt, name: string) {
  await inhalt(this).getByLabel(name, { exact: true }).uncheck();
});

/** Den Umschalter gibt es zweimal (Kopf- und Fußzeile) — gemeint ist der obere. */
When("ich den Anzeigemodus {string} wähle", async function (this: EebWelt, name: string) {
  await this.page.locator(".anzeige-schalter").first().getByRole("button", { name, exact: true }).click();
});

When("ich die Seite neu lade", async function (this: EebWelt) {
  await this.page.reload({ waitUntil: "domcontentloaded" });
});

/**
 * Klick, der einen Download auslöst. Bewusst ein eigener Schritt: ohne das
 * Abwarten des Download-Ereignisses liefe das Szenario weiter, bevor die Datei
 * überhaupt entstanden ist.
 */
When(
  "ich auf {string} klicke und eine Datei erhalte",
  { timeout: 60_000 },
  async function (this: EebWelt, name: string) {
    const download = this.page.waitForEvent("download", { timeout: 55_000 });
    await this.page.getByRole("button", { name, exact: true }).click();
    await download;
  },
);

When("ich in der Schnelltabelle Zeile {int} auf {string} setze", async function (
  this: EebWelt,
  zeile: number,
  wert: string,
) {
  const zellen = this.page.locator("table.schnell-tabelle tbody tr").nth(zeile - 1).locator("td");
  await zellen.nth(0).locator("input").fill(wert);
});

When("ich in der Schnelltabelle in Zeile {int} die Eingabetaste drücke", async function (this: EebWelt, zeile: number) {
  const zelle = this.page.locator("table.schnell-tabelle tbody tr").nth(zeile - 1).locator("td").first();
  await zelle.locator("input").press("Enter");
});

// ------------------------------------------------------------------- Prüfen

Then("sehe ich den Hinweis {string}", async function (this: EebWelt, text: string) {
  await this.page.getByText(text).first().waitFor({ state: "visible" });
});

Then("sehe ich den Hinweis {string} nicht", async function (this: EebWelt, text: string) {
  await this.page.getByText(text).first().waitFor({ state: "hidden" });
});

Then("steht im Feld {string} der Wert {string}", async function (this: EebWelt, name: string, wert: string) {
  await bisWahr(async () => {
    const ist = await feld(this, name).inputValue();
    if (ist !== wert) throw new Error(`Feld „${name}" enthält „${ist}", erwartet war „${wert}"`);
  });
});

Then("ist die Schaltfläche {string} gesperrt", async function (this: EebWelt, name: string) {
  const knopf = this.page.getByRole("button", { name, exact: true });
  await bisWahr(async () => {
    if (!(await knopf.isDisabled())) throw new Error(`„${name}" ist bedienbar, sollte aber gesperrt sein`);
  });
});

Then("ist die Schaltfläche {string} bedienbar", async function (this: EebWelt, name: string) {
  const knopf = this.page.getByRole("button", { name, exact: true });
  await bisWahr(async () => {
    if (await knopf.isDisabled()) throw new Error(`„${name}" ist gesperrt, sollte aber bedienbar sein`);
  });
});

Then("sehe ich die Schaltfläche {string} nicht", async function (this: EebWelt, name: string) {
  await this.page.getByRole("button", { name, exact: true }).waitFor({ state: "hidden" });
});

Then("ist der Anzeigemodus {string} aktiv", async function (this: EebWelt, name: string) {
  await bisWahr(async () => {
    const gedrueckt = await this.page
      .locator(".anzeige-schalter")
      .first()
      .getByRole("button", { name, exact: true })
      .getAttribute("aria-pressed");
    if (gedrueckt !== "true") throw new Error(`Anzeigemodus „${name}" ist nicht aktiv (aria-pressed=${gedrueckt})`);
  });
});

Then("heißt die heruntergeladene Datei wie {string}", async function (this: EebWelt, muster: string) {
  await bisWahr(async () => {
    const namen = this.downloads.map((d) => d.suggestedFilename());
    // „*" als einziger Platzhalter — mehr braucht es für Dateinamen nicht.
    const regex = new RegExp("^" + muster.split("*").map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    if (!namen.some((n) => regex.test(n))) {
      throw new Error(`Kein Download passt auf „${muster}" — vorhanden: ${namen.join(", ") || "(keiner)"}`);
    }
  });
});

Then("liegt der Bogen-Link in der Zwischenablage", async function (this: EebWelt) {
  await bisWahr(async () => {
    const text = await this.page.evaluate(() => navigator.clipboard.readText());
    if (!text.includes("#")) throw new Error(`Zwischenablage enthält keinen Bogen-Link: „${text}"`);
  });
});
