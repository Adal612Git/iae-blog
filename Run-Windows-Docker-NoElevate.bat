@echo off
setlocal
REM Ejecuta el stack en esta misma ventana, sin auto-elevacion.
REM Abre esta ventana con clic derecho > Ejecutar como administrador.

pushd "%~dp0"
echo Lanzando scripts\windows\start-docker.bat (sin auto-elevacion)...
call "scripts\windows\start-docker.bat"
echo.
echo Fin. Presiona una tecla para cerrar.
pause
popd
endlocal

