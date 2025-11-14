# Script pour verifier la securite des routes API

Write-Host "Verification de la securite des routes API..." -ForegroundColor Cyan
Write-Host ""

$apiPath = "app/api"
$routeFiles = Get-ChildItem -Path $apiPath -Filter "route.ts" -Recurse

$secured = @()
$unsecured = @()
$public = @()

foreach ($file in $routeFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    $content = Get-Content $file.FullName -Raw
    
    # Ignorer les routes publiques et auth
    if ($relativePath -match "api\\public\\" -or $relativePath -match "api\\auth\\") {
        $public += $relativePath
        continue
    }
    
    # Verifier si la route utilise le middleware de securite
    if ($content -match "requireAuth|withAuth|withRole|withPermission|verifyAuth") {
        $secured += $relativePath
    } else {
        $unsecured += $relativePath
    }
}

Write-Host "Routes Securisees: $($secured.Count)" -ForegroundColor Green
foreach ($route in ($secured | Sort-Object)) {
    Write-Host "  $route" -ForegroundColor Green
}

Write-Host ""
Write-Host "Routes Non Securisees: $($unsecured.Count)" -ForegroundColor Yellow
foreach ($route in ($unsecured | Sort-Object)) {
    Write-Host "  $route" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Routes Publiques: $($public.Count)" -ForegroundColor Blue
foreach ($route in ($public | Sort-Object)) {
    Write-Host "  $route" -ForegroundColor Blue
}

Write-Host ""
Write-Host "Resume:" -ForegroundColor Cyan
Write-Host "  Total: $($routeFiles.Count) routes"
Write-Host "  Securisees: $($secured.Count)" -ForegroundColor Green
Write-Host "  Non securisees: $($unsecured.Count)" -ForegroundColor Yellow
Write-Host "  Publiques: $($public.Count)" -ForegroundColor Blue

if ($unsecured.Count -gt 0) {
    Write-Host ""
    Write-Host "ATTENTION: Des routes ne sont pas securisees!" -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "Toutes les routes privees sont securisees!" -ForegroundColor Green
}
