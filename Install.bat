@echo off
echo ============================================
echo   BIN SORTER - Installer
echo   By Mickey Perry
echo ============================================
echo.

:: Enable CEP debug mode for unsigned extensions
echo Enabling extension support...
%SystemRoot%\System32\reg.exe add HKEY_CURRENT_USER\Software\Adobe\CSXS.9 /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
%SystemRoot%\System32\reg.exe add HKEY_CURRENT_USER\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
%SystemRoot%\System32\reg.exe add HKEY_CURRENT_USER\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
%SystemRoot%\System32\reg.exe add HKEY_CURRENT_USER\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

:: Create destination folder
echo Installing Bin Sorter...
if not exist "%APPDATA%\Adobe\CEP\extensions" mkdir "%APPDATA%\Adobe\CEP\extensions"

:: Copy extension using robocopy
%SystemRoot%\System32\robocopy.exe "%~dp0com.premiere.binsorter" "%APPDATA%\Adobe\CEP\extensions\com.premiere.binsorter" /E /IS /IT >nul 2>&1

echo.
echo ============================================
echo   Installation complete!
echo.
echo   1. Restart Premiere Pro
echo   2. Go to: Window - Extensions - Bin Sorter
echo ============================================
echo.
pause
