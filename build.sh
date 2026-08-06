#!/usr/bin/env bash
set -euo pipefail

echo "==> Building apps/habit (Pulse)"
cd apps/habit
npm install
npm run build
cd ../..

echo "==> Building apps/finance (FinanceTrack)"
cd apps/finance
npm install
npm run build
cd ../..

echo "==> Building apps/tugas (Papan Tugas SMA)"
cd apps/tugas
npm install
npm run build
cd ../..

echo "==> Assembling dist/"
rm -rf dist
mkdir -p dist
cp -r apps/habit/dist dist/habit
cp -r apps/finance/dist dist/finance
cp -r apps/tugas/dist dist/tugas
cp landing/index.html dist/index.html

echo "==> Done. dist/ layout:"
find dist -maxdepth 2
