#!/bin/sh
set -o verbose
rm -rf dist
wasm-pack build
webpack --config ./webpack.config.js --mode production 
cp -r ./static/ ./dist/
cp -r ./dist/ ../dist/