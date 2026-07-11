#!/bin/sh
# Xcode Cloud: läuft direkt nach dem Klonen, vor der SPM-Paketauflösung.
# Das CapApp-SPM-Paket verweist per lokalem Pfad auf node_modules/ —
# deshalb hier Node installieren, Abhängigkeiten holen und Web-Build syncen.
set -e

brew install node

cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci
npm run build
npx cap sync ios
