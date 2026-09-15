/* Fotoverwaltung: verkleinert, verschlüsselt und verpackt Fotos für photos/.
   Alles passiert im Browser – die Bilder verlassen das Gerät nur verschlüsselt. */

var ITER = 150000;
var MAX_LONG = 1600;   // lange Kante des gespeicherten Fotos
var THUMB_W = 180;     // Breite des Vorschaubilds im Paket

var pack = null;         // bestehendes Paket (falls vorhanden)
var removed = {};        // ids, die entfernt werden sollen
var pending = [];        // neu hinzugefügte Fotos

var pwEl = document.getElementById('pw');
var pw2Wrap = document.getElementById('pw2-wrap');
var pw2El = document.getElementById('pw2');
var pwMsg = document.getElementById('pw-msg');
var listEl = document.getElementById('list');
var existingWrap = document.getElementById('existing-wrap');
var existingEl = document.getElementById('existing');
var msgEl = document.getElementById('msg');
var goBtn = document.getElementById('go');

/* ---------- Hilfen ---------- */
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
function randB64(n) { return bufToB64(crypto.getRandomValues(new Uint8Array(n))); }

function deriveKey(pw, saltB64, iterations) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey'])
    .then(function (base) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: b64ToBuf(saltB64), iterations: iterations, hash: 'SHA-256' },
        base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
}
function encryptBuf(key, buf) {
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, buf)
    .then(function (ct) { return { iv: bufToB64(iv), data: ct }; });
}
function download(blob, name) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 8000);
}

/* ---------- Bild verkleinern ---------- */
function shrink(file, maxLong, quality) {
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxLong / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(function (b) { res(b); }, 'image/jpeg', quality);
      };
      img.onerror = rej;
      img.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}
function shrinkWidth(file, width, quality) {
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, width / img.width);
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(function (b) { res(b); }, 'image/jpeg', quality);
      };
      img.onerror = rej;
      img.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

/* ---------- Bestehendes Paket laden ---------- */
fetch('photos/pack.json', { cache: 'no-cache' })
  .then(function (r) { return r.ok ? r.json() : null; })
  .catch(function () { return null; })
  .then(function (p) {
    pack = p;
    if (!pack) {
      pw2Wrap.hidden = false;
      pwMsg.textContent = 'Noch kein Fotopaket vorhanden — hier wird das Vereinspasswort festgelegt.';
      return;
    }
    pwMsg.textContent = (pack.items || []).length + ' Foto(s) im Paket. Passwort eingeben, um weitere hinzuzufügen.';
    document.getElementById('change-head').hidden = false;
    document.getElementById('change-wrap').hidden = false;
    renderExisting();
  });

function renderExisting() {
  if (!pack || !(pack.items || []).length) return;
  existingWrap.hidden = false;
  existingEl.innerHTML = '';
  pack.items.forEach(function (it) {
    var row = document.createElement('div');
    row.className = 'item';
    var name = document.createElement('div');
    name.style.flex = '1 1 auto';
    name.textContent = it.name || it.id;
    var rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'rm';
    rm.title = 'aus dem Paket entfernen';
    rm.textContent = removed[it.id] ? '↺' : '×';
    rm.addEventListener('click', function () {
      if (removed[it.id]) delete removed[it.id]; else removed[it.id] = true;
      renderExisting();
    });
    if (removed[it.id]) { name.style.opacity = '0.45'; name.style.textDecoration = 'line-through'; }
    row.appendChild(name); row.appendChild(rm);
    existingEl.appendChild(row);
  });
}

/* ---------- Neue Fotos annehmen ---------- */
var drop = document.getElementById('drop');
var fileEl = document.getElementById('file');
drop.addEventListener('click', function () { fileEl.click(); });
drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
drop.addEventListener('drop', function (e) {
  e.preventDefault(); drop.classList.remove('over');
  addFiles(e.dataTransfer.files);
});
fileEl.addEventListener('change', function () { addFiles(fileEl.files); fileEl.value = ''; });

function addFiles(files) {
  Array.prototype.forEach.call(files, function (f) {
    if (!/^image\//.test(f.type)) return;
    var entry = { file: f, name: f.name.replace(/\.[^.]+$/, '') };
    pending.push(entry);
    var fr = new FileReader();
    fr.onload = function () { entry.preview = fr.result; renderPending(); };
    fr.readAsDataURL(f);
  });
  renderPending();
}

function renderPending() {
  listEl.innerHTML = '';
  pending.forEach(function (entry, i) {
    var row = document.createElement('div');
    row.className = 'item';
    var img = document.createElement('img');
    img.src = entry.preview || '';
    var input = document.createElement('input');
    input.type = 'text';
    input.value = entry.name;
    input.placeholder = 'Beschreibung, z. B. Heimspiel Oktober';
    input.addEventListener('input', function () { entry.name = input.value; });
    var rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'rm';
    rm.textContent = '×';
    rm.addEventListener('click', function () { pending.splice(i, 1); renderPending(); });
    row.appendChild(img); row.appendChild(input); row.appendChild(rm);
    listEl.appendChild(row);
  });
}

/* ---------- Verschlüsseln & herunterladen ---------- */
goBtn.addEventListener('click', function () {
  var pw = pwEl.value;
  if (!pw) { msgEl.textContent = 'Bitte Passwort eingeben.'; return; }
  if (!pack && pw !== pw2El.value) { msgEl.textContent = 'Die beiden Passwörter stimmen nicht überein.'; return; }
  if (!pack && pw.length < 8) { msgEl.textContent = 'Bitte mindestens 8 Zeichen verwenden.'; return; }
  if (!pending.length && !Object.keys(removed).length) { msgEl.textContent = 'Keine Änderung — Fotos hinzufügen oder entfernen.'; return; }

  goBtn.disabled = true;
  msgEl.textContent = 'Verschlüssele …';

  var salt = pack ? pack.kdf.salt : randB64(16);
  var iterations = pack ? pack.kdf.iterations : ITER;
  var out = { v: 1, kdf: { salt: salt, iterations: iterations }, check: null, items: [] };
  var downloads = [];
  var key;

  deriveKey(pw, salt, iterations)
    .then(function (k) {
      key = k;
      if (!pack) return encryptBuf(key, new TextEncoder().encode('svh-ok')).then(function (c) {
        out.check = { iv: c.iv, data: bufToB64(c.data) };
      });
      /* Passwort gegen das bestehende Paket prüfen */
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(pack.check.iv) }, key, b64ToBuf(pack.check.data))
        .then(function (buf) {
          if (new TextDecoder().decode(buf) !== 'svh-ok') throw new Error('pw');
          out.check = pack.check;
          out.items = (pack.items || []).filter(function (it) { return !removed[it.id]; });
        })
        .catch(function () { throw new Error('Das Passwort passt nicht zum bestehenden Fotopaket.'); });
    })
    .then(function () {
      return pending.reduce(function (p, entry, i) {
        return p.then(function () {
          msgEl.textContent = 'Verschlüssele Foto ' + (i + 1) + ' von ' + pending.length + ' …';
          var id = 'p' + Date.now().toString(36) + i;
          return Promise.all([
            shrink(entry.file, MAX_LONG, 0.85),
            shrinkWidth(entry.file, THUMB_W, 0.7)
          ]).then(function (blobs) {
            return Promise.all([blobs[0].arrayBuffer(), blobs[1].arrayBuffer()]);
          }).then(function (bufs) {
            return Promise.all([encryptBuf(key, bufs[0]), encryptBuf(key, bufs[1])]);
          }).then(function (enc) {
            var fileName = id + '.json';
            downloads.push({
              blob: new Blob([JSON.stringify({ iv: enc[0].iv, data: bufToB64(enc[0].data) })], { type: 'application/json' }),
              name: fileName
            });
            out.items.push({
              id: id,
              name: entry.name || id,
              mime: 'image/jpeg',
              file: 'photos/' + fileName,
              thumb: { iv: enc[1].iv, data: bufToB64(enc[1].data) }
            });
          });
        });
      }, Promise.resolve());
    })
    .then(function () {
      downloads.push({ blob: new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }), name: 'pack.json' });
      return downloads.reduce(function (p, d) {
        return p.then(function () {
          download(d.blob, d.name);
          return new Promise(function (r) { setTimeout(r, 500); });
        });
      }, Promise.resolve());
    })
    .then(function () {
      msgEl.textContent = downloads.length + ' Datei(en) heruntergeladen.';
      document.getElementById('steps').hidden = false;
      pending = []; removed = {}; renderPending();
      goBtn.disabled = false;
    })
    .catch(function (e) {
      console.error(e);
      msgEl.textContent = e.message || 'Es hat nicht funktioniert.';
      goBtn.disabled = false;
    });
});


/* ---------- Passwort ändern: alles neu verschlüsseln ---------- */
var changeBtn = document.getElementById('change');
if (changeBtn) changeBtn.addEventListener('click', function () {
  var msg = document.getElementById('change-msg');
  var oldPw = document.getElementById('old-pw').value;
  var newPw = document.getElementById('new-pw').value;
  var newPw2 = document.getElementById('new-pw2').value;
  if (!pack) { msg.textContent = 'Es gibt noch kein Fotopaket.'; return; }
  if (!oldPw || !newPw) { msg.textContent = 'Bitte beide Passwörter eingeben.'; return; }
  if (newPw !== newPw2) { msg.textContent = 'Die neuen Passwörter stimmen nicht überein.'; return; }
  if (newPw.length < 8) { msg.textContent = 'Neues Passwort: mindestens 8 Zeichen.'; return; }
  if (newPw === oldPw) { msg.textContent = 'Das neue Passwort ist dasselbe wie das alte.'; return; }

  changeBtn.disabled = true;
  msg.textContent = 'Prüfe bisheriges Passwort …';

  var items = pack.items || [];
  var newSalt = randB64(16);
  var out = { v: 1, kdf: { salt: newSalt, iterations: ITER }, check: null, items: [] };
  var downloads = [];
  var oldKey, newKey;

  deriveKey(oldPw, pack.kdf.salt, pack.kdf.iterations)
    .then(function (k) {
      oldKey = k;
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(pack.check.iv) }, oldKey, b64ToBuf(pack.check.data))
        .then(function (buf) { if (new TextDecoder().decode(buf) !== 'svh-ok') throw new Error('pw'); })
        .catch(function () { throw new Error('Das bisherige Passwort stimmt nicht.'); });
    })
    .then(function () { return deriveKey(newPw, newSalt, ITER); })
    .then(function (k) {
      newKey = k;
      return encryptBuf(newKey, new TextEncoder().encode('svh-ok'))
        .then(function (c) { out.check = { iv: c.iv, data: bufToB64(c.data) }; });
    })
    .then(function () {
      return items.reduce(function (p, it, i) {
        return p.then(function () {
          msg.textContent = 'Verschlüssele Foto ' + (i + 1) + ' von ' + items.length + ' neu …';
          return fetch(it.file, { cache: 'no-cache' })
            .then(function (r) { if (!r.ok) throw new Error(it.file + ' fehlt im Repo'); return r.json(); })
            .then(function (j) {
              return Promise.all([
                crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(j.iv) }, oldKey, b64ToBuf(j.data)),
                crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(it.thumb.iv) }, oldKey, b64ToBuf(it.thumb.data))
              ]);
            })
            .then(function (plain) {
              return Promise.all([encryptBuf(newKey, plain[0]), encryptBuf(newKey, plain[1])]);
            })
            .then(function (enc) {
              var fileName = it.file.replace(/^photos\//, '');
              downloads.push({
                blob: new Blob([JSON.stringify({ iv: enc[0].iv, data: bufToB64(enc[0].data) })], { type: 'application/json' }),
                name: fileName
              });
              out.items.push({
                id: it.id, name: it.name, mime: it.mime || 'image/jpeg', file: it.file,
                thumb: { iv: enc[1].iv, data: bufToB64(enc[1].data) }
              });
            });
        });
      }, Promise.resolve());
    })
    .then(function () {
      downloads.push({ blob: new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }), name: 'pack.json' });
      return downloads.reduce(function (p, d) {
        return p.then(function () {
          download(d.blob, d.name);
          return new Promise(function (r) { setTimeout(r, 500); });
        });
      }, Promise.resolve());
    })
    .then(function () {
      msg.textContent = downloads.length + ' Datei(en) heruntergeladen — alle zusammen nach photos/ hochladen.';
      document.getElementById('steps').hidden = false;
      changeBtn.disabled = false;
    })
    .catch(function (e) {
      console.error(e);
      msg.textContent = e.message || 'Es hat nicht funktioniert.';
      changeBtn.disabled = false;
    });
});
