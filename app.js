/* SVH Mediengenerator
   Designs liegen in designs/ (Manifest: designs/manifest.json)
   Fotos liegen verschlüsselt in photos/ (Paket: photos/pack.json)
   Neue Designs, Anlässe und Fotos brauchen keine Änderung an dieser Datei –
   siehe README.md. */

/* Abteilungen: bestimmen, welche Anlässe zur Wahl stehen. Eine neue Abteilung
   braucht hier eine Zeile, Anlässe mit passendem dept und ein Design. */
var DEPTS = [
  { id: 'tt', label: 'Tischtennis' },
  { id: 'fb', label: 'Fußball' }
];

var OCCASIONS = [
  { id: 'ankuendigung', label: 'Heimspiel', dept: 'tt' },
  { id: 'erinnerung', label: 'Erinnerung', dept: 'tt' },
  { id: 'ergebnis', label: 'Ergebnis', dept: 'tt' },
  { id: 'portrait', label: 'Spielerporträt', dept: 'tt' },
  { id: 'werbung', label: 'Mitglieder werben', dept: 'tt' },
  { id: 'nachricht', label: 'Vereinsnachricht', dept: 'tt' },
  { id: 'fbSpieltag', label: 'Spieltag', dept: 'fb' },
  { id: 'fbErinnerung', label: 'Erinnerung', dept: 'fb' },
  { id: 'fbErgebnis', label: 'Ergebnis', dept: 'fb' }
];
function deptOf(occ) {
  var o = occasionById(occ);
  return o.dept || 'tt';
}
function occasionsFor(dept) {
  return OCCASIONS.filter(function (o) { return o.dept === dept; });
}

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
  /* Eigene Mannschaft: Auswahl statt Freitext, damit die Schreibweise über
     alle Beiträge gleich bleibt. Neue Mannschaft = eine Zeile mehr.
     scope 'dept': Tischtennis und Fußball haben eigene Mannschaften. */
  { id: 'heim', label: 'Eigene Mannschaft', scope: 'dept',
    defs: { tt: 'SV Hohentengen', fb: 'SV Hohentengen' },
    optionsByDept: {
      tt: ['SV Hohentengen', 'SV Hohentengen 2', 'SV Hohentengen 3', 'SV Hohentengen U19', 'SV Hohentengen U19 2'],
      fb: ['SV Hohentengen', 'SV Hohentengen 2', 'SV Hohentengen A-Jugend', 'SV Hohentengen B-Jugend']
    } },
  { id: 'gegner', label: 'Gegner', scope: 'dept', max: 26,
    defs: { tt: 'TTC Musterstadt', fb: 'FC Beispielheim' } },
  { id: 'liga', label: 'Liga', scope: 'dept', max: 30,
    defs: { tt: 'Bezirksklasse Gruppe 2', fb: 'Kreisliga A' } },
  { id: 'spieltag', label: 'Spieltag', def: '7. Spieltag', max: 18 },
  { id: 'datum', label: 'Datum', def: 'Sa, 26.09.', max: 14 },
  { id: 'uhrzeit', label: 'Uhrzeit', def: '19:30', short: true, max: 8 },
  { id: 'anstoss', label: 'Anstoß', def: '15:00', short: true, max: 8 },
  { id: 'halle', label: 'Halle', def: 'Mehrzweckhalle, Schulstraße 5', max: 42 },
  { id: 'sportplatz', label: 'Sportplatz', def: 'Sportgelände Hohentengen', max: 42 },
  { id: 'punkteHeim', label: 'Punkte eigene Mannschaft', def: '9', short: true, max: 3 },
  { id: 'punkteGast', label: 'Punkte Gegner', def: '5', short: true, max: 3 },
  { id: 'toreHeim', label: 'Tore eigene Mannschaft', def: '3', short: true, max: 3 },
  { id: 'toreGast', label: 'Tore Gegner', def: '1', short: true, max: 3 },
  { id: 'halbzeit', label: 'Halbzeitstand', def: '2:0', max: 8 },
  /* Torschützen: eine Zeile je Tor. Leere Zeilen verschwinden im Layout,
     damit auch ein 1:0 sauber aussieht. */
  { id: 'tor1', label: 'Tor 1', subtitle: 'Minute und Name, z. B. „12 Max Mustermann" — Gegentor: ein G davor', def: "12' Max Mustermann", max: 26, optional: true },
  { id: 'tor2', label: 'Tor 2', def: "34' Jonas Beispiel", max: 26, optional: true },
  { id: 'tor3', label: 'Tor 3', def: "71' Max Mustermann", max: 26, optional: true },
  { id: 'tor4', label: 'Tor 4', def: "G 88' L. Gegner", max: 26, optional: true },
  { id: 'tor5', label: 'Tor 5', def: '', max: 26, optional: true },
  { id: 'tor6', label: 'Tor 6', def: '', max: 26, optional: true },
  { id: 'tor7', label: 'Tor 7', def: '', max: 26, optional: true },
  { id: 'tor8', label: 'Tor 8', def: '', max: 26, optional: true },
  { id: 'tor9', label: 'Tor 9', def: '', max: 26, optional: true },
  { id: 'tor10', label: 'Tor 10', def: '', max: 26, optional: true },
  { id: 'ausgang', label: 'Ausgang', def: 'Sieg', options: ['Sieg', 'Niederlage', 'Unentschieden'] },
  { id: 'spielerName', label: 'Name', def: 'Max Mustermann', max: 24 },
  { id: 'spielerRolle', label: 'Mannschaft / Position', subtitle: 'Position wird durchnummeriert, z. B. „Herren I · Position 3"', def: 'Herren I · Position 3', max: 36 },
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
  { id: 'kontakt', label: 'Kontakt', scope: 'dept', max: 38,
    defs: { tt: 'tischtennis@sv-hohentengen.de', fb: 'fussball@sv-hohentengen.de' } },
  { id: 'zusatz', label: 'Zusätzlicher Text', scope: 'occasion', textarea: true, max: 70, defs: {
      ankuendigung: 'Kommt vorbei!',
      erinnerung: 'Wir brauchen euch — kommt vorbei!',
      ergebnis: 'Danke für eure Unterstützung!',
      fbSpieltag: 'Kommt vorbei und macht Stimmung!',
      fbErinnerung: 'Kommt vorbei und unterstützt die Mannschaft!',
      fbErgebnis: 'Danke für eure Unterstützung!'
    } },
  { id: 'verpflegung', label: 'Hinweis Bewirtung', def: 'Für Essen und Getränke ist gesorgt!', max: 40 },
  { id: 'hashtags', label: 'Hashtags', scope: 'dept', max: 64,
    defs: {
      tt: '#1948 | #nurderSVH | #tischtennis | #gemeinsamfürdenSVH',
      fb: '#1948 | #nurderSVH | #fussball | #gemeinsamfürdenSVH'
    } },
  { id: 'termin', computed: function (v) { return v.datum + ' · ' + v.uhrzeit + ' Uhr'; } },
  { id: 'paarung', computed: function (v) { return v.heim + ' – ' + v.gegner; } },
  /* Kürzel für den Ersatz-Wappenkreis: Vereinstyp UND Ortsname, damit zwei
     Vereine nie dasselbe Monogramm bekommen. Kurzwörter mit mehreren
     Großbuchstaben gelten als Abkürzung (SV, TTC, VfL → VFL), alle übrigen
     Wörter steuern ihren Anfangsbuchstaben bei. Maximal vier Zeichen. */
  { id: 'gegnerKuerzel', computed: function (v) {
      var raw = String(v.gegner || '').trim();
      if (!raw) return '?';
      var out = '';
      raw.split(/[\s.\-–/]+/).filter(Boolean).forEach(function (w) {
        var caps = w.replace(/[^A-ZÄÖÜ]/g, '');
        if (caps.length >= 2) out += (w.length <= 4 ? w.toUpperCase() : caps);
        else out += w.charAt(0).toUpperCase();
      });
      return out.slice(0, 4) || '?';
    } }
];

var OUTCOME_COLORS = { 'Sieg': '#2f9e44', 'Niederlage': '#2B2B30', 'Unentschieden': '#E8A33D' };
var VEREIN = 'SV Hohentengen';
var STORE = 'svh-media-generator-v1';
var FRAME_W = 346, FRAME_H = 615;
var BLANK = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgwIiBoZWlnaHQ9IjEyMDAiPjxyZWN0IHdpZHRoPSIxMDgwIiBoZWlnaHQ9IjEyMDAiIGZpbGw9IiMyNjI1MmMiLz48dGV4dCB4PSI1NDAiIHk9IjYxNSIgZm9udC1mYW1pbHk9IkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ0IiBmaWxsPSIjN2M3YTg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Gb3RvIHdhZWhsZW48L3RleHQ+PC9zdmc+';

/* Transparent: Logo-Plätze zeigen im Leerzustand den Ersatzkreis, der im
   Layout hinter dem Bild liegt — kein grauer Kasten darüber. */
var BLANK_LOGO = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>');

/* Bildplätze: ein Layout kann mehrere haben (data-photo="haupt" usw.).
   "1" ist der alte Einzelplatz und zählt als Hauptfoto. */
var SLOTS = {
  haupt:  { label: 'Hauptfoto', kind: 'foto' },
  zweit:  { label: 'Zweites Foto', kind: 'foto' },
  gegner: { label: 'Gegner-Logo', kind: 'logo' }
};
function slotId(img) {
  var v = img.getAttribute('data-photo');
  return (!v || v === '1') ? 'haupt' : v;
}
function slotMeta(id) { return SLOTS[id] || { label: 'Bild', kind: 'foto' }; }
function pkey(occ, slot) { return occ + '::' + slot; }
function slotsIn(node) {
  var seen = {}, out = [];
  Array.prototype.forEach.call(node.querySelectorAll('[data-photo]'), function (img) {
    var s = slotId(img);
    if (!seen[s]) { seen[s] = 1; out.push(s); }
  });
  return out;
}

var designs = [], gallery = [], logos = [], nodes = {};
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

/* Fotos auf Maß bringen – hält den Export schnell, egal wie groß das Handyfoto war.
   Transparenz bleibt erhalten: Vereinswappen sind PNG mit Alphakanal, ein
   JPEG daraus hätte einen schwarzen Kasten um das Logo. */
function alphaSource(dataUrl) {
  return /^data:image\/(png|svg\+xml|webp|gif)/i.test(dataUrl || '');
}
function normalizePhoto(dataUrl) {
  return new Promise(function (res) {
    var img = new Image();
    var keepAlpha = alphaSource(dataUrl);
    img.onload = function () {
      var long = Math.max(img.width, img.height);
      if (long <= PHOTO_MAX && (keepAlpha || dataUrl.indexOf('data:image/jpeg') === 0)) return res(dataUrl);
      var scale = Math.min(1, PHOTO_MAX / long);
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      try {
        res(keepAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85));
      } catch (e) { res(dataUrl); }
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

/* Gegner-Logos liegen offen in logos/ — fremde Vereinswappen sind nicht
   privat, ein Passwort wäre nur Reibung. Neues Logo: Datei ablegen und eine
   Zeile in logos/manifest.json ergänzen. */
function logoEntries() {
  return logos.map(function (l) { return { ref: l.file, name: l.name || l.file, thumb: l.file }; });
}

/* ---------- Zustand ---------- */
var state = { dept: null, occasion: null, format: null, design: null, values: {}, occValues: {}, deptValues: {}, photos: {}, photoNames: {}, crops: {} };

try {
  var saved = JSON.parse(localStorage.getItem(STORE) || '{}');
  if (saved.values) state.values = saved.values;
  if (saved.occValues) state.occValues = saved.occValues;
  if (saved.deptValues) state.deptValues = saved.deptValues;
  if (saved.photos) state.photos = saved.photos;
  if (saved.photoNames) state.photoNames = saved.photoNames;
  if (saved.crops) state.crops = saved.crops;
  /* Früher gab es einen Bildplatz pro Anlass (Schlüssel = Anlass).
     Jetzt sind es benannte Plätze — alte Auswahl wandert aufs Hauptfoto. */
  [state.photos, state.photoNames, state.crops].forEach(function (map) {
    Object.keys(map).forEach(function (k) {
      if (k.indexOf('::') < 0) { map[pkey(k, 'haupt')] = map[k]; delete map[k]; }
    });
  });
  state.occasion = saved.occasion || null;
  state.format = saved.format || null;
  state.design = saved.design || null;
  state.dept = saved.dept || (state.occasion ? deptOf(state.occasion) : null);
} catch (e) {}

function persist() {
  try {
    var photos = {};
    Object.keys(state.photos).forEach(function (k) {
      if (String(state.photos[k]).indexOf('data:') !== 0) photos[k] = state.photos[k];
    });
    localStorage.setItem(STORE, JSON.stringify({
      values: state.values, occValues: state.occValues, deptValues: state.deptValues,
      dept: state.dept, occasion: state.occasion, format: state.format, design: state.design,
      photos: photos, photoNames: state.photoNames, crops: state.crops
    }));
  } catch (e) {}
}

function valueOf(f, occ) {
  if (f.scope === 'occasion') {
    var bag = state.occValues[occ] || {};
    return bag[f.id] != null ? bag[f.id] : ((f.defs && f.defs[occ]) || '');
  }
  if (f.scope === 'dept') {
    var dept = deptOf(occ);
    var dbag = state.deptValues[dept] || {};
    return dbag[f.id] != null ? dbag[f.id] : ((f.defs && f.defs[dept]) || '');
  }
  return state.values[f.id] != null ? state.values[f.id] : f.def;
}
function setValue(f, occ, val) {
  if (f.scope === 'occasion') {
    if (!state.occValues[occ]) state.occValues[occ] = {};
    state.occValues[occ][f.id] = val;
  } else if (f.scope === 'dept') {
    var dept = deptOf(occ);
    if (!state.deptValues[dept]) state.deptValues[dept] = {};
    state.deptValues[dept][f.id] = val;
  } else {
    state.values[f.id] = val;
  }
  persist();
}
function fieldById(id) {
  for (var i = 0; i < FIELDS.length; i++) if (FIELDS[i].id === id) return FIELDS[i];
  return null;
}
function optionsOf(f, occ) {
  if (f.optionsByDept) return f.optionsByDept[deptOf(occ)] || [];
  return f.options || null;
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
/* Torschützen: bis zu zehn Tore. Gleicher Name = eine Zeile mit allen
   Minuten dahinter, und ab sieben Zeilen läuft die Liste zweispaltig mit
   kleinerer Schrift — sonst passt ein 7:3 nicht mehr in die Kachel.
   Ein „G" vor der Zeile (oder „(G)" dahinter) markiert ein Gegentor. */
function goalGroups(v) {
  var list = [];
  for (var i = 1; i <= 10; i++) {
    var raw = v['tor' + i];
    if (raw == null) continue;
    raw = String(raw).trim();
    if (!raw) continue;
    var own = true, m;
    if ((m = raw.match(/^g\s*[:.\-\u00b7]?\s+(.+)$/i))) { own = false; raw = m[1].trim(); }
    if ((m = raw.match(/^(.*?)\(\s*g\s*\)$/i))) { own = false; raw = m[1].trim(); }
    var min = '', name = raw;
    if ((m = raw.match(/^(\d{1,3})\s*['\u2019\u00b4`\u00b7.+-]*\s*(.+)$/)) ) { min = m[1]; name = m[2].trim(); }
    list.push({ min: min, sort: min === '' ? 999 : parseInt(min, 10), name: name, own: own });
  }
  list.sort(function (a, b) { return a.sort - b.sort; });
  var groups = [], seen = {};
  list.forEach(function (g) {
    var key = (g.own ? 'h\u00b7' : 'a\u00b7') + g.name.toLowerCase();
    if (seen[key]) { seen[key].mins.push(g.min); return; }
    seen[key] = { name: g.name, own: g.own, mins: [g.min] };
    groups.push(seen[key]);
  });
  return groups;
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function layoutGoals(node, v) {
  var boxes = node.querySelectorAll('[data-goals]');
  if (!boxes.length) return;
  var groups = goalGroups(v);
  var n = groups.length, two = n > 6;
  var f = two ? 0.76 : (n > 4 ? 0.89 : 1);
  Array.prototype.forEach.call(boxes, function (box) {
    var nameSize = Math.round((+box.getAttribute('data-goal-name') || 38) * f);
    var minSize = Math.round((+box.getAttribute('data-goal-min') || 33) * f);
    var gap = +box.getAttribute('data-goal-gap') || 13;
    box.style.gridTemplateColumns = two ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)';
    box.style.gap = Math.round(gap * (two ? 0.85 : 1)) + 'px ' + (two ? Math.round(gap * 2) + 'px' : '0px');
    Array.prototype.forEach.call(box.querySelectorAll('[data-goal-row]'), function (row, i) {
      var g = groups[i];
      if (!g) { row.style.display = 'none'; return; }
      row.style.display = 'flex';
      row.style.columnGap = Math.round(nameSize * 0.42) + 'px';
      var outer = row.firstElementChild;
      var inner = row.querySelector('[data-field]');
      if (!outer || !inner) return;
      outer.style.fontSize = nameSize + 'px';
      outer.style.color = g.own ? '#F5F2EE' : 'rgba(245,242,238,0.62)';
      var mins = g.mins.filter(function (m) { return m !== ''; }).map(function (m) {
        return '<span style="font-family:\'Archivo Black\',sans-serif; font-size:' + minSize +
          'px; line-height:1.15; color:' + (g.own ? '#E03131' : 'rgba(245,242,238,0.5)') + ';">' + m + '&#39;</span>';
      }).join('');
      inner.innerHTML = escHtml(g.name) +
        (mins ? '<span style="display:inline-flex; align-items:baseline; gap:' + Math.round(minSize * 0.33) +
          'px; margin-left:' + Math.round(nameSize * 0.42) + 'px;">' + mins + '</span>' : '');
    });
  });
}

function paintNode(node, occ) {
  var v = resolved(occ);
  Array.prototype.forEach.call(node.querySelectorAll('[data-field]'), function (el) {
    var id = el.getAttribute('data-field');
    var f = fieldById(id);
    /* Optionale Felder dürfen leer sein (z. B. das vierte Tor) — dann wird
       der Platzhalter aus dem Layout entfernt, nicht stehen gelassen. */
    if (f && f.optional) el.textContent = v[id] || '';
    else if (v[id] != null && v[id] !== '') el.textContent = v[id];
  });
  /* Ganze Zeilen ausblenden, wenn ihr Feld leer ist. */
  Array.prototype.forEach.call(node.querySelectorAll('[data-hide-empty]'), function (el) {
    var id = el.getAttribute('data-hide-empty');
    el.style.display = (v[id] != null && String(v[id]).trim() !== '') ? '' : 'none';
  });
  layoutGoals(node, v);
  var color = OUTCOME_COLORS[v.ausgang] || '#2B2B30';
  Array.prototype.forEach.call(node.querySelectorAll('[data-outcome-bg]'), function (el) { el.style.background = color; });
  Array.prototype.forEach.call(node.querySelectorAll('[data-photo]'), function (img) {
    var slot = slotId(img), pk = pkey(occ, slot);
    var empty = slotMeta(slot).kind === 'logo' ? BLANK_LOGO : BLANK;
    var ref = state.photos[pk];
    var shown = ref ? (IMG_CACHE_READY[ref] || empty) : empty;
    if (img.getAttribute('src') !== shown) img.src = shown;
    if (slotMeta(slot).kind === 'logo') {
      /* Logos werden nicht zugeschnitten: ganz zeigen, nichts ziehen. */
      img.style.objectFit = 'contain';
      img.style.transform = 'none';
      img.style.pointerEvents = 'none';
      return;
    }
    bindCropDrag(img, pk);
    applyCrop(img, pk);
  });
  /* Kürzel im Wappenkreis mitskalieren: die Layouts sind auf drei Zeichen
     gesetzt, vier müssen ebenso hineinpassen. */
  Array.prototype.forEach.call(node.querySelectorAll('[data-field="gegnerKuerzel"]'), function (el) {
    var host = el.parentElement;
    if (!host) return;
    if (!host.getAttribute('data-fs-base')) {
      host.setAttribute('data-fs-base', String(parseFloat(getComputedStyle(host).fontSize) || 0));
    }
    var base = parseFloat(host.getAttribute('data-fs-base'));
    var len = (el.textContent || '').length;
    if (base) host.style.fontSize = Math.round(base * Math.min(1, 3 / Math.max(1, len))) + 'px';
  });

  /* Ersatzwappen nur zeigen, solange kein Gegner-Logo gewählt ist.
     Über visibility statt display, damit das im Layout gesetzte
     display (flex, grid, …) unangetastet bleibt. */
  Array.prototype.forEach.call(node.querySelectorAll('[data-logo-fallback]'), function (el) {
    var has = !!state.photos[pkey(occ, el.getAttribute('data-logo-fallback') || 'gegner')];
    el.style.visibility = has ? 'hidden' : 'visible';
  });
  applyDecor(node);
}

/* ---------- Tischtennis-Objekt im Hintergrund ----------
   Schläger-Silhouette: Game Icons (CC BY 3.0, Delapouite) — Namensnennung
   steht in README.md und github.md.
   Der Platz wird pro Layout gemessen: belegt ist alles, was gemalt wird oder
   Text trägt. Passt in kein freies Band ein Objekt, bleibt die Fläche leer. */
var GAME_BAT = 'M323.438 21.28c-1.136-.002-2.276.004-3.407.032-5.167.13-10.286.566-15.342 1.313-40.45 5.973-78.013 31.68-108.5 65.5-30.488 33.82-53.72 75.57-65.688 111.563-5.985 17.996-9.117 34.56-9.22 47.593-.1 13.034 2.973 21.942 7.282 26.25L238.438 383.44c4.31 4.31 13.25 7.383 26.282 7.28 11.386-.088 25.464-2.49 40.842-7.093 1.27-18.692 9.452-36.646 22.875-49.906 14.647-14.47 34.892-22.75 55.563-22.75 12.415 0 24.67 3.01 35.656 8.53 1.406-1.22 2.808-2.443 4.188-3.688 33.82-30.487 59.558-68.05 65.53-108.5 5.974-40.45-6.884-84.572-53.5-131.187C396.362 36.61 358.65 21.37 323.438 21.28zM135.375 305.814c.336 28.81-13.204 52.198-32.063 71.75-23.56 24.425-54.908 45.003-80.78 69.843 5.21 17.185 8.287 25.638 12.374 29.78 4.09 4.146 12.346 7.215 29.594 12.283 24.656-25.833 44.44-57.94 68.5-82 12.625-12.627 26.7-23.098 43.594-28.408 8.804-2.766 18.313-3.977 28.5-3.53l-69.72-69.72zM384 328.969c-15.79 0-31.774 6.565-42.906 17.56-11.132 10.998-17.724 26.717-17.72 42.22.006 15.497 6.59 31.23 17.72 42.22 11.13 10.988 27.12 17.53 42.906 17.53 15.785 0 31.775-6.542 42.906-17.53 11.13-10.99 17.714-26.723 17.72-42.22.004-15.503-6.588-31.222-17.72-42.22-11.132-10.995-27.115-17.56-42.906-17.56z';

function batUrl(color) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="' +
    color + '" d="' + GAME_BAT + '"/></svg>');
}

/* Füllt ein Foto die ganze Fläche? Dann kein Dekor — zwei Bilder würden um
   dieselbe Fläche konkurrieren. */
function photoFills(node, w, h) {
  var fills = false;
  Array.prototype.forEach.call(node.querySelectorAll('[data-photo]'), function (img) {
    var box = img.parentElement || img;
    if (box.offsetWidth * box.offsetHeight > w * h * 0.75) fills = true;
  });
  return fills;
}

function decorBands(node, w, h, x0, x1) {
  var br = node.getBoundingClientRect();
  if (!br.height) return [];
  var sc = br.height / h;
  var occ = [];
  function add(el, pad) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (r.height < 1) return;
    /* Nur was in die betrachtete Spalte hineinreicht, blockiert sie. */
    var left = (r.left - br.left) / sc, right = (r.right - br.left) / sc;
    if (right <= x0 || left >= x1) return;
    occ.push({ top: (r.top - br.top) / sc - pad, bottom: (r.bottom - br.top) / sc + pad });
  }
  Array.prototype.forEach.call(node.querySelectorAll('[data-photo]'), function (im) {
    add(im.parentElement || im, 10);
  });
  add(node.querySelector('[data-footer]'), 10);
  Array.prototype.forEach.call(node.querySelectorAll('*'), function (el) {
    if (el.hasAttribute('data-tt-decor') || el.closest('[data-tt-decor]')) return;
    var txt = (el.textContent || '').trim();
    var leaf = txt && !Array.prototype.some.call(el.children, function (c) {
      return (c.textContent || '').trim();
    });
    var cs = getComputedStyle(el);
    var paints = cs.backgroundImage !== 'none' ||
      (cs.backgroundColor && !/rgba\([^)]*,\s*0\)/.test(cs.backgroundColor) && cs.backgroundColor !== 'transparent');
    if (leaf || paints) add(el, 14);
  });

  var step = 6, bands = [], cur = null;
  for (var y = 0; y < h; y += step) {
    var hit = occ.some(function (o) { return y >= o.top && y < o.bottom; });
    if (hit) { if (cur) { bands.push(cur); cur = null; } }
    else if (cur) cur.bottom = y + step;
    else cur = { top: y, bottom: y + step };
  }
  if (cur) bands.push(cur);
  return bands.sort(function (a, b) { return (b.bottom - b.top) - (a.bottom - a.top); });
}

function applyDecor(node) {
  var w = node.offsetWidth, h = node.offsetHeight;
  if (!w || !h) return;
  var old = node.querySelector('[data-tt-decor]');
  if (old) old.parentNode.removeChild(old);
  /* Designs mit eigenem Grafikmotiv (z. B. das Fußball-Spielfeld) bringen
     ihren Hintergrund selbst mit — dort kein Tischtennis-Schläger. */
  if (node.hasAttribute('data-no-decor')) return;
  if (photoFills(node, w, h)) return;

  var bg = (node.getAttribute('style') || '');
  var light = /#F5F2EE|#EFEDEA/i.test(bg);
  var ink = light ? 'rgba(20,19,24,0.1)' : 'rgba(245,242,238,0.085)';
  var strong = light ? 'rgba(20,19,24,0.2)' : 'rgba(245,242,238,0.18)';
  var s = w / 1080;

  /* Drei Spalten prüfen: ganze Breite, linke und rechte Hälfte. In dichten
     Layouts ist oft nur eine Hälfte frei — wer nur volle Breite messt,
     findet dort nie Platz und lässt ganze Designs ohne Objekt. */
  var cols = [
    { x0: 0, x1: w, w: w },
    { x0: 0, x1: w * 0.56, w: w * 0.56 },
    { x0: w * 0.44, x1: w, w: w * 0.56 }
  ];
  var best = null;
  cols.forEach(function (c) {
    var band = decorBands(node, w, h, c.x0, c.x1)[0];
    if (!band) return;
    var bh = band.bottom - band.top;
    if (!best || bh > best.bh) best = { band: band, col: c, bh: bh };
  });
  /* Unter dieser Bandhöhe bliebe nur ein dünner Streifen sichtbar. */
  if (!best || best.bh < 190 * s) return;

  /* Der Schläger wird groß gesetzt und vom freien Platz beschnitten, statt
     auf die Bandhöhe zu schrumpfen: ein angeschnittenes Blatt ist als
     Schläger lesbar, ein 180-px-Objekt war nur ein Fleck.
     Der Beschnitt umfasst genau die gemessene Spalte — volle Breite würde
     in die andere Hälfte reichen, wo Text steht. */
  var cw = best.col.x1 - best.col.x0;
  var size = Math.min(cw * 1.45, 760 * s);
  var right = best.col.x0 > 0;
  var left = right ? cw - size * 0.72 : -size * 0.28;
  var inner = '<div style="position:absolute; left:' + best.col.x0 + 'px; top:' + best.band.top +
    'px; width:' + cw + 'px; height:' + best.bh + 'px; overflow:hidden;">' +
    '<img src="' + batUrl(ink) + '" alt="" style="position:absolute; left:' + left +
    'px; top:' + ((best.bh - size) / 2) + 'px; width:' + size + 'px; height:' + size +
    'px; transform:rotate(-14deg); object-fit:contain; display:block;">' +
    '</div>';

  var layer = document.createElement('div');
  layer.setAttribute('data-tt-decor', '1');
  layer.setAttribute('style', 'position:absolute; inset:0; overflow:hidden; pointer-events:none;');
  layer.innerHTML = inner;
  node.insertBefore(layer, node.firstChild);
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
  var pinch = null;
  var pts = {};
  function dist() {
    var k = Object.keys(pts);
    if (k.length < 2) return 0;
    var a = pts[k[0]], b = pts[k[1]];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  var drag = null;
  function refresh() {
    img.__cropDragging = !!drag;
    img.style.cursor = state.photos[occ] ? (drag ? 'grabbing' : 'grab') : '';
  }
  img.addEventListener('pointerdown', function (e) {
    if (!state.photos[occ]) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(pts).length === 2) {
      drag = null;
      pinch = { d: dist(), z: cropOf(occ).z };
      refresh();
      e.preventDefault();
      return;
    }
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
    if (pts[e.pointerId]) { pts[e.pointerId].x = e.clientX; pts[e.pointerId].y = e.clientY; }
    if (pinch) {
      var d = dist();
      if (pinch.d > 8 && d > 8) setZoom(occ, pinch.z * d / pinch.d);
      e.preventDefault();
      return;
    }
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
  function end(e) {
    if (e && e.pointerId != null) delete pts[e.pointerId];
    if (pinch && Object.keys(pts).length < 2) { pinch = null; persist(); refresh(); return; }
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
  if (zoomUI.input) zoomUI.input.value = String(Math.round(z * 100));
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
        fetchJson('photos/pack.json').catch(function () { return null; }),
        fetchJson('logos/manifest.json').catch(function () { return []; })
      ]);
    })
    .then(function (res) {
      gallery = res[0] || [];
      pack = res[1];
      logos = res[2] || [];
      var pw = null;
      try { pw = localStorage.getItem(PW_STORE); } catch (e) {}
      if (!pack || !pw) return;
      return unlockPack(pw).catch(function () { try { localStorage.removeItem(PW_STORE); } catch (e) {} });
    })
    .then(function () {
      return Promise.all(Object.keys(state.photos).map(function (k) { return usePhoto(state.photos[k]); }));
    })
    .then(function () {
      buildDepts();
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
var deptsBox = document.getElementById('depts');
var occsBox = document.getElementById('occs');
var fmtsBox = document.getElementById('fmts');
var designsBox = document.getElementById('designs');
var fieldsBox = document.getElementById('fields');
var frame = document.getElementById('frame');
var editor = document.getElementById('editor');
var stageTitle = document.getElementById('stage-title');
var hintEl = document.getElementById('hint');

function buildDepts() {
  deptsBox.innerHTML = '';
  DEPTS.forEach(function (dp) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg';
    btn.setAttribute('data-dept', dp.id);
    btn.setAttribute('aria-pressed', String(dp.id === state.dept));
    btn.textContent = dp.label;
    btn.addEventListener('click', function () { pickDept(dp.id); });
    deptsBox.appendChild(btn);
  });
}
function pickDept(id) {
  state.dept = id;
  var occs = occasionsFor(id);
  if (!occs.some(function (o) { return o.id === state.occasion; })) {
    state.occasion = occs.length ? occs[0].id : null;
    var fmts = formatsFor(state.occasion);
    if (!fmts.some(function (f) { return f.id === state.format; })) state.format = fmts.length ? fmts[0].id : null;
    fixDesign();
  }
  persist(); sync();
}

function buildOccasions() {
  occsBox.innerHTML = '';
  occasionsFor(state.dept).forEach(function (o) {
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
  state.dept = deptOf(id);
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

  if (node.querySelector('[data-photo]')) fieldsBox.appendChild(photoBlocks(occ, node));

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
  var opts = optionsOf(f, occ);
  if (opts) {
    input = document.createElement('select');
    opts.forEach(function (o) {
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
  input.addEventListener(opts ? 'change' : 'input', function () {
    setValue(f, occ, input.value);
    showCount();
    grow();
    paintAll();
  });
  wrap.appendChild(head); wrap.appendChild(input);
  if (f.subtitle) {
    var note = document.createElement('div');
    note.className = 'f-note';
    note.textContent = f.subtitle;
    wrap.appendChild(note);
  }
  return wrap;
}

/* Ein Abschnitt pro Bildplatz des gewählten Layouts. */
function photoBlocks(occ, node) {
  var box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-direction:column;gap:18px';
  slotsIn(node).forEach(function (slot) { box.appendChild(slotBlock(occ, slot)); });
  return box;
}

function slotBlock(occ, slot) {
  var meta = slotMeta(slot);
  var isLogo = meta.kind === 'logo';
  var pk = pkey(occ, slot);
  if (!isLogo) zoomUI = null;
  var wrap = document.createElement('div');
  wrap.className = 'f';
  var lab = document.createElement('label');
  lab.textContent = meta.label;
  wrap.appendChild(lab);

  var entries = isLogo ? logoEntries() : galleryEntries();
  if (entries.length) {
    var grid = document.createElement('div');
    grid.className = 'gallery';
    var none = document.createElement('button');
    none.type = 'button';
    none.className = 'ph ph-none';
    none.textContent = isLogo ? 'kein Logo' : 'kein Foto';
    none.setAttribute('aria-pressed', String(!state.photos[pk]));
    none.addEventListener('click', function () {
      delete state.photos[pk]; delete state.photoNames[pk]; resetCrop(pk);
      persist(); paintAll(); buildFields();
    });
    grid.appendChild(none);
    entries.forEach(function (p) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ph';
      btn.title = p.name;
      btn.setAttribute('aria-pressed', String(state.photos[pk] === p.ref));
      var img = document.createElement('img');
      img.src = p.thumb || BLANK;
      img.alt = p.name;
      btn.appendChild(img);
      btn.addEventListener('click', function () {
        state.photos[pk] = p.ref;
        state.photoNames[pk] = p.name;
        resetCrop(pk);
        persist();
        usePhoto(p.ref).then(function () { paintAll(); buildFields(); });
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
  }

  if (!isLogo && pack && !packKey) wrap.appendChild(unlockBlock());

  var pick = document.createElement('button');
  pick.type = 'button';
  pick.className = 'pick';
  pick.innerHTML = (isLogo ? 'Logo vom Gerät … <em>' : 'Eigenes Foto vom Gerät … <em>') +
    (state.photoNames[pk] || (isLogo ? 'kein Logo gewählt' : 'kein Foto gewählt')) + '</em>';
  var file = document.createElement('input');
  file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
  pick.addEventListener('click', function () { file.click(); });
  file.addEventListener('change', function () {
    var f = file.files && file.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      state.photos[pk] = fr.result;
      state.photoNames[pk] = f.name;
      resetCrop(pk);
      persist();
      usePhoto(fr.result).then(function () { paintAll(); buildFields(); });
    };
    fr.readAsDataURL(f);
  });
  wrap.appendChild(pick); wrap.appendChild(file);
  if (!isLogo && state.photos[pk]) wrap.appendChild(cropBlock(pk));
  return wrap;
}

function cropBlock(occ) {
  var touch = matchMedia('(hover:none) and (pointer:coarse)').matches;
  var box = document.createElement('div');
  box.className = 'crop';

  var hint = document.createElement('div');
  hint.className = 'crop-t';
  hint.textContent = touch
    ? 'Ausschnitt: im Vorschaubild mit einem Finger schieben, mit zwei Fingern zoomen.'
    : 'Ausschnitt: im Vorschaubild ziehen. Bei 100 % füllt das Foto eine Richtung genau aus — quer dazu zoomt es beim Ziehen automatisch ein Stück mit.';
  box.appendChild(hint);

  var row = document.createElement('div');
  row.className = 'crop-row';

  var out = document.createElement('span');
  out.className = 'crop-v';

  if (touch) {
    /* Am Handy ersetzt die Zwei-Finger-Geste den Regler. */
    zoomUI = { input: null, out: out };
    out.style.textAlign = 'left';
    row.appendChild(out);
  } else {
    var input = document.createElement('input');
    input.type = 'range';
    input.min = '100'; input.max = '260'; input.step = '2';
    input.setAttribute('aria-label', 'Zoom');
    zoomUI = { input: input, out: out };
    input.addEventListener('input', function () { setZoom(occ, Number(input.value) / 100); });
    row.appendChild(input); row.appendChild(out);
  }

  var reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'mini';
  reset.textContent = 'zentrieren';
  reset.addEventListener('click', function () {
    resetCrop(occ); persist(); paintAll(); syncZoomUI(occ);
  });

  row.appendChild(reset);
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
  Array.prototype.forEach.call(deptsBox.children, function (b) {
    b.setAttribute('aria-pressed', String(b.getAttribute('data-dept') === state.dept));
  });
  if (!state.dept) { occsBox.innerHTML = ''; fmtsBox.innerHTML = ''; designsBox.innerHTML = ''; editor.hidden = true; return; }
  buildOccasions();
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
    ? 'A4 mit 300 dpi — zum Ausdrucken oder per Mail an die Druckerei. Nach dem Erzeugen kannst du teilen oder speichern.'
    : fmt.note + ' px. Nach dem Erzeugen kannst du teilen oder speichern — Teilen (Instagram, WhatsApp) bietet der Browser am Handy an.';

  buildFields();
  paintAll();
  /* Das Dekor braucht Maße: erst jetzt, wo das Layout im Dokument hängt. */
  applyDecor(node);
}

/* ---------- Layouts liegen losgelöst im Speicher ----------
   Sie kommen nur zum Anzeigen oder Rendern kurz ins Dokument — sonst würde
   die Seite mit 36 Layouts in voller Größe unbrauchbar schwer. */
function attached(node, fn) {
  var slot = document.getElementById('render-slot');
  var home = node.parentNode;
  if (!home) slot.appendChild(node);
  /* Jetzt hat das Layout Maße — Dekor passend zum aktuellen Inhalt setzen. */
  applyDecor(node);
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
function photoRectRatio(node, occ) {
  var img = null;
  Array.prototype.forEach.call(node.querySelectorAll('[data-photo]'), function (el) {
    var slot = slotId(el);
    if (!img && slotMeta(slot).kind === 'foto' && state.photos[pkey(occ, slot)]) img = el;
  });
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
      var rect = photoRectRatio(node, occ);
      return primeRenderer(node, bg).then(function () {
        return renderPng(node, occ, fmt, css, bg, rect, 0);
      });
    });
  })
    .then(function (url) { return fetch(url); })
    .then(function (r) { return r.blob(); })
    .then(function (blob) { return new File([blob], fileName(occ, fmt), { type: 'image/png' }); });
}
function downloadAll(files) {
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

/* Fertige Dateien: teilen (geht direkt nach Instagram/WhatsApp) oder speichern.
   Die Auswahl kommt immer — Teilen ist nur dort möglich, wo der Browser es
   anbietet (Handy ja; Desktop und eingebettete Vorschau meist nicht). */
function deliver(files) {
  files = files.filter(Boolean);
  if (!files.length) return Promise.resolve();
  var canShare = !!(navigator.share && navigator.canShare && navigator.canShare({ files: files }));

  return new Promise(function (done) {
    var back = document.createElement('div');
    back.className = 'sheet-back';
    var sheet = document.createElement('div');
    sheet.className = 'sheet';

    var h = document.createElement('div');
    h.className = 'sheet-h';
    h.textContent = files.length > 1 ? files.length + ' Bilder fertig' : 'Bild fertig';
    var sub = document.createElement('div');
    sub.className = 'sheet-sub';
    sub.textContent = files.map(function (f) { return f.name; }).join(', ');

    function close(run) {
      back.remove();
      document.removeEventListener('keydown', onKey);
      Promise.resolve(run ? run() : null).catch(function () {}).then(done);
    }
    function onKey(e) { if (e.key === 'Escape') close(null); }

    sheet.appendChild(h); sheet.appendChild(sub);

    var save = document.createElement('button');
    save.type = 'button';
    save.className = 'sheet-b' + (canShare ? '' : ' primary');
    save.textContent = files.length > 1 ? 'Alle speichern' : 'Speichern';
    save.addEventListener('click', function () { close(function () { return downloadAll(files); }); });

    if (canShare) {
      var share = document.createElement('button');
      share.type = 'button';
      share.className = 'sheet-b primary';
      share.textContent = 'Teilen → Instagram, WhatsApp …';
      share.addEventListener('click', function () {
        close(function () { return navigator.share({ files: files, title: 'SVH Media' }); });
      });
      sheet.appendChild(share);
      sheet.appendChild(save);
    } else {
      sheet.appendChild(save);
      var note = document.createElement('div');
      note.className = 'sheet-note';
      note.textContent = 'Direkt teilen kann dieser Browser nicht — am Handy erscheint hier zusätzlich „Teilen“.';
      sheet.appendChild(note);
    }

    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'sheet-b ghost';
    cancel.textContent = 'Abbrechen';
    cancel.addEventListener('click', function () { close(null); });
    sheet.appendChild(cancel);

    back.addEventListener('click', function (e) { if (e.target === back) close(null); });
    document.addEventListener('keydown', onKey);

    back.appendChild(sheet);
    document.body.appendChild(back);
    (canShare ? sheet.querySelector('.primary') : save).focus();
  });
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

/* Fortschrittsbalken mit Zähler: vier Formate brauchen zusammen einige
   Sekunden — ohne Anzeige wirkt das wie ein Hänger. */
function progress(total) {
  var box = document.createElement('div');
  box.className = 'prog';
  var lab = document.createElement('div');
  lab.className = 'prog-l';
  var track = document.createElement('div');
  track.className = 'prog-t';
  var bar = document.createElement('div');
  bar.className = 'prog-b';
  track.appendChild(bar);
  box.appendChild(lab); box.appendChild(track);
  packBtn.parentNode.insertBefore(box, packBtn.nextSibling);
  return {
    step: function (n, name) {
      lab.textContent = 'Bild ' + n + ' von ' + total + (name ? ' · ' + name : '');
      bar.style.width = Math.round((n - 1) / total * 100) + '%';
    },
    doneStep: function (n) { bar.style.width = Math.round(n / total * 100) + '%'; },
    end: function () { box.remove(); }
  };
}

var packBtn = document.getElementById('save-pack');
packBtn.addEventListener('click', function () {
  var list = formatsForDesign(state.occasion, state.design);
  busy(packBtn, true, 'Erzeuge …');
  var p = progress(list.length);
  var files = [];
  list.reduce(function (prev, f, i) {
    return prev.then(function () {
      p.step(i + 1, f.label || f.id);
      return renderFile(state.occasion, f.id, state.design).then(function (file) {
        files.push(file);
        p.doneStep(i + 1);
      });
    });
  }, Promise.resolve())
    .then(function () { p.end(); return deliver(files); })
    .catch(fail)
    .then(function () { p.end(); busy(packBtn, false); });
});

boot();
FONTS_READY.then(buildFontCSS);
