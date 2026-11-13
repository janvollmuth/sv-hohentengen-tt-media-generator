/* SVH Mediengenerator · Video-Export (animierte Stories und Beiträge)
   ------------------------------------------------------------------
   Erzeugt aus einem Layout ein MP4 (H.264), in dem sich das Layout in
   wenigen Sekunden aufbaut und dann stehen bleibt. Der letzte Frame
   entspricht dem PNG-Export.

   Vorgehen (kein Frame wird per html-to-image gerendert, das wäre am Handy
   zu langsam):
     1. Grundebene — Layout einmal rendern, alle [data-anim] ausgeblendet.
     2. Je [data-anim] eine Ebene — Layout erneut rendern, nur dieses
        Element sichtbar, transparenter Grund, Ergebnis auf das Rechteck
        des Elements zugeschnitten.
     3. Für "count" eine Ebene pro Zwischenwert.
     4. Pro Frame alles auf ein Canvas zeichnen (Verschiebung, Skalierung,
        Deckkraft, Beschnitt laut Zeitachse).
     5. Kodieren per WebCodecs, Muxen per mediabunny zu MP4.

   Der PNG-Export in app.js bleibt unberührt. Dieses Skript hängt sich nur
   an den Knopf #save-video und nutzt die Bausteine aus app.js
   (attached, nodeBackground, primeRenderer, deliver, progress, busy).
*/

var VIDEO_CFG = {
  fps: 30,
  dauer: 15,              /* Sekunden, per data-anim-duration je Layout änderbar */
  bitrate: 8000000,       /* 8 Mbit/s */
  keyframe: 2,            /* Keyframe-Abstand in Sekunden */
  /* Reihenfolge der Codec-Kandidaten: High, Main, Baseline (Level 4.0) */
  codecs: ['avc1.640028', 'avc1.4d0028', 'avc1.42e028'],
  /* mediabunny liegt nur als ES-Modul vor, wird darum per import() geladen. */
  lib: 'https://cdn.jsdelivr.net/npm/mediabunny@1.65.2/dist/bundles/mediabunny.min.mjs',
  /* Standardwerte der Animations-Attribute */
  stdDauer: 1.2,
  stdDauerCount: 1.5,
  stdDist: 120,
  /* Obergrenze für count: darüber wird auf fade ausgewichen */
  countMax: 20
};

/* ---------- Beschleunigungskurven ----------
   easeOutCubic entspricht cubic-bezier(.33,1,.68,1) der Vorschau,
   easeOutBack dem Überschwinger cubic-bezier(.34,1.56,.64,1). */
function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }
function easeOutBack(p) {
  var c = 1.70158, c3 = c + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
}
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

/* ---------- Bibliothek nachladen ----------
   Erst beim ersten Klick, damit der Seitenstart nicht langsamer wird. */
var videoLib = null;
function loadVideoLib() {
  if (!videoLib) {
    videoLib = import(VIDEO_CFG.lib).catch(function (e) {
      videoLib = null;
      throw e;
    });
  }
  return videoLib;
}

/* Kann der Browser überhaupt Video? Geprüft wird ohne die Bibliothek,
   damit die Meldung sofort kommt. */
function videoPossible() {
  return typeof window.VideoEncoder === 'function' && typeof window.VideoFrame === 'function';
}

/* Hat das Layout Animationen? Entscheidet über die Sichtbarkeit des Knopfs. */
function videoAnimated(node) {
  return !!(node && node.querySelector && node.querySelector('[data-anim]'));
}

/* Welcher Codec geht? Reihenfolge laut VIDEO_CFG.codecs. */
function pickCodec(mb, fmt) {
  var list = VIDEO_CFG.codecs;
  function tryNext(i) {
    if (i >= list.length) {
      /* Keiner der Kandidaten: letzter Versuch ohne feste Codec-Zeichenkette. */
      return mb.canEncodeVideo('avc', { width: fmt.w, height: fmt.h, bitrate: VIDEO_CFG.bitrate })
        .then(function (ok) { return ok ? '' : null; });
    }
    return mb.canEncodeVideo('avc', {
      width: fmt.w, height: fmt.h, bitrate: VIDEO_CFG.bitrate, fullCodecString: list[i]
    }).then(function (ok) { return ok ? list[i] : tryNext(i + 1); }, function () { return tryNext(i + 1); });
  }
  return tryNext(0);
}

/* ---------- Ebenen einsammeln ----------
   Liest die data-Attribute, löst Staffel-Startzeiten auf und merkt sich für
   jede Ebene die übergeordnete Ebene (Verschachtelung ist erlaubt: das Kind
   wird in der Eltern-Ebene ausgeblendet und separat gezeichnet, seine
   Transformation addiert sich zur Eltern-Ebene). */
function animZahl(el, attr, std) {
  var raw = el.getAttribute(attr);
  if (raw === null || raw === '') return std;
  var v = parseFloat(raw);
  return isNaN(v) ? std : v;
}

/* Sichtbar im Sinne des Layouts: nicht display:none und mit Fläche. */
function animSichtbar(el) {
  if (!el.getClientRects().length) return false;
  var b = el.getBoundingClientRect();
  return b.width > 0.5 && b.height > 0.5;
}

function collectAnimLayers(node, scale) {
  var nb = node.getBoundingClientRect();
  function rectOf(el) {
    var b = el.getBoundingClientRect();
    return {
      x: (b.left - nb.left) / scale,
      y: (b.top - nb.top) / scale,
      w: b.width / scale,
      h: b.height / scale
    };
  }

  /* Staffel-Container: verteilt die Startzeiten auf seine sichtbaren Kinder. */
  var listEl = node.querySelector('[data-anim-stagger]');
  var stagger = 0, staggerStart = 0, rows = [], sichtbareRows = 0;
  if (listEl) {
    stagger = animZahl(listEl, 'data-anim-stagger', 0.7);
    staggerStart = animZahl(listEl, 'data-anim-stagger-start', 0);
    Array.prototype.forEach.call(listEl.children, function (kind) {
      if (!animSichtbar(kind)) return;
      rows.push({ el: kind, start: staggerStart + sichtbareRows * stagger });
      sichtbareRows++;
    });
  }
  /* Zu welcher Staffel-Zeile gehört ein Element? */
  function rowOf(el) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].el === el || rows[i].el.contains(el)) return rows[i];
    }
    return null;
  }

  var raw = node.querySelectorAll('[data-anim]');
  var layers = [];
  Array.prototype.forEach.call(raw, function (el) {
    if (!animSichtbar(el)) return;

    var effect = el.getAttribute('data-anim');
    var dur = animZahl(el, 'data-anim-dur', effect === 'count' ? VIDEO_CFG.stdDauerCount : VIDEO_CFG.stdDauer);
    var delay = animZahl(el, 'data-anim-delay', 0);

    /* Startzeit: normalerweise absolut. Innerhalb einer Staffel-Zeile gilt
       der Delay relativ zum Zeilenstart; der Zusatztext nach der Staffel
       bekommt data-anim-after="list". */
    var row = rowOf(el);
    if (row) {
      delay = (row.el === el ? row.start + delay : row.start + delay);
    } else if (el.getAttribute('data-anim-after') === 'list' && listEl) {
      delay = staggerStart + sichtbareRows * stagger + delay;
    }

    /* count nur für ganze Zahlen in vernünftiger Größe, sonst fade. */
    var ziel = el.querySelector('[data-field]') || el;
    var endwert = null;
    if (effect === 'count') {
      var txt = (ziel.textContent || '').trim();
      var n = parseInt(txt, 10);
      if (!/^\d+$/.test(txt) || isNaN(n) || n < 0 || n > VIDEO_CFG.countMax) {
        effect = 'fade';
      } else {
        endwert = n;
      }
    }

    layers.push({
      el: el,
      ziel: ziel,
      effect: effect,
      delay: delay,
      dur: dur <= 0 ? 0.001 : dur,
      dist: animZahl(el, 'data-anim-dist', VIDEO_CFG.stdDist),
      origin: el.getAttribute('data-anim-origin') || 'mitte',
      endwert: endwert,
      parent: -1,
      rect: rectOf(el),
      bmp: null,
      werte: null
    });
  });

  /* Eltern-Ebene zuordnen (nächster Vorfahr, der selbst Ebene ist). */
  layers.forEach(function (L, i) {
    for (var j = 0; j < layers.length; j++) {
      if (j === i) continue;
      if (!layers[j].el.contains(L.el)) continue;
      if (L.parent < 0 || layers[L.parent].el.contains(layers[j].el)) L.parent = j;
    }
  });

  return { layers: layers, rectOf: rectOf };
}

/* ---------- Ebenen rendern ----------
   Läuft komplett in einem attached()-Aufruf, mit denselben Optionen wie der
   PNG-Export. visibility und textContent werden in jedem Fall
   wiederhergestellt (try/finally). */
function toBitmap(dataUrl) {
  return fetch(dataUrl).then(function (r) { return r.blob(); }).then(function (b) { return createImageBitmap(b); });
}

/* Ist auf der Ebene überhaupt etwas zu sehen?
   html-to-image liefert ein frisch gesetztes, großes Foto gelegentlich noch
   nicht mit — dann käme eine komplett durchsichtige Ebene heraus und das Foto
   fehlte im Video. Der PNG-Export in app.js kennt dasselbe Problem und
   rendert bis zu viermal (renderPng/pngHasPhoto); hier dieselbe Absicherung,
   nur allgemeiner: ein sichtbares Element mit Fläche muss Pixel liefern. */
function canvasLeer(c) {
  try {
    var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    /* Grobes Raster genügt: höchstens ~20000 Stichproben. */
    var schritt = Math.max(1, Math.floor(d.length / 4 / 20000)) * 4;
    for (var i = 3; i < d.length; i += schritt) if (d[i] > 10) return false;
    return true;
  } catch (e) { return false; }
}

/* Vollrender des Layouts mit transparentem Grund, auf ein Rechteck
   zugeschnitten. Sicher für Textblöcke: der Umbruch stammt aus dem fertig
   gesetzten Layout. */
function renderCroppedCanvas(node, fmt, css, rect) {
  return window.htmlToImage.toPng(node, {
    width: fmt.w, height: fmt.h, pixelRatio: 1, fontEmbedCSS: css
  }).then(toBitmap).then(function (bmp) {
    var w = Math.max(1, Math.round(rect.w)), h = Math.max(1, Math.round(rect.h));
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, -Math.round(rect.x), -Math.round(rect.y));
    bmp.close();
    return c;
  });
}

function renderCropped(node, fmt, css, rect, versuch) {
  versuch = versuch || 0;
  return renderCroppedCanvas(node, fmt, css, rect).then(function (c) {
    if (!canvasLeer(c)) return createImageBitmap(c);
    if (versuch >= 3) {
      console.warn('Video: Ebene blieb nach 4 Versuchen leer', rect);
      return createImageBitmap(c);
    }
    return renderCropped(node, fmt, css, rect, versuch + 1);
  });
}

/* Einzelnes Element direkt rendern — deutlich schneller, aber nur für
   Blockelemente mit Fläche zuverlässig. Wird für die Zwischenwerte von
   count genutzt (reine Zahlen, kein Umbruch). */
function renderElement(el, css) {
  return window.htmlToImage.toPng(el, { pixelRatio: 1, fontEmbedCSS: css })
    .then(toBitmap).then(function (bmp) {
      var c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      c.getContext('2d').drawImage(bmp, 0, 0);
      bmp.close();
      if (canvasLeer(c)) throw new Error('leere Ebene');
      return createImageBitmap(c);
    });
}

function renderLayers(node, fmt, occ, css, bg, onStep) {
  var nb0 = node.getBoundingClientRect();
  var scale = nb0.width > 0 ? nb0.width / fmt.w : 1;
  var sammlung = collectAnimLayers(node, scale);
  var layers = sammlung.layers, rectOf = sammlung.rectOf;

  var dauer = animZahl(node, 'data-anim-duration', VIDEO_CFG.dauer);
  var merker = [];   /* zum Wiederherstellen */

  function merkeVis(el) { merker.push({ el: el, vis: el.style.visibility }); }
  function merkeOpa(el) { merker.push({ el: el, opa: el.style.opacity }); }
  function stelleHer() {
    merker.forEach(function (m) {
      if (m.hasOwnProperty('vis')) m.el.style.visibility = m.vis;
      else m.el.style.opacity = m.opa;
    });
    merker = [];
  }

  /* app.js setzt an einigen Stellen ausdrücklich visibility:visible
     (z. B. am Punktestand einer Ergebniszeile). Ein solches Kind bleibt
     sichtbar, obwohl der Vorfahr auf hidden steht — so lief vorher der
     Doppelpunkt in die Grundebene. Darum:
       Grundebene   → opacity:0 (lässt sich von Kindern nicht aufheben)
       Einzelebene  → Wurzel hidden, Ziel visible, und jedes ausdrücklich
                      sichtbare Element außerhalb des Ziels wird mit
                      abgeschaltet. */
  function ausdruecklichSichtbar() {
    var raus = [];
    Array.prototype.forEach.call(node.querySelectorAll('[style]'), function (el) {
      if (el.style.visibility === 'visible') raus.push(el);
    });
    return raus;
  }
  var sichtbarGesetzt = ausdruecklichSichtbar();

  /* Zähler für den Fortschritt: Grundebene + Ebenen + Zwischenwerte */
  var schritte = 1;
  layers.forEach(function (L) {
    schritte += L.effect === 'count' ? L.endwert + 1 : 1;
  });
  var getan = 0;
  function schritt() { getan++; if (onStep) onStep(getan / schritte); }

  var base = null;

  /* Schritt 1: Grundebene, alle Ebenen ausgeblendet. */
  function machGrundebene() {
    layers.forEach(function (L) { merkeOpa(L.el); L.el.style.opacity = '0'; });
    return window.htmlToImage.toPng(node, {
      width: fmt.w, height: fmt.h, pixelRatio: 1, backgroundColor: bg, fontEmbedCSS: css
    }).then(toBitmap).then(function (bmp) {
      base = bmp;
      stelleHer();
      schritt();
    });
  }

  /* Schritt 2: eine Ebene je Element. Verschachtelte Ebenen werden in der
     Eltern-Ebene mit ausgeblendet. */
  /* Alles bis auf ein Element abschalten. */
  function nurZeigen(L) {
    merkeVis(node);
    node.style.visibility = 'hidden';
    sichtbarGesetzt.forEach(function (el) {
      if (el !== L.el && !L.el.contains(el)) { merkeVis(el); el.style.visibility = 'hidden'; }
    });
    merkeVis(L.el);
    L.el.style.visibility = 'visible';
  }

  function machEbene(i) {
    var L = layers[i];
    nurZeigen(L);
    layers.forEach(function (K) {
      if (K !== L && L.el.contains(K.el)) { merkeVis(K.el); K.el.style.visibility = 'hidden'; }
    });
    L.rect = rectOf(L.el);
    return renderCropped(node, fmt, css, L.rect).then(function (bmp) {
      L.bmp = bmp;
      stelleHer();
      schritt();
    }, function (e) { stelleHer(); throw e; });
  }

  /* Schritt 3: Zwischenwerte für count. Rechteck je Wert neu messen —
     eine zweistellige Zahl ist breiter als eine einstellige. */
  function machCount(i) {
    var L = layers[i];
    var ziel = L.ziel;
    var orig = ziel.textContent;
    L.werte = [];
    nurZeigen(L);

    function einWert(v) {
      if (v > L.endwert) return Promise.resolve();
      ziel.textContent = String(v);
      var r = rectOf(L.el);
      /* Direktrender; bei inline-Elementen schlägt er fehl, dann Vollrender. */
      return renderElement(L.el, css).then(null, function () {
        return renderCropped(node, fmt, css, r);
      }).then(function (bmp) {
        L.werte.push({ rect: r, bmp: bmp });
        schritt();
        return einWert(v + 1);
      });
    }

    return einWert(0).then(function () {
      ziel.textContent = orig;
      stelleHer();
    }, function (e) {
      ziel.textContent = orig;
      stelleHer();
      throw e;
    });
  }

  function reihe(i) {
    if (i >= layers.length) return Promise.resolve();
    var p = layers[i].effect === 'count' ? machCount(i) : machEbene(i);
    return p.then(function () { return reihe(i + 1); });
  }

  return machGrundebene().then(function () { return reihe(0); }).then(function () {
    /* Zeitpunkt, ab dem sich nichts mehr bewegt (kenburns läuft durch). */
    var ende = 0, laeuftDurch = false;
    layers.forEach(function (L) {
      if (L.effect === 'static') return;
      if (L.effect === 'kenburns') laeuftDurch = true;
      var e = L.delay + (L.effect === 'kenburns' ? dauer : L.dur);
      if (e > ende) ende = e;
    });
    return { base: base, layers: layers, dauer: dauer, animEnde: laeuftDurch ? dauer : ende };
  }, function (e) {
    stelleHer();
    if (base) base.close();
    layers.forEach(function (L) {
      if (L.bmp) L.bmp.close();
      if (L.werte) L.werte.forEach(function (w) { w.bmp.close(); });
    });
    throw e;
  });
}

function freeLayers(parts) {
  if (!parts) return;
  if (parts.base) parts.base.close();
  parts.layers.forEach(function (L) {
    if (L.bmp) L.bmp.close();
    if (L.werte) L.werte.forEach(function (w) { w.bmp.close(); });
  });
}

/* ---------- Zustand einer Ebene zu einem Zeitpunkt ---------- */
function layerState(L, t, dauer) {
  var p = clamp01((t - L.delay) / L.dur);
  var s = { alpha: 1, tx: 0, ty: 0, scale: 1, ox: 0, oy: 0, clip: null, wert: -1 };
  var r = L.rect;

  /* Ursprung der Skalierung */
  var ox = r.x + r.w / 2, oy = r.y + r.h / 2;
  if (L.origin === 'links') ox = r.x;
  else if (L.origin === 'rechts') ox = r.x + r.w;

  switch (L.effect) {
    /* Immer voll sichtbar, ohne Bewegung. Nur dafür da, die
       Zeichenreihenfolge zu erzwingen: eine Ebene liegt über einer
       animierten Ebene (z. B. der Verlauf über dem zoomenden Foto). */
    case 'static':
      break;
    case 'fade':
      s.alpha = easeOutCubic(p);
      break;
    case 'slide-up':
      s.alpha = easeOutCubic(p); s.ty = (1 - easeOutCubic(p)) * L.dist;
      break;
    case 'slide-down':
      s.alpha = easeOutCubic(p); s.ty = -(1 - easeOutCubic(p)) * L.dist;
      break;
    case 'slide-left':
      s.alpha = easeOutCubic(p); s.tx = (1 - easeOutCubic(p)) * L.dist;
      break;
    case 'slide-right':
      s.alpha = easeOutCubic(p); s.tx = -(1 - easeOutCubic(p)) * L.dist;
      break;
    case 'scale-in':
      s.alpha = easeOutCubic(p);
      s.scale = 0.85 + 0.15 * easeOutCubic(p);
      s.ox = ox; s.oy = oy;
      break;
    case 'pop':
      s.alpha = clamp01(easeOutBack(p) / 0.4);
      s.scale = easeOutBack(p);
      s.ox = ox; s.oy = oy;
      break;
    case 'stamp':
      s.alpha = clamp01(easeOutBack(p));
      s.scale = 1.7 + (1 - 1.7) * easeOutBack(p);
      s.ox = ox; s.oy = oy;
      break;
    case 'wipe-right':
      s.clip = { x: r.x, y: r.y, w: r.w * easeOutCubic(p), h: r.h };
      break;
    case 'kenburns':
      /* läuft linear über die ganze Videodauer, auf das eigene Rechteck
         beschnitten, von Anfang an sichtbar */
      s.scale = 1 + 0.12 * clamp01(t / dauer);
      s.ox = ox; s.oy = oy;
      s.clip = { x: r.x, y: r.y, w: r.w, h: r.h };
      break;
    case 'count':
      /* Zwischenwerte mit easeOut verteilt, vor dem Delay steht 0 */
      s.wert = Math.round(easeOutCubic(p) * L.endwert);
      break;
    default:
      s.alpha = easeOutCubic(p);
  }
  if (s.scale < 0) s.scale = 0;
  return s;
}

/* ---------- Compositing eines Zeitpunkts ----------
   s skaliert die ganze Ausgabe: 1 beim Kodieren, kleiner für die
   Live-Vorschau, die nur die Größe des Vorschaurahmens braucht. */
function drawFrame(ctx, parts, t, fmt, s) {
  var layers = parts.layers, dauer = parts.dauer;
  s = s || 1;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(parts.base, 0, 0, fmt.w, fmt.h);

  /* Zustände einmal pro Frame berechnen, Eltern werden mehrfach gebraucht. */
  var states = layers.map(function (L) { return layerState(L, t, dauer); });

  function alphaOf(i) {
    var a = states[i].alpha;
    var p = layers[i].parent;
    return p >= 0 ? a * alphaOf(p) : a;
  }
  function applyChain(i) {
    var p = layers[i].parent;
    if (p >= 0) applyChain(p);
    var s = states[i];
    if (s.tx || s.ty) ctx.translate(s.tx, s.ty);
    if (s.scale !== 1) {
      ctx.translate(s.ox, s.oy);
      ctx.scale(s.scale, s.scale);
      ctx.translate(-s.ox, -s.oy);
    }
  }

  layers.forEach(function (L, i) {
    var s = states[i];
    var a = alphaOf(i);
    if (a <= 0.002) return;

    var bmp = L.bmp, rect = L.rect;
    if (L.effect === 'count') {
      var idx = s.wert < 0 ? 0 : s.wert;
      if (!L.werte || !L.werte[idx]) return;
      bmp = L.werte[idx].bmp;
      rect = L.werte[idx].rect;
    }
    if (!bmp) return;
    if (s.clip && s.clip.w <= 0.5) return;

    ctx.save();
    ctx.setTransform(s, 0, 0, s, 0, 0);
    /* Beschnitt im Raum der Eltern-Ebene, Skalierung der eigenen Ebene
       wirkt innerhalb des Beschnitts. */
    if (L.parent >= 0) applyChain(L.parent);
    if (s.clip) {
      ctx.beginPath();
      ctx.rect(s.clip.x, s.clip.y, s.clip.w, s.clip.h);
      ctx.clip();
    }
    if (s.tx || s.ty) ctx.translate(s.tx, s.ty);
    if (s.scale !== 1) {
      ctx.translate(s.ox, s.oy);
      ctx.scale(s.scale, s.scale);
      ctx.translate(-s.ox, -s.oy);
    }
    ctx.globalAlpha = a;
    ctx.drawImage(bmp, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
}

/* ---------- Ebenen-Zwischenspeicher ----------
   Vorschau und Video brauchen dieselben Ebenen. Sie einmal zu rendern
   dauert ein paar Sekunden, darum werden sie gemerkt — aber nur, solange
   sich am Inhalt nichts geändert hat. paintGen zählt jede Textänderung
   in app.js hoch; Ausschnitt und Fotos hängen nicht daran und kommen
   darum zusätzlich in den Schlüssel. */
var ebenenCache = null;

function cacheSchluessel(occ, fmtId, designId) {
  return [
    window.key(designId, occ, fmtId),
    window.paintGen,
    JSON.stringify(window.state.crops || {}),
    Object.keys(window.state.photos || {}).sort().join(',')
  ].join('##');
}

function cacheLeeren() {
  if (ebenenCache) {
    freeLayers(ebenenCache.parts);
    ebenenCache = null;
  }
}

function ebenenHolen(occ, fmtId, designId, onStep) {
  var k = cacheSchluessel(occ, fmtId, designId);
  if (ebenenCache && ebenenCache.k === k) return Promise.resolve(ebenenCache.parts);
  cacheLeeren();

  var lk = window.key(designId, occ, fmtId);
  var node = window.nodes[lk];
  if (!node) return Promise.resolve(null);
  var fmt = window.formatById(fmtId);
  var vfmt = { w: fmt.w, h: fmt.h };
  var bg = window.nodeBackground(node);

  return window.FONTS_READY.then(window.buildFontCSS).then(function (css) {
    return window.attached(node, function () {
      return window.primeRenderer(node, bg).then(function () {
        return renderLayers(node, vfmt, occ, css, bg, onStep);
      });
    });
  }).then(function (parts) {
    ebenenCache = { k: cacheSchluessel(occ, fmtId, designId), parts: parts };
    return parts;
  });
}

/* ---------- Kodieren ---------- */
function encodeVideo(parts, fmt, onProgress) {
  var fps = VIDEO_CFG.fps;
  var total = Math.round(parts.dauer * fps);

  return loadVideoLib().then(function (mb) {
    return pickCodec(mb, fmt).then(function (codec) {
      if (codec === null) {
        var err = new Error('kein-codec');
        err.videoHinweis = true;
        throw err;
      }
      var canvas = document.createElement('canvas');
      canvas.width = fmt.w; canvas.height = fmt.h;
      var ctx = canvas.getContext('2d', { alpha: false });

      var cfg = {
        codec: 'avc',
        bitrate: VIDEO_CFG.bitrate,
        keyFrameInterval: VIDEO_CFG.keyframe,
        latencyMode: 'quality'
      };
      if (codec) cfg.fullCodecString = codec;

      var out = new mb.Output({
        format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }),
        target: new mb.BufferTarget()
      });
      var src = new mb.CanvasSource(canvas, cfg);
      out.addVideoTrack(src, { frameRate: fps });

      var i = 0;
      function step() {
        if (i >= total) return Promise.resolve();
        var t = i / fps;
        /* Nach dem Ende der Animation ändert sich nichts mehr — dann wird
           das Canvas nicht neu gezeichnet, nur weiter kodiert. */
        if (i === 0 || t <= parts.animEnde + 1 / fps) drawFrame(ctx, parts, t, fmt);
        var p = src.add(i / fps, 1 / fps);
        i++;
        if (onProgress && i % 10 === 0) onProgress(i / total);
        if (i % 30 === 0) {
          return p.then(function () {
            return new Promise(function (r) { setTimeout(r, 0); });
          }).then(step);
        }
        return p.then(step);
      }

      return out.start().then(step).then(function () {
        src.close();
        return out.finalize();
      }).then(function () {
        return new Blob([out.target.buffer], { type: 'video/mp4' });
      });
    });
  });
}

/* ---------- Datei erzeugen ---------- */
function videoFileName(occ, fmt) {
  return window.fileName(occ, fmt).replace(/\.png$/, '.mp4');
}

function renderVideoFile(occ, fmtId, designId, onPhase) {
  window.flushPaint();
  var k = window.key(designId, occ, fmtId);
  window.ensurePainted(k);
  if (!window.nodes[k]) return Promise.resolve(null);
  var fmt = window.formatById(fmtId);
  /* Video immer in 1× Layoutgröße: 4K-Kodierung scheitert auf vielen Handys. */
  var vfmt = { w: fmt.w, h: fmt.h };

  /* Lag eben eine Vorschau an, sind die Ebenen schon da. */
  return ebenenHolen(occ, fmtId, designId, function (f) {
    if (onPhase) onPhase('ebenen', f);
  }).then(function (parts) {
    if (!parts) return null;
    return encodeVideo(parts, vfmt, function (f) {
      if (onPhase) onPhase('video', f);
    });
  }).then(function (blob) {
    if (!blob) return null;
    return new File([blob], videoFileName(occ, fmt), { type: 'video/mp4' });
  });
}

/* ---------- Live-Vorschau ----------
   Spielt die Animation im Vorschaurahmen ab, ohne zu kodieren: dieselben
   Ebenen, dasselbe Compositing, nur auf ein kleines Canvas und per
   requestAnimationFrame. Wer etwas am Text ändert, schließt sie damit
   automatisch — sonst liefe eine veraltete Vorschau weiter. */
var vorschau = null;

function vorschauSchliessen() {
  if (!vorschau) return;
  cancelAnimationFrame(vorschau.raf);
  if (vorschau.box.parentNode) vorschau.box.parentNode.removeChild(vorschau.box);
  if (vorschau.bar.parentNode) vorschau.bar.parentNode.removeChild(vorschau.bar);
  vorschau = null;
}

function vorschauStarten(parts, fmt) {
  vorschauSchliessen();
  var frame = document.getElementById('frame');
  if (!frame) return;

  var breite = frame.clientWidth, hoehe = frame.clientHeight;
  var dpr = Math.min(2, window.devicePixelRatio || 1);

  var box = document.createElement('div');
  box.className = 'vorschau';
  var canvas = document.createElement('canvas');
  canvas.width = Math.round(breite * dpr);
  canvas.height = Math.round(hoehe * dpr);
  box.appendChild(canvas);
  frame.appendChild(box);

  /* Bedienzeile unter den Rahmen, damit sie das Layout nicht verdeckt. */
  var bar = document.createElement('div');
  bar.className = 'vor-bar';
  var track = document.createElement('div');
  track.className = 'vor-t';
  var fill = document.createElement('div');
  fill.className = 'vor-b';
  track.appendChild(fill);
  var sek = document.createElement('div');
  sek.className = 'vor-s';
  var nochmal = document.createElement('button');
  nochmal.type = 'button';
  nochmal.className = 'vor-k';
  nochmal.textContent = 'Nochmal';
  var zu = document.createElement('button');
  zu.type = 'button';
  zu.className = 'vor-k';
  zu.textContent = 'Schließen';
  bar.appendChild(track); bar.appendChild(sek);
  bar.appendChild(nochmal); bar.appendChild(zu);
  frame.parentNode.insertBefore(bar, frame.nextSibling);

  var ctx = canvas.getContext('2d', { alpha: false });
  var s = canvas.width / fmt.w;
  var gen = window.paintGen;

  vorschau = { box: box, bar: bar, raf: 0 };
  /* Von Hand geschlossen: die Ebenen werden nicht mehr gebraucht. */
  zu.addEventListener('click', function () { vorschauSchliessen(); cacheLeeren(); });

  function lauf() {
    var start = performance.now();
    function tick(now) {
      /* Inhalt geändert? Dann ist die Vorschau überholt. */
      if (window.paintGen !== gen) { vorschauSchliessen(); cacheLeeren(); return; }
      var t = (now - start) / 1000;
      if (t > parts.dauer) t = parts.dauer;
      drawFrame(ctx, parts, t, fmt, s);
      fill.style.width = (t / parts.dauer * 100) + '%';
      sek.textContent = Math.floor(t) + ' / ' + Math.round(parts.dauer) + ' s';
      if (t < parts.dauer && vorschau) vorschau.raf = requestAnimationFrame(tick);
    }
    if (vorschau) vorschau.raf = requestAnimationFrame(tick);
  }
  nochmal.addEventListener('click', lauf);
  lauf();
}

/* ---------- Knöpfe ---------- */
var vorschauBtn = document.getElementById('preview-video');
if (vorschauBtn) {
  vorschauBtn.addEventListener('click', function () {
    vorschauSchliessen();
    window.busy(vorschauBtn, true, 'Moment …');
    var p = window.progress(1, null, vorschauBtn);
    p.note('Ebenen vorbereiten …', 0);
    window.flushPaint();
    var k = window.key(state.design, state.occasion, state.format);
    window.ensurePainted(k);

    ebenenHolen(state.occasion, state.format, state.design, function (f) {
      p.note('Ebenen vorbereiten … ' + Math.round(f * 100) + ' %', f);
    }).then(function (parts) {
      p.end();
      if (parts) vorschauStarten(parts, window.formatById(state.format));
    }).catch(function (e) {
      console.error(e);
      alert('Die Vorschau konnte nicht erzeugt werden. Bitte Seite neu laden und erneut versuchen.');
    }).then(function () {
      p.end();
      window.busy(vorschauBtn, false);
    });
  });
}

var videoBtn = document.getElementById('save-video');
if (videoBtn) {
  videoBtn.addEventListener('click', function () {
    if (!videoPossible()) {
      alert('Video-Export braucht einen aktuellen Browser: Chrome, Edge oder Safari ab iOS 17. Am PC klappt es immer.');
      return;
    }
    /* Erst schließen: sonst zeichnet die Vorschau noch auf Ebenen, die
       beim Neuaufbau freigegeben werden könnten. */
    vorschauSchliessen();
    window.busy(videoBtn, true, 'Erzeuge …');
    var p = window.progress(1, null, videoBtn);
    p.note('Ebenen vorbereiten …', 0);

    renderVideoFile(state.occasion, state.format, state.design, function (phase, frac) {
      if (phase === 'ebenen') p.note('Ebenen vorbereiten … ' + Math.round(frac * 100) + ' %', frac * 0.35);
      else p.note('Video ' + Math.round(frac * 100) + ' %', 0.35 + frac * 0.65);
    })
      .then(function (f) { p.end(); return window.deliver([f]); })
      .catch(function (e) {
        console.error(e);
        if (e && e.videoHinweis) {
          alert('Dieser Browser kann kein H.264-Video erzeugen. Am PC mit Chrome oder Edge klappt es.');
        } else {
          alert('Das Video konnte nicht erzeugt werden. Bitte Seite neu laden und erneut versuchen.');
        }
      })
      .then(function () {
        p.end();
        window.busy(videoBtn, false);
        /* Läuft keine Vorschau mehr, geben wir den Speicher frei —
           die Ebenen eines Story-Layouts sind rund 10 MB. */
        if (!vorschau) cacheLeeren();
      });
  });
}
