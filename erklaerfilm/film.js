/**
 * Erklärfilm: Zeitplan und Darstellung.
 *
 * Liest drehbuch.json, aufnahmen/index.json und (falls vorhanden)
 * audio/dauer.json. Ohne Sprachaufnahmen schätzt der Film die Dauer jeder
 * Zeile aus der Textlänge — so lässt sich der Ablauf schon vor ElevenLabs
 * prüfen.
 *
 * window.film.zeige(t) setzt das Bild auf Sekunde t (fürs Rendern Bild für
 * Bild); window.film.abspielen() spielt mit Ton in Echtzeit (Vorschau).
 */
(function () {
  "use strict";
  const { W, H, glatt, klemme } = window.Comic;
  const param = new URLSearchParams(location.search);
  const RENDER = param.has("render");
  const UNTERTITEL = param.get("untertitel") !== "0";
  const ZEICHEN_JE_SEKUNDE = 14.5; // Schätzung ohne Audio: ruhiges Deutsch
  const VORLAUF = 0.5; // Sekunden vor der ersten Zeile einer Szene
  const NACHLAUF = 0.8; // nach der letzten Zeile
  const WISCH = 0.45; // Szenenwechsel (Comic-Wischblende)
  const MIN_SZENE = { titel: 6.5, abspann: 7 };

  const $ = (s) => document.querySelector(s);

  async function json(pfad, ersatz) {
    try {
      const a = await fetch(pfad, { cache: "no-store" });
      if (!a.ok) throw new Error(a.status);
      return await a.json();
    } catch {
      return ersatz;
    }
  }

  // ── Zeitplan ────────────────────────────────────────────────────────────
  function zeitplan(drehbuch, dauern) {
    const szenen = [];
    let t = 0;
    for (const szene of drehbuch.szenen) {
      const start = t;
      let lt = VORLAUF;
      const zeilen = szene.zeilen.map((zeile, i) => {
        const echt = dauern[zeile.id];
        const dauer = echt ?? Math.max(1.2, (zeile.sprechtext ?? zeile.text).length / ZEICHEN_JE_SEKUNDE);
        const z = { zeile, start: lt, ende: lt + dauer, echt: echt != null };
        lt = z.ende + (i < szene.zeilen.length - 1 ? drehbuch.pause : 0);
        return z;
      });
      const d = Math.max(lt + NACHLAUF, MIN_SZENE[szene.bild.art] ?? 0);
      szenen.push({ szene, start, ende: start + d, d, zeilen });
      t += d;
    }
    return { szenen, dauer: t };
  }

  /**
   * App-Bilder über den ganzen Film: Jede Zeile verteilt ihre Bilder
   * gleichmäßig über ihre Sprechzeit.
   */
  function appBilder(plan, aufnahmen) {
    const nachNotiz = new Map();
    for (const liste of Object.values(aufnahmen.szenen ?? {})) for (const e of liste) nachNotiz.set(e.notiz, e);
    const folge = [];
    for (const s of plan.szenen) {
      if (s.szene.bild.art !== "app") continue;
      for (const z of s.zeilen) {
        const bilder = (z.zeile.bilder ?? []).map((n) => nachNotiz.get(n)).filter(Boolean);
        const fehlend = (z.zeile.bilder ?? []).filter((n) => !nachNotiz.has(n));
        if (fehlend.length) console.warn("Aufnahme fehlt:", fehlend.join(", "));
        bilder.forEach((b, i) => {
          const vorher = folge[folge.length - 1];
          if (vorher && vorher.bild === b.bild) return;
          const start = s.start + (i === 0 && z === s.zeilen[0] ? 0 : z.start + ((z.ende - z.start) * i) / bilder.length);
          folge.push({ ...b, start, schild: s.szene.bild.schild });
        });
      }
    }
    return folge;
  }

  // ── App-Ebene ───────────────────────────────────────────────────────────
  const FENSTER = { x: 260, y: 116, b: 1400, kopf: 46 };
  FENSTER.h = Math.round((FENSTER.b * 800) / 1280); // 912.5 → Seitenverhältnis 1280×800
  let appBildEl = new Map();

  function appEbeneBauen(folge, aufnahmen) {
    const ebene = $("#app");
    ebene.innerHTML = `
      <div class="app-grund"></div>
      <div class="schild"><span></span></div>
      <div class="fenster" style="left:${FENSTER.x}px;top:${FENSTER.y}px;width:${FENSTER.b}px;height:${FENSTER.h + FENSTER.kopf}px">
        <div class="fenster-kopf"><i></i><i></i><i></i><div class="adresse">erfassungsbogen.app</div></div>
        <div class="bildflaeche" style="height:${FENSTER.h}px"><div class="kamera"></div>
          <div class="markierung"></div>
          <svg class="zeiger" viewBox="0 0 40 52" width="44" height="57"><path d="M3 3 L3 42 L13 33 L20 49 L27 46 L20 30 L34 30Z" fill="#fff" stroke="#111" stroke-width="3" stroke-linejoin="round"/></svg>
          <div class="klick"></div>
        </div>
      </div>`;
    const kamera = ebene.querySelector(".kamera");
    appBildEl = new Map();
    for (const e of folge) {
      if (appBildEl.has(e.bild)) continue;
      const img = new Image();
      img.src = `aufnahmen/${e.bild}`;
      img.className = e.papier ? "app-bild papier" : "app-bild";
      img.decoding = "sync";
      kamera.appendChild(img);
      appBildEl.set(e.bild, img);
    }
    return Promise.all([...appBildEl.values()].map((i) => i.decode().catch(() => {})));
  }

  /** Kameraeinstellung für ein Bild: Maßstab und Verschiebung in der Bildfläche. */
  function kameraFuer(e, aufnahmen) {
    const fb = FENSTER.b;
    const fh = FENSTER.h;
    if (e.papier) {
      // Papierseite: Breite = Fensterbreite * 0.62, auf das Ziel zentriert.
      const seiteB = 1240;
      const basis = (fb * 0.62) / seiteB;
      const z = e.ziel;
      const k = Math.min(1.9, (fb * 0.8) / (z.w * basis), (fh * 0.85) / (z.h * basis));
      const m = basis * k;
      return { m, x: fb / 2 - (z.x + z.w / 2) * m, y: fh / 2 - (z.y + z.h / 2) * m, papier: true, ziel: null };
    }
    const basis = fb / aufnahmen.breite; // CSS-Pixel der Aufnahme → Fenster
    if (!e.ziel) return { m: basis, x: 0, y: 0, ziel: null };
    const z = e.ziel;
    const k = Math.min(1.5, (fb * 0.85) / (z.w * basis), (fh * 0.7) / (z.h * basis));
    const m = basis * Math.max(1, k);
    let x = fb / 2 - (z.x + z.w / 2) * m;
    let y = fh / 2 - (z.y + z.h / 2) * m;
    // Nicht über den Bildrand hinaus fahren.
    x = klemme(x, fb - aufnahmen.breite * m, 0);
    y = klemme(y, fh - aufnahmen.hoehe * m, 0);
    return { m, x, y, ziel: z };
  }

  const mische = (a, b, p) => a + (b - a) * p;

  function appZeigen(t, folge, aufnahmen) {
    let i = folge.findIndex((e) => e.start > t) - 1;
    if (i === -2) i = folge.length - 1;
    if (i < 0) i = 0;
    const e = folge[i];
    const vorher = folge[Math.max(0, i - 1)];
    const seit = t - e.start;
    const ueberblend = glatt(seit / 0.35);
    const fahrt = glatt(seit / 0.8);
    const k0 = kameraFuer(vorher, aufnahmen);
    const k1 = kameraFuer(e, aufnahmen);
    // Beim Wechsel zwischen Papier und Bildschirm nicht fahren, nur blenden.
    const kam =
      k0.papier !== k1.papier
        ? k1
        : { m: mische(k0.m, k1.m, fahrt), x: mische(k0.x, k1.x, fahrt), y: mische(k0.y, k1.y, fahrt) };
    for (const [name, img] of appBildEl) {
      const sicht = name === e.bild ? 1 : name === vorher.bild && i > 0 ? 1 - ueberblend : 0;
      img.style.opacity = name === e.bild ? ueberblend : sicht;
      img.style.zIndex = name === e.bild ? 2 : 1;
      if (sicht > 0 || name === e.bild) {
        const breite = img.classList.contains("papier") ? 1240 : aufnahmen.breite;
        img.style.width = `${breite}px`;
        img.style.transform = `translate(${kam.x}px, ${kam.y}px) scale(${kam.m})`;
      }
    }
    $("#app .bildflaeche").classList.toggle("papier-grund", !!e.papier);
    // Zeiger und Markierung auf das Ziel des aktuellen Bilds.
    const zeiger = $("#app .zeiger");
    const mark = $("#app .markierung");
    const klick = $("#app .klick");
    if (e.ziel && !e.papier) {
      const zx = kam.x + (e.ziel.x + e.ziel.w * 0.5) * kam.m;
      const zy = kam.y + (e.ziel.y + e.ziel.h * 0.5) * kam.m;
      const vz = vorher.ziel && !vorher.papier && i > 0 ? vorher : null;
      const ax = vz ? kam.x + (vz.ziel.x + vz.ziel.w * 0.5) * kam.m : FENSTER.b * 0.75;
      const ay = vz ? kam.y + (vz.ziel.y + vz.ziel.h * 0.5) * kam.m : FENSTER.h * 0.9;
      const p = glatt(seit / 0.55);
      zeiger.style.opacity = 1;
      zeiger.style.transform = `translate(${mische(ax, zx, p)}px, ${mische(ay, zy, p)}px)`;
      const kp = (seit - 0.55) / 0.5;
      klick.style.opacity = kp > 0 && kp < 1 ? 1 - kp : 0;
      klick.style.transform = `translate(${zx}px, ${zy}px) scale(${0.3 + Math.max(0, kp) * 1.4})`;
      const mp = klemme((seit - 0.5) / 0.3, 0, 1);
      mark.style.opacity = mp;
      mark.style.left = `${kam.x + e.ziel.x * kam.m - 8}px`;
      mark.style.top = `${kam.y + e.ziel.y * kam.m - 8}px`;
      mark.style.width = `${e.ziel.w * kam.m + 16}px`;
      mark.style.height = `${e.ziel.h * kam.m + 16}px`;
    } else {
      zeiger.style.opacity = 0;
      klick.style.opacity = 0;
      mark.style.opacity = 0;
    }
    const schild = $("#app .schild span");
    if (schild.textContent !== e.schild) schild.textContent = e.schild ?? "";
  }

  // ── Untertitel ──────────────────────────────────────────────────────────
  function untertitel(t, s) {
    const el = $("#untertitel");
    if (!UNTERTITEL || s.szene.bild.art !== "app") {
      el.style.opacity = 0;
      return;
    }
    const lt = t - s.start;
    const z = s.zeilen.find((z) => lt >= z.start && lt < z.ende + 0.2);
    if (!z) {
      el.style.opacity = 0;
      return;
    }
    if (el.dataset.id !== z.zeile.id) {
      el.dataset.id = z.zeile.id;
      el.textContent = z.zeile.text;
    }
    el.style.opacity = klemme((lt - z.start) / 0.15, 0, 1);
  }

  // ── Hauptdarstellung ────────────────────────────────────────────────────
  let D; // { drehbuch, plan, folge, aufnahmen, icon }

  function szeneBei(t) {
    const { szenen } = D.plan;
    for (let i = 0; i < szenen.length; i++) if (t < szenen[i].ende) return i;
    return szenen.length - 1;
  }

  function comicSvg(s, lt) {
    return window.Comic.bild({ szene: s.szene, t: lt, d: s.d, zeilen: s.zeilen, icon: D.icon, sprecher: D.drehbuch.sprecher });
  }

  function zeige(t) {
    t = klemme(t, 0, D.plan.dauer - 1 / 50);
    const i = szeneBei(t);
    const s = D.plan.szenen[i];
    const lt = t - s.start;
    const vorher = i > 0 ? D.plan.szenen[i - 1] : null;
    const wisch = vorher && lt < WISCH ? glatt(lt / WISCH) : 1;
    const istApp = s.szene.bild.art === "app";
    const warApp = vorher?.szene.bild.art === "app";
    const unten = $("#unten");
    const oben = $("#oben");
    const app = $("#app");

    // Ebenen: aktuelle Szene oben, während der Wischblende die vorige darunter.
    if (istApp) {
      appZeigen(t, D.folge, D.aufnahmen);
      if (wisch < 1 && !warApp) {
        unten.innerHTML = comicSvg(vorher, vorher.d - 0.01);
        unten.style.display = "block";
        app.style.zIndex = 3;
        app.style.clipPath = wischPfad(wisch);
      } else {
        verbergen(unten);
        app.style.clipPath = "none";
      }
      app.style.display = "block";
      verbergen(oben);
    } else {
      oben.innerHTML = comicSvg(s, lt);
      oben.style.display = "block";
      oben.style.clipPath = wisch < 1 ? wischPfad(wisch) : "none";
      if (wisch < 1) {
        if (warApp) {
          appZeigen(t, D.folge, D.aufnahmen);
          app.style.display = "block";
          app.style.zIndex = 1;
          app.style.clipPath = "none";
          verbergen(unten);
        } else {
          unten.innerHTML = comicSvg(vorher, vorher.d - 0.01);
          unten.style.display = "block";
          app.style.display = "none";
        }
      } else {
        verbergen(unten);
        app.style.display = "none";
      }
    }
    untertitel(t, s);
    $("#zeit").textContent = `${t.toFixed(1)} / ${D.plan.dauer.toFixed(1)} s · ${s.szene.id}`;
    return { szene: s.szene.id, t };
  }

  /**
   * Comic-Ebene ausblenden UND leeren. Beide Ebenen tragen dieselben
   * SVG-IDs (Verläufe, Raster); bliebe die verborgene stehen, löste der
   * Browser url(#…) gegen ihre display:none-Kopie auf und zeichnete in der
   * sichtbaren Ebene weder Himmel noch Zeltinneres.
   */
  function verbergen(ebene) {
    ebene.style.display = "none";
    if (ebene.firstChild) ebene.textContent = "";
  }

  /** Comic-Wischblende: schräge Kante von links nach rechts. */
  function wischPfad(p) {
    const x = -300 + p * (W + 600);
    return `polygon(0 0, ${x + 200}px 0, ${x - 200}px 100%, 0 100%)`;
  }

  // ── Vorschau mit Ton ────────────────────────────────────────────────────
  let laeuft = null;
  const toene = new Map();

  function tonFuer(id) {
    if (!D.dauern[id]) return null;
    if (!toene.has(id)) {
      const a = new Audio(`audio/${id}.mp3`);
      a.preload = "auto";
      toene.set(id, a);
    }
    return toene.get(id);
  }

  function abspielen(ab = 0) {
    anhalten();
    const t0 = performance.now() - ab * 1000;
    const geplant = [];
    for (const s of D.plan.szenen)
      for (const z of s.zeilen) {
        const start = s.start + z.start;
        if (start + 0.05 < ab) continue;
        const a = tonFuer(z.zeile.id);
        if (a) geplant.push(setTimeout(() => { a.currentTime = 0; a.play().catch(() => {}); }, (start - ab) * 1000));
      }
    const schritt = () => {
      const t = (performance.now() - t0) / 1000;
      zeige(t);
      $("#regler").value = t;
      if (t < D.plan.dauer) laeuft.raf = requestAnimationFrame(schritt);
      else anhalten();
    };
    laeuft = { geplant, raf: requestAnimationFrame(schritt) };
  }

  function anhalten() {
    if (!laeuft) return;
    cancelAnimationFrame(laeuft.raf);
    laeuft.geplant.forEach(clearTimeout);
    for (const a of toene.values()) a.pause();
    laeuft = null;
  }

  // ── Start ───────────────────────────────────────────────────────────────
  async function laden() {
    const [drehbuch, aufnahmen, dauern] = await Promise.all([
      json("drehbuch.json"),
      json("aufnahmen/index.json", { breite: 1280, hoehe: 800, szenen: {} }),
      json("audio/dauer.json", {}),
    ]);
    const plan = zeitplan(drehbuch, dauern);
    const folge = appBilder(plan, aufnahmen);
    D = { drehbuch, aufnahmen, dauern, plan, folge, icon: "../public/icon.svg" };
    await appEbeneBauen(folge, aufnahmen);
    await document.fonts.ready;
    const regler = $("#regler");
    regler.max = plan.dauer;
    regler.step = 0.04;
    regler.oninput = () => { anhalten(); zeige(Number(regler.value)); };
    $("#play").onclick = () => (laeuft ? anhalten() : abspielen(Number(regler.value)));
    document.body.classList.toggle("render", RENDER);
    const fehlendeAudios = drehbuch.szenen.flatMap((s) => s.zeilen).filter((z) => dauern[z.id] == null).length;
    $("#hinweis").textContent = fehlendeAudios
      ? `${fehlendeAudios} Zeilen ohne Sprachaufnahme — Dauer geschätzt (npm run erklaerfilm:stimmen).`
      : "Alle Sprachaufnahmen vorhanden.";
    skalieren();
    zeige(Number(param.get("t") ?? 0));
    window.film = {
      dauer: plan.dauer,
      fps: drehbuch.fps,
      zeige,
      abspielen,
      anhalten,
      plan: () =>
        plan.szenen.map((s) => ({
          id: s.szene.id,
          start: s.start,
          ende: s.ende,
          geraeusche: s.szene.geraeusche ?? [],
          zeilen: s.zeilen.map((z) => ({ id: z.zeile.id, sprecher: z.zeile.sprecher, text: z.zeile.text, funk: !!(z.zeile.funk || drehbuch.sprecher[z.zeile.sprecher]?.funk), start: s.start + z.start, ende: s.start + z.ende, echt: z.echt })),
        })),
      bereit: true,
    };
  }

  function skalieren() {
    if (RENDER) return;
    const platz = Math.min(innerWidth / W, (innerHeight - 70) / H);
    $("#buehne").style.transform = `scale(${platz})`;
  }
  addEventListener("resize", skalieren);
  addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); $("#play").click(); }
  });

  laden().catch((f) => {
    document.body.insertAdjacentHTML("afterbegin", `<pre style="color:#fff;padding:20px">Film konnte nicht laden: ${f}</pre>`);
    throw f;
  });
})();
