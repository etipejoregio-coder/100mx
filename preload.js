const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (cfg) => ipcRenderer.invoke('config:save', cfg),
  pickFile: (kind) => ipcRenderer.invoke('file:pick', kind),
  fullscreen: () => ipcRenderer.invoke('win:fullscreen'),
  shutdown: () => ipcRenderer.invoke('pc:shutdown'),
  quit: () => ipcRenderer.invoke('app:quit')
});
