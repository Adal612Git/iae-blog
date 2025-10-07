@echo off
setlocal
REM IAE Blog - Instalacion y arranque con Docker (1-click)

REM Cambiar a la carpeta donde esta este .bat (raiz del repo)
pushd "%~dp0"

echo Iniciando instalacion/arranque con .BAT (sin PowerShell externo)...

REM Si no somos Administrador, abrir NUEVA ventana elevada que corre start-docker.bat y mantenerla abierta
net session >nul 2>&1
if not %errorlevel%==0 (
  set "STARTBAT=%~dp0scripts\windows\start-docker.bat"
  echo Solicitando permisos (UAC). Acepta el cuadro de dialogo...
  set "ELEV_VBS=%TEMP%\iae_elevate_iae_blog.vbs"
  > "%ELEV_VBS%" echo Set sh = CreateObject("Shell.Application")
  >>"%ELEV_VBS%" echo cmdPath = "cmd.exe"
  >>"%ELEV_VBS%" echo args = "/k """"%STARTBAT%"""""
  >>"%ELEV_VBS%" echo sh.ShellExecute cmdPath, args, "", "runas", 1
  cscript //nologo "%ELEV_VBS%"
  echo Se abrio una nueva ventana con permisos de administrador. Continua alli.
  echo Esta ventana puede cerrarse con cualquier tecla.
  pause
  popd
  endlocal
  exit /b 0
)

REM Ya somos Administrador: ejecutar en esta misma ventana y pausar al final
call "scripts\windows\start-docker.bat"
echo.
echo Proceso finalizado. Presiona una tecla para cerrar esta ventana.
pause

popd
endlocal
