import * as pdfjsLib from './vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
const { PDFDocument, StandardFonts, rgb, degrees, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList } = PDFLib;
const fieldKind = f => f instanceof PDFCheckBox ? 'check' : f instanceof PDFTextField ? 'text' : (f instanceof PDFDropdown || f instanceof PDFRadioGroup || f instanceof PDFOptionList) ? 'pick' : '';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => n > 1048576 ? (n / 1048576).toFixed(2) + ' MB' : (n / 1024).toFixed(1) + ' KB';
const readBytes = async f => new Uint8Array(await f.arrayBuffer());
const base = n => n.replace(/\.[^.]+$/, '');
const hex2rgb = h => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const stats = { total: 0 };
function bump(n) {
  stats.total += n;
  const b = $('#filecount'); if (b) b.textContent = `📂 ${stats.total} file${stats.total === 1 ? '' : 's'} added this session`;
}
const tick = () => new Promise(r => setTimeout(r, 0));

function toast(msg, err) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), err ? 6000 : 3000);
}
function busy(text, pct) {
  $('#busy').hidden = text === null;
  if (text !== null) { $('#busytext').textContent = text; $('#busybar').style.width = (pct ?? 0) * 100 + '%'; }
}
async function run(label, fn) {
  try { busy(label, 0); await tick(); return await fn(p => busy(label, p)); }
  catch (e) { console.error(e); toast(friendly(e), true); }
  finally { busy(null); }
}
function friendly(e) {
  const m = String(e && e.message || e);
  if (/encrypt/i.test(m)) return 'This PDF is password-protected. Remove the password first.';
  if (/password/i.test(m)) return 'This PDF needs a password.';
  if (/Invalid PDF|No PDF header|Failed to parse/i.test(m)) return 'This file does not look like a valid PDF.';
  return 'Something went wrong: ' + m;
}
function download(data, name, type = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
async function zipAndDownload(files, name, onp) {
  const z = new JSZip(); files.forEach(f => z.file(f.name, f.data));
  const blob = await z.generateAsync({ type: 'blob' }, m => onp && onp(m.percent / 100));
  download(blob, name, 'application/zip');
}
const loadLib = (bytes, opts = {}) => PDFDocument.load(bytes, { updateMetadata: false, ...opts });
async function openJs(bytes) {
  const task = pdfjsLib.getDocument({ data: bytes.slice() });
  task.onPassword = (cb, reason) => {
    const p = prompt(reason === 2 ? 'Wrong password. Try again:' : 'This PDF is password-protected. Enter password:');
    p === null ? task.destroy() : cb(p);
  };
  return task.promise;
}
async function renderCanvas(page, scale) {
  const vp = page.getViewport({ scale });
  const c = document.createElement('canvas');
  c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  return c;
}
const canvasBlob = (c, type = 'image/jpeg', q = .8) => new Promise(r => c.toBlob(r, type, q));
function parseRanges(str, n) {
  const out = [];
  for (const part of str.split(',').map(s => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/);
    let a, b;
    if (m) { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : n; }
    else if (/^\d+$/.test(part)) a = b = +part;
    else throw new Error(`Can't understand "${part}". Use e.g. 1-3, 5, 8-`);
    if (a < 1 || b > n || a > b) throw new Error(`Range "${part}" is outside 1–${n}`);
    const r = []; for (let i = a; i <= b; i++) r.push(i - 1); out.push(r);
  }
  if (!out.length) throw new Error('Enter at least one page range.');
  return out;
}

function dropzone({ accept, multiple, label, onFiles }) {
  const d = document.createElement('div');
  d.className = 'drop';
  d.innerHTML = `<b>${label}</b>or drop ${multiple ? 'files' : 'a file'} here<input type="file" hidden ${multiple ? 'multiple' : ''} accept="${accept}">`;
  const inp = $('input', d);
  const rx = new RegExp('(' + accept.split(',').map(a => a.trim().replace('.', '\\.').replace('/*', '/.*')).join('|') + ')$', 'i');
  const give = fs => { fs = [...fs].filter(f => rx.test(f.type) || rx.test(f.name)); if (!fs.length) return toast('Unsupported file type', true); const use = multiple ? fs : [fs[0]]; bump(use.length); onFiles(use); };
  d.onclick = () => inp.click();
  inp.onchange = () => { give(inp.files); inp.value = ''; };
  d.ondragover = e => { e.preventDefault(); d.classList.add('over'); };
  d.ondragleave = () => d.classList.remove('over');
  d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); give(e.dataTransfer.files); };
  return d;
}
function done(root, html) {
  let r = $('.result', root); if (!r) { r = document.createElement('div'); r.className = 'result'; root.append(r); }
  r.innerHTML = html; r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function reorderList(host, items, render, onChange) {
  host.innerHTML = '';
  if (items.length) {
    const tot = items.reduce((a, it) => a + (it.bytes ? it.bytes.length : it.size || 0), 0);
    const sm = document.createElement('div'); sm.className = 'note';
    sm.innerHTML = `<b>${items.length}</b> file${items.length === 1 ? '' : 's'} selected · ${fmt(tot)} total`; host.append(sm);
  }
  items.forEach((it, i) => {
    const row = document.createElement('div'); row.className = 'item';
    row.innerHTML = `<span class="nm">${render(it)}</span>
      <button data-a="up" ${i ? '' : 'disabled'}>↑</button><button data-a="dn" ${i < items.length - 1 ? '' : 'disabled'}>↓</button><button data-a="rm" class="danger">✕</button>`;
    row.onclick = e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'rm') items.splice(i, 1);
      else { const j = a === 'up' ? i - 1 : i + 1;[items[i], items[j]] = [items[j], items[i]]; }
      onChange();
    };
    host.append(row);
  });
}

/* ---------- tools ---------- */
const single = (root, label, onFile) => {
  root.append(dropzone({ accept: '.pdf,application/pdf', multiple: false, label, onFiles: ([f]) => onFile(f) }));
};
const panel = () => { const p = document.createElement('div'); p.className = 'panel'; return p; };

const tools = [];
const add = t => tools.push(t);

add({
  id: 'edit', icon: '✏️', title: 'Edit PDF', isNew: true,
  desc: 'Click existing text to edit it. Add text, images, signatures, highlights, shapes.',
  mount(root) { single(root, 'Choose a PDF to edit', f => editor(root, f, 'edit')); }
});

add({
  id: 'merge', icon: '🧩', title: 'Merge PDF', desc: 'Combine many PDFs into one. Reorder freely.',
  mount(root) {
    const files = []; const list = document.createElement('div'); list.className = 'list';
    const btn = Object.assign(document.createElement('button'), { className: 'primary', textContent: 'Merge PDFs', disabled: true });
    const redraw = () => { reorderList(list, files, f => `${esc(f.name)} <small>${f.pages} pages · ${fmt(f.bytes.length)}</small>`, redraw); btn.disabled = files.length < 2; };
    root.append(dropzone({
      accept: '.pdf,application/pdf', multiple: true, label: 'Select PDFs to merge', onFiles: async fs => {
        for (const f of fs) { try { const bytes = await readBytes(f); const d = await loadLib(bytes); files.push({ name: f.name, bytes, pages: d.getPageCount() }); } catch (e) { toast(f.name + ': ' + friendly(e), true); } }
        redraw();
      }
    }), list, btn);
    btn.onclick = () => run('Merging…', async prog => {
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const d = await loadLib(files[i].bytes);
        (await out.copyPages(d, d.getPageIndices())).forEach(p => out.addPage(p)); prog((i + 1) / files.length);
      }
      const bytes = await out.save(); download(bytes, 'merged.pdf');
      done(root, `✅ Merged ${files.length} files into <b>merged.pdf</b> (${out.getPageCount()} pages, ${fmt(bytes.length)}).`);
    });
  }
});

add({
  id: 'split', icon: '✂️', title: 'Split PDF', desc: 'Extract page ranges, split every N pages, or one file per page.',
  mount(root) {
    single(root, 'Choose a PDF to split', async f => {
      const bytes = await readBytes(f); let n;
      try { n = (await loadLib(bytes)).getPageCount(); } catch (e) { return toast(friendly(e), true); }
      const p = panel(); p.innerHTML = `<b>${esc(f.name)}</b> – ${n} pages
        <div class="row"><label class="f">Mode<select id="m"><option value="r">Custom ranges</option><option value="n">Every N pages</option><option value="p">Every page separately</option></select></label>
        <label class="f" id="rl">Ranges (each comma part → its own file)<input type="text" id="r" value="1-${Math.ceil(n / 2)}, ${Math.ceil(n / 2) + 1}-"></label>
        <label class="f" id="nl" hidden>N<input type="number" id="n" min="1" value="1" style="width:80px"></label>
        <label class="f" id="ml" ><span>&nbsp;</span><span><input type="checkbox" id="one"> Put all ranges in ONE file</span></label></div>
        <button class="primary" id="go">Split</button>`;
      root.innerHTML = ''; root.append(p);
      const m = $('#m', p); m.onchange = () => { $('#rl', p).hidden = m.value !== 'r'; $('#ml', p).hidden = m.value !== 'r'; $('#nl', p).hidden = m.value !== 'n'; };
      $('#go', p).onclick = () => run('Splitting…', async prog => {
        let groups;
        if (m.value === 'r') { groups = parseRanges($('#r', p).value, n); if ($('#one', p).checked) groups = [groups.flat()]; }
        else if (m.value === 'p') groups = Array.from({ length: n }, (_, i) => [i]);
        else { const k = Math.max(1, +$('#n', p).value | 0); groups = []; for (let i = 0; i < n; i += k) groups.push(Array.from({ length: Math.min(k, n - i) }, (_, j) => i + j)); }
        const src = await loadLib(bytes), outs = [];
        for (let g = 0; g < groups.length; g++) {
          const d = await PDFDocument.create(); (await d.copyPages(src, groups[g])).forEach(x => d.addPage(x));
          outs.push({ name: `${base(f.name)}_part${g + 1}.pdf`, data: await d.save() }); prog((g + 1) / groups.length);
        }
        if (outs.length === 1) download(outs[0].data, outs[0].name); else await zipAndDownload(outs, base(f.name) + '_split.zip');
        done(p, `✅ Created ${outs.length} file(s).`);
      });
    });
  }
});

add({
  id: 'organize', icon: '🗂️', title: 'Organize pages', desc: 'Reorder, rotate, delete, duplicate pages or insert blank ones.',
  mount(root) {
    single(root, 'Choose a PDF to organize', async f => {
      const bytes = await readBytes(f);
      const doc = await run('Loading…', () => openJs(bytes)); if (!doc) return;
      const thumbs = [];
      await run('Rendering thumbnails…', async prog => {
        for (let i = 1; i <= doc.numPages; i++) { thumbs.push((await renderCanvas(await doc.getPage(i), .35)).toDataURL()); prog(i / doc.numPages); }
      });
      let items = thumbs.map((t, i) => ({ src: i, rot: 0 }));
      const p = panel(); root.innerHTML = ''; root.append(p);
      const draw = () => {
        p.innerHTML = `<div class="row"><button id="blank">+ Blank page at end</button><button id="rev">Reverse order</button><span class="note">${items.length} pages</span></div>
        <div class="thumbs"></div><div class="row"><button class="primary" id="go">Save PDF</button></div>`;
        const g = $('.thumbs', p);
        items.forEach((it, i) => {
          const d = document.createElement('div'); d.className = 'thumb';
          d.innerHTML = `<div class="cv">${it.blank ? '<span class="note">blank</span>' : `<img src="${thumbs[it.src]}" style="transform:rotate(${it.rot}deg)">`}</div>
          <div class="note">${i + 1}</div><div class="acts"><button data-a="l" title="Move left">←</button><button data-a="r" title="Move right">→</button><button data-a="rot" title="Rotate">⟳</button><button data-a="dup" title="Duplicate">⧉</button><button data-a="del" class="danger" title="Delete">✕</button></div>`;
          d.onclick = e => {
            const a = e.target.dataset.a; if (!a) return;
            if (a === 'del') items.splice(i, 1);
            else if (a === 'dup') items.splice(i + 1, 0, { ...it });
            else if (a === 'rot') it.rot = (it.rot + 90) % 360;
            else { const j = a === 'l' ? i - 1 : i + 1; if (j < 0 || j >= items.length) return;[items[i], items[j]] = [items[j], items[i]]; }
            draw();
          };
          g.append(d);
        });
        $('#blank', p).onclick = () => { items.push({ blank: true, rot: 0 }); draw(); };
        $('#rev', p).onclick = () => { items.reverse(); draw(); };
        $('#go', p).onclick = () => run('Saving…', async prog => {
          if (!items.length) throw new Error('No pages left to save.');
          const src = await loadLib(bytes), out = await PDFDocument.create();
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it.blank) { const ref = items.find(x => !x.blank); const s = ref ? src.getPage(ref.src).getSize() : { width: 595, height: 842 }; out.addPage([s.width, s.height]); }
            else { const [pg] = await out.copyPages(src, [it.src]); pg.setRotation(degrees((pg.getRotation().angle + it.rot) % 360)); out.addPage(pg); }
            prog((i + 1) / items.length);
          }
          const b = await out.save(); download(b, base(f.name) + '_organized.pdf'); done(p, `✅ Saved ${items.length} pages (${fmt(b.length)}).`);
        });
      };
      draw();
    });
  }
});

add({
  id: 'compress', icon: '🗜️', title: 'Compress PDF', desc: 'Lossless optimize (keeps text) or strong image-based compression. Shows exact savings.',
  mount(root) {
    single(root, 'Choose a PDF to compress', async f => {
      const bytes = await readBytes(f);
      const p = panel(); root.innerHTML = ''; root.append(p);
      p.innerHTML = `<b>${esc(f.name)}</b> – ${fmt(bytes.length)}
      <div class="row"><label class="f">Method<select id="m">
        <option value="lossless">Lossless optimize – keeps selectable text & quality</option>
        <option value="light">Image-based – light (≈144 dpi, high quality)</option>
        <option value="bal">Image-based – balanced (≈100 dpi)</option>
        <option value="strong">Image-based – strong (≈72 dpi)</option></select></label></div>
      <p class="note">Image-based modes turn pages into pictures: smallest files, but text is no longer selectable. Use OCR afterwards to restore it.</p>
      <button class="primary" id="go">Compress</button>`;
      $('#go', p).onclick = () => run('Compressing…', async prog => {
        const m = $('#m', p).value; let out;
        if (m === 'lossless') { const d = await loadLib(bytes); out = await d.save({ useObjectStreams: true }); }
        else {
          const [s, q] = { light: [2, .8], bal: [1.4, .65], strong: [1, .5] }[m];
          const doc = await openJs(bytes), o = await PDFDocument.create();
          for (let i = 1; i <= doc.numPages; i++) {
            const pg = await doc.getPage(i), vp = pg.getViewport({ scale: 1 });
            const c = await renderCanvas(pg, s), img = await o.embedJpg(await (await canvasBlob(c, 'image/jpeg', q)).arrayBuffer());
            o.addPage([vp.width, vp.height]).drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height }); prog(i / doc.numPages);
          }
          out = await o.save();
        }
        if (out.length >= bytes.length) return done(p, `ℹ️ No saving possible with this method (${fmt(bytes.length)} → ${fmt(out.length)}), so nothing was downloaded. ${m === 'lossless' ? 'Try an image-based method.' : 'The file is already small or mostly text – try Lossless, or a stronger setting.'}`);
        download(out, base(f.name) + '_compressed.pdf');
        done(p, `✅ ${fmt(bytes.length)} → <b>${fmt(out.length)}</b> (${Math.round((1 - out.length / bytes.length) * 100)}% smaller)`);
      });
    });
  }
});

add({
  id: 'img2pdf', icon: '🖼️', title: 'Images → PDF', desc: 'Turn JPG, PNG, WebP, GIF, BMP images into one PDF.',
  mount(root) {
    const files = []; const list = document.createElement('div'); list.className = 'list';
    const opt = panel(); opt.innerHTML = `<div class="row"><label class="f">Page size<select id="sz"><option value="fit">Same as image</option><option value="a4">A4</option><option value="letter">US Letter</option></select></label>
      <label class="f">Margin (pt)<input type="number" id="mg" value="0" min="0" style="width:80px"></label></div>
      <button class="primary" id="go" disabled>Create PDF</button>`;
    const redraw = () => { reorderList(list, files, f => esc(f.name), redraw); $('#go', opt).disabled = !files.length; };
    root.append(dropzone({ accept: 'image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp', multiple: true, label: 'Select images', onFiles: fs => { files.push(...fs); redraw(); } }), list, opt);
    $('#go', opt).onclick = () => run('Creating PDF…', async prog => {
      const out = await PDFDocument.create(), sz = $('#sz', opt).value, mg = +$('#mg', opt).value || 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i]; let bytes = await readBytes(f), img;
        if (/jpe?g$/i.test(f.name) || f.type === 'image/jpeg') img = await out.embedJpg(bytes);
        else if (/png$/i.test(f.name) || f.type === 'image/png') img = await out.embedPng(bytes);
        else { const bm = await createImageBitmap(f), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0); img = await out.embedPng(await (await canvasBlob(c, 'image/png')).arrayBuffer()); }
        let W = img.width + mg * 2, H = img.height + mg * 2;
        if (sz !== 'fit') { [W, H] = sz === 'a4' ? [595.28, 841.89] : [612, 792]; if (img.width > img.height) [W, H] = [H, W]; }
        const k = Math.min((W - mg * 2) / img.width, (H - mg * 2) / img.height, sz === 'fit' ? 1 : Infinity), w = img.width * k, h = img.height * k;
        out.addPage([W, H]).drawImage(img, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h }); prog((i + 1) / files.length);
      }
      const b = await out.save(); download(b, 'images.pdf'); done(opt, `✅ Created images.pdf with ${files.length} pages (${fmt(b.length)}).`);
    });
  }
});

add({
  id: 'pdf2img', icon: '📸', title: 'PDF → Images', desc: 'Export every page as PNG or JPG at any resolution.',
  mount(root) {
    single(root, 'Choose a PDF to convert', async f => {
      const bytes = await readBytes(f); const p = panel(); root.innerHTML = ''; root.append(p);
      p.innerHTML = `<b>${esc(f.name)}</b><div class="row"><label class="f">Format<select id="fm"><option value="image/png">PNG (lossless)</option><option value="image/jpeg">JPG (smaller)</option></select></label>
        <label class="f">Resolution<select id="dp"><option value="1">72 dpi</option><option value="2" selected>144 dpi</option><option value="3">216 dpi</option><option value="4.17">300 dpi</option></select></label></div>
        <button class="primary" id="go">Convert</button>`;
      $('#go', p).onclick = () => run('Rendering…', async prog => {
        const doc = await openJs(bytes), type = $('#fm', p).value, ext = type === 'image/png' ? 'png' : 'jpg', outs = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const c = await renderCanvas(await doc.getPage(i), +$('#dp', p).value);
          outs.push({ name: `${base(f.name)}_page${i}.${ext}`, data: await canvasBlob(c, type, .92) }); prog(i / doc.numPages);
        }
        if (outs.length === 1) download(outs[0].data, outs[0].name, type); else await zipAndDownload(outs, base(f.name) + '_images.zip');
        done(p, `✅ Exported ${outs.length} image(s).`);
      });
    });
  }
});

add({
  id: 'watermark', icon: '💧', title: 'Watermark', desc: 'Stamp text across pages: DRAFT, CONFIDENTIAL, your name…',
  mount(root) {
    single(root, 'Choose a PDF', async f => {
      const bytes = await readBytes(f); const p = panel(); root.innerHTML = ''; root.append(p);
      p.innerHTML = `<b>${esc(f.name)}</b><div class="row"><label class="f">Text<input type="text" id="t" value="CONFIDENTIAL"></label>
        <label class="f">Size<input type="number" id="s" value="72" min="8" style="width:80px"></label>
        <label class="f">Angle<input type="number" id="a" value="45" style="width:80px"></label>
        <label class="f">Opacity %<input type="number" id="o" value="25" min="1" max="100" style="width:80px"></label>
        <label class="f">Colour<input type="color" id="c" value="#dc2626"></label></div><button class="primary" id="go">Apply watermark</button>`;
      $('#go', p).onclick = () => run('Applying…', async () => {
        const d = await loadLib(bytes), font = await d.embedFont(StandardFonts.HelveticaBold), txt = safe($('#t', p).value), size = +$('#s', p).value, ang = +$('#a', p).value * Math.PI / 180;
        const w = font.widthOfTextAtSize(txt, size), h = size * .35;
        for (const pg of d.getPages()) {
          const { width: W, height: H } = pg.getSize();
          pg.drawText(txt, { x: W / 2 - (w / 2 * Math.cos(ang) - h * Math.sin(ang)), y: H / 2 - (w / 2 * Math.sin(ang) + h * Math.cos(ang)), size, font, color: hex2rgb($('#c', p).value), opacity: +$('#o', p).value / 100, rotate: degrees(+$('#a', p).value) });
        }
        const b = await d.save(); download(b, base(f.name) + '_watermarked.pdf'); done(p, `✅ Done (${fmt(b.length)}).`);
      });
    });
  }
});
const safe = s => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');

add({
  id: 'pagenum', icon: '🔢', title: 'Page numbers', desc: 'Add page numbers with custom format, position and start.',
  mount(root) {
    single(root, 'Choose a PDF', async f => {
      const bytes = await readBytes(f); const p = panel(); root.innerHTML = ''; root.append(p);
      p.innerHTML = `<b>${esc(f.name)}</b><div class="row"><label class="f">Format<select id="f"><option>{n}</option><option>Page {n}</option><option>Page {n} of {total}</option><option>{n} / {total}</option></select></label>
        <label class="f">Position<select id="pos"><option value="bc">Bottom centre</option><option value="br">Bottom right</option><option value="bl">Bottom left</option><option value="tc">Top centre</option><option value="tr">Top right</option><option value="tl">Top left</option></select></label>
        <label class="f">Start at<input type="number" id="st" value="1" style="width:80px"></label>
        <label class="f">Size<input type="number" id="sz" value="11" style="width:70px"></label>
        <label class="f">&nbsp;<span><input type="checkbox" id="sk"> Skip first page</span></label></div><button class="primary" id="go">Add numbers</button>`;
      $('#go', p).onclick = () => run('Numbering…', async () => {
        const d = await loadLib(bytes), font = await d.embedFont(StandardFonts.Helvetica), pos = $('#pos', p).value, size = +$('#sz', p).value, pages = d.getPages();
        pages.forEach((pg, i) => {
          if (i === 0 && $('#sk', p).checked) return;
          const t = $('#f', p).value.replace('{n}', i + +$('#st', p).value - ($('#sk', p).checked ? 1 : 0)).replace('{total}', pages.length), w = font.widthOfTextAtSize(t, size), { width: W, height: H } = pg.getSize();
          const x = pos[1] === 'c' ? (W - w) / 2 : pos[1] === 'l' ? 36 : W - 36 - w, y = pos[0] === 'b' ? 28 : H - 28 - size;
          pg.drawText(t, { x, y, size, font, color: rgb(.15, .15, .15) });
        });
        const b = await d.save(); download(b, base(f.name) + '_numbered.pdf'); done(p, `✅ Done (${fmt(b.length)}).`);
      });
    });
  }
});

add({
  id: 'redact', icon: '⬛', title: 'Redact PDF', isNew: true,
  desc: 'Permanently black out text. Auto-find emails, phones or any text. Removes the underlying text for real.',
  mount(root) { single(root, 'Choose a PDF to redact', f => editor(root, f, 'redact')); }
});

add({
  id: 'ocr', icon: '🔍', title: 'OCR – make searchable', isNew: true,
  desc: 'Turn scanned PDFs into searchable, copyable PDFs. Free, no page limit, runs locally.',
  mount(root) {
    single(root, 'Choose a scanned PDF', async f => {
      const bytes = await readBytes(f); const p = panel(); root.innerHTML = ''; root.append(p);
      p.innerHTML = `<b>${esc(f.name)}</b><div class="row"><label class="f">Language<select id="l"><option value="eng">English</option><option value="spa">Spanish</option><option value="fra">French</option><option value="deu">German</option><option value="ita">Italian</option><option value="por">Portuguese</option><option value="nld">Dutch</option></select></label></div>
        <p class="note">The OCR engine and language data (~10 MB) are downloaded once from a CDN and cached; your document itself never leaves your device. Output text layer supports Latin characters.</p>
        <button class="primary" id="go">Run OCR</button>`;
      $('#go', p).onclick = () => run('Loading OCR engine…', async () => {
        await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
        const worker = await Tesseract.createWorker($('#l', p).value, 1, { logger: m => { if (m.status === 'recognizing text') busy(`OCR page ${cur}/${doc.numPages}…`, (cur - 1 + m.progress) / doc.numPages); else busy('Loading language data…', m.progress || 0); } });
        const doc = await openJs(bytes), out = await PDFDocument.create(), font = await out.embedFont(StandardFonts.Helvetica), S = 2; let cur = 1, all = '';
        for (; cur <= doc.numPages; cur++) {
          const pg = await doc.getPage(cur), vp = pg.getViewport({ scale: 1 }), c = await renderCanvas(pg, S);
          const { data } = await worker.recognize(c), img = await out.embedJpg(await (await canvasBlob(c, 'image/jpeg', .85)).arrayBuffer());
          const np = out.addPage([vp.width, vp.height]); np.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
          for (const w of data.words || []) {
            const t = safe(w.text); if (!t.trim()) continue; const h = (w.bbox.y1 - w.bbox.y0) / S;
            try { np.drawText(t, { x: w.bbox.x0 / S, y: vp.height - w.bbox.y1 / S + h * .2, size: Math.max(h * .85, 4), font, opacity: 0 }); } catch { }
          }
          all += `--- Page ${cur} ---\n${data.text}\n`;
        }
        await worker.terminate();
        const b = await out.save(); download(b, base(f.name) + '_ocr.pdf');
        done(p, `✅ Searchable PDF saved (${fmt(b.length)}). <button id="txt">Download extracted text (.txt)</button>`);
        $('#txt', p).onclick = () => download(all, base(f.name) + '.txt', 'text/plain');
      });
    });
  }
});
const loadLib_ = {};
function loadScript(src) {
  return loadLib_[src] ||= new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load OCR engine (are you offline?)')); document.head.append(s); });
}

add({
  id: 'metadata', icon: '🕵️', title: 'Metadata cleaner', isNew: true, desc: 'See and edit hidden author/title info, or strip it all before sharing.',
  mount(root) {
    single(root, 'Choose a PDF', async f => {
      const bytes = await readBytes(f); let d;
      try { d = await loadLib(bytes); } catch (e) { return toast(friendly(e), true); }
      const p = panel(); root.innerHTML = ''; root.append(p);
      const fields = [['Title', 'getTitle', 'setTitle'], ['Author', 'getAuthor', 'setAuthor'], ['Subject', 'getSubject', 'setSubject'], ['Creator', 'getCreator', 'setCreator'], ['Producer', 'getProducer', 'setProducer']];
      p.innerHTML = `<b>${esc(f.name)}</b><div class="row">${fields.map(([n, g]) => `<label class="f">${n}<input type="text" data-k="${n}" value="${esc(d[g]() || '')}"></label>`).join('')}</div>
        <label><input type="checkbox" id="strip"> Strip everything (blank all fields, remove keywords & dates)</label><br><br><button class="primary" id="go">Save PDF</button>`;
      $('#go', p).onclick = () => run('Saving…', async () => {
        const strip = $('#strip', p).checked;
        fields.forEach(([n, , s]) => d[s](strip ? '' : $(`[data-k=${n}]`, p).value));
        if (strip) { d.setKeywords([]); d.setCreationDate(new Date(0)); d.setModificationDate(new Date(0)); }
        const b = await d.save(); download(b, base(f.name) + '_clean.pdf'); done(p, `✅ Saved (${fmt(b.length)}).`);
      });
    });
  }
});

/* ---------- more tools ---------- */
const pdfTool = (id, icon, title, desc, label, build, extra = {}) => add({
  id, icon, title, desc, ...extra,
  mount(root) {
    single(root, label, async f => {
      const bytes = await readBytes(f); let d;
      try { d = await loadLib(bytes); } catch (e) { return toast(friendly(e), true); }
      const p = panel(); root.innerHTML = ''; root.append(p);
      p.innerHTML = `<b>${esc(f.name)}</b> – ${d.getPageCount()} pages` + build.html(d);
      const go = $('#go', p); if (!go) return;
      go.onclick = () => run('Working…', async prog => {
        const out = await build.apply({ p, d, bytes, f, prog, n: d.getPageCount() });
        if (!out) return;
        download(out.data, base(f.name) + out.suffix + '.pdf');
        done(p, `✅ Done (${fmt(out.data.length)}).${out.msg || ''}`);
      });
    });
  }
});

pdfTool('rotate', '🔄', 'Rotate PDF', 'Rotate all pages or just some, by 90°, 180° or 270°.', 'Choose a PDF to rotate', {
  html: () => `<div class="row"><label class="f">Angle<select id="ang"><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">90° counter-clockwise</option></select></label>
    <label class="f">Pages (blank = all)<input type="text" id="rg" placeholder="e.g. 1-3, 5"></label></div><button class="primary" id="go">Rotate</button>`,
  async apply({ p, d, n }) {
    const v = $('#rg', p).value.trim(), idx = new Set(v ? parseRanges(v, n).flat() : d.getPageIndices()), a = +$('#ang', p).value;
    d.getPages().forEach((pg, i) => idx.has(i) && pg.setRotation(degrees((pg.getRotation().angle + a) % 360)));
    return { data: await d.save(), suffix: '_rotated' };
  }
});

pdfTool('removepages', '🗑️', 'Remove pages', 'Delete unwanted pages by number or range.', 'Choose a PDF', {
  html: () => `<div class="row"><label class="f">Pages to delete<input type="text" id="rg" placeholder="e.g. 2, 4-6"></label></div><button class="primary" id="go">Delete pages</button>`,
  async apply({ p, d, n }) {
    const del = new Set(parseRanges($('#rg', p).value, n).flat());
    if (del.size >= n) throw new Error('You cannot delete every page.');
    [...del].sort((a, b) => b - a).forEach(i => d.removePage(i));
    return { data: await d.save(), suffix: '_trimmed', msg: ` ${del.size} page(s) removed.` };
  }
});

pdfTool('crop', '📐', 'Crop PDF', 'Trim margins from every page.', 'Choose a PDF to crop', {
  html: () => `<div class="row">${['top', 'right', 'bottom', 'left'].map(k => `<label class="f">${k} (pt)<input type="number" id="${k}" value="0" min="0" style="width:90px"></label>`).join('')}</div>
    <p class="note">72 points = 1 inch (≈ 25.4 mm).</p><button class="primary" id="go">Crop</button>`,
  async apply({ p, d }) {
    const m = k => +$('#' + k, p).value || 0;
    for (const pg of d.getPages()) {
      const { x, y, width, height } = pg.getMediaBox(), w = width - m('left') - m('right'), h = height - m('top') - m('bottom');
      if (w < 20 || h < 20) throw new Error('Margins are too large for this page size.');
      pg.setCropBox(x + m('left'), y + m('bottom'), w, h);
    }
    return { data: await d.save(), suffix: '_cropped' };
  }
});

pdfTool('headerfooter', '🏷️', 'Header & footer', 'Stamp text (title, date, company) at the top or bottom of every page.', 'Choose a PDF', {
  html: () => `<div class="row"><label class="f">Header<input type="text" id="h" placeholder="optional"></label><label class="f">Footer<input type="text" id="ft" placeholder="optional"></label>
    <label class="f">Size<input type="number" id="s" value="10" style="width:70px"></label><label class="f">Align<select id="al"><option value="c">Centre</option><option value="l">Left</option><option value="r">Right</option></select></label></div>
    <p class="note">Use {date} for today's date.</p><button class="primary" id="go">Apply</button>`,
  async apply({ p, d }) {
    const font = await d.embedFont(StandardFonts.Helvetica), size = +$('#s', p).value, al = $('#al', p).value, date = new Date().toLocaleDateString();
    for (const pg of d.getPages()) {
      const { width: W, height: H } = pg.getSize();
      for (const [id, y] of [['h', H - 28], ['ft', 20]]) {
        const t = safe($('#' + id, p).value.replace('{date}', date)); if (!t) continue; const w = font.widthOfTextAtSize(t, size);
        pg.drawText(t, { x: al === 'c' ? (W - w) / 2 : al === 'l' ? 36 : W - 36 - w, y, size, font, color: rgb(.2, .2, .2) });
      }
    }
    return { data: await d.save(), suffix: '_stamped' };
  }
});

pdfTool('forms', '📝', 'Fill PDF forms', 'Fill in form fields (text, checkboxes, dropdowns) and optionally lock them in.', 'Choose a fillable PDF', {
  html: d => {
    const fs = d.getForm().getFields();
    if (!fs.length) return `<p class="note">This PDF has no fillable form fields. Use <a href="#edit">Edit PDF</a> to type onto it instead.</p>`;
    return `<div class="row" style="align-items:flex-end">${fs.map((f, i) => {
      const t = fieldKind(f), nm = esc(f.getName());
      if (t === 'check') return `<label class="f"><span><input type="checkbox" data-i="${i}" ${f.isChecked() ? 'checked' : ''}> ${nm}</span></label>`;
      if (t === 'pick') { const sel = [].concat(f.getSelected ? f.getSelected() : []); return `<label class="f">${nm}<select data-i="${i}"><option value=""></option>${f.getOptions().map(o => `<option ${sel.includes(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`; }
      if (t === 'text') return `<label class="f">${nm}<input type="text" data-i="${i}" value="${esc(f.getText() || '')}"></label>`;
      return '';
    }).join('')}</div><label><input type="checkbox" id="flat"> Flatten (make fields non-editable)</label><br><br><button class="primary" id="go">Save filled PDF</button>`;
  },
  async apply({ p, d }) {
    const form = d.getForm(), fs = form.getFields(), font = await d.embedFont(StandardFonts.Helvetica);
    $$('[data-i]', p).forEach(el => {
      const f = fs[+el.dataset.i], t = fieldKind(f);
      if (t === 'check') el.checked ? f.check() : f.uncheck();
      else if (t === 'text') f.setText(safe(el.value));
      else if (el.value) f.select(el.value);
    });
    form.updateFieldAppearances(font);
    if ($('#flat', p).checked) form.flatten();
    return { data: await d.save(), suffix: '_filled' };
  }
});

add({
  id: 'text', icon: '📃', title: 'Extract text', desc: 'Copy or download all text from a PDF as .txt.',
  mount(root) {
    single(root, 'Choose a PDF', async f => {
      const bytes = await readBytes(f); const p = panel();
      const txt = await run('Extracting…', async prog => {
        const doc = await openJs(bytes); let all = '';
        for (let i = 1; i <= doc.numPages; i++) {
          const tc = await (await doc.getPage(i)).getTextContent(); let line = '';
          tc.items.forEach(it => { line += it.str + (it.hasEOL ? '\n' : ''); });
          all += `--- Page ${i} ---\n${line}\n\n`; prog(i / doc.numPages);
        } return all;
      }); if (txt === undefined) return;
      root.innerHTML = ''; root.append(p);
      const words = (txt.match(/\S+/g) || []).length;
      p.innerHTML = `<b>${esc(f.name)}</b> – ${words} words ${words < 5 ? '<p class="note">Almost no text found. This looks like a scan; try the OCR tool first.</p>' : ''}
        <textarea style="width:100%;height:260px;margin:10px 0" readonly></textarea><div class="row"><button class="primary" id="dl">Download .txt</button><button id="cp">Copy all</button></div>`;
      $('textarea', p).value = txt;
      $('#dl', p).onclick = () => download(txt, base(f.name) + '.txt', 'text/plain');
      $('#cp', p).onclick = () => navigator.clipboard.writeText(txt).then(() => toast('Copied'), () => toast('Select the text and copy manually', true));
    });
  }
});

add({
  id: 'grayscale', icon: '🌑', title: 'Grayscale PDF', desc: 'Convert colour pages to black & white for cheaper printing.',
  mount(root) {
    single(root, 'Choose a PDF', async f => {
      const bytes = await readBytes(f); const p = panel(); root.innerHTML = ''; root.append(p);
      p.innerHTML = `<b>${esc(f.name)}</b><p class="note">Pages are rendered at 144 dpi, so text is no longer selectable (use OCR to restore it).</p><button class="primary" id="go">Convert</button>`;
      $('#go', p).onclick = () => run('Converting…', async prog => {
        const doc = await openJs(bytes), o = await PDFDocument.create();
        for (let i = 1; i <= doc.numPages; i++) {
          const pg = await doc.getPage(i), v = pg.getViewport({ scale: 1 }), c = await renderCanvas(pg, 2), ctx = c.getContext('2d'), im = ctx.getImageData(0, 0, c.width, c.height), a = im.data;
          for (let k = 0; k < a.length; k += 4) a[k] = a[k + 1] = a[k + 2] = .299 * a[k] + .587 * a[k + 1] + .114 * a[k + 2];
          ctx.putImageData(im, 0, 0);
          const img = await o.embedJpg(await (await canvasBlob(c, 'image/jpeg', .8)).arrayBuffer());
          o.addPage([v.width, v.height]).drawImage(img, { x: 0, y: 0, width: v.width, height: v.height }); prog(i / doc.numPages);
        }
        const b = await o.save(); download(b, base(f.name) + '_gray.pdf'); done(p, `✅ ${fmt(bytes.length)} → ${fmt(b.length)}`);
      });
    });
  }
});

/* ---------- editor (edit + redact) ---------- */
async function editor(root, file, mode) {
  const bytes = await readBytes(file);
  const doc = await run('Loading…', () => openJs(bytes)); if (!doc) return;
  const S = 1.4; const redact = mode === 'redact';
  root.innerHTML = '';
  const tb = document.createElement('div'); tb.className = 'toolbar';
  const toolsDef = redact ? [['redact', '⬛ Box']] : [['edit', '✏️ Edit text'], ['text', 'T Add text'], ['white', '▭ Whiteout'], ['hl', '🖍 Highlight'], ['rect', '☐ Shape'], ['draw', '✍️ Draw / sign'], ['image', '🖼 Image'], ['select', '↖ Select']];
  tb.innerHTML = toolsDef.map(([k, l]) => `<button data-t="${k}">${l}</button>`).join('') + `<span class="sep"></span>
    ${redact ? `<input type="text" id="pat" placeholder="Find text / regex…" style="width:150px"><button id="find">Mark matches</button><select id="pre"><option value="">presets…</option><option value="[\\w.+-]+@[\\w-]+\\.[\\w.]+">Emails</option><option value="\\+?\\d[\\d\\s().-]{7,}\\d">Phone numbers</option><option value="\\b\\d{3}-\\d{2}-\\d{4}\\b">SSN</option><option value="\\b(?:\\d[ -]?){13,16}\\b">Card numbers</option></select>` :
      `<input type="color" id="col" value="#000000" title="Colour"><select id="fam"><option>Helvetica</option><option>Times</option><option>Courier</option></select><input type="number" id="fs" value="14" min="6" max="120" style="width:64px" title="Font size"><label class="note"><input type="checkbox" id="bold"> Bold</label>`}
    <span class="sep"></span><button id="undo">↶ Undo</button><button class="primary" id="save" style="padding:7px 18px">${redact ? 'Apply redactions' : 'Save PDF'}</button>`;
  const stage = document.createElement('div'); stage.className = 'pages';
  const hint = document.createElement('p'); hint.className = 'note';
  hint.textContent = redact ? 'Drag on a page to draw black boxes, or search to mark text. Applying flattens redacted pages into images so the hidden text is destroyed.' :
    '“Edit text”: click any existing text to change it. Drag objects to move, drag the corner to resize, ✕ to delete. Everything stays on your device. Note: edited-over text is only covered; use Redact for sensitive data.';
  root.append(tb, hint, stage);
  let tool = redact ? 'redact' : 'edit'; const objs = []; const pages = [];
  const setTool = t => { tool = t; $$('[data-t]', tb).forEach(b => b.classList.toggle('on', b.dataset.t === t)); pages.forEach(p => p.ov.className = 'ov t-' + t); };
  tb.onclick = e => { if (e.target.dataset.t) setTool(e.target.dataset.t); };
  const sty = () => ({ color: $('#col')?.value || '#000000', fam: $('#fam')?.value || 'Helvetica', fs: +$('#fs')?.value || 14, bold: $('#bold')?.checked });

  const select = o => { objs.forEach(x => x.el.classList.toggle('sel', x === o)); };
  function mkObj(pg, type, x, y, w, h, extra = {}) {
    const el = document.createElement('div'); el.className = 'obj ' + type;
    const o = { type, pg, x, y, w, h, el, ...extra };
    Object.assign(el.style, { left: x + 'px', top: y + 'px' });
    if (type !== 'txt') { el.style.width = w + 'px'; el.style.height = h + 'px'; }
    if (type === 'white') el.style.background = '#fff';
    if (type === 'hl') { el.style.background = '#ffe600'; el.style.opacity = .4; el.style.mixBlendMode = 'multiply'; }
    if (type === 'redact') { el.style.background = '#000'; }
    if (type === 'rect') el.style.border = `2px solid ${o.color}`;
    if (type === 'img') el.innerHTML = `<img src="${o.url}" style="width:100%;height:100%;display:block" draggable="false">`;
    if (type === 'ink') { el.style.pointerEvents = 'none'; }
    if (type === 'txt') {
      Object.assign(el.style, { fontSize: o.fs + 'px', color: o.color, fontFamily: o.fam === 'Times' ? 'Times New Roman,serif' : o.fam === 'Courier' ? 'Courier New,monospace' : 'Helvetica,Arial,sans-serif', fontWeight: o.bold ? 700 : 400 });
      el.contentEditable = true; el.spellcheck = false; el.textContent = o.text || '';
    }
    const x_ = document.createElement('span'); x_.className = 'x'; x_.textContent = '✕'; x_.contentEditable = false; x_.onclick = ev => { ev.stopPropagation(); rm(o); }; el.append(x_);
    if (['white', 'hl', 'rect', 'img', 'redact'].includes(type)) { const r = document.createElement('span'); r.className = 'rs'; el.append(r); r.onpointerdown = ev => { ev.stopPropagation(); ev.preventDefault(); const sx = ev.clientX, sy = ev.clientY, ow = o.w, oh = o.h; const mv = e2 => { o.w = Math.max(6, ow + e2.clientX - sx); o.h = Math.max(6, oh + e2.clientY - sy); el.style.width = o.w + 'px'; el.style.height = o.h + 'px'; }; const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); }; }
    el.onpointerdown = ev => {
      if (ev.target.classList.contains('x') || ev.target.classList.contains('rs') || type === 'ink') return;
      ev.stopPropagation(); select(o);
      if (type === 'txt' && document.activeElement === el) return; // editing caret
      const sx = ev.clientX, sy = ev.clientY, ox = o.x, oy = o.y; let moved = false;
      const mv = e2 => { if (Math.abs(e2.clientX - sx) + Math.abs(e2.clientY - sy) > 3) moved = true; if (!moved) return; if (type === 'txt') ev.preventDefault(); o.x = ox + e2.clientX - sx; o.y = oy + e2.clientY - sy; el.style.left = o.x + 'px'; el.style.top = o.y + 'px'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (!moved && type === 'txt') el.focus(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    };
    pg.ov.append(el); objs.push(o); return o;
  }
  const rm = o => { o.el.remove(); const i = objs.indexOf(o); if (i >= 0) objs.splice(i, 1); };
  $('#undo', tb).onclick = () => { const o = objs[objs.length - 1]; if (o) rm(o); };
  addEventListener('keydown', function kd(e) { if (!document.body.contains(tb)) return removeEventListener('keydown', kd); if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.target.isContentEditable) { e.preventDefault(); $('#undo', tb).click(); } });

  let imgData = null;
  await run('Rendering pages…', async prog => {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i), vp = page.getViewport({ scale: S }), c = await renderCanvas(page, S);
      const wrap = document.createElement('div'); wrap.className = 'pg'; wrap.style.width = vp.width + 'px'; wrap.style.height = vp.height + 'px';
      const ov = document.createElement('div'); ov.className = 'ov'; wrap.append(c, ov);
      wrap.insertAdjacentHTML('beforeend', `<span class="pnum">${i}</span>`);
      const pg = { i, page, vp, ov, wrap, text: null }; pages.push(pg); stage.append(wrap);
      ov.onpointerdown = e => onDown(e, pg); prog(i / doc.numPages);
    }
  });
  setTool(tool);

  async function onDown(e, pg) {
    if (e.target !== pg.ov) return;
    select(null); const r = pg.ov.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, st = sty();
    if (tool === 'text') { const o = mkObj(pg, 'txt', x, y - st.fs / 2, 0, 0, { text: 'Text', ...st }); o.el.focus(); document.getSelection().selectAllChildren(o.el); setTool('select'); return; }
    if (tool === 'edit') return editAt(pg, x, y, st);
    if (tool === 'image') { const f = await pickImage(); if (!f) return; const url = URL.createObjectURL(f), im = new Image(); im.src = url; await im.decode().catch(() => { }); const w = Math.min(220, im.width), h = w * im.height / im.width; mkObj(pg, 'img', x, y, w, h, { url, file: f }); setTool('select'); return; }
    if (['white', 'hl', 'rect', 'redact'].includes(tool)) {
      const o = mkObj(pg, tool, x, y, 1, 1, { color: st.color }); if (tool === 'hl') o.el.style.pointerEvents = 'none';
      const mv = e2 => { o.w = Math.max(1, e2.clientX - r.left - x); o.h = Math.max(1, e2.clientY - r.top - y); o.el.style.width = o.w + 'px'; o.el.style.height = o.h + 'px'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (o.w < 4 && o.h < 4) rm(o); else o.el.style.pointerEvents = ''; };
      addEventListener('pointermove', mv); addEventListener('pointerup', up); return;
    }
    if (tool === 'draw') {
      const pts = [[x, y]], ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'), path = document.createElementNS(ns, 'path');
      Object.assign(svg.style, { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' });
      path.setAttribute('fill', 'none'); path.setAttribute('stroke', st.color); path.setAttribute('stroke-width', 2.5); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
      svg.append(path); const o = { type: 'ink', pg, pts, color: st.color, el: svg }; pg.ov.append(svg); objs.push(o);
      const mv = e2 => { pts.push([e2.clientX - r.left, e2.clientY - r.top]); path.setAttribute('d', 'M' + pts.map(p => p.join(',')).join('L')); };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (pts.length < 2) rm(o); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    }
  }
  function pickImage() { return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/png,image/jpeg'; i.onchange = () => res(i.files[0]); i.click(); }); }
  async function textItems(pg) {
    if (!pg.text) { const tc = await pg.page.getTextContent(); pg.text = tc.items.filter(it => it.str && it.str.trim()).map(it => { const t = pdfjsLib.Util.transform(pg.vp.transform, it.transform), fs = Math.hypot(t[0], t[1]); return { str: it.str, x: t[4], y: t[5] - fs * .95, w: it.width * S, h: fs * 1.2, fs }; }); }
    return pg.text;
  }
  async function editAt(pg, x, y, st) {
    const hit = (await textItems(pg)).find(t => x >= t.x - 2 && x <= t.x + t.w + 2 && y >= t.y - 2 && y <= t.y + t.h + 2);
    if (!hit) return toast('No text here – use “Add text” to place new text.');
    mkObj(pg, 'white', hit.x - 1, hit.y, hit.w + 2, hit.h, {});
    const o = mkObj(pg, 'txt', hit.x, hit.y, 0, 0, { text: hit.str, color: st.color, fam: st.fam, fs: Math.round(hit.fs * 10) / 10 / 1, bold: st.bold });
    o.el.style.fontSize = hit.fs + 'px'; o.fs = hit.fs / S * S; o.el.focus();
  }
  if (redact) {
    $('#pre', tb).onchange = e => { $('#pat', tb).value = e.target.value; };
    $('#find', tb).onclick = () => run('Searching…', async () => {
      const q = $('#pat', tb).value; if (!q) return toast('Type text or pick a preset.', true);
      let rx; try { rx = new RegExp(q, 'gi'); } catch { rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); }
      let n = 0;
      for (const pg of pages) for (const t of await textItems(pg)) {
        rx.lastIndex = 0; let m; while ((m = rx.exec(t.str))) { if (!m[0]) { rx.lastIndex++; continue; } const cw = t.w / t.str.length; mkObj(pg, 'redact', t.x + m.index * cw - 1, t.y, m[0].length * cw + 2, t.h, {}); n++; }
      }
      toast(n ? `Marked ${n} match(es). Review them, then apply.` : 'No matches found.');
    });
  }

  $('#save', tb).onclick = () => run(redact ? 'Redacting…' : 'Saving…', async prog => {
    const real = objs.filter(o => o.type !== 'txt' || o.el.innerText.replace(/\u2715/g, '').trim());
    if (redact) {
      if (!real.length) throw new Error('Draw or mark at least one redaction box first.');
      const out = await PDFDocument.create(), src = await loadLib(bytes), hit = new Set(real.map(o => o.pg.i));
      for (const pg of pages) {
        if (!hit.has(pg.i)) { const [cp] = await out.copyPages(src, [pg.i - 1]); out.addPage(cp); }
        else {
          const R = 2, c = await renderCanvas(pg.page, R * 1), ctx = c.getContext('2d'); ctx.fillStyle = '#000';
          real.filter(o => o.pg === pg).forEach(o => ctx.fillRect(o.x / S * R, o.y / S * R, o.w / S * R, o.h / S * R));
          const v1 = pg.page.getViewport({ scale: 1 }), img = await out.embedJpg(await (await canvasBlob(c, 'image/jpeg', .9)).arrayBuffer());
          out.addPage([v1.width, v1.height]).drawImage(img, { x: 0, y: 0, width: v1.width, height: v1.height });
        }
        prog(pg.i / pages.length);
      }
      const b = await out.save(); download(b, base(file.name) + '_redacted.pdf');
      return done(root, `✅ Redacted ${real.length} area(s) on ${hit.size} page(s). Those pages are now flattened images, so the covered text is gone for good.`);
    }
    if (!real.length) throw new Error('Nothing to save yet – make some edits first.');
    const d = await loadLib(bytes), fonts = {};
    const font = async (fam, bold) => { const k = fam + bold; return fonts[k] ||= d.embedFont(StandardFonts[fam === 'Times' ? (bold ? 'TimesRomanBold' : 'TimesRoman') : fam === 'Courier' ? (bold ? 'CourierBold' : 'Courier') : (bold ? 'HelveticaBold' : 'Helvetica')]); };
    for (const o of real) {
      const page = d.getPage(o.pg.i - 1), H = page.getHeight(), px = o.x / S, py = H - o.y / S;
      if (o.type === 'white') page.drawRectangle({ x: px, y: py - o.h / S, width: o.w / S, height: o.h / S, color: rgb(1, 1, 1) });
      else if (o.type === 'hl') page.drawRectangle({ x: px, y: py - o.h / S, width: o.w / S, height: o.h / S, color: rgb(1, .9, 0), opacity: .4 });
      else if (o.type === 'rect') page.drawRectangle({ x: px, y: py - o.h / S, width: o.w / S, height: o.h / S, borderColor: hex2rgb(o.color), borderWidth: 1.5 });
      else if (o.type === 'img') { const b = new Uint8Array(await o.file.arrayBuffer()); const im = o.file.type === 'image/png' ? await d.embedPng(b) : await d.embedJpg(b); page.drawImage(im, { x: px, y: py - o.h / S, width: o.w / S, height: o.h / S }); }
      else if (o.type === 'ink') for (let i = 1; i < o.pts.length; i++) page.drawLine({ start: { x: o.pts[i - 1][0] / S, y: H - o.pts[i - 1][1] / S }, end: { x: o.pts[i][0] / S, y: H - o.pts[i][1] / S }, thickness: 1.6, color: hex2rgb(o.color), lineCap: 1 });
      else if (o.type === 'txt') {
        const f = await font(o.fam, o.bold), fs = (parseFloat(o.el.style.fontSize) || o.fs) / S, cs = getComputedStyle(o.el), lh = fs * 1.2;
        const left = parseFloat(o.el.style.left) / S, top = parseFloat(o.el.style.top) / S;
        safe(o.el.innerText.replace(/\u2715/g, '')).replace(/\n+$/, '').split('\n').forEach((ln, i) => page.drawText(ln, { x: left, y: H - top - fs * 1.03 - i * lh + (lh - fs * 1.2) / 2, size: fs, font: f, color: hex2rgb(rgb2hex(o.el.style.color)) }));
      }
    }
    const b = await d.save(); download(b, base(file.name) + '_edited.pdf'); toast(`Saved (${fmt(b.length)})`);
  });
}
function rgb2hex(c) { const m = c.match(/\d+/g); return m ? '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('') : (c || '#000000'); }

/* ---------- routing ---------- */
const app = $('#app');
function home() {
  document.title = 'PrivatePDF – Free PDF tools that never upload your files';
  app.innerHTML = `<h1>Every PDF tool. Zero uploads.</h1>
    <p class="sub">Edit, merge, split, compress, redact and OCR PDFs right in your browser. No file-size caps, no daily limits, no ads, no sign-up, no paywall.</p>
    <input type="search" class="search" placeholder="Search tools…" id="q" autofocus>
    <div class="grid" id="g"></div>
    <div class="why">
      <div><b>🔒 Private by design</b>Other sites upload your files to their servers. Here everything runs on your device – safe for contracts, IDs and medical records.</div>
      <div><b>♾️ No limits or paywalls</b>Big files, unlimited batches, OCR and redaction are all free. No “upgrade to continue”.</div>
      <div><b>✏️ Real text editing</b>Click existing text and change it directly, instead of covering it by hand.</div>
      <div><b>⚡ Fast & offline</b>No upload/download wait. Once loaded it keeps working without internet (except OCR's first-time language download).</div>
    </div>`;
  const g = $('#g'), draw = q => { g.innerHTML = tools.filter(t => (t.title + t.desc).toLowerCase().includes(q.toLowerCase())).map(t => `<a class="tool" href="#${t.id}"><div class="ic">${t.icon}</div><h3>${t.title}${t.isNew ? '<span class="new">NEW</span>' : ''}</h3><p>${t.desc}</p></a>`).join('') || '<p class="note">No matching tool.</p>'; };
  draw(''); $('#q').oninput = e => draw(e.target.value);
}
function route() {
  const id = location.hash.slice(1), t = tools.find(x => x.id === id);
  if (!t) return home();
  document.title = t.title + ' – PrivatePDF';
  app.innerHTML = `<a class="back" href="#">← All tools</a><h1 style="text-align:left;font-size:28px">${t.icon} ${t.title}</h1><p class="note">${t.desc}</p><div id="tool"></div>`;
  t.mount($('#tool'));
}
addEventListener('hashchange', route); route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
