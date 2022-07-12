#!/bin/sh
set -o verbose

rm -rf dist
mkdir ./dist
wasm-pack build --target no-modules
webpack --config ./webpack.config.js --mode production
mkdir ./dist/pkg/
ncp ./pkg ./dist/pkg
ncp ./static/ ./dist/
tsc ./dist/worker.ts
rm -rf ./dist/worker.ts
rm -rf ./dist/pkg/*.ts
rm -rf ./dist/pkg/*.json
rm -rf ./dist/pkg/.gitignore
