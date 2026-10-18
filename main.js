// PrivatePDF desktop shell. Serves the bundled web app from a private app:// origin, so nothing is fetched from the internet.
const { app, BrowserWindow, protocol, shell, Menu } = require('electron');
const fs = require('fs'), path = require('path');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.wasm': 'application/wasm', '.gz': 'application/gzip', '.map': 'application/json' };
const ROOT = __dirname;
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

let win, pending = null;
const pdfArg = argv => argv.slice(1).find(a => /\.pdf$/i.test(a) && fs.existsSync(a));
function sendFile(file) {
  if (!file || !win) { pending = file || pending; return; }
  const data = fs.readFileSync(file);
  win.webContents.send('open-file', { name: path.basename(file), data });
}
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 720, minHeight: 520, backgroundColor: '#f6f7fb', title: 'PrivatePDF', icon: path.join(ROOT, 'icons', 'icon-512.png'), autoHideMenuBar: true,
    webPreferences: { preload: path.join(ROOT, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadURL('app://privatepdf/index.html');
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://privatepdf/')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  win.webContents.once('did-finish-load', () => { if (pending) { const f = pending; pending = null; setTimeout(() => sendFile(f), 400); } });
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', (e, argv) => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); const f = pdfArg(argv); if (f) sendFile(f); } });
  app.on('open-file', (e, f) => { e.preventDefault(); sendFile(f); });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    protocol.handle('app', req => {
      let p = decodeURIComponent(new URL(req.url).pathname); if (p === '/') p = '/index.html';
      const f = path.normalize(path.join(ROOT, p));
      if (!f.startsWith(ROOT + path.sep)) return new Response('Forbidden', { status: 403 });
      try { return new Response(fs.readFileSync(f), { headers: { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' } }); }
      catch { return new Response('Not found', { status: 404 }); }
    });
    pending = pdfArg(process.argv);
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
