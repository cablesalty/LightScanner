// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    openPearooPage: () => ipcRenderer.send('open-virustotal-results'),
    closednotif: () => ipcRenderer.send('closednotif')
});