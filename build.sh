#!/bin/bash

# Build script with memory optimization
echo "Starting optimized build process..."

# Set Node.js memory limit
export NODE_OPTIONS="--max_old_space_size=4096"

# Disable source maps for smaller bundle
export GENERATE_SOURCEMAP=false

# Clean previous build
echo "Cleaning previous build..."
rm -rf build/

# Install dependencies if needed
echo "Installing dependencies..."
npm ci --only=production

# Run the build
echo "Building application..."
npm run build

echo "Build completed successfully!"

# Optional: Show build size
if [ -d "build" ]; then
    echo "Build size:"
    du -sh build/
fi