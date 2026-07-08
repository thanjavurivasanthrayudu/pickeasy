#!/usr/bin/env pwsh
# ============================================================
#  Run this script:
#  cd "c:\Users\vasan\OneDrive\Videos\pickeasy"
#  .\setup_supabase.ps1
# ============================================================

$PROJECT_REF = "jgdhrehcmhxwowvripna"

Write-Host ""
Write-Host "=== SUPABASE CLI SETUP ===" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_REF" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Get your token from:" -ForegroundColor White
Write-Host "  https://supabase.com/dashboard/account/tokens" -ForegroundColor Green
Write-Host "  -> Click 'Generate new token' -> name it 'cli' -> Copy it" -ForegroundColor White
Write-Host ""

$TOKEN = Read-Host "Paste your Supabase Access Token"

if (-not $TOKEN) { Write-Host "Token required!" -ForegroundColor Red; exit 1 }

# --- Step 1: Login ---
Write-Host ""
Write-Host "[1/4] Logging in..." -ForegroundColor Cyan
& supabase login --token $TOKEN
if ($LASTEXITCODE -ne 0) { Write-Host "Login FAILED" -ForegroundColor Red; exit 1 }
Write-Host "Logged in!" -ForegroundColor Green

# --- Step 2: Link ---
Write-Host ""
Write-Host "[2/4] Linking project $PROJECT_REF..." -ForegroundColor Cyan
Write-Host "      (You can find/reset DB password at:" -ForegroundColor White
Write-Host "       https://supabase.com/dashboard/project/$PROJECT_REF/settings/database )" -ForegroundColor White
Write-Host ""
$DB_PASS = Read-Host "Paste your Database Password"

& supabase link --project-ref $PROJECT_REF --password $DB_PASS
if ($LASTEXITCODE -ne 0) { Write-Host "Link FAILED - check password" -ForegroundColor Red; exit 1 }
Write-Host "Linked!" -ForegroundColor Green

# --- Step 3: Push fix SQL ---
Write-Host ""
Write-Host "[3/4] Running supabase_fix.sql on remote DB..." -ForegroundColor Cyan
$tmpFile = "$env:TEMP\supabase_fix_push.sql"
Copy-Item ".\supabase_fix.sql" $tmpFile
& supabase db execute --project-ref $PROJECT_REF --file $tmpFile
Remove-Item $tmpFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: SQL push had issues." -ForegroundColor Yellow
    Write-Host "  Manually paste supabase_fix.sql at:" -ForegroundColor White
    Write-Host "  https://supabase.com/dashboard/project/$PROJECT_REF/sql/new" -ForegroundColor Green
}
else {
    Write-Host "SQL pushed!" -ForegroundColor Green
}

# --- Step 4: Verify connection ---
Write-Host ""
Write-Host "[4/4] Checking DB connection..." -ForegroundColor Cyan
& supabase db ping --project-ref $PROJECT_REF
if ($LASTEXITCODE -eq 0) {
    Write-Host "DB is reachable!" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DONE! Supabase is connected." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "FINAL STEP (manual):" -ForegroundColor Yellow
Write-Host "  1. Open: https://supabase.com/dashboard/project/$PROJECT_REF/auth/providers" -ForegroundColor White
Write-Host "  2. Under Email provider -> toggle OFF 'Enable email confirmations'" -ForegroundColor White
Write-Host "  3. Test signup at:  http://localhost:5173/register" -ForegroundColor Green
Write-Host ""
