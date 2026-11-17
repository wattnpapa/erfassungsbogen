/**
 * ZIP-Datei ohne Kompression („stored") schreiben. Gebraucht für die
 * Mustervorlage des Personalstamms (wenige Kilobyte XML) und für die
 * Übungsbögen als ZIP mit einer PDF je Bogen: PDFs sind schon komprimiert,
 * ein zweites Packen spart kaum etwas und kostet Rechenzeit.
 *
 * Ohne ZIP64: Eine Datei bis 4 GB und bis 65.535 Einträge. Das reicht für
 * jede Auswahl, die ein Browser in den Speicher bekommt.
 */

let crcTabelle: Uint32Array | null = null;
function crc32(daten: Uint8Array): number {
  if (!crcTabelle) {
    crcTabelle = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTabelle[n] = c >>> 0;
    }
  }
  const t = crcTabelle;
  let crc = 0xffffffff;
  for (let i = 0; i < daten.length; i++) crc = t[(crc ^ daten[i]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Dateien unkomprimiert zu einem ZIP packen; Text wird als UTF-8 abgelegt. */
export function zipSchreiben(dateien: ReadonlyArray<readonly [string, string | Uint8Array]>): Uint8Array {
  const enc = new TextEncoder();
  const teile: Uint8Array[] = [];
  const verzeichnis: Uint8Array[] = [];
  let stelle = 0;
  for (const [name, inhalt] of dateien) {
    const n = enc.encode(name);
    const d = typeof inhalt === "string" ? enc.encode(inhalt) : inhalt;
    const crc = crc32(d);
    const kopf = new DataView(new ArrayBuffer(30));
    kopf.setUint32(0, 0x04034b50, true);
    kopf.setUint16(4, 20, true); // benötigte Version
    kopf.setUint16(6, 0x0800, true); // Dateinamen in UTF-8
    kopf.setUint16(8, 0, true); // stored
    kopf.setUint16(10, 0, true); // Zeit
    kopf.setUint16(12, 0x21, true); // Datum 1980-01-01
    kopf.setUint32(14, crc, true);
    kopf.setUint32(18, d.length, true);
    kopf.setUint32(22, d.length, true);
    kopf.setUint16(26, n.length, true);
    kopf.setUint16(28, 0, true);
    const eintrag = new DataView(new ArrayBuffer(46));
    eintrag.setUint32(0, 0x02014b50, true);
    eintrag.setUint16(4, 20, true);
    eintrag.setUint16(6, 20, true);
    eintrag.setUint16(8, 0x0800, true);
    eintrag.setUint16(10, 0, true);
    eintrag.setUint16(12, 0, true);
    eintrag.setUint16(14, 0x21, true);
    eintrag.setUint32(16, crc, true);
    eintrag.setUint32(20, d.length, true);
    eintrag.setUint32(24, d.length, true);
    eintrag.setUint16(28, n.length, true);
    eintrag.setUint32(42, stelle, true);
    teile.push(new Uint8Array(kopf.buffer), n, d);
    verzeichnis.push(new Uint8Array(eintrag.buffer), n);
    stelle += 30 + n.length + d.length;
  }
  const verzeichnisLaenge = verzeichnis.reduce((s, t) => s + t.length, 0);
  const ende = new DataView(new ArrayBuffer(22));
  ende.setUint32(0, 0x06054b50, true);
  ende.setUint16(8, dateien.length, true);
  ende.setUint16(10, dateien.length, true);
  ende.setUint32(12, verzeichnisLaenge, true);
  ende.setUint32(16, stelle, true);
  const alle = [...teile, ...verzeichnis, new Uint8Array(ende.buffer)];
  const aus = new Uint8Array(alle.reduce((s, t) => s + t.length, 0));
  let o = 0;
  for (const t of alle) {
    aus.set(t, o);
    o += t.length;
  }
  return aus;
}

/**
 * Dateinamen im ZIP eindeutig machen: Ein zweites „a.pdf" wird „a-2.pdf".
 * Zwei gleiche Namen überschrieben beim Entpacken sonst einen Bogen.
 */
export function eindeutigeNamen(namen: readonly string[]): string[] {
  const vergeben = new Set<string>();
  return namen.map((name) => {
    const punkt = name.lastIndexOf(".");
    const rumpf = punkt > 0 ? name.slice(0, punkt) : name;
    const endung = punkt > 0 ? name.slice(punkt) : "";
    let kandidat = name;
    for (let i = 2; vergeben.has(kandidat.toLowerCase()); i++) kandidat = `${rumpf}-${i}${endung}`;
    vergeben.add(kandidat.toLowerCase());
    return kandidat;
  });
}
