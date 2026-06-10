#!/bin/bash

echo "============================================"
echo "  MR. BIN - Mac Installer"
echo "  By Mickey Perry"
echo "============================================"
echo ""

# Enable CEP debug mode for unsigned extensions
echo "Enabling extension support..."
defaults write com.adobe.CSXS.9 PlayerDebugMode 1 2>/dev/null
defaults write com.adobe.CSXS.10 PlayerDebugMode 1 2>/dev/null
defaults write com.adobe.CSXS.11 PlayerDebugMode 1 2>/dev/null
defaults write com.adobe.CSXS.12 PlayerDebugMode 1 2>/dev/null

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create destination folder
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions"
echo "Installing Mr. Bin..."
mkdir -p "$DEST"

# Copy extension
cp -R "$SCRIPT_DIR/com.premiere.binsorter" "$DEST/"

echo ""
echo "============================================"
echo "  Installation complete!"
echo ""
echo "  1. Restart Premiere Pro"
echo "  2. Go to: Window > Extensions > Mr. Bin"
echo "============================================"
echo ""
read -p "Press Enter to close..."
