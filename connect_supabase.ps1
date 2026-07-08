#!/usr/bin/env pwsh
# =============================================================
#  EASY RIDE - Supabase Connect & Push Script
#  Run: cd "c:\Users\vasan\OneDrive\Videos\pickeasy" then .\connect_supabase.ps1
# =============================================================

$PROJECT_REF = "jgdhrehcmhxwowvripna"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  EASY RIDE - Supabase Connection Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project Reference: $PROJECT_REF" -ForegroundColor Yellow
Write-Host ""

# STEP 1: Get access token
Write-Host "STEP 1: Supabase Personal Access Token" -ForegroundColor Green
Write-Host "  Go to: https://supabase.com/dashboard/account/tokens" -ForegroundColor White
Write-Host "  Click 'Generate new token', name it 'pickeasy-cli', copy it." -ForegroundColor White
Write-Host ""
$ACCESS_TOKEN = Read-Host "  Paste your Access Token here"

if (-not $ACCESS_TOKEN) {
    Write-Host "ERROR: Access token is required." -ForegroundColor Red
    exit 1
}

# STEP 2: Get DB password
Write-Host ""
Write-Host "STEP 2: Database Password" -ForegroundColor Green
Write-Host "  Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database" -ForegroundColor White
Write-Host "  Scroll to 'Connection string' section, copy the password." -ForegroundColor White
Write-Host ""
$DB_PASSWORD_PLAIN = Read-Host "  Paste your Database Password here"

if (-not $DB_PASSWORD_PLAIN) {
    Write-Host "ERROR: Database password is required." -ForegroundColor Red
    exit 1
}

# STEP 3: Login
Write-Host ""
Write-Host "STEP 3: Logging in to Supabase CLI..." -ForegroundColor Green
$env:SUPABASE_ACCESS_TOKEN = $ACCESS_TOKEN
$loginResult = & supabase login --token $ACCESS_TOKEN 2>&1
Write-Host $loginResult

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Login failed. Check your access token." -ForegroundColor Red
    exit 1
}
Write-Host "Logged in OK" -ForegroundColor Green

# STEP 4: Link project
Write-Host ""
Write-Host "STEP 4: Linking to project $PROJECT_REF..." -ForegroundColor Green
$linkResult = & supabase link --project-ref $PROJECT_REF --password $DB_PASSWORD_PLAIN 2>&1
Write-Host $linkResult

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Linking failed. Check your DB password." -ForegroundColor Red
    exit 1
}
Write-Host "Linked OK" -ForegroundColor Green

# STEP 5: Run the fix SQL
Write-Host ""
Write-Host "STEP 5: Pushing schema fix to Supabase..." -ForegroundColor Green
$fixSql = Get-Content ".\supabase_fix.sql" -Raw
$tmpFile = [System.IO.Path]::GetTempFileName() + ".sql"
$fixSql | Out-File -FilePath $tmpFile -Encoding utf8

$execResult = & supabase db execute --project-ref $PROJECT_REF --file $tmpFile 2>&1
Write-Host $execResult

Remove-Item $tmpFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  ALL DONE! Schema pushed successfully to Supabase." -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT NEXT STEP:" -ForegroundColor Yellow
    Write-Host "  Disable email confirmation at:" -ForegroundColor White
    Write-Host "  https://supabase.com/dashboard/project/$PROJECT_REF/auth/providers" -ForegroundColor Cyan
    Write-Host "  Toggle OFF 'Enable email confirmations' under Email provider." -ForegroundColor White
    Write-Host ""
    Write-Host "Then test at: http://localhost:5173/register" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Schema push failed. Please run supabase_fix.sql manually:" -ForegroundColor Yellow
    Write-Host "  https://supabase.com/dashboard/project/$PROJECT_REF/sql/new" -ForegroundColor Cyan
}
