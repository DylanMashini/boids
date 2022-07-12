#!/bin/sh
set -o verbose

install rust toolchain
if ! command -v rustup &> /dev/null
then
    curl https://sh.rustup.rs -sSf | sh -- -y
fi

rustup install stable
rustup default stable

# Install wasm-pack
if ! command -v wasm-pack &> /dev/null
then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Add wasm target
rustup target add wasm32-unknown-unknown
