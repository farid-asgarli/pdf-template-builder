# PowerShell script to zip the current directory
# Excludes: bin, obj (dotnet), and node_modules

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipName = "survey_new_$timestamp.zip"
$tempDir = Join-Path $env:TEMP "zip_temp_$timestamp"
$sourceDir = $PSScriptRoot

# If script is run directly (not from file), use current directory
if (-not $sourceDir) {
    $sourceDir = Get-Location
}

Write-Host "Creating zip archive: $zipName" -ForegroundColor Cyan
Write-Host "Source: $sourceDir" -ForegroundColor Gray

# Create temp directory
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files excluding bin, obj, and node_modules
$excludeDirs = @('bin', 'obj', 'node_modules', '.git')

Get-ChildItem -Path $sourceDir -Recurse -Force | Where-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length + 1)
    $pathParts = $relativePath -split '[\\\/]'
    
    # Check if any part of the path matches excluded directories
    $excluded = $false
    foreach ($part in $pathParts) {
        if ($excludeDirs -contains $part) {
            $excluded = $true
            break
        }
    }
    -not $excluded
} | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length + 1)
    $destPath = Join-Path $tempDir $relativePath
    
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $destPath -Force | Out-Null
    } else {
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item $_.FullName -Destination $destPath -Force
    }
}

# Create the zip file
$zipPath = Join-Path $sourceDir $zipName
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Done! Created: $zipPath" -ForegroundColor Green
Write-Host "Size: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB" -ForegroundColor Gray
