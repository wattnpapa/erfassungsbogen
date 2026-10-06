/**
 * Oberfläche für „Meine Vorlagen":
 *  - VorlagenListe: einbettbare Kartenliste der gespeicherten Vorlagen mit
 *    Verwalten (bearbeiten, umbenennen, teilen, löschen) und Einstieg in die
 *    Musterung. Wird direkt unter den Start-Buttons angezeigt. „Bearbeiten"
 *    ändert die Vorlage dauerhaft (über den Assistenten, app.tsx) — die
 *    Musterung dagegen nie.
 *  - VorlageTeilen: die Vorlage selbst weitergeben (QR, Link, Datei) — für ein
 *    zweites Gerät oder die Ablage in einer Cloud. Der Empfänger legt daraus
 *    wieder eine Vorlage an, keinen Arbeitsbogen.
 *  - Musterung: die anwesende Mannschaft und die ausrückenden Fahrzeuge
 *    zusammenstellen (Variante A) → frischer Arbeitsbogen.
 */

import { useEffect, useRef, useState } from "react";
import { StaerkeRolle, staerke, type Erfassungsbogen, type Person } from "@bos/eeb-format/model";
import {
  funktionsText,
  kennzeichenText,
  orgLabel,
  textAlsDatei,
  vokabText,
  vokabularFuer,
  vorlageTransportErzeugen,
  type VorlagenTransport,
} from "./hilfen";
import {
  vorlageEndgueltigLoeschen,
  vorlageInstanziieren,
  vorlageLoeschen,
  vorlageUmbenennen,
  vorlageWiederherstellen,
  vorlagenPapierkorb,
  vorlageDateiInhalt,
  vorlageDateiname,
  type Vorlage,
} from "./vorlagen";
import { SeitenKopf } from "./seiten-kopf";
import { bedarfMarken } from "./einheiten-tabelle";
import { frageJaNein, frageText, zeigeHinweis } from "./dialoge";
import { istNativ, linkTeilen, shareSheetVerfuegbar } from "./nativ";
import { AbgangKnopf, Kartenstapel } from "./kartenstapel";
import { papierkorbRest } from "./papierkorb-frist";

function personName(vorname: string, nachname: string): string {
  return `${vorname} ${nachname}`.trim() || "(ohne Name)";
}

function rolleKuerzel(r: StaerkeRolle): string {
  return r === StaerkeRolle.FUEHRER ? "F" : r === StaerkeRolle.UNTERFUEHRER ? "U" : "M";
}

function staerkeText(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

// ------------------------------------------------------------ Vorlagenliste

export function VorlagenListe(props: {
  vorlagen: Vorlage[];
  onMustern: (v: Vorlage) => void;
  /** Die Vorlage selbst ändern: öffnet ihren Bogen im Assistenten (dauerhaft, nicht nur für den nächsten Einsatz). */
  onBearbeiten: (v: Vorlage) => void;
  onGeaendert: () => void;
  /**
   * Die gerade eingegangene Vorlage (Scan). Sie wird in der Liste
   * abgestempelt — der Startbildschirm zeigt sie im selben Augenblick an, in
   * dem sie ankommt, und ohne Stempel fiele sie zwischen den vorhandenen
   * Vorlagen nicht auf.
   */
  frischeId?: string | null;
}) {
  const { vorlagen, onMustern, onBearbeiten, onGeaendert, frischeId } = props;
  const [zeigePapierkorb, setZeigePapierkorb] = useState(false);
  const papierkorb = vorlagenPapierkorb();
  /** Die gerade aus dem Papierkorb zurückgeholte Vorlage — siehe EinsatzListe. */
  const [zurueckgeholt, setZurueckgeholt] = useState<string | null>(null);
  /** Die Vorlage, deren Teilen-Dialog gerade offen ist. */
  const [teilen, setTeilen] = useState<Vorlage | null>(null);

  async function umbenennen(v: Vorlage) {
    const name = await frageText({ titel: "Vorlage umbenennen", label: "Name", vorgabe: v.name, ok: "Umbenennen" });
    if (name != null) {
      vorlageUmbenennen(v.id, name);
      onGeaendert();
    }
  }

  // Kein confirm: Löschen ist nur der Weg in den Papierkorb (30 Tage
  // wiederherstellbar) — ein Fehltipp lässt sich rückgängig machen. Dass es
  // diesen Rückweg gibt, sagt danach die Statuszeile mit „Rückgängig"
  // (Audit „Zerstörende Handlungen", D6): vorher verschwand die Karte stumm.
  function loeschen(v: Vorlage) {
    vorlageLoeschen(v.id);
    setZuletztGeloescht(v);
    onGeaendert();
  }

  /** Die eben gelöschte Vorlage — solange sie hier steht, gibt es den Rückweg in einem Tipp. */
  const [zuletztGeloescht, setZuletztGeloescht] = useState<Vorlage | null>(null);
  function loeschenRueckgaengig() {
    if (!zuletztGeloescht) return;
    vorlageWiederherstellen(zuletztGeloescht.id);
    setZurueckgeholt(zuletztGeloescht.id);
    setZuletztGeloescht(null);
    onGeaendert();
  }

  // Rückfrage und Mutation getrennt: dazwischen läuft der Abgang der Karte
  // (siehe AbgangKnopf).
  function fragEndgueltig(v: Vorlage) {
    return frageJaNein({
      titel: "Vorlage endgültig löschen?",
      text: `„${v.name}" wird aus dem Papierkorb entfernt. Das lässt sich nicht rückgängig machen.`,
      ok: "Endgültig löschen",
      gefahr: true,
    });
  }

  function endgueltigLoeschen(v: Vorlage) {
    vorlageEndgueltigLoeschen(v.id);
    onGeaendert();
  }

  return (
    <>
      {zuletztGeloescht && (
        <p className="meldung" role="status">
          Vorlage „{zuletztGeloescht.name}" in den Papierkorb gelegt (30 Tage rückholbar).{" "}
          {/* Voller Knopf wie in der Daumenleiste, kein 74 × 30 px großer
              Textlink (Audit Runde 3, R3-D4). */}
          <button type="button" onClick={loeschenRueckgaengig}>Rückgängig</button>
        </p>
      )}
      {vorlagen.map((v) => (
        <Kartenstapel className="karte" key={v.id} frisch={v.id === frischeId || v.id === zurueckgeholt}>
          <div className="kopfzeile">
            <h2>{v.name}</h2>
            <button type="button" className="primaer" onClick={() => onMustern(v)}>
              Einsatz vorbereiten
            </button>
          </div>
          <p>
            <strong>{orgLabel(v.bogen.einheit.organisation)}</strong>
            {" · "}
            {vokabText(v.bogen.einheit.einheitsTyp, vokabularFuer(v.bogen.einheit.organisation, "einheitstyp"), "name") ||
              "(Einheit offen)"}
          </p>
          <p className="hinweis">
            Stärke {staerkeText(v.bogen)} · {v.bogen.personal.length} Personen · {v.bogen.fahrzeuge.length} Fahrzeuge
          </p>
          <div className="vorlage-aktionen">
            <button type="button" onClick={() => onBearbeiten(v)}>Bearbeiten</button>{" "}
            <button type="button" onClick={() => umbenennen(v)}>Umbenennen</button>{" "}
            <button type="button" onClick={() => setTeilen(v)}>Teilen…</button>{" "}
            {/* Der Abgang zeigt, welche Vorlage geht — erst danach rückt die
                Liste nach. */}
            <AbgangKnopf className="entfernen" onAusfuehren={() => loeschen(v)}>Löschen</AbgangKnopf>
          </div>
        </Kartenstapel>
      ))}
      {papierkorb.length > 0 && (
        <p>
          <button type="button" className="link" onClick={() => setZeigePapierkorb(!zeigePapierkorb)}>
            {zeigePapierkorb ? "Papierkorb ausblenden" : `Papierkorb (${papierkorb.length})`}
          </button>
        </p>
      )}
      {zeigePapierkorb &&
        papierkorb.map((v) => (
          <Kartenstapel className="karte papierkorb" key={v.id}>
            <div className="kopfzeile">
              <h2>{v.name}</h2>
              {/* Wie im Einsatz-Papierkorb: der harmlose Weg in der Kopfzeile,
                  der endgültige abgesetzt darunter. */}
              <AbgangKnopf
                onAusfuehren={() => { vorlageWiederherstellen(v.id); setZurueckgeholt(v.id); onGeaendert(); }}
              >
                Wiederherstellen
              </AbgangKnopf>
            </div>
            <p className={papierkorbRest(v.geloeschtAm!).bald ? "hinweis warnung-text" : "hinweis"}>
              Gelöscht am {new Date(v.geloeschtAm!).toLocaleDateString("de-DE")} — {papierkorbRest(v.geloeschtAm!).text}
            </p>
            <div className="papierkorb-endgueltig">
              <AbgangKnopf
                className="entfernen"
                bestaetigen={() => fragEndgueltig(v)}
                onAusfuehren={() => endgueltigLoeschen(v)}
              >
                Endgültig löschen…
              </AbgangKnopf>
            </div>
          </Kartenstapel>
        ))}
      {teilen && <VorlageTeilen vorlage={teilen} onSchliessen={() => setTeilen(null)} />}
    </>
  );
}

// ---------------------------------------------------------- Vorlage teilen

/**
 * Eine Vorlage aufs nächste Gerät bringen oder außerhalb des Geräts ablegen.
 * Drei Wege, derselbe Inhalt: QR-Code (Gerät daneben), Link (Chat, Mail,
 * Notiz) und JSON-Datei (Cloud-Ordner, Mail-Anhang). Link und QR sind wie beim
 * Bogen mit dem Geräteschlüssel signiert, die Datei ist es nicht.
 */
export function VorlageTeilen(props: { vorlage: Vorlage; onSchliessen: () => void }) {
  const { vorlage, onSchliessen } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const [transport, setTransport] = useState<VorlagenTransport | null>(null);
  const [fehler, setFehler] = useState("");
  const [linkKopiert, setLinkKopiert] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    let aktiv = true;
    vorlageTransportErzeugen(vorlage.bogen)
      .then((t) => aktiv && setTransport(t))
      .catch((e) => aktiv && setFehler(`QR-Code: ${e instanceof Error ? e.message : e}`));
    return () => {
      aktiv = false;
    };
  }, [vorlage]);

  async function linkWeitergeben() {
    if (!transport) return;
    const url = transport.link;
    const titel = `Vorlage ${vorlage.name}`;
    setFehler("");
    try {
      if (shareSheetVerfuegbar()) {
        if (istNativ()) await linkTeilen(titel, url);
        else await navigator.share({ title: titel, text: titel, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setLinkKopiert(true);
        window.setTimeout(() => setLinkKopiert(false), 3000);
      } else {
        await zeigeHinweis({ titel: "Vorlagen-Link", text: "Zum Weitergeben markieren und kopieren:", kopiertext: url });
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // Abbruch im Share-Dialog
      setFehler(`Link teilen: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function alsDatei() {
    setFehler("");
    try {
      await textAlsDatei(vorlageDateiname(vorlage), vorlageDateiInhalt(vorlage), "application/json");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // Abbruch im Share-Dialog
      setFehler(`Datei: ${e instanceof Error ? e.message : e}`);
    }
  }

  return (
    <dialog ref={dialog} aria-label="Vorlage teilen" className="teilen-dialog" onClose={onSchliessen}>
      <div className="kopfzeile">
        <h2>Vorlage teilen</h2>
        <button type="button" onClick={() => dialog.current?.close()}>Schließen</button>
      </div>
      <p>
        <strong>{vorlage.name}</strong> — {vorlage.bogen.personal.length} Personen, {vorlage.bogen.fahrzeuge.length} Fahrzeuge.
        Auf dem anderen Gerät steht sie danach unter „Gespeicherte Vorlagen".
      </p>
      {/* Die Vorlage ist die ganze Mannschaftsliste. Wer sie in eine Cloud
          legt, gibt Namen und Erreichbarkeiten dorthin — das soll vor dem
          Knopf stehen, nicht danach. */}
      <p className="hinweis">
        Die Vorlage enthält Namen und Erreichbarkeiten aller erfassten Personen. Nur dort ablegen
        oder hinschicken, wo diese Daten nach den Regeln eurer Organisation hindürfen.
      </p>
      <div className="teilen-weg">
        {transport?.qrDatenUrl ? (
          <img className="vorlage-qr" src={transport.qrDatenUrl} alt={`Vorlagen-QR-Code ${vorlage.name}`} />
        ) : null}
        <p className="hinweis">
          {!transport
            ? "QR-Code wird erzeugt…"
            : transport.qrDatenUrl
              ? "Gerät daneben: in der App „QR-Code scannen…“ wählen und diesen Code einlesen."
              : "Für einen einzelnen QR-Code ist die Vorlage zu groß — Link oder Datei tragen sie vollständig."}
        </p>
      </div>
      <div className="teilen-weg">
        <button type="button" onClick={linkWeitergeben} disabled={!transport}>
          {linkKopiert ? "Link kopiert ✓" : "Link teilen"}
        </button>
        <p className="hinweis">Für Chat, Mail oder Notiz — öffnet die App und legt die Vorlage an.</p>
      </div>
      <div className="teilen-weg">
        <button type="button" onClick={alsDatei}>Als Datei speichern</button>
        <p className="hinweis">
          JSON-Datei, z. B. für einen Cloud-Ordner. Einlesen auf der Startseite über „Aus Datei laden…".
        </p>
      </div>
      {fehler && <p className="fehler">{fehler}</p>}
    </dialog>
  );
}

// --------------------------------------------------------------- Musterung

export function Musterung(props: {
  vorlage: Vorlage;
  /** `abgewaehlt`: die Personen, die nicht mitgehen — als Nachzügler später ergänzbar (R4-W8). */
  onStart: (bogen: Erfassungsbogen, abgewaehlt: Person[]) => void;
  onAbbrechen: () => void;
}) {
  const { vorlage, onStart, onAbbrechen } = props;
  const b = vorlage.bogen;
  const org = b.einheit.organisation;
  const [pAn, setPAn] = useState<boolean[]>(() => b.personal.map(() => true));
  const [vAn, setVAn] = useState<boolean[]>(() => b.fahrzeuge.map(() => true));
  // Standard-Sofortbedarf der Vorlage: sichtbar, aber nicht vorausgewählt (R2-W1).
  const bedarf = bedarfMarken({ ...b, sofortbedarf: b.sofortbedarf && { ...b.sofortbedarf, verpflegungPersonen: 0 } });
  const [bedarfAn, setBedarfAn] = useState(false);
  // Bemerkung der Vorlage wie der Sofortbedarf: sichtbar, nicht vorausgewählt (R3-H7).
  const bemerkung = b.sonstiges?.trim() ?? "";
  const [bemerkungAn, setBemerkungAn] = useState(false);

  const anwesendePersonen = b.personal.filter((_, i) => pAn[i]);
  const s = staerke({ personal: anwesendePersonen, staerkeManuell: b.staerkeManuell });
  const anzahlFz = vAn.filter(Boolean).length;

  const toggleP = (i: number) => setPAn(pAn.map((x, j) => (j === i ? !x : x)));
  const toggleV = (i: number) => setVAn(vAn.map((x, j) => (j === i ? !x : x)));

  /**
   * Vorab ist jede Person und jedes Fahrzeug angehakt. Wer nichts anfasst,
   * meldet die ganze Vorlage — die Musterung wurde leicht übersprungen, weil
   * die Liste schon „abgehakt" aussah (Audit Runde 3, R3-H4). Bleibt alles
   * angehakt, fragt der Start einmal nach; wer abgewählt hat, hat gemustert.
   */
  async function starten() {
    const allesDa = pAn.every(Boolean) && vAn.every(Boolean);
    if (allesDa && b.personal.length + b.fahrzeuge.length > 1) {
      const teile = [
        b.personal.length > 0 ? `alle ${b.personal.length} ${b.personal.length === 1 ? "Person" : "Personen"}` : "",
        b.fahrzeuge.length > 0 ? `alle ${b.fahrzeuge.length} ${b.fahrzeuge.length === 1 ? "Fahrzeug" : "Fahrzeuge"}` : "",
      ].filter(Boolean);
      const sicher = await frageJaNein({
        titel: "Alle aus der Vorlage dabei?",
        text: `Gemeldet werden ${teile.join(" und ")} der Vorlage. Fehlt jemand, vorher in der Liste abwählen.`,
        ok: "Ja, alle sind da",
        abbruch: "Zurück zur Liste",
      });
      if (!sicher) return;
    }
    onStart(vorlageInstanziieren(b, { personal: pAn, fahrzeuge: vAn, sofortbedarf: bedarfAn, sonstiges: bemerkungAn }), b.personal.filter((_, i) => !pAn[i]));
  }

  /**
   * „‹ Abbrechen" nach geänderten Haken: fünf abgewählte Personen waren ohne
   * Rückfrage verworfen, beim erneuten Öffnen standen wieder alle angehakt
   * (Audit Runde 2, R2-D6). Ohne Änderung geht es ohne Frage zurück.
   */
  async function abbrechen() {
    const personenAb = pAn.filter((x) => !x).length;
    const fahrzeugeAb = vAn.filter((x) => !x).length;
    const geaendert = personenAb > 0 || fahrzeugeAb > 0 || bedarfAn || bemerkungAn;
    if (geaendert) {
      const was = [
        personenAb > 0 ? `${personenAb} ${personenAb === 1 ? "Person" : "Personen"} abgewählt` : "",
        fahrzeugeAb > 0 ? `${fahrzeugeAb} ${fahrzeugeAb === 1 ? "Fahrzeug" : "Fahrzeuge"} abgewählt` : "",
        bedarfAn ? "Sofortbedarf angehakt" : "",
        bemerkungAn ? "Bemerkung angehakt" : "",
      ].filter(Boolean);
      const sicher = await frageJaNein({
        titel: "Musterung verwerfen?",
        text: `Die Haken dieser Musterung (${was.join(", ")}) gehen verloren; beim nächsten Öffnen sind wieder alle angehakt. Die Vorlage selbst bleibt unverändert.`,
        ok: "Verwerfen",
        abbruch: "Weiter mustern",
        gefahr: true,
      });
      if (!sicher) return;
    }
    onAbbrechen();
  }

  return (
    <>
    <SeitenKopf>
      <button type="button" className="zur-start" onClick={() => void abbrechen()}>‹ Abbrechen</button>
      <div className="titelzeile">
        <h1>{vorlage.name}</h1>
      </div>
      {/* Der Text folgt der Vorgabe: Alle sind vorab angehakt, gemustert wird
          durch Abwählen. „Anwesende abhaken" las sich wie „hier ist schon
          abgehakt" (R3-H4). */}
      <p className="hinweis">
        <strong>Alle sind vorab angehakt — wer oder was fehlt, antippen und abwählen.</strong> Die Vorlage bleibt
        unverändert; dauerhaft ändern lässt sie sich über „Bearbeiten" auf der Startseite.
      </p>
    </SeitenKopf>
    <main id="inhalt" tabIndex={-1} className="musterung">
      <section className="karte staerke-leiste">
        {/* R4-H3: Auf schmalen Telefonen standen hier „FÜHRER / UNTERF. /
            MANNSC… / GESAMT", bei 320 px im Feld-Modus „FÜH… / UNT… / MAN… /
            GES…". Dort tragen die Felder dieselben Kürzel wie der Bogen und
            der Assistent (F / UF / M / Ges); das ausgeschriebene Wort bleibt
            für Vorlesesoftware im Baum (index.html, `.etikett-lang`). */}
        <div><strong>{s.fuehrer}</strong><span><span className="etikett-lang">Führer</span><span className="etikett-kurz" aria-hidden="true">F</span></span></div>
        <div><strong>{s.unterfuehrer}</strong><span><span className="etikett-lang">Unterf.</span><span className="etikett-kurz" aria-hidden="true">UF</span></span></div>
        <div><strong>{s.mannschaft}</strong><span><span className="etikett-lang">Mannsch.</span><span className="etikett-kurz" aria-hidden="true">M</span></span></div>
        <div className="gesamt"><strong>{s.gesamt}</strong><span><span className="etikett-lang">Gesamt</span><span className="etikett-kurz" aria-hidden="true">Ges</span></span></div>
      </section>

      <section className="karte">
        <div className="kopfzeile">
          <h2>Personal ({anwesendePersonen.length}/{b.personal.length})</h2>
          <button type="button" onClick={() => setPAn(b.personal.map(() => true))}>Alle anhaken</button>
        </div>
        {b.personal.length === 0 && <p className="hinweis">Kein Personal in der Vorlage.</p>}
        {b.personal.map((p, i) => (
          <label key={i} className={`muster-zeile${pAn[i] ? "" : " gestrichen"}`}>
            <input type="checkbox" checked={pAn[i]} onChange={() => toggleP(i)} />
            <span className={`rolle-badge rolle-${rolleKuerzel(p.staerkeRolle).toLowerCase()}`}>
              {rolleKuerzel(p.staerkeRolle)}
            </span>
            <span className="muster-text">
              <span className="muster-name">{personName(p.vorname, p.nachname)}</span>
              <span className="muster-sub">{funktionsText(p, org) || "—"}</span>
            </span>
          </label>
        ))}
      </section>

      <section className="karte">
        <div className="kopfzeile">
          <h2>Fahrzeuge ({anzahlFz}/{b.fahrzeuge.length})</h2>
          <button type="button" onClick={() => setVAn(b.fahrzeuge.map(() => true))}>Alle anhaken</button>
        </div>
        {b.fahrzeuge.length === 0 && <p className="hinweis">Keine Fahrzeuge in der Vorlage.</p>}
        {b.fahrzeuge.map((f, i) => (
          <label key={i} className={`muster-zeile${vAn[i] ? "" : " gestrichen"}`}>
            <input type="checkbox" checked={vAn[i]} onChange={() => toggleV(i)} />
            <span className="muster-text">
              <span className="muster-name">
                {vokabText(f.typ, vokabularFuer(org, "fahrzeug"), "name") || "Fahrzeug"}
              </span>
              <span className="muster-sub">{kennzeichenText(f) || "—"}</span>
            </span>
          </label>
        ))}
      </section>

      {bedarf.length > 0 && (
        <section className="karte">
          <h2>Sofortbedarf aus der Vorlage</h2>
          <label className={`muster-zeile${bedarfAn ? "" : " gestrichen"}`}>
            <input type="checkbox" checked={bedarfAn} onChange={() => setBedarfAn(!bedarfAn)} />
            <span className="muster-text">
              <span className="muster-name">{bedarf.map((m) => m.lang).join(" · ")}</span>
              <span className="muster-sub">Stammt aus einem früheren Einsatz — nur anhaken, wenn er auch jetzt gilt.</span>
            </span>
          </label>
        </section>
      )}

      {bemerkung && (
        <section className="karte">
          <h2>Bemerkung aus der Vorlage</h2>
          <label className={`muster-zeile${bemerkungAn ? "" : " gestrichen"}`}>
            <input type="checkbox" checked={bemerkungAn} onChange={() => setBemerkungAn(!bemerkungAn)} />
            <span className="muster-text">
              <span className="muster-name bemerkung-text">{bemerkung}</span>
              <span className="muster-sub">Stand beim Speichern der Vorlage — nur anhaken, wenn sie auch jetzt stimmt.</span>
            </span>
          </label>
        </section>
      )}

      <footer className="nav">
        <button type="button" className="primaer muster-start" onClick={() => void starten()}>
          Einsatz starten · {s.gesamt} Pers · {anzahlFz} Fz
        </button>
      </footer>
    </main>
    </>
  );
}
