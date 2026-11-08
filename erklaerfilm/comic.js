/**
 * Comic-Zeichnungen für den Erklärfilm: Figuren, Fahrzeuge, Zelt, Wetter,
 * Sprechblasen und die einzelnen Panels. Alles als SVG-Text, deterministisch
 * aus der Szenenzeit `t` berechnet — so ergibt jedes Einzelbild beim Rendern
 * genau dasselbe wie in der Vorschau.
 *
 * Personen und Handlung sind erfunden. Bewusst kein THW-Logo, nur der
 * Schriftzug auf Fahrzeugen und Kleidung.
 */
(function () {
  "use strict";

  const W = 1920;
  const H = 1080;
  const LINIE = "#111";
  const FARBE = {
    thw: "#1f43a0",
    thwDunkel: "#16306f",
    hose: "#1c2541",
    reflex: "#f2dc3a",
    silber: "#d9dee6",
    haut: "#f2c9a5",
    hautSchatten: "#d9a77f",
    papier: "#fbf7ea",
    nacht: "#0d1a3a",
    nacht2: "#1b2d5c",
    weste: "#f5d000",
    blau: "#2f7bff",
    gelb: "#ffd23f",
  };

  // ── Werkzeuge ───────────────────────────────────────────────────────────
  const r = (n) => Math.round(n * 10) / 10;
  const klemme = (x, a, b) => Math.max(a, Math.min(b, x));
  const glatt = (x) => {
    const k = klemme(x, 0, 1);
    return k * k * (3 - 2 * k);
  };
  /** Deterministischer Zufall (für Regen, Schraffur). */
  function zufall(saat) {
    let s = saat >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /** Mund klappt beim Sprechen (ca. 7 Wechsel je Sekunde, nicht ganz gleichmäßig). */
  function sprichtGerade(t, aktiv) {
    if (!aktiv) return false;
    return Math.sin(t * 44) + Math.sin(t * 27) * 0.6 > 0.1;
  }

  // ── Gemeinsame Definitionen ─────────────────────────────────────────────
  const DEFS = `
  <defs>
    <pattern id="raster" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx="7" cy="7" r="2.6" fill="#000" opacity=".16"/>
    </pattern>
    <pattern id="raster-hell" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx="6" cy="6" r="2.2" fill="#fff" opacity=".12"/>
    </pattern>
    <pattern id="raster-gelb" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
      <circle cx="8" cy="8" r="4" fill="#ffb800" opacity=".35"/>
    </pattern>
    <radialGradient id="lampe" cx="50%" cy="0%" r="90%">
      <stop offset="0" stop-color="#fff3b0" stop-opacity=".95"/>
      <stop offset=".55" stop-color="#ffd76a" stop-opacity=".35"/>
      <stop offset="1" stop-color="#ffd76a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blaulicht" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#9fd0ff" stop-opacity=".95"/>
      <stop offset=".4" stop-color="#2f7bff" stop-opacity=".55"/>
      <stop offset="1" stop-color="#2f7bff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="scheinwerfer" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fffbe0" stop-opacity=".9"/>
      <stop offset="1" stop-color="#fffbe0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="himmel-nacht" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050b1f"/>
      <stop offset=".7" stop-color="#16295a"/>
      <stop offset="1" stop-color="#22397a"/>
    </linearGradient>
    <linearGradient id="himmel-morgen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b3a7a"/>
      <stop offset=".6" stop-color="#e98a5b"/>
      <stop offset="1" stop-color="#ffd38a"/>
    </linearGradient>
    <linearGradient id="zelt-innen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a556f"/>
      <stop offset="1" stop-color="#23293a"/>
    </linearGradient>
    <linearGradient id="raum" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f1e6cc"/>
      <stop offset="1" stop-color="#dccaa3"/>
    </linearGradient>
  </defs>`;

  // ── Hintergründe und Wetter ─────────────────────────────────────────────
  function himmel(art = "nacht") {
    return `<rect width="${W}" height="${H}" fill="url(#himmel-${art})"/><rect width="${W}" height="${H}" fill="url(#raster-hell)"/>`;
  }

  function regen(t, { dichte = 160, staerke = 1, saat = 7, winkel = 0.28, farbe = "#bcd3ff", deckkraft = 0.55 } = {}) {
    const z = zufall(saat);
    let s = "";
    for (let i = 0; i < dichte; i++) {
      const x0 = z() * (W + 400) - 200;
      const geschw = 1500 + z() * 900;
      const laenge = (40 + z() * 50) * staerke;
      const y = ((z() * (H + 200) + t * geschw) % (H + 200)) - 100;
      const x = x0 - (y + 100) * winkel;
      s += `<line x1="${r(x)}" y1="${r(y)}" x2="${r(x - laenge * winkel)}" y2="${r(y + laenge)}"/>`;
    }
    return `<g stroke="${farbe}" stroke-width="3" stroke-linecap="round" opacity="${deckkraft}">${s}</g>`;
  }

  function wolken(t, y = 120, farbe = "#2a3557") {
    let s = "";
    const z = zufall(3);
    for (let i = 0; i < 7; i++) {
      const x = ((z() * W * 1.4 + t * (12 + i * 3)) % (W * 1.4)) - W * 0.2;
      const yy = y + z() * 140;
      const b = 260 + z() * 260;
      s += `<ellipse cx="${r(x)}" cy="${r(yy)}" rx="${r(b)}" ry="${r(b * 0.32)}" fill="${farbe}" stroke="${LINIE}" stroke-width="5"/>`;
    }
    return s;
  }

  function blitz(t, beiSekunde) {
    const d = t - beiSekunde;
    if (d < 0 || d > 0.45) return "";
    const hell = d < 0.08 || (d > 0.16 && d < 0.24) ? 0.75 : 0.25;
    return `<rect width="${W}" height="${H}" fill="#e8f0ff" opacity="${hell}"/>
      <path d="M1320 0 L1250 190 L1310 200 L1210 420 L1350 170 L1290 160 L1370 0Z" fill="#fffbe6" stroke="${LINIE}" stroke-width="5"/>`;
  }

  // ── Fahrzeuge ───────────────────────────────────────────────────────────
  /** Gerätekraftwagen, Seitenansicht. (x,y) = Mitte Hinterachse unten, nach rechts fahrend. */
  function gkw(x, y, s, t, { blaulicht = true, nummer = "THW-80125", licht = true, phase = 0 } = {}) {
    const an = Math.floor((t + phase) * 6) % 2 === 0;
    return `<g transform="translate(${x} ${y}) scale(${s})">
      ${licht ? `<ellipse cx="760" cy="-110" rx="300" ry="80" fill="url(#scheinwerfer)"/>` : ""}
      <rect x="-80" y="-430" width="560" height="330" rx="14" fill="${FARBE.thw}" stroke="${LINIE}" stroke-width="10"/>
      <rect x="-80" y="-430" width="560" height="330" rx="14" fill="url(#raster)"/>
      <rect x="-80" y="-205" width="560" height="34" fill="#fff" stroke="${LINIE}" stroke-width="6"/>
      <text x="200" y="-270" font-family="Bangers, Archivo, sans-serif" font-size="120" fill="#fff" stroke="${LINIE}" stroke-width="5" text-anchor="middle" letter-spacing="8">THW</text>
      <path d="M480 -330 L600 -330 Q640 -330 660 -290 L700 -200 L700 -100 L480 -100Z" fill="${FARBE.thw}" stroke="${LINIE}" stroke-width="10"/>
      <path d="M500 -310 L590 -310 Q615 -310 628 -285 L660 -215 L500 -215Z" fill="#9cc8ff" stroke="${LINIE}" stroke-width="7"/>
      <rect x="480" y="-205" width="220" height="34" fill="#fff" stroke="${LINIE}" stroke-width="6"/>
      <rect x="670" y="-150" width="40" height="26" rx="6" fill="#fff8c4" stroke="${LINIE}" stroke-width="5"/>
      <rect x="520" y="-150" width="120" height="34" fill="#fff" stroke="${LINIE}" stroke-width="4"/>
      <text x="580" y="-125" font-family="Archivo, sans-serif" font-weight="700" font-size="20" text-anchor="middle">${esc(nummer)}</text>
      ${blaulicht ? `<rect x="520" y="-360" width="120" height="30" rx="8" fill="${an ? "#7fb6ff" : "#2850a8"}" stroke="${LINIE}" stroke-width="6"/>
        ${an ? `<circle cx="545" cy="-345" r="110" fill="url(#blaulicht)"/>` : `<circle cx="615" cy="-345" r="110" fill="url(#blaulicht)"/>`}` : ""}
      ${rad(40, -40)}${rad(330, -40)}${rad(600, -40)}
    </g>`;
  }
  function rad(x, y) {
    return `<circle cx="${x}" cy="${y}" r="62" fill="#222" stroke="${LINIE}" stroke-width="8"/><circle cx="${x}" cy="${y}" r="26" fill="#9aa3b5" stroke="${LINIE}" stroke-width="6"/>`;
  }

  /** Fahrzeug frontal (für die Schlange), (x,y) = Mitte unten. */
  function lkwFront(x, y, s, t, { phase = 0, fenster = true } = {}) {
    const an = Math.floor((t + phase) * 6) % 2 === 0;
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <rect x="-170" y="-330" width="340" height="300" rx="20" fill="${FARBE.thw}" stroke="${LINIE}" stroke-width="10"/>
      <rect x="-170" y="-330" width="340" height="300" rx="20" fill="url(#raster)"/>
      ${fenster ? `<rect x="-140" y="-300" width="280" height="120" rx="10" fill="#9cc8ff" stroke="${LINIE}" stroke-width="7"/>` : ""}
      <rect x="-150" y="-150" width="300" height="40" fill="#fff" stroke="${LINIE}" stroke-width="5"/>
      <text x="0" y="-118" font-family="Bangers, Archivo, sans-serif" font-size="38" text-anchor="middle" letter-spacing="4">THW</text>
      <circle cx="-120" cy="-70" r="26" fill="#fff8c4" stroke="${LINIE}" stroke-width="6"/>
      <circle cx="120" cy="-70" r="26" fill="#fff8c4" stroke="${LINIE}" stroke-width="6"/>
      <ellipse cx="-120" cy="-70" rx="90" ry="60" fill="url(#scheinwerfer)"/>
      <ellipse cx="120" cy="-70" rx="90" ry="60" fill="url(#scheinwerfer)"/>
      <rect x="-90" y="-362" width="180" height="32" rx="8" fill="${an ? "#7fb6ff" : "#2850a8"}" stroke="${LINIE}" stroke-width="6"/>
      <circle cx="${an ? -50 : 50}" cy="-346" r="120" fill="url(#blaulicht)"/>
      <rect x="-180" y="-40" width="70" height="50" rx="10" fill="#222" stroke="${LINIE}" stroke-width="7"/>
      <rect x="110" y="-40" width="70" height="50" rx="10" fill="#222" stroke="${LINIE}" stroke-width="7"/>
    </g>`;
  }

  // ── Zelt ────────────────────────────────────────────────────────────────
  function zelt(x, y, s, { schild = "MELDEKOPF" } = {}) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-330 -470 L0 -600 L330 -470Z" fill="#f4f4f0" stroke="${LINIE}" stroke-width="10" stroke-linejoin="round"/>
      <path d="M-330 -470 L330 -470 L330 -420 Q275 -395 220 -420 Q165 -395 110 -420 Q55 -395 0 -420 Q-55 -395 -110 -420 Q-165 -395 -220 -420 Q-275 -395 -330 -420Z" fill="#e2e4e8" stroke="${LINIE}" stroke-width="8"/>
      <rect x="-320" y="-420" width="14" height="420" fill="#8b93a3" stroke="${LINIE}" stroke-width="5"/>
      <rect x="306" y="-420" width="14" height="420" fill="#8b93a3" stroke="${LINIE}" stroke-width="5"/>
      <ellipse cx="0" cy="-200" rx="300" ry="260" fill="url(#lampe)"/>
      <rect x="-190" y="-540" width="380" height="70" fill="${FARBE.gelb}" stroke="${LINIE}" stroke-width="8"/>
      <text x="0" y="-489" font-family="Bangers, Archivo, sans-serif" font-size="58" text-anchor="middle" letter-spacing="5">${esc(schild)}</text>
    </g>`;
  }

  function tisch(x, y, b, { tuch = "#c9ccd4" } = {}) {
    return `<g transform="translate(${x} ${y})">
      <rect x="${-b / 2}" y="0" width="${b}" height="40" fill="${tuch}" stroke="${LINIE}" stroke-width="8"/>
      <rect x="${-b / 2 + 20}" y="40" width="22" height="200" fill="#6d7486" stroke="${LINIE}" stroke-width="6"/>
      <rect x="${b / 2 - 42}" y="40" width="22" height="200" fill="#6d7486" stroke="${LINIE}" stroke-width="6"/>
    </g>`;
  }

  // ── Personen ────────────────────────────────────────────────────────────
  /**
   * Eine Einsatzkraft. (x,y) = zwischen den Füßen. Optionen:
   * haar, bart, zopf, kappe, stirnlampe, weste (Text), gesicht (neutral,
   * gestresst, verwirrt, genervt, froh, erschoepft, ruft), arme ({l,r}: unten,
   * vorne, hoch, kopf, ohr, winken, zeigen, schreiben, tippen), blick (1 rechts, -1 links),
   * spricht (Mund klappt), ohneBeine (hinter Tisch/Fenster), t.
   */
  function person(o) {
    const {
      x, y, s = 1, haar = "#5a3a22", bart = false, zopf = false, locken = false, kappe = false,
      stirnlampe = false, weste = null, gesicht = "neutral", arme = {}, blick = 1, spricht = false,
      ohneBeine = false, t = 0, jacke = FARBE.thw, haut = FARBE.haut, haltL = "", haltR = "",
    } = o;
    const armL = arme.l ?? "unten";
    const armR = arme.r ?? "unten";
    let g = "";
    // Beine
    if (!ohneBeine) {
      g += `<rect x="-95" y="-270" width="80" height="250" rx="16" fill="${FARBE.hose}" stroke="${LINIE}" stroke-width="9"/>
        <rect x="15" y="-270" width="80" height="250" rx="16" fill="${FARBE.hose}" stroke="${LINIE}" stroke-width="9"/>
        <rect x="-95" y="-120" width="80" height="16" fill="${FARBE.reflex}" stroke="${LINIE}" stroke-width="4"/>
        <rect x="15" y="-120" width="80" height="16" fill="${FARBE.reflex}" stroke="${LINIE}" stroke-width="4"/>
        <path d="M-110 -28 h100 q20 0 20 28 h-130z" fill="#1a1a1a" stroke="${LINIE}" stroke-width="8"/>
        <path d="M0 -28 h100 q30 0 30 28 h-130z" fill="#1a1a1a" stroke="${LINIE}" stroke-width="8"/>`;
    }
    // Rumpf
    g += `<path d="M-125 -250 L-135 -480 Q-130 -540 -60 -548 L60 -548 Q130 -540 135 -480 L125 -250Z" fill="${jacke}" stroke="${LINIE}" stroke-width="10" stroke-linejoin="round"/>
      <path d="M-125 -250 L-135 -480 Q-130 -540 -60 -548 L60 -548 Q130 -540 135 -480 L125 -250Z" fill="url(#raster)"/>
      <rect x="-131" y="-345" width="262" height="26" fill="${FARBE.silber}" stroke="${LINIE}" stroke-width="5"/>
      <rect x="-131" y="-345" width="262" height="9" fill="${FARBE.reflex}"/>
      <rect x="-131" y="-328" width="262" height="9" fill="${FARBE.reflex}"/>
      <line x1="0" y1="-540" x2="0" y2="-255" stroke="${LINIE}" stroke-width="5"/>`;
    if (weste) {
      g += `<path d="M-120 -270 L-128 -480 Q-120 -530 -70 -536 L-30 -536 L-20 -270Z M120 -270 L128 -480 Q120 -530 70 -536 L30 -536 L20 -270Z" fill="${FARBE.weste}" stroke="${LINIE}" stroke-width="8"/>
        <rect x="-118" y="-460" width="236" height="46" fill="${FARBE.weste}" stroke="${LINIE}" stroke-width="6"/>
        <text x="0" y="-426" font-family="Archivo, sans-serif" font-weight="800" font-size="30" text-anchor="middle" letter-spacing="1">${esc(weste)}</text>`;
    } else {
      g += `<text x="${blick > 0 ? 62 : -62}" y="-430" font-family="Archivo, sans-serif" font-weight="800" font-size="30" fill="#fff" text-anchor="middle">THW</text>`;
    }
    // Hals und Kopf
    const kx = blick * 8;
    g += `<rect x="-26" y="-585" width="52" height="50" fill="${haut}" stroke="${LINIE}" stroke-width="8"/>`;
    if (zopf) g += `<path d="M${-blick * 70} -660 q${-blick * 90} 40 ${-blick * 70} 150 q${blick * 30} -60 ${blick * 40} -120z" fill="${haar}" stroke="${LINIE}" stroke-width="8"/>`;
    g += `<circle cx="${kx - 88}" cy="-640" r="20" fill="${haut}" stroke="${LINIE}" stroke-width="7"/><circle cx="${kx + 88}" cy="-640" r="20" fill="${haut}" stroke="${LINIE}" stroke-width="7"/>`;
    g += `<ellipse cx="${kx}" cy="-650" rx="90" ry="100" fill="${haut}" stroke="${LINIE}" stroke-width="9"/>`;
    if (bart) g += `<path d="M${kx - 82} -655 Q${kx - 80} -555 ${kx} -550 Q${kx + 80} -555 ${kx + 82} -655 Q${kx + 60} -600 ${kx} -598 Q${kx - 60} -600 ${kx - 82} -655Z" fill="${bart === true ? "#6b4a2e" : bart}" stroke="${LINIE}" stroke-width="6" opacity=".9"/>`;
    // Haare
    if (locken) {
      let l = "";
      for (let i = 0; i < 9; i++) {
        const w = (Math.PI * (i + 0.5)) / 9;
        l += `<circle cx="${r(kx - Math.cos(w) * 85)}" cy="${r(-690 - Math.sin(w) * 60)}" r="34" fill="${haar}" stroke="${LINIE}" stroke-width="6"/>`;
      }
      g += l;
    } else {
      g += `<path d="M${kx - 92} -655 Q${kx - 100} -760 ${kx} -758 Q${kx + 100} -760 ${kx + 92} -655 Q${kx + 60} -715 ${kx - 10} -700 Q${kx - 60} -720 ${kx - 92} -655Z" fill="${haar}" stroke="${LINIE}" stroke-width="8"/>`;
    }
    if (kappe) {
      g += `<path d="M${kx - 95} -680 Q${kx - 95} -775 ${kx} -775 Q${kx + 95} -775 ${kx + 95} -680Z" fill="${FARBE.thwDunkel}" stroke="${LINIE}" stroke-width="8"/>
        <path d="M${kx + blick * 20} -684 L${kx + blick * 165} -676 Q${kx + blick * 170} -660 ${kx + blick * 150} -662 L${kx + blick * 10} -666Z" fill="${FARBE.thwDunkel}" stroke="${LINIE}" stroke-width="7"/>`;
    }
    if (stirnlampe) {
      g += `<path d="M${kx - 92} -700 Q${kx} -730 ${kx + 92} -700" fill="none" stroke="#222" stroke-width="14"/>
        <rect x="${kx + blick * 30 - 22}" y="-735" width="44" height="30" rx="8" fill="#ddd" stroke="${LINIE}" stroke-width="6"/>
        <circle cx="${kx + blick * 30}" cy="-720" r="9" fill="#fff6b0"/>`;
    }
    g += gesichtZeichnen(kx, gesicht, spricht, blick, t);
    // Arme
    g += arm(-1, armL, jacke, haut, t, haltL);
    g += arm(1, armR, jacke, haut, t, haltR);
    return `<g transform="translate(${x} ${y}) scale(${s})">${g}</g>`;
  }

  function gesichtZeichnen(kx, gesicht, spricht, blick, t) {
    const ax = kx + blick * 12;
    let augen = "";
    let brauen = "";
    let mund = "";
    let extra = "";
    const zwinkern = (Math.floor(t * 10) % 37) === 0;
    const auge = (dx, ry = 13) =>
      zwinkern || gesicht === "erschoepft"
        ? `<path d="M${ax + dx - 14} -665 q14 ${gesicht === "erschoepft" ? 8 : 4} 28 0" fill="none" stroke="${LINIE}" stroke-width="6" stroke-linecap="round"/>`
        : `<ellipse cx="${ax + dx}" cy="-665" rx="10" ry="${ry}" fill="${LINIE}"/><circle cx="${ax + dx + 3}" cy="-670" r="3" fill="#fff"/>`;
    switch (gesicht) {
      case "gestresst":
        augen = auge(-32) + auge(32);
        brauen = `<path d="M${ax - 52} -700 L${ax - 14} -690 M${ax + 14} -690 L${ax + 52} -700" stroke="${LINIE}" stroke-width="8" stroke-linecap="round"/>`;
        extra = `<path d="M${kx + 70} -730 q14 26 0 34 q-14 -8 0 -34z" fill="#bfe3ff" stroke="${LINIE}" stroke-width="4"/>`;
        break;
      case "verwirrt":
        augen = auge(-32, 15) + `<path d="M${ax + 18} -665 h28" stroke="${LINIE}" stroke-width="7" stroke-linecap="round"/>`;
        brauen = `<path d="M${ax - 52} -705 q20 -18 40 -4 M${ax + 14} -688 L${ax + 52} -690" stroke="${LINIE}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
        break;
      case "genervt":
        augen = auge(-32, 8) + auge(32, 8);
        brauen = `<path d="M${ax - 52} -690 L${ax - 12} -700 M${ax + 12} -700 L${ax + 52} -690" stroke="${LINIE}" stroke-width="9" stroke-linecap="round"/>`;
        break;
      case "froh":
        augen = `<path d="M${ax - 46} -662 q14 -18 28 0 M${ax + 18} -662 q14 -18 28 0" fill="none" stroke="${LINIE}" stroke-width="7" stroke-linecap="round"/>`;
        brauen = `<path d="M${ax - 50} -700 q18 -10 36 0 M${ax + 14} -700 q18 -10 36 0" stroke="${LINIE}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
        break;
      case "ruft":
        augen = auge(-32, 15) + auge(32, 15);
        brauen = `<path d="M${ax - 52} -692 L${ax - 14} -702 M${ax + 14} -702 L${ax + 52} -692" stroke="${LINIE}" stroke-width="8" stroke-linecap="round"/>`;
        break;
      case "erschoepft":
        augen = auge(-32) + auge(32);
        brauen = `<path d="M${ax - 52} -690 q20 8 38 6 M${ax + 14} -684 q20 2 38 -6" stroke="${LINIE}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
        extra = `<path d="M${ax - 50} -650 q8 6 16 0 M${ax + 34} -650 q8 6 16 0" stroke="#7d8db8" stroke-width="5" fill="none"/>`;
        break;
      default:
        augen = auge(-32) + auge(32);
        brauen = `<path d="M${ax - 50} -697 h34 M${ax + 16} -697 h34" stroke="${LINIE}" stroke-width="7" stroke-linecap="round"/>`;
    }
    const nase = `<path d="M${ax + blick * 6} -650 q${blick * 14} 18 ${-blick * 4} 22" fill="none" stroke="${LINIE}" stroke-width="5" stroke-linecap="round"/>`;
    const my = -603;
    if (spricht || gesicht === "ruft") {
      const h = gesicht === "ruft" ? 34 : 22;
      mund = `<path d="M${ax - 26} ${my - 4} Q${ax} ${my - 10} ${ax + 26} ${my - 4} Q${ax + 20} ${my + h} ${ax} ${my + h} Q${ax - 20} ${my + h} ${ax - 26} ${my - 4}Z" fill="#7a1f1f" stroke="${LINIE}" stroke-width="6"/>`;
    } else if (gesicht === "froh") {
      mund = `<path d="M${ax - 32} ${my - 8} Q${ax} ${my + 26} ${ax + 32} ${my - 8}Z" fill="#7a1f1f" stroke="${LINIE}" stroke-width="6" stroke-linejoin="round"/>`;
    } else if (gesicht === "genervt" || gesicht === "gestresst") {
      mund = `<path d="M${ax - 24} ${my + 4} Q${ax} ${my - 10} ${ax + 24} ${my + 4}" fill="none" stroke="${LINIE}" stroke-width="7" stroke-linecap="round"/>`;
    } else if (gesicht === "verwirrt") {
      mund = `<path d="M${ax - 22} ${my} q12 -8 22 0 t22 0" fill="none" stroke="${LINIE}" stroke-width="7" stroke-linecap="round"/>`;
    } else if (gesicht === "erschoepft") {
      mund = `<ellipse cx="${ax}" cy="${my}" rx="14" ry="8" fill="#7a1f1f" stroke="${LINIE}" stroke-width="5"/>`;
    } else {
      mund = `<path d="M${ax - 22} ${my - 2} Q${ax} ${my + 8} ${ax + 22} ${my - 2}" fill="none" stroke="${LINIE}" stroke-width="7" stroke-linecap="round"/>`;
    }
    return augen + brauen + nase + mund + extra;
  }

  /** Arm einer Seite (-1 links, 1 rechts). Pfad von der Schulter zur Hand. */
  function arm(seite, pose, jacke, haut, t, halt) {
    const sx = seite * 118;
    const sy = -500;
    let ex;
    let ey;
    let hx;
    let hy;
    switch (pose) {
      case "vorne":
        ex = seite * 150; ey = -380; hx = seite * 60; hy = -360;
        break;
      case "hoch":
        ex = seite * 220; ey = -560; hx = seite * 250; hy = -700;
        break;
      case "kopf":
        ex = seite * 190; ey = -560; hx = seite * 70; hy = -720;
        break;
      case "ohr":
        ex = seite * 190; ey = -520; hx = seite * 100; hy = -640;
        break;
      case "winken": {
        const w = Math.sin(t * 7) * 18;
        ex = seite * 210; ey = -480; hx = seite * 230 + w; hy = -660;
        break;
      }
      case "zeigen":
        ex = seite * 230; ey = -470; hx = seite * 330; hy = -500;
        break;
      case "schreiben": {
        const w = Math.sin(t * 18) * 14;
        ex = seite * 150; ey = -380; hx = seite * 40 + w; hy = -330 + Math.cos(t * 23) * 6;
        break;
      }
      case "tippen": {
        const w = Math.abs(Math.sin(t * 16)) * 18;
        ex = seite * 160; ey = -360; hx = seite * 70; hy = -300 - w;
        break;
      }
      default:
        ex = seite * 150; ey = -380; hx = seite * 150; hy = -250;
    }
    const pfad = `M${sx} ${sy} Q${ex} ${ey} ${hx} ${hy}`;
    let hand = `<circle cx="${hx}" cy="${hy}" r="30" fill="${haut}" stroke="${LINIE}" stroke-width="7"/>`;
    if (pose === "winken") {
      // Offene Hand: vier Finger als Fächer, Daumen zur Seite.
      hand = [-27, -9, 9, 27]
        .map((dx, i) => `<rect x="${hx + dx - 9}" y="${hy - 62 + Math.abs(dx) * 0.5}" width="18" height="44" rx="9" fill="${haut}" stroke="${LINIE}" stroke-width="5" transform="rotate(${(i - 1.5) * 8} ${hx + dx} ${hy - 20})"/>`)
        .join("") +
        `<rect x="${hx - seite * 44 - 9}" y="${hy - 30}" width="18" height="38" rx="9" fill="${haut}" stroke="${LINIE}" stroke-width="5" transform="rotate(${-seite * 50} ${hx - seite * 30} ${hy})"/>` +
        `<circle cx="${hx}" cy="${hy}" r="32" fill="${haut}" stroke="${LINIE}" stroke-width="7"/>`;
    }
    return `<path d="${pfad}" fill="none" stroke="${LINIE}" stroke-width="72" stroke-linecap="round"/>
      <path d="${pfad}" fill="none" stroke="${jacke}" stroke-width="56" stroke-linecap="round"/>
      ${halt ? `<g transform="translate(${hx} ${hy})">${halt}</g>` : ""}${hand}`;
  }

  // ── Gegenstände ─────────────────────────────────────────────────────────
  function klemmbrett(b = 150, h = 200, { nass = 0, schrift = true, drehung = 0 } = {}) {
    let zeilen = "";
    if (schrift) {
      const anzahl = Math.max(1, Math.floor((h - 70) / 21));
      for (let i = 0; i < anzahl; i++) {
        const y = -h / 2 + 50 + i * 21;
        zeilen += `<path d="M${-b / 2 + 18} ${y} q15 -8 30 0 t30 0 t30 0 t${b / 4} 0" fill="none" stroke="#2848a8" stroke-width="3" opacity="${1 - nass * 0.5}"/>`;
      }
    }
    let flecken = "";
    if (nass > 0) {
      const z = zufall(11);
      for (let i = 0; i < 6; i++) {
        flecken += `<ellipse cx="${r((z() - 0.5) * b * 0.8)}" cy="${r((z() - 0.4) * h * 0.7)}" rx="${r(10 + z() * 18)}" ry="${r(14 + z() * 22)}" fill="#6b84c9" opacity="${0.35 * nass}"/>`;
      }
    }
    return `<g transform="rotate(${drehung})">
      <rect x="${-b / 2 - 10}" y="${-h / 2 - 10}" width="${b + 20}" height="${h + 20}" rx="10" fill="#9b6b3c" stroke="${LINIE}" stroke-width="6"/>
      <rect x="${-b / 2}" y="${-h / 2 + 10}" width="${b}" height="${h - 14}" fill="${FARBE.papier}" stroke="${LINIE}" stroke-width="4"/>
      <rect x="-30" y="${-h / 2 - 18}" width="60" height="26" rx="6" fill="#c0c4cc" stroke="${LINIE}" stroke-width="5"/>
      <rect x="${-b / 2 + 10}" y="${-h / 2 + 20}" width="${b - 20}" height="18" fill="#1f3a8a" opacity=".85"/>
      ${zeilen}${flecken}
    </g>`;
  }

  function handy(b = 90, h = 170, inhalt = "qr", t = 0) {
    let bild = "";
    if (inhalt === "qr") bild = qrMuster(-b / 2 + 10, -h / 2 + 30, b - 20, 17);
    return `<g>
      <rect x="${-b / 2}" y="${-h / 2}" width="${b}" height="${h}" rx="14" fill="#1a1a1a" stroke="${LINIE}" stroke-width="6"/>
      <rect x="${-b / 2 + 7}" y="${-h / 2 + 12}" width="${b - 14}" height="${h - 24}" rx="6" fill="#fff"/>
      ${bild}
    </g>`;
  }

  /** Stilisiertes QR-Muster (kein lesbarer Code). */
  function qrMuster(x, y, b, n = 21) {
    const z = zufall(42);
    const k = b / n;
    let s = `<rect x="${x}" y="${y}" width="${b}" height="${b}" fill="#fff"/>`;
    const eck = (cx, cy) =>
      `<rect x="${r(x + cx * k)}" y="${r(y + cy * k)}" width="${r(7 * k)}" height="${r(7 * k)}" fill="#000"/><rect x="${r(x + (cx + 1) * k)}" y="${r(y + (cy + 1) * k)}" width="${r(5 * k)}" height="${r(5 * k)}" fill="#fff"/><rect x="${r(x + (cx + 2) * k)}" y="${r(y + (cy + 2) * k)}" width="${r(3 * k)}" height="${r(3 * k)}" fill="#000"/>`;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const imEck = (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9);
        if (!imEck && z() > 0.52) s += `<rect x="${r(x + i * k)}" y="${r(y + j * k)}" width="${r(k + 0.4)}" height="${r(k + 0.4)}" fill="#000"/>`;
      }
    }
    return s + eck(0, 0) + eck(n - 7, 0) + eck(0, n - 7);
  }

  function tablet(b = 300, h = 210, inhalt = "", t = 0) {
    return `<g>
      <rect x="${-b / 2}" y="${-h / 2}" width="${b}" height="${h}" rx="18" fill="#222" stroke="${LINIE}" stroke-width="7"/>
      <rect x="${-b / 2 + 14}" y="${-h / 2 + 14}" width="${b - 28}" height="${h - 28}" rx="6" fill="#f2f3f7"/>
      <rect x="${-b / 2 + 14}" y="${-h / 2 + 14}" width="${b - 28}" height="34" fill="#12275e"/>
      ${inhalt}
    </g>`;
  }

  function funkgeraet() {
    return `<g><rect x="-22" y="-70" width="44" height="100" rx="8" fill="#2b2b2b" stroke="${LINIE}" stroke-width="6"/>
      <rect x="-6" y="-120" width="12" height="54" rx="4" fill="#2b2b2b" stroke="${LINIE}" stroke-width="5"/>
      <rect x="-14" y="-56" width="28" height="22" fill="#9fd29a" stroke="${LINIE}" stroke-width="3"/></g>`;
  }

  function taschenrechner(t) {
    let tasten = "";
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const gedrueckt = Math.floor(t * 9) % 16 === i * 4 + j;
        tasten += `<rect x="${-52 + i * 27}" y="${-20 + j * 24}" width="20" height="17" rx="3" fill="${gedrueckt ? "#ffd23f" : "#ddd"}" stroke="${LINIE}" stroke-width="2.5"/>`;
      }
    return `<g><rect x="-64" y="-90" width="128" height="180" rx="12" fill="#3b3f4a" stroke="${LINIE}" stroke-width="6"/>
      <rect x="-52" y="-76" width="104" height="40" fill="#bfd2a4" stroke="${LINIE}" stroke-width="4"/>
      <text x="44" y="-46" font-family="monospace" font-size="26" text-anchor="end">${[9, 13, 23, 31, 34][Math.floor(t * 1.4) % 5]}</text>${tasten}</g>`;
  }

  function laptop(b = 420, h = 270, inhalt = "") {
    return `<g>
      <rect x="${-b / 2}" y="${-h}" width="${b}" height="${h}" rx="14" fill="#2b2f3a" stroke="${LINIE}" stroke-width="8"/>
      <rect x="${-b / 2 + 16}" y="${-h + 16}" width="${b - 32}" height="${h - 32}" fill="#f2f3f7"/>
      <rect x="${-b / 2 + 16}" y="${-h + 16}" width="${b - 32}" height="44" fill="#12275e"/>
      ${inhalt}
      <path d="M${-b / 2 - 40} 0 L${b / 2 + 40} 0 L${b / 2 + 10} 26 L${-b / 2 - 10} 26Z" fill="#9aa1b0" stroke="${LINIE}" stroke-width="8"/>
    </g>`;
  }

  /** Mini-Ansicht des digitalen Bogens auf Laptop/Tablet. */
  function bogenMini(x, y, b, schritt = 3) {
    let s = "";
    const reiter = ["Einheit", "Einsatz", "Personal", "Fahrzeuge", "Bedarf", "Übersicht"];
    const rb = (b - 10) / reiter.length;
    reiter.forEach((_, i) => {
      s += `<rect x="${r(x + i * rb)}" y="${y}" width="${r(rb - 4)}" height="12" fill="${i < schritt ? "#3cb371" : "#c9cede"}"/>`;
    });
    for (let i = 0; i < 6; i++) {
      s += `<rect x="${x}" y="${y + 24 + i * 22}" width="${b * 0.28}" height="12" fill="#9aa3b8"/><rect x="${x + b * 0.32}" y="${y + 20 + i * 22}" width="${b * 0.6}" height="18" fill="#fff" stroke="#9aa3b8" stroke-width="2"/>`;
    }
    return s;
  }

  // ── Text-Elemente ───────────────────────────────────────────────────────
  /** Zeilenumbruch nach geschätzter Zeichenbreite. */
  function umbrechen(text, maxZeichen) {
    const woerter = text.split(/\s+/);
    const zeilen = [];
    let z = "";
    for (const w of woerter) {
      if ((z + " " + w).trim().length > maxZeichen && z) {
        zeilen.push(z);
        z = w;
      } else z = (z + " " + w).trim();
    }
    if (z) zeilen.push(z);
    return zeilen;
  }

  /**
   * Sprechblase. art: "normal" | "funk" (gezackt). auftauchen: 0..1 (Pop-Animation).
   */
  function blase({ text, x, y, b, spitze, art = "normal", auftauchen = 1, groesse = 40 }) {
    const zeichen = Math.max(10, Math.floor((b - 70) / (groesse * 0.5)));
    const zeilen = umbrechen(text, zeichen);
    const zh = groesse * 1.22;
    const h = zeilen.length * zh + 60;
    const cx = x + b / 2;
    const cy = y + h / 2;
    const k = auftauchen < 1 ? 0.6 + 0.4 * glatt(auftauchen) + Math.sin(auftauchen * Math.PI) * 0.08 : 1;
    let form;
    if (art === "funk") {
      const zacken = [];
      const n = 26;
      for (let i = 0; i < n; i++) {
        const w = (i / n) * Math.PI * 2;
        const rr = i % 2 ? 1 : 1.09;
        zacken.push(`${r(cx + Math.cos(w) * (b / 2 + 18) * rr)},${r(cy + Math.sin(w) * (h / 2 + 22) * rr)}`);
      }
      form = `<polygon points="${zacken.join(" ")}" fill="#fff" stroke="${LINIE}" stroke-width="7" stroke-linejoin="round"/>`;
    } else {
      form = `<ellipse cx="${cx}" cy="${cy}" rx="${b / 2 + 26}" ry="${h / 2 + 22}" fill="#fff" stroke="${LINIE}" stroke-width="7"/>`;
    }
    let schwanz = "";
    if (spitze) {
      const [sx, sy] = spitze;
      const wx = cx + (sx - cx) * 0.25;
      const wy = cy + (sy - cy) * 0.25;
      const nx = -(sy - cy);
      const ny = sx - cx;
      const nl = Math.hypot(nx, ny) || 1;
      const bb = 34;
      const p1 = `${r(wx + (nx / nl) * bb)},${r(wy + (ny / nl) * bb)}`;
      const p2 = `${r(wx - (nx / nl) * bb)},${r(wy - (ny / nl) * bb)}`;
      if (art === "funk") {
        const m1 = [cx + (sx - cx) * 0.55 + 20, cy + (sy - cy) * 0.55];
        const m2 = [cx + (sx - cx) * 0.7 - 20, cy + (sy - cy) * 0.7];
        schwanz = `<polyline points="${r(cx)},${r(cy)} ${r(m1[0])},${r(m1[1])} ${r(m2[0])},${r(m2[1])} ${sx},${sy}" fill="none" stroke="${LINIE}" stroke-width="9" stroke-linejoin="round"/>`;
      } else {
        schwanz = `<polygon points="${p1} ${p2} ${sx},${sy}" fill="#fff" stroke="${LINIE}" stroke-width="7" stroke-linejoin="round"/>`;
      }
    }
    const textEl = zeilen
      .map((z, i) => `<text x="${cx}" y="${r(y + 30 + groesse * 0.95 + i * zh)}" text-anchor="middle">${esc(z)}</text>`)
      .join("");
    // Bei der Funkblase die Schwanzlinie unter die Blase, sonst die Spitze über den Rand.
    const inhalt =
      art === "funk"
        ? `${schwanz}${form}`
        : `${schwanz}${form}<ellipse cx="${cx}" cy="${cy}" rx="${b / 2 + 22.5}" ry="${h / 2 + 18.5}" fill="#fff"/>`;
    return `<g transform="translate(${cx} ${cy}) scale(${r(k * 100) / 100}) translate(${-cx} ${-cy})" opacity="${klemme(auftauchen * 3, 0, 1)}">
      ${inhalt}
      <g font-family="'Comic Neue', 'Comic Sans MS', Archivo, sans-serif" font-weight="700" font-size="${groesse}" fill="${LINIE}">${textEl}</g>
    </g>`;
  }

  /** Erzähler-Kasten (gelb, eckig), wie im Comic. */
  function kasten({ text, x = 50, y = 46, b = 860, auftauchen = 1, groesse = 34 }) {
    const zeichen = Math.floor((b - 50) / (groesse * 0.53));
    const zeilen = umbrechen(text, zeichen);
    const zh = groesse * 1.25;
    const h = zeilen.length * zh + 38;
    const dx = (1 - glatt(auftauchen)) * -40;
    return `<g transform="translate(${r(dx)} 0)" opacity="${klemme(auftauchen * 2.5, 0, 1)}">
      <rect x="${x + 8}" y="${y + 8}" width="${b}" height="${h}" fill="${LINIE}"/>
      <rect x="${x}" y="${y}" width="${b}" height="${h}" fill="#ffe680" stroke="${LINIE}" stroke-width="6"/>
      <g font-family="'Comic Neue', 'Comic Sans MS', Archivo, sans-serif" font-weight="700" font-size="${groesse}" fill="${LINIE}">
        ${zeilen.map((z, i) => `<text x="${x + 24}" y="${r(y + 20 + groesse * 0.95 + i * zh)}">${esc(z)}</text>`).join("")}
      </g></g>`;
  }

  /** Lautmalerei in Bangers mit dicker Kontur. */
  function laut(text, x, y, { groesse = 120, drehung = -8, farbe = FARBE.gelb, auftauchen = 1, wackeln = 0, t = 0, ziffern = false } = {}) {
    if (auftauchen <= 0) return "";
    const k = 0.4 + 0.6 * glatt(auftauchen) + Math.sin(klemme(auftauchen, 0, 1) * Math.PI) * 0.25;
    const w = wackeln ? Math.sin(t * 40) * wackeln : 0;
    return `<g transform="translate(${x} ${y}) rotate(${drehung + w}) scale(${r(k * 100) / 100})" font-family="${ziffern ? "'Comic Neue', Archivo" : "Bangers, Impact"}, sans-serif" font-weight="700" font-size="${groesse}" text-anchor="middle" letter-spacing="4">
      <text x="8" y="8" fill="${LINIE}">${esc(text)}</text>
      <text fill="${farbe}" stroke="${LINIE}" stroke-width="7" paint-order="stroke">${esc(text)}</text></g>`;
  }

  function ortsKasten(text, auftauchen = 1) {
    if (!text) return "";
    return `<g opacity="${klemme(auftauchen * 3, 0, 1)}"><rect x="${W - 60 - text.length * 19}" y="${H - 104}" width="${text.length * 19 + 20}" height="58" fill="#fff" stroke="${LINIE}" stroke-width="6"/>
      <text x="${W - 50}" y="${H - 63}" text-anchor="end" font-family="'Comic Neue', Archivo, sans-serif" font-weight="700" font-size="32">${esc(text)}</text></g>`;
  }

  // ── Panels ──────────────────────────────────────────────────────────────
  // Jedes Panel bekommt { t, d, sprecher (aktiver), zeile (Index), zeilenStart[] }
  // und liefert den Bildinhalt (ohne Blasen, Kasten und Rahmen).
  const PANELS = {
    titel(k) {
      const { t } = k;
      return `${himmel("nacht")}${wolken(t, 40, "#26335a")}
        <path d="M0 760 Q240 640 480 700 T960 660 T1440 700 T1920 640 L1920 1080 L0 1080Z" fill="#0b1430" stroke="${LINIE}" stroke-width="8"/>
        <path d="M0 860 Q480 820 960 860 T1920 840 L1920 1080 L0 1080Z" fill="#141c33" stroke="${LINIE}" stroke-width="8"/>
        ${[0, 1, 2, 3, 4].map((i) => {
          const x = 300 + i * 110 + ((t * 40) % 110);
          const an = Math.floor(t * 6 + i) % 2 === 0;
          return `<circle cx="${x}" cy="${800 - i * 8}" r="${an ? 40 : 22}" fill="url(#blaulicht)"/><circle cx="${x}" cy="${800 - i * 8}" r="6" fill="#cfe5ff"/>`;
        }).join("")}
        ${regen(t, { dichte: 220 })}${blitz(t, 0.6)}${blitz(t, 4.8)}
        <g transform="translate(960 380) rotate(-4)">
          ${laut("STURMTIEF", 0, 0, { groesse: 230, drehung: 0, farbe: "#ffd23f", auftauchen: klemme(t / 0.6, 0, 1) })}
          <g opacity="${klemme((t - 0.8) * 2, 0, 1)}">
            <rect x="-470" y="60" width="940" height="92" fill="#fff" stroke="${LINIE}" stroke-width="7"/>
            <text x="0" y="128" text-anchor="middle" font-family="'Comic Neue', Archivo, sans-serif" font-weight="700" font-size="54">Ankommen am Meldekopf</text>
          </g>
        </g>`;
    },

    kolonne(k) {
      const { t, sprecher } = k;
      const fahrt = Math.min(t * 70, 380);
      return `${himmel("nacht")}${wolken(t, 20)}
        <path d="M0 640 L1920 600 L1920 1080 L0 1080Z" fill="#2a2f3d" stroke="${LINIE}" stroke-width="8"/>
        <path d="M0 640 L1920 600 L1920 1080 L0 1080Z" fill="url(#raster)"/>
        <path d="M0 860 L1920 800" stroke="#e8e8e8" stroke-width="10" stroke-dasharray="80 60"/>
        ${gkw(1580 + fahrt * 0.2, 760, 0.42, t, { phase: 0.3, licht: false })}
        ${gkw(1180 + fahrt * 0.5, 820, 0.6, t, { phase: 0.1, licht: false })}
        ${gkw(500 + fahrt, 960, 0.9, t, { nummer: "THW-80125" })}
        ${zelt(340, 720, 1.0)}
        ${person({ x: 310, y: 740, s: 0.56, zopf: true, stirnlampe: true, weste: "MELDEKOPF", haar: "#2b1a12", blick: 1, gesicht: "neutral", arme: { r: "ohr", l: "unten" }, haltR: `<g transform="translate(-10 20) scale(.8)">${funkgeraet()}</g>`, spricht: sprichtGerade(t, sprecher === "jana"), t })}
        ${regen(t, { dichte: 200 })}`;
    },

    fahrerhaus(k) {
      const { t, sprecher } = k;
      const wischer = Math.sin(t * 3.2) * 40;
      return `<rect width="${W}" height="${H}" fill="#1b2235"/>
        <path d="M120 60 L1800 60 L1700 560 L220 560Z" fill="#2c4a86" stroke="${LINIE}" stroke-width="12"/>
        <path d="M120 60 L1800 60 L1700 560 L220 560Z" fill="url(#raster-hell)"/>
        ${regen(t, { dichte: 90, winkel: 0.05, staerke: 0.6, deckkraft: 0.8 })}
        <circle cx="900" cy="330" r="60" fill="url(#blaulicht)" opacity=".7"/>
        <g transform="translate(700 560) rotate(${-60 + wischer})"><rect x="0" y="-6" width="560" height="12" fill="#111"/></g>
        <g transform="translate(1250 560) rotate(${-60 + wischer})"><rect x="0" y="-6" width="500" height="12" fill="#111"/></g>
        <path d="M0 560 L1920 560 L1920 1080 L0 1080Z" fill="#3a3f4c" stroke="${LINIE}" stroke-width="10"/>
        <path d="M0 600 L1920 600 L1920 700 L0 700Z" fill="#2a2e38" stroke="${LINIE}" stroke-width="8"/>
        ${person({ x: 330, y: 1250, s: 0.95, haar: "#c9a26b", blick: -1, gesicht: "neutral", ohneBeine: true, arme: { l: "vorne", r: "vorne" }, t })}
        <circle cx="290" cy="900" r="150" fill="none" stroke="#111" stroke-width="30"/>
        ${person({ x: 1050, y: 1300, s: 1.05, haar: "#5a3a22", bart: true, kappe: true, blick: -1, gesicht: "gestresst", ohneBeine: true, arme: { l: "vorne", r: "schreiben" }, haltL: `<g transform="translate(70 30) rotate(-14)">${klemmbrett(220, 280)}</g>`, spricht: sprichtGerade(t, sprecher === "karsten"), t })}
        ${laut("KRITZEL", 1560, 860, { groesse: 110, drehung: 8, auftauchen: klemme((t - 0.5) * 3, 0, 1), wackeln: 2, t })}`;
    },

    regen(k) {
      const { t } = k;
      const nass = klemme(t / 3, 0, 1);
      const tropfen = [0.3, 0.9, 1.4, 2.0, 2.6].map((st, i) => {
        const d = t - st;
        if (d < 0) return "";
        const y = Math.min(d * 2400, 520 + i * 40);
        const gelandet = y >= 520 + i * 40;
        const x = 700 + i * 140;
        return gelandet
          ? `<ellipse cx="${x}" cy="${y + 20}" rx="${40 + d * 6}" ry="${24 + d * 3}" fill="#6b84c9" opacity=".45" stroke="#3c5aa8" stroke-width="3"/>`
          : `<path d="M${x} ${y - 50} q26 40 0 60 q-26 -20 0 -60z" fill="#bfe3ff" stroke="${LINIE}" stroke-width="5"/>`;
      }).join("");
      return `<rect width="${W}" height="${H}" fill="#1d2a4d"/><rect width="${W}" height="${H}" fill="url(#raster-hell)"/>
        <g transform="translate(960 600) rotate(-6) scale(4.2)">${klemmbrett(220, 280, { nass })}</g>
        <g transform="translate(1180 650) rotate(${30 + Math.sin(t * 9) * 4})">
          <rect x="-16" y="-260" width="32" height="300" rx="10" fill="#2848a8" stroke="${LINIE}" stroke-width="7"/>
          <path d="M-16 40 L0 90 L16 40Z" fill="#ccc" stroke="${LINIE}" stroke-width="6"/>
          <circle cx="40" cy="-60" r="70" fill="${FARBE.haut}" stroke="${LINIE}" stroke-width="8"/>
        </g>
        ${tropfen}
        ${regen(t, { dichte: 70, staerke: 1.6, winkel: 0.12, deckkraft: 0.7 })}
        ${laut("PLITSCH!", 520, 330, { groesse: 140, drehung: -10, farbe: "#8fd3ff", auftauchen: klemme((t - 0.35) * 3, 0, 1) })}`;
    },

    tisch(k) {
      const { t, sprecher } = k;
      return `<rect width="${W}" height="${H}" fill="url(#zelt-innen)"/><rect width="${W}" height="${H}" fill="url(#raster)"/>
        <ellipse cx="960" cy="200" rx="700" ry="520" fill="url(#lampe)"/>
        <path d="M860 0 L860 120" stroke="${LINIE}" stroke-width="6"/><path d="M820 120 h80 l-20 40 h-40z" fill="#ffe680" stroke="${LINIE}" stroke-width="6"/>
        ${person({ x: 560, y: 1180, s: 1.0, zopf: true, stirnlampe: true, weste: "MELDEKOPF", haar: "#2b1a12", blick: 1, gesicht: "verwirrt", ohneBeine: true, arme: { l: "vorne", r: "vorne" }, haltR: `<g transform="translate(70 -60) rotate(8)">${klemmbrett(240, 300, { nass: 1 })}</g>`, spricht: sprichtGerade(t, sprecher === "jana"), t })}
        ${person({ x: 1430, y: 1200, s: 1.0, haar: "#5a3a22", bart: true, kappe: true, blick: -1, gesicht: sprecher === "karsten" ? "neutral" : "gestresst", ohneBeine: true, arme: { l: "zeigen", r: "vorne" }, spricht: sprichtGerade(t, sprecher === "karsten"), t })}
        ${regen(t, { dichte: 40, winkel: 0.1, deckkraft: 0.25 }).replace("<g ", `<g transform="translate(0 0)" `)}
        <path d="M${1430 + 60} 520 q10 30 0 44 q-10 -14 0 -44z M${1430 - 40} 560 q10 30 0 44 q-10 -14 0 -44z" fill="#bfe3ff" stroke="${LINIE}" stroke-width="4"/>
        ${tisch(960, 900, 1600)}
        ${laut("?", 770, 330, { groesse: 160, drehung: 12, auftauchen: klemme((t - 0.4) * 3, 0, 1) })}
        ${laut("1 oder 7?", 900, 520, { ziffern: true, groesse: 80, drehung: -6, farbe: "#fff", auftauchen: klemme((t - 1.0) * 3, 0, 1) })}`;
    },

    rechnen(k) {
      const { t, sprecher } = k;
      const zahlen = ["0/2/7/9", "+ 1/1/2/4", "+ 0/3/7/10", "+ 1/2/5/8", "= ???"];
      return `<rect width="${W}" height="${H}" fill="url(#zelt-innen)"/><rect width="${W}" height="${H}" fill="url(#raster)"/>
        <ellipse cx="700" cy="200" rx="700" ry="520" fill="url(#lampe)"/>
        ${person({ x: 620, y: 1180, s: 1.0, zopf: true, stirnlampe: true, weste: "MELDEKOPF", haar: "#2b1a12", blick: 1, gesicht: "gestresst", ohneBeine: true, arme: { l: "tippen", r: "vorne" }, spricht: sprichtGerade(t, sprecher === "jana"), t })}
        ${tisch(960, 880, 1700)}
        <g transform="translate(560 860)">${taschenrechner(t)}</g>
        <g transform="translate(1250 880)">${laptop(440, 280, bogenMini(-190, -205, 380, 1))}</g>
        ${[0, 1, 2, 3].map((i) => `<g transform="translate(${880 + i * 26} ${860 - i * 8}) rotate(${-8 + i * 5})">${klemmbrett(170, 120, { nass: 0.8, schrift: true })}</g>`).join("")}
        ${zahlen.map((z, i) => {
          const a = klemme((t - 0.4 - i * 0.55) * 2.5, 0, 1);
          return a > 0 ? `<g opacity="${a}" transform="translate(${1180 + (i % 2) * 300} ${150 + i * 92 - a * 20}) rotate(${(i % 2 ? 6 : -5)})"><text font-family="'Comic Neue', Archivo, sans-serif" font-weight="700" font-size="66" fill="#fff" stroke="${LINIE}" stroke-width="6" paint-order="stroke">${z}</text></g>` : "";
        }).join("")}
        ${laut("TIPP TIPP", 420, 640, { groesse: 80, drehung: -12, auftauchen: klemme((t - 0.2) * 3, 0, 1), wackeln: 1.5, t })}`;
    },

    schlange(k) {
      const { t, sprecher } = k;
      const rauch = [0, 1, 2, 3, 4, 5].map((i) => {
        const p = (t * 0.6 + i / 6) % 1;
        return `<circle cx="${r(1700 - p * 260)}" cy="${r(820 - p * 200)}" r="${r(30 + p * 70)}" fill="#c3c8d4" opacity="${r((1 - p) * 0.5 * 100) / 100}" stroke="${LINIE}" stroke-width="3"/>`;
      }).join("");
      return `${himmel("nacht")}${wolken(t, 10)}
        <path d="M0 620 L1920 560 L1920 1080 L0 1080Z" fill="#2a2f3d" stroke="${LINIE}" stroke-width="8"/>
        ${lkwFront(420, 700, 0.35, t, { phase: 0.4 })}${lkwFront(640, 740, 0.45, t, { phase: 0.2 })}${lkwFront(900, 800, 0.6, t, { phase: 0.7 })}
        ${lkwFront(1240, 900, 0.85, t, { phase: 0.1 })}
        ${rauch}
        ${lkwFront(1560, 1120, 1.4, t, { fenster: false })}
        <rect x="1340" y="650" width="420" height="200" rx="14" fill="#9cc8ff" stroke="${LINIE}" stroke-width="10"/>
        <g>${person({ x: 1560, y: 1210, s: 0.75, locken: true, haar: "#3a2416", blick: -1, gesicht: "ruft", ohneBeine: true, arme: { l: "hoch", r: "unten" }, spricht: sprichtGerade(t, sprecher === "steffi"), t })}</g>
        ${zelt(180, 760, 0.55)}
        ${regen(t, { dichte: 200 })}
        ${laut("HUUUP!", 760, 420, { groesse: 130, drehung: -8, farbe: "#ff7b54", auftauchen: klemme((t - 1.2) * 3, 0, 1), wackeln: 2, t })}`;
    },

    funk(k) {
      const { t, sprecher } = k;
      const ruhe = sprecher === "jana";
      return `<rect width="${W}" height="${H}" fill="url(#zelt-innen)"/><rect width="${W}" height="${H}" fill="url(#raster)"/>
        <ellipse cx="700" cy="200" rx="700" ry="520" fill="url(#lampe)"/>
        ${person({ x: 700, y: 1220, s: 1.05, zopf: true, stirnlampe: true, weste: "MELDEKOPF", haar: "#2b1a12", blick: 1, gesicht: ruhe ? "erschoepft" : "gestresst", ohneBeine: true, arme: { l: "kopf", r: "ohr" }, haltR: `<g transform="translate(-10 20)">${funkgeraet()}</g>`, spricht: sprichtGerade(t, sprecher === "jana"), t })}
        ${tisch(960, 900, 1700)}
        ${[0, 1, 2, 3, 4, 5].map((i) => `<g transform="translate(${1000 + i * 120} ${880 - (i % 3) * 14}) rotate(${-14 + i * 9})">${klemmbrett(150, 110, { nass: 0.7 })}</g>`).join("")}
        <g transform="translate(320 860)">${taschenrechner(0)}</g>
        ${laut("KRRZZ", 1170, 560, { groesse: 90, drehung: 10, farbe: "#c8f0c0", auftauchen: klemme(t * 3, 0, 1), wackeln: 3, t })}
        ${ruhe ? laut("SEUFZ", 1050, 330, { groesse: 110, drehung: -10, farbe: "#d6dcff", auftauchen: klemme((t - k.zeilenStart[1] - 0.2) * 3, 0, 1) }) : ""}`;
    },

    dienstabend(k) {
      const { t } = k;
      return `<rect width="${W}" height="${H}" fill="url(#raum)"/><rect width="${W}" height="${H}" fill="url(#raster)"/>
        <rect x="120" y="330" width="520" height="230" fill="#fff" stroke="${LINIE}" stroke-width="8"/>
        <text x="380" y="420" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="64" fill="${FARBE.thw}">ORTSVERBAND ULM</text>
        <text x="380" y="500" text-anchor="middle" font-family="'Comic Neue', Archivo, sans-serif" font-weight="700" font-size="38">Dienstabend · 19:30 Uhr</text>
        <rect x="1360" y="110" width="400" height="330" fill="#9cc8ff" stroke="${LINIE}" stroke-width="8"/>
        <path d="M1560 110 v330 M1360 275 h400" stroke="${LINIE}" stroke-width="7"/>
        ${gkw(1330, 420, 0.22, t, { blaulicht: false, licht: false })}
        ${person({ x: 980, y: 1240, s: 1.0, haar: "#5a3a22", bart: true, kappe: true, blick: 1, gesicht: "froh", ohneBeine: true, arme: { l: "vorne", r: "vorne" }, t })}
        ${tisch(960, 900, 1500, { tuch: "#b88a55" })}
        <g transform="translate(980 900)">${laptop(440, 250, bogenMini(-190, -180, 380, Math.min(6, 1 + Math.floor(t * 1.2))))}</g>
        <g transform="translate(480 860)"><path d="M-40 -60 h80 v70 q0 30 -40 30 q-40 0 -40 -30z" fill="#fff" stroke="${LINIE}" stroke-width="7"/><path d="M40 -40 q40 0 30 30 q-6 16 -30 16" fill="none" stroke="${LINIE}" stroke-width="7"/>
          ${[0, 1, 2].map((i) => `<path d="M${-14 + i * 14} ${-80 - ((t * 30 + i * 20) % 50)} q10 -14 0 -28" fill="none" stroke="#999" stroke-width="5" opacity=".7"/>`).join("")}</g>`;
    },

    scan(k) {
      const { t, sprecher } = k;
      const piep = klemme((t - 0.5) * 3, 0, 1);
      return `<rect width="${W}" height="${H}" fill="url(#zelt-innen)"/><rect width="${W}" height="${H}" fill="url(#raster)"/>
        <ellipse cx="960" cy="200" rx="760" ry="520" fill="url(#lampe)"/>
        ${person({ x: 560, y: 1180, s: 1.0, zopf: true, stirnlampe: true, weste: "MELDEKOPF", haar: "#2b1a12", blick: 1, gesicht: "froh", ohneBeine: true, arme: { l: "vorne", r: "vorne" }, haltR: `<g transform="translate(110 -10) rotate(-6)">${tablet(300, 210, `<g transform="translate(-120 -40)">${piep > 0 ? `<rect x="0" y="0" width="240" height="120" fill="#e6f6ea"/><text x="120" y="78" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="50" fill="#1b7f3a">✓ 0/2/7/9</text>` : ""}</g>`)}</g>`, spricht: sprichtGerade(t, sprecher === "jana"), t })}
        ${person({ x: 1430, y: 1200, s: 1.0, haar: "#5a3a22", bart: true, kappe: true, blick: -1, gesicht: "froh", ohneBeine: true, arme: { l: "zeigen", r: "vorne" }, haltL: `<g transform="translate(-30 -40) rotate(-10)">${handy(110, 200)}</g>`, spricht: sprichtGerade(t, sprecher === "karsten"), t })}
        ${tisch(960, 900, 1600)}
        ${piep > 0 ? `<path d="M840 480 L1060 440" stroke="#4dff88" stroke-width="10" opacity="${1 - piep * 0.6}"/>` : ""}
        ${laut("PIEP!", 960, 360, { groesse: 120, drehung: -6, farbe: "#7dffb0", auftauchen: piep })}`;
    },

    "funk-digital"(k) {
      const { t, sprecher } = k;
      return `<rect width="${W}" height="${H}" fill="url(#zelt-innen)"/><rect width="${W}" height="${H}" fill="url(#raster)"/>
        <ellipse cx="700" cy="200" rx="700" ry="520" fill="url(#lampe)"/>
        ${person({ x: 700, y: 1220, s: 1.05, zopf: true, stirnlampe: true, weste: "MELDEKOPF", haar: "#2b1a12", blick: 1, gesicht: sprecher === "jana" ? "neutral" : "froh", ohneBeine: true, arme: { l: "vorne", r: "ohr" }, haltR: `<g transform="translate(-10 20)">${funkgeraet()}</g>`, spricht: sprichtGerade(t, sprecher === "jana"), t })}
        ${tisch(960, 900, 1700)}
        <g transform="translate(1280 760) rotate(-4)">${tablet(520, 340, `
          <text x="-230" y="-130" font-family="Archivo, sans-serif" font-weight="800" font-size="24" fill="#fff">Einsatz Sturmtief</text>
          ${[["5", "EINHEITEN"], ["2", "FÜHRER"], ["10", "UNTERF."], ["26", "MANNSCH."]].map(([z, l], i) => `<text x="${-200 + i * 112}" y="-10" font-family="Archivo, sans-serif" font-weight="800" font-size="54" fill="#11141b">${z}</text><text x="${-200 + i * 112}" y="18" font-family="monospace" font-size="15" fill="#5c6478">${l}</text>`).join("")}
          <text x="-200" y="96" font-family="Archivo, sans-serif" font-weight="800" font-size="70" fill="#12275e">38</text><text x="-110" y="96" font-family="monospace" font-size="20" fill="#5c6478">GESAMT</text>`)}</g>
        ${laut("KRRZZ", 1170, 380, { groesse: 80, drehung: 10, farbe: "#c8f0c0", auftauchen: klemme(t * 3, 0, 1), wackeln: 3, t })}`;
    },

    schluss(k) {
      const { t, sprecher } = k;
      return `${himmel("morgen")}
        <circle cx="1500" cy="760" r="160" fill="#ffd36b" stroke="${LINIE}" stroke-width="8"/>
        <path d="M0 760 Q480 700 960 740 T1920 720 L1920 1080 L0 1080Z" fill="#4a5a3a" stroke="${LINIE}" stroke-width="8"/>
        <path d="M0 860 L1920 840 L1920 1080 L0 1080Z" fill="#3a3f4c" stroke="${LINIE}" stroke-width="8"/>
        ${gkw(140, 990, 0.95, t, { blaulicht: false, licht: false })}
        <path d="M660 780 L700 640" stroke="${LINIE}" stroke-width="6"/>
        <g transform="translate(700 520)"><circle r="150" fill="#fff" stroke="${LINIE}" stroke-width="8"/><circle r="150" fill="url(#raster)"/>
          <text y="-100" text-anchor="middle" font-family="'Comic Neue', Archivo, sans-serif" font-weight="700" font-size="28">Handschuhfach</text>
          <g transform="translate(-40 20) rotate(-6)">${klemmbrett(120, 150, { schrift: true })}</g><g transform="translate(62 26) rotate(8) scale(.75)">${handy(90, 150)}</g></g>
        ${person({ x: 1180, y: 1060, s: 0.8, haar: "#5a3a22", bart: true, kappe: true, blick: -1, gesicht: "froh", arme: { l: "unten", r: "winken" }, spricht: sprichtGerade(t, sprecher === "karsten"), t })}
        ${person({ x: 1540, y: 1060, s: 0.78, zopf: true, weste: "MELDEKOPF", haar: "#2b1a12", blick: -1, gesicht: "froh", arme: { l: "winken", r: "unten" }, t })}`;
    },
  };

  // ── Sonderbilder (Titel, Rückspulen, Abspann) ───────────────────────────
  function rueckspulen(t, d) {
    const z = zufall(Math.floor(t * 25));
    let streifen = "";
    for (let i = 0; i < 9; i++) {
      const y = z() * H;
      streifen += `<rect x="0" y="${r(y)}" width="${W}" height="${r(4 + z() * 18)}" fill="#fff" opacity="${r(z() * 0.25 * 100) / 100}"/>`;
    }
    const uhr = -t * 720;
    const panelNamen = ["funk", "schlange", "rechnen", "tisch", "regen", "fahrerhaus", "kolonne"];
    const idx = Math.min(panelNamen.length - 1, Math.floor((t / Math.max(1, d - 0.8)) * panelNamen.length));
    const p = PANELS[panelNamen[idx]]({ t: 2 - (t % 0.3), d, sprecher: null, zeilenStart: [0, 0, 0] });
    return `<g filter="url(#grau)" opacity=".55" transform="translate(${r(Math.sin(t * 30) * 12)} 0)">${p}</g>
      <rect width="${W}" height="${H}" fill="#0b1430" opacity=".35"/>${streifen}
      <g transform="translate(960 470)">
        <circle r="150" fill="#fff" stroke="${LINIE}" stroke-width="10"/>
        <line x1="0" y1="0" x2="0" y2="-110" stroke="${LINIE}" stroke-width="12" stroke-linecap="round" transform="rotate(${uhr})"/>
        <line x1="0" y1="0" x2="70" y2="0" stroke="${LINIE}" stroke-width="12" stroke-linecap="round" transform="rotate(${uhr / 12})"/>
      </g>
      ${laut("◀◀ NOCH MAL VON VORNE", 960, 760, { groesse: 110, drehung: -3, farbe: "#fff", auftauchen: klemme(t * 2, 0, 1) })}
      <text x="80" y="110" font-family="monospace" font-size="56" fill="#fff" opacity="${Math.floor(t * 2) % 2 ? 1 : 0.4}">◀◀ REW</text>`;
  }

  function abspann(t, icon) {
    const a = (v) => klemme((t - v) * 2, 0, 1);
    const zeilen = ["kostenlos", "freie Software (EUPL-1.2)", "ohne Anmeldung", "Daten bleiben auf dem Gerät", "Papier bleibt die Rückfallebene"];
    return `<rect width="${W}" height="${H}" fill="#12275e"/><rect width="${W}" height="${H}" fill="url(#raster-hell)"/>
      <g opacity="${a(0)}" transform="translate(960 300)">
        ${icon ? `<image href="${icon}" x="-90" y="-150" width="180" height="180"/>` : ""}
        <text y="120" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="96" fill="#fff">Erfassungsbogen</text>
        <text y="200" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="600" font-size="54" fill="#ffd23f">erfassungsbogen.app</text>
      </g>
      ${zeilen.map((z, i) => `<g opacity="${a(1 + i * 0.6)}"><text x="960" y="${640 + i * 62}" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="600" font-size="40" fill="#fff">${esc(z)}</text></g>`).join("")}
      <text x="960" y="1045" text-anchor="middle" font-family="Archivo, sans-serif" font-size="24" fill="#aeb8d6" opacity="${a(2)}">Personen und Handlung sind erfunden. App-Aufnahmen: echte Bedienung von erfassungsbogen.app mit Beispieldaten.</text>`;
  }

  // ── Panel mit Rahmen, Blasen und Kasten zusammensetzen ──────────────────
  /**
   * Ein Comic-Bild. k: { szene, t, d, zeilen: [{start, ende, zeile}], icon }.
   */
  function bild(k) {
    const { szene, t, d } = k;
    const zeilen = k.zeilen;
    const jetzt = zeilen.filter((z) => t >= z.start && t < z.ende + 0.25);
    const aktiv = zeilen.find((z) => t >= z.start && t < z.ende);
    const sprecher = aktiv ? aktiv.zeile.sprecher : null;
    const zeilenStart = zeilen.map((z) => z.start);
    const art = szene.bild.art;
    let inhalt;
    if (art === "titel") inhalt = PANELS.titel({ t, d, sprecher, zeilenStart });
    else if (art === "rueckspulen") inhalt = rueckspulen(t, d);
    else if (art === "abspann") inhalt = abspann(t, k.icon);
    else inhalt = (PANELS[szene.bild.panel] || PANELS.titel)({ t, d, sprecher, zeilenStart });

    // Leichte Kamerafahrt in das Panel hinein.
    const zoom = art === "abspann" ? 1 : 1 + 0.035 * glatt(t / Math.max(d, 1));
    let blasen = "";
    // Erzähler: nur der zuletzt begonnene Kasten bleibt stehen.
    const erzaehler = zeilen.filter((z) => z.zeile.sprecher === "erzaehler" && t >= z.start).pop();
    if (erzaehler && art !== "abspann" && art !== "titel") {
      blasen += kasten({ text: erzaehler.zeile.text, auftauchen: (t - erzaehler.start) / 0.3, y: art === "rueckspulen" ? 900 : 46, x: art === "rueckspulen" ? 480 : 50, b: art === "rueckspulen" ? 960 : 860 });
    }
    if (art === "titel" && erzaehler) {
      blasen += kasten({ text: erzaehler.zeile.text, auftauchen: (t - erzaehler.start) / 0.3, x: 360, y: 880, b: 1200 });
    }
    for (const z of jetzt) {
      if (z.zeile.sprecher === "erzaehler" || !z.zeile.blase) continue;
      const b = z.zeile.blase;
      blasen += blase({ text: z.zeile.text, x: b.x, y: b.y, b: b.b, spitze: b.spitze, art: z.zeile.funk || k.sprecher?.[z.zeile.sprecher]?.funk ? "funk" : "normal", auftauchen: (t - z.start) / 0.25 });
    }
    const ort = szene.bild.ort ? ortsKasten(szene.bild.ort, t / 0.4) : "";
    const rahmen = art === "abspann" ? "" : `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${LINIE}" stroke-width="16"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      ${DEFS}<defs><filter id="grau"><feColorMatrix type="saturate" values="0.15"/></filter></defs>
      <g transform="translate(${W / 2} ${H / 2}) scale(${r(zoom * 1000) / 1000}) translate(${-W / 2} ${-H / 2})">${inhalt}</g>
      ${ort}${blasen}${rahmen}
    </svg>`;
  }

  window.Comic = { bild, W, H, glatt, klemme, qrMuster };
})();
