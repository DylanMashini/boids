#!/bin/sh
set -o verbose
rm -rf dist
wasm-pack build
webpack --config ./webpack.config.js --mode production 
ncp ./static/ ./dist/
ncp ./dist/ ../../dist/