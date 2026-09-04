'use strict';

const elements = {
  sourceHeading: document.getElementById('source-heading'), sourcePath: document.getElementById('sourcePath'),
  summary: document.getElementById('summary'), achievementGrid: document.getElementById('achievementGrid'),
  template: document.getElementById('achievementTemplate'), notice: document.getElementById('notice'),
  refresh: document.getElementById('refresh'), openGameFolder: document.getElementById('openGameFolder'),
  saveSelect: document.getElementById('saveSelect'), saveMeta: document.getElementById('saveMeta'),
  browseSaveFolder: document.getElementById('browseSaveFolder'), openSaveFolder: document.getElementById('openSaveFolder'),
  search: document.getElementById('search'), filters: [...document.querySelectorAll('.filter')],
  tourHelp: document.getElementById('tourHelp'), tourOverlay: document.getElementById('tourOverlay'),
  tourCoach: document.getElementById('tourCoach'), tourStepCount: document.getElementById('tourStepCount'),
  tourTitle: document.getElementById('tourTitle'), tourText: document.getElementById('tourText'),
  tourSkip: document.getElementById('tourSkip'), tourBack: document.getElementById('tourBack'),
  tourNext: document.getElementById('tourNext'),
  scanState: document.getElementById('scanState')
};

let activeFilter = 'all';
let initialReadySignalled = false;
const CARD_ART = [
  'assets/card-art-full/days-gone-full-01.webp',
  'assets/card-art-full/days-gone-full-02.webp',
  'assets/card-art-full/days-gone-full-03.webp',
  'assets/card-art-full/days-gone-full-04.webp',
  'assets/card-art-full/days-gone-full-05.webp',
  'assets/card-art-full/days-gone-full-06.webp',
  'assets/card-art-full/days-gone-full-07.webp',
  'assets/card-art-full/days-gone-full-08.webp',
  'assets/card-art-full/days-gone-full-09.webp',
  'assets/card-art-full/days-gone-full-10.webp'
];
const cardArtReady = Promise.all(CARD_ART.map((src) => {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  if (image.decode) return image.decode().catch(() => undefined);
  return new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });
})).then(() => undefined);
const TOUR_STORAGE_KEY = 'days-gone-achievement-tracker-tour-v3';
let tourIndex = -1;
let tourTarget = null;
let tourPreviousFocus = null;
let tourOpenedHead = null;
let tourAutoChecked = false;

const tourSteps = [
  { title: 'Spoiler notice', text: 'Achievement names, requirements and guidance can reveal story, locations, enemies or progression. Use the tracker at your own discretion if you want to avoid spoilers.', target: () => document.querySelector('.spoiler-disclaimer') },
  { title: 'Steam stays primary', text: 'The tracker always reads the signed-in Steam account. A save can be selected as additional context without replacing Steam.', target: () => document.querySelector('.status-panel') },
  { title: 'Optional save evidence', text: 'Choose an automatically discovered save or browse to another folder. Steam only remains the default.', target: () => document.querySelector('.save-source') },
  { title: 'Road telemetry', text: 'Steam read shows how many of all 67 ledger entries were resolved through the local Steam UserStats API.', target: () => document.querySelector('[data-tour="steam-read"]') },
  { title: 'Odometer and counters', text: 'Tracked counters are matched to the game’s own schema. The road ledger never guesses which stat belongs to an achievement.', target: () => document.querySelector('[data-tour="tracked-counters"]') },
  { title: 'Filter and search', text: 'Narrow the list by state, or search by achievement name and description.', target: () => document.querySelector('.toolbar') },
  { title: 'Open a ledger entry', text: 'Each entry separates the Steam record, odometer/counter progress, selected-save road evidence and road notes.', target: () => firstTourAchievementCard(), prepare: expandTourAchievement }
];

function formatUnlockDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${day} at ${time}`;
}

function formatPlaytime(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value < 0) return 'Unavailable';
  if (value < 60) return `${Math.round(value)} min`;
  return `${(value / 60).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} hours`;
}

function stateLabel(item) {
  return item.state === 'unlocked' ? 'Unlocked' : item.state === 'locked' ? 'Locked' : 'Unknown';
}

function renderSummary(data) {
  const achievements = data.achievements || [];
  const total = achievements.length;
  const unlocked = achievements.filter((item) => item.state === 'unlocked').length;
  const locked = achievements.filter((item) => item.state === 'locked').length;
  const unknown = achievements.filter((item) => item.state === 'unknown').length;
  const tracked = achievements.filter((item) => item.displayProgress).length;
  const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  const source = data.steam?.source === 'steam-local-api' ? 'Local UserStats'
    : data.steam?.source === 'steam-community' ? 'Community fallback' : 'Unresolved';

  elements.summary.innerHTML = '';

  const completion = document.createElement('div');
  completion.className = 'completion-instrument road-gauge';
  completion.dataset.tour = 'completion';
  const label = document.createElement('div'); label.className = 'instrument-label';
  const labelLeft = document.createElement('span'); labelLeft.textContent = 'Ride completion';
  const labelRight = document.createElement('span'); labelRight.textContent = 'Steam record';
  label.append(labelLeft, labelRight);

  const dial = document.createElement('div');
  dial.className = 'completion-dial completion-dial--road';
  dial.style.setProperty('--completion-angle', `${Math.min(270, Math.max(0, percent * 2.7))}deg`);
  dial.setAttribute('role', 'img');
  dial.setAttribute('aria-label', `${percent}% complete, ${unlocked} of ${total} achievements unlocked`);
  for (const [value, cls] of [['0','0'],['25','25'],['50','50'],['75','75'],['100','100']]) {
    const tick = document.createElement('span'); tick.className = `road-tick road-tick--${cls}`; tick.textContent = value; dial.append(tick);
  }
  const roadLine = document.createElement('span'); roadLine.className = 'road-meter-line'; dial.append(roadLine);
  const core = document.createElement('div'); core.className = 'completion-core';
  const percentEl = document.createElement('span'); percentEl.className = 'completion-percent'; percentEl.textContent = `${percent}%`;
  const countEl = document.createElement('span'); countEl.className = 'completion-count'; countEl.textContent = `${unlocked} / ${total}`;
  const captionEl = document.createElement('span'); captionEl.className = 'completion-caption'; captionEl.textContent = 'Road logged';
  core.append(percentEl, countEl, captionEl); dial.append(core); completion.append(label, dial);

  const telemetry = document.createElement('div'); telemetry.className = 'telemetry-stack';
  const rows = [
    ['Locked entries', String(locked), locked > 0 ? 'neutral' : 'good'],
    ['Unknown entries', String(unknown), unknown > 0 ? 'warning' : 'good'],
    ['Steam playtime', formatPlaytime(data.steam?.playtime?.minutes), 'neutral'],
    ['Tracked counters', `${tracked} / 22`, tracked > 0 ? 'good' : 'neutral', 'tracked-counters'],
    ['Steam read', `${data.steam?.count || 0} / ${total} · ${source}`, Number(data.steam?.count || 0) === total ? 'good' : 'warning', 'steam-read'],
    ['Road record', data.saves?.selected ? data.saves.selected.type : 'Steam only', 'neutral']
  ];
  for (const [rowLabel, value, status, tour] of rows) {
    const row = document.createElement('div'); row.className = 'telemetry-row'; row.dataset.status = status;
    if (tour) row.dataset.tour = tour;
    const labelEl = document.createElement('span'); labelEl.className = 'telemetry-label'; labelEl.textContent = rowLabel;
    const valueEl = document.createElement('span'); valueEl.className = 'telemetry-value'; valueEl.textContent = value;
    row.append(labelEl, valueEl); telemetry.append(row);
  }
  elements.summary.append(completion, telemetry);
}

function renderAchievements(data) {
  elements.achievementGrid.innerHTML = '';
  for (const [index, item] of (data.achievements || []).entries()) {
    const node = elements.template.content.cloneNode(true);
    const card = node.querySelector('.achievement-card');
    const head = node.querySelector('.achievement-head');
    const body = node.querySelector('.achievement-body');
    const icon = node.querySelector('.achievement-icon');
    const fallback = node.querySelector('.achievement-icon-fallback');
    card.dataset.state = item.state;
    card.dataset.name = `${item.name} ${item.description}`.toLowerCase();
    card.style.setProperty('--card-art', `url("${CARD_ART[index % CARD_ART.length]}")`);
    const bodyId = `achievement-body-${index}`; body.id = bodyId; head.setAttribute('aria-controls', bodyId);
    if (item.iconUrl) {
      icon.src = item.iconUrl; icon.hidden = false; fallback.hidden = true;
      icon.addEventListener('error', () => { icon.hidden = true; fallback.hidden = false; }, { once: true });
    }
    node.querySelector('.achievement-name').textContent = item.name;
    node.querySelector('.achievement-description').textContent = item.description;
    node.querySelector('.state-label').textContent = stateLabel(item);
    const progressWrap = node.querySelector('.progress-wrap');
    const numericEmpty = node.querySelector('.numeric-empty');
    if (item.displayProgress) {
      const current = Number(item.displayProgress.current || 0);
      const target = Number(item.displayProgress.target || 0);
      const percent = target > 0 ? Math.min(100, Math.max(0, current / target * 100)) : 0;
      progressWrap.hidden = false;
      node.querySelector('.progress-text').textContent = `${current.toLocaleString('en-GB')} / ${target.toLocaleString('en-GB')} ${item.displayProgress.unit || ''}`.trim();
      node.querySelector('.progress-percent').textContent = `${Math.round(percent)}%`;
      node.querySelector('.progress-bar').style.width = `${percent}%`;
      const track = node.querySelector('.progress-track');
      track.setAttribute('aria-valuenow', String(Math.round(percent))); track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-label', `${item.name} progress`);
      numericEmpty.hidden = true;
    } else numericEmpty.textContent = item.target
      ? `Steam defines a ${Number(item.target).toLocaleString('en-GB')} ${item.unit || 'progress'} target, but no current counter was returned.`
      : 'No trustworthy intermediate numeric counter is defined for this achievement.';
    node.querySelector('.evidence-summary').textContent = item.evidence?.summary || 'No reliable Steam evidence is available.';
    const unlockRow = node.querySelector('.unlock-row');
    if (item.state === 'unlocked') {
      unlockRow.hidden = false;
      unlockRow.textContent = formatUnlockDate(item.unlockedAt) || 'Steam did not return an unlock timestamp.';
    }
    const source = item.steam?.stateSource === 'steam-local-api' ? 'Steam local UserStats API'
      : item.steam?.stateSource === 'steam-community' ? 'Steam Community' : 'Steam state unresolved';
    const stat = item.steam?.progress?.statName ? ` · exact counter: ${item.steam.progress.statName}` : '';
    node.querySelector('.source-text').textContent = `${source}${stat}`;
    const saveEvidence = item.saveEvidence || {};
    node.querySelector('.save-evidence-summary').textContent = saveEvidence.summary || 'No save evidence is available.';
    const saveDetails = node.querySelector('.save-evidence-details');
    for (const detail of saveEvidence.details || []) {
      const row = document.createElement('div'); row.className = 'evidence-detail';
      const label = document.createElement('span'); label.textContent = detail.label;
      const value = document.createElement('span');
      value.textContent = /At$|time|written/i.test(detail.label) ? (formatUnlockDate(detail.value) || detail.value) : detail.value;
      row.append(label, value); saveDetails.append(row);
    }
    node.querySelector('.category-badge').textContent = item.category || 'Achievement';
    node.querySelector('.guidance-text').textContent = item.guidance || item.description;
    head.addEventListener('click', () => {
      const expanded = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', String(!expanded)); body.hidden = expanded;
    });
    elements.achievementGrid.append(node);
  }
  applyFilters();
}

function renderSaveControls(data) {
  const current = data.saves?.selected?.key || '';
  elements.saveSelect.innerHTML = '';
  const steamOnly = document.createElement('option'); steamOnly.value = ''; steamOnly.textContent = 'Steam only';
  elements.saveSelect.append(steamOnly);
  for (const save of data.saves?.files || []) {
    const option = document.createElement('option'); option.value = save.key;
    const profile = save.profileId ? ` · ${save.profileId}` : '';
    option.textContent = `${save.name} · ${save.type}${profile}`;
    elements.saveSelect.append(option);
  }
  elements.saveSelect.value = current;
  elements.openSaveFolder.disabled = !(data.saves?.selected || data.saves?.roots?.length);
  elements.saveMeta.textContent = data.saves?.selected
    ? `${data.saves.selected.type} · ${formatUnlockDate(data.saves.selected.modifiedAt) || data.saves.selected.modifiedAt} · Steam remains authoritative.`
    : data.saves?.available
      ? `${data.saves.files.length} save files found. Steam only is active.`
      : 'No save files found. Steam remains the achievement authority.';
}

function applyFilters() {
  const term = elements.search.value.trim().toLowerCase();
  for (const card of elements.achievementGrid.querySelectorAll('.achievement-card')) {
    const stateMatch = activeFilter === 'all' || card.dataset.state === activeFilter;
    card.hidden = !(stateMatch && (!term || card.dataset.name.includes(term)));
  }
}

function showNotice(message) { elements.notice.hidden = !message; elements.notice.textContent = message || ''; }
function firstTourAchievementCard() { return elements.achievementGrid.querySelector('.achievement-card:not([hidden])') || elements.achievementGrid.querySelector('.achievement-card'); }
function expandTourAchievement() {
  const card = firstTourAchievementCard(); if (!card) return;
  const head = card.querySelector('.achievement-head'); const body = card.querySelector('.achievement-body');
  if (head.getAttribute('aria-expanded') !== 'true') { head.setAttribute('aria-expanded', 'true'); body.hidden = false; tourOpenedHead = head; }
}
function restoreTourAchievement() {
  if (!tourOpenedHead) return;
  const body = document.getElementById(tourOpenedHead.getAttribute('aria-controls'));
  tourOpenedHead.setAttribute('aria-expanded', 'false'); if (body) body.hidden = true; tourOpenedHead = null;
}
function clearTourTarget() { if (tourTarget) tourTarget.classList.remove('tour-focus'); tourTarget = null; }
function positionTourCoach() {
  if (tourIndex < 0 || !tourTarget || elements.tourCoach.hidden) return;
  const rect = tourTarget.getBoundingClientRect(); const coach = elements.tourCoach; const margin = 18; const gap = 14;
  let left = rect.left + (rect.width - coach.offsetWidth) / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - coach.offsetWidth - margin));
  let top = rect.bottom + gap;
  if (top + coach.offsetHeight > window.innerHeight - margin) top = rect.top - coach.offsetHeight - gap;
  top = Math.max(margin, Math.min(top, window.innerHeight - coach.offsetHeight - margin));
  coach.style.left = `${Math.round(left)}px`; coach.style.top = `${Math.round(top)}px`;
}
function showTourStep(index) {
  if (index < 0 || index >= tourSteps.length) return endTour({ completed: true });
  clearTourTarget(); tourIndex = index; const step = tourSteps[index]; if (step.prepare) step.prepare();
  const target = step.target(); if (!target) return showTourStep(index + 1);
  tourTarget = target; target.classList.add('tour-focus'); target.scrollIntoView({ block: 'center', inline: 'nearest' });
  elements.tourStepCount.textContent = `${index + 1} of ${tourSteps.length}`;
  elements.tourTitle.textContent = step.title; elements.tourText.textContent = step.text;
  elements.tourBack.disabled = index === 0; elements.tourNext.textContent = index === tourSteps.length - 1 ? 'Finish' : 'Next';
  elements.tourOverlay.hidden = false; elements.tourCoach.hidden = false;
  requestAnimationFrame(() => { positionTourCoach(); elements.tourNext.focus(); });
}
function startTour({ replay = false } = {}) {
  if (tourIndex >= 0 || !elements.achievementGrid.children.length) return;
  tourPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (!replay) tourAutoChecked = true; showTourStep(0);
}
function endTour({ completed = false } = {}) {
  clearTourTarget(); restoreTourAchievement(); elements.tourOverlay.hidden = true; elements.tourCoach.hidden = true; tourIndex = -1;
  if (completed) { try { localStorage.setItem(TOUR_STORAGE_KEY, 'complete'); } catch (_) {} }
  if (tourPreviousFocus && document.contains(tourPreviousFocus)) tourPreviousFocus.focus(); tourPreviousFocus = null;
}
function maybeStartFirstRunTour() {
  if (tourAutoChecked || tourIndex >= 0 || !elements.achievementGrid.children.length) return;
  tourAutoChecked = true; let completed = false;
  try { completed = localStorage.getItem(TOUR_STORAGE_KEY) === 'complete'; } catch (_) {}
  if (!completed) startTour();
}

function render(data) {
  elements.sourceHeading.textContent = data.personaName ? `Steam primary · ${data.personaName}` : 'Steam primary · Days Gone';
  elements.sourcePath.textContent = data.gamePath || 'Days Gone installation was not found locally.';
  renderSaveControls(data); renderSummary(data); renderAchievements(data);
  if (tourIndex >= 0) showTourStep(tourIndex); else maybeStartFirstRunTour();
  const total = data.achievements?.length || 0;
  if (!data.steam?.ok) showNotice(data.steam?.error || `Steam resolved ${data.steam?.count || 0} of ${total} achievement states.`);
  else if (data.steam?.source === 'steam-local-api' && Number(data.steam?.statsCount || 0) === 0) showNotice('Achievement states resolved, but Steam exposed no numeric stat values. Start Days Gone once, then refresh.');
  else showNotice(null);
}

async function load({ refresh = false } = {}) {
  document.body.classList.add('is-scanning');
  if (elements.scanState) elements.scanState.textContent = refresh ? 'RESCANNING ROAD LOG' : 'READING ROAD DATA';
  elements.refresh.disabled = true; elements.refresh.textContent = 'Reading…';
  try {
    const dashboardRequest = refresh ? window.daysGone.refreshDashboard() : window.daysGone.getDashboard();
    const [data] = await Promise.all([dashboardRequest, cardArtReady]);
    render(data);
  }
  catch (error) { showNotice(`Unable to refresh the tracker: ${error?.message || error}`); }
  finally {
    elements.refresh.disabled = false; elements.refresh.textContent = 'Refresh';
    document.body.classList.remove('is-scanning');
    if (elements.scanState) elements.scanState.textContent = 'ROAD LOG READY';
    if (!initialReadySignalled) { initialReadySignalled = true; window.daysGone.notifyReady(); }
  }
}

async function initProjectFooter() {
  const year = document.getElementById('footerYear');
  const version = document.getElementById('footerVersion');
  if (year) year.textContent = String(new Date().getFullYear());
  if (!version) return;
  try {
    const meta = await window.daysGone.getAppMeta();
    version.textContent = meta?.version ? `v${meta.version}` : 'Version unavailable';
  } catch (_) {
    version.textContent = 'Version unavailable';
  }
}

elements.refresh.addEventListener('click', () => load({ refresh: true }));
elements.openGameFolder.addEventListener('click', async () => {
  try { const result = await window.daysGone.openGameFolder(); if (!result?.ok) showNotice(result?.error || 'Unable to open the game folder.'); }
  catch (error) { showNotice(`Unable to open the game folder: ${error?.message || error}`); }
});
elements.openSaveFolder.addEventListener('click', async () => {
  try { const result = await window.daysGone.openSaveFolder(); if (!result?.ok) showNotice(result?.error || 'Unable to open the save folder.'); }
  catch (error) { showNotice(`Unable to open the save folder: ${error?.message || error}`); }
});
elements.saveSelect.addEventListener('change', async () => {
  elements.saveSelect.disabled = true;
  try { render(await window.daysGone.selectSave(elements.saveSelect.value)); }
  catch (error) { showNotice(`Unable to select that save: ${error?.message || error}`); }
  finally { elements.saveSelect.disabled = false; }
});
elements.browseSaveFolder.addEventListener('click', async () => {
  elements.browseSaveFolder.disabled = true;
  try {
    const result = await window.daysGone.browseSaveFolder();
    if (result?.ok && result.data) render(result.data);
    else if (!result?.canceled) showNotice(result?.error || 'No Days Gone saves were found in that folder.');
  } catch (error) { showNotice(`Unable to browse for saves: ${error?.message || error}`); }
  finally { elements.browseSaveFolder.disabled = false; }
});
elements.search.addEventListener('input', applyFilters);
for (const button of elements.filters) button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  elements.filters.forEach((item) => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  applyFilters();
});
elements.tourHelp.addEventListener('click', () => startTour({ replay: true }));
elements.tourSkip.addEventListener('click', () => endTour({ completed: true }));
elements.tourBack.addEventListener('click', () => showTourStep(tourIndex - 1));
elements.tourNext.addEventListener('click', () => tourIndex === tourSteps.length - 1 ? endTour({ completed: true }) : showTourStep(tourIndex + 1));
window.addEventListener('resize', positionTourCoach);
window.addEventListener('keydown', (event) => { if (tourIndex >= 0 && event.key === 'Escape') { event.preventDefault(); endTour({ completed: true }); } });
initProjectFooter();
load();
