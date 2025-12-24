#!/bin/bash
set -e

echo "Building Sympathetic Strings Physics Simulation..."

mkdir -p web

em++ src/physics.cpp \
    -o web/physics.js \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createPhysicsModule" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT='web' \
    -lembind \
    -O3 \
    --no-entry

echo "Build complete!"
echo "  web/physics.js"
echo "  web/physics.wasm"
