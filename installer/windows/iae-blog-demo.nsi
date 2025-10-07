; IAE Blog - Instalador DEMO (NSIS)
; Requisitos para compilar: NSIS (https://nsis.sourceforge.io/Download)
; Compilar este .nsi desde la raiz del repo o ajustar las rutas File /r si es necesario.

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"

Name "IAE Blog (DEMO)"
OutFile "iae-blog-demo-setup.exe"
InstallDir "$PROGRAMFILES64\IAE Blog DEMO"
RequestExecutionLevel admin
ShowInstDetails show

!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; Mostrar opcion de "Iniciar ahora" al finalizar
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar IAE Blog (DEMO) ahora"
!define MUI_FINISHPAGE_RUN_CHECKED
!define MUI_FINISHPAGE_RUN "$INSTDIR\scripts\windows\start-demo.bat"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "Spanish"

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"

  ; Copiar proyecto (DEMO, sin Docker)
  File /r /x "node_modules" "backend\*"
  File /r /x "node_modules" "frontend\*"
  File /r "scripts\windows\start-demo.bat"
  File /r "scripts\windows\install-demo.ps1"

  ; Escribir backend/.env DEMO si no existe
  IfFileExists "$INSTDIR\backend\.env" +4 0
    Goto afterEnv
  FileOpen $0 "$INSTDIR\backend\.env" w
  FileWrite $0 "DEMO_MODE=true$\r$\nJWT_SECRET=supersecreto123$\r$\nDB_URL=mongodb://localhost:27017/iae_blog$\r$\n"
  FileClose $0
  afterEnv:

  ; Instalar Node LTS, dependencias y arrancar DEMO
  DetailPrint "Instalando Node LTS y arrancando DEMO..."
  nsExec::ExecToLog 'powershell -ExecutionPolicy Bypass -File "$INSTDIR\scripts\windows\install-demo.ps1" -StartAfterInstall'

  ; Crear accesos directos
  CreateShortCut "$SMPROGRAMS\IAE Blog DEMO\Iniciar (DEMO).lnk" "$INSTDIR\scripts\windows\start-demo.bat"
  CreateShortCut "$DESKTOP\IAE Blog (DEMO).lnk" "$INSTDIR\scripts\windows\start-demo.bat"

  DetailPrint "Instalacion DEMO completada."
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\IAE Blog DEMO\Iniciar (DEMO).lnk"
  RMDir  "$SMPROGRAMS\IAE Blog DEMO"
  Delete "$DESKTOP\IAE Blog (DEMO).lnk"
  RMDir /r "$INSTDIR"
SectionEnd

