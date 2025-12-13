# Setup Script for EVAEPIC Backend

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "EVAEPIC Backend Setup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Check if in backend directory
if (-not (Test-Path "pyproject.toml")) {
    Write-Host "Error: pyproject.toml not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "[OK] .env file found" -ForegroundColor Green
} else {
    Write-Host "[WARNING] .env file not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] .env file created. Please update it with your API keys." -ForegroundColor Green
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# Check if uv is available
$uvAvailable = Get-Command uv -ErrorAction SilentlyContinue
if ($uvAvailable) {
    Write-Host "Using uv for installation (faster)" -ForegroundColor Cyan
    uv pip install -e .
} else {
    Write-Host "Using pip for installation" -ForegroundColor Cyan
    pip install -e .
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify your .env file contains the correct API keys" -ForegroundColor White
Write-Host "2. Run the backend: uvicorn main:app --reload" -ForegroundColor White
Write-Host "3. Test the negotiation system" -ForegroundColor White
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "- LLM: Claude Sonnet 4 (Anthropic)" -ForegroundColor White
Write-Host "- Max Rounds: 2 (configurable in .env)" -ForegroundColor White
Write-Host "- Team ID: 989290" -ForegroundColor White
Write-Host ""
