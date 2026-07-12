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

Then("sehe ich die Übersicht mit der Einheit {string}", async function (this: EebWelt, name: string) {
  await this.page.getByRole("heading", { name: "Gesamtübersicht" }).waitFor({ state: "visible" });
  await sichtbar(this, name);
});

Then("sehe ich die Organisation {string}", async function (this: EebWelt, org: string) {
  await sichtbar(this, org);
});

Then("sehe ich die Person {string} in der Personalliste", async function (this: EebWelt, nachname: string) {
  await sichtbar(this, nachname);
});
