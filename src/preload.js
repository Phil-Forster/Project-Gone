'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('daysGone', {
  getAppMeta: () => ipcRenderer.invoke('app:meta'),
  getDashboard: () => ipcRenderer.invoke('dashboard:get'),
  refreshDashboard: () => ipcRenderer.invoke('dashboard:refresh'),
  openGameFolder: () => ipcRenderer.invoke('folder:open-game'),
  openSaveFolder: () => ipcRenderer.invoke('folder:open-save'),
  selectSave: (key) => ipcRenderer.invoke('save:select', key),
  browseSaveFolder: () => ipcRenderer.invoke('save:browse'),
  notifyReady: () => ipcRenderer.send('ui:ready'),
  onDashboardUpdated: () => () => {}
});
