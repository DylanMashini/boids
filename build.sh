#!/bin/sh
rm -rf dist
wasm-pack build --target no-modules
mkdir dist
cp -rp ./pkg ./dist/pkg
webpack --config ./webpack.config.js --mode production 
ncp ./static ./dist 
tsc ./dist/worker.ts
rm -rf ./dist/worker.ts
rm -rf ./dist/pkg/*.ts
rm -rf ./dist/pkg/*.json
rm -rf ./dist/pkg/.gitignore