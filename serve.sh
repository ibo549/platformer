#!/bin/bash
set -e
cd "$(dirname "$0")"
./build.sh
echo "🌐 Serving at http://localhost:8080/game.html"
open http://localhost:8080/game.html
python3 -m http.server 8080
