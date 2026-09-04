'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ACHIEVEMENTS, SIMPLE_TARGETS, PROFILE_TROPHY_APIS, mergeAchievementState } = require('../src/achievements');
const { mergeRows } = require('../src/steam-reader');
const { locateSteamApiDll, readLocalPlaytime } = require('../src/steam-local-reader');
const { discoverSaveFiles, parseTrophyTable } = require('../src/save-reader');

test('contains all 67 Days Gone achievements and 22 cumulative targets', () => {
  assert.equal(ACHIEVEMENTS.length, 67);
  assert.equal(Object.keys(SIMPLE_TARGETS).length, 22);
  assert.equal(new Set(ACHIEVEMENTS.map((item) => item.apiName)).size, 67);
  assert.equal(new Set(ACHIEVEMENTS.map((item) => item.statName)).size, 67);
  assert.equal(PROFILE_TROPHY_APIS.length, 66);
});

test('parses the 66-entry Days Gone profile trophy table', () => {
  const chunks = [Buffer.from([66, 0, 0, 0])];
  for (let index = 0; index < 66; index += 1) {
    const name = index === 0 ? 'Trophy.Bronze.CRW' : `Trophy.Test.${index}`;
    const encoded = Buffer.from(`${name}\0`);
    const header = Buffer.alloc(4); header.writeInt32LE(encoded.length);
    const values = Buffer.alloc(12);
    values.writeInt32LE(index, 0); values.writeInt32LE(100, 4); values.writeInt32LE(index === 65 ? 1 : 0, 8);
    chunks.push(header, encoded, values);
  }
  const trophies = parseTrophyTable(Buffer.concat(chunks));
  assert.equal(trophies.length, 66);
  assert.deepEqual(trophies[65], { index: 65, name: 'Trophy.Test.65', current: 65, target: 100, completed: true });
});

test('discovers profile and compressed saves below a Steam-ID folder', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'days-gone-saves-'));
  const saveFolder = path.join(root, 'BendGame', 'Saved', '76561198000000000', 'SaveGames');
  try {
    fs.mkdirSync(saveFolder, { recursive: true });
    fs.writeFileSync(path.join(saveFolder, 'slot01.sav'), Buffer.from('pmOc'));
    const result = discoverSaveFiles({ localAppData: root });
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].type, 'Manual slot');
    assert.equal(result.files[0].profileId, '76561198000000000');
    assert.equal(result.files[0].format, 'Days Gone compressed save');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('uses the exact DG1 stat and rejects unrelated values', () => {
  const definition = ACHIEVEMENTS.find((item) => item.apiName === 'DG1_ACH_26');
  const rows = mergeRows(ACHIEVEMENTS, [{
    apiName: definition.apiName,
    name: definition.name,
    description: definition.description,
    unlocked: false,
    stateSource: 'steam-local-api'
  }], 'steam-local-api', [
    { name: 'DG1_STAT_25', intValue: 999 },
    { name: 'DG1_STAT_26', intValue: 524 }
  ]);
  const result = rows.find((item) => item.apiName === definition.apiName);
  assert.equal(result.progress.current, 524);
  assert.equal(result.progress.target, 541);
  assert.equal(result.progress.statName, 'DG1_STAT_26');
});

test('unlocked cumulative achievements display their completed threshold', () => {
  const steam = mergeRows(ACHIEVEMENTS, [{ apiName: 'DG1_ACH_17', name: 'Farewell Drift', unlocked: true }], 'steam-local-api', []);
  const merged = mergeAchievementState(null, steam);
  const drift = merged.find((item) => item.apiName === 'DG1_ACH_17');
  assert.equal(drift.state, 'unlocked');
  assert.deepEqual([drift.displayProgress.current, drift.displayProgress.target], [10, 10]);
});

test('finds steam_api64.dll in a six-level Unreal Steamworks folder', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'days-gone-dll-'));
  const folder = path.join(root, 'Engine', 'Binaries', 'ThirdParty', 'Steamworks', 'Steamv139', 'Win64');
  const dll = path.join(folder, 'steam_api64.dll');
  try {
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(dll, 'fixture');
    assert.equal(locateSteamApiDll(root), dll);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('reads Days Gone playtime from Steam local config', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'days-gone-playtime-'));
  const accountId = 54321n;
  const steamId = (76561197960265728n + accountId).toString();
  const configDir = path.join(root, 'userdata', accountId.toString(), 'config');
  try {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'localconfig.vdf'), `"apps"\n{\n  "1259420"\n  {\n    "Playtime2" "4321"\n  }\n}`);
    assert.equal(readLocalPlaytime({ steamRoot: root, steamId }).minutes, 4321);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
