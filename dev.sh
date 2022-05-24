#!/bin/sh
set -o verbose
# build main
rm -rf dist
wasm-pack build --target no-modules
webpack --config ./webpack.config.js --mode development
ncp ./pkg ./dist/pkg
ncp ./static/ ./dist/
tsc ./dist/worker.ts
rm -rf ./dist/worker.ts
rm -rf ./dist/pkg/*.ts
rm -rf ./dist/pkg/*.json
rm -rf ./dist/pkg/.gitignore
node ./start.js