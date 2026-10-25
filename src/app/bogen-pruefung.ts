/**
 * Pflichtfelder eines Bogens prüfen und, wo es harmlos ist, ergänzen (Audit
 * Runde 5, R5-E1).
 *
 * Die App liest an vielen Stellen `einheit.einheitsTyp.code`,
 * `hierarchie[0]`, `fahrzeuge.length` oder `person.funktionen.length` ohne
 * Prüfung — der Codec und der Assistent liefern diese Felder immer. Eine
 * Einsatz-Datei, ein Entwurf oder ein Einzelbogen aus anderer Quelle (von Hand
 * bearbeitet, anderes Werkzeug, Zwischenstand) tat es nicht: Ein Bogen ohne
 * `einheitsTyp` machte die Startseite weiß, weil sie die Summen über alle
 * Sammlungen rechnet, und die Sammlung stand schon im Speicher — die App
 * blieb dauerhaft weiß.
 *
 * Darum prüfen die Eingänge (Einsatz-Datei, Bögen einlesen, Aus Datei laden,
 * Entwurf fortsetzen) mit dieser Datei:
 *
 * - **ergänzen**, was sich ehrlich leer lassen lässt: fehlender Einheitstyp
 *   (leer = „nicht gesetzt", die Oberfläche kennt den Zustand), fehlende
 *   Listen (Fahrzeuge, Funktionen, Kontakte …), fehlende Namen;
 * - **ablehnen mit Ursache**, was sich nicht erfinden lässt: Organisation,
 *   Stand, Einsatzzeitraum, Personenliste, Erfassungsart.
 *
 * Geprüft wird in dem Objekt selbst (wie `migriereBogen`).
 */

import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  SCHEMA_VERSION,
  StaerkeRolle,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";

function istObjekt(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function istZahl(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

export type BogenBefund =
  | { ok: true; bogen: Erfassungsbogen; ergaenzt: string[] }
  | { ok: false; ursache: string };

/**
 * Prüft `x` als Erfassungsbogen. Ergänzbares wird im Objekt ergänzt und in
 * `ergaenzt` benannt; Unbrauchbares ergibt `ok: false` mit einem Satz, der
 * sagt, was fehlt. Prüft nicht die Schema-Version-Grenzen — die kennen die
 * Aufrufer (neuere Version ist ein eigener Fall mit eigenem Text).
 */
export function bogenBefund(x: unknown): BogenBefund {
  if (!istObjekt(x)) return { ok: false, ursache: "kein Bogen" };
  const b = x as Record<string, unknown>;
  if (!istZahl(b.schemaVersion)) return { ok: false, ursache: "die Schema-Version fehlt" };
  if (!istZahl(b.stand)) return { ok: false, ursache: "der Stand (Zeitpunkt der letzten Änderung) fehlt" };
  if (!istObjekt(b.einheit)) return { ok: false, ursache: "die Einheit fehlt" };
  const einheit = b.einheit;
  if (!istZahl(einheit.organisation)) return { ok: false, ursache: "die Organisation der Einheit fehlt" };
  if (!istObjekt(b.einsatz)) return { ok: false, ursache: "die Angaben zum Einsatz fehlen" };
  const einsatz = b.einsatz;
  if (!istZahl(einsatz.zeitraumVon) || !istZahl(einsatz.zeitraumBis)) {
    return { ok: false, ursache: "der Einsatzzeitraum fehlt" };
  }
  if (!istZahl(b.personalErfassung)) return { ok: false, ursache: "die Erfassungsart (vollständig oder nur Stärke) fehlt" };
  if (!Array.isArray(b.personal)) return { ok: false, ursache: "die Personenliste fehlt" };

  const ergaenzt = new Set<string>();
  const merke = (s: string) => ergaenzt.add(s);

  // Einheit
  if (!istObjekt(einheit.einheitsTyp)) {
    einheit.einheitsTyp = {};
    merke("Einheitstyp (leer gesetzt)");
  }
  if (!Array.isArray(einheit.hierarchie)) {
    einheit.hierarchie = [];
    merke("Zugehörigkeit (leer gesetzt)");
  }
  const hierarchie = einheit.hierarchie as unknown[];
  einheit.hierarchie = hierarchie
    .filter((e) => {
      const ok = istObjekt(e);
      if (!ok) merke("unlesbare Ebene der Zugehörigkeit entfernt");
      return ok;
    })
    .map((e) => {
      const ebene = e as Record<string, unknown>;
      if (!istObjekt(ebene.bezeichnung)) {
        ebene.bezeichnung = {};
        merke("Bezeichnung einer Ebene (leer gesetzt)");
      }
      if (typeof ebene.name !== "string") {
        ebene.name = "";
        merke("Name einer Ebene (leer gesetzt)");
      }
      return ebene;
    });
  if (einheit.organisationName != null && typeof einheit.organisationName !== "string") delete einheit.organisationName;
  if (einheit.standortRef != null && !istZahl(einheit.standortRef)) delete einheit.standortRef;

  // Einsatz
  if (typeof einsatz.ortAuftrag !== "string") {
    einsatz.ortAuftrag = "";
    merke("Einsatzort/Auftrag (leer gesetzt)");
  }
  if (einsatz.einsatzbeginn != null && !istZahl(einsatz.einsatzbeginn)) delete einsatz.einsatzbeginn;
  if (einsatz.einsatzende != null && !istZahl(einsatz.einsatzende)) delete einsatz.einsatzende;

  // Personal
  const personal = (b.personal as unknown[]).filter((p) => {
    const ok = istObjekt(p);
    if (!ok) merke("unlesbare Person entfernt");
    return ok;
  }) as Record<string, unknown>[];
  for (const p of personal) {
    if (typeof p.nachname !== "string") {
      p.nachname = "";
      merke("Namen (leer gesetzt)");
    }
    if (typeof p.vorname !== "string") p.vorname = "";
    if (!istZahl(p.staerkeRolle)) {
      p.staerkeRolle = StaerkeRolle.MANNSCHAFT;
      merke("Rolle einer Person (Mannschaft angenommen)");
    }
    if (!istZahl(p.fahrerlaubnis)) p.fahrerlaubnis = Fahrerlaubnis.NONE;
    if (!istZahl(p.geschlecht)) {
      p.geschlecht = Geschlecht.D;
      merke("Geschlecht einer Person (leer gesetzt)");
    }
    if (!istZahl(p.ernaehrung)) p.ernaehrung = Ernaehrung.FLEISCH;
    for (const feld of ["funktionen", "kontakte", "zusatzqualifikationen"] as const) {
      if (!Array.isArray(p[feld])) {
        p[feld] = [];
        merke("Listen einer Person (leer gesetzt)");
      }
    }
    if (p.weitereFahrerlaubnisse != null && !Array.isArray(p.weitereFahrerlaubnisse)) delete p.weitereFahrerlaubnisse;
  }
  b.personal = personal;

  // Fahrzeuge
  if (!Array.isArray(b.fahrzeuge)) {
    b.fahrzeuge = [];
    merke("Fahrzeugliste (leer gesetzt)");
  }
  b.fahrzeuge = (b.fahrzeuge as unknown[])
    .filter((f) => {
      const ok = istObjekt(f);
      if (!ok) merke("unlesbares Fahrzeug entfernt");
      return ok;
    })
    .map((f) => {
      const fz = f as Record<string, unknown>;
      if (!istObjekt(fz.typ)) {
        fz.typ = {};
        merke("Fahrzeugtyp (leer gesetzt)");
      }
      return fz;
    });

  // Optionales, das nur mit brauchbarem Inhalt bleibt
  if (b.sofortbedarf != null) {
    const sb = b.sofortbedarf;
    if (
      !istObjekt(sb) ||
      !istZahl(sb.verpflegungPersonen) ||
      !istZahl(sb.dieselLiter) ||
      !istZahl(sb.benzinLiter) ||
      !istZahl(sb.gemischLiter)
    ) {
      delete b.sofortbedarf;
      merke("Sofortbedarf (unlesbar, entfernt)");
    } else {
      sb.unterbringung = sb.unterbringung === true;
      sb.ruhezeitErforderlich = sb.ruhezeitErforderlich === true;
    }
  }
  for (const feld of ["staerkeManuell"] as const) {
    const s = b[feld];
    if (s != null && !(istObjekt(s) && istZahl(s.fuehrer) && istZahl(s.unterfuehrer) && istZahl(s.mannschaft) && istZahl(s.gesamt))) {
      delete b[feld];
      merke("Stärkeangabe (unlesbar, entfernt)");
    }
  }
  const mwd = b.unterbringungManuell;
  if (mwd != null && !(istObjekt(mwd) && istZahl(mwd.m) && istZahl(mwd.w) && istZahl(mwd.d))) {
    delete b.unterbringungManuell;
    merke("Aufteilung nach Geschlecht (unlesbar, entfernt)");
  }
  const vm = b.verpflegungManuell;
  if (vm != null && !(istObjekt(vm) && istZahl(vm.vegetarisch) && istZahl(vm.vegan))) {
    delete b.verpflegungManuell;
    merke("Verpflegungsaufteilung (unlesbar, entfernt)");
  }
  if (b.sonstiges != null && typeof b.sonstiges !== "string") delete b.sonstiges;
  if (b.uebung != null && typeof b.uebung !== "boolean") delete b.uebung;

  return { ok: true, bogen: b as unknown as Erfassungsbogen, ergaenzt: [...ergaenzt] };
}

/** Passt die Schema-Version in den Bereich, den diese App liest? */
export function schemaLesbar(x: unknown): boolean {
  const v = (x as { schemaVersion?: unknown } | null)?.schemaVersion;
  return istZahl(v) && v >= 2 && v <= SCHEMA_VERSION;
}

/** „der Einheitstyp fehlt" → Satzanfang groß. */
export function ursacheSatz(ursache: string): string {
  return ursache.charAt(0).toUpperCase() + ursache.slice(1);
}
