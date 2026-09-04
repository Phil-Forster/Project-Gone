; Days Gone Achievement Tracker — bespoke assisted installer/uninstaller
; v0.3.11: upgrade/reinstall hardening. Completion is driven by Electron Builder's
; customInstall hook, and successful removal of an older version is followed by an
; explicit Windows file-release settle gate before the new payload is written.
; This prevents the intermittent "Error opening file for writing" race seen when
; the previous uninstaller has exited but its executable is still delete-pending.
; IMPORTANT: Electron Builder compiles this include once while BUILD_UNINSTALLER is
; defined to create the uninstaller. Installer-only functions MUST stay inside the
; BUILD_UNINSTALLER guard or NSIS warning 6010 is promoted to a fatal build error.

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"
!include "LogicLib.nsh"

!define PG_BG "10110F"
!define PG_SURFACE "1B1C19"
!define PG_SURFACE_ALT "25251F"
!define PG_TEXT "EEE8DC"
!define PG_MUTED "AAA294"
!define PG_ACCENT "E49A61"
!define PG_BORDER "494238"

!define PG_BG_COLORREF 0x000F1110
!define PG_TEXT_COLORREF 0x00DCE8EE
!define PG_BORDER_COLORREF 0x00384249
!define PG_ACCENT_COLORREF 0x00619AE4
!define PG_PROGRESS_BG_COLORREF 0x00252D30

; Electron Builder defines UNINSTALL_FILENAME later from common.nsh. This custom
; include is parsed before that define exists, so use our own equivalent name.
!define PG_UNINSTALL_FILENAME "Uninstall ${PRODUCT_FILENAME}.exe"

!ifdef MUI_BGCOLOR
 !undef MUI_BGCOLOR
!endif
!define MUI_BGCOLOR "${PG_BG}"
!ifdef MUI_TEXTCOLOR
 !undef MUI_TEXTCOLOR
!endif
!define MUI_TEXTCOLOR "${PG_TEXT}"
!ifdef MUI_INSTFILESPAGE_COLORS
 !undef MUI_INSTFILESPAGE_COLORS
!endif
!define MUI_INSTFILESPAGE_COLORS "${PG_TEXT} ${PG_BG}"
!ifdef MUI_INSTALLCOLORS
 !undef MUI_INSTALLCOLORS
!endif
!define MUI_INSTALLCOLORS "${PG_ACCENT} ${PG_SURFACE}"
!define MUI_INSTFILESPAGE_PROGRESSBAR "colored"
!define MUI_ABORTWARNING
!define MUI_UNABORTWARNING

!ifdef MUI_HEADERIMAGE_UNBITMAP
 !undef MUI_HEADERIMAGE_UNBITMAP
!endif
!define MUI_HEADERIMAGE_UNBITMAP "${BUILD_RESOURCES_DIR}\uninstallerHeader.bmp"

; Variables must only exist in the compilation pass that actually uses them.
; Electron Builder promotes NSIS warning 6001 to a fatal error, so declaring an
; installer-only variable during BUILD_UNINSTALLER is itself a build failure.
!ifndef BUILD_UNINSTALLER
Var PG.Scope
Var PG.ScopeCurrent
Var PG.ScopeAll
Var PG.PathLabel
Var PG.BtnInstallBmp
Var PG.BtnFinishBmp
Var PG.LaunchNow
Var PG.LaunchOnExit
Var PG.LaunchToggle
Var PG.UpgradeSettleCount
!else
Var PG.BtnCloseBmp
!endif
Var PG.IsInner
Var PG.Dialog
Var PG.Sidebar
Var PG.SidebarHandle
Var PG.FontTitle
Var PG.FontSub
Var PG.FontBody
Var PG.FontHeader
Var PG.BtnBackBmp
Var PG.BtnNextBmp
Var PG.BtnCancelBmp

!macro PG_EXTRACT_UI SIDEBAR
  InitPluginsDir
  File /oname=$PLUGINSDIR\pg-sidebar.bmp "${BUILD_RESOURCES_DIR}\${SIDEBAR}"
  File /oname=$PLUGINSDIR\pg-btn-back.bmp "${BUILD_RESOURCES_DIR}\btn-back.bmp"
  File /oname=$PLUGINSDIR\pg-btn-next.bmp "${BUILD_RESOURCES_DIR}\btn-next.bmp"
  File /oname=$PLUGINSDIR\pg-btn-cancel.bmp "${BUILD_RESOURCES_DIR}\btn-cancel.bmp"
  !ifndef BUILD_UNINSTALLER
    File /oname=$PLUGINSDIR\pg-btn-install.bmp "${BUILD_RESOURCES_DIR}\btn-install.bmp"
    File /oname=$PLUGINSDIR\pg-btn-finish.bmp "${BUILD_RESOURCES_DIR}\btn-finish.bmp"
  !else
    File /oname=$PLUGINSDIR\pg-btn-close.bmp "${BUILD_RESOURCES_DIR}\btn-close.bmp"
  !endif
!macroend

!macro PG_LOAD_BITMAP FILE OUT
  System::Call 'user32::LoadImage(p0, t "$PLUGINSDIR\\${FILE}", i ${IMAGE_BITMAP}, i 0, i 0, i ${LR_LOADFROMFILE}|${LR_CREATEDIBSECTION})p.s'
  Pop ${OUT}
!macroend

!macro PG_SKIN_BUTTON HANDLE IMAGE
  ${NSD_AddStyle} ${HANDLE} ${BS_BITMAP}|${BS_FLAT}
  SendMessage ${HANDLE} ${BM_SETIMAGE} ${IMAGE_BITMAP} ${IMAGE}
!macroend

!macro PG_LOAD_BUTTON_IMAGES
  !insertmacro PG_LOAD_BITMAP "pg-btn-back.bmp" $PG.BtnBackBmp
  !insertmacro PG_LOAD_BITMAP "pg-btn-next.bmp" $PG.BtnNextBmp
  !insertmacro PG_LOAD_BITMAP "pg-btn-cancel.bmp" $PG.BtnCancelBmp
  !ifndef BUILD_UNINSTALLER
    !insertmacro PG_LOAD_BITMAP "pg-btn-install.bmp" $PG.BtnInstallBmp
    !insertmacro PG_LOAD_BITMAP "pg-btn-finish.bmp" $PG.BtnFinishBmp
  !else
    !insertmacro PG_LOAD_BITMAP "pg-btn-close.bmp" $PG.BtnCloseBmp
  !endif
!macroend


!macro PG_FULLWINDOW
  ; A custom full-window page must hide the MUI header/branding controls itself.
  ; Otherwise the previous InstFiles header remains visible behind the new page.
  LockWindow on
  ShowWindow $mui.Branding.Background ${SW_HIDE}
  ShowWindow $mui.Branding.Text ${SW_HIDE}
  ShowWindow $mui.Header.Text ${SW_HIDE}
  ShowWindow $mui.Header.SubText ${SW_HIDE}
  ShowWindow $mui.Header.Image ${SW_HIDE}
  ShowWindow $mui.Line.Standard ${SW_HIDE}
  ShowWindow $mui.Line.FullWindow ${SW_SHOW}
  LockWindow off
!macroend

!macro PG_CHROME PREFIX PRIMARY BACK CANCEL
  StrCpy $R1 1
  System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 20, *i r1, i 4)i .r2'
  StrCmp $R2 0 +2
  System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 19, *i r1, i 4)i .r2'
  StrCpy $R5 ${PG_BG_COLORREF}
  System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 35, *i r5, i 4)i .r2'
  StrCpy $R5 ${PG_TEXT_COLORREF}
  System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 36, *i r5, i 4)i .r2'
  StrCpy $R5 ${PG_BORDER_COLORREF}
  System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 34, *i r5, i 4)i .r2'
  SetCtlColors $HWNDPARENT ${PG_TEXT} ${PG_BG}

  ; Keep all wizard chrome legible and remove MUI's separate branding strip.
  GetDlgItem $R5 $HWNDPARENT 1037
  ${If} $R5 != 0
    SendMessage $R5 ${WM_SETFONT} $PG.FontSub 1
    SetCtlColors $R5 ${PG_TEXT} transparent
  ${EndIf}
  GetDlgItem $R5 $HWNDPARENT 1038
  ${If} $R5 != 0
    SendMessage $R5 ${WM_SETFONT} $PG.FontHeader 1
    SetCtlColors $R5 ${PG_MUTED} transparent
  ${EndIf}
  GetDlgItem $R5 $HWNDPARENT 1028
  ${If} $R5 != 0
    ShowWindow $R5 ${SW_HIDE}
  ${EndIf}
  GetDlgItem $R5 $HWNDPARENT 1256
  ${If} $R5 != 0
    ShowWindow $R5 ${SW_HIDE}
  ${EndIf}
  GetDlgItem $R5 $HWNDPARENT 1035
  ${If} $R5 != 0
    SetCtlColors $R5 ${PG_BORDER} ${PG_BORDER}
  ${EndIf}
  GetDlgItem $R5 $HWNDPARENT 1045
  ${If} $R5 != 0
    SetCtlColors $R5 ${PG_BORDER} ${PG_BORDER}
  ${EndIf}

  GetDlgItem $R2 $HWNDPARENT 1
  GetDlgItem $R3 $HWNDPARENT 3
  GetDlgItem $R4 $HWNDPARENT 2
  ShowWindow $R2 ${PRIMARY}
  ShowWindow $R3 ${BACK}
  ShowWindow $R4 ${CANCEL}
  !insertmacro PG_SKIN_BUTTON $R2 $PG.BtnNextBmp
  !insertmacro PG_SKIN_BUTTON $R3 $PG.BtnBackBmp
  !insertmacro PG_SKIN_BUTTON $R4 $PG.BtnCancelBmp
!macroend

!ifndef BUILD_UNINSTALLER

Function PG_CreateFonts
  CreateFont $PG.FontTitle "Segoe UI" 15 700
  CreateFont $PG.FontSub "Segoe UI" 10 600
  CreateFont $PG.FontBody "Segoe UI" 10 400
  CreateFont $PG.FontHeader "Segoe UI" 9 400
FunctionEnd

Function PG_WelcomePre
  ; The flag is populated by customInit after Electron Builder has loaded UAC.nsh.
  ; Elevated inner instances skip the pages already shown by the outer process.
  StrCmp $PG.IsInner "1" PG_WelcomeSkip
  Return
PG_WelcomeSkip:
  Abort
FunctionEnd
Function PG_WelcomeShow
  !insertmacro PG_CHROME welcome ${SW_SHOW} ${SW_HIDE} ${SW_SHOW}
FunctionEnd

Function PG_ScopePaint
  ${If} $PG.Scope == "all"
    SetCtlColors $PG.ScopeCurrent ${PG_MUTED} ${PG_BG}
    SetCtlColors $PG.ScopeAll ${PG_ACCENT} ${PG_BG}
    ${NSD_SetText} $PG.ScopeCurrent "  CURRENT USER  ·  Recommended — no administrator permission required"
    ${NSD_SetText} $PG.ScopeAll "● ALL USERS  ·  Selected — Windows administrator permission will be requested"
  ${Else}
    SetCtlColors $PG.ScopeCurrent ${PG_ACCENT} ${PG_BG}
    SetCtlColors $PG.ScopeAll ${PG_MUTED} ${PG_BG}
    ${NSD_SetText} $PG.ScopeCurrent "● CURRENT USER  ·  Selected — recommended for this local tracker"
    ${NSD_SetText} $PG.ScopeAll "  ALL USERS  ·  Install for everyone on this computer"
  ${EndIf}
FunctionEnd
Function PG_SelectCurrent
  StrCpy $PG.Scope "current"
  Call PG_ScopePaint
FunctionEnd
Function PG_SelectAll
  StrCpy $PG.Scope "all"
  Call PG_ScopePaint
FunctionEnd

Function PG_ScopeCreate
  StrCmp $PG.IsInner "1" PG_ScopeSkip
  Goto PG_ScopeContinue
PG_ScopeSkip:
  Abort
PG_ScopeContinue:
  !insertmacro MUI_HEADER_TEXT "Installation scope" "Choose who can use the tracker"
  nsDialogs::Create 1018
  Pop $PG.Dialog
  ${If} $PG.Dialog == error
    Abort
  ${EndIf}
  SetCtlColors $PG.Dialog ${PG_TEXT} ${PG_BG}
  ${NSD_CreateLabel} 0 0 100% 100% ""
  Pop $R0
  SetCtlColors $R0 ${PG_TEXT} ${PG_BG}
  ${NSD_CreateLabel} 5% 8% 90% 12% "Choose an installation scope"
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontTitle 1
  SetCtlColors $R0 ${PG_TEXT} ${PG_BG}
  ${NSD_CreateLabel} 5% 23% 90% 14% "The tracker is read-only. Current user avoids UAC; all users installs machine-wide."
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontBody 1
  SetCtlColors $R0 ${PG_MUTED} ${PG_BG}
  ${NSD_CreateLabel} 5% 43% 90% 16% ""
  Pop $PG.ScopeCurrent
  SendMessage $PG.ScopeCurrent ${WM_SETFONT} $PG.FontSub 1
  ${NSD_OnClick} $PG.ScopeCurrent PG_SelectCurrent
  ${NSD_CreateLabel} 5% 64% 90% 16% ""
  Pop $PG.ScopeAll
  SendMessage $PG.ScopeAll ${WM_SETFONT} $PG.FontSub 1
  ${NSD_OnClick} $PG.ScopeAll PG_SelectAll
  Call PG_ScopePaint
  !insertmacro PG_CHROME scope ${SW_SHOW} ${SW_SHOW} ${SW_SHOW}
  nsDialogs::Show
FunctionEnd

Function PG_DirectoryBrowse
  nsDialogs::SelectFolderDialog "Choose the Days Gone Achievement Tracker installation folder" "$INSTDIR"
  Pop $R0
  ${If} $R0 != error
  ${AndIf} $R0 != ""
    StrCpy $INSTDIR $R0
    ${NSD_SetText} $PG.PathLabel "$INSTDIR"
  ${EndIf}
FunctionEnd

Function PG_DirectoryCreate
  !insertmacro MUI_HEADER_TEXT "Install location" "Choose an installation folder"
  nsDialogs::Create 1018
  Pop $PG.Dialog
  ${If} $PG.Dialog == error
    Abort
  ${EndIf}
  SetCtlColors $PG.Dialog ${PG_TEXT} ${PG_BG}
  ${NSD_CreateLabel} 0 0 100% 100% ""
  Pop $R0
  SetCtlColors $R0 ${PG_TEXT} ${PG_BG}
  ${NSD_CreateLabel} 5% 8% 90% 12% "INSTALL LOCATION"
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontTitle 1
  SetCtlColors $R0 ${PG_TEXT} ${PG_BG}
  ${NSD_CreateLabel} 5% 25% 90% 12% "The application will be installed to:"
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontBody 1
  SetCtlColors $R0 ${PG_MUTED} ${PG_BG}
  ${NSD_CreateLabel} 5% 40% 90% 17% "$INSTDIR"
  Pop $PG.PathLabel
  SendMessage $PG.PathLabel ${WM_SETFONT} $PG.FontBody 1
  SetCtlColors $PG.PathLabel ${PG_TEXT} ${PG_BG}
  ${NSD_CreateLabel} 5% 62% 34% 13% "CHANGE FOLDER"
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontSub 1
  SetCtlColors $R0 ${PG_ACCENT} ${PG_BG}
  ${NSD_OnClick} $R0 PG_DirectoryBrowse
  ${NSD_CreateLabel} 5% 81% 90% 10% "No game files, saves or Steam achievement data are modified."
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontBody 1
  SetCtlColors $R0 ${PG_MUTED} ${PG_BG}

  !insertmacro PG_CHROME dir ${SW_SHOW} ${SW_SHOW} ${SW_SHOW}
  GetDlgItem $R0 $HWNDPARENT 1
  !insertmacro PG_SKIN_BUTTON $R0 $PG.BtnInstallBmp
  nsDialogs::Show
FunctionEnd

Function PG_StyleInstFiles
  FindWindow $R0 "#32770" "" $HWNDPARENT
  ${If} $R0 == 0
    Return
  ${EndIf}
  SetCtlColors $R0 ${PG_TEXT} ${PG_BG}

  ; The native InstFiles status label is intentionally hidden. Electron Builder/
  ; MUI moves this text during completion, which previously caused it to overlap
  ; the bespoke header. The progress bar and our header provide the status instead.
  GetDlgItem $R1 $R0 1006
  ${If} $R1 != 0
    ShowWindow $R1 ${SW_HIDE}
  ${EndIf}
  GetDlgItem $R1 $R0 1016
  ${If} $R1 != 0
    ShowWindow $R1 ${SW_HIDE}
  ${EndIf}
  FindWindow $R1 "SysListView32" "" $R0
  ${If} $R1 != 0
    ShowWindow $R1 ${SW_HIDE}
  ${EndIf}
  GetDlgItem $R1 $R0 1004
  ${If} $R1 != 0
    System::Call 'uxtheme::SetWindowTheme(p $R1, w "", w "")i .r2'
    SendMessage $R1 0x2001 0 ${PG_PROGRESS_BG_COLORREF}
    SendMessage $R1 0x0409 0 ${PG_ACCENT_COLORREF}
  ${EndIf}

  ; During the copy stage there is only one meaningful action: Cancel.
  ; Back and Next stay hidden until NSIS confirms installation is complete.
  !insertmacro PG_CHROME inst ${SW_HIDE} ${SW_HIDE} ${SW_SHOW}
  GetDlgItem $R1 $HWNDPARENT 1
  !insertmacro PG_SKIN_BUTTON $R1 $PG.BtnNextBmp

  ; Keep the header deliberately short. The progress area communicates the stage.
  GetDlgItem $R1 $HWNDPARENT 1037
  ${If} $R1 != 0
    ${NSD_SetText} $R1 "Installing Project Gone"
  ${EndIf}
  GetDlgItem $R1 $HWNDPARENT 1038
  ${If} $R1 != 0
    ${NSD_SetText} $R1 "Copying application files"
  ${EndIf}
FunctionEnd

Function PG_WaitForPreviousInstallRelease
  ; Electron Builder waits for the previous uninstaller process, but Windows can
  ; keep its installed executable delete-pending briefly after that process exits.
  ; Wait for the old uninstaller path in the selected install directory to clear
  ; before the replacement payload is extracted.
  StrCpy $PG.UpgradeSettleCount 0

PG_UpgradeSettleLoop:
  IfFileExists "$INSTDIR\${PG_UNINSTALL_FILENAME}" 0 PG_UpgradeSettleDone
  IntOp $PG.UpgradeSettleCount $PG.UpgradeSettleCount + 1
  IntCmp $PG.UpgradeSettleCount 60 PG_UpgradeSettleTimeout 0 PG_UpgradeSettleTimeout
  Sleep 250
  Goto PG_UpgradeSettleLoop

PG_UpgradeSettleTimeout:
  ; One final delete can finish cleanup once the kernel handle has gone away.
  ClearErrors
  Delete "$INSTDIR\${PG_UNINSTALL_FILENAME}"
  IfErrors 0 PG_UpgradeSettleDone

  MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Project Gone is still finishing removal of the previous version.$\r$\n$\r$\nSelect Retry to wait a little longer, or Cancel to stop Setup safely." /SD IDRETRY IDRETRY PG_UpgradeSettleRetry
  Quit

PG_UpgradeSettleRetry:
  StrCpy $PG.UpgradeSettleCount 0
  Sleep 500
  Goto PG_UpgradeSettleLoop

PG_UpgradeSettleDone:
  ; A short final settle period covers Windows delete-pending cleanup. Restore the
  ; selected installation directory as NSIS' active output path before extraction.
  Sleep 500
  SetOutPath "$INSTDIR"
FunctionEnd

Function PG_InstallCompleted
  ; Called synchronously from Electron Builder's customInstall hook, after the
  ; payload, registry data and shortcuts have been written. Do not use an
  ; nsDialogs timer here: asynchronous timer callbacks share NSIS registers and
  ; can corrupt Electron Builder's extraction/uninstall routines mid-operation.
  GetDlgItem $R0 $HWNDPARENT 1
  ${If} $R0 != 0
    ShowWindow $R0 ${SW_SHOW}
    EnableWindow $R0 1
    !insertmacro PG_SKIN_BUTTON $R0 $PG.BtnNextBmp
  ${EndIf}
  GetDlgItem $R1 $HWNDPARENT 3
  ${If} $R1 != 0
    ShowWindow $R1 ${SW_HIDE}
    EnableWindow $R1 0
  ${EndIf}
  GetDlgItem $R1 $HWNDPARENT 2
  ${If} $R1 != 0
    ShowWindow $R1 ${SW_HIDE}
    EnableWindow $R1 0
  ${EndIf}
  GetDlgItem $R2 $HWNDPARENT 1037
  ${If} $R2 != 0
    ${NSD_SetText} $R2 "Installation complete"
  ${EndIf}
  GetDlgItem $R2 $HWNDPARENT 1038
  ${If} $R2 != 0
    ${NSD_SetText} $R2 "Select Next for final options"
  ${EndIf}
FunctionEnd

Function PG_InstFilesShow
  ; Initial state: installation is active, so Cancel is the only action shown.
  ; The customInstall hook calls PG_InstallCompleted synchronously when done.
  Call PG_StyleInstFiles
FunctionEnd

Function PG_LaunchPaint
  ${If} $PG.LaunchNow == "1"
    ${NSD_SetText} $PG.LaunchToggle "●  OPEN PROJECT GONE NOW"
    SetCtlColors $PG.LaunchToggle ${PG_ACCENT} ${PG_BG}
  ${Else}
    ${NSD_SetText} $PG.LaunchToggle "○  OPEN PROJECT GONE NOW"
    SetCtlColors $PG.LaunchToggle ${PG_MUTED} ${PG_BG}
  ${EndIf}
FunctionEnd

Function PG_ToggleLaunch
  ${If} $PG.LaunchNow == "1"
    StrCpy $PG.LaunchNow "0"
  ${Else}
    StrCpy $PG.LaunchNow "1"
  ${EndIf}
  Call PG_LaunchPaint
FunctionEnd

Function PG_FinishCreate
  nsDialogs::Create 1044
  Pop $PG.Dialog
  ${If} $PG.Dialog == error
    Abort
  ${EndIf}
  SetCtlColors $PG.Dialog ${PG_TEXT} ${PG_BG}
  ${NSD_CreateLabel} 0 0 100% 100% ""
  Pop $R0
  SetCtlColors $R0 ${PG_TEXT} ${PG_BG}
  ${NSD_CreateBitmap} 0 0 34% 100% ""
  Pop $PG.Sidebar
  ${NSD_SetStretchedImage} $PG.Sidebar "$PLUGINSDIR\pg-sidebar.bmp" $PG.SidebarHandle

  ; This is a true full-window completion page. The standard MUI header is
  ; removed entirely so no previous-page title/subtitle can bleed through.
  !insertmacro PG_FULLWINDOW

  ${NSD_CreateLabel} 39% 13% 56% 12% "INSTALLATION COMPLETE"
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontTitle 1
  SetCtlColors $R0 ${PG_TEXT} ${PG_BG}

  ${NSD_CreateLabel} 39% 31% 54% 19% "Project Gone is installed and ready to use.$\r$\n$\r$\nGame files, saves and Steam data were not modified."
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontBody 1
  SetCtlColors $R0 ${PG_TEXT} ${PG_BG}

  ${NSD_CreateLabel} 39% 58% 54% 8% "When Setup closes:"
  Pop $R0
  SendMessage $R0 ${WM_SETFONT} $PG.FontBody 1
  SetCtlColors $R0 ${PG_MUTED} ${PG_BG}

  ${NSD_CreateLabel} 39% 68% 54% 12% ""
  Pop $PG.LaunchToggle
  SendMessage $PG.LaunchToggle ${WM_SETFONT} $PG.FontSub 1
  ${NSD_OnClick} $PG.LaunchToggle PG_ToggleLaunch
  StrCpy $PG.LaunchNow "1"
  Call PG_LaunchPaint

  ; Final page has one navigation action only: Finish.
  !insertmacro PG_CHROME finish ${SW_SHOW} ${SW_HIDE} ${SW_HIDE}
  !insertmacro PG_FULLWINDOW
  GetDlgItem $R0 $HWNDPARENT 1
  EnableWindow $R0 1
  ShowWindow $R0 ${SW_SHOW}
  !insertmacro PG_SKIN_BUTTON $R0 $PG.BtnFinishBmp
  nsDialogs::Show
  ${NSD_FreeImage} $PG.SidebarHandle
FunctionEnd

Function PG_FinishLeave
  ; Defer launch until the installer GUI is actually gone. Launching from the
  ; page-leave callback caused a first-run race where the app could open while
  ; Setup was still finalising and then close again.
  StrCpy $PG.LaunchOnExit $PG.LaunchNow
FunctionEnd

Function .onGUIEnd
  StrCmp $PG.IsInner "1" PG_GUIEndDone
  StrCmp $PG.LaunchOnExit "1" 0 PG_GUIEndDone
  IfFileExists "$INSTDIR\${PRODUCT_FILENAME}.exe" 0 PG_GUIEndDone
  SetOutPath "$INSTDIR"
  Sleep 150
  ExecShell "open" "$INSTDIR\${PRODUCT_FILENAME}.exe"
PG_GUIEndDone:
FunctionEnd

!endif ; !BUILD_UNINSTALLER — end installer-only function definitions

!macro customHeader
  !ifdef BUILD_UNINSTALLER
    Caption "Days Gone Achievement Tracker — Uninstall"
  !else
    Caption "Days Gone Achievement Tracker — Setup"
  !endif
  BrandingText "Project Gone · Days Gone Achievement Tracker · Phil Forster"
!macroend

!macro customInstallMode
  !ifdef BUILD_UNINSTALLER
    ${If} $installMode == "all"
      StrCpy $isForceMachineInstall "1"
    ${Else}
      StrCpy $isForceCurrentInstall "1"
    ${EndIf}
  !else
    ${If} $PG.Scope == "all"
      StrCpy $isForceMachineInstall "1"
    ${Else}
      StrCpy $isForceCurrentInstall "1"
    ${EndIf}
  !endif
!macroend

!ifndef BUILD_UNINSTALLER
  !macro customInit
    ; customInit is expanded from Electron Builder's .onInit after UAC.nsh and
    ; its plug-in path are available. Capture the inner/outer state here, then
    ; let top-level page functions use only our own variable.
    StrCpy $PG.IsInner "0"
    StrCpy $PG.LaunchOnExit "0"
    ${If} ${UAC_IsInnerInstance}
      StrCpy $PG.IsInner "1"
    ${EndIf}

    ; Respect an existing install mode on upgrades/reinstalls.
    ${If} $installMode == "all"
      StrCpy $PG.Scope "all"
    ${Else}
      StrCpy $PG.Scope "current"
    ${EndIf}

    !insertmacro PG_EXTRACT_UI "installerSidebar.bmp"
    !insertmacro PG_LOAD_BUTTON_IMAGES
    Call PG_CreateFonts
  !macroend
  !macro customWelcomePage
    !define MUI_WELCOMEPAGE_TITLE "Enter Project Gone"
    !define MUI_WELCOMEPAGE_TEXT "Install the local, read-only Days Gone achievement tracker.$\r$\n$\r$\nIt reads Steam achievement state, exact counters and optional save context without altering Days Gone or Steam.$\r$\n$\r$\nSelect Next to continue."
    !define MUI_PAGE_CUSTOMFUNCTION_PRE PG_WelcomePre
    !define MUI_PAGE_CUSTOMFUNCTION_SHOW PG_WelcomeShow
    !insertmacro MUI_PAGE_WELCOME
    Page custom PG_ScopeCreate
  !macroend
  !macro customPageAfterChangeDir
    Page custom PG_DirectoryCreate
    !define MUI_PAGE_CUSTOMFUNCTION_SHOW PG_InstFilesShow
  !macroend
  !macro customInstall
    ; This hook is expanded at the end of Electron Builder's install section.
    ; Update the wizard synchronously only after Electron Builder is finished.
    Call PG_InstallCompleted
  !macroend
  !macro customUnInstallCheck
    ; Electron Builder calls this immediately after the previous version's
    ; uninstaller returns during a same-scope reinstall/upgrade.
    ${If} $R0 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION "The previous Project Gone installation could not be removed cleanly (error $R0). Setup will close without changing the existing installation." /SD IDOK
      Quit
    ${EndIf}
    Call PG_WaitForPreviousInstallRelease
  !macroend
  !macro customUnInstallCheckCurrentUser
    ; Same gate when an all-users install is replacing a prior per-user install.
    ${If} $R0 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION "The previous Project Gone installation could not be removed cleanly (error $R0). Setup will close without changing the existing installation." /SD IDOK
      Quit
    ${EndIf}
    Call PG_WaitForPreviousInstallRelease
  !macroend
  !macro customFinishPage
    Page custom PG_FinishCreate PG_FinishLeave
  !macroend
!else
  Function un.PG_CreateFonts
    CreateFont $PG.FontTitle "Segoe UI" 15 700
    CreateFont $PG.FontSub "Segoe UI" 10 600
    CreateFont $PG.FontBody "Segoe UI" 10 400
    CreateFont $PG.FontHeader "Segoe UI" 9 400
  FunctionEnd
  Function un.PG_StyleInstFiles
    FindWindow $R0 "#32770" "" $HWNDPARENT
    ${If} $R0 == 0
      Return
    ${EndIf}
    SetCtlColors $R0 ${PG_TEXT} ${PG_BG}
    GetDlgItem $R1 $R0 1006
    ${If} $R1 != 0
      ShowWindow $R1 ${SW_HIDE}
    ${EndIf}
    GetDlgItem $R1 $R0 1016
    ${If} $R1 != 0
      ShowWindow $R1 ${SW_HIDE}
    ${EndIf}
    FindWindow $R1 "SysListView32" "" $R0
    ${If} $R1 != 0
      ShowWindow $R1 ${SW_HIDE}
    ${EndIf}
    GetDlgItem $R1 $R0 1004
    ${If} $R1 != 0
      System::Call 'uxtheme::SetWindowTheme(p $R1, w "", w "")i .r2'
      SendMessage $R1 0x2001 0 ${PG_PROGRESS_BG_COLORREF}
      SendMessage $R1 0x0409 0 ${PG_ACCENT_COLORREF}
    ${EndIf}
    ; Keep Next visible but let MUI own its enabled state. During removal it is
    ; disabled; when the native InstFiles page completes it becomes enabled.
    ; No asynchronous timer is used, so Electron Builder's working registers are
    ; never clobbered while files/registry entries are being removed.
    !insertmacro PG_CHROME uninst ${SW_SHOW} ${SW_HIDE} ${SW_SHOW}
    GetDlgItem $R1 $HWNDPARENT 1
    !insertmacro PG_SKIN_BUTTON $R1 $PG.BtnNextBmp

    GetDlgItem $R1 $HWNDPARENT 1037
    ${If} $R1 != 0
      ${NSD_SetText} $R1 "Removing Project Gone"
    ${EndIf}
    GetDlgItem $R1 $HWNDPARENT 1038
    ${If} $R1 != 0
      ${NSD_SetText} $R1 "Removing application files"
    ${EndIf}
  FunctionEnd
  Function un.PG_WelcomePre
    StrCmp $PG.IsInner "1" un.PG_WelcomeSkip
    Return
  un.PG_WelcomeSkip:
    Abort
  FunctionEnd
  Function un.PG_WelcomeShow
    !insertmacro PG_CHROME unwelcome ${SW_SHOW} ${SW_HIDE} ${SW_SHOW}
  FunctionEnd
  Function un.PG_FinishCreate
    nsDialogs::Create 1044
    Pop $PG.Dialog
    ${If} $PG.Dialog == error
      Abort
    ${EndIf}
    SetCtlColors $PG.Dialog ${PG_TEXT} ${PG_BG}
    ${NSD_CreateLabel} 0 0 100% 100% ""
    Pop $R0
    SetCtlColors $R0 ${PG_TEXT} ${PG_BG}
    ${NSD_CreateBitmap} 0 0 34% 100% ""
    Pop $PG.Sidebar
    ${NSD_SetStretchedImage} $PG.Sidebar "$PLUGINSDIR\pg-sidebar.bmp" $PG.SidebarHandle

    !insertmacro PG_FULLWINDOW

    ${NSD_CreateLabel} 39% 15% 56% 13% "TRACKER REMOVED"
    Pop $R0
    SendMessage $R0 ${WM_SETFONT} $PG.FontTitle 1
    SetCtlColors $R0 ${PG_TEXT} ${PG_BG}
    ${NSD_CreateLabel} 39% 34% 54% 24% "Project Gone has been removed.$\r$\n$\r$\nDays Gone saves, game files and Steam achievement data were not changed or deleted."
    Pop $R0
    SendMessage $R0 ${WM_SETFONT} $PG.FontBody 1
    SetCtlColors $R0 ${PG_TEXT} ${PG_BG}

    ; Final uninstall page has one action only: Close.
    !insertmacro PG_CHROME unfinish ${SW_SHOW} ${SW_HIDE} ${SW_HIDE}
    !insertmacro PG_FULLWINDOW
    GetDlgItem $R0 $HWNDPARENT 1
    EnableWindow $R0 1
    ShowWindow $R0 ${SW_SHOW}
    !insertmacro PG_SKIN_BUTTON $R0 $PG.BtnCloseBmp
    nsDialogs::Show
    ${NSD_FreeImage} $PG.SidebarHandle
  FunctionEnd
  Function un.PG_SkipDefaultFinish
    Abort
  FunctionEnd
  !macro customUnInit
    ; As with customInit, defer UAC state inspection until Electron Builder has
    ; loaded the UAC include and plug-in path.
    StrCpy $PG.IsInner "0"
    ${If} ${UAC_IsInnerInstance}
      StrCpy $PG.IsInner "1"
    ${EndIf}
    !insertmacro PG_EXTRACT_UI "uninstallerSidebar.bmp"
    !insertmacro PG_LOAD_BUTTON_IMAGES
    Call un.PG_CreateFonts
  !macroend
  !macro customUnWelcomePage
    !define MUI_WELCOMEPAGE_TITLE "Leave Project Gone"
    !define MUI_WELCOMEPAGE_TEXT "Remove Days Gone Achievement Tracker from this computer.$\r$\n$\r$\nYour Days Gone saves, game files and Steam achievement data will not be changed or deleted.$\r$\n$\r$\nSelect Next to continue."
    !define MUI_PAGE_CUSTOMFUNCTION_PRE un.PG_WelcomePre
    !define MUI_PAGE_CUSTOMFUNCTION_SHOW un.PG_WelcomeShow
    !insertmacro MUI_UNPAGE_WELCOME
    ; MUI consumes/clears page custom-function defines per page. Define the show
    ; callback after the welcome page so it applies to the following InstFiles page.
    !define MUI_PAGE_CUSTOMFUNCTION_SHOW un.PG_StyleInstFiles
  !macroend
  !macro customUninstallPage
    UninstPage custom un.PG_FinishCreate
    !define MUI_PAGE_CUSTOMFUNCTION_PRE un.PG_SkipDefaultFinish
  !macroend
!endif
