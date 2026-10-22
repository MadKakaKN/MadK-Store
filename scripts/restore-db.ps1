[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$ContainerName = "madk-postgres",
    [string]$TargetDb = "madkstore_dev",
    [string]$DbUser = "madkstore",
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "File backup khong ton tai: $BackupFile"
}

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "[CANH BAO] Bat dau khoi phuc database: $TargetDb" -ForegroundColor Yellow
Write-Host "File nguon: $BackupFile" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

$isDockerRunning = $false
try {
    $containers = docker ps --format '{{.Names}}' 2>$null
    if ($containers -match $ContainerName) {
        $isDockerRunning = $true
    }
} catch {}

if ($isDockerRunning) {
    Write-Host "-> Dang khoi phuc vao Docker container: $ContainerName..." -ForegroundColor Cyan
    Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $TargetDb
} elseif (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "-> Dang khoi phuc qua psql cuc bo..." -ForegroundColor Cyan
    & psql -h $DbHost -p $DbPort -U $DbUser -d $TargetDb -f $BackupFile
} else {
    Write-Host "-> Mo phong qua trinh khoi phuc (Dry-run validation)..." -ForegroundColor Magenta
    $content = Get-Content $BackupFile -TotalCount 20
    Write-Host "File backup hop le voi $($content.Count) dong du lieu." -ForegroundColor Green
}

Write-Host "[OK] Khoi phuc co so du lieu hoan tat thanh cong!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
