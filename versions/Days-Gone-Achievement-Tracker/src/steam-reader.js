'use strict';

const { ACHIEVEMENTS, normalizeName } = require('./achievements');
const { readLocalSteamAchievements, discoverSteamAccount } = require('./steam-local-reader');
const { version: APP_VERSION } = require('../package.json');

const APP_ID = '1259420';
const GLOBAL_URL = `https://steamcommunity.com/stats/${APP_ID}/achievements/?l=english`;
const STEAM_HTTP_TIMEOUT_MS = 8_000;

function decodeHtml(value = '') {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtml(value = '') {
  return decodeHtml(value.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizeIconUrl(value = '') {
  const decoded = decodeHtml(value.trim());
  if (decoded.startsWith('//')) return `https:${decoded}`;
  if (/^https?:\/\//i.test(decoded)) return decoded.replace(/^http:/i, 'https:');
  return null;
}

function achievementBlocks(html) {
  const starts = [...html.matchAll(/<div\b[^>]*class=["'][^"']*\bachieveRow\b[^"']*["'][^>]*>/gi)].map((match) => match.index);
  return starts.map((start, index) => html.slice(start, starts[index + 1] ?? html.length));
}

function extractAchievementRows(html, { playerPage = true } = {}) {
  const rows = [];
  for (const block of achievementBlocks(html)) {
    const nameMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (!nameMatch) continue;
    const name = stripHtml(nameMatch[1]);
    if (!name) continue;
    const descriptionMatch = block.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i);
    const unlockMatch = block.match(/class=["'][^"']*achieveUnlockTime[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const rowClasses = block.match(/^<div\b[^>]*class=["']([^"']*)["']/i)?.[1] || '';
    const images = [...block.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
      .map((match) => normalizeIconUrl(match[1])).filter(Boolean);
    let unlocked = null;
    if (playerPage) {
      if (/\bdisabled\b|\blocked\b/i.test(rowClasses)) unlocked = false;
      else if (unlockMatch) unlocked = true;
    }
    rows.push({
      name, normalizedName: normalizeName(name),
      description: descriptionMatch ? stripHtml(descriptionMatch[1]) : '',
      iconUrl: images.find((url) => url.includes(`/images/apps/${APP_ID}/`)) || images[0] || null,
      unlocked, unlockedAt: unlockMatch ? stripHtml(unlockMatch[1]) : null,
      stateSource: playerPage ? 'steam-community' : 'steam-global'
    });
  }
  return rows;
}

function staticMetadata() {
  return ACHIEVEMENTS.map((item) => ({ ...item, normalizedName: normalizeName(item.name), iconUrl: null }));
}

function statValue(stat) {
  if (Number.isFinite(Number(stat?.intValue))) return Number(stat.intValue);
  if (Number.isFinite(Number(stat?.floatValue))) return Number(stat.floatValue);
  return null;
}

function exactProgress(definition, row, allStats) {
  if (!Number.isFinite(definition.target) || definition.target <= 1) return null;
  if (row?.unlocked === true) return {
    current: definition.target, target: definition.target, text: `${definition.target} / ${definition.target}`,
    source: 'steam-achievement-limit', statName: definition.statName, confidence: 'authoritative-complete'
  };
  if (row?.unlocked !== false) return null;
  const stat = allStats.find((candidate) => candidate.name === definition.statName);
  const current = statValue(stat);
  if (!Number.isFinite(current) || current < 0) return null;
  const clamped = Math.min(current, definition.target);
  return {
    current: clamped, target: definition.target, text: `${clamped} / ${definition.target}`,
    source: 'steam-local-stat', statName: definition.statName, statType: stat.type,
    match: 'schema-exact', confidence: 'steam-local'
  };
}

function mergeRows(metadataRows, playerRows, playerSource = null, localStats = []) {
  const metaByName = new Map(metadataRows.map((item) => [normalizeName(item.name), item]));
  const playerByApi = new Map(playerRows.filter((item) => item.apiName).map((item) => [item.apiName, item]));
  const playerByName = new Map(playerRows.map((item) => [normalizeName(item.name), item]));

  return ACHIEVEMENTS.map((definition) => {
    const meta = metaByName.get(normalizeName(definition.name)) || {};
    const player = playerByApi.get(definition.apiName) || playerByName.get(normalizeName(definition.name)) || {};
    return {
      ...definition,
      description: player.description || meta.description || definition.description,
      iconUrl: player.iconUrl || meta.iconUrl || null,
      unlocked: typeof player.unlocked === 'boolean' ? player.unlocked : null,
      unlockedAt: player.unlockedAt || null,
      progress: exactProgress(definition, player, localStats),
      stateSource: typeof player.unlocked === 'boolean' ? (player.stateSource || playerSource) : null
    };
  });
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STEAM_HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': `Days-Gone-Achievement-Tracker/${APP_VERSION}`, 'Accept-Language': 'en-GB,en;q=0.9' },
      redirect: 'follow', signal: controller.signal
    });
    if (!response.ok) throw new Error(`Steam returned HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Steam request timed out.');
    throw error;
  } finally { clearTimeout(timeout); }
}

async function fetchGlobalMetadata() {
  try {
    const rows = extractAchievementRows(await fetchText(GLOBAL_URL), { playerPage: false });
    return { ok: rows.length > 0, achievements: rows.length ? rows : staticMetadata(), count: rows.length };
  } catch (error) {
    return { ok: false, achievements: staticMetadata(), count: 0, error: error.message };
  }
}

async function fetchCommunityPlayerRows(steamId) {
  if (!/^\d{10,20}$/.test(String(steamId || ''))) return { ok: false, rows: [], error: 'No Steam account ID was available for Community fallback.' };
  const urls = [
    `https://steamcommunity.com/profiles/${steamId}/stats/${APP_ID}/achievements/?l=english`,
    `https://steamcommunity.com/profiles/${steamId}/stats/${APP_ID}/?tab=achievements&l=english`
  ];
  let lastError = null;
  for (const url of urls) {
    try {
      const html = await fetchText(url);
      const rows = extractAchievementRows(html, { playerPage: true });
      if (rows.some((item) => typeof item.unlocked === 'boolean')) return { ok: true, rows, url };
      lastError = /profile is private|game details are private/i.test(html)
        ? 'Steam profile or Game details privacy prevents Community fallback.'
        : 'Steam Community did not expose reliable achievement rows.';
    } catch (error) { lastError = error.message; }
  }
  return { ok: false, rows: [], error: lastError || 'Steam Community achievement state could not be read.' };
}

async function fetchSteamAchievements() {
  const metadataPromise = fetchGlobalMetadata();
  const account = discoverSteamAccount();
  const local = readLocalSteamAchievements(account.steamId || '');
  const metadata = await metadataPromise;
  const steamId = local.actualSteamId || account.steamId || null;

  let playerRows = [];
  let source = 'none';
  let sourceDetail = null;
  let fallbackError = null;
  if (local.ok && Array.isArray(local.rows) && local.rows.length > 0) {
    playerRows = local.rows.map((row) => ({ ...row, stateSource: 'steam-local-api' }));
    source = 'steam-local-api';
    sourceDetail = local.gamePath || null;
  } else {
    const community = await fetchCommunityPlayerRows(steamId);
    if (community.ok) {
      playerRows = community.rows;
      source = 'steam-community';
      sourceDetail = community.url;
    }
    fallbackError = community.error || null;
  }

  const achievements = mergeRows(metadata.achievements, playerRows, source, local.stats || []);
  const stateCount = achievements.filter((item) => typeof item.unlocked === 'boolean').length;
  const errors = [];
  if (!local.ok && local.error) errors.push(`Local Steam API: ${local.error}`);
  if (stateCount !== ACHIEVEMENTS.length && fallbackError) errors.push(`Community fallback: ${fallbackError}`);
  if (stateCount !== ACHIEVEMENTS.length) errors.push(`Resolved ${stateCount} of ${ACHIEVEMENTS.length} achievement states.`);

  return {
    ok: stateCount === ACHIEVEMENTS.length, source, sourceDetail, steamId, account, local,
    statsCount: Number(local?.discoveredStatCount || local?.stats?.length || 0),
    counterCount: achievements.filter((item) => item.progress).length,
    statsSchema: local?.schemaPath || null,
    metadataOk: metadata.ok, metadataCount: metadata.count,
    iconCount: achievements.filter((item) => item.iconUrl).length,
    achievements, count: stateCount, error: errors.length ? errors.join(' ') : null
  };
}

module.exports = { APP_ID, GLOBAL_URL, fetchSteamAchievements, extractAchievementRows, mergeRows };
