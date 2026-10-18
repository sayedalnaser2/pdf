const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', { isDesktop: true, onOpenFile: cb => ipcRenderer.on('open-file', (_, f) => cb(f)) });
