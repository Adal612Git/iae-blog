; IAE Blog - Instalador Producción (Docker) (NSIS)
; Requisitos: NSIS para compilar, winget disponible en el PC de destino.

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"

Name "IAE Blog"
OutFile "iae-blog-setup.exe"
InstallDir "$PROGRAMFILES64\IAE Blog"
RequestExecutionLevel admin
ShowInstDetails show

!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar IAE Blog ahora"
!define MUI_FINISHPAGE_RUN_CHECKED
!define MUI_FINISHPAGE_RUN "$INSTDIR\scripts\windows\start-docker.bat"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "Spanish"

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"

  ; Copiar proyecto necesario para docker compose
  File /r /x "node_modules" "backend\*"
  File /r /x "node_modules" "frontend\*"
  File /r "docker-compose.yml"
  File /r "scripts\windows\start-docker.bat"
  File /r "scripts\windows\install-docker.ps1"

  ; Escribir .env con secreto (si no existe)
  IfFileExists "$INSTDIR\.env" +3 0
    Goto afterEnv
  FileOpen $0 "$INSTDIR\.env" w
  FileWrite $0 "JWT_SECRET=supersecreto_cambia_esto$\r$\n"
  FileClose $0
  afterEnv:

  ; Intentar instalar y arrancar Docker con PowerShell
  DetailPrint "Verificando Docker Desktop e iniciando stack..."
  nsExec::ExecToLog 'powershell -ExecutionPolicy Bypass -File "$INSTDIR\scripts\windows\install-docker.ps1" -StartAfterInstall'

  ; Atajos
  CreateShortCut "$SMPROGRAMS\IAE Blog\Iniciar.lnk" "$INSTDIR\scripts\windows\start-docker.bat"
  CreateShortCut "$DESKTOP\IAE Blog.lnk" "$INSTDIR\scripts\windows\start-docker.bat"
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\IAE Blog\Iniciar.lnk"
  RMDir  "$SMPROGRAMS\IAE Blog"
  Delete "$DESKTOP\IAE Blog.lnk"
  RMDir /r "$INSTDIR"
SectionEnd

