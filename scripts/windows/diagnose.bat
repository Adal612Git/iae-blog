@echo off
setlocal
echo ===== Diagnostico rapido IAE Blog =====
echo Carpeta actual: %CD%
echo Usuario: %USERNAME%
echo Host: %COMPUTERNAME%
ver
echo.
echo --- Herramientas ---
where cmd
where powershell
where winget
where docker
where git
echo.
echo --- Versiones ---
for /f "delims=" %%A in ('powershell -NoProfile -Command "$PSVersionTable.PSVersion.ToString()"') do echo PowerShell: %%A
docker --version
winget --version
echo.
echo --- Permisos admin ---
net session >nul 2>&1 && echo Admin=SI || echo Admin=NO
echo.
echo --- Prueba docker info ---
docker info | more
echo.
echo --- Variables ---
set | more
echo.
echo Fin del diagnostico. Presiona una tecla para cerrar.
pause
endlocal

