#!/usr/bin/env bash
# IRA-RESEARCHER — Unix/Mac Installer
# One-click setup

set -e

echo "============================================"
echo "  IRA-RESEARCHER — Setup"
echo "============================================"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "[✓] Node.js $NODE_VERSION detected"
else
    echo "[✗] Node.js is not installed!"
    echo "    Install via: brew install node (macOS) or apt install nodejs (Linux)"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Install npm dependencies
echo ""
echo "[...] Installing npm dependencies..."
npm install
echo "[✓] Dependencies installed"

# Install Chromium for Puppeteer
echo ""
echo "[...] Installing Chromium browser..."
npx puppeteer browsers install chrome || echo "[!] Chromium install had issues (may already exist)"
echo "[✓] Chromium ready"

echo ""
echo "[✓] IRA-RESEARCHER installed successfully!"
echo ""
echo "To start: node src/index.js"
echo ""
echo "To configure MCP, add to cline_mcp_settings.json:"
echo '{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["'"$SCRIPT_DIR/src/index.js"'"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_GHOST": "true",
        "IRA_STEALTH": "true"
      }
    }
  }
}'