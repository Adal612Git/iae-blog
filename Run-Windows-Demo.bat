@echo off
setlocal
REM IAE Blog - Instalación y arranque DEMO (sin Docker)

REM Cambiar a la carpeta donde está este .bat (raíz del repo)
pushd "%~dp0"

echo Iniciando instalación DEMO mediante PowerShell...
powershell -ExecutionPolicy Bypass -File "scripts\windows\install-demo.ps1" -StartAfterInstall
if errorlevel 1 (
  echo.
  echo Hubo un problema ejecutando PowerShell.
  echo Puedes ejecutar manualmente: scripts\windows\install-demo.ps1 -StartAfterInstall
  echo (Clic derecho, "Run with PowerShell").
  pause
)

popd
endlocal

