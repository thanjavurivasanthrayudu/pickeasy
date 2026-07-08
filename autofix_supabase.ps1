#!/usr/bin/env pwsh
# EASY RIDE - Supabase Fix via Management API
# Run: .\autofix_supabase.ps1

$PROJECT_REF = "jgdhrehcmhxwowvripna"

Write-Host "=== EASY RIDE Supabase Auto-Fix ===" -ForegroundColor Cyan
Write-Host "Get your token: https://supabase.com/dashboard/account/tokens" -ForegroundColor White
Write-Host ""
$TOKEN = Read-Host "Paste Supabase Access Token"
if (-not $TOKEN) { Write-Host "Token required!" -ForegroundColor Red; exit 1 }

$headers = @{ "Authorization" = "Bearer $TOKEN"; "Content-Type" = "application/json" }

# Read the SQL file
$sql = Get-Content -Path ".\supabase_fix.sql" -Raw -Encoding UTF8
$bodyObj = @{ query = $sql }
$bodyJson = $bodyObj | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Applying SQL fix..." -ForegroundColor Yellow

$uri = "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query"

try {
    $res = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $bodyJson -ErrorAction Stop
    Write-Host "SQL applied OK!" -ForegroundColor Green
}
catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP $code : $($_.Exception.Message)" -ForegroundColor Red
    if ($code -eq 401) { Write-Host "Invalid token - generate a new one." -ForegroundColor Red }
    exit 1
}

Write-Host ""
Write-Host "Disabling email confirmation..." -ForegroundColor Yellow

$authUri = "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth"
$authBody = '{"mailer_autoconfirm":true}'

try {
    $authRes = Invoke-RestMethod -Uri $authUri -Method PATCH -Headers $headers -Body $authBody -ErrorAction Stop
    Write-Host "Email confirmation disabled!" -ForegroundColor Green
}
catch {
    Write-Host "Could not auto-disable email confirmation." -ForegroundColor Yellow
    Write-Host "Do it manually at:" -ForegroundColor White
    Write-Host "https://supabase.com/dashboard/project/$PROJECT_REF/auth/providers" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== ALL DONE ===" -ForegroundColor Green
Write-Host "Test: http://localhost:5173/register" -ForegroundColor Cyan
