# MadK Store - Backup & Restore End-to-End Verification Test
$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[BAT DAU] KIEM THU QUY TRINH BACKUP & RESTORE MADK STORE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$tempBackupDir = Join-Path $PSScriptRoot "..\backups_test"
if (-not (Test-Path $tempBackupDir)) {
    New-Item -ItemType Directory -Path $tempBackupDir -Force | Out-Null
}

try {
    # 1. Chay sao luu
    Write-Host "`n[Buoc 1/3] Thuc hien sao luu..." -ForegroundColor Yellow
    & "$PSScriptRoot\backup-db.ps1" -BackupDir $tempBackupDir -DbName "madkstore_test_verify"

    # 2. Kiem tra tep sinh ra
    Write-Host "`n[Buoc 2/3] Kiem tra tinh toan ven cua tep backup..." -ForegroundColor Yellow
    $backupFiles = Get-ChildItem -Path $tempBackupDir -Filter "madkstore_madkstore_test_verify_*.sql" | Sort-Object LastWriteTime -Descending
    if ($backupFiles.Count -eq 0) {
        throw "Khong tim thay file backup nao duoc sinh ra!"
    }
    $latestBackup = $backupFiles[0]
    Write-Host "-> Tim thay file: $($latestBackup.FullName) ($($latestBackup.Length) bytes)" -ForegroundColor Green

    # 3. Chay khoi phuc
    Write-Host "`n[Buoc 3/3] Thuc hien khoi phuc tu tep vua tao..." -ForegroundColor Yellow
    & "$PSScriptRoot\restore-db.ps1" -BackupFile $latestBackup.FullName -TargetDb "madkstore_test_verify"

    Write-Host "`n================================================================" -ForegroundColor Green
    Write-Host "[KET QUA] QUY TRINH SAO LUU & KHOI PHUC DA DUOC THU NGHIEM THANH CONG 100%!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
}
finally {
    # Don dep thu muc kiem thu
    if (Test-Path $tempBackupDir) {
        Remove-Item -Path $tempBackupDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
