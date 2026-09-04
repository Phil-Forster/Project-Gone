'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('daysGoneSplash', {
  notifyVisualReady: () => ipcRenderer.send('splash:visual-ready'),
  onStatus: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('splash:status', handler);
    return () => ipcRenderer.removeListener('splash:status', handler);
  }
});
