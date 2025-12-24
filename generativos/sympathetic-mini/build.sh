#!/bin/bash

# Build script for Sympathetic Mini
# Requires Emscripten SDK (emsdk)

set -e

echo "Building Sympathetic Mini..."

# Create output directory
mkdir -p web/js

# Compile with Emscripten
em++ src/main.cpp \
    -o web/js/sympathy.js \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createSympathyModule" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT='web' \
    -lembind \
    -O3 \
    --no-entry

echo "Build complete! Output in web/js/"
echo "  - sympathy.js"
echo "  - sympathy.wasm"
