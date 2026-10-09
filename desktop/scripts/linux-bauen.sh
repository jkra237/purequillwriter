#!/usr/bin/env bash
# Baut die Linux-Pakete (AppImage + .deb, je x64 und arm64) in WSL.
#
# Aufruf aus Windows:   wsl -d Ubuntu -- bash "/mnt/c/Users/jkraj/cc test/purequillwriter/desktop/scripts/linux-bauen.sh"
# Aufruf in Ubuntu:     bash "/mnt/c/Users/jkraj/cc test/purequillwriter/desktop/scripts/linux-bauen.sh"
#
# Warum nicht direkt in desktop/ bauen?
#   desktop/node_modules gehört Windows: Electron liegt dort als win32-Programm,
#   und npm unter /mnt/c ist quälend langsam. Deshalb wird das Repo in den
#   Linux-Teil kopiert (~/pqw-build), dort mit eigenen node_modules gebaut, und
#   nur die fertigen Pakete wandern zurück nach desktop/release/linux/.
set -euo pipefail

HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HIER/../.." && pwd)"
BAU="$HOME/pqw-build"
ZIEL="$REPO/desktop/release/linux"

# Das npm von Windows steht über die PATH-Brücke ebenfalls im Pfad und darf
# hier auf keinen Fall greifen.
case "$(command -v npm || true)" in
  /mnt/*|"") echo "!! Kein Linux-npm gefunden (sudo apt install nodejs npm)"; exit 1 ;;
esac

echo "== Quelle kopieren nach $BAU"
mkdir -p "$BAU"
rsync -a --delete \
  --exclude .git --exclude node_modules --exclude release --exclude app \
  "$REPO/" "$BAU/"

cd "$BAU/desktop"
echo "== npm ci"
npm ci --no-audit --no-fund

# electron-builder bringt fpm (für .deb) nur als x64-Programm mit. Auf einem
# arm64-Rechner muss das systemweit installierte fpm ran (sudo gem install fpm).
if [ "$(uname -m)" = "aarch64" ]; then export USE_SYSTEM_FPM=true; fi

echo "== Bauen"
rm -rf release
npm run dist:linux

echo "== Pakete nach $ZIEL"
mkdir -p "$ZIEL"
rm -f "$ZIEL"/*.AppImage "$ZIEL"/*.deb
cp release/*.AppImage release/*.deb "$ZIEL"/

# Nachzählen: electron-builder meldet eine ausgefallene Architektur nicht,
# er endet trotzdem mit Code 0 (dieselbe Falle wie bei den Store-Paketen).
ANZAHL=$(ls "$ZIEL"/*.AppImage "$ZIEL"/*.deb | wc -l)
ls -lh "$ZIEL"
if [ "$ANZAHL" -ne 4 ]; then
  echo "!! Erwartet: 4 Pakete (AppImage + deb, je x64 und arm64), gefunden: $ANZAHL"
  exit 1
fi
echo "== Fertig: 4 Pakete"
