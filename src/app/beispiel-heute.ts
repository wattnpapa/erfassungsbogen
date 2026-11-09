/**
 * Beispielbögen auf heute stellen (Prüfrunde Beispielbögen, BB-W5, BB-K6, BB-H6,
 * BB-N4, BB-E9, BB-A8).
 *
 * Die Beispiele tragen den Einsatzzeitraum und Stand, an dem sie erzeugt
 * wurden (2024 bis September 2026). Geöffnet, als PDF oder in einer
 * Übungs-Sammlung meldete die App deshalb „Stand vor 50 Tagen", „Zeitraum
 * vorbei" und „Tippfehler im Jahr?" — eine Übung voller Warnungen, die nichts
 * mit der Übung zu tun haben. Beim Weitergeben aus dem Dialog rückt der
 * Zeitraum deshalb mit gleicher Dauer auf heute, der Stand auf jetzt. Ein
 * laufender oder künftiger Zeitraum bleibt, wie er ist.
 *
 * Bewusst ohne Vokabular- oder Kern-Importe außer dem Format (Startbündel).
 */

import { zeitraumIso, zeitraumIsoLesen, type EebDatum, type EebZeitpunkt, type Erfassungsbogen } from "@bos/eeb-format/model";

function isoSchieben(iso: string | undefined, tage: number): string | undefined {
  if (iso == null) return iso;
  const z = zeitraumIsoLesen(iso);
  return z ? zeitraumIso({ ...z, tag: z.tag + tage }) : iso;
}

export function beispielAufHeute(b: Erfassungsbogen, heute: EebDatum, stand: EebZeitpunkt): Erfassungsbogen {
  const e = b.einsatz;
  const tage = e.zeitraumBis < heute ? heute - e.zeitraumVon : 0;
  if (tage === 0) return { ...b, stand };
  const { zeitraumVonIso, zeitraumBisIso, ...rest } = e;
  const vonIso = isoSchieben(zeitraumVonIso, tage);
  const bisIso = isoSchieben(zeitraumBisIso, tage);
  return {
    ...b,
    einsatz: {
      ...rest,
      zeitraumVon: e.zeitraumVon + tage,
      zeitraumBis: e.zeitraumBis + tage,
      ...(vonIso != null ? { zeitraumVonIso: vonIso } : {}),
      ...(bisIso != null ? { zeitraumBisIso: bisIso } : {}),
    },
    stand,
  };
}
