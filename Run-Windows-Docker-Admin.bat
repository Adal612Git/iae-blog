@echo off
setlocal
REM Ejecutar este archivo como Administrador (clic derecho > Ejecutar como administrador)
pushd "%~dp0"
call "scripts\windows\start-docker.bat"
echo.
echo Proceso finalizado. Presiona una tecla para cerrar esta ventana.
pause
popd
endlocal

