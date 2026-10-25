/**
 * Abgleich zwischen zwei Fenstern derselben App (Audit Runde 2, R2-O4).
 *
 * Auf Telefonen geht ein geteilter Link oft im Browser auf, während die App
 * schon offen ist. Bisher überschrieben sich die Fenster still: Beide meldeten
 * „gespeichert", im Speicher stand, wer zuletzt tippte. Und eine offene
 * Sammlungsansicht zeigte eine zu kleine Stärke, bis dort jemand etwas tat.
 *
 * Das `storage`-Ereignis meldet Änderungen aus anderen Fenstern desselben
 * Ursprungs:
 * - Einsatz-Sammlungen: sofort neu einlesen — die Sammlung schreibt je
 *   Handlung frisch aus dem Speicher, dort geht nichts verloren; es fehlte nur
 *   die Anzeige.
 * - Entwurf: Ist hier ein Bogen offen und steht im Speicher ein anderer Stand
 *   als der, den dieses Fenster zuletzt schrieb, speichert dieses Fenster nicht
 *   mehr (entwurf.ts) und fragt: Stand aus dem anderen Fenster laden oder die
 *   eigene Fassung behalten.
 *
 * Runde 4 (R4-S4): „Meine Fassung behalten" klang wie die sichere Wahl,
 * verwarf aber den Stand des anderen Fensters ohne Rückholplatz. Jetzt kommt
 * der andere Stand auf den Rückholplatz, wie es „Neuen Bogen erstellen" im
 * anderen Fenster schon tat; ginge dabei etwas endgültig verloren, fragt das
 * Fenster vorher und nennt es. Die Warnung nennt den anderen Stand, und
 * „Stand aus dem anderen Fenster laden" kehrt in den Bogen zurück statt auf
 * die Startseite.
 */

import { useEffect, useRef, useState } from "react";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import {
  ENTWURF_SCHLUESSEL,
  entwurfAusAnderemFenster,
  entwurfEigenerStandUm,
  entwurfFremdEntfernt,
  entwurfFremdGeaendert,
  entwurfKonfliktAbonnieren,
  entwurfUeberschreibenErlauben,
  ersetztenEntwurfLaden,
  ersetztenEntwurfMerken,
  rueckholungNimmt,
  type Entwurf,
  type KonfliktArt,
} from "./entwurf";
import { FesteWarnung } from "./feste-warnung";
import { bogenHatInhalt, einheitAnzeigename } from "./hilfen";
import { frageJaNein } from "./dialoge";
import { zeitpunktZuMs } from "./eintrag-zeiten";
import { unterschiedText, zeitMitSekunden } from "./fenster-unterschied";

/**
 * Merker in der Sitzung: Nach „Stand aus dem anderen Fenster laden" öffnet
 * die neu geladene App den Bogen direkt, statt auf der Startseite einen
 * zusätzlichen Tipp auf „Fortsetzen" zu verlangen (R4-S4).
 */
export const NACH_ABGLEICH_SCHLUESSEL = "eeb.abgleich.fortsetzen";

/** Einmal lesen und löschen: Kam diese Seite aus „Stand aus dem anderen Fenster laden"? */
export function nachAbgleichFortsetzen(): boolean {
  try {
    const da = sessionStorage.getItem(NACH_ABGLEICH_SCHLUESSEL) === "1";
    if (da) sessionStorage.removeItem(NACH_ABGLEICH_SCHLUESSEL);
    return da;
  } catch {
    return false;
  }
}

function gleich(a: Erfassungsbogen | null | undefined, b: Erfassungsbogen | null | undefined): boolean {
  return !!a && !!b && JSON.stringify(a) === JSON.stringify(b);
}

function zeitKurz(e: Entwurf): string {
  return new Date(e.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

/** Letzte Änderung eines Bogens als Uhrzeit — die Wandzeit steht im Bogen selbst. */
function standKurz(b: Erfassungsbogen): string {
  return new Date(zeitpunktZuMs(b.stand)).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function personenText(b: Erfassungsbogen): string {
  const n = b.personal.length;
  return `${n} ${n === 1 ? "Person" : "Personen"}`;
}

const EINSAETZE_SCHLUESSEL = "eeb.einsaetze.v1";

/** So heißt der Rückholplatz auf der Startseite (Audit Runde 7, R7-N4). */
const ZULETZT_GESCHLOSSEN = "Zuletzt geschlossener Bogen";

/** „; anders: Ort / Auftrag" — leer, wenn der Bogen sich inhaltlich nicht unterscheidet. */
function unterschiedFuer(hier: Erfassungsbogen, dort: Erfassungsbogen, vorsatz = "; anders: "): string {
  // In den Rückfragen mit den Werten beider Fassungen (R8-N6); die Leiste bleibt bei den Namen der Felder.
  const t = unterschiedText(hier, dort, 4, { werte: true });
  return t ? `${vorsatz}${t}` : "";
}

export interface FensterAbgleich {
  /** Ein anderes Fenster hat den offenen Bogen geändert oder gelöscht; hier wird nicht gespeichert. */
  konflikt: boolean;
  /** Was das andere Fenster tat (R5-D3: auch „entfernt" — „Alle Daten löschen", Bogen geschlossen). */
  art: KonfliktArt | null;
  /** Zählt jede Entscheidung „behalten" hoch — gehört in die Abhängigkeiten des Autosave. */
  runde: number;
  /** Der offene Bogen dieses Fensters (für die Warnung, die beide Stände nennt). */
  eigenerBogen?: () => Erfassungsbogen | null;
  /**
   * Eigene Fassung behalten: Der Stand des anderen Fensters kommt auf den
   * Rückholplatz, die eigene Fassung überschreibt beim nächsten Speichern.
   */
  behalten: () => Promise<void>;
  /**
   * Stand aus dem anderen Fenster übernehmen: die App lädt neu und öffnet den
   * gespeicherten Entwurf. Hat dieses Fenster eigene, ungespeicherte Änderungen,
   * fragt es vorher und legt sie auf den Rückholplatz.
   */
  neuLaden: () => Promise<void>;
}

export function useFensterAbgleich(
  bogenOffen: boolean,
  onEinsaetze: () => void,
  opt: {
    /** Der offene Bogen dieses Fensters — gleicht der andere Stand ihm, ist nichts zu retten. */
    eigenerBogen?: () => Erfassungsbogen | null;
    /** Der Rückholplatz hat sich geändert (Startseite neu lesen). */
    onRueckholung?: () => void;
    /** Das andere Fenster hat den ganzen Speicher geleert und hier ist kein Bogen offen (Vorgabe: Seite neu laden). */
    beiAllesGeloescht?: () => void;
  } = {},
): FensterAbgleich {
  const [konflikt, setKonflikt] = useState<KonfliktArt | null>(null);
  const [runde, setRunde] = useState(0);
  const offen = useRef(bogenOffen);
  offen.current = bogenOffen;
  const einsaetze = useRef(onEinsaetze);
  einsaetze.current = onEinsaetze;
  const optRef = useRef(opt);
  optRef.current = opt;

  useEffect(() => {
    const abmelden = entwurfKonfliktAbonnieren((art) => setKonflikt(art));
    function beiSpeicher(e: StorageEvent) {
      // key === null: das andere Fenster hat den ganzen Speicher geleert.
      if (e.key === null || e.key === EINSAETZE_SCHLUESSEL) einsaetze.current();
      // „Alle Daten löschen" im anderen Fenster: Die Startseite hier hielte
      // Vorlagen, Entwurf und Rückholplatz weiter im Arbeitsspeicher und
      // schriebe sie über „Bogen anlegen" zurück (Audit Runde 6, R6-D1). Ohne
      // offenen Bogen gibt es hier nichts, was verloren ginge: neu aufbauen.
      if (e.key === null && !offen.current) (optRef.current.beiAllesGeloescht ?? (() => window.location.reload()))();
      if ((e.key === null || e.key === ENTWURF_SCHLUESSEL) && offen.current) {
        if (entwurfFremdGeaendert()) setKonflikt("geaendert");
        else if (entwurfFremdEntfernt()) setKonflikt("entfernt");
      }
    }
    window.addEventListener("storage", beiSpeicher);
    return () => {
      abmelden();
      window.removeEventListener("storage", beiSpeicher);
    };
  }, []);

  // Ohne offenen Bogen gibt es nichts zu entscheiden.
  useEffect(() => {
    if (!bogenOffen) setKonflikt(null);
  }, [bogenOffen]);

  return {
    konflikt: konflikt != null && bogenOffen,
    art: bogenOffen ? konflikt : null,
    runde,
    eigenerBogen: () => optRef.current.eigenerBogen?.() ?? null,
    behalten: async () => {
      if (konflikt === "entfernt") {
        // Das andere Fenster hat den Entwurf gelöscht; „behalten" schreibt ihn
        // bewusst zurück. Rückholplatz gibt es dabei nichts zu retten.
        entwurfUeberschreibenErlauben();
        setKonflikt(null);
        setRunde((r) => r + 1);
        return;
      }
      const anderes = entwurfAusAnderemFenster();
      const eigener = optRef.current.eigenerBogen?.() ?? null;
      if (anderes && bogenHatInhalt(anderes.bogen) && !gleich(anderes.bogen, eigener)) {
        const name = einheitAnzeigename(anderes.bogen.einheit);
        const anderesStand = `Stand ${zeitMitSekunden(anderes.gespeichert)}`;
        const unterschied = eigener ? unterschiedFuer(eigener, anderes.bogen) : "";
        const alt = ersetztenEntwurfLaden();
        const nimmt = rueckholungNimmt(!!anderes.fremd, alt);
        // Was dort liegt und nicht ohnehin einer der beiden Stände ist, fiele weg.
        const altFaellt =
          nimmt && !!alt && bogenHatInhalt(alt.bogen) && !gleich(alt.bogen, anderes.bogen) && !gleich(alt.bogen, eigener);
        // Die Rückfrage trägt, was die Daueranzeige nicht mehr sagt: wohin der
        // andere Stand kommt (R5-S4) — und, wenn dabei etwas fiele, was.
        {
          const ja = await frageJaNein({
            titel: "Meine Fassung behalten?",
            text: !nimmt
              ? `Die Erfassung „${name}" aus dem anderen Fenster (${anderesStand}${unterschied}) geht dabei verloren — unter „${ZULETZT_GESCHLOSSEN}" liegt dein eigener Bogen „${einheitAnzeigename(alt!.bogen.einheit)}", und der bleibt.`
              : altFaellt
                ? `„${name}" aus dem anderen Fenster (${anderesStand}${unterschied}) kommt unter „${ZULETZT_GESCHLOSSEN}". Der dort bisher liegende Bogen „${einheitAnzeigename(alt!.bogen.einheit)}" (Stand ${zeitKurz(alt!)} Uhr) wird dabei endgültig gelöscht.`
                : `„${name}" aus dem anderen Fenster (${anderesStand}${unterschied}) kommt auf der Startseite unter „${ZULETZT_GESCHLOSSEN}" und lässt sich von dort zurückholen. Deine Fassung wird ab jetzt gespeichert.`,
            ok: "Meine Fassung behalten",
            gefahr: !nimmt || altFaellt,
            fokus: "abbruch",
          });
          if (!ja) return;
        }
        if (nimmt && !gleich(alt?.bogen, anderes.bogen)) ersetztenEntwurfMerken(anderes.bogen, anderes.fremd, { grund: "fenster-behalten" });
        optRef.current.onRueckholung?.();
      }
      entwurfUeberschreibenErlauben();
      setKonflikt(null);
      setRunde((r) => r + 1);
    },
    neuLaden: async () => {
      // Was hier nach der Warnung weiter getippt wurde, steht nirgends im
      // Speicher: Mit dem Neuladen wäre es still weg („Meine Fassung behalten"
      // fragte, dieser Weg nicht, Audit Runde 6, R6-S1). Darum fragen und die
      // eigene Fassung auf den Rückholplatz legen.
      const anderes = entwurfAusAnderemFenster();
      const eigener = optRef.current.eigenerBogen?.() ?? null;
      if (konflikt !== "entfernt" && eigener && bogenHatInhalt(eigener) && !gleich(anderes?.bogen, eigener)) {
        const alt = ersetztenEntwurfLaden();
        const nimmt = rueckholungNimmt(false, alt);
        const altFaellt = nimmt && !!alt && bogenHatInhalt(alt.bogen) && !gleich(alt.bogen, eigener) && !gleich(alt.bogen, anderes?.bogen);
        const name = einheitAnzeigename(eigener.einheit) || "(Bogen ohne Namen)";
        // Beide Fassungen benannt: die eigene und die, die geladen wird (Audit Runde 7, R7-S2).
        const dortStand = anderes ? ` Geladen wird der Stand des anderen Fensters (${zeitMitSekunden(anderes.gespeichert)}${unterschiedFuer(eigener, anderes.bogen, " — dort anders: ")}).` : "";
        const ja = await frageJaNein({
          titel: "Stand aus dem anderen Fenster laden?",
          text: !nimmt
            ? `Deine Änderungen in diesem Fenster („${name}", Stand ${standKurz(eigener)} Uhr) gehen dabei verloren — unter „${ZULETZT_GESCHLOSSEN}" liegt dein eigener Bogen „${einheitAnzeigename(alt!.bogen.einheit)}", und der bleibt.${dortStand}`
            : altFaellt
              ? `Deine Fassung hier („${name}", Stand ${standKurz(eigener)} Uhr) kommt auf der Startseite unter „${ZULETZT_GESCHLOSSEN}". Der dort bisher liegende Bogen „${einheitAnzeigename(alt!.bogen.einheit)}" wird dabei endgültig gelöscht.${dortStand}`
              : `Deine Fassung hier („${name}", Stand ${standKurz(eigener)} Uhr) wird nicht übernommen; sie kommt auf der Startseite unter „${ZULETZT_GESCHLOSSEN}" und lässt sich von dort zurückholen.${dortStand}`,
          ok: "Stand laden",
          gefahr: !nimmt || altFaellt,
          fokus: "abbruch",
        });
        if (!ja) return;
        if (nimmt) ersetztenEntwurfMerken(eigener, undefined, { tausch: true, grund: "fenster-geladen" });
      }
      try {
        sessionStorage.setItem(NACH_ABGLEICH_SCHLUESSEL, "1");
      } catch {
        /* ohne Sitzungsspeicher eben über die Startseite */
      }
      window.location.reload();
    },
  };
}

/**
 * Sichtbare Warnung an Stelle der „automatisch gespeichert"-Zeile — als feste
 * Leiste am Bildrand. Der erste Satz sagt, dass hier nichts gespeichert wird
 * (R7-O1), danach folgt, WAS sich im anderen Fenster unterscheidet (R7-O2);
 * die beiden Entscheidungsknöpfe stehen ohne Aufklappen in der Leiste
 * (R7-M2), nur bei knappem Bild (Tastatur, Querformat) hinter „Entscheiden".
 * Die Stände mit Sekunden und was die Knöpfe tun, stehen hinter „Genauer".
 * Welcher Stand wohin kommt, steht in der Rückfrage hinter den Knöpfen.
 */
export function FensterKonflikt({ abgleich }: { abgleich: FensterAbgleich }) {
  const entfernt = abgleich.art === "entfernt";
  const anderes = entfernt ? null : entwurfAusAnderemFenster();
  const eigener = abgleich.eigenerBogen?.() ?? null;
  const unterschied = anderes && eigener ? unterschiedText(eigener, anderes.bogen, 2) : "";
  const hierUm = entwurfEigenerStandUm();
  return (
    <FesteWarnung
      klasse="speicher-fehler fenster-konflikt"
      aktionenImmer
      kurz={
        entfernt ? (
          <>
            <strong>⚠ Hier wird nichts gespeichert.</strong> Dieser Bogen wurde in einem anderen Fenster gelöscht oder
            geschlossen.
          </>
        ) : (
          <>
            <strong>⚠ Hier wird nichts gespeichert.</strong> Das andere Fenster hat den Bogen geändert
            {unterschied ? `: ${unterschied}.` : "."}
          </>
        )
      }
      details={
        entfernt ? (
          <p>
            „Neu laden, hier verwerfen“ lässt diesen Bogen los. „Bogen hier wieder speichern“ schreibt ihn zurück,
            obwohl er im anderen Fenster entfernt wurde.
          </p>
        ) : (
          <>
            {anderes && (
              <p>
                <strong>Dort:</strong> „{einheitAnzeigename(anderes.bogen.einheit)}“, gespeichert{" "}
                {zeitMitSekunden(anderes.gespeichert)}, {personenText(anderes.bogen)}.
                <br />
                <strong>Hier:</strong> {eigener ? `Stand ${standKurz(eigener)} Uhr, ${personenText(eigener)}` : "Stand unbekannt"}
                {hierUm != null ? `, zuletzt gespeichert ${zeitMitSekunden(hierUm)}` : ""}.
              </p>
            )}
            <p>
              „Anderen Stand laden“ übernimmt die Fassung des anderen Fensters; deine kommt unter „Zuletzt
              geschlossener Bogen“ auf die Startseite. „Meine Fassung behalten“ macht es umgekehrt.
            </p>
          </>
        )
      }
      aktionen={
        entfernt ? (
          <>
            <button type="button" onClick={() => void abgleich.neuLaden()}>Neu laden, hier verwerfen</button>
            <button type="button" onClick={() => void abgleich.behalten()}>Bogen hier wieder speichern</button>
          </>
        ) : (
          <>
            <button type="button" title="Stand aus dem anderen Fenster laden" onClick={() => void abgleich.neuLaden()}>Anderen Stand laden</button>
            <button type="button" onClick={() => void abgleich.behalten()}>Meine Fassung behalten</button>
          </>
        )
      }
    />
  );
}
