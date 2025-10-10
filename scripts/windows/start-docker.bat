@echo off
setlocal EnableExtensions DisableDelayedExpansion
REM IAE Blog - Arranque Produccion (Docker) - simplificado

REM Ir a la raiz del repo (dos niveles arriba de scripts\windows)
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%..\.." 2>nul
if errorlevel 1 (
  echo [ERROR] No se pudo acceder a la raiz del repositorio.
  echo Ubicacion esperada: %SCRIPT_DIR%..\..
  pause
  exit /b 1
)
set "REPO_ROOT=%CD%"

REM Comprobar Docker CLI
where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro Docker en PATH. Abre Docker Desktop y reintenta.
  pause
  exit /b 1
)

call :ensure_docker_listening
if errorlevel 1 (
  pause
  exit /b 1
)

REM Asegurar .env con claves por defecto
if not exist ".env" (
  > ".env" echo JWT_SECRET=supersecreto_cambia_esto
  >> ".env" echo ADMIN_MASTER_KEY=CambiaEstaClaveMaestra
  echo [INFO] Escrito .env por defecto.
)

REM Si falta alguna key en .env existente, agregarla
findstr /r /c:"^JWT_SECRET=" .env >nul 2>&1 || (
  echo JWT_SECRET=supersecreto_cambia_esto>>.env & echo [INFO] Agregado JWT_SECRET a .env
)
findstr /r /c:"^ADMIN_MASTER_KEY=" .env >nul 2>&1 || (
  echo ADMIN_MASTER_KEY=CambiaEstaClaveMaestra>>.env & echo [INFO] Agregado ADMIN_MASTER_KEY a .env
)

echo [INFO] Construyendo y levantando contenedores...
docker compose up -d --build
if errorlevel 1 (
  echo [ERROR] 'docker compose up' fallo. ^(�Docker Desktop esta iniciado?^)
  pause
  exit /b 1
)

echo [INFO] Seed desactivado. Usa la pestaña "Crear admin" en /#/login con tu ADMIN_MASTER_KEY.

echo [INFO] Abriendo http://localhost:8080
start "" http://localhost:8080

echo ======================================
echo IAE Blog (Docker) en ejecucion
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:5000
echo Para ver logs: docker compose logs -f
echo Para detener:  docker compose down
echo ======================================

echo.
echo [INFO] Proceso completado. Presiona una tecla para cerrar esta ventana.
pause

popd
endlocal

goto :EOF

:ensure_docker_listening
docker info >nul 2>&1
if errorlevel 1 (
  echo [INFO] Docker Desktop no esta iniciado. Intentando arrancarlo...
  set "DOCKER_DESKTOP_EXE="
  for %%G in ("%ProgramFiles%\Docker\Docker\Docker Desktop.exe" "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe") do (
    if not defined DOCKER_DESKTOP_EXE if exist "%%~G" (
      set "DOCKER_DESKTOP_EXE=%%~G"
    )
  )

  if not defined DOCKER_DESKTOP_EXE (
    echo [ERROR] No se encontro la aplicacion Docker Desktop. Inicia Docker manualmente y reintenta.
    exit /b 1
  )

  start "" "%DOCKER_DESKTOP_EXE%" >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] No se pudo iniciar Docker Desktop de forma automatica.
    exit /b 1
  )

  call :wait_for_docker 120
  if errorlevel 1 (
    echo [ERROR] Docker Desktop no estuvo listo tras esperar. Abrelo manualmente y reintenta.
    exit /b 1
  )
)

exit /b 0

:wait_for_docker
set "WAIT_SECONDS=%~1"
if not defined WAIT_SECONDS set "WAIT_SECONDS=120"
set /a "ATTEMPTS=(WAIT_SECONDS + 4) / 5"
if %ATTEMPTS% lss 1 set "ATTEMPTS=1"

for /l %%I in (1,1,%ATTEMPTS%) do (
  docker info >nul 2>&1
  if not errorlevel 1 (
    exit /b 0
  )
  if %%I lss %ATTEMPTS% (
    echo [INFO] Esperando a que Docker Desktop inicialice... (%%I/%ATTEMPTS%)
    timeout /t 5 /nobreak >nul
  )
)

exit /b 1
