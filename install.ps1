# IRA-RESEARCHER — Windows Installer
# One-click setup for PowerShell

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IRA-RESEARCHER — Windows Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js is not installed!" -ForegroundColor Red
    Write-Host "    Download from: https://nodejs.org/ (v18+)"
    exit 1
}

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Install npm dependencies
Write-Host ""
Write-Host "[...] Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[✓] Dependencies installed" -ForegroundColor Green

# Install Chromium for Puppeteer
Write-Host ""
Write-Host "[...] Installing Chromium browser..." -ForegroundColor Yellow
npx puppeteer browsers install chrome
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Chromium install had issues (may already exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[✓] IRA-RESEARCHER installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To start: node src/index.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "To configure MCP, add to cline_mcp_settings.json:" -ForegroundColor Gray
Write-Host '{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["' + (Resolve-Path "src/index.js") + '"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_GHOST": "true",
        "IRA_STEALTH": "true"
      }
    }
  }
}' -ForegroundColor Yellow