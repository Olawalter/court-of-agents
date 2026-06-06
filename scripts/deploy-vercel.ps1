# Court of Agents — Vercel Deployment Script
# Run: powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Court of Agents — Vercel Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git add -A
    git commit -m "Initial commit: Court of Agents"
}

Write-Host ""
Write-Host "Deploying to Vercel..." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Set these environment variables in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host "  SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_GENLAYER_RPC_URL" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_GENLAYER_CHAIN_ID" -ForegroundColor White
Write-Host "  GENLAYER_PRIVATE_KEY" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS" -ForegroundColor White
Write-Host ""

# Deploy
vercel --prod

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
