; Days Gone Achievement Tracker — branded assisted NSIS presentation
; -----------------------------------------------------------------------------
; Presentation only: Electron Builder retains install/uninstall mechanics,
; shortcut creation, elevation, registry handling and payload management.

!include "nsDialogs.nsh"
!include "WinMessages.nsh"

; Palette shared with the application UI.
!define SOTF_BG "1B1C19"
!define SOTF_BG_DEEP "10110F"
!define SOTF_SURFACE "25251F"
!define SOTF_FIELD "151510"
!define SOTF_TEXT "EEE8DC"
!define SOTF_MUTED "AAA294"
!define SOTF_ACCENT "C56B36"
!define SOTF_BORDER "494238"

; Modern UI welcome/finish surfaces.
!ifdef MUI_BGCOLOR
  !undef MUI_BGCOLOR
!endif
!define MUI_BGCOLOR "${SOTF_BG}"

!ifdef MUI_TEXTCOLOR
  !undef MUI_TEXTCOLOR
!endif
!define MUI_TEXTCOLOR "${SOTF_TEXT}"

; Installation details / progress treatment.
!ifdef MUI_INSTFILESPAGE_COLORS
  !undef MUI_INSTFILESPAGE_COLORS
!endif
!define MUI_INSTFILESPAGE_COLORS "${SOTF_TEXT} ${SOTF_FIELD}"

!ifdef MUI_INSTFILESPAGE_PROGRESSBAR
  !undef MUI_INSTFILESPAGE_PROGRESSBAR
!endif
!define MUI_INSTFILESPAGE_PROGRESSBAR "colored"

!ifdef MUI_INSTALLCOLORS
  !undef MUI_INSTALLCOLORS
!endif
!define MUI_INSTALLCOLORS "${SOTF_ACCENT} 252C27"

; Explicit wording for the finish-page checkbox. This avoids an unexplained
; native checkbox and makes the action clear to the user.
!ifdef MUI_FINISHPAGE_RUN_TEXT
  !undef MUI_FINISHPAGE_RUN_TEXT
!endif
!define MUI_FINISHPAGE_RUN_TEXT "Launch Days Gone Achievement Tracker"

; Dedicated uninstaller header. Sidebar artwork and icons are configured by
; Electron Builder in package.json.
!ifdef MUI_HEADERIMAGE_UNBITMAP
  !undef MUI_HEADERIMAGE_UNBITMAP
!endif
!define MUI_HEADERIMAGE_UNBITMAP "${BUILD_RESOURCES_DIR}\uninstallerHeader.bmp"

; Deliberate exit warnings.
!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT "Exit Days Gone Achievement Tracker Setup?$\r$\n$\r$\nThe application has not finished installing."
!define MUI_UNABORTWARNING
!define MUI_UNABORTWARNING_TEXT "Exit the Days Gone Achievement Tracker uninstaller?$\r$\n$\r$\nThe removal process has not finished."

; -----------------------------------------------------------------------------
; Runtime colour pass
; -----------------------------------------------------------------------------
; Modern UI styles the welcome/finish pages, while assisted-installer pages
; (install mode, directory, progress and uninstall equivalents) are native
; Win32 dialogs. A lightweight timer reapplies the same palette after page
; creation so *every* installer/uninstaller pane is covered, including pages
; that Electron Builder creates outside the normal MUI page macros.
;
; Installer and uninstaller are compiled in separate NSIS passes. Keep their
; callbacks isolated to avoid dead-function warnings being promoted to errors.

; COLORREF values are BGR (00BBGGRR), not CSS RGB.
!define SOTF_ACCENT_COLORREF 0x00366BC5 ; #C56B36
!define SOTF_PROGRESS_BG_COLORREF 0x001F2525 ; #25251F
!define SOTF_FIELD_COLORREF 0x00101515 ; #151510

!ifdef BUILD_UNINSTALLER
  Function un.SOTF_ThemeWizardChrome
    ; Windows 10/11 native dark caption request. Attribute 20 is current;
    ; 19 remains as a compatibility fallback on older Windows 10 builds.
    StrCpy $R1 1
    System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 20, *i r1, i 4)i .r2'
    StrCmp $R2 0 +2
    System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 19, *i r1, i 4)i .r2'

    System::Call 'uxtheme::SetWindowTheme(p $HWNDPARENT, w "DarkMode_Explorer", w "")i .r0'
    SendMessage $HWNDPARENT 0x031A 0 0
    SetCtlColors $HWNDPARENT ${SOTF_TEXT} ${SOTF_BG_DEEP}

    ; Header/footer labels, including BrandingText.
    FindWindow $R7 "Static" "" $HWNDPARENT
    un_chrome_static_loop:
      StrCmp $R7 0 un_chrome_static_done
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_BG_DEEP}
      FindWindow $R7 "Static" "" $HWNDPARENT $R7
      Goto un_chrome_static_loop
    un_chrome_static_done:

    ; Back / Next / Cancel. Use the Windows dark Explorer visual style so
    ; the controls remain native but no longer clash with the road palette.
    FindWindow $R7 "Button" "" $HWNDPARENT
    un_chrome_button_loop:
      StrCmp $R7 0 un_chrome_button_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_SURFACE}
      FindWindow $R7 "Button" "" $HWNDPARENT $R7
      Goto un_chrome_button_loop
    un_chrome_button_done:
  FunctionEnd

  Function un.SOTF_ThemeCurrentPage
    ; Always refresh the outer chrome first; MUI recreates some controls as
    ; pages change and the first timer tick can occur before a page exists.
    Call un.SOTF_ThemeWizardChrome

    FindWindow $R9 "#32770" "" $HWNDPARENT
    StrCmp $R9 0 un_page_done
    System::Call 'uxtheme::SetWindowTheme(p $R9, w "DarkMode_Explorer", w "")i .r0'
    SendMessage $R9 0x031A 0 0
    SetCtlColors $R9 ${SOTF_TEXT} ${SOTF_BG}

    ; Body copy, headings and explanatory labels.
    FindWindow $R7 "Static" "" $R9
    un_page_static_loop:
      StrCmp $R7 0 un_page_static_done
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_BG}
      FindWindow $R7 "Static" "" $R9 $R7
      Goto un_page_static_loop
    un_page_static_done:

    ; Radio buttons, checkboxes and page-local buttons use the native dark theme.
    FindWindow $R7 "Button" "" $R9
    un_page_button_loop:
      StrCmp $R7 0 un_page_button_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_BG}
      FindWindow $R7 "Button" "" $R9 $R7
      Goto un_page_button_loop
    un_page_button_done:

    ; Directory fields and native text/detail controls.
    FindWindow $R7 "Edit" "" $R9
    un_page_edit_loop:
      StrCmp $R7 0 un_page_edit_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_FIELD}
      FindWindow $R7 "Edit" "" $R9 $R7
      Goto un_page_edit_loop
    un_page_edit_done:

    FindWindow $R7 "ListBox" "" $R9
    un_page_list_loop:
      StrCmp $R7 0 un_page_list_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_FIELD}
      FindWindow $R7 "ListBox" "" $R9 $R7
      Goto un_page_list_loop
    un_page_list_done:

    FindWindow $R7 "RichEdit20W" "" $R9
    un_page_rich_loop:
      StrCmp $R7 0 un_page_rich_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_FIELD}
      FindWindow $R7 "RichEdit20W" "" $R9 $R7
      Goto un_page_rich_loop
    un_page_rich_done:

    ; Progress bars use the same survival green as the application.
    FindWindow $R7 "msctls_progress32" "" $R9
    un_page_progress_loop:
      StrCmp $R7 0 un_page_progress_done
      SendMessage $R7 0x2001 0 ${SOTF_PROGRESS_BG_COLORREF}
      SendMessage $R7 0x0409 0 ${SOTF_ACCENT_COLORREF}
      FindWindow $R7 "msctls_progress32" "" $R9 $R7
      Goto un_page_progress_loop
    un_page_progress_done:

    un_page_done:
  FunctionEnd

  Function un.SOTF_ThemeTick
    Call un.SOTF_ThemeCurrentPage
  FunctionEnd

  Function un.SOTF_GUIInit
    Call un.SOTF_ThemeCurrentPage
    ${NSD_CreateTimer} un.SOTF_ThemeTick 120
  FunctionEnd

  !define MUI_CUSTOMFUNCTION_UNGUIINIT un.SOTF_GUIInit
!else
  Function SOTF_ThemeWizardChrome
    StrCpy $R1 1
    System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 20, *i r1, i 4)i .r2'
    StrCmp $R2 0 +2
    System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 19, *i r1, i 4)i .r2'

    System::Call 'uxtheme::SetWindowTheme(p $HWNDPARENT, w "DarkMode_Explorer", w "")i .r0'
    SendMessage $HWNDPARENT 0x031A 0 0
    SetCtlColors $HWNDPARENT ${SOTF_TEXT} ${SOTF_BG_DEEP}

    FindWindow $R7 "Static" "" $HWNDPARENT
    chrome_static_loop:
      StrCmp $R7 0 chrome_static_done
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_BG_DEEP}
      FindWindow $R7 "Static" "" $HWNDPARENT $R7
      Goto chrome_static_loop
    chrome_static_done:

    FindWindow $R7 "Button" "" $HWNDPARENT
    chrome_button_loop:
      StrCmp $R7 0 chrome_button_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_SURFACE}
      FindWindow $R7 "Button" "" $HWNDPARENT $R7
      Goto chrome_button_loop
    chrome_button_done:
  FunctionEnd

  Function SOTF_ThemeCurrentPage
    Call SOTF_ThemeWizardChrome

    FindWindow $R9 "#32770" "" $HWNDPARENT
    StrCmp $R9 0 page_done
    System::Call 'uxtheme::SetWindowTheme(p $R9, w "DarkMode_Explorer", w "")i .r0'
    SendMessage $R9 0x031A 0 0
    SetCtlColors $R9 ${SOTF_TEXT} ${SOTF_BG}

    FindWindow $R7 "Static" "" $R9
    page_static_loop:
      StrCmp $R7 0 page_static_done
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_BG}
      FindWindow $R7 "Static" "" $R9 $R7
      Goto page_static_loop
    page_static_done:

    FindWindow $R7 "Button" "" $R9
    page_button_loop:
      StrCmp $R7 0 page_button_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_BG}
      FindWindow $R7 "Button" "" $R9 $R7
      Goto page_button_loop
    page_button_done:

    FindWindow $R7 "Edit" "" $R9
    page_edit_loop:
      StrCmp $R7 0 page_edit_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_FIELD}
      FindWindow $R7 "Edit" "" $R9 $R7
      Goto page_edit_loop
    page_edit_done:

    FindWindow $R7 "ListBox" "" $R9
    page_list_loop:
      StrCmp $R7 0 page_list_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_FIELD}
      FindWindow $R7 "ListBox" "" $R9 $R7
      Goto page_list_loop
    page_list_done:

    FindWindow $R7 "RichEdit20W" "" $R9
    page_rich_loop:
      StrCmp $R7 0 page_rich_done
      System::Call 'uxtheme::SetWindowTheme(p $R7, w "DarkMode_Explorer", w "")i .r0'
      SendMessage $R7 0x031A 0 0
      SetCtlColors $R7 ${SOTF_TEXT} ${SOTF_FIELD}
      FindWindow $R7 "RichEdit20W" "" $R9 $R7
      Goto page_rich_loop
    page_rich_done:

    FindWindow $R7 "msctls_progress32" "" $R9
    page_progress_loop:
      StrCmp $R7 0 page_progress_done
      SendMessage $R7 0x2001 0 ${SOTF_PROGRESS_BG_COLORREF}
      SendMessage $R7 0x0409 0 ${SOTF_ACCENT_COLORREF}
      FindWindow $R7 "msctls_progress32" "" $R9 $R7
      Goto page_progress_loop
    page_progress_done:

    page_done:
  FunctionEnd

  Function SOTF_ThemeTick
    Call SOTF_ThemeCurrentPage
  FunctionEnd

  Function SOTF_GUIInit
    Call SOTF_ThemeCurrentPage
    ${NSD_CreateTimer} SOTF_ThemeTick 120
  FunctionEnd

  !define MUI_CUSTOMFUNCTION_GUIINIT SOTF_GUIInit
!endif

; Finish copy is compiled separately for installer and uninstaller.
!ifdef BUILD_UNINSTALLER
  !define MUI_FINISHPAGE_TITLE "Days Gone Achievement Tracker removed"
  !define MUI_FINISHPAGE_TEXT "The application has been removed from this computer.$\r$\n$\r$\nYour Days Gone saves and Steam achievement data have not been modified."
!else
  !define MUI_FINISHPAGE_TITLE "Installation complete"
  !define MUI_FINISHPAGE_TEXT "Days Gone Achievement Tracker is ready to use.$\r$\n$\r$\nThe tracker reads local Steam achievement data without modifying the game, saves or Steam state."
!endif

!macro customHeader
  !ifdef BUILD_UNINSTALLER
    Caption "Days Gone Achievement Tracker — Uninstall"
  !else
    Caption "Days Gone Achievement Tracker — Setup"
  !endif
  BrandingText "Days Gone Achievement Tracker · Phil Forster"
!macroend

; Electron Builder does not add an installer welcome page by default. Add one
; so the branded sidebar appears immediately and the read-only purpose is clear.
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Install Days Gone Achievement Tracker"
  !define MUI_WELCOMEPAGE_TEXT "This setup installs the local, read-only Days Gone achievement tracker.$\r$\n$\r$\nIt reads your Steam achievement state and the game's exact cumulative statistics. It does not alter Days Gone, its saves or Steam data.$\r$\n$\r$\nClick Next to continue."
  !insertmacro MUI_PAGE_WELCOME
!macroend

; Keep Electron Builder's stock assisted-installer finish-page implementation.
; MUI_FINISHPAGE_RUN_TEXT above supplies the explicit checkbox label while
; Electron Builder retains its own StartApp function, update detection and
; StdUtils launch path. This include is parsed before Electron Builder adds
; its custom plugin directory, so duplicating that logic here is unsafe.

; Matching branded welcome page for removal.
!macro customUnWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Remove Days Gone Achievement Tracker"
  !define MUI_WELCOMEPAGE_TEXT "This will remove Days Gone Achievement Tracker from this computer.$\r$\n$\r$\nYour Days Gone saves and Steam achievement data will not be changed or deleted.$\r$\n$\r$\nClick Next to continue."
  !insertmacro MUI_UNPAGE_WELCOME
!macroend
