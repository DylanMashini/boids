#!/bin/sh
set -o verbose

rm -rf dist
mkdir ./dist
wasm-pack build rs --target web
vite build
