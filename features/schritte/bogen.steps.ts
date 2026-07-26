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

When("ich auf {string} klicke", async function (this: EebWelt, name: string) {
  await this.page.getByRole("button", { name }).click();
});

Then("sehe ich die Überschrift {string}", async function (this: EebWelt, text: string) {
  await this.page.getByRole("heading", { name: text }).first().waitFor({ state: "visible" });
});

Then("sehe ich die Schaltfläche {string}", async function (this: EebWelt, name: string) {
  await this.page.getByRole("button", { name }).waitFor({ state: "visible" });
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
