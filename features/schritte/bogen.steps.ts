import { Given, When, Then } from "@cucumber/cucumber";
import type { EebWelt } from "../support/welt";
import { V2_FRAGMENT } from "../fixtures";

// Sichtbarkeit als Zusicherung: locator.waitFor wirft bei Zeitüberschreitung,
// d. h. „nicht sichtbar“ lässt den Schritt (und damit das Szenario) fehlschlagen.
async function sichtbar(welt: EebWelt, text: string): Promise<void> {
  await welt.page.getByText(text).first().waitFor({ state: "visible" });
}

Given("ich öffne die App", async function (this: EebWelt) {
  await this.oeffneApp();
});

Given("ich öffne einen geteilten Bogen-Link eines alten Bogens", async function (this: EebWelt) {
  await this.oeffneApp(V2_FRAGMENT);
});

/** Zweite Meldung derselben Einheit — Grundlage für Folgemeldung und Historie. */
When("ich denselben Bogen-Link erneut öffne", async function (this: EebWelt) {
  await this.oeffneApp(V2_FRAGMENT);
});

Given("ich öffne einen Bogen-Link mit beschädigtem Inhalt", async function (this: EebWelt) {
  await this.oeffneApp("EEB2cZdefekt");
});

/**
 * Der eben geteilte Link, aus der Zwischenablage heraus geöffnet: damit läuft
 * die volle Runde durch Kodierung, Signatur und Empfang — genau das, was sonst
 * der QR-Code zwischen zwei Geräten transportiert.
 */
When("ich den Link aus der Zwischenablage öffne", async function (this: EebWelt) {
  const url = await this.page.evaluate(() => navigator.clipboard.readText());
  if (!url.includes("#")) throw new Error(`Kein Bogen-Link in der Zwischenablage: „${url}"`);
  await this.page.goto(url, { waitUntil: "domcontentloaded" });
});

/**
 * Schaltfläche über ihre volle Beschriftung. Bewusst `exact`: bei Teiltreffern
 * fängt „Löschen" auch „Alle Daten löschen" aus der Fußzeile ein — ein Klick,
 * der nicht gemeint war, ist schlimmer als ein Schritt, der die Beschriftung
 * ausschreiben muss.
 */
function schaltflaeche(welt: EebWelt, name: string) {
  return welt.page.getByRole("button", { name, exact: true });
}

When("ich auf {string} klicke", async function (this: EebWelt, name: string) {
  await schaltflaeche(this, name).click();
});

When("ich in der Vorschlagsliste {string} wähle", async function (this: EebWelt, name: string) {
  // onMouseDown statt Klick: die Liste wählt vor dem blur aus (siehe
  // OvVorschlagFeld in schritte/einheit.tsx).
  await this.page.locator("ul.vorschlaege li").filter({ hasText: name }).first().click();
});

When("ich in der Musterung {string} abwähle", async function (this: EebWelt, name: string) {
  await this.page.locator("label.muster-zeile").filter({ hasText: name }).locator("input").uncheck();
});

When("ich in der Musterung {string} ankreuze", async function (this: EebWelt, name: string) {
  await this.page.locator("label.muster-zeile").filter({ hasText: name }).locator("input").check();
});

When("ich das Feld mit dem Platzhalter {string} mit {string} fülle", async function (
  this: EebWelt,
  platzhalter: string,
  wert: string,
) {
  await this.page.getByPlaceholder(platzhalter).first().fill(wert);
});

/**
 * Die PDF-Vorschau rendert im Browser (pdfmake) und braucht spürbar länger als
 * ein Klick — deshalb ein eigener Schritt mit großzügiger Frist.
 */
When(
  "ich auf {string} klicke und die PDF-Vorschau erscheint",
  { timeout: 60_000 },
  async function (this: EebWelt, name: string) {
    await schaltflaeche(this, name).click();
    await this.page.locator("iframe.pdf-rahmen").waitFor({ state: "visible", timeout: 55_000 });
  },
);

Then("sehe ich das Bild {string}", async function (this: EebWelt, name: string) {
  await this.page.getByRole("img", { name, exact: true }).first().waitFor({ state: "visible" });
});

When("ich zum Schritt {string} wechsle", async function (this: EebWelt, schritt: string) {
  // Die Schrittleiste hängt an den Knopf je nach Bearbeitungsstand noch einen
  // Status an („3. Personal — begonnen"), daher Präfix statt exaktem Namen.
  await this.page
    .getByRole("button", { name: new RegExp(`^${schritt.replace(/\./g, "\\.")}`) })
    .click();
});

/**
 * Der zugängliche Name einer Auswahlliste muss *genau* der Feldname sein.
 *
 * Beschriftet wird über ein umschließendes `<label className="feld">`; ohne
 * eigenes aria-label zählt dort der Text aller <option>-Elemente mit, und das
 * Feld heißt „OrganisationTHWFeuerwehr…". `exact: true` vergleicht den
 * vollständigen Namen — in dem Fall findet dieser Locator nichts.
 */
Then("heißt die Auswahlliste genau {string}", async function (this: EebWelt, name: string) {
  const feld = this.page.getByLabel(name, { exact: true });
  try {
    await feld.first().waitFor({ state: "visible", timeout: 5_000 });
  } catch {
    throw new Error(
      `Keine Auswahlliste heißt „${name}“. Vorhandene Namen: ${await auswahlNamen(this)}`,
    );
  }
  const gefunden = await feld.evaluateAll((el) => el.map((e) => e.tagName.toLowerCase()));
  if (gefunden.length !== 1 || gefunden[0] !== "select") {
    throw new Error(
      `Erwartet: genau eine Auswahlliste namens „${name}“ — gefunden: [${gefunden.join(", ")}]`,
    );
  }
});

/** Namen aller sichtbaren Auswahllisten — nur für die Fehlermeldung oben. */
async function auswahlNamen(welt: EebWelt): Promise<string> {
  const namen = await welt.page.locator("select:visible").evaluateAll((el) =>
    el.map((e) => e.getAttribute("aria-label") ?? e.closest("label")?.textContent ?? "(ohne)"),
  );
  return namen.map((n) => `„${n}“`).join(", ") || "keine";
}

Then("sehe ich die Überschrift {string}", async function (this: EebWelt, text: string) {
  await this.page.getByRole("heading", { name: text }).first().waitFor({ state: "visible" });
});

Then("sehe ich die Schaltfläche {string}", async function (this: EebWelt, name: string) {
  await schaltflaeche(this, name).waitFor({ state: "visible" });
});

Then("sehe ich den Schritt {string}", async function (this: EebWelt, text: string) {
  await this.page.getByRole("heading", { name: text }).waitFor({ state: "visible" });
});

Then("sehe ich die Übersicht mit dem Standort {string}", async function (this: EebWelt, name: string) {
  await this.page.getByRole("heading", { name: "Gesamtübersicht" }).waitFor({ state: "visible" });
  await sichtbar(this, name);
});

Then("sehe ich die Organisation {string}", async function (this: EebWelt, org: string) {
  await sichtbar(this, org);
});

Then("sehe ich den Text {string}", async function (this: EebWelt, text: string) {
  await this.page.getByText(text, { exact: true }).first().waitFor({ state: "visible" });
});

Then("sehe ich die Person {string} in der Personalliste", async function (this: EebWelt, nachname: string) {
  await sichtbar(this, nachname);
});

// ---------------------------------------------------- Eigene Dialoge der App

/** Der offene Dialog — Abfragen der App tragen ihren Titel als aria-label. */
function dialog(welt: EebWelt, titel: string) {
  return welt.page.getByRole("dialog", { name: titel });
}

/** Der zuletzt geöffnete Dialog; „im Dialog"-Schritte beziehen sich darauf. */
function offenerDialog(welt: EebWelt) {
  return welt.page.locator("dialog[open]").last();
}

Then("sehe ich den Dialog {string}", async function (this: EebWelt, titel: string) {
  await dialog(this, titel).waitFor({ state: "visible" });
});

When("ich im Dialog {string} mit {string} fülle", async function (this: EebWelt, feld: string, wert: string) {
  await offenerDialog(this).getByLabel(feld, { exact: true }).fill(wert);
});

When("ich im Dialog {string} auf {string} stelle", async function (this: EebWelt, feld: string, wert: string) {
  await offenerDialog(this).getByLabel(feld, { exact: true }).selectOption({ label: wert });
});

When("ich im Dialog auf {string} klicke", async function (this: EebWelt, name: string) {
  await offenerDialog(this).getByRole("button", { name }).click();
});

When("ich im Dialog den Text {string} eingebe", async function (this: EebWelt, text: string) {
  // Mehrzeilige Eingaben („Namen einfügen") haben keine eigene Beschriftung —
  // der Dialogtitel benennt sie bereits.
  await offenerDialog(this).locator("textarea").fill(text.replaceAll("\\n", "\n"));
});

When("ich im Dialog {string} ankreuze", async function (this: EebWelt, name: string) {
  await offenerDialog(this).getByLabel(name, { exact: true }).check();
});

When("ich im Dialog die Eingabetaste drücke", async function (this: EebWelt) {
  await this.page.keyboard.press("Enter");
});

When("ich den Dialog mit Esc schließe", async function (this: EebWelt) {
  await this.page.keyboard.press("Escape");
});

Then("ist kein Dialog offen", async function (this: EebWelt) {
  await this.page.locator("dialog[open]").waitFor({ state: "detached" });
});

Then("ist im Dialog {string} gesperrt", async function (this: EebWelt, name: string) {
  const knopf = offenerDialog(this).getByRole("button", { name });
  if (!(await knopf.isDisabled())) throw new Error(`„${name}" ist bedienbar, sollte aber gesperrt sein`);
});

Then("sehe ich {string} nicht", async function (this: EebWelt, text: string) {
  await this.page.getByText(text, { exact: true }).waitFor({ state: "hidden" });
});
