<#
.SYNOPSIS
    MadK Store - 1-Click Remote VPS Deployment Runner (Windows PowerShell)
.DESCRIPTION
    Tu dong ket noi SSH toi VPS, thiet lap moi truong Docker va trien khai website len Internet.
.EXAMPLE
    .\scripts\deploy-to-vps.ps1 -VpsIp "123.45.67.89" -Domain "madk.store" -Email "admin@madk.store"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    [Parameter(Mandatory=$true)]
    [string]$Email,
    [string]$Username = "root",
    [string]$SshKeyPath = ""
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[BAT DAU] TU DONG HOA TRIEN KHAI MADK STORE LEN VPS" -ForegroundColor Cyan
Write-Host "VPS IP   : $VpsIp" -ForegroundColor Cyan
Write-Host "Domain   : $Domain" -ForegroundColor Cyan
Write-Host "Email SSL: $Email" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Kiem tra ket noi SSH
$sshCmd = "ssh"
if ($SshKeyPath -and (Test-Path $SshKeyPath)) {
    $sshArgs = @("-i", $SshKeyPath, "-o", "StrictHostKeyChecking=no", "$Username@$VpsIp")
} else {
    $sshArgs = @("-o", "StrictHostKeyChecking=no", "$Username@$VpsIp")
}

Write-Host "`n[Buoc 1/3] Kiem tra ket noi SSH toi VPS..." -ForegroundColor Yellow
try {
    & $sshCmd @sshArgs "echo '[OK] SSH Connected'"
} catch {
    Write-Error "Khong the ket noi SSH toi VPS $VpsIp. Vui long kiem tra IP, Username va SSH Key!"
}

# Dong bo ma nguon va scripts len VPS
Write-Host "`n[Buoc 2/3] Chuan bi thu muc va dong bo scripts tren VPS..." -ForegroundColor Yellow
$remoteInitScript = @"
mkdir -p /opt/madk-store/scripts
"@
& $sshCmd @sshArgs $remoteInitScript

# Copy scripts len VPS bang scp
Write-Host "-> Dang truyen scripts len /opt/madk-store/scripts..." -ForegroundColor Yellow
$scpArgs = @("-o", "StrictHostKeyChecking=no", "-r", "$PSScriptRoot\setup-vps.sh", "$PSScriptRoot\deploy.sh", "$PSScriptRoot\backup-db.sh", "$Username@${VpsIp}:/opt/madk-store/scripts/")
& scp @scpArgs

# Thuc thi setup-vps.sh tren VPS
Write-Host "`n[Buoc 3/3] Dang kich hoat tien trinh cai dat tu dong tren VPS..." -ForegroundColor Yellow
$remoteExec = "chmod +x /opt/madk-store/scripts/*.sh && /opt/madk-store/scripts/setup-vps.sh --domain $Domain --email $Email"
& $sshCmd @sshArgs $remoteExec

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "[HOAN TAT] WEBSITE CUA BAN DA DUOC TRIEN KHAI THANH CONG LEN INTERNET!" -ForegroundColor Green
Write-Host "Dia chi truy cap: https://$Domain" -ForegroundColor Green
Write-Host "Trang kiem tra  : https://$Domain/health" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
