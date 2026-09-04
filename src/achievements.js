'use strict';

// Steam App 1259420 metadata, extracted from the game's own
// UserGameStatsSchema_1259420.bin. The apiName/statName pairs are exact.
const ACHIEVEMENTS = [
  ['DG1_ACH_60', 'One Percenter', 'Go above and BEYOND, unlocking every trophy in Days Gone', null, 'DG1_STAT_60'],
  ['DG1_ACH_0', 'Just a Flesh Wound', "Get out of Crazy Willie's", null, 'DG1_STAT_0', true],
  ['DG1_ACH_1', 'Special Delivery', 'Make a delivery to Tucker or Copeland', null, 'DG1_STAT_1', true],
  ['DG1_ACH_2', 'The Ends and the Means', 'Discover what happened to NERO', null, 'DG1_STAT_2', true],
  ['DG1_ACH_3', 'Lost and Found', 'Drive south with Boozer', null, 'DG1_STAT_3', true],
  ['DG1_ACH_4', 'Brothers in Arm', 'Check up on Boozer', null, 'DG1_STAT_4', true],
  ['DG1_ACH_5', 'Take Back Your Name', 'Return the favor', null, 'DG1_STAT_5', true],
  ['DG1_ACH_6', 'Riding NOMAD', 'Take to the road alone', null, 'DG1_STAT_6', true],
  ['DG1_ACH_7', 'Hold on Tight', 'See a familiar face', null, 'DG1_STAT_7', true],
  ['DG1_ACH_8', "It's Getting Cold Outside", 'Reconnect with what you lost', null, 'DG1_STAT_8', true],
  ['DG1_ACH_9', 'Morior Invictus', "Ride out to take back what's yours", null, 'DG1_STAT_9', true],
  ['DG1_ACH_10', "I've Been Waiting for This", 'Take revenge, once and for all', null, 'DG1_STAT_10', true],
  ['DG1_ACH_11', 'Days Done', 'Complete the story of Days Gone', null, 'DG1_STAT_11'],
  ['DG1_ACH_12', 'Ambush Camp Hunter', 'Complete the Ambush Camp Hunter storyline', null, 'DG1_STAT_12'],
  ['DG1_ACH_13', 'Infestation Exterminator', 'Complete the Infestation Exterminator storyline', null, 'DG1_STAT_13'],
  ['DG1_ACH_14', 'Marauder Camp Hunter', 'Complete the Marauder Camp Hunter storyline', null, 'DG1_STAT_14'],
  ['DG1_ACH_15', "World's End", "Complete the World's End storyline", null, 'DG1_STAT_15'],
  ['DG1_ACH_16', 'One Down', 'Defeat your first Horde', null, 'DG1_STAT_16'],
  ['DG1_ACH_17', 'Farewell Drift', 'Accumulate 10 minutes of drifting while on your bike', 10, 'DG1_STAT_17'],
  ['DG1_ACH_18', 'This is a Knife', 'Kill a Breaker, Reacher, or Rager with a knife', null, 'DG1_STAT_18', true],
  ['DG1_ACH_19', 'Ghost of Farewell', 'Get 100 stealth kills', 100, 'DG1_STAT_19'],
  ['DG1_ACH_20', 'Old Reliable', 'Kill 200 Enemies with a Crafted Weapon', 200, 'DG1_STAT_20'],
  ['DG1_ACH_21', 'Variety is the Spice of Life', 'Kill an enemy with every type of crossbow bolt', 5, 'DG1_STAT_21'],
  ['DG1_ACH_22', 'Farewell Original', 'Purchase an upgrade under the Performance, Visual, and Paint Categories for your bike', null, 'DG1_STAT_22'],
  ['DG1_ACH_23', 'First Time Buyer', 'Upgrade your bike for the first time', null, 'DG1_STAT_23'],
  ['DG1_ACH_24', 'Burnout Apocalypse', 'Use nitro and drift at the same time on your bike for at least 5 seconds', null, 'DG1_STAT_24'],
  ['DG1_ACH_25', 'The Art of Bike Repair', 'Apply 100 scrap to your bike', 100, 'DG1_STAT_25'],
  ['DG1_ACH_26', "You've Got Red on You", 'Collect 541 Items from corpses', 541, 'DG1_STAT_26'],
  ['DG1_ACH_27', 'Lend Me Your Ears', 'Collect 989 Freaker Ears', 989, 'DG1_STAT_27'],
  ['DG1_ACH_28', 'Finders Keepers', 'Unlock your first collectible', null, 'DG1_STAT_28'],
  ['DG1_ACH_29', 'Wannabe Fortune Hunter', 'Unlock over 50% of the collectibles', 121, 'DG1_STAT_29'],
  ['DG1_ACH_30', 'The Broken Roadshow', 'Unlock over 75% of collectibles', 181, 'DG1_STAT_30'],
  ['DG1_ACH_31', "Surviving isn't Living", 'Rescue 10 survivors', 10, 'DG1_STAT_31'],
  ['DG1_ACH_32', 'Better Living through Chemistry', 'Upgrade either your Health, Stamina, or Focus for the first time', null, 'DG1_STAT_32'],
  ['DG1_ACH_33', 'Performance Enhanced', 'Max out either your Health, Stamina, or Focus', null, 'DG1_STAT_33'],
  ['DG1_ACH_34', 'Best Friends Forever', 'Receive the Allied Trust status with an Encampment', null, 'DG1_STAT_34'],
  ['DG1_ACH_35', 'Best Friends Forever (For Life)', 'Gain the Allied Trust status with three different Encampments', 3, 'DG1_STAT_35'],
  ['DG1_ACH_36', 'Make it Rain', 'Spend 20,000 credits at one Encampment', 20000, 'DG1_STAT_36'],
  ['DG1_ACH_37', 'Welcome to the Party, Pal', 'Clear all Ambush Camps, Infestations, and NERO Checkpoints in a single region', null, 'DG1_STAT_37'],
  ['DG1_ACH_38', 'Kitchen Courier', 'Sell Animal Meat or Plants to any Encampment', null, 'DG1_STAT_38'],
  ['DG1_ACH_39', "Don't Stop Me Now", 'Unlock your first skill', null, 'DG1_STAT_39'],
  ['DG1_ACH_40', "I'm Out of Control", 'Unlock 15 skills', 15, 'DG1_STAT_40'],
  ['DG1_ACH_41', "There's No Stopping Me", 'Unlock 30 skills', 30, 'DG1_STAT_41'],
  ['DG1_ACH_42', 'Mr. Fahrenheit', 'Unlock 45 skills', 45, 'DG1_STAT_42'],
  ['DG1_ACH_43', 'Go Kick Rocks', 'Knock down 12 Anarchist Cairns', 12, 'DG1_STAT_43'],
  ['DG1_ACH_44', 'D.I.Y. Oregonian', 'Craft 50 items', 50, 'DG1_STAT_44'],
  ['DG1_ACH_45', 'Surviving is Living', 'Complete the story of Days Gone in Survival Mode', null, 'DG1_STAT_45'],
  ['DG1_ACH_46', 'Days Gone in 60 Seconds', 'Defeat a Horde in under 1 minute in Survival Mode', null, 'DG1_STAT_46'],
  ['DG1_ACH_47', 'Participation Award', 'Earn your first Bronze Medal in a Challenge', null, 'DG1_STAT_47'],
  ['DG1_ACH_48', 'Second (the) Best', 'Earn your first Silver Medal in a Challenge', null, 'DG1_STAT_48'],
  ['DG1_ACH_49', 'Golden Boy', 'Earn your first Gold Medal in a Challenge', null, 'DG1_STAT_49'],
  ['DG1_ACH_50', 'I Make This Look Good', 'Earn a Gold Medal in a Challenge with a Character Skin and Custom Accent equipped', null, 'DG1_STAT_50'],
  ['DG1_ACH_51', 'Worthy', 'Fully upgrade any Ring', null, 'DG1_STAT_51'],
  ['DG1_ACH_52', 'Gold Team Rules', 'Earn a Gold Medal in all Challenges', 12, 'DG1_STAT_52'],
  ['DG1_ACH_53', 'You Done Good, Kid', 'Earn a Medal in all Sub-Challenges', 48, 'DG1_STAT_53'],
  ['DG1_ACH_54', "Dolla Dolla Bills, Y'all", 'Spend 3000 credits on your Loadout', 3000, 'DG1_STAT_54'],
  ['DG1_ACH_55', 'Lost & Damned', 'Reach the Founder Rank', null, 'DG1_STAT_55'],
  ['DG1_ACH_56', "Gotta Patch 'Em All", 'Unlock all Patches', 12, 'DG1_STAT_56'],
  ['DG1_ACH_57', 'One More Ride', 'Complete the story of Days Gone in New Game+', null, 'DG1_STAT_57'],
  ['DG1_ACH_58', '2 Days 2 Done', 'Complete the story of Days Gone on Hard II or Survival II in New Game+', null, 'DG1_STAT_58'],
  ['DG1_ACH_59', "Logan's Shadow", 'Kill an enemy with every type of ammo from a mysterious weapon earned in New Game+', 4, 'DG1_STAT_59'],
  ['DG1_ACH_61', 'More Freakers, More Problems', 'Defeat an increased size horde in Horde Assault', null, 'DG1_STAT_61', true],
  ['DG1_ACH_62', "I'm On Top of the World", 'Beat the target score for all levels in Horde Assault', null, 'DG1_STAT_62', true],
  ['DG1_ACH_63', 'Freakshow', 'Survive Horde Assault for 15 minutes', null, 'DG1_STAT_63', true],
  ['DG1_ACH_64', 'Survivor', 'Achieve max level in Horde Assault', null, 'DG1_STAT_64', true],
  ['DG1_ACH_65', 'Dead Don’t Ride', 'Complete the story of Days Gone in Permadeath Mode on any difficulty', null, 'DG1_STAT_65', true],
  ['DG1_ACH_66', "Sarah's Gift", 'Find something important to Deacon that was thought lost', null, 'DG1_STAT_66', true]
].map(([apiName, name, description, target, statName, hidden = false]) => ({ apiName, name, description, target, statName, hidden }));

const UNITS = Object.freeze({
  DG1_ACH_17: 'minutes drifting', DG1_ACH_19: 'stealth kills', DG1_ACH_20: 'crafted-weapon kills',
  DG1_ACH_21: 'bolt types', DG1_ACH_25: 'scrap', DG1_ACH_26: 'items', DG1_ACH_27: 'Freaker ears',
  DG1_ACH_29: 'collectibles', DG1_ACH_30: 'collectibles', DG1_ACH_31: 'survivors',
  DG1_ACH_35: 'encampments', DG1_ACH_36: 'credits', DG1_ACH_40: 'skills', DG1_ACH_41: 'skills',
  DG1_ACH_42: 'skills', DG1_ACH_43: 'cairns', DG1_ACH_44: 'items crafted', DG1_ACH_52: 'gold medals',
  DG1_ACH_53: 'sub-challenges', DG1_ACH_54: 'credits', DG1_ACH_56: 'patches', DG1_ACH_59: 'ammo types'
});

const SIMPLE_TARGETS = Object.fromEntries(ACHIEVEMENTS
  .filter((item) => Number.isFinite(item.target) && item.target > 1)
  .map((item) => [item.name, { target: item.target, unit: UNITS[item.apiName] || 'progress' }]));

const PROFILE_TROPHY_APIS = ACHIEVEMENTS
  .filter((item) => item.apiName !== 'DG1_ACH_60')
  .map((item) => item.apiName);
const TROPHY_INDEX_BY_API = new Map(PROFILE_TROPHY_APIS.map((apiName, index) => [apiName, index]));

function categoryFor(apiName) {
  const number = Number(String(apiName).split('_').pop());
  if (number <= 11 || number === 60) return 'Story';
  if (number <= 15) return 'Storylines';
  if (number === 17 || (number >= 22 && number <= 25)) return 'Bike';
  if ((number >= 16 && number <= 21) || (number >= 26 && number <= 27)) return 'Combat';
  if (number >= 28 && number <= 31) return 'Exploration';
  if (number >= 32 && number <= 44) return 'Progression';
  if (number >= 45 && number <= 46) return 'Survival';
  if (number >= 47 && number <= 56) return 'Challenges';
  if (number >= 57 && number <= 59) return 'New Game+';
  return 'Broken Road';
}

function guidanceFor(definition) {
  const unit = UNITS[definition.apiName] || 'progress';
  const counter = definition.target
    ? `Steam defines an exact target of ${Number(definition.target).toLocaleString('en-GB')} ${unit}.`
    : 'Steam defines no trustworthy intermediate numeric target for this achievement.';
  const hidden = definition.hidden ? ' This is a hidden achievement, so its requirement may be story- or mode-sensitive.' : '';
  return `${definition.description}. ${counter}${hidden} Steam decides the final unlock state.`;
}

function normalizeName(value = '') {
  return String(value).replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toUpperCase();
}

function mergeAchievementState(save, steamRows = []) {
  const { selectedSaveEvidence } = require('./save-reader');
  const byApiName = new Map(steamRows.filter((row) => row.apiName).map((row) => [row.apiName, row]));
  const byName = new Map(steamRows.map((row) => [normalizeName(row.name), row]));

  return ACHIEVEMENTS.map((definition) => {
    const steam = byApiName.get(definition.apiName) || byName.get(normalizeName(definition.name)) || {};
    const state = steam.unlocked === true ? 'unlocked' : steam.unlocked === false ? 'locked' : 'unknown';
    const unit = UNITS[definition.apiName] || 'progress';
    const progress = steam.progress && Number.isFinite(Number(steam.progress.current))
      ? { ...steam.progress, unit }
      : null;
    let summary = 'Steam has not exposed a reliable state for this achievement.';
    if (progress) summary = `${Number(progress.current).toLocaleString('en-GB')} / ${Number(progress.target).toLocaleString('en-GB')} ${unit}`;
    else if (state === 'unlocked') summary = 'Steam confirms this achievement is unlocked.';
    else if (state === 'locked') summary = definition.target
      ? 'Steam confirms this achievement is locked; its numeric stat is currently unavailable.'
      : 'Steam confirms this achievement is locked.';

    return {
      ...definition,
      category: categoryFor(definition.apiName),
      unit,
      trophyIndex: TROPHY_INDEX_BY_API.has(definition.apiName) ? TROPHY_INDEX_BY_API.get(definition.apiName) : null,
      guidance: guidanceFor(definition),
      state,
      unlockedAt: steam.unlockedAt || null,
      iconUrl: steam.iconUrl || null,
      displayProgress: progress,
      steam,
      evidence: { summary, source: progress ? 'Steam local UserStats counter' : 'Steam achievement state', substates: [] },
      saveEvidence: null
    };
  }).map((item) => ({ ...item, saveEvidence: selectedSaveEvidence(save, item) }));
}

module.exports = { ACHIEVEMENTS, SIMPLE_TARGETS, PROFILE_TROPHY_APIS, categoryFor, normalizeName, mergeAchievementState };
