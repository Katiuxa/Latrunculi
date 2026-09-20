@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
if not defined JAVA_HOME set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
call npm run apk
if errorlevel 1 (
  echo.
  echo Fallo al compilar la APK.
  pause
  exit /b 1
)
echo.
echo APK lista: dist\Latrunculi-1.0.62.apk
echo AAB Play Store: dist\Latrunculi-1.0.62.aab
explorer dist
