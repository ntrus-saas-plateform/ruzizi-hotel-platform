# Script PowerShell pour corriger les fichiers restants
$files = Get-ChildItem -Path "./app/api" -Recurse -Filter "*.ts" | Where-Object { 
    (Get-Content $_.FullName -Raw) -match "verifyAuth|const user = await" 
}

foreach ($file in $files) {
    Write-Host "Fixing: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Corriger verifyAuth vers withRole pour super_admin
    if ($content -match "verifyAuth.*super_admin") {
        $content = $content -replace "import { verifyAuth }", "import { withRole }"
        $content = $content -replace "export async function (GET|POST|PUT|DELETE)\(request: NextRequest\) \{[\s\S]*?const user = await verifyAuth\(request\);[\s\S]*?if \(!user\) \{[\s\S]*?\}[\s\S]*?if \(user\.role !== 'super_admin'\) \{[\s\S]*?\}", "export const `$1 = withRole(['super_admin'], async (request: NextRequest, user) => {"
        $content = $content -replace "\}\s*$", "});"
    }
    
    # Corriger verifyAuth vers withAuth pour les autres cas
    elseif ($content -match "verifyAuth") {
        $content = $content -replace "import { verifyAuth }", "import { withAuth }"
        $content = $content -replace "verifyAuth", "withAuth"
        $content = $content -replace "export async function (GET|POST|PUT|DELETE)\(", "export const `$1 = withAuth(async ("
        $content = $content -replace "\}\s*$", "});"
    }
    
    Set-Content -Path $file.FullName -Value $content
}

Write-Host "Done!"