'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('daysGone', {
  getDashboard: () => ipcRenderer.invoke('dashboard:get'),
  refreshDashboard: () => ipcRenderer.invoke('dashboard:refresh'),
  openGameFolder: () => ipcRenderer.invoke('folder:open-game'),
  notifyReady: () => ipcRenderer.send('ui:ready'),
  onDashboardUpdated: () => () => {}
});
