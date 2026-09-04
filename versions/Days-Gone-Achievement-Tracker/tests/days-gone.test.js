'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ACHIEVEMENTS, SIMPLE_TARGETS, mergeAchievementState } = require('../src/achievements');
const { mergeRows } = require('../src/steam-reader');

test('contains all 67 Days Gone achievements and 22 cumulative targets', () => {
  assert.equal(ACHIEVEMENTS.length, 67);
  assert.equal(Object.keys(SIMPLE_TARGETS).length, 22);
  assert.equal(new Set(ACHIEVEMENTS.map((item) => item.apiName)).size, 67);
  assert.equal(new Set(ACHIEVEMENTS.map((item) => item.statName)).size, 67);
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
