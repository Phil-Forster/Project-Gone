'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const installerPath = path.join(root, 'build', 'installer.nsh');
const packagePath = path.join(root, 'package.json');

let failed = false;
const fail = (message) => {
  failed = true;
  console.error(`INSTALLER PREFLIGHT FAILED: ${message}`);
};

const source = fs.readFileSync(installerPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));


// nsDialogs text calls must remain on one physical NSIS source line. A literal
// JavaScript/Python newline accidentally inserted inside a quoted NSIS string
// causes makensis "unterminated string" failures before packaging starts.
for (const [index, line] of source.split(/\r?\n/).entries()) {
  if (!line.includes('${NSD_CreateLabel}')) continue;
  const quoteCount = (line.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    fail(`line ${index + 1}: NSD_CreateLabel contains an unterminated quoted string; use literal $\\r$\\n escapes on one physical line.`);
  }
}

if (pkg?.build?.nsis?.include !== 'build/installer.nsh') {
  fail('package.json does not point NSIS include at build/installer.nsh.');
}

if (source.includes('UAC::_')) {
  fail('Direct UAC::_ plug-in calls are forbidden in the custom include.');
}

if (source.includes('${UNINSTALL_FILENAME}')) {
  fail('UNINSTALL_FILENAME is defined by Electron Builder after the custom include is parsed; use PG_UNINSTALL_FILENAME instead.');
}
if (!source.includes('!define PG_UNINSTALL_FILENAME "Uninstall ${PRODUCT_FILENAME}.exe"')) {
  fail('Custom installer must define PG_UNINSTALL_FILENAME from the command-line PRODUCT_FILENAME value.');
}

for (const obsolete of ['PG_Next', 'PG_Back', 'PG_Cancel']) {
  if (new RegExp(`\\bFunction\\s+${obsolete}\\b`).test(source)) {
    fail(`Obsolete unreferenced function ${obsolete} is still defined.`);
  }
}


const requiredFlowSnippets = [
  'Function PG_InstallCompleted',
  '!macro customInstall',
  'Call PG_InstallCompleted',
  'Function PG_WaitForPreviousInstallRelease',
  '!macro customUnInstallCheck',
  'Call PG_WaitForPreviousInstallRelease',
  'Page custom PG_FinishCreate PG_FinishLeave',
  'Function PG_LaunchPaint',
  'Function PG_ToggleLaunch',
  'Function PG_FinishLeave',
  'Function .onGUIEnd',
  'StrCpy $PG.LaunchNow "1"',
  'StrCpy $PG.LaunchOnExit "0"',
  'StrCpy $PG.LaunchOnExit $PG.LaunchNow',
  '!insertmacro PG_FULLWINDOW',
  'Function PG_FinishCreate\n  nsDialogs::Create 1044',
  'Function un.PG_FinishCreate\n    nsDialogs::Create 1044',
  '!insertmacro PG_CHROME inst ${SW_HIDE} ${SW_HIDE} ${SW_SHOW}',
  '!insertmacro PG_CHROME finish ${SW_SHOW} ${SW_HIDE} ${SW_HIDE}',
  '!insertmacro PG_CHROME uninst ${SW_SHOW} ${SW_HIDE} ${SW_SHOW}',
  '!insertmacro PG_CHROME unfinish ${SW_SHOW} ${SW_HIDE} ${SW_HIDE}',
  'StrCpy $isForceMachineInstall "1"',
  'StrCpy $isForceCurrentInstall "1"',
  '!insertmacro PG_SKIN_BUTTON $R0 $PG.BtnCloseBmp',
  'ExecShell "open" "$INSTDIR\\${PRODUCT_FILENAME}.exe"',
  'ShowWindow $mui.Header.Text ${SW_HIDE}',
  'ShowWindow $mui.Header.SubText ${SW_HIDE}',
  'GetDlgItem $R5 $HWNDPARENT 1028',
  'ShowWindow $R5 ${SW_HIDE}',
  '!define MUI_PAGE_CUSTOMFUNCTION_SHOW un.PG_StyleInstFiles',
];
for (const snippet of requiredFlowSnippets) {
  if (!source.includes(snippet)) {
    fail(`Installer completion/readability contract is missing: ${snippet}`);
  }
}

// Timers on the InstFiles page are forbidden. nsDialogs timer callbacks run while
// Electron Builder is extracting/removing files and share NSIS $R* registers with
// those routines, which can corrupt the active install path or transient state.
for (const forbidden of ['NSD_CreateTimer', 'PG_InstFilesPoll', 'un.PG_Timer']) {
  if (source.includes(forbidden)) {
    fail(`Asynchronous InstFiles state handling is forbidden: ${forbidden}`);
  }
}

const customInstallBlock = source.match(/!macro customInstall\s*\n[\s\S]*?!macroend/)?.[0] || '';
if (!customInstallBlock.includes('Call PG_InstallCompleted')) {
  fail('customInstall must synchronously transition the installer UI via PG_InstallCompleted.');
}

// User-journey invariants: each stage exposes only actions that make sense.
const installerJourney = [
  ['welcome', '!insertmacro PG_CHROME welcome ${SW_SHOW} ${SW_HIDE} ${SW_SHOW}'],
  ['scope', '!insertmacro PG_CHROME scope ${SW_SHOW} ${SW_SHOW} ${SW_SHOW}'],
  ['directory', '!insertmacro PG_CHROME dir ${SW_SHOW} ${SW_SHOW} ${SW_SHOW}'],
  ['installing', '!insertmacro PG_CHROME inst ${SW_HIDE} ${SW_HIDE} ${SW_SHOW}'],
  ['finish', '!insertmacro PG_CHROME finish ${SW_SHOW} ${SW_HIDE} ${SW_HIDE}'],
  ['uninstall welcome', '!insertmacro PG_CHROME unwelcome ${SW_SHOW} ${SW_HIDE} ${SW_SHOW}'],
  ['uninstalling', '!insertmacro PG_CHROME uninst ${SW_SHOW} ${SW_HIDE} ${SW_SHOW}'],
  ['uninstall finish', '!insertmacro PG_CHROME unfinish ${SW_SHOW} ${SW_HIDE} ${SW_HIDE}'],
];
for (const [stage, snippet] of installerJourney) {
  if (!source.includes(snippet)) fail(`${stage}: unexpected wizard button contract.`);
}

const finishBlock = source.match(/Function PG_FinishCreate[\s\S]*?FunctionEnd/)?.[0] || '';
if (finishBlock.includes('MUI_HEADER_TEXT')) {
  fail('Finish page must not write to the MUI header; it is a full-window bespoke page.');
}
const finishLeaveBlock = source.match(/Function PG_FinishLeave[\s\S]*?FunctionEnd/)?.[0] || '';
if (finishLeaveBlock.includes('ExecShell')) {
  fail('Finish-page leave callback must not launch the app before the installer GUI closes.');
}

if (!/CreateFont \$PG\.FontTitle "Segoe UI" 15 700/.test(source) ||
    !/CreateFont \$PG\.FontBody "Segoe UI" 10 400/.test(source) ||
    !/CreateFont \$PG\.FontHeader "Segoe UI" 9 400/.test(source)) {
  fail('Installer typography contract is not using the reviewed 15 pt title / 10 pt body / 9 pt header sizes.');
}

// Electron Builder preprocesses this include twice: once for setup and once
// with BUILD_UNINSTALLER defined while constructing the uninstaller. Reduce the
// source to each mode so warnings caused by declarations visible in only one
// compilation pass can be caught before makensis runs.
function sourceForMode(buildUninstaller) {
  const output = [];
  const stack = [];
  let active = true;

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    const conditional = trimmed.match(/^!(ifdef|ifndef)\s+(\S+)/);

    if (conditional) {
      const [, kind, symbol] = conditional;
      const parentActive = active;
      const isBuildMode = symbol === 'BUILD_UNINSTALLER';
      const condition = isBuildMode
        ? (kind === 'ifdef' ? buildUninstaller : !buildUninstaller)
        : true;

      stack.push({ parentActive, isBuildMode, condition });
      active = isBuildMode ? parentActive && condition : parentActive;
      continue;
    }

    if (/^!else\b/.test(trimmed) && stack.length) {
      const frame = stack[stack.length - 1];
      active = frame.isBuildMode
        ? frame.parentActive && !frame.condition
        : frame.parentActive; // Preserve both branches for unrelated symbols.
      continue;
    }

    if (/^!endif\b/.test(trimmed) && stack.length) {
      const frame = stack.pop();
      active = frame.parentActive;
      continue;
    }

    if (active) output.push(line);
  }

  return output.join('\n');
}

function auditMode(label, modeSource) {
  const declarations = [...modeSource.matchAll(/^\s*Var\s+([^\s]+)\s*$/gm)].map((m) => m[1]);
  const declarationSet = new Set();

  for (const variable of declarations) {
    if (declarationSet.has(variable)) {
      fail(`${label}: duplicate NSIS variable declaration ${variable}.`);
      continue;
    }
    declarationSet.add(variable);

    // A variable with fewer than two active $references is either never used,
    // or is only written and never read. Both patterns can trigger warning 6001,
    // which Electron Builder promotes to a fatal error.
    const escaped = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const refs = modeSource.match(new RegExp(`\\$${escaped}(?![\\w.])`, 'g')) || [];
    if (refs.length < 2) {
      fail(`${label}: variable ${variable} has only ${refs.length} active reference(s); makensis may emit warning 6001.`);
    }
  }

  const functions = [...modeSource.matchAll(/^\s*Function\s+([^\s]+)\s*$/gm)].map((m) => m[1]);
  const functionSet = new Set();

  for (const fn of functions) {
    if (functionSet.has(fn)) {
      fail(`${label}: duplicate NSIS function definition ${fn}.`);
      continue;
    }
    functionSet.add(fn);

    const escaped = fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const refs = modeSource.match(new RegExp(`(?<![\\w.])${escaped}(?![\\w.])`, 'g')) || [];
    const nsisCallback = new Set([
      '.onGUIEnd', '.onGUIInit', '.onInit', '.onUserAbort', '.onInstSuccess', '.onInstFailed',
      '.onRebootFailed', '.onSelChange', '.onVerifyInstDir', '.onMouseOverSection',
      'un.onGUIEnd', 'un.onGUIInit', 'un.onInit', 'un.onUserAbort', 'un.onInstSuccess',
      'un.onInstFailed', 'un.onRebootFailed', 'un.onSelChange', 'un.onVerifyInstDir', 'un.onMouseOverSection',
    ]).has(fn);
    if (!nsisCallback && refs.length < 2) {
      fail(`${label}: function ${fn} has no active reference outside its definition; makensis may emit warning 6010.`);
    }
  }

  // Macro definitions are not emitted until inserted. If a PG macro carries
  // variable references but is never inserted in this mode, those references
  // cannot make a variable 'used' for makensis warning analysis.
  const macroPattern = /^\s*!macro\s+(PG_[^\s]+)[^\n]*\n([\s\S]*?)^\s*!macroend\s*$/gm;
  for (const match of modeSource.matchAll(macroPattern)) {
    const [, macroName, body] = match;
    if (!body.includes('$PG.')) continue;
    const escaped = macroName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const inserts = modeSource.match(new RegExp(`!insertmacro\\s+${escaped}(?:\\s|$)`, 'g')) || [];
    if (inserts.length < 1) {
      fail(`${label}: macro ${macroName} contains PG variable references but is never inserted.`);
    }
  }

  return { variables: declarations.length, functions: functions.length };
}

const installerStats = auditMode('installer pass', sourceForMode(false));
const uninstallerStats = auditMode('BUILD_UNINSTALLER pass', sourceForMode(true));

if (failed) {
  process.exitCode = 1;
} else {
  console.log(
    `Installer preflight OK: installer ${installerStats.variables} vars/${installerStats.functions} functions; ` +
    `uninstaller ${uninstallerStats.variables} vars/${uninstallerStats.functions} functions audited.`
  );
  console.log('Journey OK: Welcome -> Scope -> Location -> Installing [Cancel] -> Complete [Next] -> Finish [Launch option + Finish]; timerless InstFiles flow; Electron Builder install-mode page is force-skipped.');
}
