#!/bin/sh
set -o verbose
# install rust toolchain
if ! command -v cargo &> /dev/null
then
    curl https://sh.rustup.rs -sSf | sh
    rustup install stable
    rustup default stable
fi
# Install wasm-pack
if ! command -v wasm-pack &> /dev/null
then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi
# Build main dir
rm -rf dist
wasm-pack build --target no-modules
webpack --config ./webpack.config.js --mode production
cp -rp ./pkg ./dist/pkg
cp -rp ./static ./dist 
tsc ./dist/worker.ts
rm -rf ./dist/worker.ts
rm -rf ./dist/pkg/*.ts
rm -rf ./dist/pkg/*.json
rm -rf ./dist/pkg/.gitignore

# Build no-js dir
cd js-only
yarn install
yarn build
# Build no-workers dir
cd ../no-workers
yarn install
yarn build