'use strict';

const fs = require('fs');
const path = require('path');

const SAVE_EXT = '.sav';
const MAX_SCAN_DEPTH = 4;
const MAX_FILES = 250;

function readFString(buffer, state) {
  if (state.offset + 4 > buffer.length) throw new Error('Unexpected end of GVAS string.');
  const length = buffer.readInt32LE(state.offset);
  state.offset += 4;
  if (length === 0) return '';
  const bytes = length < 0 ? Math.abs(length) * 2 : length;
  if (bytes > 1024 * 1024 || state.offset + bytes > buffer.length) throw new Error('Invalid GVAS string length.');
  const value = length < 0
    ? buffer.subarray(state.offset, state.offset + bytes - 2).toString('utf16le')
    : buffer.subarray(state.offset, state.offset + bytes - 1).toString('utf8');
  state.offset += bytes;
  return value;
}

function ticksToIso(ticks) {
  try {
    const unixEpochTicks = 621355968000000000n;
    const millis = Number((ticks - unixEpochTicks) / 10000n);
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  } catch (_) {
    return null;
  }
}

function parseTrophyTable(buffer) {
  const marker = Buffer.from('Trophy.Bronze.CRW\0', 'utf8');
  const firstNameOffset = buffer.indexOf(marker);
  if (firstNameOffset < 8) return [];
  const countOffset = firstNameOffset - 8;
  const count = buffer.readInt32LE(countOffset);
  if (count < 1 || count > 200) return [];
  const state = { offset: countOffset + 4 };
  const trophies = [];
  try {
    for (let index = 0; index < count; index += 1) {
      const name = readFString(buffer, state);
      if (!name.startsWith('Trophy.') || state.offset + 12 > buffer.length) return [];
      const current = buffer.readInt32LE(state.offset); state.offset += 4;
      const target = buffer.readInt32LE(state.offset); state.offset += 4;
      const completed = buffer.readInt32LE(state.offset); state.offset += 4;
      trophies.push({ index, name, current, target, completed: completed === 1 });
    }
    return state.offset === buffer.length ? trophies : [];
  } catch (_) {
    return [];
  }
}

function parseProfileGvas(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 48 || buffer.subarray(0, 4).toString('ascii') !== 'GVAS') return null;
  const state = { offset: 4 };
  try {
    const saveGameVersion = buffer.readInt32LE(state.offset); state.offset += 4;
    const packageVersion = buffer.readInt32LE(state.offset); state.offset += 4;
    state.offset += 10; // Engine major/minor/patch (uint16) and changelist (uint32).
    const engineBranch = readFString(buffer, state);
    // Days Gone's profile uses the legacy SaveGame header and writes the
    // SaveGame class immediately after the engine branch (no custom-version
    // container is present in the supplied/current profile format).
    const saveClass = readFString(buffer, state);
    const properties = {};

    while (state.offset < buffer.length) {
      const name = readFString(buffer, state);
      if (!name || name === 'None') break;
      const type = readFString(buffer, state);
      if (state.offset + 8 > buffer.length) break;
      const size = Number(buffer.readBigInt64LE(state.offset)); state.offset += 8;
      if (size < 0 || size > buffer.length) break;

      let metadataValue = null;
      if (type === 'BoolProperty') {
        metadataValue = Boolean(buffer.readUInt8(state.offset)); state.offset += 1;
      } else if (type === 'StructProperty') {
        readFString(buffer, state);
        state.offset += 16;
      } else if (type === 'ArrayProperty' || type === 'SetProperty') {
        readFString(buffer, state);
      } else if (type === 'MapProperty') {
        readFString(buffer, state);
        readFString(buffer, state);
      } else if (type === 'ByteProperty' || type === 'EnumProperty') {
        readFString(buffer, state);
      }

      if (state.offset + size > buffer.length) break;
      const valueOffset = state.offset;
      if (type === 'BoolProperty') properties[name] = metadataValue;
      else if (type === 'IntProperty' && size === 4) properties[name] = buffer.readInt32LE(valueOffset);
      else if (type === 'Int64Property' && size === 8) properties[name] = Number(buffer.readBigInt64LE(valueOffset));
      else if (type === 'FloatProperty' && size === 4) properties[name] = buffer.readFloatLE(valueOffset);
      else if (type === 'DoubleProperty' && size === 8) properties[name] = buffer.readDoubleLE(valueOffset);
      else if (type === 'StructProperty' && name === 'SaveDateTime' && size === 8) {
        properties[name] = ticksToIso(buffer.readBigInt64LE(valueOffset));
      }
      state.offset += size;
    }

    return { saveGameVersion, packageVersion, engineBranch, saveClass, properties, trophies: parseTrophyTable(buffer) };
  } catch (_) {
    return null;
  }
}

function classifySave(name) {
  const lower = name.toLowerCase();
  if (lower === 'profile.sav') return 'Profile';
  if (lower.startsWith('autosave')) return 'Autosave';
  if (lower.startsWith('slot')) return 'Manual slot';
  if (lower === 'checkpoint.sav') return 'Checkpoint';
  if (lower === 'missionstart.sav') return 'Mission start';
  return 'Save';
}

function collectSaveFiles(root, output, depth = 0) {
  if (!root || depth > MAX_SCAN_DEPTH || output.length >= MAX_FILES) return;
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch (_) { return; }
  for (const entry of entries) {
    if (output.length >= MAX_FILES) break;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) collectSaveFiles(fullPath, output, depth + 1);
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === SAVE_EXT) output.push(fullPath);
  }
}

function saveDescriptor(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const name = path.basename(filePath);
    const parent = path.dirname(filePath);
    const profileCandidate = path.basename(path.dirname(parent));
    const profileId = /^\d{10,20}$/.test(profileCandidate) ? profileCandidate : null;
    let format = 'Unknown';
    let profile = null;
    const handle = fs.openSync(filePath, 'r');
    try {
      const header = Buffer.alloc(Math.min(stat.size, name.toLowerCase() === 'profile.sav' ? 256 * 1024 : 16));
      fs.readSync(handle, header, 0, header.length, 0);
      const magic = header.subarray(0, 4).toString('ascii');
      if (magic === 'GVAS') { format = 'Unreal GVAS'; profile = parseProfileGvas(header); }
      else if (magic === 'pmOc') format = 'Days Gone compressed save';
    } finally { fs.closeSync(handle); }
    return {
      key: path.resolve(filePath), path: path.resolve(filePath), folder: parent, name,
      type: classifySave(name), profileId, size: stat.size, modifiedAt: stat.mtime.toISOString(),
      format, profile
    };
  } catch (_) {
    return null;
  }
}

function discoverSaveFiles({ localAppData = process.env.LOCALAPPDATA, manualRoot = null, selectedPath = null } = {}) {
  const roots = [];
  if (localAppData) roots.push(path.join(localAppData, 'BendGame', 'Saved'));
  if (manualRoot) roots.push(path.resolve(manualRoot));
  const uniqueRoots = [...new Set(roots.filter((root) => {
    try { return fs.statSync(root).isDirectory(); } catch (_) { return false; }
  }))];
  const found = [];
  for (const root of uniqueRoots) collectSaveFiles(root, found);
  const files = [...new Set(found.map((item) => path.resolve(item)))]
    .map(saveDescriptor).filter(Boolean)
    .sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt) || a.name.localeCompare(b.name));
  const selected = selectedPath ? files.find((item) => item.key.toLowerCase() === path.resolve(selectedPath).toLowerCase()) || null : null;
  return { available: files.length > 0, roots: uniqueRoots, files, selected };
}

function selectedSaveEvidence(selected, achievement) {
  if (!selected) return { available: false, summary: 'No save selected. Steam remains the only active achievement source.', details: [] };
  const details = [
    { label: 'Selected file', value: selected.name },
    { label: 'Save type', value: selected.type },
    { label: 'Last written', value: selected.modifiedAt },
    { label: 'Format', value: selected.format }
  ];
  const properties = selected.profile?.properties || {};
  const trophy = Number.isInteger(achievement?.trophyIndex)
    ? selected.profile?.trophies?.[achievement.trophyIndex]
    : null;
  const targetMatches = !achievement?.target || trophy?.target === 0 || Number(achievement.target) === trophy?.target;
  if (trophy && targetMatches) {
    details.push({ label: 'Internal trophy', value: trophy.name });
    if (trophy.target > 0) details.push({ label: 'Save counter', value: `${trophy.current.toLocaleString('en-GB')} / ${trophy.target.toLocaleString('en-GB')}` });
    details.push({ label: 'Save completion flag', value: trophy.completed ? 'Complete' : 'Not complete' });
    return {
      available: true,
      summary: trophy.target > 0
        ? `The selected profile records ${trophy.current.toLocaleString('en-GB')} / ${trophy.target.toLocaleString('en-GB')} and marks this trophy ${trophy.completed ? 'complete' : 'not complete'}. Steam remains authoritative.`
        : `The selected profile marks this trophy ${trophy.completed ? 'complete' : 'not complete'}. Steam remains authoritative.`,
      details,
      trophy
    };
  }
  if (properties.SaveDateTime) details.push({ label: 'Internal save time', value: properties.SaveDateTime });
  if (achievement?.apiName === 'DG1_ACH_58' && typeof properties.HasBeatenGameOnHardMode === 'boolean') {
    details.push({ label: 'Profile hard-mode flag', value: properties.HasBeatenGameOnHardMode ? 'Yes' : 'No' });
    return {
      available: true,
      summary: 'The selected profile exposes a hard-mode completion flag. This is supporting context only; it does not prove the New Game+ difficulty achievement.',
      details
    };
  }
  return {
    available: true,
    summary: 'The selected save supplies file context, but no verified field in this file is mapped to this achievement. Steam still decides completion.',
    details
  };
}

module.exports = { classifySave, discoverSaveFiles, parseProfileGvas, parseTrophyTable, selectedSaveEvidence };
