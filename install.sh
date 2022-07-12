#!/bin/sh
set -o verbose

# install rust toolchain
# if ! command -v cargo &> /dev/null
# then
#     curl https://sh.rustup.rs -sSf | sh -- -y
#     rustup install stable
#     rustup default stable
# fi

# Install wasm-pack
if ! command -v wasm-pack &> /dev/null
then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Add wasm target
# rustup target add wasm32-unknown-unknown
