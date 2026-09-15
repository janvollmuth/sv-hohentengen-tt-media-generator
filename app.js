/* SVH Media Generator
   Designs liegen in designs/ (Manifest: designs/manifest.json)
   Fotos liegen verschlüsselt in photos/ (Paket: photos/pack.json)
   Neue Designs, Anlässe und Fotos brauchen keine Änderung an dieser Datei –
   siehe README.md. */

var OCCASIONS = [
  { id: 'ankuendigung', label: 'Heimspiel' },
  { id: 'erinnerung', label: 'Erinnerung' },
  { id: 'ergebnis', label: 'Ergebnis' },
  { id: 'portrait', label: 'Spielerporträt' },
  { id: 'werbung', label: 'Mitglieder werben' },
  { id: 'nachricht', label: 'Vereinsnachricht' }
];

var FORMATS = [
  { id: 'story', label: 'Story & WhatsApp', note: '1080 × 1920', w: 1080, h: 1920, ratio: 1 },
  { id: 'post45', label: 'Beitrag 4:5', note: '1080 × 1350', w: 1080, h: 1350, ratio: 1 },
  { id: 'post11', label: 'Beitrag 1:1', note: '1080 × 1080', w: 1080, h: 1080, ratio: 1 },
  { id: 'a4', label: 'A4-Aushang', note: 'zum Ausdrucken', w: 1240, h: 1754, ratio: 2 }
];

/* Feldregister: Beschriftung, Reihenfolge, Standardwert.
   scope 'occasion' = Wert gilt nur für diesen Anlass.
   computed = kein Eingabefeld, wird aus anderen Feldern gebildet. */
var FIELDS = [
  { id: 'gegner', label: 'Gegner', def: 'TTC Musterstadt', max: 26 },
  { id: 'liga', label: 'Liga / Mannschaft', def: 'Bezirksklasse Gruppe 2', max: 30 },
  { id: 'datum', label: 'Datum', def: 'Sa, 26.09.', max: 14 },
  { id: 'uhrzeit', label: 'Uhrzeit', def: '19:30', short: true, max: 8 },
  { id: 'halle', label: 'Halle', def: 'Mehrzweckhalle, Schulstraße 5', max: 42 },
  { id: 'punkteHeim', label: 'Punkte SVH', def: '9', short: true, max: 3 },
  { id: 'punkteGast', label: 'Punkte Gegner', def: '5', short: true, max: 3 },
  { id: 'ausgang', label: 'Ausgang', def: 'Sieg', options: ['Sieg', 'Niederlage', 'Unentschieden'] },
  { id: 'spielerName', label: 'Name', def: 'Max Mustermann', max: 24 },
  { id: 'spielerRolle', label: 'Mannschaft / Position', def: 'Herren I · Abwehrspieler', max: 36 },
  { id: 'titel', label: 'Titel', scope: 'occasion', max: 40, defs: {
      werbung: 'Komm zum Probetraining',
      nachricht: 'Neuigkeiten aus der Abteilung'
    } },
  { id: 'text', label: 'Text', scope: 'occasion', textarea: true, max: 230, defs: {
      portrait: 'Seit zwölf Jahren im Verein, seit drei Jahren in der Ersten. Aufschlag mit Seitenschnitt, Nerven aus Draht.',
      werbung: 'Schläger gibt es bei uns, Vorkenntnisse brauchst du nicht. Einfach in Sportschuhen vorbeikommen — Kinder, Jugendliche und Erwachsene willkommen.',
      nachricht: 'Kurz und knapp, was gerade wichtig ist: Termine, Beschlüsse, Danksagungen — was die Abteilung wissen sollte.'
    } },
  { id: 'zeiten', label: 'Trainingszeiten', def: 'Di & Do 19:00 Uhr · Mehrzweckhalle', max: 44 },
  { id: 'kontakt', label: 'Kontakt', def: 'tischtennis@sv-hohentengen.de', max: 38 },
  { id: 'zusatz', label: 'Zusätzlicher Text', scope: 'occasion', textarea: true, max: 70, defs: {
      ankuendigung: 'Kommt vorbei!',
      erinnerung: 'Wir brauchen euch — kommt vorbei!',
      ergebnis: 'Danke für eure Unterstützung!'
    } },
  { id: 'termin', computed: function (v) { return v.datum + ' · ' + v.uhrzeit + ' Uhr'; } },
  { id: 'paarung', computed: function (v) { return 'SV Hohentengen – ' + v.gegner; } }
];

var OUTCOME_COLORS = { 'Sieg': '#2f9e44', 'Niederlage': '#2B2B30', 'Unentschieden': '#E8A33D' };
var VEREIN = 'SV Hohentengen';
var STORE = 'svh-media-generator-v1';
var FRAME_W = 346, FRAME_H = 615;
var BLANK = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgwIiBoZWlnaHQ9IjEyMDAiPjxyZWN0IHdpZHRoPSIxMDgwIiBoZWlnaHQ9IjEyMDAiIGZpbGw9IiMyNjI1MmMiLz48dGV4dCB4PSI1NDAiIHk9IjYxNSIgZm9udC1mYW1pbHk9IkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ0IiBmaWxsPSIjN2M3YTg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Gb3RvIHdhZWhsZW48L3RleHQ+PC9zdmc+';

var designs = [], gallery = [], nodes = {};
var FONTS_READY = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

/* ---------- Schriften für den Export (einmal aufbereiten) ---------- */
var STORY_FONTS = [
  { family: 'Archivo Black', weight: '400', file: 'fonts/ArchivoBlack-Regular.ttf' },
  { family: 'Barlow Condensed', weight: '500', file: 'fonts/BarlowCondensed-Medium.ttf' },
  { family: 'Barlow Condensed', weight: '600 700', file: 'fonts/BarlowCondensed-Bold.ttf' }
];
var fontEmbedCSS = null;
function buildFontCSS() {
  if (fontEmbedCSS) return fontEmbedCSS;
  fontEmbedCSS = Promise.all(STORY_FONTS.map(function (f) {
    return inlineImage(f.file).then(function (data) {
      if (data.indexOf('data:') !== 0) return '';
      return "@font-face{font-family:'" + f.family + "';font-style:normal;font-weight:" + f.weight +
        ";src:url(" + data + ") format('truetype')}";
    });
  })).then(function (parts) { return parts.join('\n'); });
  return fontEmbedCSS;
}

/* ---------- Bilder ---------- */
var IMG_CACHE = {};
var IMG_CACHE_READY = {};
var PHOTO_MAX = 1600;

function inlineImage(url) {
  if (!url || url.indexOf('data:') === 0) return Promise.resolve(url);
  if (IMG_CACHE[url]) return IMG_CACHE[url];
  IMG_CACHE[url] = fetch(url, { cache: 'force-cache' })
    .then(function (r) { if (!r.ok) throw new Error(url + ' → ' + r.status); return r.blob(); })
    .then(function (b) {
      return new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onload = function () { res(fr.result); };
        fr.onerror = rej;
        fr.readAsDataURL(b);
      });
    })
    .catch(function (e) { console.warn(e); return url; });
  return IMG_CACHE[url];
}

/* Fotos auf Maß bringen – hält den Export schnell, egal wie groß das Handyfoto war. */
function normalizePhoto(dataUrl) {
  return new Promise(function (res) {
    var img = new Image();
    img.onload = function () {
      var long = Math.max(img.width, img.height);
      if (long <= PHOTO_MAX && dataUrl.indexOf('data:image/jpeg') === 0) return res(dataUrl);
      var scale = Math.min(1, PHOTO_MAX / long);
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      try { res(c.toDataURL('image/jpeg', 0.85)); } catch (e) { res(dataUrl); }
    };
    img.onerror = function () { res(dataUrl); };
    img.src = dataUrl;
  });
}

function usePhoto(ref) {
  if (!ref) return Promise.resolve();
  if (IMG_CACHE_READY[ref]) return Promise.resolve();
  if (ref.indexOf('enc:') === 0) {
    var it = packItem(ref.slice(4));
    if (!it || !packKey) return Promise.resolve();
    return fetch(it.file, { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error(it.file + ' → ' + r.status); return r.json(); })
      .then(function (j) { return decryptB64(packKey, j.iv, j.data); })
      .then(function (plain) { return normalizePhoto('data:' + (it.mime || 'image/jpeg') + ';base64,' + bufToB64(plain)); })
      .then(function (data) { IMG_CACHE_READY[ref] = data; })
      .catch(function (e) { console.warn(e); });
  }
  if (ref.indexOf('data:') === 0) {
    return normalizePhoto(ref).then(function (data) { IMG_CACHE_READY[ref] = data; });
  }
  return inlineImage(ref).then(normalizePhoto).then(function (data) { IMG_CACHE_READY[ref] = data; });
}

/* ---------- Verschlüsseltes Fotopaket ---------- */
var PW_STORE = 'svh-story-pw';
var pack = null, packKey = null, encThumbs = {};

function b64ToBuf(b64) {
  var bin = atob(b64), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function bufToB64(buf) {
  var arr = new Uint8Array(buf), out = '', chunk = 0x8000;
  for (var i = 0; i < arr.length; i += chunk) out += String.fromCharCode.apply(null, arr.subarray(i, i + chunk));
  return btoa(out);
}
function deriveKey(pw) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey'])
    .then(function (base) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: b64ToBuf(pack.kdf.salt), iterations: pack.kdf.iterations, hash: 'SHA-256' },
        base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    });
}
function decryptB64(key, iv, dataB64) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(iv) }, key, b64ToBuf(dataB64));
}
function unlockPack(pw) {
  if (!pack) return Promise.reject(new Error('kein Fotopaket'));
  return deriveKey(pw).then(function (key) {
    return decryptB64(key, pack.check.iv, pack.check.data).then(function (buf) {
      if (new TextDecoder().decode(buf) !== 'svh-ok') throw new Error('falsches Passwort');
      packKey = key;
      try { localStorage.setItem(PW_STORE, pw); } catch (e) {}
      return Promise.all((pack.items || []).map(function (it) {
        return decryptB64(key, it.thumb.iv, it.thumb.data).then(function (t) {
          encThumbs[it.id] = 'data:' + (it.mime || 'image/jpeg') + ';base64,' + bufToB64(t);
        });
      }));
    });
  });
}
function packItem(id) {
  var list = (pack && pack.items) || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function galleryEntries() {
  var out = gallery.map(function (p) { return { ref: p.file, name: p.name || p.file, thumb: p.file }; });
  if (packKey) {
    (pack.items || []).forEach(function (it) {
      out.push({ ref: 'enc:' + it.id, name: it.name || it.id, thumb: encThumbs[it.id] });
    });
  }
  return out;
}

/* ---------- Zustand ---------- */
var state = { occasion: null, format: null, design: null, values: {}, occValues: {}, photos: {}, photoNames: {}, crops: {} };

try {
  var saved = JSON.parse(localStorage.getItem(STORE) || '{}');
  if (saved.values) state.values = saved.values;
  if (saved.occValues) state.occValues = saved.occValues;
  if (saved.photos) state.photos = saved.photos;
  if (saved.photoNames) state.photoNames = saved.photoNames;
  if (saved.crops) state.crops = saved.crops;
  state.occasion = saved.occasion || null;
  state.format = saved.format || null;
  state.design = saved.design || null;
} catch (e) {}

function persist() {
  try {
    var photos = {};
    Object.keys(state.photos).forEach(function (k) {
      if (String(state.photos[k]).indexOf('data:') !== 0) photos[k] = state.photos[k];
    });
    localStorage.setItem(STORE, JSON.stringify({
      values: state.values, occValues: state.occValues,
      occasion: state.occasion, format: state.format, design: state.design,
      photos: photos, photoNames: state.photoNames, crops: state.crops
    }));
  } catch (e) {}
}

function valueOf(f, occ) {
  if (f.scope === 'occasion') {
    var bag = state.occValues[occ] || {};
    return bag[f.id] != null ? bag[f.id] : ((f.defs && f.defs[occ]) || '');
  }
  return state.values[f.id] != null ? state.values[f.id] : f.def;
}
function setValue(f, occ, val) {
  if (f.scope === 'occasion') {
    if (!state.occValues[occ]) state.occValues[occ] = {};
    state.occValues[occ][f.id] = val;
  } else {
    state.values[f.id] = val;
  }
  persist();
}
function resolved(occ) {
  var v = { verein: VEREIN };
  FIELDS.forEach(function (f) { if (!f.computed) v[f.id] = valueOf(f, occ); });
  FIELDS.forEach(function (f) { if (f.computed) v[f.id] = f.computed(v); });
  return v;
}

/* ---------- Abdeckung ---------- */
function key(d, occ, fmt) { return d + '|' + occ + '|' + fmt; }
function has(d, occ, fmt) { return !!nodes[key(d, occ, fmt)]; }
function formatsFor(occ) {
  return FORMATS.filter(function (f) {
    return designs.some(function (d) { return has(d.id, occ, f.id); });
  });
}
function designsFor(occ, fmt) {
  return designs.filter(function (d) { return has(d.id, occ, fmt); });
}
function formatsForDesign(occ, d) {
  return FORMATS.filter(function (f) { return has(d, occ, f.id); });
}

/* ---------- Zeichnen ---------- */
function paintNode(node, occ) {
  var v = resolved(occ);
  Array.prototype.forEach.call(node.querySelectorAll('[data-field]'), function (el) {
    var id = el.getAttribute('data-field');
    if (v[id] != null && v[id] !== '') el.textContent = v[id];
  });
  var color = OUTCOME_COLORS[v.ausgang] || '#2B2B30';
  Array.prototype.forEach.call(node.querySelectorAll('[data-outcome-bg]'), function (el) { el.style.background = color; });
  var ref = state.photos[occ];
  var shown = ref ? (IMG_CACHE_READY[ref] || BLANK) : BLANK;
  Array.prototype.forEach.call(node.querySelectorAll('[data-photo]'), function (img) {
    if (img.getAttribute('src') !== shown) img.src = shown;
    bindCropDrag(img, occ);
    applyCrop(img, occ);
  });
}
function paintAll() {
  Object.keys(nodes).forEach(function (k) { paintNode(nodes[k], k.split('|')[1]); });
}

/* ---------- Bildausschnitt ----------
   ox/oy = object-position in Prozent (50/50 = mittig), z = Zoom.
   Bewusst ohne gemessene Pixelwerte: object-position + scale() sind relative
   Angaben, die beim Export (losgelöster Knoten, andere Kantenlänge, 300 dpi)
   genauso gelten wie in der Vorschau. Gemessen wird nur beim Ziehen.
   Gilt pro Anlass, damit derselbe Ausschnitt in allen Formaten sitzt. */
function cropOf(occ) {
  var c = state.crops[occ] || {};
  var ox = typeof c.ox === 'number' ? c.ox : 50;
  var oy = typeof c.oy === 'number' ? c.oy : 50;
  return { ox: ox, oy: oy, z: c.z || 1 };
}
function resetCrop(occ) { delete state.crops[occ]; }

function cropBox(img) {
  var p = img.parentElement;
  return { bw: (p && p.clientWidth) || 0, bh: (p && p.clientHeight) || 0 };
}

/* Verschiebbarer Weg in Pixeln: verdeckter Bildanteil (cover) plus Zoom-Überhang. */
function panRange(img, z) {
  var b = cropBox(img);
  var nw = img.naturalWidth, nh = img.naturalHeight;
  if (!b.bw || !b.bh || !nw || !nh) return { x: 0, y: 0, bw: b.bw || 1, bh: b.bh || 1, ok: false };
  var cs = Math.max(b.bw / nw, b.bh / nh);
  return {
    x: Math.max(0, nw * cs * z - b.bw),
    y: Math.max(0, nh * cs * z - b.bh),
    bw: b.bw, bh: b.bh, ok: true
  };
}

/* Zoom, ab dem beide Achsen Spielraum haben (bei 100 % füllt eine Achse exakt). */
function minZoomForSlack(img, pad) {
  var b = cropBox(img);
  var nw = img.naturalWidth, nh = img.naturalHeight;
  if (!b.bw || !b.bh || !nw || !nh) return 1;
  var cs = Math.max(b.bw / nw, b.bh / nh);
  return Math.max(b.bw / (nw * cs), b.bh / (nh * cs)) * (pad || 1.12);
}

function applyCrop(img, occ) {
  var p = img.parentElement;
  if (p) {
    p.style.overflow = 'hidden';
    if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
  }
  img.style.cursor = state.photos[occ] ? (img.__cropDragging ? 'grabbing' : 'grab') : '';
  img.style.position = ''; img.style.left = ''; img.style.top = '';
  img.style.width = '100%'; img.style.height = '100%';
  img.style.objectFit = 'cover';

  if (!state.photos[occ]) {
    img.style.objectPosition = ''; img.style.transform = 'none';
    return;
  }
  var c = cropOf(occ);
  img.style.objectPosition = c.ox.toFixed(2) + '% ' + c.oy.toFixed(2) + '%';
  if (c.z <= 1.001) {
    img.style.transform = 'none';
    return;
  }
  /* translate wird von scale mitskaliert, daher /(2*z) */
  var t = (c.z - 1) / (2 * c.z) * 100;
  img.style.transformOrigin = 'center';
  img.style.transform = 'scale(' + c.z.toFixed(4) + ') translate(' +
    (-(c.ox - 50) / 50 * t).toFixed(3) + '%,' + (-(c.oy - 50) / 50 * t).toFixed(3) + '%)';
}

function bindCropDrag(img, occ) {
  if (img.__cropBound) return;
  img.__cropBound = true;
  img.style.touchAction = 'none';
  img.style.pointerEvents = 'auto';
  var drag = null;
  function refresh() {
    img.__cropDragging = !!drag;
    img.style.cursor = state.photos[occ] ? (drag ? 'grabbing' : 'grab') : '';
  }
  img.addEventListener('pointerdown', function (e) {
    if (!state.photos[occ]) return;
    var r = img.getBoundingClientRect();
    var c = cropOf(occ);
    drag = {
      px: e.clientX, py: e.clientY, ox: c.ox, oy: c.oy, z: c.z,
      sc: (r.width / (img.offsetWidth || 1)) || 1
    };
    try { img.setPointerCapture(e.pointerId); } catch (err) {}
    refresh();
    e.preventDefault();
  });
  img.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = (e.clientX - drag.px) / drag.sc, dy = (e.clientY - drag.py) / drag.sc;
    if (!drag.checked && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      drag.checked = true;
      var r0 = panRange(img, drag.z);
      var wantsX = Math.abs(dx) > Math.abs(dy);
      if (r0.ok && ((wantsX && r0.x < 1) || (!wantsX && r0.y < 1))) {
        drag.z = Math.max(drag.z, Math.min(2.6, minZoomForSlack(img)));
      }
    }
    var rg = panRange(img, drag.z);
    var ox = rg.x > 0.5 ? drag.ox - dx / rg.x * 100 : drag.ox;
    var oy = rg.y > 0.5 ? drag.oy - dy / rg.y * 100 : drag.oy;
    state.crops[occ] = {
      ox: Math.max(0, Math.min(100, ox)),
      oy: Math.max(0, Math.min(100, oy)),
      z: drag.z
    };
    paintAll();
    syncZoomUI(occ);
  });
  function end() {
    if (!drag) return;
    drag = null;
    persist(); refresh();
  }
  img.addEventListener('pointerup', end);
  img.addEventListener('pointercancel', end);
  img.addEventListener('wheel', function (e) {
    if (!state.photos[occ]) return;
    e.preventDefault();
    var c = cropOf(occ);
    setZoom(occ, c.z * (e.deltaY > 0 ? 0.94 : 1.06));
  }, { passive: false });
  refresh();
}

function setZoom(occ, z) {
  var c = cropOf(occ);
  state.crops[occ] = { ox: c.ox, oy: c.oy, z: Math.max(1, Math.min(2.6, z)) };
  persist(); paintAll(); syncZoomUI(occ);
}
var zoomUI = null;
function syncZoomUI(occ) {
  if (!zoomUI) return;
  var z = cropOf(occ).z;
  zoomUI.input.value = String(Math.round(z * 100));
  zoomUI.out.textContent = Math.round(z * 100) + ' %';
}

/* ---------- Laden ---------- */
function fetchJson(url) {
  return fetch(url, { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error(url + ' → ' + r.status);
    return r.json();
  });
}
function loadDesign(d) {
  return fetch(d.file, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(d.file + ' → ' + r.status); return r.text(); })
    .then(function (html) {
      var host = document.createElement('div');
      host.innerHTML = html;
      var own = [];
      Array.prototype.forEach.call(host.querySelectorAll('[data-occasion]'), function (node) {
        var k = key(d.id, node.getAttribute('data-occasion'), node.getAttribute('data-format') || 'story');
        node.parentNode.removeChild(node);
        nodes[k] = node;
        own.push(node);
      });
      return Promise.all(own.map(function (node) {
        return Promise.all(Array.prototype.map.call(node.querySelectorAll('img[src]'), function (img) {
          var src = img.getAttribute('src');
          if (!src || img.hasAttribute('data-photo')) return null;
          return inlineImage(src).then(function (data) { img.src = data; });
        }));
      }));
    });
}

function boot() {
  fetchJson('designs/manifest.json')
    .then(function (list) { designs = list; return Promise.all(list.map(loadDesign)); })
    .then(function () {
      return Promise.all([
        fetchJson('photos/manifest.json').catch(function () { return []; }),
        fetchJson('photos/pack.json').catch(function () { return null; })
      ]);
    })
    .then(function (res) {
      gallery = res[0] || [];
      pack = res[1];
      var pw = null;
      try { pw = localStorage.getItem(PW_STORE); } catch (e) {}
      if (!pack || !pw) return;
      return unlockPack(pw).catch(function () { try { localStorage.removeItem(PW_STORE); } catch (e) {} });
    })
    .then(function () {
      return Promise.all(Object.keys(state.photos).map(function (k) { return usePhoto(state.photos[k]); }));
    })
    .then(function () {
      buildOccasions();
      paintAll();
      sync();
    })
    .catch(function (e) {
      console.error(e);
      var box = document.createElement('div');
      box.className = 'err';
      box.textContent = 'Designs konnten nicht geladen werden (' + e.message + '). Liegen designs/manifest.json und die Design-Dateien neben dieser Seite?';
      document.body.insertBefore(box, document.body.firstChild);
    });
}

/* ---------- Schritte ---------- */
var occsBox = document.getElementById('occs');
var fmtsBox = document.getElementById('fmts');
var designsBox = document.getElementById('designs');
var fieldsBox = document.getElementById('fields');
var frame = document.getElementById('frame');
var editor = document.getElementById('editor');
var stageTitle = document.getElementById('stage-title');
var hintEl = document.getElementById('hint');

function buildOccasions() {
  occsBox.innerHTML = '';
  OCCASIONS.forEach(function (o) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg';
    btn.setAttribute('data-occasion', o.id);
    btn.textContent = o.label;
    btn.addEventListener('click', function () { pickOccasion(o.id); });
    occsBox.appendChild(btn);
  });
}
function pickOccasion(id) {
  state.occasion = id;
  var fmts = formatsFor(id);
  if (!fmts.some(function (f) { return f.id === state.format; })) state.format = fmts.length ? fmts[0].id : null;
  fixDesign();
  persist(); sync();
}
function pickFormat(id) {
  state.format = id;
  fixDesign();
  persist(); sync();
}
function fixDesign() {
  var list = designsFor(state.occasion, state.format);
  if (!list.some(function (d) { return d.id === state.design; })) state.design = list.length ? list[0].id : null;
}

function buildFormats() {
  fmtsBox.innerHTML = '';
  formatsFor(state.occasion).forEach(function (f) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg';
    btn.setAttribute('data-format', f.id);
    btn.setAttribute('aria-pressed', String(f.id === state.format));
    btn.innerHTML = f.label + '<em>' + f.note + '</em>';
    btn.addEventListener('click', function () { pickFormat(f.id); });
    fmtsBox.appendChild(btn);
  });
}

function buildDesigns() {
  designsBox.innerHTML = '';
  var list = designsFor(state.occasion, state.format);
  list.forEach(function (d) {
    var fmt = formatById(state.format);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dir';
    btn.setAttribute('data-design', d.id);
    btn.setAttribute('aria-pressed', String(d.id === state.design));
    var thumbH = 110, thumbW = Math.round(thumbH * fmt.w / fmt.h);
    var thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.style.width = thumbW + 'px';
    thumb.style.height = thumbH + 'px';
    var tImg = document.createElement('img');
    tImg.alt = '';
    tImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity .2s';
    thumb.appendChild(tImg);
    thumbFor(key(d.id, state.occasion, state.format), fmt).then(function (src) {
      if (src) { tImg.src = src; tImg.style.opacity = '1'; }
    });
    var text = document.createElement('div');
    text.innerHTML = '<div class="dir-k">' + d.name + '</div><div class="dir-d">' + (d.description || '') + '</div>';
    btn.appendChild(thumb); btn.appendChild(text);
    btn.addEventListener('click', function () { state.design = d.id; persist(); sync(); });
    designsBox.appendChild(btn);
  });
}

function formatById(id) {
  for (var i = 0; i < FORMATS.length; i++) if (FORMATS[i].id === id) return FORMATS[i];
  return FORMATS[0];
}
function occasionById(id) {
  for (var i = 0; i < OCCASIONS.length; i++) if (OCCASIONS[i].id === id) return OCCASIONS[i];
  return { label: '' };
}

/* ---------- Eingabefelder ---------- */
function buildFields() {
  fieldsBox.innerHTML = '';
  var node = nodes[key(state.design, state.occasion, state.format)];
  if (!node) return;
  var occ = state.occasion;

  if (node.querySelector('[data-photo]')) fieldsBox.appendChild(photoBlock(occ));

  var present = {};
  Array.prototype.forEach.call(node.querySelectorAll('[data-field]'), function (el) {
    present[el.getAttribute('data-field')] = true;
  });
  FIELDS.forEach(function (f) {
    if (!f.computed || !present[f.id]) return;
    var probe = {};
    FIELDS.forEach(function (g) { if (!g.computed) probe[g.id] = '\u0001' + g.id + '\u0001'; });
    var out = f.computed(probe);
    FIELDS.forEach(function (g) {
      if (!g.computed && out.indexOf('\u0001' + g.id + '\u0001') > -1) present[g.id] = true;
    });
  });

  var head = document.createElement('div');
  head.className = 'sect';
  head.textContent = 'Texte';
  fieldsBox.appendChild(head);

  var pending = null;
  FIELDS.forEach(function (f) {
    if (f.computed || !present[f.id]) return;
    var block = fieldBlock(f, occ);
    if (f.short) {
      if (pending) { pending.appendChild(block); pending = null; return; }
      pending = document.createElement('div');
      pending.className = 'row2';
      pending.appendChild(block);
      fieldsBox.appendChild(pending);
      return;
    }
    pending = null;
    fieldsBox.appendChild(block);
  });
}

function fieldBlock(f, occ) {
  var wrap = document.createElement('div');
  wrap.className = 'f';
  var head = document.createElement('div');
  head.className = 'f-head';
  var lab = document.createElement('label');
  lab.textContent = f.label;
  lab.setAttribute('for', 'in-' + f.id);
  head.appendChild(lab);
  var cnt = null;
  if (f.max) {
    cnt = document.createElement('span');
    cnt.className = 'cnt';
    head.appendChild(cnt);
  }
  var input;
  if (f.options) {
    input = document.createElement('select');
    f.options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o; opt.textContent = o;
      input.appendChild(opt);
    });
  } else if (f.textarea) {
    input = document.createElement('textarea');
  } else {
    input = document.createElement('input');
    input.type = 'text';
  }
  input.id = 'in-' + f.id;
  input.value = valueOf(f, occ);
  function grow() {
    if (!f.textarea) return;
    input.style.height = 'auto';
    input.style.height = (input.scrollHeight + 4) + 'px';
  }
  if (f.textarea) requestAnimationFrame(grow);
  function showCount() {
    if (!cnt) return;
    var left = f.max - input.value.length;
    if (left < 0) {
      cnt.textContent = Math.abs(left) + ' zu viel';
      cnt.className = 'cnt over';
      input.classList.add('over');
    } else {
      input.classList.remove('over');
      if (left <= Math.ceil(f.max * 0.15)) {
        cnt.textContent = 'noch ' + left;
        cnt.className = 'cnt warn';
      } else {
        cnt.textContent = '';
        cnt.className = 'cnt';
      }
    }
  }
  showCount();
  input.addEventListener(f.options ? 'change' : 'input', function () {
    setValue(f, occ, input.value);
    showCount();
    grow();
    paintAll();
  });
  wrap.appendChild(head); wrap.appendChild(input);
  return wrap;
}

function photoBlock(occ) {
  zoomUI = null;
  var wrap = document.createElement('div');
  wrap.className = 'f';
  var lab = document.createElement('label');
  lab.textContent = 'Foto';
  wrap.appendChild(lab);

  var entries = galleryEntries();
  if (entries.length) {
    var grid = document.createElement('div');
    grid.className = 'gallery';
    var none = document.createElement('button');
    none.type = 'button';
    none.className = 'ph ph-none';
    none.textContent = 'kein Foto';
    none.setAttribute('aria-pressed', String(!state.photos[occ]));
    none.addEventListener('click', function () {
      delete state.photos[occ]; delete state.photoNames[occ]; resetCrop(occ);
      persist(); paintAll(); buildFields();
    });
    grid.appendChild(none);
    entries.forEach(function (p) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ph';
      btn.title = p.name;
      btn.setAttribute('aria-pressed', String(state.photos[occ] === p.ref));
      var img = document.createElement('img');
      img.src = p.thumb || BLANK;
      img.alt = p.name;
      btn.appendChild(img);
      btn.addEventListener('click', function () {
        state.photos[occ] = p.ref;
        state.photoNames[occ] = p.name;
        resetCrop(occ);
        persist();
        usePhoto(p.ref).then(function () { paintAll(); buildFields(); });
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
  }

  if (pack && !packKey) wrap.appendChild(unlockBlock());

  var pick = document.createElement('button');
  pick.type = 'button';
  pick.className = 'pick';
  pick.innerHTML = 'Eigenes Foto vom Gerät … <em>' + (state.photoNames[occ] || 'kein Foto gewählt') + '</em>';
  var file = document.createElement('input');
  file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
  pick.addEventListener('click', function () { file.click(); });
  file.addEventListener('change', function () {
    var f = file.files && file.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      state.photos[occ] = fr.result;
      state.photoNames[occ] = f.name;
      resetCrop(occ);
      persist();
      usePhoto(fr.result).then(function () { paintAll(); buildFields(); });
    };
    fr.readAsDataURL(f);
  });
  wrap.appendChild(pick); wrap.appendChild(file);
  if (state.photos[occ]) wrap.appendChild(cropBlock(occ));
  return wrap;
}

function cropBlock(occ) {
  var box = document.createElement('div');
  box.className = 'crop';

  var hint = document.createElement('div');
  hint.className = 'crop-t';
  hint.textContent = 'Ausschnitt: im Vorschaubild ziehen. Bei 100 % füllt das Foto eine Richtung genau aus — quer dazu zoomt es beim Ziehen automatisch ein Stück mit.';
  box.appendChild(hint);

  var row = document.createElement('div');
  row.className = 'crop-row';

  var input = document.createElement('input');
  input.type = 'range';
  input.min = '100'; input.max = '260'; input.step = '2';
  input.setAttribute('aria-label', 'Zoom');
  var out = document.createElement('span');
  out.className = 'crop-v';

  zoomUI = { input: input, out: out };
  input.addEventListener('input', function () { setZoom(occ, Number(input.value) / 100); });

  var reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'mini';
  reset.textContent = 'zentrieren';
  reset.addEventListener('click', function () {
    resetCrop(occ); persist(); paintAll(); syncZoomUI(occ);
  });

  row.appendChild(input); row.appendChild(out); row.appendChild(reset);
  box.appendChild(row);
  syncZoomUI(occ);
  return box;
}

function unlockBlock() {
  var box = document.createElement('div');
  box.className = 'unlock';
  var txt = document.createElement('div');
  txt.className = 'unlock-t';
  txt.innerHTML = 'Vereinsfotos sind geschützt. Passwort eingeben, dann erscheint die Galerie.' +
    '<span class="unlock-sub">Das Passwort steht im WhatsApp-Chat der Abteilung. ' +
    'Es bleibt auf diesem Gerät gespeichert — du musst es nur einmal eingeben.</span>';
  var row = document.createElement('div');
  row.className = 'unlock-row';
  var input = document.createElement('input');
  input.type = 'password';
  input.placeholder = 'Vereinspasswort';
  input.autocomplete = 'current-password';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ghost';
  btn.textContent = 'Entsperren';
  var msg = document.createElement('div');
  msg.className = 'unlock-msg';
  function go() {
    btn.disabled = true;
    msg.textContent = 'Prüfe …';
    unlockPack(input.value)
      .then(function () { msg.textContent = ''; paintAll(); buildFields(); })
      .catch(function () { msg.textContent = 'Passwort stimmt nicht.'; btn.disabled = false; });
  }
  btn.addEventListener('click', go);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  row.appendChild(input); row.appendChild(btn);
  box.appendChild(txt); box.appendChild(row); box.appendChild(msg);
  return box;
}

/* ---------- Ansicht ---------- */
function sync() {
  Array.prototype.forEach.call(occsBox.children, function (b) {
    b.setAttribute('aria-pressed', String(b.getAttribute('data-occasion') === state.occasion));
  });
  if (!state.occasion) { fmtsBox.innerHTML = ''; designsBox.innerHTML = ''; editor.hidden = true; return; }
  buildFormats();
  buildDesigns();

  var node = state.design && state.format ? nodes[key(state.design, state.occasion, state.format)] : null;
  if (!node) { editor.hidden = true; return; }
  editor.hidden = false;

  var fmt = formatById(state.format);
  var scale = Math.min(FRAME_W / fmt.w, FRAME_H / fmt.h);
  frame.style.width = Math.round(fmt.w * scale) + 'px';
  frame.style.height = Math.round(fmt.h * scale) + 'px';
  var holder = frame.firstElementChild;
  holder.style.width = fmt.w + 'px';
  holder.style.height = fmt.h + 'px';
  holder.style.transform = 'scale(' + scale + ')';
  while (holder.firstChild) holder.removeChild(holder.firstChild);
  holder.appendChild(node);

  var d = designs.filter(function (x) { return x.id === state.design; })[0] || { name: '' };
  stageTitle.textContent = occasionById(state.occasion).label + ' · ' + fmt.label + ' · ' + d.name;

  var others = formatsForDesign(state.occasion, state.design);
  var packBtn = document.getElementById('save-pack');
  packBtn.hidden = others.length < 2;
  packBtn.textContent = 'Alle ' + others.length + ' Formate als Paket';

  hintEl.textContent = fmt.id === 'a4'
    ? 'A4 mit 300 dpi — zum Ausdrucken oder per Mail an die Druckerei.'
    : fmt.note + ' px. Auf dem Handy öffnet sich das Teilen-Menü (Instagram, Bilder speichern), am Rechner landet das PNG im Download-Ordner.';

  buildFields();
  paintAll();
}

/* ---------- Layouts liegen losgelöst im Speicher ----------
   Sie kommen nur zum Anzeigen oder Rendern kurz ins Dokument — sonst würde
   die Seite mit 36 Layouts in voller Größe unbrauchbar schwer. */
function attached(node, fn) {
  var slot = document.getElementById('render-slot');
  var home = node.parentNode;
  if (!home) slot.appendChild(node);
  function back() { if (!home && node.parentNode === slot) slot.removeChild(node); }
  var out;
  try { out = fn(); } catch (e) { back(); throw e; }
  return Promise.resolve(out).then(function (v) { back(); return v; }, function (e) { back(); throw e; });
}

/* Hintergrundfarbe des Layouts selbst – sonst bekämen helle Designs
   beim Export den dunklen Standard untergelegt. */
function nodeBackground(node) {
  var m = /(?:^|;)\s*background(?:-color)?:\s*([^;"]+)/.exec(node.getAttribute('style') || '');
  if (m) return m[1].trim();
  var live = getComputedStyle(node).backgroundColor;
  if (live && live !== 'transparent' && live !== 'rgba(0, 0, 0, 0)') return live;
  return '#141318';
}

/* Vorschaubilder der Designs: einmal erzeugt, dann gecacht. */
var thumbCache = {};
function thumbFor(k, fmt) {
  if (thumbCache[k]) return thumbCache[k];
  var node = nodes[k];
  if (!node) return Promise.resolve(null);
  var bg = nodeBackground(node);
  thumbCache[k] = FONTS_READY.then(buildFontCSS).then(function (css) {
    return attached(node, function () {
      return window.htmlToImage.toPng(node, {
        width: fmt.w, height: fmt.h, pixelRatio: 260 / fmt.h,
        backgroundColor: bg, fontEmbedCSS: css
      });
    });
  }).catch(function (e) { console.warn(e); return null; });
  return thumbCache[k];
}

/* ---------- Export ---------- */
function slug(t) {
  return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function fileName(occ, fmt) {
  var v = resolved(occ);
  var tail = occ === 'ankuendigung' || occ === 'erinnerung' || occ === 'ergebnis' ? slug(v.gegner)
    : occ === 'portrait' ? slug(v.spielerName) : slug(valueOf(FIELDS.filter(function (f) { return f.id === 'titel'; })[0], occ));
  return 'SVH-' + slug(occasionById(occ).label) + '-' + fmt.id + (tail ? '-' + tail : '') + '.png';
}
/* Wo sitzt das Foto im Layout? Als Anteil der Layoutkanten, damit die
   Angabe für jede Ausgabegröße gilt. */
function photoRectRatio(node) {
  var img = node.querySelector('[data-photo]');
  if (!img || !img.parentElement) return null;
  var b = img.parentElement.getBoundingClientRect(), n = node.getBoundingClientRect();
  if (!n.width || !n.height) return null;
  return { x: (b.left - n.left) / n.width, y: (b.top - n.top) / n.height, w: b.width / n.width, h: b.height / n.height };
}

/* Ist im Fotobereich wirklich ein Foto? Geprüft wird die Farbvielfalt in
   einer 300 px breiten Stichprobe: gemessen liegen echte Fotos bei >1000
   Farbtönen, ein fehlendes Foto (Hintergrund, auch mit Verlauf/Schleier)
   bei unter 200. Schwelle 450 trennt beides mit Abstand. */
function pngHasPhoto(url, rect) {
  if (!rect) return Promise.resolve(true);
  return new Promise(function (res) {
    var im = new Image();
    im.onload = function () {
      try {
        var w = 300, h = Math.max(2, Math.round(300 * im.height / im.width));
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var x = c.getContext('2d');
        x.drawImage(im, 0, 0, w, h);
        var rx = Math.max(0, Math.round(rect.x * w)), ry = Math.max(0, Math.round(rect.y * h));
        var rw = Math.max(2, Math.min(w - rx, Math.round(rect.w * w)));
        var rh = Math.max(2, Math.min(h - ry, Math.round(rect.h * h)));
        var d = x.getImageData(rx, ry, rw, rh).data;
        var seen = {}, n = 0;
        for (var i = 0; i < d.length; i += 4) {
          var kk = (d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3);
          if (!seen[kk]) { seen[kk] = 1; n++; if (n > 450) break; }
        }
        res(n > 450);
      } catch (e) { res(true); }
    };
    im.onerror = function () { res(true); };
    im.src = url;
  });
}

function renderPng(node, occ, fmt, css, bg, rect, tries) {
  return window.htmlToImage.toPng(node, {
    width: fmt.w, height: fmt.h, pixelRatio: fmt.ratio,
    backgroundColor: bg, fontEmbedCSS: css
  }).then(function (url) {
    if (!rect || tries >= 3) return url;
    return pngHasPhoto(url, rect).then(function (ok) {
      return ok ? url : renderPng(node, occ, fmt, css, bg, rect, tries + 1);
    });
  });
}

/* Erster Render einer Sitzung: einmal wegwerfen. Beim allerersten Durchlauf
   sind eingebettete Schriften und das Wappen noch nicht dekodiert und fehlen
   im Ergebnis. Kostet einmalig ~0,1 s. */
var rendererReady = null;
function primeRenderer(node, bg) {
  if (!rendererReady) {
    rendererReady = window.htmlToImage.toPng(node, { pixelRatio: 0.04, backgroundColor: bg })
      .then(function () {}, function () {});
  }
  return rendererReady;
}

function renderFile(occ, fmtId, designId) {
  var k = key(designId, occ, fmtId);
  var node = nodes[k];
  var fmt = formatById(fmtId);
  if (!node) return Promise.resolve(null);
  var bg = nodeBackground(node);
  return FONTS_READY.then(buildFontCSS).then(function (css) {
    return attached(node, function () {
      var rect = state.photos[occ] ? photoRectRatio(node) : null;
      return primeRenderer(node, bg).then(function () {
        return renderPng(node, occ, fmt, css, bg, rect, 0);
      });
    });
  })
    .then(function (url) { return fetch(url); })
    .then(function (r) { return r.blob(); })
    .then(function (blob) { return new File([blob], fileName(occ, fmt), { type: 'image/png' }); });
}
function deliver(files) {
  files = files.filter(Boolean);
  if (!files.length) return Promise.resolve();
  if (navigator.canShare && navigator.canShare({ files: files })) {
    return navigator.share({ files: files, title: 'SVH Media' }).catch(function () {});
  }
  return files.reduce(function (p, f) {
    return p.then(function () {
      var url = URL.createObjectURL(f);
      var a = document.createElement('a');
      a.href = url; a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 6000);
      return new Promise(function (r) { setTimeout(r, 450); });
    });
  }, Promise.resolve());
}
function busy(btn, on, label) {
  btn.disabled = on;
  if (on) { btn.dataset.old = btn.textContent; btn.textContent = label || 'Moment …'; }
  else if (btn.dataset.old) { btn.textContent = btn.dataset.old; }
}
function fail(e) {
  console.error(e);
  alert('Das Bild konnte nicht erzeugt werden. Bitte Seite neu laden und erneut versuchen.');
}

var oneBtn = document.getElementById('save-one');
oneBtn.addEventListener('click', function () {
  busy(oneBtn, true);
  renderFile(state.occasion, state.format, state.design)
    .then(function (f) { return deliver([f]); })
    .catch(fail)
    .then(function () { busy(oneBtn, false); });
});

var packBtn = document.getElementById('save-pack');
packBtn.addEventListener('click', function () {
  var list = formatsForDesign(state.occasion, state.design);
  busy(packBtn, true, 'Erzeuge 1 von ' + list.length + ' …');
  var files = [];
  list.reduce(function (p, f, i) {
    return p.then(function () {
      packBtn.textContent = 'Erzeuge ' + (i + 1) + ' von ' + list.length + ' …';
      return renderFile(state.occasion, f.id, state.design).then(function (file) { files.push(file); });
    });
  }, Promise.resolve())
    .then(function () { return deliver(files); })
    .catch(fail)
    .then(function () { busy(packBtn, false); });
});

boot();
FONTS_READY.then(buildFontCSS);
