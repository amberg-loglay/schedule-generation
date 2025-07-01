#!/bin/bash

echo "Starting Render build process..."

# Check Python version
echo "Python version:"
python --version

# Upgrade pip first
echo "Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm ci

# Build the Next.js application
echo "Building Next.js application..."
npm run build

echo "Build completed successfully!" 