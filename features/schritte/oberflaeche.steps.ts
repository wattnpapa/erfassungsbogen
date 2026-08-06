/**
 * Allgemeine Oberflächen-Schritte: klicken, ausfüllen, ankreuzen, prüfen.
 * Fachliche Schritte (Bogen, Dialoge, Einsatz) stehen in bogen.steps.ts.
 *
 * Grundsatz: gewartet wird über `waitFor`/`toPass`-artige Schleifen, nie über
 * feste Pausen — ein `sleep` wäre entweder zu kurz (Flackern) oder zu lang.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { readFile } from "node:fs/promises";
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

// --------------------------------------------------------------- Gerätewelt

/**
 * Systemweites dunkles Design des Geräts. Die App folgt ihm bewusst NICHT
 * (siehe anzeige-modus.ts) — was hier geprüft wird: dass sie darüber nicht in
 * eine halb dunkle Darstellung kippt (dunkle Fläche, schwarze Schrift).
 */
Given("mein Gerät auf dunkles Design eingestellt ist", async function (this: EebWelt) {
  await this.page.emulateMedia({ colorScheme: "dark" });
});

/**
 * Android-Anmutung im Browser — dieselbe Umschaltung, die die Debug-Leiste
 * anbietet. Muss vor dem Öffnen der App stehen: die Plattform-Klasse setzt
 * main.tsx beim Start.
 */
Given("die App sich als Android-App zeigt", async function (this: EebWelt) {
  await this.page.addInitScript(() => {
    localStorage.setItem("eeb-debug", "1");
    localStorage.setItem("eeb-debug-plattform", "android");
  });
});

// ------------------------------------------------------------------ Bedienen

When("ich das Feld {string} mit {string} fülle", async function (this: EebWelt, name: string, wert: string) {
  await feld(this, name).fill(wert);
});

When("ich das Feld {string} auf {string} stelle", async function (this: EebWelt, name: string, wert: string) {
  const el = auswahl(this, name);
  const tag = await el.evaluate((e) => e.tagName.toLowerCase());
  if (tag === "select") {
    await el.selectOption({ label: wert });
    return;
  }
  // Combobox (lange Vokabular-Liste, z. B. Einheitstyp/Fahrzeugtyp): tippen
  // filtert, dann den Vorschlag anklicken, der den vollen Wert trägt. Ein „–“
  // trennt Kürzel und Name; über den Namen wird eine (B)/(C)-Variante eindeutig.
  const [kurz, ...rest] = wert.split(" – ");
  const name2 = rest.length > 0 ? rest.join(" – ") : wert;
  await el.fill(kurz!);
  await inhalt(this).locator("ul.vorschlaege li").filter({ hasText: name2 }).first().click();
});

When("ich {string} ankreuze", async function (this: EebWelt, name: string) {
  await inhalt(this).getByLabel(name, { exact: true }).check();
});

// Reines Antippen/Fokussieren eines Feldes (ohne zu tippen) — für die
// Auswahl-Combobox, die ihre Liste schon auf Tap öffnen soll.
When("ich das Feld {string} anklicke", async function (this: EebWelt, name: string) {
  await auswahl(this, name).click();
});

Then("ist {string} ausgewählt", async function (this: EebWelt, name: string) {
  const feld = inhalt(this).getByLabel(name, { exact: true });
  await bisWahr(async () => {
    if (!(await feld.isChecked())) throw new Error(`„${name}" ist nicht ausgewählt`);
  });
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

/**
 * Datei-Eingaben stecken in einem `<label className="datei-knopf">`; das
 * `<input type="file">` darin ist nur fürs Auge weg (.nur-sr), damit der Knopf
 * in der Tabfolge bleibt. Angesprochen wird es über die Beschriftung des
 * Labels — also über das, was auch auf dem Knopf steht.
 */
export function dateiKnopf(welt: EebWelt, beschriftung: string): Locator {
  return welt.page
    .locator("label.datei-knopf")
    .filter({ hasText: beschriftung })
    .locator("input[type=file]")
    .first();
}

const MIME_TYPEN: Record<string, string> = {
  json: "application/json",
  pdf: "application/pdf",
  csv: "text/csv",
};

/**
 * Der Gegenweg zum Download: die eben erzeugte Datei wieder einlesen. Erst
 * damit ist eine Sicherung eine Sicherung und eine Sammel-PDF ein Transport —
 * eine Datei, die nur entsteht und nie wieder ankommt, belegt nichts.
 *
 * Bewusst mit dem vorgeschlagenen Dateinamen statt mit dem Pfad aus dem
 * Download-Verzeichnis: der ist eine endungslose UUID, und die App entscheidet
 * an der Endung, ob in der Datei eine Sammlung oder eine Sicherung steckt.
 */
When(
  "ich die zuletzt erhaltene Datei über {string} einlese",
  { timeout: 60_000 },
  async function (this: EebWelt, beschriftung: string) {
    const datei = this.downloads[this.downloads.length - 1];
    if (!datei) throw new Error("In diesem Szenario wurde noch keine Datei heruntergeladen.");
    const pfad = await datei.path();
    if (!pfad) throw new Error(`Download „${datei.suggestedFilename()}" liegt nicht auf der Platte.`);
    const name = datei.suggestedFilename();
    const endung = name.split(".").pop()?.toLowerCase() ?? "";
    await dateiKnopf(this, beschriftung).setInputFiles({
      name,
      mimeType: MIME_TYPEN[endung] ?? "application/octet-stream",
      buffer: await readFile(pfad),
    });
  },
);

/**
 * Netz weg — der Normalfall im Einsatz, nicht die Ausnahme. Vorher muss der
 * Service Worker aktiv sein: er ist es, der die App danach aus dem Cache
 * ausliefert. Ohne das Warten prüfte der Test nur, wie schnell der Browser ist.
 */
When("ich die App vom Netz trenne", async function (this: EebWelt) {
  await this.page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await this.page.context().setOffline(true);
});

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

/**
 * Datei-Eingaben tragen ihre Beschriftung am umschließenden `<label>`, nicht an
 * einer Schaltfläche — „sehe ich die Schaltfläche" greift für sie nicht. Geprüft
 * wird das Label: das `<input>` darin ist für das Auge weggeblendet (.nur-sr).
 */
Then("sehe ich den Datei-Knopf {string}", async function (this: EebWelt, beschriftung: string) {
  await this.page
    .locator("label.datei-knopf")
    .filter({ hasText: beschriftung })
    .first()
    .waitFor({ state: "visible" });
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

/**
 * Jeder sichtbare Text muss sich in der Helligkeit von seiner tatsächlichen
 * Fläche unterscheiden. Bewusst keine Kontrastzahl nach WCAG: gemessen wird
 * gegen den einen Fehler, der eine Oberfläche unbenutzbar macht — dunkler
 * Hintergrund mit dunkler Schrift (oder umgekehrt). Absichtlich
 * zurücktretende Hinweistexte (--text-3) bleiben so heil, ein halb
 * angewandtes Dunkel fällt durch.
 */
/**
 * Bewusst als Zeichenkette an den Browser gegeben statt als Funktion: der
 * tsx-Loader übersetzt Pfeilfunktionen mit einem `__name`-Helfer, den es in der
 * Seite nicht gibt — eine so übergebene Funktion stirbt dort sofort.
 */
const HELLIGKEITS_PRUEFUNG = `(() => {
  const zuRgb = (wert) => {
    const z = (wert.match(/[\\d.]+/g) || []).map(Number);
    return [z[0] || 0, z[1] || 0, z[2] || 0, z[3] === undefined ? 1 : z[3]];
  };
  // Relative Helligkeit nach WCAG 2.1 (mit Gamma-Korrektur).
  const helligkeit = (f) => {
    const k = [f[0], f[1], f[2]].map((v) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  };
  // Fläche, auf der ein Element tatsächlich liegt — durchsichtige Eltern übersprungen.
  const flaeche = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const f = zuRgb(getComputedStyle(e).backgroundColor);
      if (f[3] > 0.5) return f;
    }
    return [255, 255, 255, 1];
  };
  const maengel = [];
  for (const el of document.querySelectorAll("#app *")) {
    if (!(el instanceof HTMLElement) || el.offsetParent === null) continue;
    // Nur Elemente mit eigenem Text; Container erben ihre Farbe ohnehin.
    const eigen = Array.from(el.childNodes)
      .filter((k) => k.nodeType === 3)
      .map((k) => (k.textContent || "").trim())
      .join(" ")
      .trim();
    if (eigen === "") continue;
    const text = zuRgb(getComputedStyle(el).color);
    if (text[3] < 0.5) continue; // absichtlich ausgeblendet
    const abstand = Math.abs(helligkeit(text) - helligkeit(flaeche(el)));
    if (abstand < 0.2) {
      maengel.push({
        text: eigen.slice(0, 40),
        auswahl: el.tagName.toLowerCase() + "." + (el.className || "(ohne Klasse)"),
        abstand: Math.round(abstand * 1000) / 1000,
      });
    }
  }
  return maengel;
})()`;

Then("hebt sich jeder Text von seiner Fläche ab", async function (this: EebWelt) {
  const treffer: { text: string; auswahl: string; abstand: number }[] =
    await this.page.evaluate(HELLIGKEITS_PRUEFUNG);
  if (treffer.length > 0) {
    const liste = treffer.slice(0, 5).map((t) => `„${t.text}“ (${t.auswahl}, Δ${t.abstand})`);
    throw new Error(`${treffer.length} Text(e) gehen in ihrer Fläche unter: ${liste.join("; ")}`);
  }
});

/**
 * Der Kontrastschritt oben prüft Schrift gegen Fläche — er merkt nicht, wenn
 * eine dunkle Darstellung auf heller Fläche liegt und dabei sogar gut lesbar
 * ist. Genau das passierte in der Android-App: Nacht und Feld belegten nur die
 * App-Token, die Plattformpalette blieb hell, und der Nacht-Modus war weiß
 * (Rückmeldung Anwender, August 2026). Gemessen wird deshalb die Grundfläche
 * selbst — sie trägt die ganze Ansicht.
 */
const GRUNDFLAECHE_HELLIGKEIT = `(() => {
  const z = (getComputedStyle(document.body).backgroundColor.match(/[\\d.]+/g) || []).map(Number);
  const k = [z[0] || 0, z[1] || 0, z[2] || 0].map((v) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
})()`;

Then("liegt die App auf dunklem Grund", async function (this: EebWelt) {
  const helligkeit: number = await this.page.evaluate(GRUNDFLAECHE_HELLIGKEIT);
  if (helligkeit > 0.15) {
    throw new Error(`Die Grundfläche ist hell (Helligkeit ${Math.round(helligkeit * 100) / 100}) — der Modus greift nur halb.`);
  }
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
