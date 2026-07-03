# PowerShell dev server with /users/* routing support
$port = 8080
$root = $PSScriptRoot

Write-Host "🚀 Starting Matix dev server on port $port..." -ForegroundColor Cyan

# Check if Node.js is available
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "   Using Node.js dev server" -ForegroundColor Green
    & node "$root\dev-server.js"
} else {
    # Fallback: Simple Python server with custom 404
    Write-Host "   Node.js not found, checking Python..." -ForegroundColor Yellow
    
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "   Using Python HTTP server" -ForegroundColor Green
        Write-Host "   ⚠️  Note: Python server won't handle /users/* routes properly" -ForegroundColor Yellow
        Write-Host "   Install Node.js or use 'npm install -g http-server' for better routing" -ForegroundColor Yellow
        Set-Location $root
        & python -m http.server $port
    } elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
        Write-Host "   Using Python3 HTTP server" -ForegroundColor Green
        Write-Host "   ⚠️  Note: Python server won't handle /users/* routes properly" -ForegroundColor Yellow
        Write-Host "   Install Node.js or use 'npm install -g http-server' for better routing" -ForegroundColor Yellow
        Set-Location $root
        & python3 -m http.server $port
    } else {
        Write-Host "❌ Neither Node.js nor Python found!" -ForegroundColor Red
        Write-Host "" 
        Write-Host "Quick fixes:" -ForegroundColor Cyan
        Write-Host "  1. Install Node.js from https://nodejs.org/" -ForegroundColor White
        Write-Host "  2. Then run: node dev-server.js" -ForegroundColor White
        Write-Host ""
        Write-Host "Alternative: Install http-server globally:" -ForegroundColor Cyan
        Write-Host "  npm install -g http-server" -ForegroundColor White
        Write-Host "  http-server -p 8080 --proxy http://localhost:8080?" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter to exit"
    }
}
