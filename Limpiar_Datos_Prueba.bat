@echo off
echo ==========================================
echo Limpiando datos de prueba del sistema...
echo ==========================================

rmdir /s /q "%APPDATA%\Heritage POS" 2>nul
rmdir /s /q "%APPDATA%\Gestor de Licencias" 2>nul

echo.
echo Datos borrados exitosamente! Ahora las aplicaciones iniciaran desde cero.
echo.
pause
