'use strict';

const elements = {
  sourceHeading: document.getElementById('source-heading'), sourcePath: document.getElementById('sourcePath'),
  summary: document.getElementById('summary'), achievementGrid: document.getElementById('achievementGrid'),
  template: document.getElementById('achievementTemplate'), notice: document.getElementById('notice'),
  refresh: document.getElementById('refresh'), openGameFolder: document.getElementById('openGameFolder'),
  search: document.getElementById('search'), filters: [...document.querySelectorAll('.filter')],
  tourHelp: document.getElementById('tourHelp'), tourOverlay: document.getElementById('tourOverlay'),
  tourCoach: document.getElementById('tourCoach'), tourStepCount: document.getElementById('tourStepCount'),
  tourTitle: document.getElementById('tourTitle'), tourText: document.getElementById('tourText'),
  tourSkip: document.getElementById('tourSkip'), tourBack: document.getElementById('tourBack'),
  tourNext: document.getElementById('tourNext')
};

let activeFilter = 'all';
let initialReadySignalled = false;
const TOUR_STORAGE_KEY = 'days-gone-achievement-tracker-tour-v1';
let tourIndex = -1;
let tourTarget = null;
let tourPreviousFocus = null;
let tourOpenedHead = null;
let tourAutoChecked = false;

const tourSteps = [
  { title: 'Steam is the source', text: 'The tracker reads the Steam account currently signed in on this PC. Days Gone save files are not needed.', target: () => document.querySelector('.status-panel') },
  { title: 'Achievement state', text: 'Steam read shows how many of all 67 achievement states were resolved through the local Steam UserStats API.', target: () => document.querySelector('[data-tour="steam-read"]') },
  { title: 'Exact numeric counters', text: 'Tracked counters are matched to the game’s own schema. The tracker does not guess which stat belongs to an achievement.', target: () => document.querySelector('[data-tour="tracked-counters"]') },
  { title: 'Filter and search', text: 'Narrow the list by state, or search by achievement name and description.', target: () => document.querySelector('.toolbar') },
  { title: 'Open an achievement', text: 'Select a card to see the current counter, unlock date and exact Steam source.', target: () => firstTourAchievementCard() },
  { title: 'Read the source', text: 'SOURCE names the exact DG1 stat used when a cumulative counter is available.', target: () => firstTourAchievementCard(), prepare: expandTourAchievement }
];

function formatUnlockDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${day} at ${time}`;
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
  const source = data.steam?.source === 'steam-local-api' ? 'Local API' : data.steam?.source === 'steam-community' ? 'Community' : 'Unresolved';
  const cards = [
    ['Achievements', `${unlocked} / ${total}`], ['Locked', locked], ['Unknown', unknown],
    ['Tracked counters', `${tracked} / 22`, 'tracked-counters'],
    ['Steam read', `${data.steam?.count || 0}/${total} · ${source}`, 'steam-read'],
    ['Steam stats', data.steam?.source === 'steam-local-api' ? `${data.steam?.statsCount || 0} values` : '—']
  ];
  elements.summary.innerHTML = '';
  for (const [label, value, tour] of cards) {
    const card = document.createElement('div'); card.className = 'summary-card';
    if (tour) card.dataset.tour = tour;
    const labelEl = document.createElement('span'); labelEl.className = 'summary-label'; labelEl.textContent = label;
    const valueEl = document.createElement('span'); valueEl.className = `summary-value${String(value).length > 16 ? ' small' : ''}`; valueEl.textContent = value;
    card.append(labelEl, valueEl); elements.summary.append(card);
  }
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
    const bodyId = `achievement-body-${index}`; body.id = bodyId; head.setAttribute('aria-controls', bodyId);
    if (item.iconUrl) {
      icon.src = item.iconUrl; icon.hidden = false; fallback.hidden = true;
      icon.addEventListener('error', () => { icon.hidden = true; fallback.hidden = false; }, { once: true });
    }
    node.querySelector('.achievement-name').textContent = item.name;
    node.querySelector('.achievement-description').textContent = item.description;
    node.querySelector('.state-label').textContent = stateLabel(item);
    const progressWrap = node.querySelector('.progress-wrap');
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
    }
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
    node.querySelector('.substates').hidden = true;
    head.addEventListener('click', () => {
      const expanded = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', String(!expanded)); body.hidden = expanded;
    });
    elements.achievementGrid.append(node);
  }
  applyFilters();
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
  elements.sourceHeading.textContent = data.personaName ? `Steam · ${data.personaName}` : 'Steam · Days Gone';
  elements.sourcePath.textContent = data.gamePath || 'Days Gone installation was not found locally.';
  renderSummary(data); renderAchievements(data);
  if (tourIndex >= 0) showTourStep(tourIndex); else maybeStartFirstRunTour();
  const total = data.achievements?.length || 0;
  if (!data.steam?.ok) showNotice(data.steam?.error || `Steam resolved ${data.steam?.count || 0} of ${total} achievement states.`);
  else if (data.steam?.source === 'steam-local-api' && Number(data.steam?.statsCount || 0) === 0) showNotice('Achievement states resolved, but Steam exposed no numeric stat values. Start Days Gone once, then refresh.');
  else showNotice(null);
}

async function load({ refresh = false } = {}) {
  elements.refresh.disabled = true; elements.refresh.textContent = 'Reading…';
  try { render(refresh ? await window.daysGone.refreshDashboard() : await window.daysGone.getDashboard()); }
  catch (error) { showNotice(`Unable to refresh the tracker: ${error?.message || error}`); }
  finally {
    elements.refresh.disabled = false; elements.refresh.textContent = 'Refresh';
    if (!initialReadySignalled) { initialReadySignalled = true; window.daysGone.notifyReady(); }
  }
}

elements.refresh.addEventListener('click', () => load({ refresh: true }));
elements.openGameFolder.addEventListener('click', async () => {
  try { const result = await window.daysGone.openGameFolder(); if (!result?.ok) showNotice(result?.error || 'Unable to open the game folder.'); }
  catch (error) { showNotice(`Unable to open the game folder: ${error?.message || error}`); }
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
load();
