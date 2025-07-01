#!/bin/bash

# Exit on any error
set -e

echo "Starting Render build process..."

# Check Python version
echo "Python version:"
python --version

# Upgrade pip first
echo "Upgrading pip..."
pip install --upgrade pip || { echo "Failed to upgrade pip"; exit 1; }

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt || { echo "Failed to install Python dependencies"; exit 1; }

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm ci || { echo "Failed to install Node.js dependencies"; exit 1; }

# Build the Next.js application
echo "Building Next.js application..."
npm run build || { echo "Failed to build Next.js application"; exit 1; }

echo "Build completed successfully!" 