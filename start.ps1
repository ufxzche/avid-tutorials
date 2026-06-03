# AVID — Laravel server (PHP 8.2+)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backend = Join-Path $root "backend"

if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "PHP topilmadi. O'rnating: winget install PHP.PHP.8.2"
    exit 1
}

Set-Location $backend

if (-not (Test-Path "vendor")) {
    Write-Host "Composer install..."
    if (Get-Command composer -ErrorAction SilentlyContinue) {
        composer install --no-interaction
    } elseif (Test-Path (Join-Path $root "composer.phar")) {
        php (Join-Path $root "composer.phar") install --no-interaction
    } else {
        Write-Host "Composer topilmadi: https://getcomposer.org"
        exit 1
    }
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    php artisan key:generate --force
}

$db = Join-Path $backend "database\avid.db"
if (-not (Test-Path $db)) {
    Write-Host "Migratsiya va seed..."
    New-Item -ItemType File -Path $db -Force | Out-Null
    php artisan migrate:fresh --seed --force
}

Write-Host "AVID: http://127.0.0.1:3000"
Write-Host "Demo: demo@avid.uz / Demo1234!"
php artisan serve --host=127.0.0.1 --port=3000
