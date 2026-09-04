'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let splashWindow = null;
let splashFailSafe = null;
let dashboardRevealFallback = null;
let mainCreateFallback = null;
let cachedDashboard = null;

const STEAM_CACHE_TTL_MS = 60_000;
const APP_USER_MODEL_ID = 'uk.co.philforster.daysgoneachievementtracker';
const APP_ICON = path.join(__dirname, '..', 'build', 'icon.png');

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 900, height: 600, resizable: false, movable: true, frame: false,
    transparent: true, backgroundColor: '#00000000', show: false, alwaysOnTop: true,
    skipTaskbar: true, hasShadow: false, paintWhenInitiallyHidden: true,
    webPreferences: { preload: path.join(__dirname, 'splash-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  let mainStarted = false;
  const startMain = () => {
    if (mainStarted) return;
    mainStarted = true;
    if (mainCreateFallback) clearTimeout(mainCreateFallback);
    setImmediate(() => { createWindow(); splashFailSafe = setTimeout(revealMainWindow, 20_000); });
  };
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.show(); splashWindow.focus(); }
    startMain();
  });
  splashWindow.webContents.once('did-fail-load', startMain);
  mainCreateFallback = setTimeout(startMain, 1500);
  splashWindow.on('closed', () => { splashWindow = null; });
}

function updateSplashStatus(label, progress) {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  splashWindow.webContents.send('splash:status', {
    label: typeof label === 'string' ? label : '',
    progress: Number.isFinite(Number(progress)) ? Math.max(0, Math.min(100, Number(progress))) : null
  });
}

function revealMainWindow() {
  if (splashFailSafe) clearTimeout(splashFailSafe);
  if (dashboardRevealFallback) clearTimeout(dashboardRevealFallback);
  if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); }
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
}

function scheduleMainReveal(delayMs = 700) {
  if (dashboardRevealFallback) clearTimeout(dashboardRevealFallback);
  dashboardRevealFallback = setTimeout(revealMainWindow, delayMs);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1460, height: 940, minWidth: 1080, minHeight: 720,
    backgroundColor: '#10110f', icon: fs.existsSync(APP_ICON) ? APP_ICON : undefined, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault();
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => {
    updateSplashStatus(`Dashboard failed to load (${code}): ${description}`, 100);
    scheduleMainReveal(250);
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

async function buildDashboard({ force = false, onStatus = null } = {}) {
  const report = typeof onStatus === 'function' ? onStatus : () => {};
  if (!force && cachedDashboard && Date.now() - cachedDashboard.fetchedAt < STEAM_CACHE_TTL_MS) return cachedDashboard.data;
  report('Finding Days Gone and Steam…', 18);
  const { fetchSteamAchievements } = require('./steam-reader');
  const { mergeAchievementState } = require('./achievements');
  report('Reading Steam achievement state…', 46);
  const steam = await fetchSteamAchievements();
  report('Mapping achievement counters…', 78);
  const achievements = mergeAchievementState(null, steam.achievements || []);
  const data = {
    ok: true,
    appId: '1259420',
    gamePath: steam.local?.gamePath || null,
    steamId: steam.steamId || null,
    personaName: steam.account?.personaName || null,
    steam,
    achievements
  };
  report('Preparing dashboard…', 96);
  cachedDashboard = { fetchedAt: Date.now(), data };
  return data;
}

ipcMain.handle('dashboard:get', async () => {
  const data = await buildDashboard({ onStatus: updateSplashStatus });
  updateSplashStatus('Rendering dashboard…', 98);
  scheduleMainReveal(900);
  return data;
});
ipcMain.handle('dashboard:refresh', async () => buildDashboard({ force: true }));
ipcMain.on('ui:ready', (event) => {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) return;
  updateSplashStatus('Ready', 100);
  setTimeout(revealMainWindow, 180);
});
ipcMain.handle('folder:open-game', async () => {
  const gamePath = cachedDashboard?.data?.gamePath;
  if (gamePath && fs.existsSync(gamePath)) {
    const error = await shell.openPath(gamePath);
    return { ok: error === '', error: error || null };
  }
  return { ok: false, error: 'Days Gone installation folder is not currently available.' };
});

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) app.quit();
else {
  app.on('second-instance', () => {
    const window = mainWindow && !mainWindow.isDestroyed() ? mainWindow : splashWindow;
    if (window && !window.isDestroyed()) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); }
  });
  app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId(APP_USER_MODEL_ID);
    createSplashWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createSplashWindow(); });
  });
  app.on('before-quit', () => {
    if (splashFailSafe) clearTimeout(splashFailSafe);
    if (dashboardRevealFallback) clearTimeout(dashboardRevealFallback);
    if (mainCreateFallback) clearTimeout(mainCreateFallback);
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
