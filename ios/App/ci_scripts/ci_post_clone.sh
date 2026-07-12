#!/bin/sh
# Xcode Cloud: läuft direkt nach dem Klonen, vor der SPM-Paketauflösung.
# Das CapApp-SPM-Paket verweist per lokalem Pfad auf node_modules/ —
# deshalb hier Node installieren, Abhängigkeiten holen und Web-Build syncen.
set -e

brew install node

cd "$CI_PRIMARY_REPOSITORY_PATH"

# Build-Version wie im Release-Workflow: einheitliches Format YYYY.MMDD.HHMM
# (z. B. 2026.712.1035) – zugleich gültiges CFBundleShortVersionString. Über
# APP_BUILD_VERSION zeigt der Footer unter iOS dieselbe Version wie auf den
# übrigen Plattformen, statt auf die package.json-Version (1.0.0) zurückzufallen.
# 10# erzwingt Basis 10, damit "08"/"09" nicht als Oktalzahl fehlschlagen.
Y=$(date -u +%Y)
MMDD=$(( 10#$(date -u +%m) * 100 + 10#$(date -u +%d) ))
HHMM=$(( 10#$(date -u +%H) * 100 + 10#$(date -u +%M) ))
BUILD_VERSION="$Y.$MMDD.$HHMM"
export APP_BUILD_VERSION="$BUILD_VERSION"

npm ci
npm run build
npx cap sync ios

# Native App-Version (Info.plist referenziert diese Build-Settings) dynamisch
# setzen, damit CFBundleShortVersionString mit der Footer-Version übereinstimmt
# statt hart auf 1.0 zu stehen. CFBundleVersion (Build-Nummer) muss je Upload
# monoton steigen → Minuten seit Epoche, wie beim Android-Release.
BUILD_NUMBER="$(( $(date -u +%s) / 60 ))"
cd ios/App
sed -i '' -E "s/MARKETING_VERSION = [^;]+;/MARKETING_VERSION = ${BUILD_VERSION};/g" App.xcodeproj/project.pbxproj
sed -i '' -E "s/CURRENT_PROJECT_VERSION = [^;]+;/CURRENT_PROJECT_VERSION = ${BUILD_NUMBER};/g" App.xcodeproj/project.pbxproj
