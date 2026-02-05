@echo off
echo Enabling CEP Debug Mode for all versions...
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.9 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.13 /v PlayerDebugMode /t REG_SZ /d 1 /f
echo.
echo Done! Please restart Premiere Pro.
pause
